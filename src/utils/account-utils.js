/**
 * Account Management Utilities for Admin Panel
 * 
 * This script provides functions for managing user accounts in the admin dashboard.
 */

// Global Account Utilities for Admin Panel
window.AdminAccountUtils = {
    // Cache for user and account data
    cache: {
        users: new Map(),
        accounts: new Map(),
        lastUpdate: null,
        TTL: 60000 // Cache lifetime (60 seconds)
    },

    /**
     * Fetch user data by ID
     * @param {string|number} userId 
     * @param {boolean} forceRefresh 
     * @returns {Promise<Object>}
     */
    async getUserById(userId, forceRefresh = false) {
        // Check cache first
        if (!forceRefresh && 
            this.cache.users.has(userId) && 
            Date.now() - this.cache.lastUpdate < this.cache.TTL) {
            return this.cache.users.get(userId);
        }
        
        try {
            const endpoint = `/api/users/${userId}/`;
            const user = await AdminAPI.call(endpoint);
            // Update cache
            this.cache.users.set(userId, user);
            this.cache.lastUpdate = Date.now();
            return user;
        } catch (error) {
            // console.error(`Failed to fetch user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Fetch trading accounts for a user
     * @param {string|number} userId 
     * @param {boolean} forceRefresh 
     * @returns {Promise<Array>}
     */
    async getUserTradingAccounts(userId, forceRefresh = false) {
        const cacheKey = `accounts_${userId}`;
        
        // Check cache first
        if (!forceRefresh && 
            this.cache.accounts.has(cacheKey) && 
            Date.now() - this.cache.lastUpdate < this.cache.TTL) {
            return this.cache.accounts.get(cacheKey);
        }
        
        try {
            const endpoint = `/api/trading-accounts/?user_id=${userId}`;
            const accounts = await AdminAPI.call(endpoint);
            // Update cache
            this.cache.accounts.set(cacheKey, accounts);
            this.cache.lastUpdate = Date.now();
            return accounts;
        } catch (error) {
            // console.error(`Failed to fetch trading accounts for user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Format money amount with currency symbol
     * @param {number} amount 
     * @param {string} currency 
     * @returns {string}
     */
    formatMoney(amount, currency = 'USD') {
        if (amount === null || amount === undefined) return 'N/A';
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        
        return formatter.format(amount);
    },

    /**
     * Format percentage values
     * @param {number} value 
     * @returns {string}
     */
    formatPercentage(value) {
        if (value === null || value === undefined) return 'N/A';
        
        return `${parseFloat(value).toFixed(2)}%`;
    },

    /**
     * Update account status
     * @param {string|number} accountId 
     * @param {string} status 
     * @returns {Promise<Object>}
     */
    async updateAccountStatus(accountId, status) {
        try {
            const endpoint = `/api/trading-accounts/${accountId}/update/`;
            const result = await AdminAPI.call(endpoint, 'POST', { status });
            
            // Clear account cache to force refresh
            this.clearAccountCache();
            
            return result;
        } catch (error) {
            // console.error(`Failed to update account ${accountId} status:`, error);
            throw error;
        }
    },

    /**
     * Update account balance
     * @param {string|number} accountId 
     * @param {number} amount 
     * @param {string} operation - 'deposit', 'withdraw', 'adjust'
     * @param {string} reason 
     * @returns {Promise<Object>}
     */
    async updateAccountBalance(accountId, amount, operation, reason) {
        try {
            // Use specific endpoint based on operation type
            let endpoint;
            const payload = { amount, reason };
            
            switch(operation) {
                case 'deposit':
                    endpoint = `/api/deposit/`;
                    payload.account_id = accountId;
                    break;
                case 'withdraw':
                    endpoint = `/api/withdraw/`;
                    payload.account_id = accountId;
                    break;
                case 'adjust':
                    endpoint = `/api/trading-accounts/${accountId}/adjust-balance/`;
                    break;
                default:
                    throw new Error(`Invalid operation: ${operation}`);
            }
            
            const result = await AdminAPI.call(endpoint, 'POST', payload);
            
            // Clear account cache to force refresh
            this.clearAccountCache();
            
            return result;
        } catch (error) {
            // console.error(`Failed to update account ${accountId} balance:`, error);
            throw error;
        }
    },

    /**
     * Clear account cache to force refresh on next fetch
     */
    clearAccountCache() {
        this.cache.accounts.clear();
        this.cache.lastUpdate = null;
    },

    /**
     * Get user verification status
     * @param {string|number} userId 
     * @returns {Promise<Object>}
     */
    async getUserVerificationStatus(userId) {
        try {
            const endpoint = `/api/verification/${userId}/status/`;
            return await AdminAPI.call(endpoint);
        } catch (error) {
            // console.error(`Failed to fetch verification status for user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Update user verification status
     * @param {string|number} userId 
     * @param {string} status - 'approved', 'rejected', 'pending'
     * @param {string} reason - Optional reason for rejection
     * @returns {Promise<Object>}
     */
    async updateUserVerificationStatus(userId, status, reason = '') {
        try {
            const endpoint = `/api/verification/${userId}/update/`;
            return await AdminAPI.call(endpoint, 'POST', {
                status,
                reason
            });
        } catch (error) {
            // console.error(`Failed to update verification status for user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Lock/unlock user account
     * @param {string|number} userId 
     * @param {boolean} locked 
     * @param {string} reason 
     * @returns {Promise<Object>}
     */
    async toggleUserLock(userId, locked, reason) {
        try {
            const endpoint = `/api/users/${userId}/update-status/`;
            return await AdminAPI.call(endpoint, 'POST', {
                status: locked ? 'locked' : 'active',
                reason
            });
        } catch (error) {
            // console.error(`Failed to toggle lock for user ${userId}:`, error);
            throw error;
        }
    },

    /**
     * Reset user password
     * @param {string|number} userId 
     * @returns {Promise<Object>} - Contains temporary password
     */
    async    resetUserPassword(userId) {
        try {
            const endpoint = `/api/users/${userId}/reset-password/`;
            return await AdminAPI.call(endpoint, 'POST');
        } catch (error) {
            // console.error(`Failed to reset password for user ${userId}:`, error);
            throw error;
        }
    },
    
    /**
     * Get user bank details
     * @param {string|number} userId 
     * @returns {Promise<Object>}
     */
    async getUserBankDetails(userId) {
        try {
            const endpoint = `/api/users/${userId}/bank-details/`;
            return await AdminAPI.call(endpoint);
        } catch (error) {
            // console.error(`Failed to fetch bank details for user ${userId}:`, error);
            throw error;
        }
    },
    
    /**
     * Approve IB request
     * @param {string|number} requestId 
     * @returns {Promise<Object>}
     */
    async approveIBRequest(requestId, profileName = null) {
        try {
            const endpoint = `/api/admin/ib-request/${requestId}/`;
            // PATCH with status and profile_name if provided
            const payload = { status: 'approved' };
            if (profileName) payload.profile_name = profileName;
            return await AdminAPI.call(endpoint, 'PATCH', payload);
        } catch (error) {
            // console.error(`Failed to approve IB request ${requestId}:`, error);
            throw error;
        }
    },

    /**
     * Reject IB request
     * @param {string|number} requestId 
     * @param {string} reason 
     * @returns {Promise<Object>}
     */
    async rejectIBRequest(requestId, reason) {
        try {
            const endpoint = `/api/admin/ib-request/${requestId}/`;
            // PATCH with status and reason
            const payload = { status: 'rejected', reason };
            return await AdminAPI.call(endpoint, 'PATCH', payload);
        } catch (error) {
            // console.error(`Failed to reject IB request ${requestId}:`, error);
            throw error;
        }
    },

    /**
     * Approve user bank details (admin endpoint)
     * @param {string|number} requestId 
     * @returns {Promise<Object>}
     */
    async approveBankDetails(requestId) {
        try {
            const endpoint = `/api/admin/bank-detail-request/${requestId}/approve/`;
            return await AdminAPI.call(endpoint, 'PATCH');
        } catch (error) {
            // console.error(`Failed to approve bank details request ${requestId}:`, error);
            throw error;
        }
    },

    /**
     * Reject user bank details (admin endpoint)
     * @param {string|number} requestId 
     * @param {string} reason 
     * @returns {Promise<Object>}
     */
    async rejectBankDetails(requestId, reason) {
        try {
            const endpoint = `/api/admin/bank-detail-request/${requestId}/reject/`;
            return await AdminAPI.call(endpoint, 'PATCH', { reason });
        } catch (error) {
            // console.error(`Failed to reject bank details request ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Get user crypto details
     * @param {string|number} userId 
     * @returns {Promise<Object>}
     */
    async getUserCryptoDetails(userId) {
        try {
            const endpoint = `/api/users/${userId}/crypto-details/`;
            return await AdminAPI.call(endpoint);
        } catch (error) {
            // console.error(`Failed to fetch crypto details for user ${userId}:`, error);
            throw error;
        }
    },
    
    /**
     * Approve user crypto details
     * @param {string|number} requestId 
     * @returns {Promise<Object>}
     */
    async approveCryptoDetails(requestId) {
        try {
            const endpoint = `/api/admin/crypto-detail/${requestId}/approve/`;
            return await AdminAPI.call(endpoint, 'PATCH');
        } catch (error) {
            // console.error(`Failed to approve crypto details request ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Reject user crypto details
     * @param {string|number} requestId 
     * @param {string} reason 
     * @returns {Promise<Object>}
     */
    async rejectCryptoDetails(requestId, reason) {
        try {
            const endpoint = `/api/admin/crypto-detail/${requestId}/reject/`;
            return await AdminAPI.call(endpoint, 'PATCH', { reason });
        } catch (error) {
            // console.error(`Failed to reject crypto details request ${requestId}:`, error);
            throw error;
        }
    },
    
    /**
     * Get all pending verification requests (no pagination)
     * @returns {Promise<Object>}
     */
    async getPendingVerifications() {
        try {
            const endpoint = `/api/admin/verification/pending/`;
            return await AdminAPI.call(endpoint);
        } catch (error) {
            // console.error('Failed to fetch pending verifications:', error);
            throw error;
        }
    },
    
    /**
     * Get verification analytics
     * @returns {Promise<Object>}
     */
    async getVerificationAnalytics() {
        try {
            const endpoint = `/api/verification/analytics/`;
            return await AdminAPI.call(endpoint);
        } catch (error) {
            // console.error('Failed to fetch verification analytics:', error);
            throw error;
        }
    }
};

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // console.log('🔧 Admin Account Utils initialized');
});
