// backend/server.js — Railway-safe version
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();

// ── PORT — Railway sets this automatically ─────────────────────────
const PORT = process.env.PORT || 5000;

// ── Find frontend — try multiple paths ─────────────────────────────
const PATHS_TO_TRY = [
  path.join(__dirname, '..', 'frontend'),   // local + Railway root deploy
  path.join(__dirname, 'frontend'),          // if server.js is at root
  path.join('/app', 'frontend'),             // absolute Railway path
];
let FRONTEND = null;
for (const p of PATHS_TO_TRY) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'intro.html'))) {
    FRONTEND = p;
    break;
  }
}
console.log('📁 Frontend found at:', FRONTEND || 'NOT FOUND');
console.log('📁 __dirname:', __dirname);
console.log('📁 process.cwd():', process.cwd());

// ── MongoDB ────────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
  try {
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connected'))
      .catch(e => console.warn('⚠ MongoDB:', e.message));
  } catch(e) { console.warn('⚠ mongoose not installed:', e.message); }
}

// ── Middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// ── Static files ───────────────────────────────────────────────────
if (FRONTEND) {
  app.use(express.static(FRONTEND));
  console.log('✅ Static files served from:', FRONTEND);
}

// ── Send page helper ────────────────────────────────────────────────
function sendPage(res, page) {
  if (!FRONTEND) {
    return res.status(200).send(`
      <!DOCTYPE html><html><head><title>SmartFarm AI</title></head><body>
      <h1>SmartFarm AI - Backend Running ✅</h1>
      <p>Frontend folder not found. Deploy from repo root.</p>
      <p>Tried: ${PATHS_TO_TRY.join(', ')}</p>
      <p>__dirname: ${__dirname}</p>
      <p>cwd: ${process.cwd()}</p>
      <a href="/api/health">Check API Health</a>
      </body></html>
    `);
  }
  const file     = path.join(FRONTEND, page + '.html');
  const fallback = path.join(FRONTEND, 'intro.html');
  if (fs.existsSync(file))     return res.sendFile(file);
  if (fs.existsSync(fallback)) return res.sendFile(fallback);
  res.status(404).send('Page not found: ' + page);
}

// ── Page routes ─────────────────────────────────────────────────────
['intro','index','login','signup','weather','soil','disease',
 'market','harvest','community','profile'].forEach(page => {
  app.get('/' + page + '.html', (req, res) => sendPage(res, page));
});

app.get('/', (req, res) => sendPage(res, 'intro'));

// ── Safe API route loader ────────────────────────────────────────────
function safeRoute(mount, file) {
  const p = path.join(__dirname, 'routes', file + '.js');
  if (!fs.existsSync(p)) { console.warn('⚠ skip missing:', file); return; }
  try {
    const r = require('./routes/' + file);
    const router = (typeof r === 'function' || (r && typeof r.handle === 'function'))
      ? r
      : (r && r.router && (typeof r.router === 'function' || typeof r.router.handle === 'function'))
        ? r.router : null;
    if (router) { app.use(mount, router); console.log('✅ mounted:', mount); }
    else console.warn('⚠ not a router:', file);
  } catch(e) { console.warn('⚠ route error', file + ':', e.message); }
}

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

// ── Health check — Railway uses this ────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status:       'ok',
  time:         new Date().toISOString(),
  frontend:     FRONTEND || 'not found',
  dirname:      __dirname,
  cwd:          process.cwd(),
  port:         PORT,
  node_env:     process.env.NODE_ENV,
  mongo:        !!process.env.MONGO_URI,
}));

// ── Fallback ─────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.\w+$/)) {
    return res.status(404).json({ success: false, message: 'Not found: ' + req.path });
  }
  sendPage(res, 'intro');
});

// ── Error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ── Start server ──────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌱 SmartFarm AI running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`✅ Server ready to accept connections`);
});

// ── Handle uncaught errors — don't crash Railway container ───────────
process.on('uncaughtException',  e => console.error('❌ Uncaught:', e.message));
process.on('unhandledRejection', e => console.error('❌ Unhandled:', e));