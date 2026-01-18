// js/api.js - API Service Layer for Backend Communication

import { API_BASE_URL, API_ENDPOINTS } from './config.js';

/**
 * Generic API request handler
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    console.log(`API Request: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`API Response:`, data);
    
    if (!data.success && data.message) {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * OFFERS API
 */
export const OffersAPI = {
  // Get all active offers
  getAll: async () => {
    return await apiRequest(API_ENDPOINTS.OFFERS);
  },
  
  // Create new offer
  create: async (offerData) => {
    return await apiRequest(API_ENDPOINTS.OFFERS, {
      method: 'POST',
      body: JSON.stringify(offerData)
    });
  },
  
  // Cancel offer
  cancel: async (offerId) => {
    return await apiRequest(API_ENDPOINTS.OFFERS_BY_ID(offerId), {
      method: 'DELETE'
    });
  }
};

/**
 * PROVIDERS API
 */
export const ProvidersAPI = {
  // Get all public providers
  getAll: async () => {
    return await apiRequest(API_ENDPOINTS.PROVIDERS);
  },
  
  // Update provider visibility
  updateVisibility: async (userId, isPublic) => {
    return await apiRequest(API_ENDPOINTS.PROVIDERS, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, is_public: isPublic })
    });
  },
  
  // Update provider stats
  updateStats: async (userId, stats) => {
    return await apiRequest(API_ENDPOINTS.PROVIDERS, {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, ...stats })
    });
  }
};

/**
 * DEALS API
 */
export const DealsAPI = {
  // Get deal details
  getById: async (dealId) => {
    return await apiRequest(API_ENDPOINTS.DEALS_BY_ID(dealId));
  },
  
  // Create new deal (subscriber picks offer)
  create: async (offerId, subscriberId) => {
    return await apiRequest(API_ENDPOINTS.DEALS, {
      method: 'POST',
      body: JSON.stringify({ offer_id: offerId, subscriber_id: subscriberId })
    });
  },
  
  // Update deal status
  updateStatus: async (dealId, status) => {
    return await apiRequest(API_ENDPOINTS.DEALS, {
      method: 'PUT',
      body: JSON.stringify({ deal_id: dealId, status: status })
    });
  }
};

/**
 * CHAT API
 */
export const ChatAPI = {
  // Get messages for a deal
  getMessages: async (dealId) => {
    return await apiRequest(API_ENDPOINTS.CHAT_BY_DEAL(dealId));
  },
  
  // Send message
  sendMessage: async (dealId, senderId, message) => {
    return await apiRequest(API_ENDPOINTS.CHAT, {
      method: 'POST',
      body: JSON.stringify({ deal_id: dealId, sender_id: senderId, message: message })
    });
  }
};

/**
 * RECONCILIATION API
 */
export const ReconciliationAPI = {
  // Get all balances
  getBalances: async () => {
    return await apiRequest(API_ENDPOINTS.RECONCILIATION);
  },
  
  // Office Movements
  officeMovements: {
    getAll: async (limit = 50) => {
      return await apiRequest(`${API_ENDPOINTS.OFFICE_MOVEMENTS}?limit=${limit}`);
    },
    
    create: async (movementData) => {
      return await apiRequest(API_ENDPOINTS.OFFICE_MOVEMENTS, {
        method: 'POST',
        body: JSON.stringify(movementData)
      });
    }
  },
  
  // Float Circulation
  floatCirculation: {
    getAll: async (limit = 50) => {
      return await apiRequest(`${API_ENDPOINTS.FLOAT_CIRCULATION}?limit=${limit}`);
    },
    
    create: async (circulationData) => {
      return await apiRequest(API_ENDPOINTS.FLOAT_CIRCULATION, {
        method: 'POST',
        body: JSON.stringify(circulationData)
      });
    }
  },
  
  // Daily Activities
  dailyActivities: {
    getByDate: async (date) => {
      return await apiRequest(`${API_ENDPOINTS.DAILY_ACTIVITIES}?date=${date}`);
    },
    
    create: async (activityData) => {
      return await apiRequest(API_ENDPOINTS.DAILY_ACTIVITIES, {
        method: 'POST',
        body: JSON.stringify(activityData)
      });
    }
  }
};

/**
 * ACTIVITY LOG API
 */
export const ActivityLogAPI = {
  // Get activities by section
  getBySection: async (section, limit = 5) => {
    return await apiRequest(API_ENDPOINTS.ACTIVITY_LOG(section, limit));
  }
};

export default {
  OffersAPI,
  ProvidersAPI,
  DealsAPI,
  ChatAPI,
  ReconciliationAPI,
  ActivityLogAPI
};