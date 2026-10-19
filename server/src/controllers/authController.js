import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password credentials', 401, 'InvalidCredentials');
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated. Contact divisional administrator.', 403, 'AccountDisabled');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password credentials', 401, 'InvalidCredentials');
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const userSafe = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    return successResponse(res, { user: userSafe, token }, 'Authentication successful');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, { user: req.user }, 'User session details');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: config.env === 'production' ? 'strict' : 'lax',
    });
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Initial Administrator Setup (Allowed only if zero users exist in the system)
 */
export const setupInitialAdmin = async (req, res, next) => {
  try {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      return errorResponse(
        res,
        'System is already initialized with an administrator. Public registration is restricted.',
        403,
        'AdminAlreadyConfigured'
      );
    }

    const { name, email, password, role, department } = req.body;
    const admin = await User.create({
      name,
      email,
      password,
      role: role || 'Admin',
      department: department || 'Public Works Department',
    });

    const token = signToken({
      id: admin._id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    return successResponse(
      res,
      {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          department: admin.department,
        },
        token,
      },
      'Initial administrator configured successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};
