// controllers/harvestController.js
const config = require('../config/config');

const CROPS = {
  Rice:      { duration: 120, season: 'Kharif', sow_months: [6,7],   stages: [{name:'Germination',days:[0,10]},{name:'Tillering',days:[10,40]},{name:'Panicle Initiation',days:[40,75]},{name:'Heading',days:[75,95]},{name:'Ripening & Harvest',days:[95,120]}] },
  Wheat:     { duration: 140, season: 'Rabi',   sow_months: [10,11], stages: [{name:'Germination',days:[0,12]},{name:'Tillering',days:[12,45]},{name:'Jointing',days:[45,80]},{name:'Heading',days:[80,110]},{name:'Ripening & Harvest',days:[110,140]}] },
  Maize:     { duration: 100, season: 'Kharif', sow_months: [6,7],   stages: [{name:'Germination',days:[0,8]},{name:'Vegetative',days:[8,50]},{name:'Tasseling',days:[50,65]},{name:'Silking',days:[65,80]},{name:'Maturity & Harvest',days:[80,100]}] },
  Cotton:    { duration: 180, season: 'Kharif', sow_months: [5,6],   stages: [{name:'Germination',days:[0,15]},{name:'Seedling',days:[15,45]},{name:'Squaring',days:[45,80]},{name:'Flowering',days:[80,120]},{name:'Boll Development & Harvest',days:[120,180]}] },
  Soybean:   { duration: 110, season: 'Kharif', sow_months: [6,7],   stages: [{name:'Germination',days:[0,10]},{name:'Vegetative',days:[10,45]},{name:'Flowering',days:[45,75]},{name:'Pod Fill',days:[75,100]},{name:'Maturity & Harvest',days:[100,110]}] },
  Groundnut: { duration: 130, season: 'Kharif', sow_months: [6,7],   stages: [{name:'Germination',days:[0,12]},{name:'Vegetative',days:[12,40]},{name:'Flowering',days:[40,70]},{name:'Pegging & Pod Formation',days:[70,100]},{name:'Maturity & Harvest',days:[100,130]}] },
  Tomato:    { duration:  85, season: 'Rabi',   sow_months: [9,10],  stages: [{name:'Germination',days:[0,8]},{name:'Seedling',days:[8,25]},{name:'Vegetative',days:[25,50]},{name:'Flowering & Fruit Set',days:[50,65]},{name:'Fruiting & Harvest',days:[65,85]}] },
  Potato:    { duration:  90, season: 'Rabi',   sow_months: [10,11], stages: [{name:'Sprouting',days:[0,15]},{name:'Vegetative',days:[15,40]},{name:'Tuber Initiation',days:[40,65]},{name:'Bulking',days:[65,80]},{name:'Maturity & Harvest',days:[80,90]}] },
  Onion:     { duration: 120, season: 'Rabi',   sow_months: [11,12], stages: [{name:'Germination',days:[0,10]},{name:'Seedling',days:[10,30]},{name:'Bulb Initiation',days:[30,70]},{name:'Bulb Development',days:[70,100]},{name:'Maturity & Harvest',days:[100,120]}] },
  Sugarcane: { duration: 365, season: 'Annual', sow_months: [2,3],   stages: [{name:'Germination',days:[0,30]},{name:'Tillering',days:[30,120]},{name:'Grand Growth',days:[120,270]},{name:'Maturation',days:[270,330]},{name:'Ripening & Harvest',days:[330,365]}] },
  Chilli:    { duration: 120, season: 'Kharif', sow_months: [6,7],   stages: [{name:'Germination',days:[0,12]},{name:'Seedling',days:[12,35]},{name:'Vegetative',days:[35,65]},{name:'Flowering',days:[65,90]},{name:'Fruiting & Harvest',days:[90,120]}] },
  Turmeric:  { duration: 270, season: 'Kharif', sow_months: [5,6],   stages: [{name:'Sprouting',days:[0,30]},{name:'Vegetative',days:[30,100]},{name:'Rhizome Formation',days:[100,180]},{name:'Bulking',days:[180,240]},{name:'Maturity & Harvest',days:[240,270]}] },
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysFromNow(dateStr) {
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

// ── GET /api/harvest/crops ────────────────────────────────────────
exports.listCrops = (req, res) => {
  const crops = Object.entries(CROPS).map(([name, c]) => ({
    name, duration_days: c.duration, season: c.season,
    sow_months: c.sow_months.map(m => new Date(2000, m - 1).toLocaleString('default', { month: 'long' })),
    stage_count: c.stages.length,
  }));
  res.json({ crops, count: crops.length });
};

// ── GET /api/harvest/predict?crop=rice&sowDate=2025-06-01
// ── POST /api/harvest/predict { crop, sow_date } ─────────────────
exports.predictHarvest = (req, res) => {
  // Accept from GET query or POST body
  const crop    = req.body?.crop     || req.query.crop;
  const sowDate = req.body?.sow_date || req.body?.sowDate || req.query.sowDate || req.query.sow_date;

  if (!crop || !CROPS[crop]) {
    return res.status(400).json({ success:false, message: 'Crop "' + crop + '" not found.', available: Object.keys(CROPS) });
  }
  if (!sowDate || isNaN(Date.parse(sowDate))) {
    return res.status(400).json({ success:false, message: 'Valid sow_date required (YYYY-MM-DD)' });
  }

  const cropData     = CROPS[crop];
  const harvestDate  = addDays(sowDate, cropData.duration);
  const alert7Date   = addDays(harvestDate, -7);
  const alert10Date  = addDays(harvestDate, -10);
  const daysLeft     = daysFromNow(harvestDate);

  const daysSinceSow = Math.max(0, Math.round((new Date() - new Date(sowDate)) / (1000 * 60 * 60 * 24)));
  const currentStage = cropData.stages.find(s => daysSinceSow >= s.days[0] && daysSinceSow < s.days[1])
    || (daysSinceSow >= cropData.duration ? cropData.stages[cropData.stages.length - 1] : cropData.stages[0]);

  // Stages as flat string array (matches frontend HARVEST_DATA.stages format)
  const stagesArr = cropData.stages.map(s => s.name + ' (' + s.days[0] + '\u2013' + s.days[1] + 'd)');

  res.json({
    success: true,
    data: {
      crop,
      season:         cropData.season,
      sow_date:       sowDate,
      harvest_date:   harvestDate,
      alert_7_days:   alert7Date,
      alert_10_days:  alert10Date,
      days_left:      daysLeft,           // frontend reads days_left
      duration_days:  cropData.duration,  // frontend reads duration_days
      days_since_sow: daysSinceSow,
      current_stage:  currentStage,
      stages:         stagesArr,          // frontend reads stages[]
      progress_pct:   Math.min(100, Math.round((daysSinceSow / cropData.duration) * 100)),
      status: daysLeft <= 0 ? 'ready_for_harvest' : daysLeft <= 14 ? 'harvest_approaching' : 'growing',
    },
  });
};

// ── GET /api/harvest/stages?crop=wheat&sowDate=2025-11-01 ─────────
exports.getGrowthStages = (req, res) => {
  const { crop, sowDate } = req.query;

  if (!crop || !CROPS[crop]) {
    return res.status(400).json({ error: `Crop "${crop}" not found.`, available: Object.keys(CROPS) });
  }

  const cropData = CROPS[crop];
  const baseSow  = sowDate || new Date().toISOString().split('T')[0];

  const stages = cropData.stages.map((s, i) => ({
    stage_num:   i + 1,
    name:        s.name,
    start_day:   s.days[0],
    end_day:     s.days[1],
    start_date:  sowDate ? addDays(baseSow, s.days[0]) : null,
    end_date:    sowDate ? addDays(baseSow, s.days[1]) : null,
    days_left:   sowDate ? daysFromNow(addDays(baseSow, s.days[0])) : null,
  }));

  res.json({ crop, total_duration: cropData.duration, season: cropData.season, stages });
};

// ── POST /api/harvest/schedule — alert schedule ───────────────────
exports.generateAlertSchedule = (req, res) => {
  const { crop, sowDate, phone } = req.body;

  if (!crop || !CROPS[crop]) return res.status(400).json({ error: `Crop "${crop}" not found.` });
  if (!sowDate) return res.status(400).json({ error: 'sowDate required' });

  const cropData = CROPS[crop];

  const alerts = [
    { days_after_sow: 7,                   type: 'info',    message: `${crop} germination check. Ensure soil moisture.` },
    { days_after_sow: cropData.stages[1].days[0], type: 'fertilizer', message: `Apply first top-dress fertilizer for ${crop}.` },
    { days_after_sow: cropData.stages[2].days[0], type: 'spray',      message: `Preventive pesticide spray recommended for ${crop}.` },
    { days_after_sow: cropData.stages[3].days[0], type: 'monitor',    message: `Critical stage for ${crop}. Monitor for disease and pest.` },
    { days_after_sow: cropData.duration - 21,      type: 'prepare',    message: `3 weeks to harvest. Arrange storage/transport.` },
    { days_after_sow: cropData.duration - 7,       type: 'urgent',     message: `1 week to harvest. Stop irrigation. Check moisture content.` },
    { days_after_sow: cropData.duration,           type: 'harvest',    message: `${crop} HARVEST DAY. Time to reap!` },
  ];

  const schedule = alerts.map(a => ({
    ...a,
    alert_date: addDays(sowDate, a.days_after_sow),
    days_from_now: daysFromNow(addDays(sowDate, a.days_after_sow)),
  })).filter(a => a.days_from_now >= -1); // Only future alerts

  res.json({
    crop, sow_date: sowDate,
    harvest_date: addDays(sowDate, cropData.duration),
    phone_registered: phone || null,
    alert_count: schedule.length,
    schedule,
    note: phone ? 'SMS alerts would be sent via Twilio in production.' : 'Provide phone number to enable SMS alerts.',
  });
};