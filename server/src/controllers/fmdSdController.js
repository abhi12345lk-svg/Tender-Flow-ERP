import { FmdSd } from '../models/FmdSd.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

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
    const fmd = await FmdSd.findByIdAndDelete(req.params.id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }
    return successResponse(res, null, `FMD / SD record for ${fmd.tenderNumber} deleted successfully`);
  } catch (err) {
    next(err);
  }
};

/**
 * Upload document metadata reference (safely stores file descriptor, not raw large base64 bloat)
 */
export const addDocumentMetadata = async (req, res, next) => {
  try {
    const { name, size, type, storageUrl } = req.body;
    if (!name) {
      return errorResponse(res, 'File name is required', 400, 'ValidationError');
    }

    const fmd = await FmdSd.findById(req.params.id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    const newDoc = {
      name,
      size: size || 'Unknown',
      type: type || 'application/pdf',
      uploadedAt: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      storageUrl: storageUrl || '',
    };

    fmd.uploadedDocuments.push(newDoc);
    await fmd.save();

    return successResponse(res, fmd, 'Document metadata registered successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteDocumentMetadata = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const fmd = await FmdSd.findById(id);
    if (!fmd) {
      return errorResponse(res, 'FMD / SD record not found', 404, 'NotFound');
    }

    fmd.uploadedDocuments = fmd.uploadedDocuments.filter((d) => d._id.toString() !== docId);
    await fmd.save();

    return successResponse(res, fmd, 'Document reference removed successfully');
  } catch (err) {
    next(err);
  }
};
