// balanceSheetQueries.js
const db = require('./dbConnector');

async function getCashBalance(userId) {
    const query = `
    SELECT COALESCE(SUM(balance), 0) as total_cash
    FROM "Account"
    WHERE user_id = $1 AND type = 'checking'
    `;
    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_cash) || 0.0;
}

async function getAccountsReceivable(userId) {
    const query = `
    SELECT COALESCE(SUM(amount), 0) as total_receivable
    FROM "Invoice"
    WHERE "userId" = $1 AND "dueDate" > NOW() AND status != 'Paid'
    `;
    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_receivable) || 0.0;
}

function getOtherReceivables(userId) {
    return Promise.resolve(0.0); // Placeholder
}

async function getBusinessSavings(userId) {
    const query = `
    SELECT COALESCE(SUM(balance), 0) as total_savings
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
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_inventory
        FROM "Transaction"
        WHERE "userId" = $1 AND (category LIKE '%Inventory%' OR category LIKE '%marketplace%')
          AND amount < 0 AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_inventory
        FROM "Transaction"
        WHERE "userId" = $1 AND (category LIKE '%Inventory%' OR category LIKE '%marketplace%')
          AND amount < 0
        `;
        params = [userId];
    }
    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_inventory) || 0.0;
}

function getPrepaidExpenses(userId) {
    return Promise.resolve(0.0); // Placeholder
}

async function getCreditCardDebt(userId) {
    const query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_debt
    FROM "Account"
    WHERE user_id = $1 AND (type = 'credit' OR type = 'debt')
    `;
    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_debt) || 0.0;
}

function getBusinessLoans(userId) {
    return Promise.resolve(0.0); // Placeholder
}

async function getTaxesPayable(userId, startDate = null, endDate = null) {
    let query, params;
    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0
        `;
        params = [userId];
    }
    const result = await db.executeSingle(query, params);
    const total_income = parseFloat(result?.total_income) || 0.0;
    return total_income * 0.33;
}

function getOwnerContribution(userId) {
    return Promise.resolve(0.0); // Placeholder
}

function getOwnerWithdrawal(userId, startDate = null, endDate = null) {
    return Promise.resolve(0.0); // Placeholder
}

/**
 * Get all balance sheet data in parallel.
 */
async function getAllBalanceSheetData(userId, startDate = null, endDate = null) {
    console.log(`\n--- Fetching Balance Sheet Data for User: ${userId} ---`);

    const [
        Cash, AccountsReceivable, OtherReceivables, BusinessSavings,
        BusinessEquipment, Inventory, PrepaidExpenses, CreditCardDebt,
        BusinessLoans, TaxesPayable, OwnerContribution, OwnerWithdrawal
    ] = await Promise.all([
        getCashBalance(userId),
        getAccountsReceivable(userId),
        getOtherReceivables(userId),
        getBusinessSavings(userId),
        getBusinessEquipment(userId, startDate, endDate),
        getInventory(userId, startDate, endDate),
        getPrepaidExpenses(userId),
        getCreditCardDebt(userId),
        getBusinessLoans(userId),
        getTaxesPayable(userId, startDate, endDate),
        getOwnerContribution(userId),
        getOwnerWithdrawal(userId, startDate, endDate)
    ]);

    const data = {
        "Cash": Cash,
        "Accounts Receivable": AccountsReceivable,
        "Other Receivables": OtherReceivables,
        "Business Savings/Reserves": BusinessSavings,
        "Business Equipment (Asset)": BusinessEquipment,
        "Inventory": Inventory,
        "Prepaid Expenses": PrepaidExpenses,
        "Loan Payments / Credit Cards": CreditCardDebt,
        "Business Loans 1": BusinessLoans,
        "Business Loans 2": 0.0, // Placeholder
        "Taxes Payable": TaxesPayable,
        "Owner's Contribution": OwnerContribution,
        "Owner's Withdrawal": OwnerWithdrawal,
    };

    console.log("✓ Balance Sheet data fetched successfully");
    return data;
}

module.exports = {
    getAllBalanceSheetData
};
