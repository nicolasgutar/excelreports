// transactionProcessor.js

/**
 * Process grouped transaction data from database query into P&L line items.
 */
function processGroupedDataForPnl(groupedData) {
    const pnlData = {
        "Business Income": 0.0, "Other Income": 0.0, "Uncategorized Income": 0.0,
        "Advertising": 0.0, "Advertising - test purchases": 0.0, "Business Equipment": 0.0,
        "Education": 0.0, "Employee & Contractor Salaries": 0.0, "Entertainment": 0.0,
        "Food & Drink": 0.0, "Food & Drink - w/ Client": 0.0, "Medical": 0.0,
        "Non-Profit / Charity": 0.0, "Personal Branding": 0.0, "Professional Fees": 0.0,
        "Professional Fees - Market fees": 0.0, "Professional Fees - Patent": 0.0,
        "Professional Fees - Sunbiz registration fees": 0.0, "Rent & Utilities": 0.0,
        "Repairs & Maintenance": 0.0, "Subscriptions": 0.0, "Supplies": 0.0,
        "Transportation": 0.0, "Travel": 0.0, "Uncategorized Expense": 0.0,
        "Bank Fees": 0.0, "Insurance": 0.0, "Tax": 0.0,
    };

    const incomeCategories = groupedData.income || {};
    for (const [category, amount] of Object.entries(incomeCategories)) {
        if (category in pnlData) pnlData[category] += amount;
        else if (category.includes("Business") || category.includes("Income")) pnlData["Business Income"] += amount;
        else if (category.includes("Uncategorized")) pnlData["Uncategorized Income"] += amount;
        else pnlData["Other Income"] += amount;
    }

    const expenseCategories = groupedData.expenses || {};
    for (const [category, amount] of Object.entries(expenseCategories)) {
        if (category in pnlData) pnlData[category] += amount;
        else pnlData["Uncategorized Expense"] += amount;
    }

    // Calculate totals
    const totalIncome = pnlData["Business Income"] + pnlData["Other Income"] + pnlData["Uncategorized Income"];
    
    const totalOperatingExpenses = (
        pnlData["Advertising"] + pnlData["Advertising - test purchases"] + pnlData["Business Equipment"] +
        pnlData["Education"] + pnlData["Employee & Contractor Salaries"] + pnlData["Entertainment"] +
        pnlData["Food & Drink"] + pnlData["Food & Drink - w/ Client"] + pnlData["Medical"] +
        pnlData["Non-Profit / Charity"] + pnlData["Personal Branding"] + pnlData["Professional Fees"] +
        pnlData["Professional Fees - Market fees"] + pnlData["Professional Fees - Patent"] +
        pnlData["Professional Fees - Sunbiz registration fees"] + pnlData["Rent & Utilities"] +
        pnlData["Repairs & Maintenance"] + pnlData["Subscriptions"] + pnlData["Supplies"] +
        pnlData["Transportation"] + pnlData["Travel"] + pnlData["Uncategorized Expense"]
    );

    const totalOtherExpenses = pnlData["Bank Fees"] + pnlData["Insurance"] + pnlData["Tax"];
    const grossProfit = totalIncome - totalOperatingExpenses;
    const netIncome = grossProfit - totalOtherExpenses;

    // Add totals to data
    pnlData["Total Income"] = totalIncome;
    pnlData["Total Operating Expenses"] = totalOperatingExpenses;
    pnlData["Gross Profit"] = grossProfit;
    pnlData["Total Other Expenses"] = totalOtherExpenses;
    pnlData["Net Income"] = netIncome;

    return pnlData;
}

/**
 * Convert list of transaction dictionaries to an array of objects for display.
 */
function createTransactionsDataFrame(transactions) {
    if (!transactions || transactions.length === 0) {
        return [];
    }
    
    // Equivalent to selecting columns and renaming them
    return transactions.map(t => ({
        'Date': t.date ? new Date(t.date).toISOString().split('T')[0] : '',
        'Transaction Name': t.name || '',
        'Category': t.category || '',
        'Subcategory': t.subcategory || '',
        'Amount': parseFloat(t.amount) || 0.0,
        'Merchant': t.merchantName || '',
        'Description': t.description || '',
        'Account': t.accountFrom || '',
        'Status': t.status || ''
    }));
}

module.exports = {
    processGroupedDataForPnl,
    createTransactionsDataFrame
};
