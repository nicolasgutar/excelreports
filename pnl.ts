import { zipLongest } from './utils.js';


// Define TypeScript interfaces for income and expense data
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

function generatePnlReport(
    incomeData: IncomeData,
    expenseData: ExpenseData,
    reportTitle = "Yearly Income And Expense Report"
) {
    // Build income items - only categories with amounts > 0
    const incomeItems: [string, number][] = [];
    for (const [category, amount] of Object.entries(incomeData) as [string, number][]) {
        if (amount > 0) {
            incomeItems.push([category, amount]);
        }
    }

    // Build expense items with subcategories - only categories with amounts > 0
    const expenseItems: [string, number | boolean, boolean?][] = [];
    for (const [category, categoryData] of Object.entries(expenseData) as [string, { total: number; subcategories?: ExpenseSubcategories }][]) {
        if (categoryData.total > 0) {
            // Main category
            expenseItems.push([category, categoryData.total]);

            // Subcategories with indentation for styling
            const subcategories = categoryData.subcategories || {};
            const sortedSubcategories = Object.entries(subcategories).sort(([a], [b]) => a.localeCompare(b));

            for (const [subcategory, subAmount] of sortedSubcategories as [string, number][]) {
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
    const data: (string | number | { formula: string } | null)[][] = [];
    data.push(
        [reportTitle, null, null, null],
        ["Operating Expenses", { formula: expenseSumFormula }, "Income", { formula: incomeSumFormula }],
        [null, "Actual", null, "Actual"],
        [null, null, null, null]
    );

    // Zip expenses and income to create balanced rows
    const zipped = zipLongest(expenseItems, incomeItems, ["", 0]);
    for (const [exp, inc] of zipped) {
        const expenseCell = exp ? exp[0] : null;
        const expenseAmount = exp ? exp[1] : null;

        const incomeCell = inc ? inc[0] : null;
        const incomeAmount = inc ? inc[1] : null;

        data.push([
            expenseCell || "",
            typeof expenseAmount === "number" ? expenseAmount : null,
            incomeCell || "",
            typeof incomeAmount === "number" ? incomeAmount : null
        ]);
    }

    return data;
}

export { generatePnlReport };
