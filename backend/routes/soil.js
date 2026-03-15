// backend/routes/soil.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/soilController');

const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── POST /api/soil/identify-image ─────────────────────────────────
router.post('/identify-image', upload.single('soil_image'), ctrl.identifyImage);

// ── POST /api/soil/analyze (AI 10-step plan) ──────────────────────
router.post('/analyze', upload.none(), ctrl.recommend);

// ── POST /api/soil/recommend — same as /analyze (AI-powered) ─────
router.post('/recommend', upload.none(), ctrl.recommend);


module.exports = router;