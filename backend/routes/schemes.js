// routes/schemes.js — FarmAI Government Scheme Finder
// Real-time: Gemini AI fetches current schemes per state with official links
// Fallback: verified hardcoded central schemes if AI unavailable

const express = require('express');
const router  = express.Router();
const { generateWithFallback } = require('../utils/geminiKeyManager');

// ── Cache: 12 hours per state ─────────────────────────────────────
const _cache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000;
function cacheGet(k){const e=_cache.get(k);if(!e)return null;if(Date.now()-e.ts>CACHE_TTL){_cache.delete(k);return null;}return e.v;}
function cacheSet(k,v){_cache.set(k,{v,ts:Date.now()});}

// ── Official state portals ────────────────────────────────────────
const STATE_PORTALS = {
  'tamil nadu':'https://www.tn.gov.in/agriculture',
  'punjab':'https://agripb.gov.in',
  'maharashtra':'https://mahadbt.maharashtra.gov.in',
  'karnataka':'https://raitamitra.karnataka.gov.in',
  'uttar pradesh':'https://upagriculture.com',
  'west bengal':'https://krishakbandhu.net',
  'andhra pradesh':'https://ysrrythubharosa.ap.gov.in',
  'telangana':'https://rythubandhu.telangana.gov.in',
  'gujarat':'https://ikhedut.gujarat.gov.in',
  'rajasthan':'https://rajkisan.rajasthan.gov.in',
  'madhya pradesh':'https://mpfarms.gov.in',
  'haryana':'https://agriharyana.gov.in',
  'bihar':'https://dbtagriculture.bihar.gov.in',
  'odisha':'https://agri.odisha.gov.in',
  'assam':'https://agri.assam.gov.in',
  'kerala':'https://www.keralaagriculture.gov.in',
  'himachal pradesh':'https://www.hpagriculture.com',
  'uttarakhand':'https://agriculture.uk.gov.in',
  'jharkhand':'https://agri.jharkhand.gov.in',
  'chhattisgarh':'https://agriportal.cg.nic.in',
};

// ── Central schemes — verified, always shown ──────────────────────
const CENTRAL = [
  {name:'PM-KISAN',tag:'Central · Income Support',highlight:'₹6,000/year',category:'income',desc:'Direct income support of ₹6,000/year in three ₹2,000 instalments via DBT to all landholding farmer families. e-KYC mandatory.',link:'https://pmkisan.gov.in'},
  {name:'PM Fasal Bima Yojana (PMFBY)',tag:'Central · Crop Insurance',highlight:'2% Kharif · 1.5% Rabi',category:'insurance',desc:'Crop insurance at just 2% premium (Kharif) and 1.5% (Rabi). Covers pre-sowing to post-harvest losses from natural calamity, pests and diseases.',link:'https://pmfby.gov.in'},
  {name:'Kisan Credit Card (KCC)',tag:'Central · Credit',highlight:'₹3 lakh @ 4%',category:'credit',desc:'Short-term crop loans up to ₹3 lakh at effective 4% interest. Valid 5 years. Covers seeds, fertiliser, labour and post-harvest expenses.',link:'https://www.nabard.org/content.aspx?id=572'},
  {name:'PMKSY — Per Drop More Crop',tag:'Central · Micro Irrigation',highlight:'55% subsidy',category:'irrigation',desc:'55% subsidy on drip/sprinkler systems for small farmers. Saves 30–50% water, increases yield 40–50%.',link:'https://pmksy.gov.in'},
  {name:'Soil Health Card Scheme',tag:'Central · Soil Testing',highlight:'Free every 2 years',category:'soil',desc:'Free soil testing every 2 years covering 12 parameters. Personalised fertiliser recommendation reduces input cost by up to 20%.',link:'https://soilhealth.dac.gov.in'},
  {name:'PM-KUSUM Solar Pump',tag:'Central · Solar Energy',highlight:'30–50% subsidy',category:'energy',desc:'30–50% central subsidy on solar irrigation pumps. Eliminates electricity bills. Farmers can sell surplus power at ₹3–4/unit.',link:'https://pmkusum.mnre.gov.in'},
  {name:'e-NAM (National Agriculture Market)',tag:'Central · Market Access',highlight:'1,000+ mandis',category:'market',desc:'Online auction platform across 1,000+ mandis in 22 states. Transparent price discovery and direct buyer access pan-India.',link:'https://www.enam.gov.in'},
  {name:'PM Kisan Maan-Dhan Yojana',tag:'Central · Farmer Pension',highlight:'₹3,000/month pension',category:'pension',desc:'Voluntary pension for small/marginal farmers aged 18–40. Farmer pays ₹55–₹200/month (matched by govt). ₹3,000/month from age 60.',link:'https://pmkmy.gov.in'},
  {name:'Agriculture Infrastructure Fund',tag:'Central · Post-Harvest Infra',highlight:'3% interest subvention',category:'infrastructure',desc:'3% interest subvention on loans up to ₹2 crore for cold storage, warehouses, sorting units. ₹1 lakh crore fund.',link:'https://agriinfra.dac.gov.in'},
  {name:'Paramparagat Krishi Vikas Yojana',tag:'Central · Organic Farming',highlight:'₹31,500/ha over 3yr',category:'organic',desc:'₹31,500/hectare over 3 years for organic farming clusters. ₹15,000 directly to farmers for inputs and certification.',link:'https://pgsindia-ncof.gov.in'},
];

function normaliseState(s){return (s||'').toLowerCase().trim().replace(/\s+/g,' ');}

// ── Gemini AI: fetch live state schemes ───────────────────────────
async function fetchStateSchemesByAI(stateName, crop) {
  const portal = STATE_PORTALS[normaliseState(stateName)] || 'https://farmer.gov.in';
  const cropCtx = crop ? `The farmer grows ${crop}. Prioritise schemes relevant to ${crop}.` : '';
  const today = new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'});

  const prompt = `You are an Indian government agricultural scheme expert. Today is ${today}.
List the 3 most important CURRENTLY ACTIVE state government agricultural schemes for ${stateName} state, India.
${cropCtx}

RULES:
- Only REAL schemes that exist right now in 2025-26
- Every link must be a REAL working official URL (.gov.in or official state portal)
- Official portal for ${stateName}: ${portal}
- Include actual rupee amounts or subsidy percentages
- Do NOT invent schemes

Reply ONLY with a valid JSON array, no markdown:
[{"name":"<official scheme name>","tag":"${stateName} · <category>","highlight":"<key benefit>","category":"<income|insurance|credit|irrigation|energy|seeds|market|horticulture>","desc":"<2 sentences: benefit, eligibility, how to apply>","link":"<real official URL>"}]`;

  const result = await generateWithFallback(prompt);
  const raw = result.response.text().replace(/```json|```/g,'').trim();
  const start = raw.indexOf('['), end = raw.lastIndexOf(']');
  if(start===-1||end===-1) throw new Error('No JSON array in response');
  const schemes = JSON.parse(raw.slice(start, end+1));
  return schemes.filter(s => s.name && s.link && s.link.startsWith('http'));
}

// ── Build final list: AI state (3) + central (3) ─────────────────
async function getSchemes(stateName, crop, limit=6) {
  const cacheKey = `${normaliseState(stateName)}:${crop||'all'}`;
  const cached = cacheGet(cacheKey);
  if(cached) return {schemes:cached,source:'cache'};

  let stateSchemes = [], source = 'central-only';
  try {
    stateSchemes = await fetchStateSchemesByAI(stateName, crop);
    source = 'gemini-ai-live';
    console.log(`[schemes] AI: ${stateSchemes.length} schemes for ${stateName}`);
  } catch(err) {
    console.warn(`[schemes] AI failed (${stateName}):`, err.message);
  }

  const cropPriority = {
    Rice:['insurance','irrigation','seeds','income','credit'],
    Wheat:['insurance','seeds','income','credit','soil'],
    Maize:['seeds','insurance','income','credit'],
    Cotton:['insurance','credit','irrigation','income'],
    Groundnut:['insurance','seeds','income','credit'],
    Tomato:['horticulture','insurance','market','income'],
    Sugarcane:['irrigation','insurance','credit','income','energy'],
  };
  const pri = crop?(cropPriority[crop]||['income','insurance','credit','irrigation','market']):['income','insurance','credit','irrigation','market'];
  const sorted = [...CENTRAL].sort((a,b)=>{const ai=pri.indexOf(a.category),bi=pri.indexOf(b.category);return(ai===-1?99:ai)-(bi===-1?99:bi);});

  const nState = Math.min(stateSchemes.length,3);
  const final = [...stateSchemes.slice(0,nState),...sorted.slice(0,limit-nState)].slice(0,limit);
  cacheSet(cacheKey,final);
  return {schemes:final,source};
}

// ── Routes ────────────────────────────────────────────────────────
router.post('/state', async (req,res) => {
  const {state,crop} = req.body;
  if(!state) return res.status(400).json({success:false,message:'state required'});
  try {
    const {schemes,source} = await getSchemes(state,crop||null,6);
    res.json({success:true,state,crop:crop||null,count:schemes.length,source,schemes});
  } catch(err) {
    res.status(500).json({success:false,message:err.message});
  }
});

router.post('/crop', async (req,res) => {
  const {crop,state} = req.body;
  if(!crop) return res.status(400).json({success:false,message:'crop required'});
  try {
    const {schemes,source} = await getSchemes(state||'Tamil Nadu',crop,6);
    res.json({success:true,crop,state:state||'Tamil Nadu',count:schemes.length,source,schemes});
  } catch(err) {
    res.status(500).json({success:false,message:err.message});
  }
});

router.get('/list', (req,res) => {
  res.json({success:true,central_count:CENTRAL.length,states_covered:Object.keys(STATE_PORTALS),note:'State schemes fetched real-time via Gemini AI',schemes:CENTRAL.map(s=>({name:s.name,tag:s.tag,link:s.link}))});
});

module.exports = router;