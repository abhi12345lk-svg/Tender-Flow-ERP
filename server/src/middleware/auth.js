import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. Please log in.', 401, 'Unauthorized');
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Session expired or invalid token. Please log in again.', 401, 'InvalidToken');
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return errorResponse(res, 'User account not found or has been deactivated.', 401, 'AccountInactive');
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 'Authentication verification error', 500, err.message);
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401, 'Unauthorized');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        403,
        'Forbidden'
      );
    }

    next();
  };
};
