// routes/harvest.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/harvestController');

// GET /api/harvest/crops — list all supported crops
router.get('/crops',    ctrl.listCrops);
// GET /api/harvest/predict?crop=rice&sowDate=2025-06-01  OR  POST {crop, sow_date}
router.get('/predict',  ctrl.predictHarvest);
router.post('/predict', ctrl.predictHarvest);
// GET /api/harvest/stages?crop=wheat&sowDate=2025-11-01
router.get('/stages',   ctrl.getGrowthStages);
// POST /api/harvest/schedule — generate alert schedule
router.post('/schedule', ctrl.generateAlertSchedule);

module.exports = router;