# 🌱 SmartFarm AI — Intelligent Agriculture Platform

> AI-powered farming assistant for Indian farmers · Niral Thiruvizha 3.0  
> Anjalai Ammal Mahalingam Engineering College · College Code: 8204

[![Railway Deploy](https://railway.app/button.svg)](https://railway.app)

## 🚀 Live Demo
Deployed on Railway — see link above.

## 📋 Features

| Module | Description |
|--------|-------------|
| 🌤️ **Weather** | Live weather + 7-day forecast + irrigation advice |
| 🌱 **Soil** | AI soil identification by photo + crop recommendations |
| 🔬 **Disease** | Gemini Vision crop disease detection + 10-step treatment |
| 📊 **Market** | Live Agmarknet mandi prices + government schemes |
| 🌾 **Harvest** | Harvest date prediction + growth stage tracker |
| 🤖 **AcqireAI** | Voice-powered chatbot in Tamil & English (Groq) |

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Database**: MySQL
- **AI**: Google Gemini (Vision) + Groq (LLaMA 3.3)
- **APIs**: OpenWeatherMap, data.gov.in Agmarknet
- **Deploy**: Railway

## ⚙️ Environment Variables

Create `.env` in the `backend/` folder:

```env
PORT=5000
NODE_ENV=production

# Database (Railway provides these automatically)
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=smartfarm_db
DB_PORT=3306

# AI Keys
GEMINI_API_KEY_1=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY_1=your_groq_key_1
GROQ_API_KEY_2=your_groq_key_2

# APIs
OPENWEATHER_API_KEY=your_openweather_key
DATA_GOV_API_KEY=your_data_gov_key
```

## 🚀 Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a MySQL database plugin
4. Set all environment variables in Railway dashboard
5. Deploy!

## 👥 Team
- Kalaiselvi M
- Akalya R  
- Asika M
- Dhatchineswaran D

**Guide**: Mr. R. Rama Rajesh, Asst. Prof. IT