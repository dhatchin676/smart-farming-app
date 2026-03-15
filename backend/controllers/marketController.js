// controllers/marketController.js
require('dotenv').config();
const axios  = require('axios');
const db     = require('../config/db');
const config = require('../config/config');

// ── Static fallback ────────────────────────────────────────────────
let MARKET_FALLBACK;
try { MARKET_FALLBACK = require('../data/market.json'); } catch (_) { MARKET_FALLBACK = []; }

// ── In-memory cache ────────────────────────────────────────────────
const _cache    = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.val;
}
function cacheSet(key, val) { _cache.set(key, { val, ts: Date.now() }); }

// ── Selling advice logic ───────────────────────────────────────────
function sellingAdvice(crop_name, price, prev_price) {
  const pct = ((price - prev_price) / (prev_price || 1)) * 100;
  if (pct > 10)  return `${crop_name} surging +${pct.toFixed(1)}% — sell immediately, peak pricing.`;
  if (pct > 5)   return `${crop_name} trending up ${pct.toFixed(1)}%. Sell at least 50% of stock now.`;
  if (pct > 2)   return `${crop_name} rising steadily. Good time to sell — momentum may slow soon.`;
  if (pct < -10) return `${crop_name} falling sharply. Sell remaining stock now to cut losses.`;
  if (pct < -5)  return `${crop_name} falling. Sell immediately if storage costs are adding up.`;
  if (pct < -2)  return `${crop_name} slightly down. Monitor for another week before selling.`;
  return `${crop_name} prices stable. Sell at your convenience — no urgency.`;
}

// ── Save prices to DB for trend history ───────────────────────────
async function savePricesToDB(crops) {
  for (const c of crops) {
    if (!c.price) continue;
    try {
      await db.query(`
        INSERT INTO market_prices
          (crop_name, price, min_price, max_price, prev_price, state, recorded_date, market_name)
        VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'AI-Assisted-TN')
        ON DUPLICATE KEY UPDATE
          price      = VALUES(price),
          min_price  = VALUES(min_price),
          max_price  = VALUES(max_price),
          prev_price = VALUES(prev_price),
          updated_at = NOW()
      `, [
        c.crop_name,
        c.price,
        c.min_price  || c.price,
        c.max_price  || c.price,
        c.prev_price || c.price,
        c.state      || 'Tamil Nadu',
      ]);
    } catch (_) { /* non-fatal */ }
  }
}

// ── GET /api/market/live — Gemini AI prices ────────────────────────
exports.getLivePrices = async (req, res, next) => {
  try {
    const cacheKey = 'live:TN';
    const cached   = cacheGet(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source:  'cache',
        data:    cached,
        note:    'Prices refreshed every 6 hours',
      });
    }

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const prompt = `You are an agricultural market analyst for Tamil Nadu, India.
Today is ${today}. Provide realistic current mandi (wholesale market) prices for Tamil Nadu.

Use these as reference MSP 2025-26 (minimum support prices):
- Wheat: ₹2,425/Qtl, Rice/Paddy: ₹2,369/Qtl, Cotton: ₹7,121/Qtl
- Maize: ₹2,225/Qtl, Soybean: ₹4,892/Qtl, Groundnut: ₹6,783/Qtl
- Tomato: seasonal (₹800–₹2500), Onion: seasonal (₹800–₹2000)

Factor in: March 2026 season, post-rabi harvest pressure, Tamil Nadu market conditions.
Mandi prices can be above or below MSP based on supply/demand.

Return ONLY a valid JSON array, absolutely no other text, no markdown:
[
  {"crop":"Wheat",     "price":2322,"min":2200,"max":2450,"prev":2280,"trend":"rising","advice":"Wheat prices above MSP. Good time to sell 60% of stock."},
  {"crop":"Rice",      "price":3190,"min":3000,"max":3400,"prev":3262,"trend":"stable","advice":"Rice prices steady. Sell at convenience."},
  {"crop":"Cotton",    "price":7476,"min":7200,"max":7800,"prev":7617,"trend":"falling","advice":"Cotton dipping slightly. Sell now before further decline."},
  {"crop":"Maize",     "price":2016,"min":1900,"max":2100,"prev":1980,"trend":"rising","advice":"Maize rising. Hold for one more week for better returns."},
  {"crop":"Soybean",   "price":4800,"min":4600,"max":5000,"prev":4750,"trend":"stable","advice":"Soybean near MSP. Sell if storage cost is a concern."},
  {"crop":"Groundnut", "price":8453,"min":8000,"max":9000,"prev":8444,"trend":"stable","advice":"Groundnut well above MSP. Sell 50% now, hold rest."},
  {"crop":"Tomato",    "price":1505,"min":1200,"max":1800,"prev":1373,"trend":"rising","advice":"Tomato surging. Sell immediately — prices volatile."},
  {"crop":"Onion",     "price":1349,"min":1100,"max":1600,"prev":1376,"trend":"falling","advice":"Onion prices easing. Sell remaining stock now."}
]`;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    // Parse Gemini response
    const raw      = geminiRes.data.candidates[0].content.parts[0].text;
    const cleaned  = raw.replace(/```json|```/g, '').trim();
    const aiPrices = JSON.parse(cleaned);

    // Shape into standard format
    const data = aiPrices.map(c => ({
      crop_name:  c.crop,
      price:      Number(c.price),
      min_price:  Number(c.min),
      max_price:  Number(c.max),
      prev_price: Number(c.prev),
      unit:       '₹/Qtl',
      state:      'Tamil Nadu',
      trend:      c.trend,
      advice:     c.advice || sellingAdvice(c.crop, c.price, c.prev),
      source:     'ai-assisted',
      date:       today,
    }));

    // Save to DB async (don't block response)
    savePricesToDB(data).catch(() => {});
    cacheSet(cacheKey, data);

    res.json({
      success:     true,
      source:      'ai-assisted',
      data,
      generatedAt: new Date().toISOString(),
      note:        'Prices based on MSP 2025-26 and seasonal market conditions',
    });

  } catch (err) {
    console.error('Gemini price fetch failed:', err.message);
    // Fall through to DB/static fallback
    return exports.getAllPrices(req, res, next);
  }
};

// ── GET /api/market/prices?state=Tamil Nadu ────────────────────────
exports.getAllPrices = async (req, res, next) => {
  try {
    const state    = req.query.state || 'Tamil Nadu';
    const cacheKey = `all:${state}`;
    const cached   = cacheGet(cacheKey);
    if (cached) return res.json({ success: true, source: 'cache', data: cached });

    const [rows] = await db.query(`
      SELECT m1.*
      FROM market_prices m1
      INNER JOIN (
        SELECT crop_name, MAX(recorded_date) AS max_date
        FROM market_prices WHERE state = ?
        GROUP BY crop_name
      ) m2 ON m1.crop_name = m2.crop_name AND m1.recorded_date = m2.max_date
      ORDER BY m1.crop_name
    `, [state]);

    const source = rows.length ? 'database' : 'static';
    const data   = rows.length
      ? rows.map(r => ({
          ...r,
          advice: sellingAdvice(r.crop_name, Number(r.price), Number(r.prev_price)),
        }))
      : MARKET_FALLBACK.map(r => ({
          ...r,
          advice: sellingAdvice(r.crop_name, r.price, r.prev_price),
        }));

    cacheSet(cacheKey, data);
    res.json({ success: true, source, data });
  } catch (err) { next(err); }
};

// ── GET /api/market?commodity=Rice ────────────────────────────────
exports.getPrices = async (req, res, next) => {
  try {
    const commodity = req.query.commodity || req.query.crop;
    const state     = req.query.state || 'Tamil Nadu';
    if (!commodity) return exports.getAllPrices(req, res, next);

    const [rows] = await db.query(
      `SELECT * FROM market_prices
       WHERE LOWER(crop_name) = LOWER(?) AND state = ?
       ORDER BY recorded_date DESC LIMIT 1`,
      [commodity, state]
    );

    if (!rows.length) {
      const fb = MARKET_FALLBACK.find(
        r => r.crop_name.toLowerCase() === commodity.toLowerCase()
      );
      if (fb) return res.json({ success: true, source: 'static', data: fb });
      return res.status(404).json({ success: false, message: `${commodity} not found.` });
    }

    const r = rows[0];
    res.json({
      success: true,
      source:  'database',
      data: { ...r, advice: sellingAdvice(r.crop_name, r.price, r.prev_price) },
    });
  } catch (err) { next(err); }
};

// ── GET /api/market/trend/:cropName ───────────────────────────────
exports.getTrend = async (req, res, next) => {
  try {
    const cropName = req.params.cropName || req.query.commodity || req.query.crop;
    if (!cropName) {
      return res.status(400).json({ success: false, message: 'crop name required' });
    }

    const [rows] = await db.query(
      `SELECT price, prev_price, recorded_date, market_name
       FROM market_prices WHERE LOWER(crop_name) = LOWER(?)
       ORDER BY recorded_date DESC LIMIT 5`,
      [cropName]
    );

    if (rows.length < 2) {
      const fb = MARKET_FALLBACK.find(
        r => r.crop_name.toLowerCase() === cropName.toLowerCase()
      );
      if (fb) {
        const synth = [0.90, 0.93, 0.96, 0.98, 1.0].map((m, i) => ({
          price:         Math.round(fb.prev_price * m),
          recorded_date: null,
          week:          `Week ${i + 1}`,
        }));
        synth[4].price = fb.price;
        return res.json({ success: true, source: 'synthetic', data: synth });
      }
      return res.status(404).json({ success: false, message: `No trend data for ${cropName}` });
    }

    res.json({ success: true, source: 'database', data: rows.reverse() });
  } catch (err) { next(err); }
};

// ── POST /api/market/advice ────────────────────────────────────────
exports.getSellingAdvice = async (req, res, next) => {
  try {
    const { crop, price, prev_price, state } = req.body;
    if (!crop) {
      return res.status(400).json({ success: false, message: 'crop is required' });
    }
    const p  = Number(price)      || 0;
    const pp = Number(prev_price) || p;
    res.json({
      success: true,
      data: {
        crop,
        advice:     sellingAdvice(crop, p, pp),
        price:      p,
        prev_price: pp,
        state:      state || 'Tamil Nadu',
      },
    });
  } catch (err) { next(err); }
};