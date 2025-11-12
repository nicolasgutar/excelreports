// dbQueries.js
const db = require('./dbConnector');

/**
 * Get transactions for a specific user with optional date filtering.
 */
async function getUserTransactions(userId, startDate = null, endDate = null, limit = null) {
    let query = `
    SELECT id, "userId", "accountFrom", name, amount, description, "receiptUrl",
           category, "categoryId", subcategory, "subcategoryId", "plaidCategory",
           "plaidSubcategory", "plaidPrimary", "plaidDetailed", "plaidConfidenceLevel",
           "plaidCategoryUrl", "transactionId", "accountId", "isoCurrencyCode",
           "unofficialCurrencyCode", date, year, month, "merchantName", "merchantLogo",
           "paymentChannel", "paymentMeta", "referenceNumber", "transactionCode",
           "accountCategory", status, "createdAt", "updatedAt"
    FROM "Transaction"
    WHERE "userId" = $1
      AND category IS NOT NULL
    `;

    const params = [userId];
    let paramIndex = 2;

    if (startDate && endDate) {
        query += ` AND date >= $${paramIndex++} AND date <= $${paramIndex++}`;
        params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC, "createdAt" DESC`;

    if (limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(limit);
    }

    const results = await db.executeQuery(query, params);

    // No need to parse JSON, node-postgres does it automatically
    return results;
}

/**
 * Get transactions grouped by category with computed totals for P&L report.
 */
async function getTransactionsGroupedByCategory(userId, startDate = null, endDate = null, accountCategory = null) {
    let incomeQuery = `
    SELECT 
        COALESCE(subcategory, category) as category_name,
        SUM(amount) as total
    FROM "Transaction"
    WHERE "userId" = $1
      AND category IS NOT NULL
      AND amount > 0
    `;

    let expenseQuery = `
    SELECT 
        COALESCE(subcategory, category) as category_name,
        SUM(ABS(amount)) as total
    FROM "Transaction"
    WHERE "userId" = $1
      AND category IS NOT NULL
      AND amount < 0
    `;

    const params = [userId];
    let paramIndex = 2;

    if (accountCategory) {
        const accountFilter = ` AND "accountCategory" = $${paramIndex++}`;
        incomeQuery += accountFilter;
        expenseQuery += accountFilter;
        params.push(accountCategory);
    }

    if (startDate && endDate) {
        const dateFilter = ` AND date >= $${paramIndex++} AND date <= $${paramIndex++}`;
        incomeQuery += dateFilter;
        expenseQuery += dateFilter;
        params.push(startDate, endDate);
    }

    incomeQuery += " GROUP BY COALESCE(subcategory, category)";
    expenseQuery += " GROUP BY COALESCE(subcategory, category)";

    // Execute queries in parallel
    const [incomeResults, expenseResults] = await Promise.all([
        db.executeQuery(incomeQuery, params),
        db.executeQuery(expenseQuery, params)
    ]);

    const incomeSummary = {};
    for (const row of incomeResults) {
        incomeSummary[row.category_name] = parseFloat(row.total) || 0.0;
    }

    const expenseSummary = {};
    for (const row of expenseResults) {
        expenseSummary[row.category_name] = parseFloat(row.total) || 0.0;
    }

    return {
        income: incomeSummary,
        expenses: expenseSummary
    };
}

module.exports = {
    getUserTransactions,
    getTransactionsGroupedByCategory
};
