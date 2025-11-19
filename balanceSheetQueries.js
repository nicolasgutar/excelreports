// balanceSheetQueries.js
const db = require('./dbConnector');

async function getCashBalance(userId, startDate = null, endDate = null) {
    // Para balance sheet, normalmente queremos el balance al final del período
    let query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_cash
    FROM "Account"
    WHERE user_id = $1 AND type = 'checking'
    `;

    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_cash) || 0.0;
}

async function getAccountsReceivable(userId, startDate = null, endDate = null) {
    let query, params;

    if (endDate) {
        // Facturas pendientes hasta la fecha de corte
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_receivable
        FROM "Invoice"
        WHERE "userId" = $1 AND "dueDate" <= $2 AND status != 'Paid'
        `;
        params = [userId, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_receivable
        FROM "Invoice"
        WHERE "userId" = $1 AND "dueDate" > NOW() AND status != 'Paid'
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_receivable) || 0.0;
}

async function getOtherReceivables(userId, startDate = null, endDate = null) {
    // Implementar lógica real basada en transacciones pendientes
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_other_receivable
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 
          AND (category LIKE '%Loan%' OR category LIKE '%Advance%' OR category LIKE '%Deposit%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_other_receivable
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 
          AND (category LIKE '%Loan%' OR category LIKE '%Advance%' OR category LIKE '%Deposit%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_other_receivable) || 0.0;
}

async function getBusinessSavings(userId, startDate = null, endDate = null) {
    let query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_savings
    FROM "Account"
    WHERE user_id = $1 AND type = 'savings'
    `;

    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_savings) || 0.0;
}

async function getBusinessEquipment(userId, startDate = null, endDate = null) {
    let query, params;
    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_equipment
        FROM "Transaction"
        WHERE "userId" = $1 AND category = 'Business Equipment' AND amount < 0
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_equipment
        FROM "Transaction"
        WHERE "userId" = $1 AND category = 'Business Equipment' AND amount < 0
        `;
        params = [userId];
    }
    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_equipment) || 0.0;
}

async function getInventory(userId, startDate = null, endDate = null) {
    let query, params;

    if (startDate && endDate) {
        // Calcular inventario basado en compras - ventas en el período
        query = `
        SELECT 
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_inventory
        FROM "Transaction"
        WHERE "userId" = $1 
          AND (category ILIKE '%inventory%' OR category ILIKE '%marketplace%' OR category ILIKE '%supplies%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT 
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_inventory
        FROM "Transaction"
        WHERE "userId" = $1 
          AND (category ILIKE '%inventory%' OR category ILIKE '%marketplace%' OR category ILIKE '%supplies%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    const inventory = parseFloat(result?.total_inventory) || 0.0;
    return Math.max(inventory, 0); // El inventario no puede ser negativo
}

async function getPrepaidExpenses(userId, startDate = null, endDate = null) {
    // Implementar lógica real para gastos prepagados
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_prepaid
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND (category ILIKE '%prepaid%' OR category ILIKE '%subscription%' OR category ILIKE '%insurance%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_prepaid
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND (category ILIKE '%prepaid%' OR category ILIKE '%subscription%' OR category ILIKE '%insurance%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_prepaid) || 0.0;
}

async function getCreditCardDebt(userId, startDate = null, endDate = null) {
    let query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_debt
    FROM "Account"
    WHERE user_id = $1 AND (type = 'credit' OR type = 'debt')
    `;

    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_debt) || 0.0;
}

async function getBusinessLoans(userId, startDate = null, endDate = null) {
    // Implementar lógica real para préstamos comerciales
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_loans
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND category = 'Loan Payments'
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_loans
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND category = 'Loan Payments'
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_loans) || 0.0;
}

async function getTaxesPayable(userId, startDate = null, endDate = null) {
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_taxes
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND category ILIKE '%tax%'
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_taxes
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND category ILIKE '%tax%'
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_taxes) || 0.0;
}

/**
 * Main function to get balance sheet data
 */
async function getBalanceSheetData(userId, startDate = null, endDate = null) {
    // Get all balance sheet components
    const data = {
        "Cash": await getCashBalance(userId, startDate, endDate),
        "Accounts Receivable": await getAccountsReceivable(userId, startDate, endDate),
        "Other Receivables": await getOtherReceivables(userId, startDate, endDate),
        "Business Savings/Reserves": await getBusinessSavings(userId, startDate, endDate),
        "Business Equipment (Asset)": await getBusinessEquipment(userId, startDate, endDate),
        "Inventory": await getInventory(userId, startDate, endDate),
        "Prepaid Expenses": await getPrepaidExpenses(userId, startDate, endDate),
        "Loan Payments / Credit Cards": await getCreditCardDebt(userId, startDate, endDate),
        "Business Loans 1": await getBusinessLoans(userId, startDate, endDate),
        "Business Loans 2": 0, // Placeholder for second loan category
        "Taxes Payable": await getTaxesPayable(userId, startDate, endDate)
    };

    return data;
}

module.exports = {
    getCashBalance,
    getAccountsReceivable,
    getOtherReceivables,
    getBusinessSavings,
    getBusinessEquipment,
    getInventory,
    getPrepaidExpenses,
    getCreditCardDebt,
    getBusinessLoans,
    getTaxesPayable,
    getBalanceSheetData
};
