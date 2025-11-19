const { zipLongest } = require('./utils');

/**
 * Generate P&L report structure for Excel
 */
function generatePnlReport(incomeData, expenseData, reportTitle = "Yearly Income And Expense Report") {
    // Build income items - only categories with amounts > 0
    const incomeItems = [];
    for (const [category, amount] of Object.entries(incomeData)) {
        if (amount > 0) {
            incomeItems.push([category, amount]);
        }
    }

    // Build expense items with subcategories - only categories with amounts > 0
    const expenseItems = [];
    for (const [category, categoryData] of Object.entries(expenseData)) {
        if (categoryData.total > 0) {
            // Main category
            expenseItems.push([category, categoryData.total]);

            // Subcategories with indentation for styling
            const subcategories = categoryData.subcategories || {};
            const sortedSubcategories = Object.entries(subcategories).sort(([a], [b]) => a.localeCompare(b));

            for (const [subcategory, subAmount] of sortedSubcategories) {
                if (subAmount > 0) {
                    expenseItems.push([`  ${subcategory}`, subAmount, true]); // true flag indicates subcategory
                }
            }
        }
    }

    // Calculate formulas for totals
    const expenseSumFormula = `SUM(B5:B${4 + expenseItems.length})`;
    const incomeSumFormula = `SUM(D5:D${4 + incomeItems.length})`;

    // Build report structure
    const data = [
        [reportTitle, null, null, null],
        ["Operating Expenses", { formula: expenseSumFormula }, "Income", { formula: incomeSumFormula }],
        [null, "Actual", null, "Actual"],
        [null, null, null, null],
    ];

    // Zip expenses and income to create balanced rows
    const zipped = zipLongest(expenseItems, incomeItems, [null, null]);
    for (const [exp, inc] of zipped) {
        const expenseCell = exp ? exp[0] : null;
        const expenseAmount = exp ? exp[1] : null;

        const incomeCell = inc ? inc[0] : null;
        const incomeAmount = inc ? inc[1] : null;

        data.push([expenseCell, expenseAmount, incomeCell, incomeAmount]);
    }

    return data;
}

module.exports = {
    generatePnlReport
};
