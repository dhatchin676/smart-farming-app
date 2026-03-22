<div align="center">

<img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80" alt="SmartFarm AI Banner" width="100%" style="border-radius:12px"/>

<br/><br/>

# 🌾 SmartFarm AI

### *Intelligent Agriculture Platform for Indian Farmers*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Railway-brightgreen?style=for-the-badge)](https://smart-farming-app-production.up.railway.app)
[![GitHub](https://img.shields.io/badge/GitHub-dhatchin676-black?style=for-the-badge&logo=github)](https://github.com/dhatchin676/smart-farming-app)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

<br/>

> **Niral Thiruvizha 3.0 Hackathon Project**  
> Anjalai Ammal Mahalingam Engineering College · College Code: 8204  
> Guide: Mr. R. Rama Rajesh, Asst. Prof. IT

<br/>

</div>

---

## 🌟 Overview

**SmartFarm AI** is a full-stack AI-powered agriculture platform designed specifically for Indian farmers. It combines real-time weather data, live market prices, AI-driven crop disease detection, soil analysis, and a multilingual community — all in one beautifully crafted platform.

Built for the **Niral Thiruvizha 3.0** hackathon, SmartFarm AI addresses the core challenges faced by Tamil Nadu farmers: unpredictable weather, fluctuating market prices, crop diseases, and lack of access to expert agricultural guidance.

---

## 🚀 Live Demo

| Link | Description |
|------|-------------|
| 🌐 [smart-farming-app-production.up.railway.app](https://smart-farming-app-production.up.railway.app) | Main Platform |
| 📊 [/market.html](https://smart-farming-app-production.up.railway.app/market.html) | Live Market Prices |
| 🌤 [/weather.html](https://smart-farming-app-production.up.railway.app/weather.html) | Weather Monitor |
| 👥 [/community.html](https://smart-farming-app-production.up.railway.app/community.html) | Farmer Community |
| 🔬 [/disease.html](https://smart-farming-app-production.up.railway.app/disease.html) | Disease Detection |
| 🌱 [/soil.html](https://smart-farming-app-production.up.railway.app/soil.html) | Soil Analysis |
| 🌾 [/harvest.html](https://smart-farming-app-production.up.railway.app/harvest.html) | Harvest Predictor |

---

## ✨ Features

### 🌤 Weather Intelligence
- Real-time weather data via **OpenWeatherMap API**
- 7-day forecast with animated SVG weather icons
- Smart irrigation scheduling based on live conditions
- Hyperlocal data for Tamil Nadu districts

### 📊 Live Market Prices
- **3-tier price system**: TN Agmarknet live → National state fallback → MSP 2025-26
- Real-time commodity prices from **data.gov.in Agmarknet API**
- 5-week trend charts for 8+ major crops
- Per-kg price display alongside quintal rates
- Live · National · MSP reference badges

### 🔬 AI Crop Disease Detection
- **Gemini Vision AI** — upload photo → instant disease diagnosis
- Detailed treatment plans with Tamil Nadu pesticide brand names
- Disease risk alerts based on weather conditions
- Supports 50+ crop diseases

### 🌱 Smart Soil Analysis
- AI-powered crop recommendations based on soil type & pH
- Fertiliser scheduling and dosage guidance
- Soil health improvement suggestions
- NPK ratio analysis

### 🌾 Harvest Prediction
- AI-driven harvest date prediction
- 4-stage growth progress tracker
- 7-day advance harvest alerts
- Per-crop calendar with sow date tracking

### 👥 Farmer Community (Reddit + Instagram + X style)
- Reddit-style upvote/downvote system
- Real-time member count & online status
- AI Community Pulse — analyses what farmers are discussing
- Private messaging between farmers
- User profiles with crops, bio, Instagram & social links
- `@AcqireAI` mention in comments for instant AI advice
- Top Farmers leaderboard updated live

### 🤖 AcqireAI Multilingual Chatbot
- Powered by **Groq (LLaMA)** with **Gemini** fallback
- Supports **10 Indian languages**: Tamil, Hindi, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Bengali, English
- Voice input (Web Speech API)
- Context-aware: remembers farmer name, crops, location
- Smart module redirects (links to relevant platform features)

### 🔐 Authentication System
- JWT-based secure authentication
- MongoDB user profiles with avatar upload (Cloudinary)
- Persistent login across sessions
- Profile editing: username, bio, location, social links

---

## 🏗 Tech Stack

### Frontend
| Technology | Usage |
|-----------|-------|
| HTML5 + CSS3 | Responsive dark-theme UI |
| Vanilla JavaScript | No framework — pure JS |
| Cormorant Garamond + Outfit | Typography |
| Unsplash CDN | High-quality farm imagery |
| Web Speech API | Voice input for chatbot |

### Backend
| Technology | Usage |
|-----------|-------|
| **Node.js + Express** | REST API server |
| **MongoDB Atlas + Mongoose** | User data, posts, comments |
| **Gemini 2.5 Flash** | AI responses + disease detection |
| **Groq (LLaMA 3)** | Fast chatbot responses |
| **Cloudinary** | Avatar & post image uploads |
| **JWT + bcryptjs** | Authentication |
| **Multer** | File upload handling |

### APIs Integrated
| API | Purpose |
|-----|---------|
| OpenWeatherMap | Live weather data |
| data.gov.in Agmarknet | Live crop market prices |
| Google Gemini Vision | Crop disease photo detection |
| Groq API | AI chatbot (3-key rotation) |
| Cloudinary | Image storage |

### Deployment
| Service | Usage |
|---------|-------|
| **Railway** | Full-stack deployment |
| **MongoDB Atlas** | Cloud database |
| **GitHub** | Version control + CI/CD |

---

## 📁 Project Structure

```
smart-farming-app/
├── frontend/                  # Static HTML/CSS/JS
│   ├── index.html             # Landing page
│   ├── intro.html             # Welcome / auth gate
│   ├── weather.html           # Weather module
│   ├── soil.html              # Soil analysis
│   ├── disease.html           # Disease detection
│   ├── market.html            # Market prices
│   ├── harvest.html           # Harvest predictor
│   ├── community.html         # Farmer community
│   ├── login.html             # Authentication
│   ├── signup.html            # Registration
│   ├── css/
│   │   └── style.css          # Global styles
│   ├── js/
│   │   ├── smartfarm.js       # Core JS utilities
│   │   └── script.js          # Page scripts
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
│
├── backend/                   # Node.js + Express
│   ├── server.js              # Main server entry
│   ├── config/
│   │   └── db.js              # Database config
│   ├── routes/
│   │   ├── auth.js            # Login / signup
│   │   ├── weather.js         # Weather API
│   │   ├── soil.js            # Soil analysis
│   │   ├── disease.js         # Disease detection
│   │   ├── market.js          # Market prices
│   │   ├── harvest.js         # Harvest prediction
│   │   ├── harvest_ai.js      # AI harvest suggestions
│   │   ├── community.js       # Community posts/comments
│   │   ├── profile.js         # User profiles
│   │   ├── chat.js            # AcqireAI chatbot
│   │   └── schemes.js         # Govt schemes
│   ├── controllers/
│   │   ├── harvestController.js
│   │   ├── marketController.js
│   │   ├── soilController.js
│   │   ├── weatherController.js
│   │   └── diseaseController.js
│   ├── utils/
│   │   └── geminiKeyManager.js # Multi-key AI rotation
│   └── package.json
│
├── nixpacks.toml              # Railway build config
├── railway.json               # Railway deploy config
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- API keys (see Environment Variables)

### Installation

```bash
# Clone the repository
git clone https://github.com/dhatchin676/smart-farming-app.git
cd smart-farming-app

# Install backend dependencies
cd backend
npm install

# Create environment file
cp .env.example .env
# Fill in your API keys in .env

# Start the server
npm start
```

### Environment Variables

Create `backend/.env`:

```env
# Database
MONGO_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your_jwt_secret

# AI APIs
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY_1=your_groq_key_1
GROQ_API_KEY_2=your_groq_key_2
GROQ_API_KEY_3=your_groq_key_3

# Weather
OPENWEATHER_API_KEY=your_openweather_key

# Market Data
DATA_GOV_API_KEY=your_datagov_key

# Image Upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Server
PORT=5000
NODE_ENV=development
```

### Running Locally

```bash
cd backend
npm start
# Open http://localhost:5000
```

---

## 🚀 Deployment (Railway)

This project is configured for **one-click Railway deployment**:

1. Fork this repository
2. Connect to [Railway](https://railway.app)
3. Add environment variables in Railway dashboard
4. Deploy — Railway auto-detects `nixpacks.toml`

The `nixpacks.toml` handles:
- Installing Node.js 20
- Running `npm install` in `backend/`
- Starting with `node server.js`

---

## 📸 Screenshots

| Module | Description |
|--------|-------------|
| 🏠 Landing | Cinematic hero with live weather stats |
| 📊 Market | Live Agmarknet prices with trend charts |
| 🌤 Weather | Animated SVG icons + 7-day forecast |
| 🔬 Disease | Gemini Vision photo analysis |
| 👥 Community | Reddit-style feed with AI pulse |
| 🤖 AcqireAI | Multilingual voice chatbot |

---

## 👥 Team

| Name | Role |
|------|------|
| **Dhatchineswaran D** | Full Stack Development, AI Integration |
| **Kalaiselvi M** | Frontend Development, UI/UX |
| **Akalya R** | Backend Development, API Integration |
| **Asika M** | Database Design, Testing |

**Guide:** Mr. R. Rama Rajesh, Assistant Professor, Department of IT  
**Institution:** Anjalai Ammal Mahalingam Engineering College (Code: 8204)  
**Event:** Niral Thiruvizha 3.0 Hackathon

---

## 🏆 Hackathon

This project was built for **Niral Thiruvizha 3.0**, a national-level hackathon focused on innovative technology solutions for real-world problems.

**Problem Statement:** Bridging the technology gap for Indian farmers by providing AI-powered agricultural intelligence in regional languages.

**Solution:** A comprehensive, multilingual, AI-first platform that gives every Indian farmer access to the same quality of agricultural intelligence as large agri-businesses — completely free.

---

## 📄 License

MIT License — feel free to use, modify and distribute.

---

<div align="center">

**Built with ❤️ for Indian Farmers**

*SmartFarm AI — Niral Thiruvizha 3.0 · 2025*

[![Live Demo](https://img.shields.io/badge/🌾_Try_It_Live-Click_Here-brightgreen?style=for-the-badge)](https://smart-farming-app-production.up.railway.app)

</div>