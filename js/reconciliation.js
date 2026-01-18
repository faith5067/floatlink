// js/reconciliation.js - Reconciliation Section Management

import { ReconciliationAPI, ActivityLogAPI } from './api.js';
import { formatCurrency, showToast, parseAmount, getTodayDate } from './utils.js';
import { DEFAULT_USERS } from './config.js';

/**
 * Load reconciliation balances
 */
export async function loadReconciliation() {
  try {
    const response = await ReconciliationAPI.getBalances();
    
    if (response.success) {
      displayReconciliation(response.data);
    }
  } catch (error) {
    console.error('Error loading reconciliation:', error);
  }
}

/**
 * Display reconciliation data
 */
export function displayReconciliation(data) {
  const balances = data.balances;
  
  // Update KPI cards
  const kpiElements = {
    'kpi-cash': balances['Cash'] || 0,
    'kpi-mpesa': balances['M-Pesa'] || 0,
    'kpi-airtel': balances['Airtel'] || 0,
    'kpi-tigo-halo': (balances['Tigo'] || 0) + (balances['Halopesa'] || 0),
    'kpi-crdb': balances['CRDB'] || 0,
    'kpi-nmb': balances['NMB'] || 0,
    'kpi-bank': balances['Other Bank'] || 0,
    'kpi-working-float': balances['Working Float'] || 0
  };
  
  Object.entries(kpiElements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = formatCurrency(value);
    }
  });
  
  // Update total capital
  const totalCapital = document.getElementById('total-capital');
  if (totalCapital) {
    totalCapital.textContent = formatCurrency(data.total_capital);
  }
}

/**
 * Submit office movement
 */
export async function submitOfficeMovement(event) {
  event.preventDefault();
  
  try {
    const channel = document.getElementById('om-channel')?.value;
    const direction = document.getElementById('om-direction')?.value;
    const amountInput = document.getElementById('om-amount')?.value;
    const note = document.getElementById('om-note')?.value;
    
    if (!channel || !direction || !amountInput || !note) {
      showToast('Please fill all required fields');
      return;
    }
    
    const amount = parseAmount(amountInput);
    
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    
    const payload = {
      channel,
      direction,
      amount,
      note,
      created_by: DEFAULT_USERS.ADMIN
    };
    
    const response = await ReconciliationAPI.officeMovements.create(payload);
    
    if (response.success) {
      showToast('Office movement recorded!');
      document.getElementById('office-move-form').reset();
      
      await loadReconciliation();
      await loadOfficeMovements();
      setTimeout(() => loadReconcileActivities(), 500);
    } else {
      showToast('Failed: ' + response.message);
    }
  } catch (error) {
    console.error('Error recording movement:', error);
    showToast('Error recording movement');
  }
}

/**
 * Load office movements
 */
export async function loadOfficeMovements() {
  try {
    const response = await ReconciliationAPI.officeMovements.getAll(10);
    
    if (response.success) {
      displayOfficeMovements(response.data);
    }
  } catch (error) {
    console.error('Error loading movements:', error);
  }
}

/**
 * Display office movements
 */
function displayOfficeMovements(movements) {
  const list = document.getElementById('office-actions-list');
  if (!list) return;
  
  if (movements.length === 0) {
    list.innerHTML = '<p class="muted">No movements yet.</p>';
    return;
  }
  
  list.innerHTML = movements.map(m => `
    <div class="scroll-row">
      <span>${m.direction} • ${m.channel}</span>
      <span class="bold">${formatCurrency(m.amount)}</span>
    </div>
  `).join('');
}

/**
 * Submit float circulation
 */
export async function submitCirculation(event) {
  event.preventDefault();
  
  try {
    const network = document.getElementById('circ-network')?.value;
    const direction = document.getElementById('circ-dir')?.value;
    const amountInput = document.getElementById('circ-amount')?.value;
    const note = document.getElementById('circ-note')?.value;
    
    if (!network || !direction || !amountInput || !note) {
      showToast('Please fill all required fields');
      return;
    }
    
    const amount = parseAmount(amountInput);
    
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    
    const payload = {
      network,
      direction,
      amount,
      note,
      created_by: DEFAULT_USERS.ADMIN
    };
    
    const response = await ReconciliationAPI.floatCirculation.create(payload);
    
    if (response.success) {
      showToast('Float circulation recorded!');
      document.getElementById('circ-form').reset();
      
      await loadReconciliation();
      await loadReserveActions();
      setTimeout(() => loadReconcileActivities(), 500);
    } else {
      showToast('Failed: ' + response.message);
    }
  } catch (error) {
    console.error('Error recording circulation:', error);
    showToast('Error recording circulation');
  }
}

/**
 * Load reserve actions
 */
export async function loadReserveActions() {
  try {
    const response = await ReconciliationAPI.floatCirculation.getAll(10);
    
    if (response.success) {
      displayReserveActions(response.data);
    }
  } catch (error) {
    console.error('Error loading reserve actions:', error);
  }
}

/**
 * Display reserve actions
 */
function displayReserveActions(actions) {
  const list = document.getElementById('reserve-actions-list');
  if (!list) return;
  
  if (actions.length === 0) {
    list.innerHTML = '<p class="muted">No reserve actions yet.</p>';
    return;
  }
  
  list.innerHTML = actions.map(a => `
    <div class="scroll-row">
      <span>${a.direction === 'TO_RESERVE' ? '→ Reserve' : '← Reserve'}</span>
      <span class="bold">${formatCurrency(a.amount)}</span>
    </div>
  `).join('');
}

/**
 * Submit daily activity
 */
export async function submitActivity(event) {
  event.preventDefault();
  
  try {
    const category = document.getElementById('act-category')?.value;
    const channel = document.getElementById('act-channel')?.value;
    const amountInput = document.getElementById('act-amount')?.value;
    const staff = document.getElementById('act-staff')?.value;
    const reference = document.getElementById('act-ref')?.value;
    const description = document.getElementById('act-desc')?.value;
    
    if (!category || !channel || !amountInput || !description) {
      showToast('Please fill all required fields');
      return;
    }
    
    const amount = parseAmount(amountInput);
    
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    
    const payload = {
      category,
      channel,
      amount,
      staff: staff || null,
      reference: reference || null,
      description,
      created_by: DEFAULT_USERS.ADMIN
    };
    
    const response = await ReconciliationAPI.dailyActivities.create(payload);
    
    if (response.success) {
      showToast('Activity recorded!');
      document.getElementById('activity-form').reset();
      
      await loadDailyActivities();
      setTimeout(() => loadReconcileActivities(), 500);
    } else {
      showToast('Failed: ' + response.message);
    }
  } catch (error) {
    console.error('Error recording activity:', error);
    showToast('Error recording activity');
  }
}

/**
 * Load daily activities
 */
export async function loadDailyActivities() {
  try {
    const today = getTodayDate();
    const response = await ReconciliationAPI.dailyActivities.getByDate(today);
    
    if (response.success) {
      displayDailyActivities(response.data);
    }
  } catch (error) {
    console.error('Error loading daily activities:', error);
  }
}

/**
 * Display daily activities
 */
function displayDailyActivities(activities) {
  const list = document.getElementById('activities-list');
  if (!list) return;
  
  if (activities.length === 0) {
    list.innerHTML = '<p class="muted">No activities today.</p>';
    return;
  }
  
  list.innerHTML = activities.map(a => `
    <div class="scroll-row">
      <span>${a.category} • ${a.channel}</span>
      <span class="bold">${formatCurrency(a.amount)}</span>
    </div>
  `).join('');
}

/**
 * Load reconcile activities
 */
export async function loadReconcileActivities() {
  try {
    const response = await ActivityLogAPI.getBySection('reconcile', 5);
    
    if (response.success && response.data) {
      displayActivities(response.data, 'reconcile-activities-list');
    }
  } catch (error) {
    console.error('Error loading reconcile activities:', error);
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
    const { timeAgo } = require('./utils.js');
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
 * Initialize reconciliation section
 */
export function initReconciliation() {
  const officeMoveForm = document.getElementById('office-move-form');
  const circForm = document.getElementById('circ-form');
  const activityForm = document.getElementById('activity-form');
  
  if (officeMoveForm) officeMoveForm.addEventListener('submit', submitOfficeMovement);
  if (circForm) circForm.addEventListener('submit', submitCirculation);
  if (activityForm) activityForm.addEventListener('submit', submitActivity);
  
  // Load initial data
  loadReconciliation();
  loadOfficeMovements();
  loadReserveActions();
  loadDailyActivities();
  loadReconcileActivities();
}

export default {
  loadReconciliation,
  submitOfficeMovement,
  submitCirculation,
  submitActivity,
  loadOfficeMovements,
  loadReserveActions,
  loadDailyActivities,
  loadReconcileActivities,
  initReconciliation
};
