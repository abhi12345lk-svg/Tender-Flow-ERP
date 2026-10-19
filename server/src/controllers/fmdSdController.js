import path from 'path';
import fs from 'fs';
import { FmdSd } from '../models/FmdSd.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { getUploadsPath, deleteStoredFile } from '../services/fileStorageService.js';
import { generateFmdSdWordDocument } from '../services/documentTemplateService.js';

export const getFmdSdList = async (req, res, next) => {
  try {
    const { search, fmdStatus, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { tenderNumber: { $regex: search, $options: 'i' } },
        { tenderTitle: { $regex: search, $options: 'i' } },
        { contractorName: { $regex: search, $options: 'i' } },
        { workOrderNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (fmdStatus && fmdStatus !== 'ALL') {
      query.fmdStatus = fmdStatus;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await FmdSd.countDocuments(query);
    const data = await FmdSd.find(query)
      .populate('workOrder', 'workOrderNumber tenderNumber workOrderAmount')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, data, 'FMD / SD records retrieved successfully', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
};

export const getFmdSdById = async (req, res, next) => {
  try {
    const fmd = await FmdSd.findById(req.params.id).populate('workOrder');
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }
    return successResponse(res, fmd, 'FMD / SD record retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createFmdSd = async (req, res, next) => {
  try {
    let payload = { ...req.body };
    if (req.body.workOrder) {
      const wo = await WorkOrder.findById(req.body.workOrder);
      if (wo) {
        payload.workOrderNumber = wo.workOrderNumber;
        payload.tenderNumber = payload.tenderNumber || wo.tenderNumber;
        payload.contractorName = payload.contractorName || wo.contractorName;
      }
    }

    const fmd = await FmdSd.create(payload);
    return successResponse(res, fmd, 'FMD / SD record registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateFmdSd = async (req, res, next) => {
  try {
    const fmd = await FmdSd.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('workOrder', 'workOrderNumber tenderNumber');

    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    return successResponse(res, fmd, 'FMD / SD record updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteFmdSd = async (req, res, next) => {
  try {
    const fmd = await FmdSd.findById(req.params.id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    // Clean up stored files
    if (fmd.uploadedDocuments && fmd.uploadedDocuments.length > 0) {
      fmd.uploadedDocuments.forEach((doc) => {
        if (doc.storageUrl) {
          deleteStoredFile(doc.storageUrl);
        }
      });
    }

    await FmdSd.findByIdAndDelete(req.params.id);
    return successResponse(res, null, `FMD / SD record for ${fmd.tenderNumber} deleted successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle real multipart file upload
 */
export const uploadFileDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded or file was rejected by filter', 400, 'ValidationError');
    }

    const fmd = await FmdSd.findById(req.params.id);
    if (!fmd) {
      // Clean up orphaned upload
      deleteStoredFile(req.file.filename);
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    const newDoc = {
      name: req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(1)} KB`,
      type: req.file.mimetype,
      storageUrl: req.file.filename,
      path: req.file.filename,
      uploadedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    fmd.uploadedDocuments.push(newDoc);
    await fmd.save();

    return successResponse(res, fmd, `File "${req.file.originalname}" uploaded and registered to tender custody.`);
  } catch (err) {
    next(err);
  }
};

/**
 * Stream document for download
 */
export const downloadDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const fmd = await FmdSd.findById(id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    const doc = fmd.uploadedDocuments.id(docId);
    if (!doc) {
      return errorResponse(res, 'Document not found', 404, 'NotFound');
    }

    if (!doc.storageUrl) {
      return errorResponse(res, 'File was a sample record and has no physical storage file.', 404, 'FileNotFound');
    }

    const filePath = getUploadsPath(doc.storageUrl);
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'Physical file not found on server storage.', 404, 'FileNotFound');
    }

    return res.download(filePath, doc.name);
  } catch (err) {
    next(err);
  }
};

/**
 * Stream document for inline browser view
 */
export const viewDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const fmd = await FmdSd.findById(id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    const doc = fmd.uploadedDocuments.id(docId);
    if (!doc || !doc.storageUrl) {
      return errorResponse(res, 'Document physical file not found', 404, 'NotFound');
    }

    const filePath = getUploadsPath(doc.storageUrl);
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'Physical file missing from storage directory', 404, 'FileNotFound');
    }

    res.setHeader('Content-Type', doc.type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.name}"`);
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

/**
 * Generate Word (.doc) verification certificate
 */
export const downloadFmdSdDocx = async (req, res, next) => {
  try {
    const fmd = await FmdSd.findById(req.params.id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    const language = req.query.lang || fmd.language || 'en';
    const docBuffer = generateFmdSdWordDocument(fmd, language);
    const sanitizedFilename = `FMD_SD_${fmd.tenderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_Verification.doc`;

    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    return res.send(docBuffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete document metadata and remove file from disk
 */
export const deleteDocumentMetadata = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const fmd = await FmdSd.findById(id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    const doc = fmd.uploadedDocuments.id(docId);
    const fileStorageRef = doc?.storageUrl || doc?.path;
    if (fileStorageRef) {
      deleteStoredFile(fileStorageRef);
    }

    fmd.uploadedDocuments = fmd.uploadedDocuments.filter((d) => d._id.toString() !== docId);
    await fmd.save();

    return successResponse(res, fmd, 'Document deleted from custody storage');
  } catch (err) {
    next(err);
  }
};
