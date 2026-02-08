/**
 * Auth Callback Action
 *
 * POST /auth/callback
 * Handles IMS OAuth callback and creates session.
 */

import { getDb } from '../../lib/db.js';
import { createSessionToken } from '../../lib/jwt.js';
import { successResponse, errorResponse } from '../../lib/middleware.js';

const IMS_TOKEN_URL = process.env.IMS_TOKEN_URL;
const IMS_CLIENT_ID = process.env.IMS_CLIENT_ID;
const IMS_CLIENT_SECRET = process.env.IMS_CLIENT_SECRET;
const ADOBE_ORG_ID = process.env.ADOBE_ORG_ID;

export async function main(params) {
  try {
    const { imsAuthCode, redirectUri } = params;

    if (!imsAuthCode || !redirectUri) {
      return errorResponse('INVALID_REQUEST', 'Missing imsAuthCode or redirectUri', 400);
    }

    // Exchange auth code for IMS token
    const imsToken = await exchangeCodeForToken(imsAuthCode, redirectUri);

    if (!imsToken) {
      return errorResponse('INVALID_AUTH_CODE', 'Failed to exchange authorization code', 401);
    }

    // Get user profile from IMS
    const profile = await getImsProfile(imsToken.access_token);

    if (!profile) {
      return errorResponse('PROFILE_ERROR', 'Failed to get user profile', 500);
    }

    // Find or create user
    const db = getDb();

    // Find company by email domain
    const emailDomain = profile.email.split('@')[1];
    let company = await db.company.findUnique({
      where: { domain: emailDomain },
    });

    if (!company) {
      // Create company if not exists (for Summit registrants)
      company = await db.company.create({
        data: {
          name: emailDomain.split('.')[0], // Placeholder name
          domain: emailDomain,
          industry: 'Unknown',
          portalSlug: emailDomain.replace(/\./g, '-'),
        },
      });
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { imsId: profile.userId },
    });

    if (user) {
      // Update last login
      user = await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        include: { company: true },
      });
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          imsId: profile.userId,
          imsOrgId: profile.orgId || '',
          email: profile.email,
          firstName: profile.first_name || profile.email.split('@')[0],
          lastName: profile.last_name || '',
          role: 'practitioner', // Default role, will be updated from registration data
          companyId: company.id,
          lastLoginAt: new Date(),
        },
        include: { company: true },
      });
    }

    // Create session token
    const session = createSessionToken(user);

    // Track login activity
    await db.activity.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        type: 'login',
        metadata: {},
        source: 'portal',
      },
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        selectedRole: user.selectedRole,
        imsOrgId: user.imsOrgId,
      },
      company: user.company,
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return errorResponse('INTERNAL_ERROR', 'Authentication failed', 500);
  }
}

async function exchangeCodeForToken(code, redirectUri) {
  // TODO: Implement IMS token exchange
  // This is a placeholder - implement actual IMS OAuth flow

  const response = await fetch(IMS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: IMS_CLIENT_ID,
      client_secret: IMS_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function getImsProfile(accessToken) {
  // TODO: Implement IMS profile fetch
  // This is a placeholder - implement actual IMS profile API call

  const response = await fetch('https://ims-na1.adobelogin.com/ims/profile/v1', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
