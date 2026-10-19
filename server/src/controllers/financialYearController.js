import { FinancialYear } from '../models/FinancialYear.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getFinancialYears = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50, sort = '-label' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { label: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await FinancialYear.countDocuments(query);
    const data = await FinancialYear.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    return successResponse(res, data, 'Financial years retrieved successfully', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
};

export const getFinancialYearById = async (req, res, next) => {
  try {
    const fy = await FinancialYear.findById(req.params.id);
    if (!fy) {
      return errorResponse(res, 'Financial Year record not found', 404, 'NotFound');
    }
    return successResponse(res, fy, 'Financial Year retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const createFinancialYear = async (req, res, next) => {
  try {
    // If setting as current, unset previous current
    if (req.body.isCurrent) {
      await FinancialYear.updateMany({}, { isCurrent: false });
    }

    const fy = await FinancialYear.create(req.body);
    return successResponse(res, fy, 'Financial Year created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateFinancialYear = async (req, res, next) => {
  try {
    if (req.body.isCurrent) {
      await FinancialYear.updateMany({ _id: { $ne: req.params.id } }, { isCurrent: false });
    }

    const fy = await FinancialYear.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!fy) {
      return errorResponse(res, 'Financial Year record not found', 404, 'NotFound');
    }

    return successResponse(res, fy, 'Financial Year updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteFinancialYear = async (req, res, next) => {
  try {
    const fy = await FinancialYear.findById(req.params.id);
    if (!fy) {
      return errorResponse(res, 'Financial Year record not found', 404, 'NotFound');
    }

    if (fy.isCurrent) {
      return errorResponse(res, 'Cannot delete the currently active Financial Year', 400, 'ActiveFYCannotBeDeleted');
    }

    // Check if work orders exist for this FY
    const associatedWoCount = await WorkOrder.countDocuments({ financialYear: fy.label });
    if (associatedWoCount > 0) {
      return errorResponse(
        res,
        `Cannot delete: ${associatedWoCount} Work Order(s) are associated with FY ${fy.label}`,
        400,
        'HasAssociatedRecords'
      );
    }

    await FinancialYear.findByIdAndDelete(req.params.id);
    return successResponse(res, null, `Financial Year ${fy.label} deleted successfully`);
  } catch (err) {
    next(err);
  }
};

export const setActiveFinancialYear = async (req, res, next) => {
  try {
    const fy = await FinancialYear.findById(req.params.id);
    if (!fy) {
      return errorResponse(res, 'Financial Year not found', 404, 'NotFound');
    }

    await FinancialYear.updateMany({}, { isCurrent: false });
    fy.isCurrent = true;
    fy.status = 'Active';
    await fy.save();

    return successResponse(res, fy, `FY ${fy.label} set as active financial year`);
  } catch (err) {
    next(err);
  }
};
