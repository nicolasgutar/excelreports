// index.js
const express = require('express');
const cors = require('cors');
const Config = require('./config');
const { getIncomeData, getExpenseData, getTransactionData } = require('./dbQueries');
const { generatePnlData } = require('./transactionProcessor');
const { generatePnlReport } = require('./pnl');
const { generateBalanceSheet } = require('./balanceSheet');
const { getBalanceSheetData } = require('./balanceSheetQueries');
const { createReportsInExcel } = require('./excelGenerator');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json()); // Replaces Pydantic model parsing

// --- Endpoints ---

app.post("/reports", async (req, res) => {
    const { userId, startDate, endDate } = req.body;
    const cleanUserId = userId?.trim();

    if (!cleanUserId) {
        return res.status(400).json({ detail: "User ID no puede estar vacío" });
    }

    if (!startDate || !endDate) {
        return res.status(400).json({ detail: "startDate y endDate son requeridos" });
    }

    try {
        // Validar configuración
        if (!Config.validate()) {
            throw new Error("Validación de configuración falló");
        }

        // THE 8 QUERIES: 3 reports × (income + expenses) + balance sheet + transactions

        // 1. General P&L Report - Income Query
        const generalIncomeData = await getIncomeData(cleanUserId, startDate, endDate);
        // 2. General P&L Report - Expenses Query
        const generalExpenseData = await getExpenseData(cleanUserId, startDate, endDate);

        // 3. Personal P&L Report - Income Query
        const personalIncomeData = await getIncomeData(cleanUserId, startDate, endDate, "personal");
        // 4. Personal P&L Report - Expenses Query
        const personalExpenseData = await getExpenseData(cleanUserId, startDate, endDate, "personal");

        // 5. Business P&L Report - Income Query
        const businessIncomeData = await getIncomeData(cleanUserId, startDate, endDate, "business");
        // 6. Business P&L Report - Expenses Query
        const businessExpenseData = await getExpenseData(cleanUserId, startDate, endDate, "business");

        // 7. Balance Sheet Data
        // const generalBalanceSheetData = await getBalanceSheetData(cleanUserId, startDate, endDate);

        // 8. Transactions Data
        const transactionsData = await getTransactionData(cleanUserId, startDate, endDate, Config.DEFAULT_TRANSACTION_LIMIT);

        // Generate P&L data for each report
        const generalPnlData = generatePnlData(generalIncomeData, generalExpenseData);
        const personalPnlData = generatePnlData(personalIncomeData, personalExpenseData);
        const businessPnlData = generatePnlData(businessIncomeData, businessExpenseData);

        // Generate report structures for Excel
        const generalPnlReport = generatePnlReport(generalIncomeData, generalExpenseData, "General Yearly Income And Expense Report");
        const personalPnlReport = generatePnlReport(personalIncomeData, personalExpenseData, "Personal Yearly Income And Expense Report");
        const businessPnlReport = generatePnlReport(businessIncomeData, businessExpenseData, "Business Yearly Income And Expense Report");

        // Generate Balance Sheet with net income from general P&L
        // const generalBalanceSheet = generateBalanceSheet(generalBalanceSheetData, cleanUserId, generalPnlData.netIncome);

        // Create Excel file with 4 reports: 3 P&L + Transactions (Balance Sheet commented out)
        const workbookBuffer = await createReportsInExcel(
            cleanUserId,
            generalPnlReport,     // General P&L
            null,                 // Balance Sheet (commented out)
            transactionsData,     // Transactions
            personalPnlReport,    // Personal P&L
            businessPnlReport     // Business P&L
        );

        // Enviar el archivo como respuesta
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="PnL_Reports_${cleanUserId}.xlsx"`
        );
        res.send(workbookBuffer);

        console.log(`✓ Generated P&L reports for user ${cleanUserId}`);
        console.log(`  - General: Income $${generalPnlData.totalIncome.toFixed(2)}, Expenses $${generalPnlData.totalExpenses.toFixed(2)}, Net $${generalPnlData.netIncome.toFixed(2)}`);
        console.log(`  - Personal: Income $${personalPnlData.totalIncome.toFixed(2)}, Expenses $${personalPnlData.totalExpenses.toFixed(2)}, Net $${personalPnlData.netIncome.toFixed(2)}`);
        console.log(`  - Business: Income $${businessPnlData.totalIncome.toFixed(2)}, Expenses $${businessPnlData.totalExpenses.toFixed(2)}, Net $${businessPnlData.netIncome.toFixed(2)}`);

    } catch (e) {
        console.error("Error en /reports:", e);
        res.status(500).json({ detail: `Error generating reports: ${e.message}` });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "P&L Reports API is running" });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 P&L Reports API running on port ${PORT}`);
});

module.exports = app;
