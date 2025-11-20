// index.js
process.on('uncaughtException', (err) => {
    console.error('\n!!! FATAL UNCAUGHT EXCEPTION !!!');
    console.error(err);
    process.exit(1); // Ensure the process exits
});


process.on('unhandledRejection', (reason, promise) => {
    console.error('\n!!! FATAL UNHANDLED REJECTION !!!');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    process.exit(1); // Ensure the process exits
});

import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import Config from './config.js';
import { getIncomeData, getExpenseData, getTransactionData } from './dbQueries.js';
import { generatePnlData } from './transactionProcessor.js';
import { generatePnlReport } from './pnl.js';
import { createReportsInExcel } from './excelGenerator.js';



const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json()); // Replaces Pydantic model parsing

// --- Endpoints ---

app.post("/reports", async (req: Request, res: Response) => {
    const { userId } = req.body;
    const cleanUserId = userId?.trim();

    if (!cleanUserId) {
        return res.status(400).json({ detail: "User ID no puede estar vacío" });
    }

    try {
        // Validar configuración
        if (!Config.validate()) {
            throw new Error("Validación de configuración falló"); // This is intentional for validation failure
        }

        const startDate = Config.REPORT_START_DATE;
        const endDate = Config.REPORT_END_DATE;

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
        if (e instanceof Error) {
            console.error("Error en /reports:", e);
            res.status(500).json({ detail: `Error generating reports: ${e.message}` });
        } else {
            console.error("Unknown error en /reports:", e);
            res.status(500).json({ detail: "An unknown error occurred." });
        }
    }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "OK", message: "P&L Reports API is running" });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 P&L Reports API running on port ${PORT}`);
});

export default app;
