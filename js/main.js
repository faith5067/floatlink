// js/main.js - Main Application Entry Point

import { initOffers, loadOffers, loadOffersActivities, cancelOffer, pickOffer } from './offers.js';
import { initReconciliation } from './reconciliation.js';
import { ProvidersAPI, ActivityLogAPI } from './api.js';
import { showToast, timeAgo, formatCurrency } from './utils.js';

/**
 * Navigation between sections
 */
function switchSection(section) {
  // Hide all sections
  const sections = ['offers', 'providers', 'reconcile'];
  sections.forEach(sec => {
    const element = document.getElementById(`section-${sec}`);
    if (element) element.classList.add('hidden');
  });
  
  // Show selected section
  const targetSection = document.getElementById(`section-${section}`);
  if (targetSection) targetSection.classList.remove('hidden');
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const navBtn = document.getElementById(`nav-${section}`);
  if (navBtn) navBtn.classList.add('active');
  
  // Load data for the section
  if (section === 'offers') {
    loadOffers();
    loadOffersActivities();
  } else if (section === 'providers') {
    loadProviders();
    loadProvidersActivities();
  } else if (section === 'reconcile') {
    const { loadReconciliation, loadOfficeMovements, loadReserveActions, loadDailyActivities, loadReconcileActivities } = require('./reconciliation.js');
    loadReconciliation();
    loadOfficeMovements();
    loadReserveActions();
    loadDailyActivities();
    loadReconcileActivities();
  }
}

/**
 * Load providers
 */
async function loadProviders() {
  try {
    const response = await ProvidersAPI.getAll();
    
    if (response.success) {
      displayProviders(response.data);
    }
  } catch (error) {
    console.error('Error loading providers:', error);
  }
}

/**
 * Display providers
 */
function displayProviders(providers) {
  const providersList = document.getElementById('providers-list');
  if (!providersList) return;
  
  if (providers.length === 0) {
    providersList.innerHTML = '<p class="muted">No providers available.</p>';
    return;
  }
  
  providersList.innerHTML = providers.map(provider => `
    <div class="subcard">
      <div class="subcard-title">@${provider.username}</div>
      <div class="muted" style="font-size: 0.75rem; margin-bottom: 8px;">
        ${Array.isArray(provider.networks) ? provider.networks.join(', ') : provider.networks}
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${provider.completed_deals}</div>
          <div class="stat-label">Deals</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${provider.avg_response_time}m</div>
          <div class="stat-label">Avg Time</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${provider.rating}</div>
          <div class="stat-label">Rating</div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Toggle provider visibility
 */
async function toggleProviderVisibility(event) {
  const isPublic = event.target.checked;
  
  try {
    const response = await ProvidersAPI.updateVisibility(2, isPublic); // User ID 2
    
    if (response.success) {
      showToast(isPublic ? 'Provider card is now public' : 'Provider card is now hidden');
      loadProviders();
      loadProvidersActivities();
    }
  } catch (error) {
    console.error('Error toggling visibility:', error);
  }
}

/**
 * Load provider activities
 */
async function loadProvidersActivities() {
  try {
    const response = await ActivityLogAPI.getBySection('providers', 5);
    
    if (response.success) {
      displayActivities(response.data, 'providers-activities-list');
    }
  } catch (error) {
    console.error('Error loading provider activities:', error);
  }
}

/**
 * Display activities (generic)
 */
function displayActivities(activities, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  if (!activities || activities.length === 0) {
    container.innerHTML = `
      <div class="activity-item">
        <div class="activity-info">
          <div class="activity-details" style="color: var(--text-muted);">No recent activities</div>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = activities.map(activity => {
    let amountClass = 'activity-neutral';
    if (activity.amount) {
      amountClass = activity.amount > 0 ? 'activity-positive' : 'activity-negative';
    }
    
    return `
      <div class="activity-item">
        <div class="activity-info">
          <div class="activity-type">${activity.type || activity.activity_type || 'Activity'}</div>
          <div class="activity-details">${activity.details || 'No details'}</div>
          <div class="activity-time">${activity.time_ago || timeAgo(activity.created_at)}</div>
        </div>
        ${activity.amount ? `
          <div class="activity-amount ${amountClass}">
            ${formatCurrency(Math.abs(activity.amount))}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Initialize application
 */
function initApp() {
  console.log('FloatLink initialized');
  
  // Setup navigation
  const navOffers = document.getElementById('nav-offers');
  const navProviders = document.getElementById('nav-providers');
  const navReconcile = document.getElementById('nav-reconcile');
  
  if (navOffers) navOffers.addEventListener('click', () => switchSection('offers'));
  if (navProviders) navProviders.addEventListener('click', () => switchSection('providers'));
  if (navReconcile) navReconcile.addEventListener('click', () => switchSection('reconcile'));
  
  // Provider visibility toggle
  const providersPublic = document.getElementById('providers-public');
  if (providersPublic) {
    providersPublic.addEventListener('change', toggleProviderVisibility);
  }
  
  // Initialize sections
  initOffers();
  initReconciliation();
  
  // Auto-refresh data every 30 seconds
  setInterval(() => {
    const activeSection = document.querySelector('.nav-btn.active')?.id.replace('nav-', '');
    if (activeSection === 'offers') {
      loadOffers();
      loadOffersActivities();
    } else if (activeSection === 'providers') {
      loadProviders();
      loadProvidersActivities();
    } else if (activeSection === 'reconcile') {
      const { loadReconciliation, loadReconcileActivities } = require('./reconciliation.js');
      loadReconciliation();
      loadReconcileActivities();
    }
  }, 30000);
  
  console.log('All event listeners attached');
}

// Expose functions to global window object for onclick handlers
window.FloatLink = {
  cancelOffer,
  pickOffer,
  switchSection
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export default {
  initApp,
  switchSection,
  loadProviders,
  toggleProviderVisibility
};