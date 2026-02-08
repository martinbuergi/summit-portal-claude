/**
 * Activity Tracking
 *
 * Tracks user interactions for the activity feed.
 */

import { apiClient } from '../api/client.js';
import { isAuthenticated } from '../auth/session.js';
import { getQueue, addToQueue, processQueue } from './queue.js';

let initialized = false;

/**
 * Initializes the tracking module
 */
export function initTracking() {
  if (initialized || !isAuthenticated()) return;

  // Track page view
  trackPageView();

  // Set up click tracking on document links
  document.addEventListener('click', handleClick);

  // Process any queued activities
  processQueue();

  // Set up online listener to process queue when connection returns
  window.addEventListener('online', processQueue);

  initialized = true;
}

/**
 * Tracks a page view
 */
export function trackPageView() {
  track('page_view', {
    url: window.location.href,
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
  });
}

/**
 * Handles click events for tracking
 */
function handleClick(event) {
  const target = event.target.closest('a, button, [data-track]');
  if (!target) return;

  // Track link clicks
  if (target.tagName === 'A') {
    const href = target.getAttribute('href');
    if (href && !href.startsWith('#')) {
      track('link_click', {
        url: href,
        elementId: target.id || null,
        elementText: target.textContent?.trim().substring(0, 100),
        pageUrl: window.location.href,
      });
    }
  }

  // Track custom tracked elements
  if (target.dataset.track) {
    track(target.dataset.track, {
      elementId: target.id || null,
      elementText: target.textContent?.trim().substring(0, 100),
      ...JSON.parse(target.dataset.trackMeta || '{}'),
    });
  }
}

/**
 * Tracks a document view
 * Returns a function to call when done viewing (to capture duration)
 */
export function trackDocumentView(documentId, documentTitle) {
  const startTime = Date.now();

  return () => {
    const durationMs = Date.now() - startTime;
    track('document_view', {
      documentId,
      documentTitle,
      durationMs,
    });
  };
}

/**
 * Tracks a document download
 */
export function trackDocumentDownload(documentId, documentTitle) {
  track('document_download', {
    documentId,
    documentTitle,
  });
}

/**
 * Tracks a role switch
 */
export function trackRoleSwitch(fromRole, toRole) {
  track('role_switch', {
    fromRole,
    toRole,
  });
}

/**
 * Core tracking function
 */
export async function track(type, metadata) {
  if (!isAuthenticated()) return;

  const activity = {
    type,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    },
  };

  // If offline, queue the activity
  if (!navigator.onLine) {
    addToQueue(activity);
    return;
  }

  try {
    await apiClient.post('/activities', activity);
  } catch (error) {
    console.error('Failed to track activity:', error);
    // Queue for retry
    addToQueue(activity);
  }
}
