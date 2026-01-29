/**
 * Calculate total sales from all transactions
 */
export const calculateTotalSales = (transactions) => {
    return transactions.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
};

/**
 * Filter transactions by period (Daily, Weekly, Monthly)
 */
export const filterByPeriod = (transactions, period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

        if (period === 'Daily') {
            return transactionDay.getTime() === today.getTime();
        } else if (period === 'Weekly') {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return transactionDay >= weekAgo;
        } else if (period === 'Monthly') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return transactionDay >= monthAgo;
        }
        return true;
    });
};

/**
 * Get sales aggregated by product
 */
export const getSalesByProduct = (transactions) => {
    const productSales = {};

    transactions.forEach(transaction => {
        if (!productSales[transaction.productName]) {
            productSales[transaction.productName] = {
                productName: transaction.productName,
                quantity: 0,
                totalRevenue: 0,
            };
        }
        productSales[transaction.productName].quantity += transaction.quantity;
        productSales[transaction.productName].totalRevenue += transaction.totalPrice;
    });

    return Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Get sales aggregated by category
 */
export const getSalesByCategory = (transactions, products) => {
    const categorySales = {};

    transactions.forEach(transaction => {
        const product = products.find(p => p.itemName === transaction.productName);
        const category = product ? product.category : 'Unknown';

        if (!categorySales[category]) {
            categorySales[category] = 0;
        }
        categorySales[category] += transaction.totalPrice;
    });

    return categorySales;
};

/**
 * Get top selling items by quantity
 */
export const getTopSellingItems = (transactions, limit = 5) => {
    const productSales = getSalesByProduct(transactions);
    return productSales.slice(0, limit);
};

/**
 * Prepare trend data for line chart
 */
export const prepareTrendData = (transactions, period) => {
    const data = {};

    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        let key;

        if (period === 'Daily') {
            // Group by hour for daily view
            key = `${date.getHours()}:00`;
        } else if (period === 'Weekly') {
            // Group by day for weekly view
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            key = days[date.getDay()];
        } else if (period === 'Monthly') {
            // Group by date for monthly view
            key = date.getDate().toString();
        }

        if (!data[key]) {
            data[key] = 0;
        }
        data[key] += transaction.totalPrice;
    });

    return data;
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

/**
 * Format date in Asia/Bangkok timezone
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok',
    });
};
