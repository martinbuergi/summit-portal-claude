/**
 * Request Middleware
 *
 * Common middleware for authentication and authorization.
 */

import { extractToken, validateSessionToken } from './jwt.js';
import { getDb } from './db.js';

/**
 * Authenticates request and attaches user to context
 */
export async function authenticate(params, headers) {
  const authHeader = headers.authorization || headers.Authorization;
  const token = extractToken(authHeader);

  if (!token) {
    return {
      authenticated: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    };
  }

  const validation = validateSessionToken(token);

  if (!validation.valid) {
    return {
      authenticated: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    };
  }

  // Get user from database
  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: validation.payload.userId },
    include: { company: true },
  });

  if (!user) {
    return {
      authenticated: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    };
  }

  return {
    authenticated: true,
    user,
    company: user.company,
    isEmployee: validation.payload.isEmployee,
  };
}

/**
 * Requires employee access
 */
export function requireEmployee(auth) {
  if (!auth.isEmployee) {
    return {
      authorized: false,
      error: {
        code: 'EMPLOYEE_REQUIRED',
        message: 'This action requires employee access',
      },
    };
  }
  return { authorized: true };
}

/**
 * Standard error response
 */
export function errorResponse(code, message, status = 400) {
  return {
    statusCode: status,
    body: {
      success: false,
      error: { code, message },
    },
  };
}

/**
 * Standard success response
 */
export function successResponse(data, status = 200) {
  return {
    statusCode: status,
    body: {
      success: true,
      data,
    },
  };
}
