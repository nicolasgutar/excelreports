// index.js
const express = require('express');
const cors = require('cors');
const Config = require('./config');
const db = require('./dbConnector');
const { getUserTransactions, getTransactionsGroupedByCategory, getTransactionsGroupedWithSubcategories } = require('./dbQueries');
const { getAllBalanceSheetData } = require('./balanceSheetQueries');
const {
    createTransactionsDataFrame,
    processGroupedDataForPnl,
    processGroupedDataWithSubcategoriesForPnl
} = require('./transactionProcessor');
const { generatePnlReport, generatePnlReportByAccount } = require('./pnl');
const { generateBalanceSheet } = require('./balanceSheet');
const { createReportsInExcel } = require('./excelGenerator');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json()); // Replaces Pydantic model parsing

// --- Endpoints ---

app.post("/reports", async (req, res) => {
    const { userId } = req.body;
    const cleanUserId = userId?.trim();

    if (!cleanUserId) {
        return res.status(400).json({ detail: "User ID no puede estar vacío" });
    }

    try {
        console.log(`Generando reportes financieros para el usuario: ${cleanUserId}`);

        // Validar configuración
        if (!Config.validate()) {
            throw new Error("Validación de configuración falló");
        }

        // Conexión a DB es manejada por el pool, no es necesaria una conexión explícita aquí

        // Obtener transacciones
        console.log(`Obteniendo transacciones para el usuario ${cleanUserId}...`);
        const startDate = Config.REPORT_START_DATE;
        const endDate = Config.REPORT_END_DATE;

        const transactions = await getUserTransactions(
            cleanUserId,
            startDate,
            endDate,
            Config.DEFAULT_TRANSACTION_LIMIT
        );
        console.log(`✓ Obtenidas ${transactions.length} transacciones`);

        if (transactions.length === 0) {
            console.log("⚠ ADVERTENCIA: No se encontraron transacciones para este usuario.");
        }

        // Crear DataFrame (Array de objetos) de transacciones para la hoja
        const transactionsDf = createTransactionsDataFrame(transactions);

        // Procesar transacciones usando consulta agrupada para P&L con subcategorías
        console.log("\nProcesando transacciones para P&L usando consulta agrupada con subcategorías...");
        const groupedDataWithSubcategories = await getTransactionsGroupedWithSubcategories(
            cleanUserId,
            startDate,
            endDate
        );

        // Procesar los datos agrupados en formato P&L con desglose de subcategorías
        const { pnlData: data, expenseSubcategoryBreakdown } = processGroupedDataWithSubcategoriesForPnl(groupedDataWithSubcategories);
        console.log(`✓ Datos P&L calculados con subcategorías. Ingreso neto: $${data['Net Income'].toFixed(2)}`);

        // Obtener datos del Balance Sheet desde la base de datos
        console.log("\nObteniendo datos del Balance Sheet desde la base de datos...");
        const balanceSheetData = await getAllBalanceSheetData(
            cleanUserId,
            startDate,
            endDate
        );

        // Combinar datos del balance sheet con datos P&L
        Object.assign(data, balanceSheetData);
        console.log("✓ Datos del Balance Sheet cargados desde la base de datos");

        // Generar reporte P&L (General) con desglose de subcategorías
        console.log("\n--- Generando Reportes ---");
        const { pnlDf, netIncome } = generatePnlReport(data, cleanUserId, expenseSubcategoryBreakdown);
        if (!pnlDf) {
            throw new Error("Error generando reporte P&L general");
        }

        // Generar reporte P&L Personal con subcategorías
        console.log("\n--- Generando Reporte P&L Personal ---");
        const personalGroupedData = await getTransactionsGroupedWithSubcategories(
            cleanUserId, startDate, endDate, "personal"
        );
        const { pnlData: personalData, expenseSubcategoryBreakdown: personalExpenseBreakdown } = processGroupedDataWithSubcategoriesForPnl(personalGroupedData);
        const { pnlDf: personalPnlDf, netIncome: personalNetIncome } = generatePnlReportByAccount(personalData, cleanUserId, "Personal", personalExpenseBreakdown);
        console.log(`✓ Datos P&L Personal calculados. Ingreso neto: $${personalNetIncome.toFixed(2)}`);

        // Generar reporte P&L de Negocio con subcategorías
        console.log("\n--- Generando Reporte P&L de Negocio ---");
        const businessGroupedData = await getTransactionsGroupedWithSubcategories(
            cleanUserId, startDate, endDate, "business"
        );
        const { pnlData: businessData, expenseSubcategoryBreakdown: businessExpenseBreakdown } = processGroupedDataWithSubcategoriesForPnl(businessGroupedData);
        const { pnlDf: businessPnlDf, netIncome: businessNetIncome } = generatePnlReportByAccount(businessData, cleanUserId, "Business", businessExpenseBreakdown);
        console.log(`✓ Datos P&L de Negocio calculados. Ingreso neto: $${businessNetIncome.toFixed(2)}`);

        // Generar Balance Sheet
        console.log("\n--- Generando Balance Sheet ---");
        const balanceSheetResult = generateBalanceSheet(data, cleanUserId, netIncome);
        const balanceSheetDf = balanceSheetResult.data;
        const balanceSummary = balanceSheetResult.balanceSummary;

        // Log del estado del balance
        if (balanceSummary.isBalanced) {
            console.log(`✓ Balance Sheet balanceado: $${balanceSummary.totalAssets.toFixed(2)}`);
        } else {
            console.warn(`⚠ Balance Sheet desbalanceado!`);
            console.warn(`   Assets: $${balanceSummary.totalAssets.toFixed(2)}`);
            console.warn(`   Liabilities + Equity: $${balanceSummary.totalLiabilitiesAndEquity.toFixed(2)}`);
            console.warn(`   Diferencia: $${balanceSummary.difference.toFixed(2)}`);
            console.warn(`   ${balanceSummary.adjustmentDescription}`);
        }

        // Crear y escribir en nuevo documento de ExcelJS
        console.log("\n--- Creando archivo Excel ---");
        const workbookBuffer = await createReportsInExcel(
            cleanUserId, pnlDf, balanceSheetDf, transactionsDf,
            personalPnlDf, businessPnlDf
        );
        console.log("\n✅ Reportes financieros generados exitosamente!");

        // Enviar el archivo como respuesta
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Financial_Reports_${cleanUserId}.xlsx"`
        );
        res.send(workbookBuffer);

    } catch (e) {
        console.error("Error en /reports:", e);
        res.status(500).json({ detail: `Error generating reports: ${e.message}` });
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Financial Reports API is running" });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 Financial Reports API running on port ${PORT}`);
});

module.exports = app;
