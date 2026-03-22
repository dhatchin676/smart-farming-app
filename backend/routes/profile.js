// backend/routes/profile.js
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');

// ── Cloudinary config ──────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer — memory storage for Cloudinary ─────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// ── Auth middleware ────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'smartfarm_secret_2025');
    next();
  } catch { res.status(401).json({ success: false, message: 'Invalid token' }); }
}

// ── User model (reuse from auth) ───────────────────────────────
let SFUser;
try {
  SFUser = mongoose.model('SFUser');
} catch {
  const schema = new mongoose.Schema({
    name: String, email: String, password: String,
    state: String, village: String, crops: [String],
    avatar: String, bio: String,
    instagram: String, whatsapp: String, website: String,
    createdAt: { type: Date, default: Date.now }
  });
  SFUser = mongoose.model('SFUser', schema);
}

// ── GET /api/profile/:userId  ──────────────────────────────────
router.get('/:userId', async (req, res) => {
  try {
    const user = await SFUser.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /api/profile/me  ───────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const user = await SFUser.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/profile/avatar  ──────────────────────────────────
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'smartfarm/avatars', transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] },
        (err, result) => err ? reject(err) : resolve(result)
      ).end(req.file.buffer);
    });

    const user = await SFUser.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({ success: true, avatar: result.secure_url, user });
  } catch(e) {
    console.error('Avatar upload error:', e);
    res.status(500).json({ success: false, message: 'Upload failed: ' + e.message });
  }
});

// ── PATCH /api/profile  — update bio, name, state, crops, social links ───────
router.patch('/', auth, async (req, res) => {
  const allowed = ['name', 'state', 'village', 'crops', 'bio', 'instagram', 'whatsapp', 'website'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  try {
    const user = await SFUser.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;