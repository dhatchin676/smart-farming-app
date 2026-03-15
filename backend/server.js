// backend/server.js
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ──
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Serve frontend static files ──────────────────────────────────
const FRONTEND = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND));

// ── API Routes ───────────────────────────────────────────────────
app.use('/api/weather',  require('./routes/weather'));
app.use('/api/soil',     require('./routes/soil'));
app.use('/api/disease',  require('./routes/disease'));
app.use('/api/market',   require('./routes/market'));
app.use('/api/harvest',  require('./routes/harvest'));
app.use('/api/harvest',  require('./routes/harvest_ai'));
app.use('/api/schemes',  require('./routes/schemes'));
app.use('/api/chat',     require('./routes/chat'));

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Serve specific HTML pages directly ───────────────────────────
const PAGES = ['index','weather','soil','disease','market','harvest'];
PAGES.forEach(page => {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(FRONTEND, `${page}.html`));
  });
});

// ── Root → index.html ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// ── PWA files ─────────────────────────────────────────────────────
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(FRONTEND, 'sw.js'));
});
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'manifest.json'));
});

// ── 404 for unknown routes (do NOT redirect to index.html) ────────
app.use((req, res) => {
  // Only serve index.html for non-file, non-API routes
  if (!req.path.includes('.') && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(FRONTEND, 'index.html'));
  }
  res.status(404).json({ success: false, message: 'Not found: ' + req.path });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌱 SmartFarm AI backend running on port ${PORT}`);
  console.log(`🌐 Open your app at: http://localhost:${PORT}`);
});