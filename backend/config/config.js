// backend/config/config.js
module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // API Keys
  ANTHROPIC_API_KEY:   process.env.ANTHROPIC_API_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  DATA_GOV_API_KEY:    process.env.DATA_GOV_API_KEY || process.env.AGMARKNET_API_KEY,

  // Anthropic
  CLAUDE_MODEL:      'claude-sonnet-4-20250514',
  CLAUDE_MAX_TOKENS: 1024,

  // OpenWeatherMap
  WEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
  DEFAULT_LAT:  parseFloat(process.env.DEFAULT_LAT)  || 11.0168,
  DEFAULT_LON:  parseFloat(process.env.DEFAULT_LON)  || 76.9558,
  DEFAULT_CITY: process.env.DEFAULT_CITY             || 'Coimbatore',

  // Agmarknet
  AGMARK_BASE_URL: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',

  // Cache TTL (seconds)
  WEATHER_CACHE_TTL: parseInt(process.env.WEATHER_CACHE_TTL) || 600,
  MARKET_CACHE_TTL:  parseInt(process.env.MARKET_CACHE_TTL)  || 3600,
  DISEASE_CACHE_TTL: parseInt(process.env.DISEASE_CACHE_TTL) || 86400,

  // Rate limits
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX:       100,
  CHAT_RATE_LIMIT_MAX:  30,
};