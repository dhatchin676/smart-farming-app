// backend/config/db.js
// MySQL is NOT used in production — SmartFarm AI uses MongoDB + Gemini AI
// This file is kept as a no-op stub so routes that import it don't crash

const pool = {
  query:         async () => [[], []],
  execute:       async () => [[], []],
  getConnection: async () => { throw new Error('MySQL not configured'); },
};

console.log('ℹ️  db.js: MySQL stub loaded — using MongoDB + AI fallbacks');

module.exports = pool;