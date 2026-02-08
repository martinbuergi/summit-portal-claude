/**
 * Login Button Block
 *
 * Displays Adobe ID login button or user info when authenticated.
 */

import { isAuthenticated, getUser, logout } from '../../scripts/auth/session.js';
import { initiateLogin } from '../../scripts/auth/ims.js';

export default function decorate(block) {
  if (isAuthenticated()) {
    renderUserInfo(block);
  } else {
    renderLoginButton(block);
  }
}

function renderLoginButton(block) {
  block.innerHTML = `
    <button class="btn btn-primary login-btn">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 0L0 20h6.5l1.75-4h3.5l1.75 4H20L10 0zm0 8l2 4.5H8L10 8z"/>
      </svg>
      Log in with Adobe ID
    </button>
  `;

  block.querySelector('.login-btn').addEventListener('click', () => {
    initiateLogin();
  });
}

function renderUserInfo(block) {
  const user = getUser();
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  block.innerHTML = `
    <div class="user-info">
      <div class="user-avatar">${initials}</div>
      <div class="user-details">
        <span class="user-name">${user.firstName} ${user.lastName}</span>
        <span class="user-role">${formatRole(user.selectedRole || user.role)}</span>
      </div>
      <button class="btn btn-secondary logout-btn">Log out</button>
    </div>
  `;

  block.querySelector('.logout-btn').addEventListener('click', () => {
    logout();
  });
}

function formatRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
