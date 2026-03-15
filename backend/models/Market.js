// backend/models/Market.js
const db = require('../config/db');

const Market = {
  // Get latest price per crop for a given state
  getLatestPrices: async (state) => {
    const [rows] = await db.query(`
      SELECT m1.*
      FROM market_prices m1
      INNER JOIN (
        SELECT crop_name, MAX(recorded_date) AS max_date
        FROM market_prices
        WHERE state = ?
        GROUP BY crop_name
      ) m2 ON m1.crop_name = m2.crop_name AND m1.recorded_date = m2.max_date
      ORDER BY m1.crop_name
    `, [state]);
    return rows;
  },

  // Get 5-week trend for a crop
  getTrend: async (cropName) => {
    const [rows] = await db.query(
      `SELECT price, prev_price, recorded_date FROM market_prices
       WHERE crop_name = ? ORDER BY recorded_date DESC LIMIT 5`,
      [cropName]
    );
    return rows.reverse();
  }
};

module.exports = Market;