import './style.css'
import './search.css'
import Chart from 'chart.js/auto';
import { createIcons, LayoutDashboard, Wallet, PieChart, Settings, Bell, Search, TrendingUp, TrendingDown, Zap, Coffee, ShoppingBag, Home, Car, Tv, Music, Monitor, Shield, Plane, MessageSquare, Layers, CreditCard, Filter, MoreHorizontal, X, Calendar, ChevronLeft, ChevronRight, AlertCircle, Target, Plus, Send, User, Lock, Smartphone, Moon, Trash2, LogOut, Tag, Gift } from 'lucide';
import { generateData } from './data.js';

// Initialize State
const loadState = () => {
  const saved = localStorage.getItem('novaState');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Migration for new fields
    if (!parsed.chatHistory) parsed.chatHistory = [];
    return parsed;
  }
  const initial = generateData();
  initial.chatHistory = [{
    role: 'ai',
    content: "Hello! I'm Nova, your financial assistant. I can help you analyze your spending, track your net worth, or plan for big purchases. How can I help you today?"
  }];
  localStorage.setItem('novaState', JSON.stringify(initial));
  return initial;
};

const state = loadState();

window.saveState = () => {
  localStorage.setItem('novaState', JSON.stringify(state));
};
let currentView = 'dashboard'; // 'dashboard' | 'transactions' | 'planning' | 'wealth' | 'assistant' | 'settings'
let currentTransactionFilter = 'All';
let currentWealthTab = 'goals'; // 'goals' | 'debt' | 'assets'
let currentSort = { field: 'date', direction: 'desc' };
let currentCalendarDate = new Date();
let extraDebtPayment = 250;
let currentAccountFilter = 'all'; // 'all' | accountId
let currentDebtStrategy = 'avalanche'; // 'avalanche' | 'snowball'

window.setDebtStrategy = (strategy) => {
  currentDebtStrategy = strategy;
  renderApp();
};

window.setAccountFilter = (accountId) => {
  currentAccountFilter = accountId;
  renderApp();
};

// --- Components ---

const Sidebar = () => `
  <nav class="sidebar">
    <div class="logo">
      <div class="logo-icon"><i data-lucide="zap"></i></div>
      <span>Nova</span>
    </div>
    <ul class="nav-links">
      <li class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" onclick="navigate('dashboard')">
        <i data-lucide="layout-dashboard"></i> Dashboard
      </li>
      <li class="nav-item ${currentView === 'transactions' ? 'active' : ''}" onclick="navigate('transactions')">
        <i data-lucide="wallet"></i> Transactions
      </li>
      <li class="nav-item ${currentView === 'wealth' && currentWealthTab === 'goals' ? 'active' : ''}" onclick="navigate('wealth', 'goals')">
        <i data-lucide="target"></i> Savings Goals
      </li>
      <li class="nav-item ${currentView === 'wealth' && currentWealthTab === 'debt' ? 'active' : ''}" onclick="navigate('wealth', 'debt')">
        <i data-lucide="credit-card"></i> Debt Repayment
      </li>
      <li class="nav-item ${currentView === 'wealth' && currentWealthTab === 'assets' ? 'active' : ''}" onclick="navigate('wealth', 'assets')">
        <i data-lucide="trending-up"></i> Assets
      </li>
    </ul>
  </nav>
`;


const AppHeader = () => `
  <header class="app-header">
    <div class="header-brand mobile-only">
      <div class="logo-icon"><i data-lucide="zap"></i></div>
      <span>Nova</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" onclick="showToast('Notifications', 'No new notifications')"><i data-lucide="bell"></i></button>
      <button class="icon-btn" onclick="toggleSearch()"><i data-lucide="search"></i></button>
      <div class="avatar" style="width: 36px; height: 36px; cursor: pointer;" onclick="navigate('settings')">
         <img src="${state.user.avatar}" alt="User">
      </div>
    </div>
  </header>
`;

const DashboardView = () => {
  // Filter Data based on Account Selection
  const filteredAccounts = currentAccountFilter === 'all'
    ? state.accounts
    : state.accounts.filter(a => a.id === currentAccountFilter);

  const filteredTransactions = currentAccountFilter === 'all'
    ? state.transactions
    : state.transactions.filter(t => t.accountId === currentAccountFilter);

  // Calculate Metrics
  const netWorth = filteredAccounts.reduce((acc, curr) => acc + curr.balance, 0);

  const currentMonth = new Date().getMonth();
  const monthlySpend = Math.abs(filteredTransactions
    .filter(t => t.amount < 0 && new Date(t.date).getMonth() === currentMonth)
    .reduce((acc, t) => acc + t.amount, 0));

  // Safe to spend (only relevant for checking accounts)
  const checkingAccounts = filteredAccounts.filter(a => a.type === 'checking');
  const safeToSpend = checkingAccounts.length > 0
    ? (checkingAccounts.reduce((acc, a) => acc + a.balance, 0) / 30).toFixed(2)
    : 'N/A';

  return `
    <header class="header">
      <div class="greeting">
        <h1>Overview</h1>
        <p>Your financial health at a glance.</p>
      </div>
    </header>

    <!-- Account Switcher -->
    <div class="account-switcher" style="margin-bottom: 1.5rem; overflow-x: auto; white-space: nowrap; padding-bottom: 0.5rem;">
      <button class="filter-chip ${currentAccountFilter === 'all' ? 'active' : ''}" onclick="setAccountFilter('all')">
        All Accounts
      </button>
      ${state.accounts.map(a => `
        <button class="filter-chip ${currentAccountFilter === a.id ? 'active' : ''}" onclick="setAccountFilter('${a.id}')">
          <i data-lucide="${a.type === 'investment' ? 'trending-up' : a.type === 'credit' ? 'credit-card' : 'wallet'}" style="width: 14px; margin-right: 6px; vertical-align: text-bottom;"></i>
          ${a.name}
        </button>
      `).join('')}
    </div>

    <div class="dashboard-grid">
      <!-- Net Worth Card -->
      <div class="card stat-card">
        <div class="stat-header">
          <span>${currentAccountFilter === 'all' ? 'Net Worth' : 'Balance'}</span>
          <i data-lucide="shield" size="16"></i>
        </div>
        <div class="stat-value">$${netWorth.toLocaleString()}</div>
        <div class="stat-trend">
          <span class="trend-up"><i data-lucide="trending-up" size="14"></i> +4.2%</span> all time
        </div>
      </div>

      <!-- Monthly Spend -->
      <div class="card stat-card">
        <div class="stat-header">
          <span>Monthly Spend</span>
          <i data-lucide="credit-card" size="16"></i>
        </div>
        <div class="stat-value">$${monthlySpend.toLocaleString()}</div>
        <div class="stat-trend">
          <span class="trend-down"><i data-lucide="trending-down" size="14"></i> 12%</span> vs last month
        </div>
      </div>

      <!-- Safe to Spend -->
      <div class="card stat-card">
        <div class="stat-header">
          <span>Safe to Spend</span>
          <i data-lucide="wallet" size="16"></i>
        </div>
        <div class="stat-value">${safeToSpend === 'N/A' ? 'N/A' : '$' + safeToSpend}</div>
        <div class="stat-trend">
          <span style="color: var(--text-secondary)">Daily Limit</span>
        </div>
      </div>

      <!-- Income vs Expense Chart -->
      <div class="card chart-section span-2" style="min-height: 400px; display: flex; flex-direction: column;">
        <div class="section-title">
          <span>Income vs Expense</span>
          <i data-lucide="bar-chart-3" size="18" style="opacity: 0.6;"></i>
        </div>
        <div style="flex: 1; position: relative;">
          <canvas id="trendChart"></canvas>
        </div>
      </div>

      <!-- Spending by Category -->
      <div class="card" style="min-height: 400px; display: flex; flex-direction: column;">
        <div class="section-title">
          <span>Spending by Category</span>
          <i data-lucide="pie-chart" size="18" style="opacity: 0.6;"></i>
        </div>
        <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center;">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>

      <!-- AI Insight -->
      <div class="card ai-section span-full">
        <div class="ai-header">
          <i data-lucide="zap"></i>
          <span>Nova AI Insight</span>
        </div>
        <div class="ai-content" id="ai-text"></div>
      </div>

      <!-- Recent Activity -->
      <div class="card transactions-section span-2">
        <div class="section-title">
          <span>Recent Activity</span>
          <i data-lucide="search" size="18" style="cursor:pointer; opacity:0.6"></i>
        </div>
        <div class="transaction-list">
          ${filteredTransactions.length > 0 ? filteredTransactions.slice(0, 5).map(t => `
            <div class="transaction-item">
              <div class="t-icon">
                <i data-lucide="${t.icon.toLowerCase()}" size="20"></i>
              </div>
              <div class="t-info">
                <div class="t-name">${t.name}</div>
                <div class="t-date">${t.date} • ${t.category}</div>
              </div>
              <div class="t-amount ${t.amount > 0 ? 'amount-pos' : 'amount-neg'}">
                ${t.amount > 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)}
              </div>
            </div>
          `).join('') : '<div style="padding: 1rem; color: var(--text-secondary); text-align: center;">No transactions for this account.</div>'}
        </div>
      </div>

      <!-- Top Merchants -->
      <div class="card">
        <div class="section-title">
            <span>Top Merchants</span>
        </div>
        <div class="transaction-list">
            ${state.transactions.slice(0, 5).map(t => `
                <div class="transaction-item">
                    <div class="t-icon"><i data-lucide="${t.icon.toLowerCase()}"></i></div>
                    <div class="t-info">
                        <div class="t-name">${t.name}</div>
                    </div>
                    <div class="t-amount ${t.amount > 0 ? 'amount-pos' : 'amount-neg'}">
                        $${Math.abs(t.amount).toFixed(0)}
                    </div>
                </div>
            `).join('')}
        </div>
      </div>

    </div>
`;
};

const TransactionsView = () => {
  let filteredTransactions = state.transactions.filter(t => {
    if (currentTransactionFilter === 'All') return true;
    if (currentTransactionFilter === 'Income') return t.amount > 0;
    if (currentTransactionFilter === 'Expenses') return t.amount < 0;
    if (currentTransactionFilter === 'Recurring') return t.recurring;
    return true;
  });

  // Sorting Logic
  filteredTransactions.sort((a, b) => {
    let valA = a[currentSort.field];
    let valB = b[currentSort.field];

    // Handle dates
    if (currentSort.field === 'date') {
      valA = new Date(valA); // This might need better parsing if dates are "Today", etc.
      valB = new Date(valB);
      // Fallback for "Today", "Yesterday" if data.js uses them
      if (a.date.includes('Today')) valA = new Date();
      if (b.date.includes('Today')) valB = new Date();
    }

    if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field) => {
    if (currentSort.field !== field) return '';
    return currentSort.direction === 'asc' ? '↑' : '↓';
  };

  return `
  <header class="page-header">
    <div class="greeting">
      <h1>Transactions</h1>
      <p>Manage and categorize your spending.</p>
    </div>
    <button class="btn-primary" style="width: auto;" onclick="document.getElementById('t-filters').style.display = document.getElementById('t-filters').style.display === 'none' ? 'flex' : 'none'">
      <i data-lucide="filter" style="width: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Filter
    </button>
  </header>

  <div id="t-filters" class="filters-bar">
    ${['All', 'Income', 'Expenses', 'Recurring'].map(filter => `
      <div class="filter-chip ${currentTransactionFilter === filter ? 'active' : ''}" onclick="setTransactionFilter('${filter}')">${filter}</div>
    `).join('')}
  </div>

  <div class="transactions-table-container">
    <table class="t-table">
      <thead>
        <tr>
          <th onclick="setSort('name')" style="cursor:pointer">Transaction ${getSortIcon('name')}</th>
          <th>Account</th>
          <th onclick="setSort('category')" style="cursor:pointer">Category (AI) ${getSortIcon('category')}</th>
          <th onclick="setSort('date')" style="cursor:pointer">Date ${getSortIcon('date')}</th>
          <th onclick="setSort('amount')" style="cursor:pointer">Amount ${getSortIcon('amount')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${filteredTransactions.length > 0 ? filteredTransactions.map(t => `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="t-icon" style="width: 32px; height: 32px; font-size: 1rem;">
                  <i data-lucide="${t.icon.toLowerCase()}" size="16"></i>
                </div>
                <span style="font-weight: 500;">${t.name}</span>
              </div>
            </td>
            <td style="color: var(--text-secondary);">${state.accounts.find(a => a.id === t.accountId)?.name || 'Unknown'}</td>
            <td>
              <div class="category-badge">
                <div class="confidence-dot ${t.pending ? 'conf-low' : 'conf-high'}"></div>
                ${t.category}
              </div>
            </td>
            <td style="color: var(--text-secondary);">${t.date}</td>
            <td class="${t.amount > 0 ? 'amount-pos' : 'amount-neg'}" style="font-weight: 600;">
              ${t.amount > 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)}
            </td>
            <td>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                ${t.amount < 0 ? `
                  <button class="action-btn" onclick="openTagGoalModal('${t.id}')" title="Tag to Goal">
                    <i data-lucide="tag" size="16"></i>
                  </button>
                  <button class="action-btn" onclick="openTagDebtModal('${t.id}')" title="Tag as Debt Payment">
                    <i data-lucide="credit-card" size="16"></i>
                  </button>
                ` : ''}
                <button class="action-btn" onclick="deleteTransaction('${t.id}')" style="color: var(--danger); opacity: 0.7;" title="Delete">
                  <i data-lucide="trash-2" size="16"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('') : `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No transactions found</td></tr>`}
      </tbody>
    </table>
  </div>
`;
};

const WealthView = () => {
  const renderGoals = () => `
    <div class="goals-grid">
      ${state.goals.map(g => {
    const percent = Math.round((g.current / g.target) * 100);
    return `
          <div class="goal-card">
            <div class="goal-icon-wrapper">
              <i data-lucide="${g.icon.toLowerCase()}"></i>
            </div>
            <div class="goal-header">
            <div>
              <div class="goal-title">${g.name}</div>
              <div class="goal-target">Target: $${g.target.toLocaleString()}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                <div style="font-weight: 700; color: var(--accent-primary);">${percent}%</div>
                <button onclick="showDeleteConfirmation('goal', '${g.id}', event)" class="action-btn" style="color: var(--danger); padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; transition: all 0.2s; z-index: 10; position: relative;" title="Delete Goal">
                    <i data-lucide="trash-2" size="18"></i>
                </button>
            </div>
          </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${percent}%"></div>
            </div>
            <div class="goal-stats">
              <span>$${g.current.toLocaleString()} saved</span>
              <span style="color: var(--text-secondary)">$${(g.target - g.current).toLocaleString()} left</span>
            </div>
          </div>
        `;
  }).join('')}
      
      <div class="goal-card" onclick="openAddGoalModal()" style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-style: dashed; cursor: pointer; opacity: 0.7; min-height: 200px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--glass-bg); display: grid; place-items: center; margin-bottom: 1rem;">
          <i data-lucide="plus"></i>
        </div>
        <div style="font-weight: 500;">Create New Goal</div>
      </div>
    </div>
  `;

  const renderDebt = () => {
    const debts = state.accounts.filter(a => a.type === 'loan' || a.type === 'credit');
    const totalDebt = Math.abs(debts.reduce((acc, a) => acc + a.balance, 0));
    const minPayment = totalDebt * 0.02; // Assume 2% min payment
    const totalMonthly = minPayment + extraDebtPayment;

    // Sort debts based on strategy
    const sortedDebts = [...debts].sort((a, b) => {
      if (currentDebtStrategy === 'avalanche') {
        return (b.apr || 0) - (a.apr || 0); // Highest APR first
      } else {
        return Math.abs(a.balance) - Math.abs(b.balance); // Lowest balance first
      }
    });

    // Calculate payoff details
    const monthsToPayoff = Math.ceil(totalDebt / totalMonthly);
    const totalInterest = (monthsToPayoff * totalMonthly) - totalDebt;

    // Calculate savings compared to minimum payment
    const monthsMin = Math.ceil(totalDebt / minPayment);
    const interestMin = (monthsMin * minPayment) - totalDebt;
    const interestSaved = Math.max(0, interestMin - totalInterest);

    const topPriority = sortedDebts[0];

    return `
    <div class="debt-planner-container">
      <div class="debt-chart-card">
        <h3 class="section-title">Payoff Timeline</h3>
        <div style="height: 300px; position: relative;">
            <canvas id="debtChart"></canvas>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">Your Liabilities</h4>
            <div class="transaction-list">
                ${sortedDebts.map((d, index) => `
                    <div class="transaction-item" style="border-left: 3px solid ${index === 0 ? 'var(--accent-primary)' : 'transparent'}; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                            <div class="t-icon"><i data-lucide="${d.type === 'credit' ? 'credit-card' : 'landmark'}"></i></div>
                            <div class="t-info">
                                <div class="t-name">${d.name} ${index === 0 ? '<span class="badge" style="margin-left: 0.5rem; font-size: 0.7rem;">Priority #1</span>' : ''}</div>
                                <div class="t-date">${d.institution} • ${d.apr ? d.apr + '% APR' : 'Unknown APR'}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="t-amount amount-neg">$${Math.abs(d.balance).toLocaleString()}</div>
                            <button onclick="showDeleteConfirmation('debt', '${d.id}', event)" class="action-btn" style="color: var(--text-secondary); padding: 6px; border-radius: 6px; transition: all 0.2s; z-index: 10; position: relative;" title="Delete Debt">
                                <i data-lucide="trash-2" size="16"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="openAddDebtModal()" class="btn-secondary" style="width: 100%; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; transition: all 0.2s;">
                <i data-lucide="plus" size="16"></i> Add New Debt
            </button>
        </div>
      </div>

      <div class="debt-controls-card">
        <h3 class="section-title">Debt Payoff Calculator</h3>
        
        <div class="control-group">
          <label>Total Debt</label>
          <div class="amount-display">$${totalDebt.toLocaleString()}</div>
        </div>

        <div class="control-group">
          <label>Extra Monthly Payment: <span style="color: var(--accent-primary); font-weight: 600;">$${extraDebtPayment}</span></label>
          <input type="range" min="0" max="2000" step="50" value="${extraDebtPayment}" 
            oninput="updateExtraPayment(this.value)" class="slider-input">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
            <span>$0</span>
            <span>$2,000</span>
          </div>
        </div>

        <div class="impact-summary">
          <div class="impact-item">
            <div class="impact-label">New Payoff Time</div>
            <div class="impact-value">${Math.floor(monthsToPayoff / 12)}y ${monthsToPayoff % 12}m</div>
            <div class="impact-sub">vs ${Math.floor(monthsMin / 12)}y ${monthsMin % 12}m</div>
          </div>
          <div class="impact-item">
            <div class="impact-label">Total Interest</div>
            <div class="impact-value" style="color: var(--danger);">$${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div class="impact-item">
            <div class="impact-label">Interest Saved</div>
            <div class="impact-value" style="color: var(--success);">+$${interestSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <div class="ai-advice-box">
          <div style="display: flex; gap: 0.75rem;">
            <div class="ai-avatar-small"><i data-lucide="zap" size="16" color="white"></i></div>
            <div>
              <div style="font-weight: 600; margin-bottom: 0.25rem;">AI Recommendation</div>
              <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
                Based on the <strong>${currentDebtStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'}</strong> method, you should focus your extra payments on <strong>${topPriority ? topPriority.name : 'your debts'}</strong> first.
                ${extraDebtPayment > 500 ? "Your aggressive payment plan is excellent!" : "Consider increasing your contribution to save more on interest."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
    <div class="debt-controls">
      <div class="control-card">
        <h3 class="section-title" style="font-size: 1rem;">Payoff Strategy</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Choose how you want to tackle your debt.</p>

        <div class="strategy-toggle">
          <div class="strategy-btn ${currentDebtStrategy === 'avalanche' ? 'active' : ''}" onclick="setDebtStrategy('avalanche')">Avalanche (Interest)</div>
          <div class="strategy-btn ${currentDebtStrategy === 'snowball' ? 'active' : ''}" onclick="setDebtStrategy('snowball')">Snowball (Balance)</div>
        </div>
      </div>
    </div>
    `;
  };


  const renderAssets = () => `
  < div class="card" >
        <h3 class="section-title">Your Assets</h3>
        <div class="transaction-list">
            ${state.accounts.filter(a => a.balance > 0).map(a => `
                <div class="transaction-item">
                    <div class="t-icon"><i data-lucide="${a.type === 'investment' ? 'trending-up' : 'wallet'}"></i></div>
                    <div class="t-info">
                        <div class="t-name">${a.name}</div>
                        <div class="t-date">${a.institution} • ${a.mask}</div>
                    </div>
                    <div class="t-amount amount-pos">$${a.balance.toLocaleString()}</div>
                </div>
            `).join('')}
        </div>
    </div >
  `;

  return `
  < header class="page-header" >
    <div class="greeting">
      <h1>Wealth Management</h1>
      <p>Track your net worth, goals, and debt payoff strategy.</p>
    </div>
  </header >

  <div class="tabs-container">
    <button class="tab-btn ${currentWealthTab === 'goals' ? 'active' : ''}" onclick="setWealthTab('goals')">Goals</button>
    <button class="tab-btn ${currentWealthTab === 'debt' ? 'active' : ''}" onclick="setWealthTab('debt')">Debt Planner</button>
    <button class="tab-btn ${currentWealthTab === 'assets' ? 'active' : ''}" onclick="setWealthTab('assets')">Assets</button>
  </div>

  ${currentWealthTab === 'goals' ? renderGoals() : ''}
  ${currentWealthTab === 'debt' ? renderDebt() : ''}
  ${currentWealthTab === 'assets' ? renderAssets() : ''}
`;
};

const PlanningView = () => {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthName = currentCalendarDate.toLocaleString('default', { month: 'long' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Calculate upcoming bills total
  const upcomingBillsTotal = state.subscriptions.reduce((acc, sub) => acc + sub.amount, 0);
  const dailySafe = (state.accounts.find(a => a.type === 'checking')?.balance - upcomingBillsTotal) / 30;

  return `
  < header class="page-header" >
    <div class="greeting">
      <h1>Financial Planning</h1>
      <p>Track recurring bills and forecast your cash flow.</p>
    </div>
    <button class="btn-primary" style="width: auto;" onclick="addBill()">
      <i data-lucide="alert-circle" style="width: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Add Bill
    </button>
  </header >

  <div class="planning-grid">
    <!-- Calendar -->
    <div class="calendar-container">
      <div class="calendar-header">
        <h2 style="font-size: 1.1rem; font-weight: 600;">${monthName} ${year}</h2>
        <div style="display: flex; gap: 0.5rem;">
          <button class="icon-btn" onclick="changeMonth(-1)"><i data-lucide="chevron-left"></i></button>
          <button class="icon-btn" onclick="changeMonth(1)"><i data-lucide="chevron-right"></i></button>
        </div>
      </div>
      <div class="calendar-grid">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div class="cal-day empty"></div>').join('')}
        ${Array(daysInMonth).fill(0).map((_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Find events
    const events = state.subscriptions.filter(sub => sub.nextDue === dateStr);

    return `
            <div class="cal-day ${day === new Date().getDate() && month === new Date().getMonth() ? 'today' : ''}">
              <div class="cal-date">${day}</div>
              ${events.map(e => `<div class="cal-event bill" title="${e.name} - $${e.amount}">${e.name}</div>`).join('')}
            </div>
          `;
  }).join('')}
      </div>
    </div>

    <!-- Upcoming Bills -->
    <div class="bills-panel">
      <h3 class="section-title">Upcoming Bills</h3>
      ${state.subscriptions.map(sub => `
        <div class="bill-card">
          <div class="bill-icon">
            <i data-lucide="${sub.icon.toLowerCase()}"></i>
          </div>
          <div class="bill-info">
            <div class="bill-name">${sub.name}</div>
            <div class="bill-due">Due ${sub.nextDue}</div>
          </div>
          <div style="text-align: right;">
            <div class="bill-amount">$${sub.amount}</div>
            <span class="bill-status status-due">Due Soon</span>
          </div>
        </div>
      `).join('')}

      <div class="card" style="margin-top: 1rem; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(139, 92, 246, 0.2);">
        <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
          <i data-lucide="zap" style="color: var(--ai-color); margin-top: 2px;"></i>
          <div>
            <div style="font-weight: 600; margin-bottom: 0.25rem; color: var(--text-primary);">Cash Flow Forecast</div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
              Based on your upcoming bills ($${upcomingBillsTotal.toFixed(2)} total), you are safe to spend <strong>$${dailySafe.toFixed(2)}/day</strong> for the rest of the month.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;
};

const FinAssistantView = () => `
  < header class="page-header" >
    <div class="greeting">
      <h1>Fin Assistant</h1>
      <p>Your personal AI financial guide.</p>
    </div>
  </header >

  <div class="chat-container">
    <div class="chat-messages" id="chat-messages">
      ${state.chatHistory.map(msg => `
        <div class="chat-message message-${msg.role}">
          ${msg.role === 'ai' ? '<div class="ai-avatar-small"><i data-lucide="zap" size="16" color="white"></i></div>' : ''}
          <div class="message-content">
            ${msg.content}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="suggestion-chips">
      <div class="suggestion-chip" onclick="sendSuggestion('How much did I spend on Uber?')">How much did I spend on Uber?</div>
      <div class="suggestion-chip" onclick="sendSuggestion('What is my net worth?')">What is my net worth?</div>
      <div class="suggestion-chip" onclick="sendSuggestion('Can I afford a vacation?')">Can I afford a vacation?</div>
    </div>

    <div class="chat-input-area">
      <textarea class="chat-input" placeholder="Ask me anything about your finances..." id="chat-input" onkeypress="handleEnter(event)"></textarea>
      <button class="send-btn" onclick="handleChatSubmit()">
        <i data-lucide="send"></i>
      </button>
    </div>
  </div>
`;

// --- Chat Logic ---

window.handleEnter = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleChatSubmit();
  }
};

window.sendSuggestion = (text) => {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = text;
    handleChatSubmit();
  }
};

window.handleChatSubmit = () => {
  const input = document.getElementById('chat-input');
  const messagesContainer = document.getElementById('chat-messages');
  if (!input || !messagesContainer || !input.value.trim()) return;

  const userText = input.value.trim();

  // Add User Message
  state.chatHistory.push({ role: 'user', content: userText });
  saveState();
  renderApp(); // Re-render to show new message immediately

  // Simulate AI Typing (We need to re-select container after render)
  setTimeout(() => {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.scrollTop = container.scrollHeight;

    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.className = 'chat-message message-ai';
    aiMsgDiv.innerHTML = `
  < div class="ai-avatar-small" > <i data-lucide="zap" size="16" color="white"></i></div >
    <div class="message-content">...</div>
`;
    container.appendChild(aiMsgDiv);
    createIcons({ icons: { Zap }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
      const response = generateAIResponse(userText);
      state.chatHistory.push({ role: 'ai', content: response });
      saveState();
      renderApp();

      // Scroll to bottom after re-render
      const newContainer = document.getElementById('chat-messages');
      if (newContainer) newContainer.scrollTop = newContainer.scrollHeight;
    }, 1000);
  }, 100);
};

function generateAIResponse(text) {
  const lowerText = text.toLowerCase();

  // Dynamic Data Access
  const netWorth = state.accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlySpend = Math.abs(state.transactions.filter(t => t.amount < 0 && new Date(t.date).getMonth() === new Date().getMonth()).reduce((acc, t) => acc + t.amount, 0));
  const subTotal = state.subscriptions.reduce((acc, s) => acc + s.amount, 0);

  if (lowerText.includes('spend') || lowerText.includes('spent')) {
    if (lowerText.includes('uber')) {
      const uberSpend = Math.abs(state.transactions.filter(t => t.name.toLowerCase().includes('uber')).reduce((acc, t) => acc + t.amount, 0));
      return `You've spent <strong>$${uberSpend.toFixed(2)}</strong> on Uber.`;
    }
    return `Your total spending this month is <strong>$${monthlySpend.toLocaleString()}</strong>.`;
  }

  if (lowerText.includes('net worth')) {
    return `Your current net worth is <strong>$${netWorth.toLocaleString()}</strong>.`;
  }

  if (lowerText.includes('afford') || lowerText.includes('vacation')) {
    const savings = state.accounts.find(a => a.type === 'investment')?.balance || 0;
    return `You have <strong>$${savings.toLocaleString()}</strong> in investments. Depending on the cost, you might be able to afford it, but keep your goals in mind!`;
  }

  if (lowerText.includes('subscription') || lowerText.includes('bill')) {
    return `You have ${state.subscriptions.length} active subscriptions totaling <strong>$${subTotal.toFixed(2)}/month</strong>.`;
  }

  return "I'm still learning! I can help you track expenses, check your net worth, or analyze your bills. Try asking 'What is my net worth?' or 'How much did I spend?'";
}

// --- Chat Logic ---
// ... (existing chat logic)

const AnalyticsView = () => `
  <header class="page-header">
    <div class="greeting">
      <h1>Analytics</h1>
      <p>Deep dive into your spending habits.</p>
    </div>
    <div class="header-actions">
        <select class="select-input" style="padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); outline: none; cursor: pointer;">
            <option>Last 30 Days</option>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
        </select>
    </div>
  </header>

  <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; padding-bottom: 2rem;">
    
    <!-- Spending by Category -->
    <div class="card" style="grid-column: span 1; min-height: 400px; display: flex; flex-direction: column;">
      <div class="section-title">
        <span>Spending by Category</span>
        <i data-lucide="pie-chart" size="18" style="opacity: 0.6;"></i>
      </div>
      <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center;">
        <canvas id="categoryChart"></canvas>
      </div>
    </div>

    <!-- Monthly Trends -->
    <div class="card" style="grid-column: span 1; min-height: 400px; display: flex; flex-direction: column;">
      <div class="section-title">
        <span>Income vs Expense</span>
        <i data-lucide="bar-chart-3" size="18" style="opacity: 0.6;"></i>
      </div>
      <div style="flex: 1; position: relative;">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <!-- Top Merchants -->
    <div class="card" style="grid-column: 1 / -1;">
        <div class="section-title">
            <span>Top Merchants</span>
            <button class="btn-outline" style="font-size: 0.8rem; padding: 0.25rem 0.75rem;" onclick="navigate('transactions')">View All</button>
        </div>
        <div class="transaction-list">
            ${state.transactions.slice(0, 3).map(t => `
                <div class="transaction-item">
                    <div class="t-icon"><i data-lucide="${t.icon.toLowerCase()}"></i></div>
                    <div class="t-info">
                        <div class="t-name">${t.name}</div>
                        <div class="t-date">${t.category} • ${t.date}</div>
                    </div>
                    <div class="t-amount ${t.amount > 0 ? 'amount-pos' : 'amount-neg'}">
                        ${t.amount > 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
  </div>
`;

const SettingsView = () => {
  // Simple local state for settings tab (not persisted for now)
  if (!window.currentSettingsTab) window.currentSettingsTab = 'profile';

  const renderSettingsContent = () => {
    switch (window.currentSettingsTab) {
      case 'profile':
        return `
          <div class="settings-section">
            <h2>Profile Information</h2>
            <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
              <div class="avatar" style="width: 80px; height: 80px;">
                <img src="${state.user.avatar}" alt="User">
              </div>
              <div>
                <button class="btn-outline" style="font-size: 0.9rem; margin-bottom: 0.5rem;" onclick="triggerAvatarUpload()">Change Avatar</button>
                <input type="file" id="avatar-upload" style="display: none" accept="image/*" onchange="handleAvatarUpload(this)">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" value="${state.user.name}" onchange="updateUser('name', this.value)">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" value="alex.morgan@example.com" disabled title="Email updates coming soon">
            </div>
          </div>
        `;
      case 'security':
        return `
          <div class="settings-section">
            <h2>Security</h2>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" ${state.user.security.mfaEnabled ? 'checked' : ''} onchange="updateSecurity('mfaEnabled', this.checked)">
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Biometric Login</h3>
                <p>Use FaceID or TouchID to log in.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" ${state.user.security.biometricEnabled ? 'checked' : ''} onchange="updateSecurity('biometricEnabled', this.checked)">
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Change Password</h3>
                <p>Last changed 3 months ago.</p>
              </div>
              <button class="btn-outline" onclick="showToast('Info', 'Password reset link sent to email')">Update</button>
            </div>
          </div>
        `;
      case 'notifications':
        return `
          <div class="settings-section">
            <h2>Notifications</h2>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Bill Reminders</h3>
                <p>Get notified before a bill is due.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Weekly Report</h3>
                <p>Receive a summary of your spending every Sunday.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        `;
      case 'appearance':
        return `
          <div class="settings-section">
            <h2>Appearance</h2>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Dark Mode</h3>
                <p>Toggle dark mode theme.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked disabled>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        `;
      case 'data':
        return `
          <div class="settings-section">
            <h2 style="color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">Danger Zone</h2>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Delete Account</h3>
                <p>Permanently remove your account and all data.</p>
              </div>
              <button class="btn-danger" onclick="deleteAccount()">Delete Account</button>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h3>Reset Demo Data</h3>
                <p>Restore the application to its initial state.</p>
              </div>
              <button class="btn-outline" onclick="resetData()">Reset Data</button>
            </div>
          </div>
        `;
      default:
        return '';
    }
  };

  return `
  <header class="page-header">
    <div class="greeting">
      <h1>Settings</h1>
      <p>Manage your account, security, and preferences.</p>
    </div>
  </header>

  <div class="settings-container">
    <div class="settings-sidebar">
      <div class="settings-nav-item ${window.currentSettingsTab === 'profile' ? 'active' : ''}" onclick="window.setSettingsTab('profile')">
        <i data-lucide="user" size="18"></i> Profile
      </div>
      <div class="settings-nav-item ${window.currentSettingsTab === 'security' ? 'active' : ''}" onclick="window.setSettingsTab('security')">
        <i data-lucide="lock" size="18"></i> Security
      </div>
      <div class="settings-nav-item ${window.currentSettingsTab === 'notifications' ? 'active' : ''}" onclick="window.setSettingsTab('notifications')">
        <i data-lucide="bell" size="18"></i> Notifications
      </div>
      <div class="settings-nav-item ${window.currentSettingsTab === 'appearance' ? 'active' : ''}" onclick="window.setSettingsTab('appearance')">
        <i data-lucide="moon" size="18"></i> Appearance
      </div>
      <div class="settings-nav-item ${window.currentSettingsTab === 'data' ? 'active' : ''}" style="color: var(--danger);" onclick="window.setSettingsTab('data')">
        <i data-lucide="trash-2" size="18"></i> Data & Privacy
      </div>
    </div>

    <div class="settings-content">
      ${renderSettingsContent()}
      
      <div style="margin-top: 2rem; text-align: center; border-top: 1px solid var(--border-color); padding-top: 2rem;">
        <button class="btn-outline" style="color: var(--text-secondary); border-color: var(--border-color);" onclick="logout()">
          <i data-lucide="log-out" style="width: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> Log Out
        </button>
      </div>
    </div>
  </div>
`;
};

// --- Render Logic ---

function renderApp() {
  const app = document.querySelector('#app');
  let content = '';

  switch (currentView) {
    case 'dashboard': content = DashboardView(); break;
    case 'transactions': content = TransactionsView(); break;
    case 'planning': content = PlanningView(); break;
    case 'wealth': content = WealthView(); break;
    case 'analytics': content = AnalyticsView(); break;
    case 'assistant': content = FinAssistantView(); break;
    case 'settings': content = SettingsView(); break;
    default: content = DashboardView();
  }

  app.innerHTML = `
    ${Sidebar()}
    <main class="main-content">
      ${AppHeader()}
      ${content}
    </main>
    <div id="toast-container" class="toast-container"></div>
  `;

  // Re-initialize icons after render
  createIcons({
    icons: {
      LayoutDashboard, Wallet, PieChart, Settings, Bell, Search, TrendingUp, TrendingDown, Zap, Coffee, ShoppingBag, Home, Car, Tv, Music, Monitor, Shield, Plane, MessageSquare, Layers, CreditCard, Filter, MoreHorizontal, X, Calendar, ChevronLeft, ChevronRight, AlertCircle, Target, Plus, Send, Tag, Trash2, Gift, Smartphone
    }
  });

  // View specific logic
  if (currentView === 'dashboard') {
    initDashboardCharts();
    initAITyping();
  }

  if (currentView === 'planning') {
    // Show a mock notification after 1.5s
    setTimeout(() => {
      showToast('Upcoming Bill Alert', 'Netflix subscription ($15.99) is due tomorrow.');
    }, 1500);
  }

  if (currentView === 'wealth' && currentWealthTab === 'debt') {
    initDebtChart();
  }

  if (currentView === 'analytics') {
    initAnalyticsCharts();
  }
}

// Global navigation function
window.navigate = (view, subView) => {
  currentView = view;
  if (view === 'wealth' && subView) {
    currentWealthTab = subView;
  }
  renderApp();
};

window.setTransactionFilter = (filter) => {
  currentTransactionFilter = filter;
  renderApp();
};

window.setWealthTab = (tab) => {
  currentWealthTab = tab;
  renderApp();
};

window.setSettingsTab = (tab) => {
  window.currentSettingsTab = tab;
  renderApp();
};

window.setSort = (field) => {
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field;
    currentSort.direction = 'asc';
  }
  renderApp();
};

window.deleteTransaction = (id) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
    renderApp();
    showToast('Success', 'Transaction deleted successfully');
  }
};

window.changeMonth = (delta) => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderApp();
};

window.addBill = () => {
  const name = prompt("Enter bill name:");
  if (!name) return;
  const amount = parseFloat(prompt("Enter amount:"));
  if (isNaN(amount)) return;
  const day = prompt("Enter day of month (1-31):");
  if (!day) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth() + 1;
  const nextDue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  state.subscriptions.push({
    id: 's' + Date.now(),
    name,
    amount,
    cycle: 'monthly',
    nextDue,
    icon: 'AlertCircle'
  });
  saveState();
  renderApp();
  showToast('Success', 'Bill added successfully');
};

function showToast(title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div style="color: var(--accent-primary);"><i data-lucide="alert-circle"></i></div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);
  createIcons({ icons: { AlertCircle }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });

  // Remove after 5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function initDashboardCharts() {
  // Category Chart
  const ctxCat = document.getElementById('categoryChart')?.getContext('2d');
  if (ctxCat) {
    // Calculate Category Totals
    const categoryTotals = {};
    state.transactions.filter(t => t.amount < 0).forEach(t => {
      const cat = t.category || 'Uncategorized';
      if (!categoryTotals[cat]) categoryTotals[cat] = 0;
      categoryTotals[cat] += Math.abs(t.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: [
            '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#ef4444'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 20, usePointStyle: true }
          }
        },
        cutout: '70%'
      }
    });
  }

  // Trend Chart (Dynamic)
  const ctxTrend = document.getElementById('trendChart')?.getContext('2d');
  if (ctxTrend) {
    // Helper to parse dates like "Nov 15" or "Today"
    const parseDate = (dateStr) => {
      const now = new Date();
      if (dateStr.includes('Today')) return now;
      if (dateStr.includes('Yesterday')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
      }
      // Assume "MMM DD" format for current year
      const d = new Date(dateStr + ", " + now.getFullYear());
      if (d > now) d.setFullYear(now.getFullYear() - 1); // Handle wrap around for past months
      return d;
    };

    // Initialize last 6 months buckets
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
      incomeData.push(0);
      expenseData.push(0);
    }

    // Aggregate Data
    state.transactions.forEach(t => {
      const date = parseDate(t.date);
      const monthIdx = 5 - (new Date().getMonth() - date.getMonth() + 12) % 12;

      if (monthIdx >= 0 && monthIdx < 6) {
        if (t.amount > 0) {
          incomeData[monthIdx] += t.amount;
        } else {
          expenseData[monthIdx] += Math.abs(t.amount);
        }
      }
    });

    new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 4,
            barPercentage: 0.6
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: '#ef4444',
            borderRadius: 4,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: '#94a3b8', usePointStyle: true }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }
}

function initAITyping() {
  const aiTextElement = document.getElementById('ai-text');
  if (!aiTextElement) return;

  // Loading State
  aiTextElement.innerHTML = '<span class="ai-loading">Analyzing finances...</span>';

  // Simulate API Call with Error Handling
  const fetchAIInsight = new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 5% chance of failure
      if (Math.random() < 0.05) {
        reject(new Error("Failed to generate insight."));
      } else {
        resolve("I've noticed a recurring subscription to 'Netflix' for $15.99. You also have a similar charge for 'Hulu'. Would you like me to analyze your streaming usage?");
      }
    }, 1000);
  });

  fetchAIInsight
    .then(message => {
      aiTextElement.innerHTML = ''; // Clear loading
      let i = 0;
      function typeWriter() {
        if (i < message.length) {
          if (aiTextElement) aiTextElement.innerHTML += message.charAt(i);
          i++;
          setTimeout(typeWriter, 25);
        } else {
          aiTextElement.classList.add('ai-typing-cursor');
        }
      }
      typeWriter();
    })
    .catch(err => {
      aiTextElement.innerHTML = `<span style="color: var(--danger);"><i data-lucide="alert-circle" style="width:14px; vertical-align:middle"></i> ${err.message} <button onclick="initAITyping()" style="background:none; border:none; color:var(--accent-primary); cursor:pointer; text-decoration:underline; margin-left:5px;">Retry</button></span>`;
      createIcons({ icons: { AlertCircle }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
    });
}

function getSmartIcon(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.match(/trip|travel|vacation|flight|fly|japan|europe|visit/)) return 'Plane';
  if (lowerName.match(/car|auto|vehicle|truck|tesla|bmw|toyota/)) return 'Car';
  if (lowerName.match(/house|home|renovation|repair|kitchen|bath|roof/)) return 'Home';
  if (lowerName.match(/emergency|fund|save|safe|security/)) return 'Shield';
  if (lowerName.match(/wedding|party|gift|birthday|celebration/)) return 'Gift';
  if (lowerName.match(/computer|laptop|tech|macbook|pc|gaming/)) return 'Monitor';
  if (lowerName.match(/phone|iphone|samsung|mobile/)) return 'Smartphone';
  if (lowerName.match(/tv|television|oled|cinema/)) return 'Tv';
  if (lowerName.match(/music|concert|festival|guitar|piano/)) return 'Music';
  return 'Target';
}

let itemToDelete = null;

window.showDeleteConfirmation = (type, id, event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  itemToDelete = { type, id };

  const modalHTML = `
    <div id="delete-modal-overlay" class="modal-overlay open" style="z-index: 9999;">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Confirm Deletion</h3>
          <button class="icon-btn" onclick="closeDeleteModal()"><i data-lucide="x"></i></button>
        </div>
        <div style="padding: 1.5rem 0; color: var(--text-secondary);">
          Are you sure you want to delete this ${type}? This action cannot be undone.
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn-outline" onclick="closeDeleteModal()">Cancel</button>
          <button class="btn-danger" onclick="confirmDelete()">Delete</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existing = document.getElementById('delete-modal-overlay');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  createIcons({ icons: { X }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
};

window.closeDeleteModal = () => {
  const overlay = document.getElementById('delete-modal-overlay');
  if (overlay) overlay.remove();
  itemToDelete = null;
};

window.confirmDelete = () => {
  if (!itemToDelete) return;

  const { type, id } = itemToDelete;

  if (type === 'goal') {
    state.goals = state.goals.filter(g => g.id !== id);
    showToast('Success', 'Goal deleted successfully');
  } else if (type === 'debt') {
    state.accounts = state.accounts.filter(a => a.id !== id);
    showToast('Success', 'Debt deleted successfully');
  } else if (type === 'transaction') {
    state.transactions = state.transactions.filter(t => t.id !== id);
    showToast('Success', 'Transaction deleted successfully');
  }

  saveState();
  renderApp();
  closeDeleteModal();
};

window.openAddGoalModal = () => {
  const modalHTML = `
    <div id="add-goal-modal-overlay" class="modal-overlay open">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Create New Goal</h3>
          <button class="icon-btn" onclick="closeAddGoalModal()"><i data-lucide="x"></i></button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Goal Name</label>
          <input type="text" id="goal-name" class="form-input" placeholder="e.g. Emergency Fund">
        </div>

        <div class="form-group">
          <label class="form-label">Target Amount</label>
          <input type="number" id="goal-target" class="form-input" placeholder="e.g. 10000">
        </div>

        <button class="btn-primary" onclick="confirmAddGoal()">Create Goal</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  createIcons({ icons: { X }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
};

window.closeAddGoalModal = () => {
  const overlay = document.getElementById('add-goal-modal-overlay');
  if (overlay) overlay.remove();
};

window.confirmAddGoal = () => {
  const name = document.getElementById('goal-name').value;
  const target = parseFloat(document.getElementById('goal-target').value);

  if (!name || isNaN(target)) {
    showToast('Error', 'Please fill in all fields correctly.');
    return;
  }

  state.goals.push({
    id: 'g' + Date.now(),
    name,
    target,
    current: 0,
    icon: getSmartIcon(name)
  });

  saveState();
  renderApp();
  closeAddGoalModal();
  showToast('Success', 'Goal added successfully');
};

window.openAddDebtModal = () => {
  const modalHTML = `
    <div id="add-debt-modal-overlay" class="modal-overlay open">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Add New Debt</h3>
          <button class="icon-btn" onclick="closeAddDebtModal()"><i data-lucide="x"></i></button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Debt Name</label>
          <input type="text" id="debt-name" class="form-input" placeholder="e.g. Visa Card">
        </div>

        <div class="form-group">
          <label class="form-label">Current Balance</label>
          <input type="number" id="debt-balance" class="form-input" placeholder="e.g. 5000">
        </div>

        <div class="form-group">
          <label class="form-label">APR (%)</label>
          <input type="number" id="debt-apr" class="form-input" placeholder="e.g. 19.99" step="0.01">
        </div>

        <div class="form-group">
          <label class="form-label">Type</label>
          <select id="debt-type" class="form-select">
            <option value="credit">Credit Card</option>
            <option value="loan">Loan</option>
          </select>
        </div>

        <button class="btn-primary" onclick="confirmAddDebt()">Add Debt</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  createIcons({ icons: { X }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
};

window.closeAddDebtModal = () => {
  const overlay = document.getElementById('add-debt-modal-overlay');
  if (overlay) overlay.remove();
};

window.confirmAddDebt = () => {
  const name = document.getElementById('debt-name').value;
  let balance = parseFloat(document.getElementById('debt-balance').value);
  const apr = parseFloat(document.getElementById('debt-apr').value);
  const type = document.getElementById('debt-type').value;

  if (!name || isNaN(balance) || isNaN(apr)) {
    showToast('Error', 'Please fill in all fields correctly.');
    return;
  }

  // Ensure balance is negative for debt
  if (balance > 0) balance = -balance;

  state.accounts.push({
    id: 'a' + Date.now(),
    name,
    type,
    balance,
    institution: 'Manual Entry',
    mask: 'XXXX',
    apr
  });

  saveState();
  renderApp();
  closeAddDebtModal();
  showToast('Success', 'Debt added successfully');
};

window.updateExtraPayment = (val) => {
  extraDebtPayment = parseInt(val);
  renderApp();
};

window.updateUser = (field, value) => {
  state.user[field] = value;
  saveState();
  // No render needed for text input usually, but if it affects other things:
  // renderApp(); 
};

window.updateSecurity = (field, value) => {
  state.user.security[field] = value;
  saveState();
};

window.triggerAvatarUpload = () => {
  document.getElementById('avatar-upload').click();
};

window.handleAvatarUpload = (input) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      state.user.avatar = e.target.result;
      saveState();
      renderApp();
    };
    reader.readAsDataURL(input.files[0]);
  }
};

window.logout = () => {
  if (confirm('Are you sure you want to log out?')) {
    location.reload(); // Simple reload for now
  }
};

window.deleteAccount = () => {
  if (confirm('Are you sure? This action cannot be undone.')) {
    localStorage.removeItem('novaState');
    location.reload();
  }
};

window.resetData = () => {
  if (confirm('Reset all data to default demo state?')) {
    localStorage.removeItem('novaState');
    const initial = generateData();
    // Keep the current user name/avatar if desired, but for a full reset, we just reload.
    // But let's just reload to force a fresh state generation.
    location.reload();
  }
};

function initDebtChart() {
  const ctx = document.getElementById('debtChart')?.getContext('2d');
  if (!ctx) return;

  const totalDebt = Math.abs(state.accounts.filter(a => a.type === 'loan' || a.type === 'credit').reduce((acc, a) => acc + a.balance, 0));
  const minPayment = totalDebt * 0.02;
  const monthlyPayment = minPayment + extraDebtPayment;

  const labels = [];
  const data = [];
  let remaining = totalDebt;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonthIdx = new Date().getMonth();

  for (let i = 0; i < 12; i++) {
    labels.push(months[(currentMonthIdx + i) % 12]);
    data.push(remaining);
    remaining = Math.max(0, remaining - monthlyPayment);
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Remaining Debt',
        data: data,
        backgroundColor: '#ef4444',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function initAnalyticsCharts() {
  // Category Chart
  const ctxCat = document.getElementById('categoryChart')?.getContext('2d');
  if (ctxCat) {
    // Calculate Category Totals
    const categoryTotals = {};
    state.transactions.filter(t => t.amount < 0).forEach(t => {
      const cat = t.category || 'Uncategorized';
      if (!categoryTotals[cat]) categoryTotals[cat] = 0;
      categoryTotals[cat] += Math.abs(t.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: [
            '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#ef4444'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 20, usePointStyle: true }
          }
        },
        cutout: '70%'
      }
    });
  }

  // Trend Chart (Dynamic)
  const ctxTrend = document.getElementById('trendChart')?.getContext('2d');
  if (ctxTrend) {
    // Helper to parse dates like "Nov 15" or "Today"
    const parseDate = (dateStr) => {
      const now = new Date();
      if (dateStr.includes('Today')) return now;
      if (dateStr.includes('Yesterday')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
      }
      // Assume "MMM DD" format for current year
      const d = new Date(dateStr + ", " + now.getFullYear());
      if (d > now) d.setFullYear(now.getFullYear() - 1); // Handle wrap around for past months
      return d;
    };

    // Initialize last 6 months buckets
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
      incomeData.push(0);
      expenseData.push(0);
    }

    // Aggregate Data
    state.transactions.forEach(t => {
      const date = parseDate(t.date);
      const monthIdx = 5 - (new Date().getMonth() - date.getMonth() + 12) % 12;

      if (monthIdx >= 0 && monthIdx < 6) {
        if (t.amount > 0) {
          incomeData[monthIdx] += t.amount;
        } else {
          expenseData[monthIdx] += Math.abs(t.amount);
        }
      }
    });

    new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 4,
            barPercentage: 0.6
          },
          {
            label: 'Expense',
            data: expenseData,
            backgroundColor: '#ef4444',
            borderRadius: 4,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: '#94a3b8', usePointStyle: true }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
            beginAtZero: true
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }
}

// --- Search Logic ---

window.toggleSearch = () => {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('global-search-input');

  if (!overlay) return;

  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.style.display = 'none', 200);
  } else {
    overlay.style.display = 'flex';
    // Force reflow
    overlay.offsetHeight;
    overlay.classList.add('active');
    input.value = '';
    input.focus();
    renderSearchResults('');
  }
};

window.performSearch = (query) => {
  renderSearchResults(query);
};

function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (!query.trim()) {
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
        <i data-lucide="search" size="32" style="margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>Type to search transactions, bills, or goals...</p>
      </div>
    `;
    createIcons({ icons: { Search }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
    return;
  }

  const lowerQuery = query.toLowerCase();
  const results = [];

  // Search Transactions
  state.transactions.forEach(t => {
    if (t.name.toLowerCase().includes(lowerQuery) || t.category.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'Transaction',
        title: t.name,
        subtitle: `${t.date} • $${Math.abs(t.amount).toFixed(2)}`,
        icon: t.icon,
        action: () => {
          navigate('transactions');
          window.setTransactionFilter('All');
          toggleSearch();
        }
      });
    }
  });

  // Search Subscriptions
  state.subscriptions.forEach(s => {
    if (s.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'Subscription',
        title: s.name,
        subtitle: `Due ${s.nextDue} • $${s.amount}`,
        icon: s.icon,
        action: () => {
          navigate('planning');
          toggleSearch();
        }
      });
    }
  });

  // Search Goals
  state.goals.forEach(g => {
    if (g.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'Goal',
        title: g.name,
        subtitle: `Target: $${g.target}`,
        icon: g.icon,
        action: () => {
          navigate('wealth');
          window.setWealthTab('goals');
          toggleSearch();
        }
      });
    }
  });

  if (results.length === 0) {
    container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No results found for "${query}"</div>`;
    return;
  }

  container.innerHTML = results.map((r, index) => `
    <div class="search-result-item" onclick="window.handleSearchResultClick(${index})">
      <div class="search-result-icon">
        <i data-lucide="${r.icon.toLowerCase()}"></i>
      </div>
      <div class="search-result-info">
        <div class="search-result-title">${r.title}</div>
        <div class="search-result-subtitle">${r.type} • ${r.subtitle}</div>
      </div>
      <i data-lucide="chevron-right" size="16" style="color: var(--text-secondary);"></i>
    </div>
  `).join('');

  // Store actions temporarily
  window.searchActions = results.map(r => r.action);

  createIcons({
    icons: {
      Search, ChevronRight, ShoppingBag, Zap, Tv, Car, Home, Music, Monitor, Shield, Plane, Target, CreditCard
    },
    nameAttr: 'data-lucide',
    attrs: { class: "lucide" }
  });
}

window.handleSearchResultClick = (index) => {
  if (window.searchActions && window.searchActions[index]) {
    window.searchActions[index]();
  }
};

// Inject Search Modal
const searchModalHTML = `
  <div id="search-overlay" class="search-modal-overlay" onclick="if(event.target === this) toggleSearch()">
    <div class="search-modal">
      <div class="search-header">
        <i data-lucide="search" style="color: var(--text-secondary);"></i>
        <input type="text" id="global-search-input" class="search-input" placeholder="Search..." oninput="performSearch(this.value)" autocomplete="off">
        <button class="icon-btn" onclick="toggleSearch()"><i data-lucide="x"></i></button>
      </div>
      <div id="search-results" class="search-results"></div>
    </div>
  </div>
`;

document.body.insertAdjacentHTML('beforeend', searchModalHTML);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('search-overlay');
    if (overlay && overlay.classList.contains('active')) {
      toggleSearch();
    }
  }
});

// Initial Render
renderApp();

// --- Smart Tagging Logic ---

window.openTagGoalModal = (tId) => {
  const transaction = state.transactions.find(t => t.id == tId);
  if (!transaction) return;

  const goals = state.goals;
  if (goals.length === 0) {
    showToast('No Goals', 'Create a savings goal first.');
    return;
  }

  const modalHTML = `
    <div id="tag-modal-overlay" class="modal-overlay open">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Tag to Savings Goal</h3>
          <button class="icon-btn" onclick="closeTagModal()"><i data-lucide="x"></i></button>
        </div>
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
          Tagging <strong>${transaction.name}</strong> ($${Math.abs(transaction.amount)}) will contribute this amount to your goal.
        </p>
        <div class="form-group">
          <label class="form-label">Select Goal</label>
          <select id="tag-goal-select" class="form-select">
            ${goals.map(g => `<option value="${g.id}">${g.name} (Current: $${g.current})</option>`).join('')}
          </select>
        </div>
        <button class="btn-primary" onclick="confirmTagGoal('${tId}')">Tag and Contribute</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  createIcons({ icons: { X }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
};

window.openTagDebtModal = (tId) => {
  const transaction = state.transactions.find(t => t.id == tId);
  if (!transaction) return;

  const debts = state.accounts.filter(a => a.type === 'credit' || a.type === 'loan');
  if (debts.length === 0) {
    showToast('No Debts', 'No debt accounts found.');
    return;
  }

  const modalHTML = `
    <div id="tag-modal-overlay" class="modal-overlay open">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Tag as Debt Payment</h3>
          <button class="icon-btn" onclick="closeTagModal()"><i data-lucide="x"></i></button>
        </div>
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">
          Tagging <strong>${transaction.name}</strong> ($${Math.abs(transaction.amount)}) will reduce the balance of the selected debt.
        </p>
        <div class="form-group">
          <label class="form-label">Select Debt Account</label>
          <select id="tag-debt-select" class="form-select">
            ${debts.map(d => `<option value="${d.id}">${d.name} (Balance: $${d.balance})</option>`).join('')}
          </select>
        </div>
        <button class="btn-primary" onclick="confirmTagDebt('${tId}')">Tag as Payment</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  createIcons({ icons: { X }, nameAttr: 'data-lucide', attrs: { class: "lucide" } });
};

window.closeTagModal = () => {
  const overlay = document.getElementById('tag-modal-overlay');
  if (overlay) overlay.remove();
};

window.confirmTagGoal = (tId) => {
  const goalId = document.getElementById('tag-goal-select').value;
  const transaction = state.transactions.find(t => t.id == tId);
  const goal = state.goals.find(g => g.id === goalId);

  if (transaction && goal) {
    // 1. Contribute to Goal
    const amount = Math.abs(transaction.amount);
    goal.current += amount;

    // 2. Recategorize Transaction
    transaction.category = `Goal: ${goal.name}`;
    transaction.icon = 'Target'; // Update icon to reflect goal

    // 3. Create AI Rule
    if (!state.rules) state.rules = [];
    const rule = {
      id: 'r' + Date.now(),
      pattern: transaction.name,
      type: 'goal',
      targetId: goalId,
      targetName: goal.name
    };
    state.rules.push(rule);

    saveState();
    renderApp();
    closeTagModal();
    showToast('Smart Tagging', `Tagged to "${goal.name}" and AI rule created!`);
  }
};

window.confirmTagDebt = (tId) => {
  const debtId = document.getElementById('tag-debt-select').value;
  const transaction = state.transactions.find(t => t.id == tId);
  const debt = state.accounts.find(a => a.id === debtId);

  if (transaction && debt) {
    // 1. Reduce Debt Balance (Debt accounts usually have negative balance, so adding positive amount reduces debt magnitude)
    // However, in this app, it seems debt is displayed as positive in some views but stored as negative?
    // Let's assume standard accounting: Debt is negative. Payment (expense) is negative.
    // But a "Payment" to a credit card is a transfer.
    // Here we are tagging an *expense* (e.g. "Payment to Visa") as a debt payment.
    // So we should effectively transfer this amount to the debt account.
    // If debt balance is -500, and we pay 100. New balance is -400.
    // So we add abs(amount) to the debt balance.
    const amount = Math.abs(transaction.amount);
    debt.balance += amount;

    // 2. Recategorize Transaction
    transaction.category = 'Debt Payment';
    transaction.icon = 'CreditCard';

    // 3. Create AI Rule
    if (!state.rules) state.rules = [];
    const rule = {
      id: 'r' + Date.now(),
      pattern: transaction.name,
      type: 'debt',
      targetId: debtId,
      targetName: debt.name
    };
    state.rules.push(rule);

    saveState();
    renderApp();
    closeTagModal();
    showToast('Smart Tagging', `Tagged as payment for "${debt.name}" and AI rule created!`);
  }
};

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
