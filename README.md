# wheredoesleucadiastart.com

A community curiosity project. Drop a pin to mark where you think Leucadia begins.

---

## Setup checklist

### 1. Deploy the Google Apps Script

1. Go to [script.google.com](https://script.google.com) → **New project**
2. Paste the contents of `scripts/apps-script.js` into the editor
3. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me (chasetbeach@gmail.com)**
   - Who has access: **Anyone**
4. Click **Deploy** → copy the **Web App URL**

### 2. Add the Script URL to the site

Replace `'YOUR_APPS_SCRIPT_URL_HERE'` in these three files:
- `js/submit.js` (line 3)
- `js/heatmap.js` (line 3)
- `index.html` (near the bottom `<script>` tag)

### 3. Add lat/lng columns to your Google Sheet

Make sure your sheet has two new columns after the existing four:
- **E: lat**
- **F: lng**

Add these header labels to row 1 if they're not there already.

### 4. Geocode existing text answers (one-time)

This backfills lat/lng for old submissions that only have text answers.

**Create a service account:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable **Google Sheets API**
3. IAM & Admin → Service Accounts → Create → download JSON key
4. Share your Google Sheet with the service account email (Editor access)
5. Save the key file as `service-account-key.json` in the repo root *(already gitignored)*

**Run the script:**
```bash
npm install
node scripts/geocode.js
```

Rows that can't be geocoded are flagged in the console — you can manually add lat/lng for those.

### 5. Deploy to Vercel

1. Push this repo to GitHub (public or private)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `leucadia`
3. Framework preset: **Other** (no build step)
4. Output directory: leave blank (uses root)
5. Click **Deploy**

### 6. Add your custom domain on Vercel

1. In the Vercel project → **Settings → Domains**
2. Add `wheredoesleucadiastart.com` and `www.wheredoesleucadiastart.com`
3. Vercel will show you the DNS records to add

### 7. Update DNS on Squarespace

In Squarespace → **Domains → DNS Settings**, replace existing A/CNAME records:

| Type  | Host | Value                  |
|-------|------|------------------------|
| A     | @    | `76.76.21.21`          |
| CNAME | www  | `cname.vercel-dns.com` |

Propagation takes 5–30 minutes. Keep the domain registration active at Squarespace — **cancel only the website plan** (the $18/mo charge).

---

## Stack

- Plain HTML / CSS / JavaScript — no build step, no framework
- [Leaflet.js](https://leafletjs.com) — maps (OpenStreetMap tiles, free)
- [leaflet-heat](https://github.com/Leaflet/Leaflet.heat) — heat map layer
- [Google Apps Script](https://script.google.com) — form backend (free)
- [Vercel](https://vercel.com) — hosting (free Hobby plan)
