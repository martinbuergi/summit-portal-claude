/**
 * MCP Push Activity Action
 *
 * POST /mcp/activities
 * Allows external systems to push activities via MCP.
 */

import { getDb } from '../../lib/db.js';
import { successResponse, errorResponse } from '../../lib/middleware.js';

export async function main(params) {
  try {
    const headers = params.__ow_headers || {};
    const apiKey = headers['x-mcp-api-key'] || headers['X-MCP-API-Key'];

    // Validate API key
    if (!apiKey) {
      return errorResponse('MISSING_API_KEY', 'X-MCP-API-Key header is required', 401);
    }

    const db = getDb();

    // Find and validate API key
    const keyRecord = await db.apiKey.findUnique({
      where: { key: apiKey }, // In production, hash the key
    });

    if (!keyRecord || !keyRecord.isActive) {
      return errorResponse('INVALID_API_KEY', 'The API key is invalid or revoked', 401);
    }

    // Check permissions
    if (!keyRecord.permissions.includes('mcp:activities')) {
      return errorResponse('FORBIDDEN', 'API key does not have permission for this action', 403);
    }

    // TODO: Implement rate limiting
    // Check keyRecord.rateLimit against recent request count

    const { userId, userEmail, companyId, companyDomain, type, metadata, timestamp } = params;

    if (!type) {
      return errorResponse('INVALID_REQUEST', 'Activity type is required', 400);
    }

    // Resolve user
    let resolvedUserId = userId;
    let resolvedCompanyId = companyId;

    if (!resolvedUserId && userEmail) {
      const user = await db.user.findUnique({ where: { email: userEmail } });
      if (user) {
        resolvedUserId = user.id;
        resolvedCompanyId = resolvedCompanyId || user.companyId;
      }
    }

    if (!resolvedCompanyId && companyDomain) {
      const company = await db.company.findUnique({ where: { domain: companyDomain } });
      if (company) {
        resolvedCompanyId = company.id;
      }
    }

    if (!resolvedCompanyId) {
      return errorResponse('COMPANY_NOT_FOUND', 'Could not resolve company', 400);
    }

    // Create activity
    const activity = await db.activity.create({
      data: {
        userId: resolvedUserId || null,
        companyId: resolvedCompanyId,
        type,
        metadata: metadata || {},
        source: 'mcp',
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    // Update API key last used
    await db.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return successResponse({ activity }, 201);
  } catch (error) {
    console.error('MCP push activity error:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to push activity', 500);
  }
}
