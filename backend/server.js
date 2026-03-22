// backend/server.js — Railway production ready
'use strict';
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Detect frontend folder (try every possible Railway path) ────────
function findFrontend() {
  const candidates = [
    path.resolve(__dirname, '..', 'frontend'),
    path.resolve(process.cwd(), 'frontend'),
    path.resolve('/app', 'frontend'),
    path.resolve(__dirname, 'frontend'),
    path.resolve(process.cwd(), '..', 'frontend'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(path.join(p, 'intro.html'))) {
        console.log('✅ Frontend found:', p);
        return p;
      }
    } catch(e) {}
  }
  console.warn('⚠ Frontend NOT found. Searched:', candidates.join(' | '));
  return null;
}

const FRONTEND = findFrontend();

// ── MongoDB ──────────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(e => console.warn('⚠ MongoDB:', e.message));
}

// ── Middleware ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('tiny'));

// ── Serve static files ───────────────────────────────────────────────
if (FRONTEND) {
  app.use(express.static(FRONTEND, { index: false }));
}

// ── HTML page sender ─────────────────────────────────────────────────
function sendHTML(res, page) {
  if (!FRONTEND) {
    // Frontend missing — send diagnostic HTML so page loads something
    return res.status(200).type('html').send(`<!DOCTYPE html>
<html><head><title>SmartFarm AI</title>
<style>body{background:#0a0e0a;color:#3dba72;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;}
h1{font-size:2rem;}p{color:#7a8c7a;font-size:.9rem;}</style></head>
<body><h1>🌱 SmartFarm AI</h1>
<p>Server running — frontend files loading...</p>
<p>Path searched: ${path.resolve(__dirname,'..','frontend')}</p>
<p>cwd: ${process.cwd()} | __dirname: ${__dirname}</p>
<a href="/api/health" style="color:#3dba72;">Check API Health →</a>
</body></html>`);
  }

  const file = path.join(FRONTEND, page + '.html');
  const intro = path.join(FRONTEND, 'intro.html');

  if (fs.existsSync(file)) {
    return res.sendFile(file);
  }
  if (fs.existsSync(intro)) {
    return res.sendFile(intro);
  }
  res.status(404).type('html').send('<h1>404 - Page not found</h1>');
}

// ── HTML routes ──────────────────────────────────────────────────────
app.get('/', (req, res) => sendHTML(res, 'intro'));

['intro','index','login','signup','weather','soil',
 'disease','market','harvest','community','profile'].forEach(p => {
  app.get('/' + p + '.html', (req, res) => sendHTML(res, p));
});

// ── Health check — always responds 200 ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    frontend: FRONTEND,
    cwd: process.cwd(),
    dirname: __dirname,
    port: PORT,
    node: process.version,
    time: new Date().toISOString(),
  });
});

// ── Safe route loader ────────────────────────────────────────────────
function safeRoute(mount, file) {
  const p = path.join(__dirname, 'routes', file + '.js');
  if (!fs.existsSync(p)) return;
  try {
    const r = require('./routes/' + file);
    const router =
      typeof r === 'function' || (r && typeof r.handle === 'function') ? r :
      r && r.router ? r.router : null;
    if (router) { app.use(mount, router); console.log('✅', mount); }
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

// ── 404 / SPA fallback ───────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, message: 'API route not found: ' + req.path });
  }
  sendHTML(res, 'intro');
});

// ── Error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ ok: false, message: err.message });
});

// ── Crash guards ─────────────────────────────────────────────────────
process.on('uncaughtException',  e => console.error('❌ uncaught:', e.message));
process.on('unhandledRejection', e => console.error('❌ unhandled:', e));

// ── Listen ───────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌱 SmartFarm AI on port ${PORT}`);
  console.log(`📁 Frontend: ${FRONTEND || 'NOT FOUND'}`);
});