// backend/routes/harvest_ai.js
// Add these two routes to your existing Harvest.js router:
//   router.post('/ai/suggestions', ctrl_ai.getSuggestions);
//   router.post('/ai/update',      ctrl_ai.updateProgress);
// And add in server.js: app.use('/api/harvest', require('./routes/harvest_ai'));
// OR just paste the two route handlers at bottom of harvestController.js

const express = require('express');
const router  = express.Router();
const { generateWithFallback } = require('../utils/geminiKeyManager');

// ── Gemini client ─────────────────────────────────────────────────

// ── POST /api/harvest/ai/suggestions ─────────────────────────────
// Body: { crop, sow_date, harvest_date, prog, days_left, dur,
//         irrigation, variety, soil, location, area, stages[] }
router.post('/ai/suggestions', async (req, res) => {
  try {
    const {
      crop, sow_date, harvest_date, prog = 0, days_left, dur,
      irrigation = 'Canal / Bore well', variety = 'standard',
      soil = 'unknown', location = 'Tamil Nadu', area = '',
      stages = []
    } = req.body;

    if (!crop) return res.status(400).json({ success: false, message: 'crop required' });

    const today    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const sowFmt   = sow_date   ? new Date(sow_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
    const harvFmt  = harvest_date ? new Date(harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
    const stageIdx = Math.min(Math.floor((prog / 100) * stages.length), stages.length - 1);
    const curStage = stages[stageIdx] || 'Unknown';

    const prompt = `You are an expert agricultural advisor helping a Tamil Nadu farmer. Talk like a friendly, experienced farmer talking to a beginner — warm, practical, encouraging, and very specific.

FARM DATA:
- Crop: ${crop}
- Sown: ${sowFmt}
- Expected Harvest: ${harvFmt}
- Today: ${today}
- Progress: ${prog}% complete
- Current Stage: ${curStage}
- Days Until Harvest: ${days_left} days
- Total Duration: ${dur} days
- Irrigation: ${irrigation}
- Variety: ${variety}
- Soil: ${soil}
- Location: ${location}
- Area: ${area ? area + ' acres' : 'not specified'}

Give 4 highly practical suggestions. Each must:
- ALWAYS respond in English only — never use Tamil, Hindi or any other language
- Address the farmer as 'sir' (not 'thambi', 'anna' or any Tamil/regional term)
- Be specific to this exact crop at this exact stage (${prog}% / ${curStage})
- Mention exact dates (like "by 15 Apr 2026"), quantities (like "50 kg/acre"), or observable indicators
- Sound like a friendly expert advisor — warm, practical, conversational
- Be Tamil Nadu / South India specific in farming practices only
- NOT repeat generic advice — each tip must be actionable TODAY

Also check: is there any URGENT issue the farmer must act on RIGHT NOW?

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "suggestions": [
    {
      "icon": "<single emoji most relevant to the tip>",
      "color": "<hex color: green=#3dba72 gold=#c9a84c blue=#5ba4e8 orange=#fb923c>",
      "bg": "<matching rgba background like rgba(61,186,114,.1)>",
      "title": "<short punchy title 3-5 words>",
      "text": "<2-3 sentences of specific, warm, farmer-voice advice with exact dates/quantities>"
    }
  ],
  "urgent_alert": "<null if nothing urgent, or 1 sentence urgent warning>",
  "harvest_readiness": "<one of: not ready | preparing | approaching | imminent | ready>",
  "farmer_tip": "<1 casual encouraging sentence in English, address farmer as sir>"
}`;

    const result = await generateWithFallback(prompt);
    const raw    = result.response.text().replace(/```json|```/g, '').trim();
    const ai     = JSON.parse(raw);

    res.json({ success: true, data: ai });

  } catch (err) {
    console.error('[harvest/ai/suggestions]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/harvest/ai/update ───────────────────────────────────
// Body: { crop, activity, prog, days_left, dur, sow_date, harvest_date, stages[] }
router.post('/ai/update', async (req, res) => {
  try {
    const {
      crop, activity, prog = 0, days_left, dur,
      sow_date, harvest_date, stages = [],
      irrigation = 'Canal / Bore well', soil = 'unknown', location = 'Tamil Nadu'
    } = req.body;

    if (!crop)     return res.status(400).json({ success: false, message: 'crop required' });
    if (!activity) return res.status(400).json({ success: false, message: 'activity required' });

    const today   = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const sowFmt  = sow_date ? new Date(sow_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
    const harvFmt = harvest_date ? new Date(harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';

    // ── Always calculate progress from dates — never let AI guess it ──
    let confirmedProg = prog;
    if (sow_date && dur) {
      const sowMs       = new Date(sow_date).setHours(0,0,0,0);
      const nowMs       = new Date().setHours(0,0,0,0);
      const daysSinceSow = Math.max(0, Math.round((nowMs - sowMs) / 86400000));
      confirmedProg     = Math.min(100, Math.round((daysSinceSow / dur) * 100));
    }

    const prompt = `You are FarmAI — an expert agricultural AI and friendly farmer advisor for Tamil Nadu. A farmer has reported what they just did on their farm.

CROP STATUS:
- Crop: ${crop}
- Sowing Date: ${sowFmt}
- Expected Harvest: ${harvFmt}
- Today: ${today}
- DATE-CONFIRMED PROGRESS: ${confirmedProg}% — calculated from actual sowing date. USE THIS EXACT NUMBER for new_progress_pct. Never change it.
- Days Until Harvest: ${days_left} days
- Total Duration: ${dur} days
- Growth Stages in order: ${stages.join(' → ')}
- Irrigation: ${irrigation}
- Soil: ${soil}
- Location: ${location}

FARMER SAYS:
"${activity}"

IMPORTANT: Always respond in English only. Address the farmer as 'sir'. Never use Tamil, Hindi or regional language words.

Analyse what the farmer did and:
1. Set new_progress_pct to exactly ${confirmedProg} — this is always correct, calculated from the real sowing date
2. Determine which stage the farmer is in at ${confirmedProg}% of ${stages.length} total stages
3. Give precise next steps in English only
4. Check if there are any concerns from what they described (yellowing, pests, weather etc.)

Respond ONLY in this exact JSON (no markdown):
{
  "new_progress_pct": ${confirmedProg},
  "active_stage_index": <0-based index for ${confirmedProg}% across ${stages.length} stages>,
  "completed_stages": <number of stages fully done>,
  "status_summary": "<2-4 words like 'Planting Done' or 'Tillering Active'>",
  "what_done": "<1 warm sentence confirming what the farmer completed, farmer-to-farmer tone>",
  "crop_health": "<excellent | good | fair | concern>",
  "health_reason": "<1 sentence why, mention specific thing they said>",
  "next_action": "<the single most important thing to do next — be specific with quantity/method>",
  "next_action_by": "<exact date or 'Within X days' — be specific>",
  "pending_tasks": [
    "<task 1 with specific timing>",
    "<task 2 with specific amount/method>",
    "<task 3 — monitoring or observation task>"
  ],
  "warnings": ["<any warning based on what they said, e.g. yellowing = nitrogen deficiency. Empty array if none>"],
  "harvest_impact": "<none | advance | delay>",
  "harvest_days_change": <0 if none, else number of days>,
  "ai_insight": "<2 sentences of personalised insight — mention their specific crop and what they did, farmer-to-farmer warm tone>",
  "encouragement": "<1 short encouraging sentence in English only, address as sir>"
}`;

    const result = await generateWithFallback(prompt);
    const raw    = result.response.text().replace(/```json|```/g, '').trim();
    const ai     = JSON.parse(raw);

    res.json({ success: true, data: ai });

  } catch (err) {
    console.error('[harvest/ai/update]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;