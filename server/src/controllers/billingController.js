import { Billing } from '../models/Billing.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getBillingList = async (req, res, next) => {
  try {
    const {
      search,
      status,
      subdivision,
      financialYear,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { workOrderNumber: { $regex: search, $options: 'i' } },
        { contractorName: { $regex: search, $options: 'i' } },
        { tenderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (subdivision && subdivision !== 'ALL') {
      query.subdivision = subdivision;
    }
    if (financialYear && financialYear !== 'ALL') {
      query.financialYear = financialYear;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Billing.countDocuments(query);
    const data = await Billing.find(query)
      .populate('workOrder', 'workOrderNumber tenderNumber workOrderAmount')
      .populate('subdivision', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Summary aggregates
    const summary = await Billing.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGrossAmount: { $sum: '$totalAmount' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNetPayable: { $sum: '$netPayable' },
        },
      },
    ]);

    const aggregateMeta = summary[0] || {
      totalGrossAmount: 0,
      totalDeductions: 0,
      totalNetPayable: 0,
    };

    return successResponse(res, data, 'Billing records retrieved successfully', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      summary: aggregateMeta,
    });
  } catch (err) {
    next(err);
  }
};

export const getBillingById = async (req, res, next) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('workOrder')
      .populate('subdivision');

    if (!bill) {
      return errorResponse(res, 'Billing record not found', 404, 'NotFound');
    }
    return successResponse(res, bill, 'Billing record retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createBilling = async (req, res, next) => {
  try {
    const existing = await Billing.findOne({ invoiceNumber: req.body.invoiceNumber });
    if (existing) {
      return errorResponse(
        res,
        `Invoice Number "${req.body.invoiceNumber}" already exists.`,
        409,
        'DuplicateInvoiceNumber'
      );
    }

    // Verify related work order exists
    const wo = await WorkOrder.findById(req.body.workOrder);
    if (!wo) {
      return errorResponse(res, 'Specified Work Order does not exist.', 400, 'InvalidWorkOrder');
    }

    // Compute or verify GST and Net calculations
    const baseAmt = Number(req.body.amount) || 0;
    const gstRate = req.body.gstRate !== undefined ? Number(req.body.gstRate) : 18;
    const gstAmount = (baseAmt * gstRate) / 100;
    const totalAmount = baseAmt + gstAmount;

    const deductions = req.body.deductions || {};
    const totalDeductions =
      (Number(deductions.sdAmount) || 0) +
      (Number(deductions.tdsAmount) || 0) +
      (Number(deductions.labourCess) || 0) +
      (Number(deductions.royalty) || 0) +
      (Number(deductions.penalty) || 0);

    const netPayable = Math.max(0, totalAmount - totalDeductions);

    const payload = {
      ...req.body,
      workOrderNumber: req.body.workOrderNumber || wo.workOrderNumber,
      tenderNumber: req.body.tenderNumber || wo.tenderNumber,
      contractorName: req.body.contractorName || wo.contractorName,
      subdivision: req.body.subdivision || wo.subdivision,
      subdivisionName: req.body.subdivisionName || wo.subdivisionName,
      financialYear: req.body.financialYear || wo.financialYear,
      amount: baseAmt,
      gstRate,
      gstAmount,
      totalAmount,
      totalDeductions,
      netPayable,
    };

    const bill = await Billing.create(payload);
    return successResponse(res, bill, 'Billing voucher recorded successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateBilling = async (req, res, next) => {
  try {
    if (req.body.invoiceNumber) {
      const existing = await Billing.findOne({
        invoiceNumber: req.body.invoiceNumber,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return errorResponse(
          res,
          `Invoice Number "${req.body.invoiceNumber}" is already in use by another voucher.`,
          409,
          'DuplicateInvoiceNumber'
        );
      }
    }

    // Recompute financials if amounts changed
    let payload = { ...req.body };
    if (req.body.amount !== undefined || req.body.gstRate !== undefined || req.body.deductions) {
      const current = await Billing.findById(req.params.id);
      if (!current) {
        return errorResponse(res, 'Billing record not found', 404, 'NotFound');
      }

      const baseAmt = req.body.amount !== undefined ? Number(req.body.amount) : current.amount;
      const gstRate = req.body.gstRate !== undefined ? Number(req.body.gstRate) : current.gstRate;
      const gstAmount = (baseAmt * gstRate) / 100;
      const totalAmount = baseAmt + gstAmount;

      const deductions = req.body.deductions || current.deductions || {};
      const totalDeductions =
        (Number(deductions.sdAmount) || 0) +
        (Number(deductions.tdsAmount) || 0) +
        (Number(deductions.labourCess) || 0) +
        (Number(deductions.royalty) || 0) +
        (Number(deductions.penalty) || 0);

      const netPayable = Math.max(0, totalAmount - totalDeductions);

      payload = {
        ...payload,
        amount: baseAmt,
        gstRate,
        gstAmount,
        totalAmount,
        totalDeductions,
        netPayable,
      };
    }

    const bill = await Billing.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })
      .populate('workOrder', 'workOrderNumber tenderNumber')
      .populate('subdivision', 'name code');

    if (!bill) {
      return errorResponse(res, 'Billing record not found', 404, 'NotFound');
    }

    return successResponse(res, bill, 'Billing voucher updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteBilling = async (req, res, next) => {
  try {
    const bill = await Billing.findByIdAndDelete(req.params.id);
    if (!bill) {
      return errorResponse(res, 'Billing record not found', 404, 'NotFound');
    }
    return successResponse(res, null, `Invoice ${bill.invoiceNumber} deleted successfully`);
  } catch (err) {
    next(err);
  }
};
