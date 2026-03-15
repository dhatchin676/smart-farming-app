// backend/utils/geminiKeyManager.js
// ── Gemini API Key Rotation Manager ─────────────────────────────────────────
// Rotates through multiple API keys. If one fails (quota/expired), tries next.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Load keys from .env ───────────────────────────────────────────────────────
// In .env add:
//   GEMINI_API_KEY_1=AIzaSy...
//   GEMINI_API_KEY_2=AIzaSy...
//   GEMINI_API_KEY_3=AIzaSy...
//   GEMINI_API_KEY_4=AIzaSy...
//   GEMINI_MODEL=gemini-2.5-flash

function getKeys() {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY, // legacy fallback
  ].filter(Boolean);

  if (!keys.length) throw new Error('No Gemini API keys found in .env');
  return keys;
}

// ── Current key index (round-robin) ──────────────────────────────────────────
let currentKeyIndex = 0;

function getNextKey(keys) {
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

// ── Get a Gemini model instance with automatic key rotation ──────────────────
// Usage: const model = getGeminiModel();
//        const result = await model.generateContent(...);
function getGeminiModel(modelName) {
  const keys  = getKeys();
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const key   = getNextKey(keys);
  console.log(`[gemini] Using key index ${currentKeyIndex} | model: ${model}`);
  return new GoogleGenerativeAI(key).getGenerativeModel({ model });
}

// ── Generate content with automatic failover across all keys ─────────────────
// Usage: const result = await generateWithFallback(parts);
// parts: string OR array (for vision: [{inlineData:...}, {text:...}])
async function generateWithFallback(parts, modelName) {
  const keys  = getKeys();
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  let lastError;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(currentKeyIndex + i) % keys.length];
    try {
      console.log(`[gemini] Trying key ${i + 1}/${keys.length} | model: ${model}`);
      const genAI  = new GoogleGenerativeAI(key);
      const m      = genAI.getGenerativeModel({ model });
      const result = await m.generateContent(parts);
      // Success — advance rotation so next call uses next key
      currentKeyIndex = (currentKeyIndex + i + 1) % keys.length;
      return result;
    } catch (err) {
      lastError = err;
      const isQuota   = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
      const isExpired = err.message?.includes('401') || err.message?.includes('API_KEY_INVALID');
      const isNotFound = err.message?.includes('404') || err.message?.includes('not found');

      if (isQuota || isExpired) {
        console.warn(`[gemini] Key ${i + 1} failed (${isQuota ? 'quota' : 'expired'}) — trying next key`);
        continue; // try next key
      }
      if (isNotFound) {
        console.error(`[gemini] Model "${model}" not available — check GEMINI_MODEL in .env`);
        throw err; // model issue, not key issue — don't rotate
      }
      // Unknown error — still try next key
      console.warn(`[gemini] Key ${i + 1} error: ${err.message} — trying next`);
    }
  }

  throw new Error(`All ${keys.length} Gemini API keys failed. Last error: ${lastError?.message}`);
}

module.exports = { getGeminiModel, generateWithFallback };