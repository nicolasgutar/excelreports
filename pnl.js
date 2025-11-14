// pnl.js
const { zipLongest } = require('./utils'); // We will create this helper


function generatePnlReport(userData, userId) {
    console.log(`--- Generating P&L Report for ${userId} ---`);
    let netIncome;
    try {
        netIncome = userData["Net Income"];
    } catch (e) {
        console.error("❌ ERROR: Missing Net Income in userData");
        return { pnlDf: null, netIncome: 0 };
    }
    console.log(`✓ P&L Data Read. Net Income: ${netIncome.toFixed(2)}`);

    const incomeItems = [
        ["Business Income", userData["Business Income"]],
        ["Other Income", userData["Other Income"]],
        ["Uncategorized", userData["Uncategorized Income"]],
    ];

    const opExpenseItems = [
        ["Advertising", userData["Advertising"]],
        ["Advertising - test purchases", userData["Advertising - test purchases"]],
        ["Business Equipment", userData["Business Equipment"]],
        ["Education", userData["Education"]],
        ["Employee & Contractor Salaries", userData["Employee & Contractor Salaries"]],
        ["Entertainment", userData["Entertainment"]],
        ["Food & Drink", userData["Food & Drink"]],
        ["Food & Drink - w/ Client", userData["Food & Drink - w/ Client"]],
        ["Medical", userData["Medical"]],
        ["Non-Profit / Charity", userData["Non-Profit / Charity"]],
        ["Personal Branding", userData["Personal Branding"]],
        ["Professional Fees", userData["Professional Fees"]],
        ["Professional Fees - Market fees", userData["Professional Fees - Market fees"]],
        ["Professional Fees - Patent", userData["Professional Fees - Patent"]],
        ["Professional Fees - Sunbiz registration fees", userData["Professional Fees - Sunbiz registration fees"]],
        ["Rent & Utilities", userData["Rent & Utilities"]],
        ["Repairs & Maintenance", userData["Repairs & Maintenance"]],
        ["Subscriptions", userData["Subscriptions"]],
        ["Supplies", userData["Supplies"]],
        ["Transportation", userData["Transportation"]],
        ["Travel", userData["Travel"]],
        ["Uncategorized", userData["Uncategorized Expense"]],
    ];

    const otherExpenseItems = [
        ["Bank Fees", userData["Bank Fees"]],
        ["Insurance", userData["Insurance"]],
        ["Tax", userData["Tax"]],
    ];

    const allExpenseItems = opExpenseItems.concat(otherExpenseItems);
    
    const expenseSumFormula = "SUM(B5:B" + (5 + allExpenseItems.length) + ")";
    const incomeSumFormula = "SUM(D5:D" + (5 + incomeItems.length) + ")";

    const data = [
        ["Yearly Income And Expense Report", null, null, null],
        ["Operating Expenses", { formula: expenseSumFormula }, "Income", { formula: incomeSumFormula }],
        [null, "Actual", null, "Actual"],
        [null, null, null, null], // Divider row
    ];

    // Use zipLongest to pair items
    const zipped = zipLongest(allExpenseItems, incomeItems, [null, null]);
    for (const [exp, inc] of zipped) {
        data.push([exp[0], exp[1], inc[0], inc[1]]);
    }
    
    // This is the "DataFrame" equivalent
    return { pnlDf: data, netIncome };
}

function generatePnlReportByAccount(userData, userId, accountType) {
    // ... (This function would be structured identically to generatePnlReport,
    // just changing the title row) ...
    // For brevity, I am reusing the logic, but you would copy/paste and adapt
    const { pnlDf, netIncome } = generatePnlReport(userData, userId);
    
    if (pnlDf) {
        // Just modify the title
        pnlDf[0][0] = `${accountType} Yearly Income And Expense Report`;
        console.log(`--- Generating ${accountType} P&L Report for ${userId} ---`);
        console.log(`✓ ${accountType} P&L Data Read. Net Income: ${netIncome.toFixed(2)}`);
    }

    return { pnlDf, netIncome };
}

module.exports = {
    generatePnlReport,
    generatePnlReportByAccount
};
