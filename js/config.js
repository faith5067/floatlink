// js/config.js - API Configuration and Constants

// API Base URL - Change this based on your environment
export const API_BASE_URL = 'http://localhost/floatlink/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Offers
  OFFERS: '/offers',
  OFFERS_BY_ID: (id) => `/offers?id=${id}`,
  
  // Providers
  PROVIDERS: '/providers',
  
  // Deals
  DEALS: '/deals',
  DEALS_BY_ID: (id) => `/deals?id=${id}`,
  
  // Chat
  CHAT: '/chat',
  CHAT_BY_DEAL: (dealId) => `/chat?deal_id=${dealId}`,
  
  // Reconciliation
  RECONCILIATION: '/reconciliation',
  OFFICE_MOVEMENTS: '/office_movements',
  FLOAT_CIRCULATION: '/float_circulation',
  DAILY_ACTIVITIES: '/daily_activities',
  
  // Activity Log
  ACTIVITY_LOG: (section, limit = 5) => `/activity_log?section=${section}&limit=${limit}`
};

// Default User IDs (for demo purposes)
export const DEFAULT_USERS = {
  POSTER: 1,        // Regular user posting offers
  SUBSCRIBER: 2,    // Subscriber picking offers
  ADMIN: 3          // Admin for reconciliation
};

// Networks/Channels
export const NETWORKS = [
  'M-Pesa',
  'Airtel',
  'Tigo',
  'Halopesa',
  'CRDB',
  'NMB',
  'Other Bank',
  'Cash'
];

// Activity Categories
export const ACTIVITY_CATEGORIES = [
  'Cash Deposit',
  'Cash Withdrawal',
  'Float Top-up',
  'Float Sell',
  'Bill Payment',
  'Fees / Charges',
  'Adjustment'
];

// Deal Statuses
export const DEAL_STATUS = {
  ACTIVE: 'active',
  FLOAT_RECEIVED: 'float_received',
  PAYMENT_SENT: 'payment_sent',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};

// Offer Statuses
export const OFFER_STATUS = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  DEFAULT_USERS,
  NETWORKS,
  ACTIVITY_CATEGORIES,
  DEAL_STATUS,
  OFFER_STATUS
};