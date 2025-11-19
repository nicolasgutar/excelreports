// balance_sheet.js

function generateBalanceSheet(userData, userId, netIncome) {
    console.log(`--- Generating Balance Sheet for ${userId} ---`);

    // Función helper para asegurar valores absolutos positivos
    const ensureAbsoluteValue = (value) => {
        const num = parseFloat(value) || 0;
        return Math.abs(num);
    };

    // 1. ASSETS - Usar valores absolutos para activos
    const cashValue = ensureAbsoluteValue(userData["Cash"]);
    const accountsReceivableValue = ensureAbsoluteValue(userData["Accounts Receivable"]);
    const otherReceivablesValue = ensureAbsoluteValue(userData["Other Receivables"]);
    const businessSavingsValue = ensureAbsoluteValue(userData["Business Savings/Reserves"]);
    const businessEquipmentValue = ensureAbsoluteValue(userData["Business Equipment (Asset)"]);
    const inventoryValue = ensureAbsoluteValue(userData["Inventory"]);
    const prepaidExpensesValue = ensureAbsoluteValue(userData["Prepaid Expenses"]);

    const assets = [
        cashValue, accountsReceivableValue, otherReceivablesValue,
        businessSavingsValue, businessEquipmentValue,
        inventoryValue, prepaidExpensesValue,
    ];
    const totalAssets = assets.reduce((sum, val) => sum + val, 0);

    // 2. LIABILITIES - Usar valores absolutos para pasivos
    const creditCardDebtValue = ensureAbsoluteValue(userData["Loan Payments / Credit Cards"]);
    const businessLoans1Value = ensureAbsoluteValue(userData["Business Loans 1"]);
    const businessLoans2Value = ensureAbsoluteValue(userData["Business Loans 2"]);
    const taxesPayableValue = ensureAbsoluteValue(userData["Taxes Payable"]);

    const liabilities = [
        creditCardDebtValue, businessLoans1Value,
        businessLoans2Value, taxesPayableValue,
    ];
    const totalLiabilities = liabilities.reduce((sum, val) => sum + val, 0);

    // 3. EQUITY - Manejar correctamente valores positivos y negativos
    const ownerContribution = ensureAbsoluteValue(userData["Owner's Contribution"]);
    // Los retiros son negativos para el equity, así que restamos el valor absoluto
    const ownerWithdrawal = ensureAbsoluteValue(userData["Owner's Withdrawal"]);
    // NetIncome puede ser positivo o negativo
    const netIncomeValue = parseFloat(netIncome) || 0;

    const retainedEarnings = netIncomeValue - ownerWithdrawal;
    const totalEquity = ownerContribution + retainedEarnings;

    // 4. VALIDACIÓN DE LA ECUACIÓN CONTABLE
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const difference = totalAssets - totalLiabilitiesAndEquity;
    const tolerance = 0.01; // Tolerancia para errores de redondeo

    console.log(`\n=== BALANCE SHEET VALIDATION ===`);
    console.log(`Assets: $${totalAssets.toFixed(2)}`);
    console.log(`Liabilities: $${totalLiabilities.toFixed(2)}`);
    console.log(`Equity: $${totalEquity.toFixed(2)}`);
    console.log(`L + E: $${totalLiabilitiesAndEquity.toFixed(2)}`);
    console.log(`Difference: $${difference.toFixed(2)}`);

    let balanceStatus = "BALANCED";
    let adjustmentNeeded = 0;
    let adjustmentDescription = "Balance sheet is balanced";

    if (Math.abs(difference) >= tolerance) {
        balanceStatus = "UNBALANCED";
        adjustmentNeeded = Math.abs(difference);

        if (difference > 0) {
            // Assets > Liabilities + Equity
            adjustmentDescription = `Need to increase Liabilities or Equity by $${adjustmentNeeded.toFixed(2)}`;
        } else {
            // Assets < Liabilities + Equity
            adjustmentDescription = `Need to increase Assets or decrease Liabilities/Equity by $${adjustmentNeeded.toFixed(2)}`;
        }

        console.warn(`⚠ WARNING: Balance sheet does not balance!`);
        console.warn(`   ${adjustmentDescription}`);
    } else {
        console.log(`✓ Balance sheet balances: $${totalAssets.toFixed(2)}`);
    }

    // 5. STRUCTURE DATA - Incluir información de balanceamiento
    const data = [
        ["BALANCE SHEET", null],
        ["", null],
        ["ASSETS", null],
        ["Cash", cashValue],
        ["Accounts Receivable", accountsReceivableValue],
        ["Other Receivables", otherReceivablesValue],
        ["Business Savings/Reserves", businessSavingsValue],
        ["Business Equipment (Asset)", businessEquipmentValue],
        ["Inventory", inventoryValue],
        ["Prepaid Expenses", prepaidExpensesValue],
        ["", null],
        ["Total Assets", totalAssets],
        ["", null],
        ["LIABILITIES & EQUITY", null],
        ["", null],
        ["LIABILITIES", null],
        ["CURRENT LIABILITIES", null],
        ["Loan Payments / Credit Cards", creditCardDebtValue],
        ["Business Loans 1", businessLoans1Value],
        ["Business Loans 2", businessLoans2Value],
        ["Taxes Payable", taxesPayableValue],
        ["", null],
        ["Total Liabilities", totalLiabilities],
        ["", null],
        ["OWNER'S EQUITY", null],
        ["Owner's Contribution", ownerContribution],
        ["Owner's Withdrawal", -ownerWithdrawal], // Mostrar como negativo
        ["Retained Earnings (Net Income)", netIncomeValue],
        ["", null],
        ["Total Owner's Equity", totalEquity],
        ["", null],
        ["Total Liabilities and Owner's Equity", totalLiabilitiesAndEquity],
        ["", null],
        ["=== BALANCE VALIDATION ===", null],
        ["Balance Status", balanceStatus],
        ["Difference (Assets - L&E)", difference],
        ["Adjustment Needed", adjustmentNeeded > 0 ? adjustmentNeeded : null],
        ["Adjustment Description", adjustmentDescription],
        ["", null],
        ["Accounting Equation Check:", null],
        ["Assets", totalAssets],
        ["= Liabilities + Equity", totalLiabilitiesAndEquity],
        ["Equation Balanced?", Math.abs(difference) < tolerance ? "✓ YES" : "✗ NO"],
    ];
    
    // Agregar información adicional para debugging si hay desbalance
    if (Math.abs(difference) >= tolerance) {
        data.push(
            ["", null],
            ["=== DEBUGGING INFO ===", null],
            ["Assets Breakdown:", null],
            [`  Cash: $${cashValue.toFixed(2)}`, null],
            [`  A/R: $${accountsReceivableValue.toFixed(2)}`, null],
            [`  Other Receivables: $${otherReceivablesValue.toFixed(2)}`, null],
            [`  Savings: $${businessSavingsValue.toFixed(2)}`, null],
            [`  Equipment: $${businessEquipmentValue.toFixed(2)}`, null],
            [`  Inventory: $${inventoryValue.toFixed(2)}`, null],
            [`  Prepaid: $${prepaidExpensesValue.toFixed(2)}`, null],
            ["", null],
            ["Liabilities + Equity Breakdown:", null],
            [`  Credit Cards/Loans: $${creditCardDebtValue.toFixed(2)}`, null],
            [`  Business Loans: $${(businessLoans1Value + businessLoans2Value).toFixed(2)}`, null],
            [`  Taxes Payable: $${taxesPayableValue.toFixed(2)}`, null],
            [`  Owner Contribution: $${ownerContribution.toFixed(2)}`, null],
            [`  Owner Withdrawal: -$${ownerWithdrawal.toFixed(2)}`, null],
            [`  Net Income: $${netIncomeValue.toFixed(2)}`, null]
        );
    }

    // Retornar el array de datos para Excel, no un objeto
    return data;
}

module.exports = { generateBalanceSheet };
