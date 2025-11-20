import ExcelJS from 'exceljs';
import {
    L_PURPLE_HEADER_TEXT, L_UNCA_BG, L_ITEM_BG, L_BORDER_COLOR, L_ACTUAL_TEXT,
    COLOR_MAJOR_HEADER_BG, COLOR_HEADER_FONT,
    COLOR_TRANS_HEADER_BG, COLOR_TRANS_HEADER_FONT,
    CURRENCY_FORMAT, BOLD_FONT
} from './utils.js';
import { Transaction } from './dbQueries.js';

async function createReportsInExcel(
    userId: string,
    pnlDf: (string | number | { formula: string } | null)[][],
    balanceSheetDf: (string | number | { formula: string } | null)[][] | null,
    transactionsDf: Transaction[],
    personalPnlDf: (string | number | { formula: string } | null)[][],
    businessPnlDf: (string | number | { formula: string } | null)[][]
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Financial Reports API';
    workbook.lastModifiedBy = 'Financial Reports API';
    workbook.created = new Date();

    if (pnlDf) {
        const sheet = workbook.addWorksheet('P&L');
        sheet.addRows(pnlDf);
        applyPnlFormatting(sheet);
    }

    if (balanceSheetDf) {
        const sheet = workbook.addWorksheet('Balance Sheet');
        sheet.addRows(balanceSheetDf);
        applyBalanceSheetFormatting(sheet);
    }

    if (personalPnlDf) {
        const sheet = workbook.addWorksheet('P&L Personal');
        sheet.addRows(personalPnlDf);
        applyPnlFormatting(sheet);
    }

    if (businessPnlDf) {
        const sheet = workbook.addWorksheet('P&L Business');
        sheet.addRows(businessPnlDf);
        applyPnlFormatting(sheet);
    }

    if (transactionsDf && transactionsDf.length > 0) {
        const sheet = workbook.addWorksheet('Transactions');
        sheet.addRow(Object.keys(transactionsDf[0]));
        transactionsDf.forEach(row => {
            sheet.addRow(Object.values(row));
        });
        applyTransactionsFormatting(sheet);
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
}

function applyPnlFormatting(worksheet: ExcelJS.Worksheet): void {
    worksheet.views = [{ showGridLines: false }];
    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 20;
    worksheet.getColumn('C').width = 30;
    worksheet.getColumn('D').width = 20;

    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { ...BOLD_FONT, size: 18, color: { argb: L_PURPLE_HEADER_TEXT.argb } };

    const headerRow = worksheet.getRow(2);
    headerRow.font = { ...BOLD_FONT, size: 14, color: { argb: L_PURPLE_HEADER_TEXT.argb } };
    headerRow.getCell('B').numFmt = CURRENCY_FORMAT;

    const actualRow = worksheet.getRow(3);
    ['B', 'D'].forEach(col => {
        const cell = actualRow.getCell(col);
        cell.font = { ...BOLD_FONT, color: { argb: L_ACTUAL_TEXT.argb }, underline: true };
        cell.alignment = { horizontal: 'right' };
    });

    worksheet.mergeCells('A4:B4');
    worksheet.mergeCells('C4:D4');
    worksheet.getRow(4).getCell('A').border = { top: { style: 'thin', color: L_BORDER_COLOR } };
    worksheet.getRow(4).getCell('C').border = { top: { style: 'thin', color: L_BORDER_COLOR } };

    worksheet.getColumn('B').numFmt = CURRENCY_FORMAT;
    worksheet.getColumn('D').numFmt = CURRENCY_FORMAT;

    ['B2', 'D2'].forEach(addr => worksheet.getCell(addr).numFmt = CURRENCY_FORMAT);
    ['B3', 'D3'].forEach(addr => worksheet.getCell(addr).numFmt = '');

    const excelUncategorizedFormulaA = 'ISNUMBER(SEARCH("Uncategorized", $A5))';
    const excelUncategorizedFormulaC = 'ISNUMBER(SEARCH("Uncategorized", $C5))';

    worksheet.addConditionalFormatting({
        ref: `A5:B${worksheet.rowCount}`,
        rules: [
            { type: 'expression', formulae: [excelUncategorizedFormulaA], priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: L_UNCA_BG } } }
        ]
    });
    worksheet.addConditionalFormatting({
        ref: `C5:D${worksheet.rowCount}`,
        rules: [
            { type: 'expression', formulae: [excelUncategorizedFormulaC], priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: L_UNCA_BG } } }
        ]
    });

    for (let i = 5; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);

        const cellValueA = row.getCell('A').value;
        if (cellValueA && typeof cellValueA === 'string') {
            const isSubcategory = cellValueA.startsWith('  ');

            if (isSubcategory) {
                row.getCell('A').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
                row.getCell('A').font = { italic: true, size: 10 };
                row.getCell('A').alignment = { indent: 1 };
                row.getCell('B').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
                row.getCell('B').font = { italic: true, size: 10 };
                row.getCell('B').alignment = { horizontal: 'right' };
            } else {
                row.getCell('A').fill = { type: 'pattern', pattern: 'solid', fgColor: L_ITEM_BG };
                row.getCell('A').font = BOLD_FONT;
                row.getCell('B').font = BOLD_FONT;
                row.getCell('B').alignment = { horizontal: 'right' };
            }
        }

        const cellValueC = row.getCell('C').value;
        if (cellValueC && typeof cellValueC === 'string') {
            const isSubcategory = cellValueC.startsWith('  ');

            if (isSubcategory) {
                row.getCell('C').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
                row.getCell('C').font = { italic: true, size: 10 };
                row.getCell('C').alignment = { indent: 1 };
                row.getCell('D').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
                row.getCell('D').font = { italic: true, size: 10 };
                row.getCell('D').alignment = { horizontal: 'right' };
            } else {
                row.getCell('C').fill = { type: 'pattern', pattern: 'solid', fgColor: L_ITEM_BG };
                row.getCell('C').font = BOLD_FONT;
                row.getCell('D').font = BOLD_FONT;
                row.getCell('D').alignment = { horizontal: 'right' };
            }
        }
    }
}

function applyBalanceSheetFormatting(worksheet: ExcelJS.Worksheet): void {
    worksheet.views = [{ showGridLines: false }];
    worksheet.getColumn('A').width = 40;
    worksheet.getColumn('B').width = 20;
    worksheet.getColumn('B').numFmt = CURRENCY_FORMAT;

    const majorHeaderRows = [2, 14, 23];
    const subHeaderRows = [15];
    const totalRows = [11, 21, 28, 30];
    const titleRow = [1];

    for (let i = 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);

        if (row.getCell('B').value === null) {
            row.getCell('B').numFmt = '';
        }

        if (majorHeaderRows.includes(i)) {
            row.getCell('A').fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_MAJOR_HEADER_BG };
            row.getCell('A').font = { ...BOLD_FONT, color: { argb: COLOR_HEADER_FONT.argb } };
        } else if (subHeaderRows.includes(i) || totalRows.includes(i) || titleRow.includes(i)) {
            row.getCell('A').font = BOLD_FONT;
            row.getCell('B').font = BOLD_FONT;
        }
    }
}

function applyTransactionsFormatting(worksheet: ExcelJS.Worksheet): void {
    worksheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 1 }];
    const headerRow = worksheet.getRow(1);
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_TRANS_HEADER_BG };
    headerRow.font = { ...BOLD_FONT, color: { argb: COLOR_TRANS_HEADER_FONT.argb } };
    worksheet.getColumn('E').numFmt = CURRENCY_FORMAT;
}

export { createReportsInExcel };
