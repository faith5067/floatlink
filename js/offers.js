// js/offers.js - Offers Section Management

import { OffersAPI, ActivityLogAPI } from './api.js';
import { formatCurrency, timeAgo, showToast, parseAmount } from './utils.js';
import { DEFAULT_USERS } from './config.js';

/**
 * Load all active offers
 */
export async function loadOffers() {
  try {
    const response = await OffersAPI.getAll();
    
    if (response.success) {
      displayOffers(response.data);
    } else {
      console.error('Failed to load offers:', response.message);
      showToast('Failed to load offers');
    }
  } catch (error) {
    console.error('Error loading offers:', error);
    showToast('Error loading offers');
  }
}

/**
 * Display offers in the UI
 */
export function displayOffers(offers) {
  const offersList = document.getElementById('offers-list');
  if (!offersList) return;
  
  if (offers.length === 0) {
    offersList.innerHTML = '<p class="muted">No active offers at the moment.</p>';
    return;
  }
  
  offersList.innerHTML = offers.map(offer => `
    <div class="subcard" data-offer-id="${offer.id}">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div>
          <div class="bold">@${offer.username}</div>
          <div class="muted" style="font-size: 0.75rem;">${offer.from_network} → ${offer.to_network}</div>
        </div>
        <div style="text-align: right;">
          <div class="bold" style="color: var(--accent-lime);">${formatCurrency(offer.amount)}</div>
          <div class="muted" style="font-size: 0.7rem;">${timeAgo(offer.created_at)}</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-action" onclick="window.FloatLink.pickOffer(${offer.id})" style="flex: 1;">
          Pick & Serve
        </button>
        ${offer.poster_id === DEFAULT_USERS.POSTER ? `
          <button class="btn-danger" onclick="window.FloatLink.cancelOffer(${offer.id})" style="flex: 1;">
            Cancel
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Submit new offer
 */
export async function submitOffer(event) {
  event.preventDefault();
  
  try {
    const fromNetwork = document.getElementById('post-from')?.value;
    const toNetwork = document.getElementById('post-to')?.value;
    const amountInput = document.getElementById('post-amount')?.value;
    
    if (!fromNetwork || !toNetwork || !amountInput) {
      showToast('Please fill all fields');
      return;
    }
    
    const amount = parseAmount(amountInput);
    
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    
    const payload = {
      from_network: fromNetwork,
      to_network: toNetwork,
      amount: amount,
      poster_id: DEFAULT_USERS.POSTER
    };
    
    const response = await OffersAPI.create(payload);
    
    if (response.success) {
      showToast('Offer posted successfully!');
      document.getElementById('post-offer-form').reset();
      
      // Reload offers and activities
      await loadOffers();
      setTimeout(() => loadOffersActivities(), 500);
    } else {
      showToast('Failed: ' + response.message);
    }
  } catch (error) {
    console.error('Error posting offer:', error);
    showToast('Error posting offer');
  }
}

/**
 * Cancel offer
 */
export async function cancelOffer(offerId) {
  if (!confirm('Are you sure you want to cancel this offer?')) return;
  
  try {
    const response = await OffersAPI.cancel(offerId);
    
    if (response.success) {
      showToast('Offer cancelled');
      await loadOffers();
      setTimeout(() => loadOffersActivities(), 500);
    } else {
      showToast('Failed to cancel offer');
    }
  } catch (error) {
    console.error('Error cancelling offer:', error);
    showToast('Error cancelling offer');
  }
}

/**
 * Pick offer (for subscribers)
 */
export async function pickOffer(offerId) {
  if (!confirm('Pick this offer and open deal room?')) return;
  
  try {
    const DealsAPI = (await import('./api.js')).DealsAPI;
    const response = await DealsAPI.create(offerId, DEFAULT_USERS.SUBSCRIBER);
    
    if (response.success) {
      showToast('Deal room opened!');
      // You can add logic to open deal room modal here
      await loadOffers();
    } else {
      showToast('Failed: ' + response.message);
    }
  } catch (error) {
    console.error('Error picking offer:', error);
    showToast('Error picking offer');
  }
}

/**
 * Load recent offer activities
 */
export async function loadOffersActivities() {
  try {
    const response = await ActivityLogAPI.getBySection('offers', 5);
    
    if (response.success && response.data) {
      displayActivities(response.data, 'offers-activities-list');
    } else {
      const container = document.getElementById('offers-activities-list');
      if (container) {
        container.innerHTML = `
          <div class="activity-item">
            <div class="activity-info">
              <div class="activity-details" style="color: var(--text-muted);">No recent activities</div>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error loading offers activities:', error);
  }
}

/**
 * Display activities
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
 * Initialize offers section
 */
export function initOffers() {
  const postOfferForm = document.getElementById('post-offer-form');
  if (postOfferForm) {
    postOfferForm.addEventListener('submit', submitOffer);
  }
  
  // Load initial data
  loadOffers();
  loadOffersActivities();
}

export default {
  loadOffers,
  displayOffers,
  submitOffer,
  cancelOffer,
  pickOffer,
  loadOffersActivities,
  initOffers
};