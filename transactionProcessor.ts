// transactionProcessor.js

/**
 * Generate P&L report data from income and expense data
 */

// Added TypeScript interfaces for income and expense data.
interface IncomeData {
    [category: string]: number;
}

interface ExpenseCategory {
    total: number;
}

interface ExpenseData {
    [category: string]: ExpenseCategory;
}

// Updated `generatePnlData` function with proper type annotations.
export function generatePnlData(incomeData: IncomeData, expenseData: ExpenseData) {
    // Calculate totals
    const totalIncome = Object.values(incomeData).reduce((sum: number, amount: number) => sum + amount, 0);
    const totalExpenses = Object.values(expenseData).reduce((sum: number, categoryData: ExpenseCategory) => sum + categoryData.total, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
        income: incomeData,
        expenses: expenseData,
        totalIncome,
        totalExpenses,
        netIncome
    };
}
