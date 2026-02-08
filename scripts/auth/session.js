/**
 * Session Management
 *
 * Handles user session state and token management.
 */

import { CONFIG } from '../scripts.js';

const SESSION_KEY = 'summit_session';

let currentUser = null;
let currentCompany = null;
let sessionToken = null;

/**
 * Initializes authentication state from stored session
 */
export async function initAuth() {
  const stored = localStorage.getItem(SESSION_KEY);

  if (!stored) {
    return false;
  }

  try {
    const session = JSON.parse(stored);

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await refreshSession();
      return isAuthenticated();
    }

    sessionToken = session.sessionToken;
    currentUser = session.user;
    currentCompany = session.company;

    return true;
  } catch (error) {
    console.error('Failed to restore session:', error);
    clearSession();
    return false;
  }
}

/**
 * Stores session data after successful login
 */
export function setSession(data) {
  sessionToken = data.sessionToken;
  currentUser = data.user;
  currentCompany = data.company;

  localStorage.setItem(SESSION_KEY, JSON.stringify({
    sessionToken: data.sessionToken,
    expiresAt: data.expiresAt,
    user: data.user,
    company: data.company,
  }));
}

/**
 * Clears the current session
 */
export function clearSession() {
  sessionToken = null;
  currentUser = null;
  currentCompany = null;
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Refreshes the session token
 */
export async function refreshSession() {
  if (!sessionToken) {
    throw new Error('No session to refresh');
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const data = await response.json();

    // Update stored session with new token
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY));
    stored.sessionToken = data.data.sessionToken;
    stored.expiresAt = data.data.expiresAt;
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));

    sessionToken = data.data.sessionToken;
  } catch (error) {
    clearSession();
    throw error;
  }
}

/**
 * Logs out the current user
 */
export async function logout() {
  if (sessionToken) {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }

  clearSession();
  window.location.href = '/';
}

/**
 * Returns whether the user is authenticated
 */
export function isAuthenticated() {
  return !!sessionToken && !!currentUser;
}

/**
 * Returns whether the user is an Adobe employee
 */
export function isEmployee() {
  return currentUser?.imsOrgId === CONFIG.ADOBE_ORG_ID;
}

/**
 * Returns the current user
 */
export function getUser() {
  return currentUser;
}

/**
 * Returns the current company
 */
export function getCompany() {
  return currentCompany;
}

/**
 * Returns the session token for API calls
 */
export function getSessionToken() {
  return sessionToken;
}

/**
 * Returns the user's effective role (selected or detected)
 */
export function getEffectiveRole() {
  return currentUser?.selectedRole || currentUser?.role;
}

/**
 * Updates the user's selected role locally
 */
export function updateSelectedRole(role) {
  if (currentUser) {
    currentUser.selectedRole = role;
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY));
    stored.user.selectedRole = role;
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  }
}
