// backend/routes/community.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const multer   = require('multer');
const cloudinary = require('cloudinary').v2;
const { generateWithFallback } = require('../utils/geminiKeyManager');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware (inline)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'smartfarm_secret_2025';
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Login required' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, message: 'Invalid token' }); }
};
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) { try { req.user = jwt.verify(token, JWT_SECRET); } catch {} }
  next();
};

// Post Schema
const commentSchema = new mongoose.Schema({
  author:     { type: String, required: true },
  authorId:   { type: String, required: true },
  avatar:     { type: String, default: '' },
  text:       { type: String, required: true },
  isAI:       { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  author:     { type: String, required: true },
  authorId:   { type: String, required: true },
  avatar:     { type: String, default: '' },
  state:      { type: String, default: 'Tamil Nadu' },
  village:    { type: String, default: '' },
  text:       { type: String, required: true },
  image:      { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  tags:       { type: [String], default: [] },
  category:   { type: String, default: 'general', enum: ['general','disease','soil','market','harvest','weather','scheme'] },
  likes:      { type: [String], default: [] },
  comments:   { type: [commentSchema], default: [] },
  aiAnswer:   { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now },
});

const Post = mongoose.models.SFPost || mongoose.model('SFPost', postSchema);

// GET /api/community/feed
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 15 } = req.query;
    const filter = category && category !== 'all' ? { category } : {};
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Post.countDocuments(filter);
    res.json({ success: true, posts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/community/post
router.post('/post', auth, upload.single('image'), async (req, res) => {
  try {
    const { text, category, tags, state, village } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Post text required' });

    let image = '', imagePublicId = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        { folder: 'smartfarm/community', transformation: [{ width: 800, quality: 'auto' }] }
      );
      image = result.secure_url; imagePublicId = result.public_id;
    }

    // Get AI answer for farming questions
    let aiAnswer = '';
    try {
      const prompt = `You are AcqireAI, a friendly agricultural expert. A Tamil Nadu farmer posted: "${text}"
Give a brief, helpful response (2-3 sentences max). Be warm and practical. If it's a farming problem, suggest a quick solution.`;
      const result = await generateWithFallback(prompt);
      aiAnswer = result.response.text().trim();
    } catch {}

    const post = await Post.create({
      author:   req.user.name,
      authorId: req.user.id,
      avatar:   req.body.avatar || '',
      state:    state || 'Tamil Nadu',
      village:  village || '',
      text, category: category || 'general',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      image, imagePublicId, aiAnswer,
    });

    res.json({ success: true, post });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/community/post/:id/comment
router.post('/post/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.comments.push({ author: req.user.name, authorId: req.user.id, avatar: req.body.avatar || '', text });
    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/community/post/:id/like
router.post('/post/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const idx = post.likes.indexOf(req.user.id);
    if (idx === -1) post.likes.push(req.user.id);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json({ success: true, likes: post.likes.length, liked: idx === -1 });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/community/post/:id
router.delete('/post/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.authorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (post.imagePublicId) await cloudinary.uploader.destroy(post.imagePublicId).catch(() => {});
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/community/stats — real member/post/activity counts
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalPosts, todayPosts, weekPosts, topAuthors] = await Promise.all([
      Post.countDocuments({}),
      Post.countDocuments({ createdAt: { $gte: todayStart } }),
      Post.countDocuments({ createdAt: { $gte: weekStart } }),
      Post.aggregate([
        { $group: {
          _id: { authorId: '$authorId', author: '$author', avatar: '$avatar' },
          posts:  { $sum: 1 },
          likes:  { $sum: { $size: '$likes' } },
          comments: { $sum: { $size: '$comments' } },
        }},
        { $addFields: { score: { $add: [{ $multiply: ['$likes', 2] }, '$comments', '$posts'] } } },
        { $sort: { score: -1 } },
        { $limit: 5 }
      ]),
    ]);

    // Unique authors = rough member proxy (real app would have User.countDocuments)
    const uniqueAuthors = await Post.distinct('authorId');
    const memberCount = Math.max(uniqueAuthors.length, 1);

    res.json({
      success: true,
      totalPosts,
      todayPosts,
      weekPosts,
      memberCount,
      topAuthors: topAuthors.map(a => ({
        id:     a._id.authorId,
        name:   a._id.author,
        avatar: a._id.avatar,
        posts:  a.posts,
        likes:  a.likes,
        score:  a.score,
      })),
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/community/post/:postId/comment/:commentId
router.delete('/post/:postId/comment/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const cmt = post.comments.id(req.params.commentId);
    if (!cmt) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (cmt.author !== req.user.name) return res.status(403).json({ success: false, message: 'Not authorized' });
    cmt.deleteOne();
    await post.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/community/dm — Private message (basic; real app uses WebSocket)
router.post('/dm', auth, async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!text || !to) return res.status(400).json({ success: false, message: 'Missing fields' });
    // For now just acknowledge — real app stores in DM collection
    res.json({ success: true, message: 'Message sent' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;