import { WorkOrder } from '../models/WorkOrder.js';
import { Billing } from '../models/Billing.js';
import { Agreement } from '../models/Agreement.js';
import { FmdSd } from '../models/FmdSd.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getWorkOrders = async (req, res, next) => {
  try {
    const {
      search,
      status,
      financialYear,
      subdivision,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { workOrderNumber: { $regex: search, $options: 'i' } },
        { tenderNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { contractorName: { $regex: search, $options: 'i' } },
        { td: { $regex: search, $options: 'i' } },
        { estimateNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (financialYear && financialYear !== 'ALL') {
      query.financialYear = financialYear;
    }
    if (subdivision && subdivision !== 'ALL') {
      query.subdivision = subdivision;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await WorkOrder.countDocuments(query);
    const data = await WorkOrder.find(query)
      .populate('subdivision', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, data, 'Work orders retrieved successfully', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkOrderById = async (req, res, next) => {
  try {
    const wo = await WorkOrder.findById(req.params.id).populate('subdivision', 'name code inCharge');
    if (!wo) {
      return errorResponse(res, 'Work Order record not found', 404, 'NotFound');
    }

    // Retrieve all related government records for complete detail view
    const [agreements, billingRecords, fmdRecords] = await Promise.all([
      Agreement.find({ workOrder: wo._id }).select('agreementNumber templateType agreementDate status stampDutyAmount'),
      Billing.find({ workOrder: wo._id }).select('invoiceNumber invoiceDate amount gstAmount totalAmount totalDeductions netPayable status'),
      FmdSd.find({ workOrder: wo._id }).select('tenderNumber fmdStatus sdAmount emdAmount instrumentType bankName validityDate'),
    ]);

    const totalBilled = billingRecords.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalNetDisbursed = billingRecords.reduce((acc, b) => acc + (b.netPayable || 0), 0);
    const summaryData = {
      totalWorkOrderAmount: wo.workOrderAmount,
      totalBilled,
      totalNetDisbursed,
      remainingAmount: Math.max(0, wo.workOrderAmount - totalBilled),
      billingProgressPercent: wo.workOrderAmount > 0 ? Math.min(100, Math.round((totalBilled / wo.workOrderAmount) * 100)) : 0,
      agreementsCount: agreements.length,
      billingRecordsCount: billingRecords.length,
      fmdRecordsCount: fmdRecords.length,
    };

    return successResponse(
      res,
      {
        ...wo.toObject(),
        agreements,
        billingRecords,
        fmdRecords,
        summary: summaryData,
        related: {
          agreements,
          billingRecords,
          fmdRecords,
          summary: summaryData,
        },
      },
      'Work Order retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const createWorkOrder = async (req, res, next) => {
  try {
    const existing = await WorkOrder.findOne({ workOrderNumber: req.body.workOrderNumber });
    if (existing) {
      return errorResponse(
        res,
        `Work Order Number "${req.body.workOrderNumber}" already exists in the system.`,
        409,
        'DuplicateWorkOrderNumber'
      );
    }

    const wo = await WorkOrder.create(req.body);
    return successResponse(res, wo, 'Work Order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateWorkOrder = async (req, res, next) => {
  try {
    if (req.body.workOrderNumber) {
      const existing = await WorkOrder.findOne({
        workOrderNumber: req.body.workOrderNumber,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return errorResponse(
          res,
          `Work Order Number "${req.body.workOrderNumber}" is already in use by another record.`,
          409,
          'DuplicateWorkOrderNumber'
        );
      }
    }

    const wo = await WorkOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('subdivision', 'name code');

    if (!wo) {
      return errorResponse(res, 'Work Order record not found', 404, 'NotFound');
    }

    return successResponse(res, wo, 'Work Order updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteWorkOrder = async (req, res, next) => {
  try {
    const wo = await WorkOrder.findById(req.params.id);
    if (!wo) {
      return errorResponse(res, 'Work Order record not found', 404, 'NotFound');
    }

    // Check if associated billing records exist
    const associatedBills = await Billing.countDocuments({ workOrder: wo._id });
    if (associatedBills > 0) {
      return errorResponse(
        res,
        `Cannot delete: ${associatedBills} Billing record(s) are bound to this Work Order.`,
        400,
        'HasAssociatedBilling'
      );
    }

    // Check if associated agreement exists
    const associatedAgr = await Agreement.countDocuments({ workOrder: wo._id });
    if (associatedAgr > 0) {
      return errorResponse(
        res,
        `Cannot delete: A legal Agreement is bound to this Work Order.`,
        400,
        'HasAssociatedAgreement'
      );
    }

    await WorkOrder.findByIdAndDelete(req.params.id);
    return successResponse(res, null, `Work Order ${wo.workOrderNumber} deleted successfully`);
  } catch (err) {
    next(err);
  }
};
