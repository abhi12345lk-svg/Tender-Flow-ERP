import { Subdivision } from '../models/Subdivision.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { Billing } from '../models/Billing.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getSubdivisions = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50, sort = 'name' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { inCharge: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Subdivision.countDocuments(query);
    const subdivisions = await Subdivision.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Attach counts of associated work orders and bills
    const enriched = await Promise.all(
      subdivisions.map(async (sub) => {
        const [woCount, billCount] = await Promise.all([
          WorkOrder.countDocuments({ subdivision: sub._id }),
          Billing.countDocuments({ subdivision: sub._id }),
        ]);
        return {
          ...sub.toObject(),
          workOrderCount: woCount,
          billingCount: billCount,
        };
      })
    );

    return successResponse(res, enriched, 'Subdivisions retrieved successfully', 200, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
};

export const getSubdivisionById = async (req, res, next) => {
  try {
    const sub = await Subdivision.findById(req.params.id);
    if (!sub) {
      return errorResponse(res, 'Subdivision record not found', 404, 'NotFound');
    }

    const [workOrders, billingRecords] = await Promise.all([
      WorkOrder.find({ subdivision: sub._id }).select('workOrderNumber title workOrderAmount status'),
      Billing.find({ subdivision: sub._id }).select('invoiceNumber totalAmount status'),
    ]);

    return successResponse(
      res,
      {
        ...sub.toObject(),
        workOrders,
        billingRecords,
      },
      'Subdivision retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const createSubdivision = async (req, res, next) => {
  try {
    const existing = await Subdivision.findOne({ name: req.body.name });
    if (existing) {
      return errorResponse(
        res,
        `Subdivision "${req.body.name}" already exists.`,
        409,
        'DuplicateSubdivision'
      );
    }

    const sub = await Subdivision.create(req.body);
    return successResponse(res, sub, 'Subdivision created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateSubdivision = async (req, res, next) => {
  try {
    if (req.body.name) {
      const existing = await Subdivision.findOne({
        name: req.body.name,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return errorResponse(
          res,
          `Subdivision name "${req.body.name}" is already taken.`,
          409,
          'DuplicateSubdivision'
        );
      }
    }

    const sub = await Subdivision.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!sub) {
      return errorResponse(res, 'Subdivision record not found', 404, 'NotFound');
    }

    return successResponse(res, sub, 'Subdivision updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteSubdivision = async (req, res, next) => {
  try {
    const sub = await Subdivision.findById(req.params.id);
    if (!sub) {
      return errorResponse(res, 'Subdivision record not found', 404, 'NotFound');
    }

    // Safety check: verify no work orders are bound
    const woCount = await WorkOrder.countDocuments({ subdivision: sub._id });
    if (woCount > 0) {
      return errorResponse(
        res,
        `Cannot delete: ${woCount} Work Order(s) are associated with this subdivision.`,
        400,
        'HasAssociatedWorkOrders'
      );
    }

    await Subdivision.findByIdAndDelete(req.params.id);
    return successResponse(res, null, `Subdivision ${sub.name} deleted successfully`);
  } catch (err) {
    next(err);
  }
};
