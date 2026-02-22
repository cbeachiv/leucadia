/**
 * Google Apps Script — wheredoesleucadiastart.com
 *
 * Deploy this at script.google.com as a Web App:
 *   Execute as:        Me (chasetbeach@gmail.com)
 *   Who has access:    Anyone
 *
 * After deploying, copy the Web App URL and replace
 * 'YOUR_APPS_SCRIPT_URL_HERE' in:
 *   - js/submit.js
 *   - js/heatmap.js
 *   - index.html (the fetch at the bottom)
 */

const SHEET_ID = '1d1l4PdVhlhUXU4lEUsYZOlj666KKcYE9OVYgGhQTVMM';

// ── doPost: receive form submission, append row ───────────────────────────────
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const data  = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.name   || '',
      data.email  || '',
      new Date().toISOString(),
      data.answer || '',
      data.lat    || '',
      data.lng    || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── doGet: return all lat/lng points for the heat map ────────────────────────
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const rows  = sheet.getDataRange().getValues();

    // Skip header row (row 0); columns: Name=0, Email=1, Date=2, Answer=3, lat=4, lng=5
    const points = rows.slice(1)
      .filter(row => row[4] !== '' && row[5] !== '')
      .map(row => [
        parseFloat(row[4]),  // lat
        parseFloat(row[5]),  // lng
        1,                   // intensity (uniform — heat layer handles density)
      ]);

    // Also return total row count (including rows without pins) for the submissions counter
    const totalRows = rows.length - 1; // subtract header

    return ContentService
      .createTextOutput(JSON.stringify(points))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
