// backend/server.js
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app      = express();
const FRONTEND = path.join(__dirname, '..', 'frontend');

// ── MongoDB (optional) ───────────────────────────────────────────
if (process.env.MONGO_URI) {
  try {
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connected'))
      .catch(e => console.warn('⚠ MongoDB:', e.message));
  } catch(e) { console.warn('⚠ mongoose not installed'); }
}

// ── Middleware ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));
app.use(express.static(FRONTEND));

// ── Explicit HTML routes (MUST be before wildcard) ───────────────
// Without these, the wildcard catches every .html request
['intro','index','login','signup','weather','soil','disease',
 'market','harvest','community','profile'].forEach(page => {
  app.get('/' + page + '.html', (req, res) => {
    const file = path.join(FRONTEND, page + '.html');
    res.sendFile(fs.existsSync(file) ? file : path.join(FRONTEND, 'intro.html'));
  });
});

// ── Root → intro ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  const intro = path.join(FRONTEND, 'intro.html');
  res.sendFile(fs.existsSync(intro) ? intro : path.join(FRONTEND, 'index.html'));
});

// ── Safe route loader ─────────────────────────────────────────────
function safeRoute(mount, file) {
  const p = path.join(__dirname, 'routes', file + '.js');
  if (!fs.existsSync(p)) { console.warn('⚠ skip missing route:', file); return; }
  try {
    const r = require('./routes/' + file);
    // Handle both plain router exports AND object exports like { router, authMiddleware, User }
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

// ── API routes ───────────────────────────────────────────────────
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

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() }));

// ── SPA fallback (only for unknown non-API, non-file paths) ──────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  res.sendFile(path.join(FRONTEND, 'intro.html'));
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌱 SmartFarm AI → http://localhost:${PORT}`);
});