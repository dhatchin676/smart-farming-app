// routes/weather.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/weatherController');

// GET /api/weather?city=Coimbatore  OR  ?lat=11.0&lon=76.9
router.get('/',           ctrl.getCurrent);

// GET /api/weather/forecast?city=Coimbatore
router.get('/forecast',   ctrl.getForecast);

// GET /api/weather/irrigation?city=Coimbatore
router.get('/irrigation', ctrl.getIrrigation);

module.exports = router;