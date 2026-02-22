// ── Config ────────────────────────────────────────────────────────────────────
// Replace with your deployed Google Apps Script Web App URL
const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

// Map center: Leucadia / Encinitas border area
const MAP_CENTER = [33.063, -117.299];
const MAP_ZOOM   = 13;

// ── Init map ──────────────────────────────────────────────────────────────────
const map = L.map('heat-map').setView(MAP_CENTER, MAP_ZOOM);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

// ── Load data and render heat layer ──────────────────────────────────────────
async function loadHeatMap() {
  try {
    const res    = await fetch(SCRIPT_URL);
    const points = await res.json(); // expected: [[lat, lng, intensity], ...]

    document.getElementById('loading-msg').style.display  = 'none';
    document.getElementById('heat-map').style.display     = 'block';
    document.getElementById('legend').style.display       = 'flex';

    // Invalidate size after making the map visible
    map.invalidateSize();

    if (!points || points.length === 0) {
      document.getElementById('map-count').textContent =
        'No pinned answers yet — be the first!';
      return;
    }

    const count = points.length;
    document.getElementById('map-count').textContent =
      `${count} answer${count === 1 ? '' : 's'} plotted.`;

    L.heatLayer(points, {
      radius:  28,
      blur:    20,
      maxZoom: 17,
      gradient: { 0.2: '#4575b4', 0.5: '#fee090', 1.0: '#d73027' },
    }).addTo(map);

    // Auto-fit map to the data extent
    const latlngs = points.map(p => [p[0], p[1]]);
    if (latlngs.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
    }

  } catch (err) {
    document.getElementById('loading-msg').textContent =
      'Could not load map data. Please try again later.';
    console.error('Heat map load error:', err);
  }
}

loadHeatMap();
