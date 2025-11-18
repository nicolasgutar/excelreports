// excelGenerator.js
const ExcelJS = require('exceljs');
const {
    // P&L
    L_PURPLE_HEADER_TEXT, L_WHITE_BG, L_UNCA_BG, L_ITEM_BG, L_BORDER_COLOR, L_ACTUAL_TEXT,
    // Balance Sheet
    COLOR_MAJOR_HEADER_BG, COLOR_HEADER_FONT,
    // Transactions
    COLOR_TRANS_HEADER_BG, COLOR_TRANS_HEADER_FONT,
    // Shared
    CURRENCY_FORMAT, BOLD_FONT
} = require('./utils');

/**
 * Main function to create the Excel workbook in memory
 */
async function createReportsInExcel(
    userId, pnlDf, balanceSheetDf, transactionsDf,
    personalPnlDf, businessPnlDf
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Financial Reports API';
    workbook.lastModifiedBy = 'Financial Reports API';
    workbook.created = new Date();

    // 1. General P&L Sheet
    if (pnlDf) {
        const sheet = workbook.addWorksheet('P&L');
        sheet.addRows(pnlDf);
        applyPnlFormatting(sheet);
    }

    // 2. Balance Sheet
    if (balanceSheetDf) {
        const sheet = workbook.addWorksheet('Balance Sheet');
        sheet.addRows(balanceSheetDf);
        applyBalanceSheetFormatting(sheet);
    }
    
    // 3. Personal P&L
    if (personalPnlDf) {
        const sheet = workbook.addWorksheet('P&L Personal');
        sheet.addRows(personalPnlDf);
        applyPnlFormatting(sheet); // Re-use the same formatting
    }
    
    // 4. Business P&L
    if (businessPnlDf) {
        const sheet = workbook.addWorksheet('P&L Business');
        sheet.addRows(businessPnlDf);
        applyPnlFormatting(sheet); // Re-use the same formatting
    }

    // 5. Transactions Sheet
    if (transactionsDf && transactionsDf.length > 0) {
        const sheet = workbook.addWorksheet('Transactions');
        // Add header row from keys
        sheet.addRow(Object.keys(transactionsDf[0]));
        // Add data rows
        transactionsDf.forEach(row => {
            sheet.addRow(Object.values(row));
        });
        applyTransactionsFormatting(sheet);
    }

    // Write to buffer and return
    return await workbook.xlsx.writeBuffer();
}

// --- P&L FORMATTING ---
function applyPnlFormatting(worksheet) {
    // 1. Hide Gridlines
    worksheet.views = [{ showGridLines: false }];

    // 2. Set Column Widths (ExcelJS autoFit is unreliable)
    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 20;
    worksheet.getColumn('C').width = 30;
    worksheet.getColumn('D').width = 20;
    
    // 3. Format Main Title (Row 1)
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { ...BOLD_FONT, size: 18, color: L_PURPLE_HEADER_TEXT.argb };

    // 4. Format Section Headers & Totals (Row 2)
    const headerRow = worksheet.getRow(2);
    headerRow.font = { ...BOLD_FONT, size: 14, color: L_PURPLE_HEADER_TEXT.argb };
    headerRow.getCell('B').numFmt = CURRENCY_FORMAT;
    headerRow.getCell('D').numFmt = CURRENCY_FORMAT;

    // 5. Format "Actual" Sub-Headers (Row 3)
    const actualRow = worksheet.getRow(3);
    ['B', 'D'].forEach(col => {
        const cell = actualRow.getCell(col);
        cell.font = { ...BOLD_FONT, color: L_ACTUAL_TEXT.argb, underline: true };
        cell.alignment = { horizontal: 'right' };
    });

    // 6. Format Divider Line (Row 4)
    worksheet.mergeCells('A4:B4');
    worksheet.mergeCells('C4:D4');
    worksheet.getRow(4).getCell('A').border = { top: { style: 'thin', color: L_BORDER_COLOR } };
    worksheet.getRow(4).getCell('C').border = { top: { style: 'thin', color: L_BORDER_COLOR } };

    // 7. Apply Currency Formatting (Rows 5+)
    worksheet.getColumn('B').numFmt = CURRENCY_FORMAT;
    worksheet.getColumn('D').numFmt = CURRENCY_FORMAT;
    
    // Clear currency format on header rows
    ['B2', 'D2'].forEach(addr => worksheet.getCell(addr).numFmt = CURRENCY_FORMAT);
    ['B3', 'D3'].forEach(addr => worksheet.getCell(addr).numFmt = null);


    // 8. Conditional Formatting (Rows 5+)
    // Excel formula is different from Google Sheets REGEXMATCH
    const excelUncategorizedFormulaA = 'ISNUMBER(SEARCH("Uncategorized", $A5))';
    const excelUncategorizedFormulaC = 'ISNUMBER(SEARCH("Uncategorized", $C5))';

    worksheet.addConditionalFormatting({
        ref: `A5:B${worksheet.rowCount}`,
        rules: [
            { type: 'expression', formulae: [excelUncategorizedFormulaA], style: { fill: { type: 'pattern', pattern: 'solid', fgColor: L_UNCA_BG } } }
        ]
    });
    worksheet.addConditionalFormatting({
        ref: `C5:D${worksheet.rowCount}`,
        rules: [
            { type: 'expression', formulae: [excelUncategorizedFormulaC], style: { fill: { type: 'pattern', pattern: 'solid', fgColor: L_UNCA_BG } } }
        ]
    });
    
    // 9. Format rows with different styles for categories vs subcategories
    for (let i = 5; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);

        // Col A - Check if this is a subcategory (starts with 2 spaces)
        const cellValueA = row.getCell('A').value;
        if (cellValueA && typeof cellValueA === 'string') {
            const isSubcategory = cellValueA.startsWith('  ');

            if (isSubcategory) {
                // Subcategory formatting - lighter background, italic font
                row.getCell('A').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; // Light gray
                row.getCell('A').font = { italic: true, size: 10 };
                row.getCell('A').alignment = { indent: 1 }; // Additional indent in Excel
                row.getCell('B').font = { italic: true, size: 10 };
            } else {
                // Main category formatting - bold
                row.getCell('A').fill = { type: 'pattern', pattern: 'solid', fgColor: L_ITEM_BG };
                row.getCell('A').font = BOLD_FONT;
                row.getCell('B').font = BOLD_FONT;
            }
        }

        // Col C - Check if this is a subcategory (starts with 2 spaces)
        const cellValueC = row.getCell('C').value;
        if (cellValueC && typeof cellValueC === 'string') {
            const isSubcategory = cellValueC.startsWith('  ');

            if (isSubcategory) {
                // Subcategory formatting - lighter background, italic font
                row.getCell('C').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }; // Light gray
                row.getCell('C').font = { italic: true, size: 10 };
                row.getCell('C').alignment = { indent: 1 }; // Additional indent in Excel
                row.getCell('D').font = { italic: true, size: 10 };
            } else {
                // Main category formatting - bold
                row.getCell('C').fill = { type: 'pattern', pattern: 'solid', fgColor: L_ITEM_BG };
                row.getCell('C').font = BOLD_FONT;
                row.getCell('D').font = BOLD_FONT;
            }
        }
    }
}

// --- BALANCE SHEET FORMATTING ---
function applyBalanceSheetFormatting(worksheet) {
    worksheet.views = [{ showGridLines: false }];
    worksheet.getColumn('A').width = 40;
    worksheet.getColumn('B').width = 20;

    // Apply Currency to Column B
    worksheet.getColumn('B').numFmt = CURRENCY_FORMAT;
    
    // Define row styles
    const majorHeaderRows = [2, 14, 23]; // ASSETS, LIABILITIES, OWNER'S EQUITY
    const subHeaderRows = [15]; // CURRENT LIABILITIES
    const totalRows = [11, 21, 28, 30]; // Total Assets, Total Liab, Total Equity, Total L&E
    const titleRow = [1]; // BALANCE SHEET

    for (let i = 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        
        // Clear currency on non-data rows
        if (row.getCell('B').value === null) {
            row.getCell('B').numFmt = null;
        }

        if (majorHeaderRows.includes(i)) {
            row.getCell('A').fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_MAJOR_HEADER_BG };
            row.getCell('A').font = { ...BOLD_FONT, color: COLOR_HEADER_FONT.argb };
        } else if (subHeaderRows.includes(i) || totalRows.includes(i) || titleRow.includes(i)) {
            row.getCell('A').font = BOLD_FONT;
            row.getCell('B').font = BOLD_FONT;
        }
    }
}

// --- TRANSACTIONS FORMATTING ---
function applyTransactionsFormatting(worksheet) {
    worksheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 1 }]; // Freeze header
    
    // Format Header
    const headerRow = worksheet.getRow(1);
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_TRANS_HEADER_BG };
    headerRow.font = { ...BOLD_FONT, color: COLOR_TRANS_HEADER_FONT.argb };
    
    // Format Amount column (E)
    worksheet.getColumn('E').numFmt = CURRENCY_FORMAT;
    
    // Set column widths
    worksheet.columns = [
        { key: 'Date', width: 12 },
        { key: 'Transaction Name', width: 30 },
        { key: 'Category', width: 20 },
        { key: 'Subcategory', width: 20 },
        { key: 'Amount', width: 15 },
        { key: 'Merchant', width: 25 },
        { key: 'Description', width: 40 },
        { key: 'Account', width: 20 },
        { key: 'Status', width: 10 }
    ];
}

module.exports = { createReportsInExcel };
