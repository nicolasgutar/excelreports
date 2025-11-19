// dbQueries.js
const db = require('./dbConnector');

/**
 * Get income by category for P&L report - only categories with totals > 0
 */
async function getIncomeData(userId, startDate, endDate, accountCategory = null) {
    let query = `
    SELECT 
        COALESCE(subcategory, category) as category_name,
        SUM(amount) as total
    FROM "Transaction"
    WHERE "userId" = $1
      AND category IS NOT NULL
      AND amount > 0
    `;

    const params = [userId];
    let paramIndex = 2;

    if (accountCategory) {
        query += ` AND "accountCategory" = $${paramIndex++}`;
        params.push(accountCategory);
    }

    if (startDate && endDate) {
        query += ` AND date >= $${paramIndex++} AND date <= $${paramIndex++}`;
        params.push(startDate, endDate);
    }

    query += ` GROUP BY COALESCE(subcategory, category) HAVING SUM(amount) > 0`;

    const results = await db.executeQuery(query, params);

    const income = {};
    for (const row of results) {
        income[row.category_name] = parseFloat(row.total);
    }

    return income;
}

/**
 * Get expenses by category and subcategory for P&L report - only categories with totals > 0
 */
async function getExpenseData(userId, startDate, endDate, accountCategory = null) {
    let query = `
    SELECT 
        category,
        subcategory,
        SUM(ABS(amount)) as total
    FROM "Transaction"
    WHERE "userId" = $1
      AND category IS NOT NULL
      AND amount < 0
    `;

    const params = [userId];
    let paramIndex = 2;

    if (accountCategory) {
        query += ` AND "accountCategory" = $${paramIndex++}`;
        params.push(accountCategory);
    }

    if (startDate && endDate) {
        query += ` AND date >= $${paramIndex++} AND date <= $${paramIndex++}`;
        params.push(startDate, endDate);
    }

    query += ` GROUP BY category, subcategory HAVING SUM(ABS(amount)) > 0`;

    const results = await db.executeQuery(query, params);

    const expensesByCategory = {};
    for (const row of results) {
        const category = row.category;
        const subcategory = row.subcategory;
        const amount = parseFloat(row.total);

        if (!expensesByCategory[category]) {
            expensesByCategory[category] = {
                total: 0,
                subcategories: {}
            };
        }

        expensesByCategory[category].total += amount;

        // Solo agregar subcategorías si realmente existen (no son null/undefined)
        if (subcategory && subcategory.trim() !== '') {
            expensesByCategory[category].subcategories[subcategory] = amount;
        }
        // NO crear subcategoría "Other" para transacciones sin subcategoría
    }

    return expensesByCategory;
}

/**
 * Get transaction data for transactions report
 */
async function getTransactionData(userId, startDate, endDate, limit = 1000) {
    let query = `
    SELECT 
        date,
        description as "Transaction Name",
        category as "Category",
        subcategory as "Subcategory",
        amount as "Amount",
        "merchantName" as "Merchant",
        description as "Description",
        "accountFrom" as "Account",
        CASE WHEN amount > 0 THEN 'Income' ELSE 'Expense' END as "Status"
    FROM "Transaction"
    WHERE "userId" = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (startDate && endDate) {
        query += ` AND date >= $${paramIndex++} AND date <= $${paramIndex++}`;
        params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const results = await db.executeQuery(query, params);
    return results;
}

module.exports = {
    getIncomeData,
    getExpenseData,
    getTransactionData
};
