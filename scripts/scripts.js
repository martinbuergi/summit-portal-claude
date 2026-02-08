/**
 * Summit Portal - Main Scripts
 *
 * This file initializes the portal and loads required modules.
 */

import { initAuth, isAuthenticated, isEmployee } from './auth/session.js';
import { initTracking } from './tracking/tracker.js';

/**
 * Configuration
 */
export const CONFIG = {
  API_BASE_URL: 'https://runtime.adobe.io/api/v1/web/summit-portal',
  IMS_CLIENT_ID: 'your-ims-client-id', // TODO: Replace with actual client ID
  IMS_SCOPE: 'openid,AdobeID,read_organizations',
  IMS_AUTH_URL: 'https://ims-na1.adobelogin.com/ims/authorize/v2',
  ADOBE_ORG_ID: 'adobe-ims-org-id', // TODO: Replace with Adobe's IMS Org ID
};

/**
 * Decorates blocks in the main element
 */
function decorateBlocks(main) {
  main.querySelectorAll('div.section > div > div').forEach((block) => {
    const blockName = block.classList[0];
    if (blockName) {
      block.dataset.blockName = blockName;
    }
  });
}

/**
 * Loads a block's CSS and JS
 */
async function loadBlock(block) {
  const blockName = block.dataset.blockName;
  if (!blockName) return;

  try {
    const cssLoaded = new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/blocks/${blockName}/${blockName}.css`;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });

    const mod = await import(`/blocks/${blockName}/${blockName}.js`);
    await cssLoaded;

    if (mod.default) {
      await mod.default(block);
    }
  } catch (error) {
    console.error(`Failed to load block: ${blockName}`, error);
  }
}

/**
 * Loads all blocks in the main element
 */
async function loadBlocks(main) {
  const blocks = [...main.querySelectorAll('[data-block-name]')];
  await Promise.all(blocks.map(loadBlock));
}

/**
 * Handles auth-required elements visibility
 */
function updateAuthVisibility() {
  const authenticated = isAuthenticated();
  const employee = isEmployee();

  document.querySelectorAll('[data-auth="required"]').forEach((el) => {
    el.style.display = authenticated ? '' : 'none';
  });

  document.querySelectorAll('[data-auth="employee"]').forEach((el) => {
    el.style.display = employee ? '' : 'none';
  });

  document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
    el.style.display = authenticated ? 'none' : '';
  });
}

/**
 * Main initialization
 */
async function init() {
  // Initialize authentication
  await initAuth();

  // Update visibility based on auth state
  updateAuthVisibility();

  // Initialize click tracking (if authenticated)
  if (isAuthenticated()) {
    initTracking();
  }

  // Decorate and load blocks
  const main = document.querySelector('main');
  if (main) {
    decorateBlocks(main);
    await loadBlocks(main);
  }

  // Mark page as loaded
  document.body.classList.add('loaded');
}

// Run initialization
init();
