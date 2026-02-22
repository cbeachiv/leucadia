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

// ── geocodeExistingRows: run once manually to backfill lat/lng ────────────────
// Before running: edit col D in the sheet so answers are clean addresses or
// intersections (e.g. "La Costa Ave & Coast Hwy 101, Encinitas, CA").
// Rows that already have lat/lng are skipped automatically.
// In the Apps Script editor: select this function from the dropdown, click Run.
function geocodeExistingRows() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const rows  = sheet.getDataRange().getValues();

  let geocoded = 0, skipped = 0, failed = 0;

  for (let i = 1; i < rows.length; i++) {
    const row    = rows[i];
    // Use col G (geocode_address) if present, otherwise fall back to col D (original answer)
    const geocodeAddr = (row[6] || '').toString().trim();
    const answer      = geocodeAddr || (row[3] || '').toString().trim();
    const hasLat = row[4] !== '' && row[4] != null;
    const hasLng = row[5] !== '' && row[5] != null;

    if (hasLat && hasLng) {
      Logger.log('Row ' + (i + 1) + ': already has coordinates — skipping');
      skipped++;
      continue;
    }

    if (!answer) {
      Logger.log('Row ' + (i + 1) + ': empty answer — skipping');
      skipped++;
      continue;
    }

    Utilities.sleep(1200); // Nominatim rate limit: max 1 request per second

    const query = encodeURIComponent(answer + ', Encinitas, CA');
    const url   = 'https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1&countrycodes=us';

    try {
      const response = UrlFetchApp.fetch(url, {
        headers: { 'User-Agent': 'wheredoesleucadiastart.com/1.0 (chasetbeach@gmail.com)' },
        muteHttpExceptions: true,
      });
      const data = JSON.parse(response.getContentText());

      if (data && data.length > 0) {
        sheet.getRange('E' + (i + 1) + ':F' + (i + 1)).setValues([[
          parseFloat(data[0].lat),
          parseFloat(data[0].lon),
        ]]);
        Logger.log('Row ' + (i + 1) + ': ✓ ' + data[0].lat + ', ' + data[0].lon + ' — "' + answer + '"');
        geocoded++;
      } else {
        Logger.log('Row ' + (i + 1) + ': ✗ No result — "' + answer + '"');
        failed++;
      }
    } catch (err) {
      Logger.log('Row ' + (i + 1) + ': Error — ' + err.toString());
      failed++;
    }
  }

  Logger.log('─────────────────────────────────────');
  Logger.log('Done.  Geocoded: ' + geocoded + '  |  Skipped: ' + skipped + '  |  Failed: ' + failed);
}

// ── doGet: return all lat/lng points for the heat map ────────────────────────
function doGet() {
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

    return ContentService
      .createTextOutput(JSON.stringify(points))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
