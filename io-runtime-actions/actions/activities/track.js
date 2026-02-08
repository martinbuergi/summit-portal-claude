/**
 * Track Activity Action
 *
 * POST /activities
 * Records a user activity.
 */

import { getDb } from '../../lib/db.js';
import { authenticate, successResponse, errorResponse } from '../../lib/middleware.js';

export async function main(params) {
  try {
    // Authenticate request
    const auth = await authenticate(params, params.__ow_headers || {});
    if (!auth.authenticated) {
      return errorResponse(auth.error.code, auth.error.message, 401);
    }

    const { type, metadata } = params;

    if (!type) {
      return errorResponse('INVALID_REQUEST', 'Activity type is required', 400);
    }

    const db = getDb();

    const activity = await db.activity.create({
      data: {
        userId: auth.user.id,
        companyId: auth.user.companyId,
        type,
        metadata: metadata || {},
        source: 'portal',
      },
    });

    return successResponse({ activity }, 201);
  } catch (error) {
    console.error('Track activity error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to track activity', 500);
  }
}
