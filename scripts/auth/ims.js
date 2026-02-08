/**
 * Adobe IMS Authentication
 *
 * Handles OAuth flow with Adobe Identity Management System.
 */

import { CONFIG } from '../scripts.js';

/**
 * Initiates the IMS login flow
 */
export function initiateLogin() {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const state = generateState();

  // Store state for verification
  sessionStorage.setItem('ims_state', state);

  const params = new URLSearchParams({
    client_id: CONFIG.IMS_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: CONFIG.IMS_SCOPE,
    response_type: 'code',
    state,
  });

  window.location.href = `${CONFIG.IMS_AUTH_URL}?${params.toString()}`;
}

/**
 * Handles the OAuth callback
 */
export async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const storedState = sessionStorage.getItem('ims_state');

  // Verify state
  if (!state || state !== storedState) {
    throw new Error('Invalid state parameter');
  }

  sessionStorage.removeItem('ims_state');

  if (!code) {
    throw new Error('No authorization code received');
  }

  // Exchange code for session token via backend
  const response = await fetch(`${CONFIG.API_BASE_URL}/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imsAuthCode: code,
      redirectUri: `${window.location.origin}/auth/callback`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Authentication failed');
  }

  return response.json();
}

/**
 * Generates a random state parameter for OAuth
 */
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
