// backend/routes/auth.js
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer   = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });

// MongoDB connection
if (process.env.MONGO_URI && mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.warn('⚠️ MongoDB:', err.message));
}

// User Schema
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone:    { type: String, default: '' },
  state:    { type: String, default: 'Tamil Nadu' },
  village:  { type: String, default: '' },
  crops:    { type: [String], default: [] },
  avatar:   { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  bio:      { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now },
  lastLogin:{ type: Date, default: Date.now },
});
const User = mongoose.models.SFUser || mongoose.model('SFUser', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'smartfarm_secret_2025';
const signToken = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email },
  JWT_SECRET, { expiresIn: '30d' }
);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, message: 'Invalid token' }); }
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, state, village, crops } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be 6+ characters' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, phone: phone||'', state: state||'Tamil Nadu', village: village||'', crops: crops||[] });
    const token = signToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, state: user.state, crops: user.crops, avatar: user.avatar } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: 'No account found. Please sign up.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Incorrect password' });
    user.lastLogin = new Date(); await user.save();
    const token = signToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, state: user.state, crops: user.crops, avatar: user.avatar, village: user.village } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/update-profile
router.post('/update-profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { name, phone, state, village, crops, bio } = req.body;
    if (name)    user.name    = name;
    if (phone)   user.phone   = phone;
    if (state)   user.state   = state;
    if (village) user.village = village;
    if (bio)     user.bio     = bio;
    if (crops)   user.crops   = Array.isArray(crops) ? crops : crops.split(',').map(c=>c.trim());
    if (req.file) {
      if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId).catch(()=>{});
      const result = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, { folder:'smartfarm/avatars', transformation:[{width:200,height:200,crop:'fill',gravity:'face'}] });
      user.avatar = result.secure_url; user.avatarPublicId = result.public_id;
    }
    await user.save();
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, state: user.state, crops: user.crops, avatar: user.avatar, village: user.village, bio: user.bio } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Export router as default + attach helpers so other files can import them
router.authMiddleware = authMiddleware;
router.User = User;
module.exports = router;