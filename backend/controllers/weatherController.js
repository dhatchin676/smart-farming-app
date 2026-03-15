// controllers/weatherController.js
const axios   = require('axios');
const NodeCache = require('node-cache');
const config  = require('../config/config');

const cache = new NodeCache({ stdTTL: config.WEATHER_CACHE_TTL });

// ── Fallback mock data (when API key not configured) ──────────────
const MOCK_WEATHER = {
  city: 'Coimbatore', country: 'IN',
  temp: 29, feels_like: 32, humidity: 68, wind_speed: 12,
  uv_index: 6, condition: 'Partly Cloudy', icon: '02d',
  pressure: 1012, visibility: 9, dew_point: 21, rain_chance: 25,
  lat: 11.0168, lon: 76.9558,
};
const MOCK_FORECAST = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return {
    date:  d.toISOString().split('T')[0],
    day:   days[d.getDay()],
    temp_max: 28 + Math.floor(Math.random() * 6),
    temp_min: 20 + Math.floor(Math.random() * 4),
    humidity: 60 + Math.floor(Math.random() * 25),
    rain_chance: [5,15,60,35,20,8,5][i] || 10,
    condition: ['Clear','Partly Cloudy','Rainy','Cloudy','Partly Cloudy','Clear','Clear'][i],
    icon: ['01d','02d','10d','04d','02d','01d','01d'][i],
  };
});

// ── Irrigation advice logic ───────────────────────────────────────
function calcIrrigationAdvice(current, forecast) {
  const rainDays  = (forecast || []).filter(d => d.rain_chance > 50).length;
  const avgTemp   = current.temp || 29;
  const humidity  = current.humidity || 65;

  let advice, urgency, schedule;

  if (rainDays >= 3) {
    advice   = 'Rain expected on multiple days. Reduce or skip irrigation this week.';
    urgency  = 'low';
    schedule = 'Skip next 3 days. Monitor soil moisture.';
  } else if (current.rain_chance > 60) {
    advice   = 'Rain likely today. Hold irrigation for 24 hours.';
    urgency  = 'low';
    schedule = 'Resume irrigation after rain stops.';
  } else if (avgTemp > 35 || humidity < 40) {
    advice   = 'High temperature / low humidity. Water your crops twice daily.';
    urgency  = 'high';
    schedule = 'Morning 6–8 AM and Evening 5–7 PM.';
  } else if (avgTemp > 30) {
    advice   = 'Warm conditions. Irrigate once per day in the morning.';
    urgency  = 'medium';
    schedule = 'Morning 6–9 AM.';
  } else {
    advice   = 'Moderate conditions. Regular irrigation schedule is fine.';
    urgency  = 'low';
    schedule = 'Every alternate morning, 6–9 AM.';
  }

  return { advice, urgency, schedule, rain_days_ahead: rainDays };
}


// ── Weather icon helper ───────────────────────────────────────────
function getWeatherIcon(condition) {
  const c = (condition||'').toLowerCase();
  if(c.includes('thunder')) return '⛈';
  if(c.includes('rain') || c.includes('drizzle')) return '🌧';
  if(c.includes('snow')) return '❄️';
  if(c.includes('cloud')) return '☁️';
  if(c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫';
  return '☀️';
}

// ── GET /api/weather ──────────────────────────────────────────────
exports.getCurrent = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    const cacheKey = `weather:${city || lat + ',' + lon}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: "cache" });

    if (!config.OPENWEATHER_API_KEY) {
      // Return mock data if no API key
      return res.json({ success:true, data:{ ...MOCK_WEATHER, description:MOCK_WEATHER.condition, high:MOCK_WEATHER.temp+3, low:MOCK_WEATHER.temp-4, forecast:MOCK_FORECAST.map(d=>({...d,high:d.temp_max,low:d.temp_min,rain:d.rain_chance,icon:getWeatherIcon(d.condition)})) }, source:'mock' });
    }

    const params = city
      ? { q: city, appid: config.OPENWEATHER_API_KEY, units: 'metric' }
      : { lat, lon, appid: config.OPENWEATHER_API_KEY, units: 'metric' };

    const { data } = await axios.get(`${config.WEATHER_BASE_URL}/weather`, { params });

    const result = {
      city:        data.name,
      country:     data.sys.country,
      temp:        Math.round(data.main.temp),
      feels_like:  Math.round(data.main.feels_like),
      humidity:    data.main.humidity,
      wind_speed:  Math.round(data.wind.speed * 3.6), // m/s → km/h
      pressure:    data.main.pressure,
      visibility:  Math.round((data.visibility || 10000) / 1000),
      condition:   data.weather[0].description,
      icon:        data.weather[0].icon,
      rain_chance: data.rain ? 80 : 15,
      lat:         data.coord.lat,
      lon:         data.coord.lon,
      source:      'openweathermap',
    };

    // Fetch forecast for same city to bundle into single response
    let forecast = cache.get('forecast:'+cacheKey) || MOCK_FORECAST;
    try {
      const fp = city
        ? { q: city, appid: config.OPENWEATHER_API_KEY, units: 'metric', cnt: 56 }
        : { lat, lon, appid: config.OPENWEATHER_API_KEY, units: 'metric', cnt: 56 };
      const fRes = await axios.get(config.WEATHER_BASE_URL+'/forecast', { params: fp });
      const days = {};
      fRes.data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!days[date] || item.dt_txt.includes('12:00')) days[date] = item;
      });
      const dNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      forecast = Object.entries(days).slice(0,7).map(([date,item]) => {
        const d = new Date(date);
        return { date, day:dNames[d.getDay()], high:Math.round(item.main.temp_max), low:Math.round(item.main.temp_min),
          humidity:item.main.humidity, rain:Math.round((item.pop||0)*100), rain_chance:Math.round((item.pop||0)*100),
          condition:item.weather[0].description, icon:item.weather[0].icon };
      });
    } catch(_) {}
    const fullResult = { ...result, description:result.condition, high:result.temp+3, low:result.temp-5, forecast };
    cache.set(cacheKey, fullResult);
    res.json({ success:true, data:fullResult, source:'openweathermap' });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.json({ success:true, data:{ ...MOCK_WEATHER, description:MOCK_WEATHER.condition, forecast:MOCK_FORECAST.map(d=>({...d,high:d.temp_max,low:d.temp_min,rain:d.rain_chance,icon:getWeatherIcon(d.condition)})) }, source:'mock' });
    }
    next(err);
  }
};

// ── GET /api/weather/forecast ─────────────────────────────────────
exports.getForecast = async (req, res, next) => {
  try {
    const { city, lat, lon } = req.query;
    const cacheKey = `forecast:${city || lat + ',' + lon}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json({ forecast: cached, source: 'cache' });

    if (!config.OPENWEATHER_API_KEY) {
      return res.json({ forecast: MOCK_FORECAST, source: 'mock' });
    }

    const params = city
      ? { q: city, appid: config.OPENWEATHER_API_KEY, units: 'metric', cnt: 56 }
      : { lat, lon, appid: config.OPENWEATHER_API_KEY, units: 'metric', cnt: 56 };

    const { data } = await axios.get(`${config.WEATHER_BASE_URL}/forecast`, { params });

    // Group by day, take one reading per day (12:00 UTC)
    const days = {};
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!days[date] || item.dt_txt.includes('12:00')) days[date] = item;
    });

    const forecast = Object.entries(days).slice(0, 7).map(([date, item]) => {
      const d = new Date(date);
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      return {
        date,
        day:        dayNames[d.getDay()],
        temp_max:   Math.round(item.main.temp_max),
        temp_min:   Math.round(item.main.temp_min),
        humidity:   item.main.humidity,
        rain_chance: Math.round((item.pop || 0) * 100),
        condition:  item.weather[0].description,
        icon:       item.weather[0].icon,
      };
    });

    cache.set(cacheKey, forecast);
    res.json({ forecast, source: 'openweathermap' });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.json({ forecast: MOCK_FORECAST, source: 'mock' });
    }
    next(err);
  }
};

// ── GET /api/weather/irrigation ───────────────────────────────────
exports.getIrrigation = async (req, res, next) => {
  try {
    const { city = config.DEFAULT_CITY } = req.query;

    // Reuse current + forecast (already cached if hit earlier)
    let current  = cache.get(`weather:${city}`)  || MOCK_WEATHER;
    let forecast = cache.get(`forecast:${city}`) || MOCK_FORECAST;

    const advice = calcIrrigationAdvice(current, forecast);
    res.json({ city, ...advice, source: 'smartfarm-logic' });
  } catch (err) {
    next(err);
  }
};