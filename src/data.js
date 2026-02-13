// Mock Data Service for Finwise AI

export const generateData = () => {
    return {
        user: {
            name: "Decio",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Decio",
            netWorth: 142500.00,
            security: {
                mfaEnabled: true,
                biometricEnabled: true
            }
        },
        accounts: [
            { id: 'a1', name: 'Chase Total Checking', type: 'checking', balance: 4250.00, institution: 'Chase', mask: '1234' },
            { id: 'a2', name: 'Amex Gold', type: 'credit', balance: -850.00, institution: 'American Express', mask: '5678', apr: 24.99 },
            { id: 'a3', name: 'Vanguard Index Fund', type: 'investment', balance: 135000.00, institution: 'Vanguard', mask: '9012' },
            { id: 'a4', name: 'Car Loan', type: 'loan', balance: -15000.00, institution: 'Wells Fargo', mask: '3456', apr: 5.49 },
            { id: 'a5', name: 'Student Loan', type: 'loan', balance: -2000.00, institution: 'Navient', mask: '1111', apr: 4.5 },
            { id: 'a6', name: 'Visa Signature', type: 'credit', balance: -3000.00, institution: 'Chase', mask: '2222', apr: 22.0 }
        ],
        transactions: [
            { id: 1, name: "Whole Foods Market", date: "Today, 10:23 AM", amount: -145.50, category: "Groceries", accountId: 'a2', icon: "ShoppingBag", pending: true },
            { id: 2, name: "Tech Corp Salary", date: "Yesterday, 4:00 PM", amount: 4200.00, category: "Income", accountId: 'a1', icon: "Zap", pending: false },
            { id: 3, name: "Netflix Subscription", date: "Nov 18, 6:30 PM", amount: -15.99, category: "Entertainment", accountId: 'a2', icon: "Tv", recurring: true },
            { id: 4, name: "Shell Station", date: "Nov 15, 9:00 AM", amount: -45.00, category: "Transport", accountId: 'a2', icon: "Car", pending: false },
            { id: 5, name: "Uber Ride", date: "Nov 14, 11:15 PM", amount: -24.50, category: "Transport", accountId: 'a2', icon: "Car", pending: false },
            { id: 6, name: "Electric Bill", date: "Nov 12, 10:00 AM", amount: -120.00, category: "Utilities", accountId: 'a1', icon: "Home", recurring: true },
            // Generate historical data
            ...Array.from({ length: 50 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - Math.floor(i / 10)); // Spread over last 5 months
                date.setDate(Math.floor(Math.random() * 28) + 1);

                const isIncome = Math.random() > 0.8;
                const amount = isIncome ? 2000 + Math.random() * 1000 : -(20 + Math.random() * 150);
                const categories = ["Groceries", "Transport", "Entertainment", "Dining", "Utilities", "Shopping"];
                const category = isIncome ? "Income" : categories[Math.floor(Math.random() * categories.length)];

                return {
                    id: 'h' + i,
                    name: isIncome ? "Freelance Work" : ["Target", "Starbucks", "Amazon", "Uber", "Trader Joe's"][Math.floor(Math.random() * 5)],
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    amount: parseFloat(amount.toFixed(2)),
                    category: category,
                    accountId: isIncome ? 'a1' : 'a2',
                    icon: isIncome ? "Zap" : "CreditCard",
                    pending: false
                };
            })
        ],
        subscriptions: [
            { id: 's1', name: 'Netflix', amount: 15.99, cycle: 'monthly', nextDue: '2023-12-18', icon: 'Tv' },
            { id: 's2', name: 'Spotify', amount: 9.99, cycle: 'monthly', nextDue: '2023-12-20', icon: 'Music' },
            { id: 's3', name: 'Adobe Creative Cloud', amount: 54.99, cycle: 'monthly', nextDue: '2023-12-05', icon: 'Monitor' }
        ],
        goals: [
            { id: 'g1', name: 'Emergency Fund', target: 10000, current: 6500, icon: 'Shield' },
            { id: 'g2', name: 'Japan Trip', target: 5000, current: 1200, icon: 'Plane' }
        ],
        insights: {
            monthlySpend: 2450.00,
            safeToSpend: 45.00, // Daily
            predictedBills: 180.97 // Next 7 days
        }
    };
};
