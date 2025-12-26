/**
 * Authentication Utilities for Admin Panel
 * 
 * This script provides authentication functions for the admin dashboard.
 * Updated to use HttpOnly cookies set by the backend instead of localStorage.
 */

// Enhanced Authentication Utilities (Cookie-Based)
// Version: 3.0.0 - COOKIE_BASED_AUTH - 2025-12-26T00:00:00.000Z
// =======================================================================

(function() {
  'use strict';

  // Prevent double execution
  if (window.authUtilsInitialized) {
    console.log('⚠️ Auth utils already initialized, skipping...');
    return;
  }
  window.authUtilsInitialized = true;

  console.log('🔧 Loading Auth Utils v3.0.0 - Cookie-Based Authentication');

  // Enhanced auth utilities with cookie-based storage
  window.authUtils = {
    // Authentication state
    state: {
      initialized: false,
      checking: false,
      authenticated: false,
      adminRole: null,
      lastCheck: null
    },

    /**
     * Initialize authentication
     */
    init() {
      if (this.state.initialized) return;
      
      this.state.initialized = true;
      console.log('🔐 Auth utils initialized (Cookie-based)');
    },

    /**
     * Check if user is authenticated by verifying cookies exist
     */
    async checkAuth() {
      if (!this.state.initialized) {
        this.init();
      }

      if (this.state.checking) {
        return this.state.authenticated;
      }

      try {
        this.state.checking = true;
        
        // Check if we can access the API with current cookies
        // The backend will automatically send the jwt_token cookie
        const response = await fetch('/api/dashboard/data/', {
          method: 'GET',
          credentials: 'include'  // Send cookies automatically
        });
        
        if (response.status === 401) {
          this.state.authenticated = false;
          return false;
        }
        
        if (response.ok) {
          // Get user role from cookie if available
          this.updateRoleFromCookie();
          this.state.authenticated = true;
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Auth check failed:', error);
        this.state.authenticated = false;
        return false;
      } finally {
        this.state.checking = false;
      }
    },

    /**
     * Update admin role from cookie
     */
    updateRoleFromCookie() {
      try {
        const roleValue = this.getCookie('userRole');
        if (roleValue) {
          this.state.adminRole = roleValue;
        }
      } catch (e) {
        // Silently handle cookie read errors
      }
    },

    /**
     * Get cookie value by name
     */
    getCookie(name) {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    },

    /**
     * Clear all authentication (logout)
     * Note: HttpOnly cookies must be cleared by the backend on logout endpoint
     */
    clearAuth() {
      // Clear any non-HttpOnly cookies
      document.cookie = 'userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      this.state.authenticated = false;
      this.state.adminRole = null;
    },

    /**
     * Get authentication token (for backwards compatibility)
     * Note: In cookie-based auth, the token is automatically sent with each request
     */
    getToken() {
      // Tokens are in HttpOnly cookies, not accessible to JavaScript
      // This returns null as a signal that auth is cookie-based
      return null;
    },

    /**
     * Check if user has admin role
     */
    isAdmin() {
      return this.state.adminRole === 'admin' || this.state.adminRole === 'Admin';
    },

    /**
     * Check if user has manager role
     */
    isManager() {
      return this.state.adminRole === 'manager' || this.state.adminRole === 'Manager';
    }
  };

  // Helper functions for auth validation
  window.authHelpers = {
    /**
     * Get user info from non-HttpOnly cookies set by backend
     */
    getUserInfo() {
      return {
        name: window.authUtils.getCookie('userName'),
        email: window.authUtils.getCookie('userEmail'),
        role: window.authUtils.getCookie('userRole')
      };
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
      // If we can read userRole cookie, user is likely authenticated
      return window.authUtils.getCookie('userRole') !== null;
    }
  };

  // Initialize auth utils
  window.authUtils.init();

})();

