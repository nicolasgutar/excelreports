// transactionProcessor.js

/**
 * Generate P&L report data from income and expense data
 */
function generatePnlData(incomeData, expenseData) {
    // Calculate totals
    const totalIncome = Object.values(incomeData).reduce((sum, amount) => sum + amount, 0);
    const totalExpenses = Object.values(expenseData).reduce((sum, categoryData) => sum + categoryData.total, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
        income: incomeData,
        expenses: expenseData,
        totalIncome,
        totalExpenses,
        netIncome
    };
}

module.exports = {
    generatePnlData
};
