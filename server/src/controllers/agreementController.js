import { Agreement } from '../models/Agreement.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getAgreements = async (req, res, next) => {
  try {
    const {
      search,
      templateType,
      status,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { agreementNumber: { $regex: search, $options: 'i' } },
        { workOrderNumber: { $regex: search, $options: 'i' } },
        { contractorName: { $regex: search, $options: 'i' } },
        { templateType: { $regex: search, $options: 'i' } },
        { documentTitle: { $regex: search, $options: 'i' } },
      ];
    }

    if (templateType && templateType !== 'ALL') {
      query.templateType = templateType;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Agreement.countDocuments(query);
    const data = await Agreement.find(query)
      .populate('workOrder', 'workOrderNumber tenderNumber workOrderAmount status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, data, 'Agreements retrieved successfully', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
};

export const getAgreementById = async (req, res, next) => {
  try {
    const agreement = await Agreement.findById(req.params.id).populate('workOrder');
    if (!agreement) {
      return errorResponse(res, 'Agreement record not found', 404, 'NotFound');
    }
    return successResponse(res, agreement, 'Agreement retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createAgreement = async (req, res, next) => {
  try {
    const existing = await Agreement.findOne({ agreementNumber: req.body.agreementNumber });
    if (existing) {
      return errorResponse(
        res,
        `Agreement Number "${req.body.agreementNumber}" already exists.`,
        409,
        'DuplicateAgreementNumber'
      );
    }

    // Verify related work order exists
    const wo = await WorkOrder.findById(req.body.workOrder);
    if (!wo) {
      return errorResponse(res, 'Specified Work Order does not exist.', 400, 'InvalidWorkOrder');
    }

    // Auto-fill work order number, tender number and contractor if missing
    const payload = {
      ...req.body,
      workOrderNumber: req.body.workOrderNumber || wo.workOrderNumber,
      tenderNumber: req.body.tenderNumber || wo.tenderNumber,
      contractorName: req.body.contractorName || wo.contractorName,
    };

    const agreement = await Agreement.create(payload);
    return successResponse(res, agreement, 'Agreement created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateAgreement = async (req, res, next) => {
  try {
    if (req.body.agreementNumber) {
      const existing = await Agreement.findOne({
        agreementNumber: req.body.agreementNumber,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return errorResponse(
          res,
          `Agreement Number "${req.body.agreementNumber}" is already in use by another record.`,
          409,
          'DuplicateAgreementNumber'
        );
      }
    }

    const agreement = await Agreement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('workOrder', 'workOrderNumber tenderNumber');

    if (!agreement) {
      return errorResponse(res, 'Agreement record not found', 404, 'NotFound');
    }

    return successResponse(res, agreement, 'Agreement updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteAgreement = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByIdAndDelete(req.params.id);
    if (!agreement) {
      return errorResponse(res, 'Agreement record not found', 404, 'NotFound');
    }
    return successResponse(res, null, `Agreement ${agreement.agreementNumber} deleted successfully`);
  } catch (err) {
    next(err);
  }
};
