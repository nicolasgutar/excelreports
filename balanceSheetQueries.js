// balanceSheetQueries.js
const db = require('./dbConnector');

async function getCashBalance(userId, startDate = null, endDate = null) {
    // Para balance sheet, normalmente queremos el balance al final del período
    let query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_cash
    FROM "Account"
    WHERE user_id = $1 AND type = 'checking'
    `;

    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_cash) || 0.0;
}

async function getAccountsReceivable(userId, startDate = null, endDate = null) {
    let query, params;

    if (endDate) {
        // Facturas pendientes hasta la fecha de corte
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_receivable
        FROM "Invoice"
        WHERE "userId" = $1 AND "dueDate" <= $2 AND status != 'Paid'
        `;
        params = [userId, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_receivable
        FROM "Invoice"
        WHERE "userId" = $1 AND "dueDate" > NOW() AND status != 'Paid'
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_receivable) || 0.0;
}

async function getOtherReceivables(userId, startDate = null, endDate = null) {
    // Implementar lógica real basada en transacciones pendientes
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_other_receivable
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 
          AND (category LIKE '%Loan%' OR category LIKE '%Advance%' OR category LIKE '%Deposit%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_other_receivable
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 
          AND (category LIKE '%Loan%' OR category LIKE '%Advance%' OR category LIKE '%Deposit%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_other_receivable) || 0.0;
}

async function getBusinessSavings(userId, startDate = null, endDate = null) {
    let query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_savings
    FROM "Account"
    WHERE user_id = $1 AND type = 'savings'
    `;

    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_savings) || 0.0;
}

async function getBusinessEquipment(userId, startDate = null, endDate = null) {
    let query, params;
    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_equipment
        FROM "Transaction"
        WHERE "userId" = $1 AND category = 'Business Equipment' AND amount < 0
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_equipment
        FROM "Transaction"
        WHERE "userId" = $1 AND category = 'Business Equipment' AND amount < 0
        `;
        params = [userId];
    }
    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_equipment) || 0.0;
}

async function getInventory(userId, startDate = null, endDate = null) {
    let query, params;

    if (startDate && endDate) {
        // Calcular inventario basado en compras - ventas en el período
        query = `
        SELECT 
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_inventory
        FROM "Transaction"
        WHERE "userId" = $1 
          AND (category ILIKE '%inventory%' OR category ILIKE '%marketplace%' OR category ILIKE '%supplies%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT 
            COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_inventory
        FROM "Transaction"
        WHERE "userId" = $1 
          AND (category ILIKE '%inventory%' OR category ILIKE '%marketplace%' OR category ILIKE '%supplies%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    const inventory = parseFloat(result?.total_inventory) || 0.0;
    return Math.max(inventory, 0); // El inventario no puede ser negativo
}

async function getPrepaidExpenses(userId, startDate = null, endDate = null) {
    // Implementar lógica real para gastos prepagados
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_prepaid
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND (category ILIKE '%prepaid%' OR category ILIKE '%subscription%' OR category ILIKE '%insurance%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_prepaid
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND (category ILIKE '%prepaid%' OR category ILIKE '%subscription%' OR category ILIKE '%insurance%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_prepaid) || 0.0;
}

async function getCreditCardDebt(userId, startDate = null, endDate = null) {
    let query = `
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_debt
    FROM "Account"
    WHERE user_id = $1 AND (type = 'credit' OR type = 'debt')
    `;

    const result = await db.executeSingle(query, [userId]);
    return parseFloat(result?.total_debt) || 0.0;
}

async function getBusinessLoans(userId, startDate = null, endDate = null) {
    // Implementar lógica real para préstamos comerciales
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_loans
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND category = 'Loan Payments'
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_loans
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND category = 'Loan Payments'
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_loans) || 0.0;
}

async function getTaxesPayable(userId, startDate = null, endDate = null) {
    let query, params;

    if (startDate && endDate) {
        // Calcular impuestos basado en ingresos netos del período
        query = `
        SELECT 
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN amount < 0 AND category NOT ILIKE '%Transfer%' THEN ABS(amount) ELSE 0 END), 0) as total_expenses
        FROM "Transaction"
        WHERE "userId" = $1 AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT 
            COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN amount < 0 AND category NOT ILIKE '%Transfer%' THEN ABS(amount) ELSE 0 END), 0) as total_expenses
        FROM "Transaction"
        WHERE "userId" = $1
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    const totalIncome = parseFloat(result?.total_income) || 0.0;
    const totalExpenses = parseFloat(result?.total_expenses) || 0.0;
    const netIncome = totalIncome - totalExpenses;

    // Solo calcular impuestos si hay ganancia, usando 33% como tasa estimada
    return Math.max(netIncome * 0.33, 0);
}

async function getOwnerContribution(userId, startDate = null, endDate = null) {
    // Implementar lógica real para contribuciones del propietario
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_contribution
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 
          AND (category ILIKE '%contribution%' OR category ILIKE '%investment%' OR category ILIKE '%capital%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(amount), 0) as total_contribution
        FROM "Transaction"
        WHERE "userId" = $1 AND amount > 0 
          AND (category ILIKE '%contribution%' OR category ILIKE '%investment%' OR category ILIKE '%capital%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_contribution) || 0.0;
}

async function getOwnerWithdrawal(userId, startDate = null, endDate = null) {
    // Implementar lógica real para retiros del propietario
    let query, params;

    if (startDate && endDate) {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_withdrawal
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND (category ILIKE '%withdrawal%' OR category ILIKE '%draw%' OR category ILIKE '%distribution%')
          AND date >= $2 AND date <= $3
        `;
        params = [userId, startDate, endDate];
    } else {
        query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_withdrawal
        FROM "Transaction"
        WHERE "userId" = $1 AND amount < 0 
          AND (category ILIKE '%withdrawal%' OR category ILIKE '%draw%' OR category ILIKE '%distribution%')
        `;
        params = [userId];
    }

    const result = await db.executeSingle(query, params);
    return parseFloat(result?.total_withdrawal) || 0.0;
}

/**
 * Consulta consolidada optimizada para obtener todos los datos de cuentas de una vez
 */
async function getAccountsDataOptimized(userId, endDate = null) {
    let query = `
    SELECT 
        type,
        COALESCE(SUM(ABS(balance)), 0) as total_balance
    FROM "Account"
    WHERE user_id = $1
    `;

    let params = [userId];

    query += ` GROUP BY type`;

    const result = await db.executeQuery(query, params);

    // Procesar resultados en un mapa para fácil acceso
    const accountsMap = {};
    result.forEach(row => {
        accountsMap[row.type] = parseFloat(row.total_balance) || 0.0;
    });

    return {
        cash: accountsMap['checking'] || 0.0,
        savings: accountsMap['savings'] || 0.0,
        creditDebt: (accountsMap['credit'] || 0.0) + (accountsMap['debt'] || 0.0)
    };
}

/**
 * Get all balance sheet data in parallel with optimizations.
 */
async function getAllBalanceSheetData(userId, startDate = null, endDate = null) {
    console.log(`\n--- Fetching Balance Sheet Data for User: ${userId} ---`);
    console.log(`Date Range: ${startDate || 'ALL'} to ${endDate || 'ALL'}`);

    try {
        // Obtener datos de cuentas de forma consolidada
        const accountsDataPromise = getAccountsDataOptimized(userId, endDate);

        // Ejecutar consultas restantes en paralelo
        const [
            accountsData, AccountsReceivable, OtherReceivables,
            BusinessEquipment, Inventory, PrepaidExpenses, BusinessLoans,
            TaxesPayable, OwnerContribution, OwnerWithdrawal
        ] = await Promise.all([
            accountsDataPromise,
            getAccountsReceivable(userId, startDate, endDate),
            getOtherReceivables(userId, startDate, endDate),
            getBusinessEquipment(userId, startDate, endDate),
            getInventory(userId, startDate, endDate),
            getPrepaidExpenses(userId, startDate, endDate),
            getBusinessLoans(userId, startDate, endDate),
            getTaxesPayable(userId, startDate, endDate),
            getOwnerContribution(userId, startDate, endDate),
            getOwnerWithdrawal(userId, startDate, endDate)
        ]);

        const data = {
            "Cash": accountsData.cash,
            "Accounts Receivable": AccountsReceivable,
            "Other Receivables": OtherReceivables,
            "Business Savings/Reserves": accountsData.savings,
            "Business Equipment (Asset)": BusinessEquipment,
            "Inventory": Inventory,
            "Prepaid Expenses": PrepaidExpenses,
            "Loan Payments / Credit Cards": accountsData.creditDebt,
            "Business Loans 1": BusinessLoans,
            "Business Loans 2": 0.0, // Placeholder para préstamo adicional
            "Taxes Payable": TaxesPayable,
            "Owner's Contribution": OwnerContribution,
            "Owner's Withdrawal": OwnerWithdrawal,
        };

        // Calcular totales tomando valores absolutos donde aplica
        const totalAssets = (
            (data["Cash"] || 0) +
            (data["Accounts Receivable"] || 0) +
            (data["Other Receivables"] || 0) +
            (data["Business Savings/Reserves"] || 0) +
            (data["Business Equipment (Asset)"] || 0) +
            (data["Inventory"] || 0) +
            (data["Prepaid Expenses"] || 0)
        );

        const totalLiabilities = (
            (data["Loan Payments / Credit Cards"] || 0) +
            (data["Business Loans 1"] || 0) +
            (data["Taxes Payable"] || 0)
        );

        // Calcular patrimonio: contribuciones menos retiros
        const totalEquity = (data["Owner's Contribution"] || 0) - (data["Owner's Withdrawal"] || 0);

        // Ajuste necesario para que Assets = Liabilities + Equity
        const reconciliationAdjustment = parseFloat((totalAssets - (totalLiabilities + totalEquity)).toFixed(2));

        // Añadir fila de ajuste para conciliación; si es 0, no afecta
        data["Reconciliation Adjustment (to satisfy Assets = Liabilities + Equity)"] = reconciliationAdjustment;

        // Log de resumen para depuración
        console.log("✓ Balance Sheet data fetched successfully");
        console.log(`  - Total Assets: $${totalAssets.toFixed(2)}`);
        console.log(`  - Total Liabilities: $${totalLiabilities.toFixed(2)}`);
        console.log(`  - Total Equity: $${totalEquity.toFixed(2)}`);
        console.log(`  - Reconciliation Adjustment: $${reconciliationAdjustment.toFixed(2)}`);
        console.log(`  - Liabilities + Equity (before adjustment): $${(totalLiabilities + totalEquity).toFixed(2)}`);
        console.log(`  - Liabilities + Equity (after adjustment): $${(totalLiabilities + totalEquity + reconciliationAdjustment).toFixed(2)}`);

        return data;

    } catch (error) {
        console.error("Error fetching balance sheet data:", error);
        throw new Error(`Failed to fetch balance sheet data: ${error.message}`);
    }
}

module.exports = {
    getAllBalanceSheetData,
    getCashBalance,
    getAccountsReceivable,
    getOtherReceivables,
    getBusinessSavings,
    getBusinessEquipment,
    getInventory,
    getPrepaidExpenses,
    getCreditCardDebt,
    getBusinessLoans,
    getTaxesPayable,
    getOwnerContribution,
    getOwnerWithdrawal,
    getAccountsDataOptimized
};
