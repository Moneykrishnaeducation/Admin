/**
 * Admin Panel API Configuration
 * 
 * This script provides the API object and configuration for the admin dashboard.
 */

// Function to determine the correct API base URL
function getApiBase() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // For authentication endpoints, use /api/
    // For data endpoints like users, they're at root level
    return '/api';
}

// Get the base URL for user data endpoints (different from auth endpoints)
function getUsersApiBase() {
    // Users endpoint is directly at root level
    return '';
}

// Determine if we should use test endpoints (no authentication)
function shouldUseTestEndpoints() {
    // Check if user is authenticated via cookies
    const hasAuthCookie = document.cookie.split(';').some(item => 
        item.trim().startsWith('user=') || item.trim().startsWith('jwt_token=')
    );
    const isDirectDashboardAccess = window.location.pathname.includes('/Components/dashboard.html');
    
    return !hasAuthCookie || isDirectDashboardAccess;
}

// Set the global API_BASE variable
const API_BASE = getApiBase();
const USE_TEST_ENDPOINTS = shouldUseTestEndpoints();

// Export API_BASE for use in other modules
export { API_BASE };

// Debug logging
console.log('🔧 Admin API Configuration:', {
    hostname: window.location.hostname,
    isSubdomain: window.location.hostname.includes('admin.'),
    apiBase: API_BASE,
    useTestEndpoints: USE_TEST_ENDPOINTS,
    fullOrigin: window.location.origin
});

// Helper function for authenticated API requests
// Uses HttpOnly cookies automatically - no need to manually add Authorization header
async function fetchWithAuth(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        // IMPORTANT: Include credentials so cookies are sent automatically
        credentials: 'include',
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
}

// Named export for the 'get' function
export async function get(endpoint) {
    const url = `${API_BASE}/${endpoint}`;

    try {
        const response = await fetchWithAuth(url, { method: 'GET' });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Named export for the 'post' function
export async function post(endpoint, data, isFormData = false) {
    const url = `${API_BASE}/${endpoint}`;

    try {
        if (isFormData) {
            // For FormData, use fetch directly without Content-Type header
            // Cookies are sent automatically with credentials: include
            const response = await fetch(url, {
                method: 'POST',
                body: data,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            return responseData;
        } else {
            // For JSON data, use the authenticated fetch function
            const response = await fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            return responseData;
        }
    } catch (error) {
        console.error('API POST request failed:', error);
        throw error;
    }
}

// Named export for the 'patch' function
export async function patch(endpoint, data) {
    const url = `${API_BASE}/${endpoint}`;

    try {
        const response = await fetchWithAuth(url, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('API PATCH request failed:', error);
        throw error;
    }
}

// Create the API object that dashboard.js expects
window.API = {
    // Get dashboard statistics overview
    async getStatsOverview() {
        try {
            const endpoint = USE_TEST_ENDPOINTS ? '/api/test/dashboard/stats/' : '/api/dashboard/stats/';
            const response = await fetchWithAuth(endpoint);
            const data = await response.json();
            console.log('📊 Dashboard stats loaded:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to load dashboard stats:', error);
            throw error;
        }
    },

    // Get recent transactions for activity feed
    async getRecentTransactions() {
        try {
            const endpoint = USE_TEST_ENDPOINTS ? '/api/test/recent-transactions/' : '/api/recent-transactions/';
            const response = await fetchWithAuth(endpoint);
            const data = await response.json();
            console.log('📋 Recent transactions loaded:', data);
            return data;
        } catch (error) {
            console.error('❌ Failed to load recent transactions:', error);
            throw error;
        }
    },

    // Example function for making POST requests with authentication
    async postData(endpoint, data) {
        try {
            const result = await post(endpoint, data);
            console.log('POST request successful:', result);
            return result;
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }
};

window.API_BASE = API_BASE;

console.log('✅ Admin API object initialized:', window.API);

