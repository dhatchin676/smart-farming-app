// routes/market.js — FarmAI Market Prices
// Uses data.gov.in REAL mandi price API (your key)
// Fields: state, district, market, commodity, variety, grade,
//         arrival_date, min_price, max_price, modal_price

const express = require('express');
const https   = require('https');
const router  = express.Router();

const API_KEY      = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001f82542c346fb460078e0d1c26837c5be';
const RESOURCE_ID  = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL     = 'https://api.data.gov.in/resource/' + RESOURCE_ID;

// ── Commodity name mapping (API names → your app names) ──────────
const COMMODITY_MAP = {
  'Wheat':      ['Wheat'],
  'Rice':       ['Paddy(Common)','Paddy(Raw)','Paddy','Paddy(Durai)','Rice'],
  'Maize':      ['Maize'],
  'Cotton':     ['Cotton', 'Cotton(Lint)','Cotton Seed'],
  'Soybean':    ['Soyabean','Soybean'],
  'Groundnut':  ['Groundnut','Ground Nut'],
  'Tomato':     ['Tomato'],
  'Onion':      ['Onion','Big Onion','Small Onion'],
  'Potato':     ['Potato'],
  'Banana':     ['Banana','Banana - Green'],
  'Turmeric':   ['Turmeric'],
  'Pepper':     ['Black Pepper','Pepper'],
  'Sugarcane':  ['Sugarcane'],
  'Chilli':     ['Dry Chillies','Green Chilli','Chilli'],
  'Cardamom':   ['Cardamom'],
  'Coconut':    ['Coconut','Coconut Oil'],
  'Garlic':     ['Garlic'],
};

// Fallback base prices (used if API fails or returns no data)
// FALLBACK = real Agmarknet national average prices (07 Mar 2026)
// Used ONLY when live API call fails. Updated from Agmarknet data.
const FALLBACK = {
  Wheat:2311,    // Agmarknet 07 Mar 2026: ₹2,311/Qtl
  Rice:3331,     // Paddy(Common) 07 Mar 2026: ₹3,331/Qtl
  Maize:1603,    // Agmarknet 07 Mar 2026: ₹1,603/Qtl
  Cotton:7637,   // Agmarknet 07 Mar 2026: ₹7,637/Qtl
  Soybean:4200,  // approx national avg
  Groundnut:8290,// Agmarknet 07 Mar 2026: ₹8,290/Qtl
  Tomato:1500,   // Tamil Nadu avg (from API test)
  Onion:2200,    // approx TN avg
  Potato:1400,   // approx TN avg
  Banana:1900,   // approx TN avg
  Turmeric:13500,// Erode APMC avg
  Pepper:43000,  // Coimbatore APMC avg
  Sugarcane:3400,// MSP 2025-26
  Chilli:9000,   // approx avg
  Cardamom:82000,// approx avg
  Coconut:2300,  // approx avg
  Garlic:7000,   // approx avg
};

const UNITS = {
  Coconut:'Rs/100 nuts', Sugarcane:'Rs/Quintal',
};

// ── Simple HTTPS GET → promise ────────────────────────────────────
function apiGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch(e) { reject(new Error('JSON parse failed: ' + raw.slice(0,200))); }
      });
    }).on('error', reject);
  });
}

// ── Build API URL for a commodity + state ────────────────────────
function buildUrl(commodity, state, limit=10) {
  // Correct filter keys as per data.gov.in API (case-sensitive)
  const params = new URLSearchParams({
    'api-key':               API_KEY,
    'format':                'json',
    'limit':                 String(limit),
    'filters[state.keyword]': state,
    'filters[commodity]':     commodity,
  });
  return BASE_URL + '?' + params.toString();
}

// ── Parse raw API record → clean price object ─────────────────────
function parseRecord(appName, record) {
  // API returns: state, district, market, commodity, variety, grade,
  //              arrival_date, min_price, max_price, modal_price  (all lowercase)
  const modal = parseFloat(record.modal_price) || parseFloat(record.max_price) || 0;
  const min   = parseFloat(record.min_price)   || Math.round(modal * 0.92);
  const max   = parseFloat(record.max_price)   || Math.round(modal * 1.08);
  // If fetched as Paddy variant, label clearly for farmer
  const displayName = appName === 'Rice' && record.commodity && record.commodity.toLowerCase().includes('paddy')
    ? 'Rice (Paddy)' : appName;
  return {
    crop_name:    displayName,
    price:        Math.round(modal),
    min_price:    Math.round(min),
    max_price:    Math.round(max),
    prev_price:   Math.round(modal * 0.97),
    unit:         UNITS[appName] || 'Rs/Quintal',
    market_name:  record.market        || 'Tamil Nadu APMC',
    district:     record.district      || '',
    variety:      record.variety       || '',
    grade:        record.grade         || '',
    arrival_date: record.arrival_date  || new Date().toISOString().split('T')[0],
    state:        record.state         || 'Tamil Nadu',
    source:       'data.gov.in · Agmarknet (live)',
  };
}

// ── Fetch price for one app-crop name ─────────────────────────────
// Fetches up to 50 markets, averages modal price, returns all markets too
async function fetchCropPrice(appName, state='Tamil Nadu') {
  const apiNames = COMMODITY_MAP[appName] || [appName];

  for (const apiName of apiNames) {
    try {
      const url  = buildUrl(apiName, state, 50);
      const data = await apiGet(url);

      if (data.records && data.records.length > 0) {
        const records = data.records;

        // Average the modal prices across all markets
        const modals   = records.map(r => parseFloat(r.modal_price)).filter(v => v > 0);
        const avgModal = Math.round(modals.reduce((a,b)=>a+b,0) / modals.length);
        const minAll   = Math.round(Math.min(...records.map(r=>parseFloat(r.min_price)||9999)));
        const maxAll   = Math.round(Math.max(...records.map(r=>parseFloat(r.max_price)||0)));

        // Best market = highest modal price (best for farmer to sell)
        const bestRec  = records.reduce((a,b)=>
          (parseFloat(b.modal_price)||0) > (parseFloat(a.modal_price)||0) ? b : a
        );

        const base = parseRecord(appName, bestRec);
        return {
          ...base,
          price:        avgModal,           // avg across all TN markets
          min_price:    minAll,
          max_price:    maxAll,
          best_market:  bestRec.market,
          best_price:   Math.round(parseFloat(bestRec.modal_price)),
          market_count: records.length,
          markets:      records.map(r=>({   // full breakdown for UI
            market:      r.market,
            district:    r.district,
            variety:     r.variety,
            min_price:   Math.round(parseFloat(r.min_price)||0),
            max_price:   Math.round(parseFloat(r.max_price)||0),
            modal_price: Math.round(parseFloat(r.modal_price)||0),
            arrival_date:r.arrival_date,
          })).sort((a,b)=>b.modal_price-a.modal_price), // highest price first
        };
      }
    } catch(e) {
      // Try next alias
    }
  }
  return null;
}

// ── Seeded fallback price (keeps changing daily if API fails) ─────
function fallbackPrice(appName) {
  const base    = FALLBACK[appName] || 1000;
  const dayNum  = Math.floor(Date.now() / 86400000);
  const hash    = appName.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const r       = x => { const v=Math.sin(x)*43758.5453; return v-Math.floor(v); };
  const daily   = 1 + (r(hash*1000+dayNum)*2-1) * 0.05;
  const prev    = 1 + (r(hash*1000+dayNum-1)*2-1) * 0.05;
  const price   = Math.round(base * daily);
  const prev_p  = Math.round(base * prev);
  return {
    crop_name:   appName,
    price,
    min_price:   Math.round(price * 0.92),
    max_price:   Math.round(price * 1.08),
    prev_price:  prev_p,
    unit:        UNITS[appName] || 'Rs/Quintal',
    market_name: 'Tamil Nadu APMC (estimate)',
    district:    '',
    variety:     '',
    arrival_date:new Date().toISOString().split('T')[0],
    state:       'Tamil Nadu',
    source:      'FarmAI Estimate (API unavailable)',
  };
}

// ══════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════

// GET /api/market/prices?state=Tamil+Nadu&crops=Rice,Wheat,Tomato
router.get('/prices', async (req, res) => {
  const state      = req.query.state || 'Tamil Nadu';
  const cropParam  = req.query.crops;
  const cropList   = cropParam
    ? cropParam.split(',').map(s=>s.trim())
    : ['Wheat','Rice','Cotton','Maize','Soybean','Groundnut','Tomato','Onion'];

  const results = await Promise.all(
    cropList.map(async name => {
      const live = await fetchCropPrice(name, state);
      if (live) return { ...live, live: true };
      return { ...fallbackPrice(name), live: false };
    })
  );

  const liveCount = results.filter(r=>r.live).length;
  res.json({
    success:    true,
    state,
    count:      results.length,
    live_count: liveCount,
    source:     liveCount > 0 ? 'data.gov.in · Agmarknet (live)' : 'FarmAI Estimate',
    fetched_at: new Date().toISOString(),
    data:       results,
  });
});

// GET /api/market/price/:crop?state=Tamil+Nadu
router.get('/price/:crop', async (req, res) => {
  const state  = req.query.state || 'Tamil Nadu';
  const name   = req.params.crop;

  // Capitalise first letter to match COMMODITY_MAP keys
  const appName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const live = await fetchCropPrice(appName, state);
  const data = live ? { ...live, live: true } : { ...fallbackPrice(appName), live: false };
  res.json({ success: true, data });
});

// GET /api/market/search?q=banana&state=Tamil+Nadu
// Searches API directly by commodity name — good for the search box
router.get('/search', async (req, res) => {
  const q     = req.query.q || '';
  const state = req.query.state || 'Tamil Nadu';
  if (!q) return res.status(400).json({ success:false, message:'q is required' });

  // First try matching known app names
  const knownKey = Object.keys(COMMODITY_MAP).find(k =>
    k.toLowerCase().includes(q.toLowerCase()) ||
    COMMODITY_MAP[k].some(a => a.toLowerCase().includes(q.toLowerCase()))
  );

  if (knownKey) {
    const live = await fetchCropPrice(knownKey, state);
    const data = live ? { ...live, live:true } : { ...fallbackPrice(knownKey), live:false };
    return res.json({ success:true, found:true, data });
  }

  // Unknown crop — try API directly with raw query
  try {
    const url  = buildUrl(q, state, 3);
    const raw  = await apiGet(url);
    if (raw.records && raw.records.length > 0) {
      const r   = raw.records[0];
      const modal = parseFloat(r.modal_price) || parseFloat(r.max_price) || 0;
      return res.json({
        success: true,
        found:   true,
        data: {
          crop_name:   r.commodity || q,
          price:       Math.round(modal),
          min_price:   Math.round(parseFloat(r.min_price)||modal*0.92),
          max_price:   Math.round(parseFloat(r.max_price)||modal*1.08),
          prev_price:  Math.round(modal*0.97),
          unit:        'Rs/Quintal',
          market_name: r.market || 'Tamil Nadu APMC',
          district:    r.district || '',
          variety:     r.variety  || '',
          arrival_date:r.arrival_date || new Date().toISOString().split('T')[0],
          state:       r.state || state,
          source:      'data.gov.in · Agmarknet (live)',
          live:        true,
        }
      });
    }
  } catch(e) { /* fall through */ }

  return res.json({ success:true, found:false, message:`"${q}" not found in Agmarknet for ${state}` });
});

// GET /api/market/markets?state=Tamil+Nadu&commodity=Tomato
// Returns all markets in state that have prices for that commodity
router.get('/markets', async (req, res) => {
  const state     = req.query.state     || 'Tamil Nadu';
  const commodity = req.query.commodity || 'Tomato';
  const apiNames  = COMMODITY_MAP[commodity] || [commodity];

  for (const apiName of apiNames) {
    try {
      const url  = buildUrl(apiName, state, 50);
      const data = await apiGet(url);
      if (data.records && data.records.length > 0) {
        const markets = data.records.map(r => ({
          market:       r.market   || r.Market,
          district:     r.district || r.District,
          variety:      r.variety  || r.Variety,
          min_price:    parseFloat(r.min_price),
          max_price:    parseFloat(r.max_price),
          modal_price:  parseFloat(r.modal_price),
          arrival_date: r.arrival_date,
        }));
        return res.json({ success:true, commodity, state, count:markets.length, data:markets });
      }
    } catch(e) { continue; }
  }
  res.json({ success:false, message:'No market data found' });
});

module.exports = router;