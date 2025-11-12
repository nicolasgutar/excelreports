// utils.js

/**
 * Converts a Google Sheets color object to an ExcelJS ARGB hex string.
 * @param {object} rgb - e.g., { red: 0.44, green: 0.19, blue: 0.63 }
 * @returns {string} - e.g., 'FF7030A0'
 */
function rgbToArgb(rgb) {
    if (!rgb || rgb.red === undefined) {
        console.warn("Invalid RGB object", rgb);
        return 'FFFFFFFF'; // Default to white on error
    }
    const r = Math.round(rgb.red * 255).toString(16).padStart(2, '0');
    const g = Math.round(rgb.green * 255).toString(16).padStart(2, '0');
    const b = Math.round(rgb.blue * 255).toString(16).padStart(2, '0');
    return `FF${r}${g}${b}`.toUpperCase();
}

// --- CONSTANTS ---

// P&L Colors
const L_PURPLE_HEADER_TEXT = { argb: rgbToArgb({ red: 0.44, green: 0.19, blue: 0.63 }) };
const L_WHITE_BG = { argb: rgbToArgb({ red: 1.0, green: 1.0, blue: 1.0 }) };
const L_UNCA_BG = { argb: rgbToArgb({ red: 0.945, green: 0.725, blue: 0.725 }) };
const L_ITEM_BG = { argb: rgbToArgb({ red: 0.91, green: 0.898, blue: 0.93 }) };
const L_BORDER_COLOR = { argb: rgbToArgb({ red: 0.7, green: 0.7, blue: 0.7 }) };
const L_ACTUAL_TEXT = { argb: rgbToArgb({ red: 0.2, green: 0.2, blue: 0.2 }) };

// Balance Sheet Colors
const COLOR_MAJOR_HEADER_BG = { argb: rgbToArgb({ red: 0.35, green: 0.30, blue: 0.29 }) };
const COLOR_HEADER_FONT = { argb: rgbToArgb({ red: 1.0, green: 1.0, blue: 1.0 }) };

// Transactions Colors
const COLOR_TRANS_HEADER_BG = { argb: 'FF7030A0' }; // Hardcoded from your P&L purple
const COLOR_TRANS_HEADER_FONT = { argb: 'FFFFFFFF' };

// --- FORMATS ---

const CURRENCY_FORMAT = '$#,##0.00';
const BOLD_FONT = { bold: true };

/**
 * Zips arrays, padding the shorter ones with a fillValue.
 * @param {Array} arr1
 * @param {Array} arr2
 * @param {*} fillValue
 * @returns {Array}
 */
function zipLongest(arr1, arr2, fillValue) {
    const length = Math.max(arr1.length, arr2.length);
    const zipped = [];
    for (let i = 0; i < length; i++) {
        zipped.push([
            arr1[i] || fillValue,
            arr2[i] || fillValue
        ]);
    }
    return zipped;
}

module.exports = {
    zipLongest,
    rgbToArgb,
    // P&L
    L_PURPLE_HEADER_TEXT, L_WHITE_BG, L_UNCA_BG, L_ITEM_BG, L_BORDER_COLOR, L_ACTUAL_TEXT,
    // Balance Sheet
    COLOR_MAJOR_HEADER_BG, COLOR_HEADER_FONT,
    // Transactions
    COLOR_TRANS_HEADER_BG, COLOR_TRANS_HEADER_FONT,
    // Shared
    CURRENCY_FORMAT, BOLD_FONT
};
