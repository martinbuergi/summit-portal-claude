/**
 * JWT Session Management
 *
 * Handles session token creation and validation.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10);

/**
 * Creates a session token for a user
 */
export function createSessionToken(user) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS);

  const token = jwt.sign(
    {
      userId: user.id,
      imsId: user.imsId,
      companyId: user.companyId,
      isEmployee: user.imsOrgId === process.env.ADOBE_ORG_ID,
    },
    JWT_SECRET,
    { expiresIn: `${SESSION_EXPIRY_HOURS}h` }
  );

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Validates a session token
 */
export function validateSessionToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Extracts token from Authorization header
 */
export function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
