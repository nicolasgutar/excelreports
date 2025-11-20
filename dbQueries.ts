import db from './dbConnector.js';

interface IncomeData {
    [category: string]: number;
}

interface ExpenseSubcategories {
    [subcategory: string]: number;
}

interface ExpenseData {
    [category: string]: {
        total: number;
        subcategories?: ExpenseSubcategories;
    };
}

export type Transaction = {
    id: string;
    amount: number;
    date: string;
    description: string;
    category: string;
};

async function getIncomeData(
    userId: string,
    startDate: string | null,
    endDate: string | null,
    accountCategory: string | null = null
): Promise<IncomeData> {
    let query = `
    SELECT 
        COALESCE(subcategory, category) as category_name,
        SUM(amount) as total
    FROM "Transaction"
    WHERE "userId" = $1
      AND category IS NOT NULL
      AND amount > 0
    `;

    const params: (string | number | null)[] = [userId];
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

    const income: IncomeData = {};
    for (const row of results) {
        income[row.category_name] = parseFloat(row.total);
    }

    return income;
}

async function getExpenseData(
    userId: string,
    startDate: string | null,
    endDate: string | null,
    accountCategory: string | null = null
): Promise<ExpenseData> {
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

    const params: (string | number | null)[] = [userId];
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

    const expensesByCategory: ExpenseData = {};
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

        if (subcategory && subcategory.trim() !== '') {
            expensesByCategory[category].subcategories![subcategory] = amount;
        }
    }

    return expensesByCategory;
}

async function getTransactionData(
    userId: string,
    startDate: string | null,
    endDate: string | null,
    limit: number = 1000
): Promise<Transaction[]> {
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

    const params: (string | number | null)[] = [userId];
    let paramIndex = 2;

    if (startDate && endDate) {
        query += ` AND date >= $${paramIndex++} AND date <= $${paramIndex++}`;
        params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const results = await db.executeQuery(query, params);
    return results as Transaction[];
}

export {
    getIncomeData,
    getExpenseData,
    getTransactionData
};