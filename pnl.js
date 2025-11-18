// pnl.js
const { zipLongest } = require('./utils'); // We will create this helper

function generatePnlReport(userData, userId, expenseSubcategoryBreakdown = null) {
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

    // Build expense items with subcategory breakdown
    const expenseItemsWithSubcategories = buildExpenseItemsWithSubcategories(userData, expenseSubcategoryBreakdown);

    const allExpenseItems = expenseItemsWithSubcategories.opExpenseItems.concat(expenseItemsWithSubcategories.otherExpenseItems);

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
    
    return { pnlDf: data, netIncome };
}

function buildExpenseItemsWithSubcategories(userData, expenseSubcategoryBreakdown) {
    const baseOpExpenseCategories = [
        "Advertising", "Advertising - test purchases", "Business Equipment", "Education",
        "Employee & Contractor Salaries", "Entertainment", "Food & Drink", "Food & Drink - w/ Client",
        "Medical", "Non-Profit / Charity", "Personal Branding", "Professional Fees",
        "Professional Fees - Market fees", "Professional Fees - Patent",
        "Professional Fees - Sunbiz registration fees", "Rent & Utilities", "Repairs & Maintenance",
        "Subscriptions", "Supplies", "Transportation", "Travel", "Uncategorized Expense"
    ];

    const baseOtherExpenseCategories = ["Bank Fees", "Insurance", "Tax"];

    const opExpenseItems = [];
    const otherExpenseItems = [];

    // Process operating expenses
    for (const category of baseOpExpenseCategories) {
        const amount = userData[category] || 0;
        opExpenseItems.push([category, amount]);

        // Add subcategories if they exist
        if (expenseSubcategoryBreakdown && expenseSubcategoryBreakdown[category]) {
            const subcategories = expenseSubcategoryBreakdown[category];
            const sortedSubcategories = Object.entries(subcategories).sort(([a], [b]) => a.localeCompare(b));

            for (const [subcategory, subAmount] of sortedSubcategories) {
                opExpenseItems.push([`  ${subcategory}`, subAmount]);
            }
        }
    }

    // Process other expenses
    for (const category of baseOtherExpenseCategories) {
        const amount = userData[category] || 0;
        otherExpenseItems.push([category, amount]);

        // Add subcategories if they exist
        if (expenseSubcategoryBreakdown && expenseSubcategoryBreakdown[category]) {
            const subcategories = expenseSubcategoryBreakdown[category];
            const sortedSubcategories = Object.entries(subcategories).sort(([a], [b]) => a.localeCompare(b));

            for (const [subcategory, subAmount] of sortedSubcategories) {
                otherExpenseItems.push([`  ${subcategory}`, subAmount]);
            }
        }
    }

    return { opExpenseItems, otherExpenseItems };
}

function generatePnlReportByAccount(userData, userId, accountType, expenseSubcategoryBreakdown = null) {
    const { pnlDf, netIncome } = generatePnlReport(userData, userId, expenseSubcategoryBreakdown);

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
