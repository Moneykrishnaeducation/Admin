/**
 * Authentication and API Utilities for Admin Panel
 * 
 * This script provides authenticated fetch functionality for the admin dashboard.
 * Updated to use HttpOnly cookies set by the backend instead of localStorage.
 */

// Cookie-Based Authentication Utilities
class AdminAuthenticatedFetch {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    // Get cookie value by name
    getCookieValue(name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        for(let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }
        return null;
    }

    // Check if user is authenticated by checking for cookies
    isAuthenticated() {
        // If userRole cookie exists, user is authenticated
        // HttpOnly jwt_token cookie will be sent automatically
        return this.getCookieValue('userRole') !== null;
    }

    // Get admin role from non-HttpOnly cookie
    getAdminRole() {
        return this.getCookieValue('userRole');
    }

    // Create headers for API requests
    createHeaders(additionalHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders
        };

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
        const csrfCookie = this.getCookieValue('csrftoken');
        if (csrfCookie) {
            return csrfCookie;
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

        let headers;
        // For FormData, don't use default headers to avoid Content-Type conflict
        if (options.body instanceof FormData) {
            headers = options.headers || {};
            // Add CSRF for FormData
            const csrfToken = this.getCsrfToken();
            if (csrfToken) {
                headers['X-CSRFToken'] = csrfToken;
            }
        } else {
            headers = this.createHeaders(options.headers);
        }

        const config = {
            credentials: 'include', // Send cookies automatically (including HttpOnly jwt_token)
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
        // Clear non-HttpOnly cookies (HttpOnly cookies cleared by backend on logout)
        document.cookie = 'userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Redirect to login page
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
            // Don't JSON.stringify FormData
            options.body = data instanceof FormData ? data : JSON.stringify(data);
            // For FormData, don't set Content-Type header
            if (data instanceof FormData) {
                delete options.headers['Content-Type'];
            }
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
            // Don't JSON.stringify FormData
            options.body = data instanceof FormData ? data : JSON.stringify(data);
            // For FormData, don't set Content-Type header
            if (data instanceof FormData) {
                delete options.headers['Content-Type'];
            }
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
            // Don't JSON.stringify FormData
            options.body = data instanceof FormData ? data : JSON.stringify(data);
            // For FormData, don't set Content-Type header
            if (data instanceof FormData) {
                delete options.headers['Content-Type'];
            }
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

// ES6 exports for modern module systems
export { AdminAuthenticatedFetch, adminApiClient, AdminAPI };

// For backward compatibility in browser environment
if (typeof window !== 'undefined') {
    window.AdminAuthenticatedFetch = AdminAuthenticatedFetch;
    window.adminApiClient = adminApiClient;
    window.AdminAPI = AdminAPI;
}
