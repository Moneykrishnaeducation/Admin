import React from 'react';
import { useLocation } from 'react-router-dom';
// API utility functions for consistent token handling

// Dynamic API base URL based on current domain
export const API_BASE_URL = `${window.location.protocol}//${window.location.host}`;

// Get CSRF token from cookies
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Get auth headers with token from HttpOnly cookies
export const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  // Tokens are now stored in HttpOnly cookies by the backend
  // The browser automatically includes them in requests
  return headers;
};

/**
 * Immediately logs out the user on unauthorized access.
 * - Clears all auth/session data instantly
 * - Calls performLogout() if available
 * - Falls back to a direct redirect to the login page
 */
export function handleUnauthorized() {
  try {
    // Clear session storage (but not localStorage since we're not using it for auth)
    sessionStorage.clear();

    // Call app-defined logout if available
    if (typeof window.performLogout === 'function') {
      window.performLogout(); // Should handle redirect internally
    } else {
      // Force redirect immediately
      window.location.replace('/');
    }
  } catch  {
    // console.error('Immediate logout failed:', error);
    // Always redirect as last resort
    window.location.replace('/');
  }
}

// Define global handler for consistency - ensure it's set immediately
if (typeof window !== 'undefined') {
  window.handleUnauthorized = handleUnauthorized;
}

// Generic API call function with unauthorized handling
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Build headers starting from auth defaults, then merge any user-provided headers
  const defaultHeaders = getAuthHeaders();
  const mergedHeaders = options.headers ? { ...defaultHeaders, ...options.headers } : { ...defaultHeaders };

  const config = {
    ...options,
    headers: mergedHeaders,
  };

  // If caller provided a FormData body, allow the browser to set Content-Type
  // (including the multipart boundary). Remove any pre-set Content-Type header
  // so fetch will set it correctly.
  try {
    if (options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData) {
      if (config.headers && config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    }
  } catch (_) {
    // Defensive: if FormData isn't available or instanceof check fails, ignore
  }

  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    // Ensure credentials are included for CSRF
    config.credentials = 'include';
  }

  // Headers were already merged above into config.headers

  try {
    const response = await fetch(url, config);
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      throw new Error('Unauthorized access');
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    // console.error('API call error:', error);
    throw error;
  }
};

// Login API call (doesn't need auth header)
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Login failed');
  }

  return data;
};

// Function to get CSRF token from server if needed
export const getCSRFToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}api/csrf-token/`, {
      method: 'GET',
      credentials: 'include', // Include cookies
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch {
    // console.error('Failed to fetch CSRF token:', error);
  }
  return null;
};

// Hook to track current page
export const useCurrentPage = () => {
  const location = useLocation();
  const currentPage = location.pathname;

  // Current page is available from location.pathname
  // No need to store in localStorage

  return currentPage;
};

// Storage event listeners removed - no longer using localStorage for auth/page tracking

// Cross-tab logout is now handled via backend session management
export const triggerCrossTabLogout = () => {
  // Logout will be coordinated server-side via session cookies
  // console.log('Logout triggered - handled server-side via session management');
};

// Current page is managed through React Router - no need for localStorage
export const getCurrentPage = () => {
  return window.location.pathname || '/dashboard';
};

// Current page is managed through React Router navigation
export const setCurrentPage = (page) => {
  // Use window.location or React Router's navigate() instead
  window.location.pathname = page;
};
