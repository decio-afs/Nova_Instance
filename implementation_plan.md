# Nova - Implementation Plan

## Phase 1: Foundation & Rebranding
- [x] **Rename & Rebrand**: Update app title, logo, and color scheme to match "Nova" identity.
- [x] **State Management Overhaul**: Refactor the simple `state` object into a more robust store pattern to handle Accounts, Transactions, Subscriptions, Goals, and User Settings.
- [x] **Mock Data Service**: Create a comprehensive data generator to simulate Plaid connections (multiple banks, investment accounts) and realistic transaction history.

## Phase 2: AI-Powered Data Aggregation (Dashboard 2.0)
- [ ] **Multi-Institution View**: Create a sidebar or top-bar section to switch between "All Accounts" or specific linked banks (Chase, Wells Fargo, etc.).
- [x] **Unified Dashboard**: Redesign the main view to show aggregated Net Worth, Total Cash, and Debt summaries.
- [x] **Transaction Manager**:
    - [x] Implement "Smart Categorization" UI (visual indicators of AI confidence).
    - [x] Add "Split Transaction" modal (UI only).
    - [x] Add "User-Guided Learning" (mocked: if user changes category, show "Fin will remember this" toast).

## Phase 3: Predictive Financial Intelligence
- [x] **Recurring Bill Detection**:
    - [x] Create a "Bills & Subscriptions" view.
    - [x] Implement logic to scan mock transactions and identify recurring patterns.
- [x] **Financial Calendar**:
    - [x] Build a calendar view highlighting upcoming bill due dates.
- [x] **"Heads Up" Alerts**:
    - [x] Add a notification center for "Rent due in 5 days" or "Low balance" alerts.
- [x] **Cash Flow Forecast**:
    - Create a "Safe-to-Spend" widget that calculates daily budget based on remaining income - upcoming bills.

## Phase 4: Holistic Financial Planning
- [x] **Net Worth Tracker**:
    - Implement a dedicated "Wealth" page.
    - Add Assets vs. Liabilities breakdown.
    - Add a time-series chart for Net Worth growth.
- [x] **Debt Payoff Planner**:
    - [x] Create a "Debt Free" tool.
    - [x] Implement the calculator logic for "Avalanche" vs "Snowball" methods.
    - [x] Add interactive sliders for "Extra Payment" simulation.
- [x] **Savings Goals**:
    - [x] Create "Goal Buckets" UI.
    - [x] Visual progress bars for specific goals (Vacation, Car).

## Phase 5: Conversational AI Assistant ("Fin")
- [x] **Chat Interface**: Build a floating or dedicated chat window for "Fin".
- [x] **Natural Language Logic (Simulated)**:
    - [x] Implement keyword matching to answer queries like "How much did I spend on Uber?".
    - [x] Implement "Contextual Advice" triggers (e.g., if spending > average, Fin suggests a budget).

## Phase 6: Security & Settings
- [x] **Security UI**:
    - [x] Create a mock Login/MFA screen.
    - [x] Add "Biometric" toggle in settings.
- [x] **Data Privacy**:
    - [x] Add "Hard Delete" button in settings with a 7-day countdown simulation.

---

**Technical Strategy**:
Since we don't have a live backend or Plaid API keys, we will build a **"Local-First" architecture**. All data will be generated and stored in the browser's `localStorage` or memory, allowing the user to fully interact with the features as if they were live.
