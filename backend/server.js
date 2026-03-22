// backend/server.js
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();

// ── Find frontend folder — works locally AND on Railway ──────────
// Local:   backend/../frontend  → works
// Railway: backend/../frontend  → works (Railway deploys from repo root)
const FRONTEND = path.join(__dirname, '..', 'frontend');
const FRONTEND_EXISTS = fs.existsSync(FRONTEND);
console.log(`📁 Frontend path: ${FRONTEND}`);
console.log(`📁 Frontend exists: ${FRONTEND_EXISTS}`);
if (FRONTEND_EXISTS) {
  const files = fs.readdirSync(FRONTEND).slice(0, 5);
  console.log(`📁 Frontend files: ${files.join(', ')}`);
}

// ── MongoDB ────────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
  try {
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connected'))
      .catch(e => console.warn('⚠ MongoDB:', e.message));
  } catch(e) { console.warn('⚠ mongoose not installed'); }
}

// ── Middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// ── Serve static frontend files ────────────────────────────────────
if (FRONTEND_EXISTS) {
  app.use(express.static(FRONTEND));
  console.log('✅ Serving static files from:', FRONTEND);
} else {
  console.warn('⚠ Frontend folder not found at:', FRONTEND);
}

// ── Helper: send HTML file safely ──────────────────────────────────
function sendPage(res, page) {
  if (!FRONTEND_EXISTS) {
    return res.status(503).send(`
      <h1>SmartFarm AI</h1>
      <p>Frontend not found at: ${FRONTEND}</p>
      <p>__dirname: ${__dirname}</p>
    `);
  }
  const file = path.join(FRONTEND, page + '.html');
  const fallback = path.join(FRONTEND, 'intro.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else if (fs.existsSync(fallback)) {
    res.sendFile(fallback);
  } else {
    res.status(404).send(`Page not found: ${page}.html`);
  }
}

// ── Explicit HTML page routes ──────────────────────────────────────
['intro','index','login','signup','weather','soil','disease',
 'market','harvest','community','profile'].forEach(page => {
  app.get('/' + page + '.html', (req, res) => sendPage(res, page));
});

// ── Root → always serve intro.html ────────────────────────────────
app.get('/', (req, res) => sendPage(res, 'intro'));

// ── Safe API route loader ──────────────────────────────────────────
function safeRoute(mount, file) {
  const p = path.join(__dirname, 'routes', file + '.js');
  if (!fs.existsSync(p)) { console.warn('⚠ skip missing route:', file); return; }
  try {
    const r = require('./routes/' + file);
    // Handle both: module.exports = router  AND  module.exports = { router, ... }
    const router = (typeof r === 'function' || (r && typeof r.handle === 'function'))
      ? r
      : (r && r.router && (typeof r.router === 'function' || typeof r.router.handle === 'function'))
        ? r.router
        : null;
    if (router) {
      app.use(mount, router);
      console.log('✅ mounted:', mount);
    } else {
      console.warn('⚠ not a router:', file);
    }
  } catch(e) { console.warn('⚠ route error', file + ':', e.message); }
}

// ── API Routes ─────────────────────────────────────────────────────
safeRoute('/api/weather',   'weather');
safeRoute('/api/soil',      'soil');
safeRoute('/api/disease',   'disease');
safeRoute('/api/market',    'market');
safeRoute('/api/harvest',   'harvest');
safeRoute('/api/harvest',   'harvest_ai');
safeRoute('/api/schemes',   'schemes');
safeRoute('/api/chat',      'chat');
safeRoute('/api/auth',      'auth');
safeRoute('/api/community', 'community');
safeRoute('/api/profile',   'profile');

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status:   'ok',
  time:     new Date().toISOString(),
  frontend: FRONTEND_EXISTS,
  path:     FRONTEND,
}));

// ── SPA Fallback ───────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).json({ success: false, message: 'Not found: ' + req.path });
  }
  sendPage(res, 'intro');
});

// ── Error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌱 SmartFarm AI running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});