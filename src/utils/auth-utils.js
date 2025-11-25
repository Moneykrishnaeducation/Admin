/**
 * Authentication Utilities for Admin Panel
 * 
 * This script provides authentication functions for the admin dashboard.
 */

// Enhanced Authentication Utilities
// Version: 2.1.0 - OPTIMIZED_LOGGING_FIX - 2025-07-14T15:30:00.000Z
// =======================================================================

(function() {
  'use strict';

  // Prevent double execution
  if (window.authUtilsInitialized) {
    console.log('⚠️ Auth utils already initialized, skipping...');
    return;
  }
  window.authUtilsInitialized = true;

  console.log('🔧 Loading Auth Utils v2.1.0 - Optimized Logging');

  // Enhanced auth utilities with reduced logging
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
      console.log('🔐 Auth utils initialized');
      
      // Set up periodic token validation
      setInterval(() => this.validateTokens(), 300000); // 5 minutes
    },

    /**
     * Validate stored tokens
     */
    validateTokens() {
      const token = localStorage.getItem('jwt_token');
      if (token && this.isTokenExpired(token)) {
        console.log('🔄 Token expired, attempting refresh...');
        this.refreshToken();
      }
    },

    /**
     * Check if user is authenticated
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
        const token = localStorage.getItem('access_token') || localStorage.getItem('jwt_token');
        
        if (!token) {
          this.state.authenticated = false;
          return false;
        }

        // Check if token is expired
        if (this.isTokenExpired(token)) {
          return await this.refreshToken();
        }
        
        // Update admin role from token
        this.updateRoleFromToken(token);
        
        this.state.authenticated = true;
        return true;
      } finally {
        this.state.checking = false;
      }
    },

    /**
     * Update admin role from token
     */
    updateRoleFromToken(token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.role) {
          this.state.adminRole = tokenData.role;
        }
      } catch (e) {
        // Silently handle token parsing errors
      }
    },

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        return tokenData.exp * 1000 < Date.now();
      } catch (e) {
        return true;
      }
    },

    /**
     * Refresh authentication token
     */
    async refreshToken() {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return false;
        }

        const response = await fetch('/api/token/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh: refreshToken })
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        
        if (!data.access) {
          throw new Error('Invalid refresh response');
        }

        // Store new tokens
        localStorage.setItem('jwt_token', data.access);
        localStorage.removeItem('access_token');
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
        }

        this.state.authenticated = true;
        this.updateRoleFromToken(data.access);
        
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.state.authenticated = false;
        this.clearTokens();
        return false;
      }
    },

    /**
     * Clear all tokens
     */
    clearTokens() {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refreshToken');
      this.state.authenticated = false;
      this.state.adminRole = null;
    },

    /**
     * Get authentication token
     */
    getToken() {
      return localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
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

  // Helper functions for token validation
  window.authHelpers = {
    /**
     * Check if JWT format is valid
     */
    isValidJWTFormat(token) {
      if (!token) return false;
      const parts = token.split('.');
      return parts.length === 3;
    },

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
      return window.authUtils.isTokenExpired(token);
    },

    /**
     * Check for tokens in URL (from login redirect)
     */
    checkUrlForTokens() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const refresh = urlParams.get('refresh');
      
      if (token && refresh) {
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('refreshToken', refresh);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
      }
      
      return false;
    }
  };

  // Initialize auth utils
  window.authUtils.init();

})();
