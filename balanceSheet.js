// balance_sheet.js

function generateBalanceSheet(userData, userId, netIncome) {
    console.log(`--- Generating Balance Sheet for ${userId} ---`);

    // 1. ASSETS
    const assets = [
        userData["Cash"], userData["Accounts Receivable"], userData["Other Receivables"],
        userData["Business Savings/Reserves"], userData["Business Equipment (Asset)"],
        userData["Inventory"], userData["Prepaid Expenses"],
    ];
    const totalAssets = assets.reduce((sum, val) => sum + (val || 0), 0);

    // 2. LIABILITIES
    const liabilities = [
        userData["Loan Payments / Credit Cards"], userData["Business Loans 1"],
        userData["Business Loans 2"], userData["Taxes Payable"],
    ];
    const totalLiabilities = liabilities.reduce((sum, val) => sum + (val || 0), 0);

    // 3. EQUITY
    const retainedEarnings = (netIncome || 0) - (userData["Owner's Withdrawal"] || 0);
    const totalEquity = (userData["Owner's Contribution"] || 0) + retainedEarnings;

    // Sanity Check
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    if (Math.abs(totalAssets - totalLiabilitiesAndEquity) >= 0.01) {
        console.warn(`⚠ WARNING: Balance sheet does not balance!`);
        console.warn(`   Assets: ${totalAssets.toFixed(2)} | L + E: ${totalLiabilitiesAndEquity.toFixed(2)}`);
        console.warn(`   Difference: ${(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}`);
    } else {
        console.log(`✓ Balance sheet balances: ${totalAssets.toFixed(2)}`);
    }

    // 4. STRUCTURE DATA
    const data = [
        ["BALANCE SHEET", null],
        ["ASSETS", null],
        ["Cash", userData["Cash"]],
        ["Accounts Receivable", userData["Accounts Receivable"]],
        ["Other Receivables", userData["Other Receivables"]],
        ["Business savings/reserves", userData["Business Savings/Reserves"]],
        ["Business Equipment", userData["Business Equipment (Asset)"]],
        ["Inventory", userData["Inventory"]],
        ["Prepaid Expenses", userData["Prepaid Expenses"]],
        [null, null],
        ["Total Assets", totalAssets],
        [null, null],
        ["LIABILITIES & EQUITY", null],
        ["LIABILITIES", null],
        ["CURRENT LIABILITIES", null],
        ["Loan Payments / Credit Cards", userData["Loan Payments / Credit Cards"]],
        ["Business Loans", userData["Business Loans 1"]],
        ["Business Loans", userData["Business Loans 2"]],
        ["Taxes Payable", userData["Taxes Payable"]],
        [null, null],
        ["Total Liabilities", totalLiabilities],
        [null, null],
        ["OWNER'S EQUITY", null],
        ["Owner's Contribution", userData["Owner's Contribution"]],
        ["Owner's Withdrawal", userData["Owner's Withdrawal"]],
        ["Retained Earnings", retainedEarnings],
        [null, null],
        ["Total Owner's Equity", totalEquity],
        [null, null],
        ["Total Liabilities and Owner's Equity", totalLiabilitiesAndEquity],
    ];
    
    // This is the "DataFrame" equivalent
    return data;
}

module.exports = { generateBalanceSheet };
