// controllers/soilController.js
const db = require('../config/db');
const { generateWithFallback } = require('../utils/geminiKeyManager');

function phRange(ph) {
  const v = parseFloat(ph);
  if (v < 6)    return 'acidic';
  if (v <= 7.5) return 'neutral';
  return 'alkaline';
}

function estimateNutrients(soil_type, ph) {
  const baseN = { loam: 78, clay: 62, sandy: 48, silt: 72, black: 76, red: 52 };
  const adj   = ph < 6 ? -20 : ph > 7.5 ? -12 : 0;
  const base  = baseN[soil_type] || 60;
  return {
    nitrogen:       Math.max(20, base + adj),
    phosphorus:     Math.max(20, base - 8 + adj),
    potassium:      Math.max(30, base + 4 + adj),
    organic_matter: { loam: 82, silt: 72, black: 78, clay: 60, sandy: 45, red: 50 }[soil_type] || 60,
  };
}

function seasonTip(season) {
  return {
    Kharif: 'Sow after first monsoon rains. Ensure good drainage to prevent waterlogging.',
    Rabi:   'Sow after monsoon retreat. Irrigate at critical growth stages — flowering and grain fill.',
    Zaid:   'Ensure adequate irrigation. Choose heat-tolerant varieties for summer planting.',
  }[season] || 'Follow standard agronomic practices for your region.';
}

function parseCrops(raw) {
  try {
    const str = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    const trimmed = str.trim();
    if (trimmed.startsWith('[')) return JSON.parse(trimmed);
    return trimmed.split(',').map(c => c.replace(/['"]/g, '').trim()).filter(Boolean);
  } catch (_) { return []; }
}

function parseGeminiJSON(raw) {
  let clean = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start===-1||end===-1) throw new Error('No JSON');
  return JSON.parse(clean.slice(start, end+1));
}

exports.recommend = async (req, res, next) => {
  try {
    const { soil_type, ph, season, irrigation, area, farmer_problem } = req.body;
    if (!soil_type || ph === undefined || ph === null)
      return res.status(400).json({ success: false, message: 'soil_type and ph are required.' });

    const phNum  = parseFloat(ph);
    const ph_cat = phRange(phNum);

    // DB lookup — non-fatal, use fallback if not found
    let crops = [], fert = 'NPK 17-17-17', notes = '';
    try {
      const [rows] = await db.query(
        'SELECT * FROM soil_recommendations WHERE soil_type = ? AND ph_range = ?',
        [soil_type.toLowerCase(), ph_cat]
      );
      if (rows.length) {
        const rec = rows[0];
        crops = parseCrops(rec.crops);
        fert  = rec.fertiliser || rec.fertilizer || 'NPK 17-17-17';
        notes = rec.notes || '';
      } else {
        console.warn(`[soil/recommend] No DB row for ${soil_type}/${ph_cat} — using fallback`);
        // Fallback crops per soil type
        const fallbackCrops = {
          red: ['Groundnut','Finger Millet','Cowpea','Ragi','Jowar'],
          black: ['Cotton','Soybean','Sorghum','Wheat','Sunflower'],
          sandy: ['Groundnut','Watermelon','Tapioca','Cowpea','Sweet Potato'],
          clay: ['Rice','Sugarcane','Jute','Taro','Banana'],
          loam: ['Rice','Wheat','Maize','Sugarcane','Vegetables'],
          silt: ['Rice','Wheat','Pulses','Oilseeds','Vegetables'],
        };
        crops = fallbackCrops[soil_type.toLowerCase()] || ['Rice','Pulses','Vegetables'];
        fert  = 'NPK 17-17-17 + FYM + Lime';
        notes = `${soil_type} soil — AI-generated recommendations below.`;
      }
    } catch (dbErr) {
      console.warn('[soil/recommend] DB error:', dbErr.message);
      crops = ['Rice','Pulses','Vegetables'];
      fert  = 'NPK 17-17-17';
    }

    // ── Gemini AI 10-step treatment plan ──────────────────────────
    let ai_plan = null;
    try {
      const problemCtx = farmer_problem
        ? `\n\nFARMER'S SPECIFIC PROBLEM: "${farmer_problem}"\nYou MUST address this in steps 3, 4, 5 with exact products and doses.`
        : '';

      const problemSolField = farmer_problem
        ? `"<2-3 sentence targeted solution for the farmer's specific problem>"`
        : 'null';

      const prompt = `You are FarmAI, an expert agricultural scientist for Tamil Nadu, India.

SOIL DETAILS:
- Soil Type: ${soil_type} | pH: ${phNum} (${ph_cat})
- Season: ${season||'Kharif'} | Irrigation: ${irrigation||'Canal/Bore well'} | Area: ${area||'unspecified'} acres
- Recommended Crops: ${crops.join(', ')}
- Base Fertilizer: ${fert}${problemCtx}

Create a detailed 10-step soil treatment and crop management plan tailored for Tamil Nadu conditions.
Cover: soil prep, pH correction, organic amendments, fertilizer schedule (NPK timing), irrigation management,
pest/disease prevention, intercropping, micronutrient care, post-harvest soil restoration, next season prep.
Use specific Tamil Nadu available products with brand names and dosages wherever possible.

Reply ONLY with this exact JSON (no markdown, no extra text, start with { end with }):
{"treatment_steps":[{"step":1,"title":"<title>","action":"<detailed Tamil Nadu specific action with products/doses>","timing":"<when exactly>","icon":"<1 emoji>"},{"step":2,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":3,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":4,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":5,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":6,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":7,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":8,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":9,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"},{"step":10,"title":"<title>","action":"<action>","timing":"<when>","icon":"<emoji>"}],"problem_solution":${problemSolField},"quick_wins":["<do this today 1>","<do this today 2>","<do this today 3>"],"avoid":["<do NOT do this 1>","<do NOT do this 2>","<do NOT do this 3>"],"farmer_tip":"<1 warm encouraging line>"}`;

      console.log('[soil/recommend] Calling Gemini AI for', soil_type, '| problem:', farmer_problem ? 'YES' : 'NO');
      const result = await generateWithFallback(prompt);
      const raw = result.response.text();
      console.log('[soil/recommend] Raw response preview:', raw.slice(0, 80));
      ai_plan = parseGeminiJSON(raw);
      console.log('[soil/recommend] ✅ AI plan generated, steps:', ai_plan?.treatment_steps?.length);
    } catch (aiErr) {
      console.error('[soil/recommend] ❌ AI plan FAILED:', aiErr.message);
    }

    res.json({
      success: true,
      data: {
        soil_type, ph_value: phNum, ph_category: ph_cat,
        season: season || 'Kharif',
        recommendation: { crops, fertilizer: fert, fert, notes: notes || '' },
        season_tip:  seasonTip(season),
        nutrients:   estimateNutrients(soil_type.toLowerCase(), phNum),
        irrigation:  irrigation || null,
        area:        area || null,
        ai_plan,
        farmer_problem: farmer_problem || null,
      },
    });
  } catch (err) { next(err); }
};

exports.listTypes = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT soil_type FROM soil_recommendations ORDER BY soil_type');
    res.json({ success: true, data: rows.map(r => r.soil_type) });
  } catch (err) { next(err); }
};

// ── POST /api/soil/identify-image ─────────────────────────────────
// Multipart: soil_image — Gemini Vision identifies soil type
exports.identifyImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:'No image uploaded' });

    console.log(`[soil/identify-image] ${req.file.originalname} | ${req.file.size}b`);

    const prompt = `You are FarmAI, an expert soil scientist for Tamil Nadu, India.
Examine this soil photo carefully and identify the soil type.

Possible soil types in Tamil Nadu/India:
- loam: Dark brown, crumbly, balanced texture, holds shape when squeezed
- clay: Reddish-brown or grey, sticky when wet, hard when dry, holds shape firmly
- sandy: Light tan/beige, loose, gritty texture, falls apart easily
- silt: Smooth, silky texture, light brown/grey, holds shape but breaks apart
- black: Very dark black/dark brown (Regur/cotton soil), cracks when dry, sticky when wet
- red: Reddish/brick red color (Laterite soil), common in South India

Reply ONLY with this JSON (no markdown):
{"soil_type":"<loam|clay|sandy|silt|black|red>","soil_name":"<full name e.g. Black Cotton Soil>","confidence":"<high|medium|low>","description":"<2-3 sentences about what you see and why you identified it as this soil type>","characteristics":"<key visible characteristics: color, texture, structure>","typical_ph":"<typical pH range for this soil e.g. 5.0–6.5>","suitable_crops":"<2-3 best crops for this soil in Tamil Nadu>"}`;

    const result = await generateWithFallback([
      { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
      { text: prompt },
    ]);

    const raw  = result.response.text();
    const data = parseGeminiJSON(raw);
    console.log('[soil/identify-image] identified:', data.soil_type, '| confidence:', data.confidence);

    res.json({ success:true, data });

  } catch (err) {
    console.error('[soil/identify-image] ERROR:', err.message);
    // Vision fallback — try text
    try {
      const textPrompt = `You are a soil scientist. Based on typical Tamil Nadu soil types, suggest the most common soil type. Reply ONLY with JSON: {"soil_type":"loam","soil_name":"Loam Soil","confidence":"low","description":"Could not analyze image. Loam is the most common soil type in Tamil Nadu.","characteristics":"Mixed texture, moderate fertility","suitable_crops":"Rice, Wheat, Vegetables"}`;
      const r2   = await generateWithFallback(textPrompt);
      const data2 = parseGeminiJSON(r2.response.text());
      res.json({ success:true, data:data2 });
    } catch(e2) {
      res.status(500).json({ success:false, message: err.message });
    }
  }
};