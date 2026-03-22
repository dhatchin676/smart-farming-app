// config/db.js — MySQL stub (not used, MongoDB only)
const pool = {
  query:   async () => [[], []],
  execute: async () => [[], []],
};
console.log('db.js: MySQL stub - using MongoDB');
module.exports = pool;
