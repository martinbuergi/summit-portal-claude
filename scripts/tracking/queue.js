/**
 * Activity Queue
 *
 * Handles offline activity queueing and retry.
 */

import { apiClient } from '../api/client.js';

const QUEUE_KEY = 'summit_activity_queue';
const MAX_QUEUE_SIZE = 100;

/**
 * Gets the current queue
 */
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Adds an activity to the queue
 */
export function addToQueue(activity) {
  const queue = getQueue();

  // Prevent queue from growing too large
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // Remove oldest
  }

  queue.push({
    ...activity,
    queuedAt: new Date().toISOString(),
  });

  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clears the queue
 */
export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Processes queued activities
 */
export async function processQueue() {
  if (!navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  // Clear queue immediately to prevent duplicate processing
  clearQueue();

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < queue.length; i += batchSize) {
    const batch = queue.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (activity) => {
        try {
          await apiClient.post('/activities', {
            type: activity.type,
            metadata: activity.metadata,
          });
        } catch (error) {
          console.error('Failed to process queued activity:', error);
          // Re-queue failed items
          addToQueue(activity);
        }
      })
    );
  }
}
