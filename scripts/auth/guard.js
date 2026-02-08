/**
 * Route Guard
 *
 * Protects routes that require authentication.
 */

import { isAuthenticated, isEmployee } from './session.js';
import { initiateLogin } from './ims.js';

/**
 * Checks if current page requires auth and redirects if needed
 */
export function checkRouteAccess() {
  const path = window.location.pathname;

  // Portal routes require authentication
  if (path.startsWith('/portal')) {
    if (!isAuthenticated()) {
      // Store intended destination
      sessionStorage.setItem('redirect_after_login', path);
      initiateLogin();
      return false;
    }
  }

  // Employee routes require employee status
  if (path.startsWith('/employee')) {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirect_after_login', path);
      initiateLogin();
      return false;
    }

    if (!isEmployee()) {
      window.location.href = '/portal';
      return false;
    }
  }

  return true;
}

/**
 * Gets the redirect URL after login (if any)
 */
export function getRedirectAfterLogin() {
  const redirect = sessionStorage.getItem('redirect_after_login');
  sessionStorage.removeItem('redirect_after_login');
  return redirect || '/portal';
}
