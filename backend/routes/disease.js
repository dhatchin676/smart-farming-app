// routes/disease.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const ctrl     = require('../controllers/diseaseController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

router.get('/',          ctrl.getDisease);
router.get('/list',      ctrl.listDiseases);
router.post('/identify', ctrl.identifyDisease);
router.post('/detect',   ctrl.detectBySymptoms);
router.post('/image',    upload.single('leaf'), ctrl.detectByImage);

module.exports = router;