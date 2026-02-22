/**
 * scripts/geocode.js
 *
 * One-time script: reads existing text answers from Google Sheets,
 * geocodes them using Nominatim (free, no API key), and writes
 * lat/lng back to the sheet.
 *
 * Usage:
 *   npm install googleapis node-fetch
 *   node scripts/geocode.js
 *
 * Before running, set these environment variables (or edit the CONFIG below):
 *   GOOGLE_SERVICE_ACCOUNT_KEY  — path to your service account JSON key file
 *                                  (see README for how to create one)
 *   SHEET_ID                    — your Google Sheet ID
 */

import { google }  from 'googleapis';
import fetch        from 'node-fetch';
import { readFile } from 'fs/promises';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SHEET_ID     = process.env.SHEET_ID || '1d1l4PdVhlhUXU4lEUsYZOlj666KKcYE9OVYgGhQTVMM';
const KEY_FILE     = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './service-account-key.json';
const SHEET_TAB    = 'Sheet1'; // change if your tab has a different name

// Column indices (0-based) in your sheet:
// A=Name, B=Email, C=Submission Date, D=Encinitas/Leucadia Town Line, E=lat, F=lng
const COL_ANSWER   = 3; // D — text answer to geocode
const COL_LAT      = 4; // E — where we'll write latitude
const COL_LNG      = 5; // F — where we'll write longitude

// Nominatim requires a delay between requests (1 req/sec max)
const DELAY_MS     = 1100;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function geocode(text) {
  // Append location context to help the geocoder
  const query = encodeURIComponent(`${text}, Encinitas, CA`);
  const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`;

  const res  = await fetch(url, {
    headers: { 'User-Agent': 'wheredoesleucadiastart.com/1.0 (chasetbeach@gmail.com)' },
  });
  const data = await res.json();

  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  // Auth via service account
  const keyContent = JSON.parse(await readFile(KEY_FILE, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyContent,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch all rows
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A1:F`,
  });

  const rows = data.values || [];
  if (rows.length <= 1) {
    console.log('No data rows found.');
    return;
  }

  console.log(`Found ${rows.length - 1} data rows (excluding header).`);

  let geocoded = 0, skipped = 0, failed = 0;

  for (let i = 1; i < rows.length; i++) {
    const row    = rows[i];
    const answer = row[COL_ANSWER] || '';
    const hasLat = row[COL_LAT] && row[COL_LAT].trim() !== '';
    const hasLng = row[COL_LNG] && row[COL_LNG].trim() !== '';

    // Skip rows that already have coordinates
    if (hasLat && hasLng) {
      console.log(`Row ${i + 1}: already has lat/lng — skipping`);
      skipped++;
      continue;
    }

    // Skip empty text answers
    if (!answer.trim()) {
      console.log(`Row ${i + 1}: empty answer — skipping`);
      skipped++;
      continue;
    }

    console.log(`Row ${i + 1}: geocoding "${answer}"`);
    await sleep(DELAY_MS);

    const result = await geocode(answer);

    if (result) {
      // Write lat/lng back to the sheet (A1 notation: row is i+1, cols E & F)
      const rowNum = i + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!E${rowNum}:F${rowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[result.lat, result.lng]] },
      });
      console.log(`  ✓ ${result.lat}, ${result.lng}`);
      geocoded++;
    } else {
      console.log(`  ✗ Could not geocode — check this row manually`);
      failed++;
    }
  }

  console.log(`\nDone. Geocoded: ${geocoded}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
  if (failed > 0) {
    console.log('Rows that failed will not appear on the heat map until manually updated.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
