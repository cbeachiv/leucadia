// ── Config ────────────────────────────────────────────────────────────────────
// Replace with your deployed Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-kRLJkScaHUe3E-pN9Q8F6v-FO_gt4LV7ml2R4hWdbYRlcq6O40CYVTLYnIj-4vIYiA/exec';

// Leucadia / Encinitas border area center
const MAP_CENTER = [33.063, -117.299];
const MAP_ZOOM   = 14;

// ── Map setup ─────────────────────────────────────────────────────────────────
const map = L.map('pin-map').setView(MAP_CENTER, MAP_ZOOM);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

// Custom coral-colored pin marker
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 22px; height: 22px;
    background: #e05c3a;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

let marker = null;

map.on('click', function (e) {
  const { lat, lng } = e.latlng;

  // Place or move the marker
  if (marker) {
    marker.setLatLng(e.latlng);
  } else {
    marker = L.marker(e.latlng, { icon: pinIcon }).addTo(map);
  }

  // Populate hidden fields
  document.getElementById('lat').value = lat.toFixed(6);
  document.getElementById('lng').value = lng.toFixed(6);

  // Show coordinates
  document.getElementById('pin-coords').textContent =
    `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  // Hide validation message if it was showing
  document.getElementById('pin-required-msg').style.display = 'none';
});

// ── Form submission ───────────────────────────────────────────────────────────
document.getElementById('submission-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name   = document.getElementById('name').value.trim();
  const email  = document.getElementById('email').value.trim();
  const answer = document.getElementById('answer').value.trim();
  const lat    = document.getElementById('lat').value;
  const lng    = document.getElementById('lng').value;

  // Validate pin
  if (!lat || !lng) {
    document.getElementById('pin-required-msg').style.display = 'block';
    document.getElementById('pin-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Validate required fields
  if (!name || !email) {
    this.reportValidity();
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Submitting…';
  btn.disabled = true;

  const payload = { name, email, answer, lat: parseFloat(lat), lng: parseFloat(lng) };

  try {
    // Apps Script requires no-cors for the POST — we fire and trust it succeeds
    await fetch(SCRIPT_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    // no-cors fetch will "succeed" with an opaque response; network errors still throw
    console.error('Submission error:', err);
  }

  // Show success regardless (opaque response means we can't inspect it)
  document.getElementById('form-wrapper').style.display = 'none';
  document.getElementById('success-message').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
