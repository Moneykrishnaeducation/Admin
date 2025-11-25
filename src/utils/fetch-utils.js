/**
 * Authentication and API Utilities for Admin Panel
 * 
 * This script provides authenticated fetch functionality for the admin dashboard.
 */

// JWT Authentication Utilities
class AdminAuthenticatedFetch {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    // Get JWT token from localStorage
    getToken() {
        return localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            // Basic token validation (check if it's not expired)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            return payload.exp > now;
        } catch (error) {
            console.warn('Invalid token format:', error);
            return false;
        }
    }

    // Get admin role from token
    getAdminRole() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role || null;
        } catch (error) {
            console.warn('Error extracting role from token:', error);
            return null;
        }
    }

    // Create headers with authorization
    createHeaders(additionalHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add CSRF token for POST, PUT, PATCH, DELETE requests
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        return headers;
    }

    // Get CSRF token from cookie or meta tag
    getCsrfToken() {
        // First try to get from cookie
        const name = 'csrftoken=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieParts = decodedCookie.split(';');
        for (let part of cookieParts) {
            part = part.trim();
            if (part.indexOf(name) === 0) {
                return part.substring(name.length, part.length);
            }
        }
        
        // Then try to get from meta tag
        const csrfElement = document.querySelector('meta[name="csrf-token"]');
        if (csrfElement) {
            return csrfElement.getAttribute('content');
        }

        return null;
    }

    // Generic fetch wrapper with authentication
    async fetchWithAuth(url, options = {}) {
        // Prevent double /api if url already starts with /api/
        const fullUrl = url.startsWith('/api/') ? url : this.baseURL + url;

        // Merge headers
        const headers = this.createHeaders(options.headers);

        const config = {
            credentials: 'include', // Always send cookies/session
            ...options,
            headers
        };

        try {
            const response = await fetch(fullUrl, config);

            // Handle authentication errors
            if (response.status === 401) {
                console.warn('Authentication failed - redirecting to login');
                this.handleAuthError();
                throw new Error('Authentication failed');
            }

            // Handle authorization errors
            if (response.status === 403) {
                console.warn('Authorization failed - insufficient permissions');
                this.handleForbiddenError();
                throw new Error('Insufficient permissions');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Try to parse JSON, fallback to text
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // Handle authentication errors
    handleAuthError() {
        // Clear stored tokens
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('adminRole');
        // Redirect to a valid login page (update this if your login page is different)
        window.location.href = '/admin/index.html?error=session_expired';
    }

    // Handle forbidden errors
    handleForbiddenError() {
        // Display permission error
        const errorContainer = document.createElement('div');
        errorContainer.className = 'permission-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>Insufficient Permissions</h3>
                <p>You do not have the required permissions to access this resource.</p>
                <button onclick="window.location.href='/admin/admin/Components/dashboard.html'">Return to Dashboard</button>
            </div>
        `;
        
        // Clear page content and display error
        document.body.innerHTML = '';
        document.body.appendChild(errorContainer);
    }

    // GET request
    async get(url, headers = {}) {
        return this.fetchWithAuth(url, {
            method: 'GET',
            headers
        });
    }

    // POST request
    async post(url, data = null, headers = {}) {
        const options = {
            method: 'POST',
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        return this.fetchWithAuth(url, options);
    }

    // PUT request
    async put(url, data = null, headers = {}) {
        const options = {
            method: 'PUT',
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        return this.fetchWithAuth(url, options);
    }

    // PATCH request
    async patch(url, data = null, headers = {}) {
        const options = {
            method: 'PATCH',
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        return this.fetchWithAuth(url, options);
    }

    // DELETE request
    async delete(url, headers = {}) {
        return this.fetchWithAuth(url, {
            method: 'DELETE',
            headers
        });
    }
}

// Create global instance for API calls
// Use API_BASE from api-config.js or fallback to '/api'
const adminApiClient = new AdminAuthenticatedFetch(window.API_BASE || '/api');

// Enhanced API object with admin-specific endpoints
const AdminAPI = {
    // Admin panel endpoints
    getUsers: (page = 1, limit = 10) => adminApiClient.get(`/users/?page=${page}&limit=${limit}`),
    getUserById: (id) => adminApiClient.get(`/users/${id}/`),
    updateUser: (id, userData) => adminApiClient.put(`/users/${id}/`, userData),
    createUser: (userData) => adminApiClient.post('/users/', userData),
    deleteUser: (id) => adminApiClient.delete(`/users/${id}/`),
    
    // Trading accounts
    getTradingAccounts: (userId) => adminApiClient.get(`/trading-accounts/${userId ? `?user_id=${userId}` : ''}`),
    updateTradingAccount: (id, accountData) => adminApiClient.put(`/trading-accounts/${id}/`, accountData),
    createTradingAccount: (accountData) => adminApiClient.post('/trading-accounts/', accountData),
    
    // Transactions
    getTransactions: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                params.append(key, value);
            }
        });
        return adminApiClient.get(`/transactions/?${params}`);
    },
    approveTransaction: (id) => adminApiClient.post(`/transactions/${id}/approve/`),
    rejectTransaction: (id, reason) => adminApiClient.post(`/transactions/${id}/reject/`, { reason }),
    
    // Dashboard stats
    getStatsOverview: () => adminApiClient.get('/dashboard/stats/'),
    getRecentTransactions: () => adminApiClient.get('/recent-transactions/'),
    getActivityLog: () => adminApiClient.get('/activity-log/'),
    
    // Settings and configurations
    getSettings: () => adminApiClient.get('/settings/'),
    updateSettings: (settings) => adminApiClient.put('/settings/', settings),
    
    // Admin user management
    getAdmins: () => adminApiClient.get('/admins/'),
    createAdmin: (adminData) => adminApiClient.post('/admins/', adminData),
    updateAdmin: (id, adminData) => adminApiClient.put(`/admins/${id}/`, adminData),
    deleteAdmin: (id) => adminApiClient.delete(`/admins/${id}/`),
    
    // Generic API call
    call: (endpoint, method = 'GET', data = null) => {
        switch (method.toUpperCase()) {
            case 'GET':
                return adminApiClient.get(endpoint);
            case 'POST':
                return adminApiClient.post(endpoint, data);
            case 'PUT':
                return adminApiClient.put(endpoint, data);
            case 'PATCH':
                return adminApiClient.patch(endpoint, data);
            case 'DELETE':
                return adminApiClient.delete(endpoint);
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminAuthenticatedFetch, adminApiClient, AdminAPI };
} else {
    // Browser environment - attach to window
    window.AdminAuthenticatedFetch = AdminAuthenticatedFetch;
    window.adminApiClient = adminApiClient;
    window.AdminAPI = AdminAPI;
}
