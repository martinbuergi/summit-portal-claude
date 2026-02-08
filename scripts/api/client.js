/**
 * API Client
 *
 * HTTP client for Adobe I/O Runtime actions.
 */

import { CONFIG } from '../scripts.js';
import { getSessionToken, refreshSession, clearSession } from '../auth/session.js';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Makes an authenticated request
   */
  async request(method, path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const token = getSessionToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add content-type for JSON body
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body instanceof FormData
        ? options.body
        : options.body ? JSON.stringify(options.body) : undefined,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && token) {
      try {
        await refreshSession();
        // Retry request with new token
        return this.request(method, path, options);
      } catch {
        clearSession();
        window.location.href = '/';
        throw new Error('Session expired');
      }
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = new Error(data.error?.message || 'Request failed');
      error.code = data.error?.code;
      error.status = response.status;
      throw error;
    }

    return data.data;
  }

  /**
   * GET request
   */
  get(path, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${path}?${queryString}` : path;
    return this.request('GET', url);
  }

  /**
   * POST request
   */
  post(path, body) {
    return this.request('POST', path, { body });
  }

  /**
   * PATCH request
   */
  patch(path, body) {
    return this.request('PATCH', path, { body });
  }

  /**
   * PUT request
   */
  put(path, body) {
    return this.request('PUT', path, { body });
  }

  /**
   * DELETE request
   */
  delete(path) {
    return this.request('DELETE', path);
  }

  /**
   * Upload file via FormData
   */
  upload(path, formData) {
    return this.request('POST', path, { body: formData });
  }
}

export const apiClient = new ApiClient(CONFIG.API_BASE_URL);
