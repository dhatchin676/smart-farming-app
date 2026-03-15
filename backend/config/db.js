// backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'smartfarm_db',
  port:     parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  typeCast: function(field, next) {
    if (field.type === 'JSON') return field.string();
    return next();
  }
});

// Test connection on startup — warn but don't crash
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.warn('⚠️  MySQL connection failed:', err.message);
    console.warn('⚠️  App will run with fallback data where possible');
    // Don't process.exit — let the app run with AI fallbacks
  });

module.exports = pool;