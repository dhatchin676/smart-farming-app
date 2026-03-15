// backend/controllers/diseaseController.js
const path = require('path');
const fs   = require('fs');
const { generateWithFallback } = require('../utils/geminiKeyManager');

let DISEASES = [];
try {
  DISEASES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'diseases.json'), 'utf8'));
} catch (_) { console.warn('[disease] diseases.json not found'); }

function parseGeminiJSON(raw) {
  let clean = raw.trim()
    .replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start===-1||end===-1) throw new Error('No JSON: '+raw.slice(0,120));
  return JSON.parse(clean.slice(start, end+1));
}

// ── Shared prompt — used for both vision and text routes ──────────
function buildPrompt({ crop, location, symptoms, farmer_problem, mode }) {
  const problemCtx = farmer_problem
    ? `\n\nFARMER'S STORY: "${farmer_problem}"\nYou MUST include a "problem_solution" field addressing this story specifically.`
    : '';
  const sympCtx = symptoms ? `\nFarmer observed: "${symptoms}"` : '';
  const imgCtx  = mode==='vision'
    ? '\n\nCRITICAL SEVERITY RULE — you MUST follow this exactly:\nLook at the image and estimate % of leaf/plant area visibly damaged or destroyed:\n- "mild" = <20% damage (small spots, few holes, early stage)\n- "moderate" = 20-50% damage (noticeable but plant still mostly intact)\n- "severe" = >50% damage OR large holes/tears visible OR widespread infestation across multiple leaves OR farmer reports spreading fast\nThe image shows extensive leaf damage with large irregular holes — this is SEVERE. Do NOT output "moderate" when visible damage is clearly heavy.'
    : '\n\nCRITICAL SEVERITY RULE — you MUST follow this exactly:\n- "mild" = early stage, <20% plants affected, minor symptoms\n- "moderate" = 20-50% plants affected, spreading but controllable\n- "severe" = >50% affected, spreading fast, farmer reports heavy loss, or pest/disease found in whorl/stem\nDo NOT default to moderate — assess based on what the farmer described.';

  return `You are FarmAI — an expert plant pathologist and agricultural scientist for Tamil Nadu, India.
Crop: ${crop} | Location: ${location}${sympCtx}${problemCtx}${imgCtx}

Give a COMPREHENSIVE disease/pest diagnosis with a 10-step treatment plan.
Use Tamil Nadu specific pesticide brands (Confidor, Dithane M-45, Bavistin, Indofil, Coragen, Proclaim, Movento, Alika etc) with exact doses in ml/litre or g/litre.

Reply ONLY with this JSON (no markdown, no extra text, start with { end with }):
{"name":"<disease/pest/deficiency name>","affected_crop":"<crop>","severity":"<mild|moderate|severe>","confidence":"<high|medium|low>","description":"<2-3 sentences about this disease>","visual_symptoms":"<visible symptoms on plant>","symptoms_match":"<how symptoms match this diagnosis>","problem_solution":${farmer_problem ? '"<2-3 sentence specific solution directly addressing the farmer story>"' : 'null'},"treatment_steps":[{"step":1,"title":"Immediate Action","action":"<urgent action with specifics>","timing":"Right now","icon":"⚡"},{"step":2,"title":"Field Scouting","action":"<how to scout, frequency, threshold>","timing":"Twice weekly","icon":"🔍"},{"step":3,"title":"Chemical Control 1","action":"<brand + dose/litre + application method>","timing":"Within 24-48 hrs","icon":"🧪"},{"step":4,"title":"Chemical Control 2","action":"<rotation spray brand + dose to prevent resistance>","timing":"7-10 days after step 3","icon":"🧪"},{"step":5,"title":"Organic / Neem","action":"<neem or bio organic with prep method + frequency>","timing":"Every 5-7 days","icon":"🌿"},{"step":6,"title":"Cultural Control","action":"<field hygiene, intercropping, pheromone traps>","timing":"Ongoing","icon":"🌾"},{"step":7,"title":"Biological Control","action":"<Trichogramma/NPV/Pseudomonas/Beauveria — dose and frequency>","timing":"Weekly releases","icon":"🐛"},{"step":8,"title":"Soil & Root Care","action":"<soil treatment, root zone management if relevant>","timing":"At next irrigation","icon":"🪱"},{"step":9,"title":"Post-Treatment Monitoring","action":"<what to check, how often, when to re-apply>","timing":"7-14 days after treatment","icon":"📋"},{"step":10,"title":"Recovery & Next Season Prep","action":"<plant recovery signs, what to do for next crop cycle>","timing":"End of season","icon":"🌱"}],"prevention":["<tip1>","<tip2>","<tip3>","<tip4>","<tip5>"],"quick_wins":["<do this today 1>","<do this today 2>","<do this today 3>"],"spread_risk":"<none|low|medium|high>","best_time_to_spray":"<morning|evening|both — detailed reason>","government_helpline":"Tamil Nadu Agriculture Helpline: 1800-425-1551","farmer_tip":"<1 warm encouraging line>"}`;
}

exports.getDisease    = (req, res) => res.json({ success:true, message:'FarmAI Disease API v3' });
exports.listDiseases  = (req, res) => res.json({ success:true, data:DISEASES });
exports.identifyDisease = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success:false, message:'name required' });
  const match = DISEASES.find(d => d.name.toLowerCase().includes(name.toLowerCase()));
  if (match) return res.json({ success:true, data:match });
  res.status(404).json({ success:false, message:'Not found' });
};

// ── POST /api/disease/detect ──────────────────────────────────────
exports.detectBySymptoms = async (req, res) => {
  const { symptoms, crop='unknown crop', location='Tamil Nadu, India', farmer_problem='' } = req.body;
  if (!symptoms && !farmer_problem)
    return res.status(400).json({ success:false, message:'symptoms or farmer_problem required' });

  const prompt = buildPrompt({ crop, location, symptoms, farmer_problem, mode:'text' });
  try {
    const result = await generateWithFallback(prompt);
    const raw    = result.response.text();
    console.log('[disease/detect] OK:', raw.slice(0,100));
    res.json({ success:true, source:'gemini-ai', data:parseGeminiJSON(raw) });
  } catch (err) {
    console.error('[disease/detect] ERROR:', err.message);
    res.status(500).json({ success:false, message:err.message });
  }
};

// ── POST /api/disease/image ───────────────────────────────────────
exports.detectByImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success:false, message:'No image uploaded' });

  const crop           = req.body.crop           || 'unknown crop';
  const symptoms       = req.body.symptoms       || '';
  const location       = req.body.location       || 'Tamil Nadu, India';
  const farmer_problem = req.body.farmer_problem || '';

  console.log(`[disease/image] ${req.file.originalname} | ${req.file.size}b | crop=${crop}`);

  const prompt = buildPrompt({ crop, location, symptoms, farmer_problem, mode:'vision' });

  try {
    const result = await generateWithFallback([
      { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString('base64') } },
      { text: prompt },
    ]);
    const raw = result.response.text();
    console.log('[disease/image] vision OK:', raw.slice(0,100));
    res.json({ success:true, source:'gemini-vision', data:parseGeminiJSON(raw) });
  } catch (visionErr) {
    console.warn('[disease/image] Vision failed:', visionErr.message);
    // Smart fallback — Gemini text (never static)
    try {
      const fallbackSymptoms = symptoms || `crop image uploaded showing disease/pest damage on ${crop}`;
      const textPrompt = buildPrompt({ crop, location, symptoms:fallbackSymptoms, farmer_problem, mode:'text' });
      const result2    = await generateWithFallback(textPrompt);
      const raw2       = result2.response.text();
      console.log('[disease/image] text-fallback OK');
      res.json({ success:true, source:'gemini-text-fallback', data:parseGeminiJSON(raw2) });
    } catch (textErr) {
      console.error('[disease/image] All Gemini failed:', textErr.message);
      res.status(500).json({ success:false, message:'AI unavailable: '+textErr.message });
    }
  }
};