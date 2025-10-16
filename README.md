
<h1 align="center">🌾 AgriSense — AI-Powered Agricultural Assistant</h1>

<p align="center">
  Transforming traditional farming through AI-driven insights, real-time weather data, and intelligent crop management — built for Kerala’s agricultural community.  
  <br />
  <a href="https://agri-sense-n1mk.vercel.app/">🔗 Live Demo</a> • 
  <a href="https://www.youtube.com/watch?v=O3lHWmaTgiE">📚 Demo Video</a> • 
</p>

---

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18.0+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-4.0+-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
</p>

---

## 🚀 Overview
**AgriSense** is an AI-powered agricultural platform designed to empower farmers with intelligent recommendations, hyperlocal weather insights, and smart crop management.  
It supports **Malayalam** and **English**, offers real-time AI chat,Plant Diesase detection with solution and provides an integrated dashboard for agricultural officers.

---

## ✨ Key Highlights

### 🤖 AI Chat Assistant
- Context-aware conversations for personalized farming help  
- Real-time communication via **Socket.io**  
- **Speech-to-text** for hands-free use  
- Malayalam and English support  

### 🌿 Plant Disease Detection
- **AI vision** model to detect and identify plant diseases  
- Camera / image upload integration  
- Remedies and prevention tips customized for Kerala crops  

### 🌤️ Smart Weather Intelligence
- **District-wise weather** forecasts across Kerala  
- AI-generated agricultural advice based on weather impact  
- Seasonal planting and irrigation planning suggestions  

### 🧑‍💼 Officer Dashboard
- Manage and track farmer queries  
- Real-time communication with users  
- Role-based access and analytics  

### 🗺️ Location Intelligence
- **GPS-based recommendations**  
- Soil health & crop suitability analysis  
- Built-in support for all 14 Kerala districts  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB Atlas |
| **AI & APIs** | Hugging Face, Google Gemini 2.0 Flash, OpenWeatherMap |
| **Tools** | Vite, Postman, GitHub Actions |


## ⚡ Quick Start

### 🔧 Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key
- OpenWeatherMap API key
- Hugging Face API Key

<details>
<summary><b>📦 Installation & Setup</b></summary>

#### Clone the Repository
```bash
git clone https://github.com/ArushRastogi47/AgriSense.git
cd AgriSense
````

#### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Add your keys (MONGODB_URI, GEMINI_API_KEY, OPENWEATHER_API_KEY)
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Add your VITE_BACKEND_URL
npm run dev
```

#### Access the App

* Frontend → [http://localhost:5173](http://localhost:5173)
* Backend → [http://localhost:3001](http://localhost:3001)
* Officer Dashboard → via Shield icon in the navbar

</details>

---

## 🌍 Environment Variables

### 🔹 Backend `.env`

```env
PORT=3001
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_weather_key
HF_TOKEN=your_Hugging_Face_API_Token
```

### 🔹 Frontend `.env`

```env
VITE_BACKEND_URL=http://localhost:3001
```

---

## 💬 Core Functionalities

### 🤖 AI Chat System

* Smart contextual understanding
* Multilingual chat
* Offline fallback response system
* Image-based question support

### 🌾 Agricultural Intelligence

* Crop management and fertilizer suggestions
* Pest control (organic & IPM)
* Water & soil health analysis

### 🗣️ Multilingual Experience

* Full **Malayalam** UI and voice commands
* Region-specific crop insights

---

## 🤝 Contributing

We ❤️ open-source contributions!

### Steps

1. Fork this repository
2. Create your feature branch

   ```bash
   git checkout -b feature/new-feature
   ```
3. Commit your changes

   ```bash
   git commit -m "Add new feature"
   ```
4. Push to your fork and open a PR

### Contribution Ideas

* 🌱 Crop modules for new regions
* 🔬 Advanced AI model integration
* 📊 Data visualization dashboards
* 🌐 New languages (Tamil, Hindi, etc.)
* 🎨 UI/UX improvements

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

* **Kerala Agricultural University** – domain expertise
* **Google Gemini AI** – for conversational intelligence
* **OpenWeatherMap** – reliable weather data
* **MongoDB Atlas** – database hosting
* **shadcn/ui** – elegant component library

---
## 📞 Contact & Support

* 💼 **Connect with Me on LinkedIn:** [![LinkedIn](https://img.shields.io/badge/LinkedIn-Arush%20Rastogi-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/arushrastogi47)

* 🧑‍💻 **GitHub Profile:** [Arush Rastogi](https://github.com/ArushRastogi47)

* 💼 **Connect with Abhay on LinkedIn:** [![LinkedIn](https://img.shields.io/badge/LinkedIn-Abhay%20Choudhary-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/abhay-choudhary-baa813193?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)

* 🧑‍💻 **GitHub Profile:** [Abhay Choudhary](https://github.com/Abhay12ch) 


---

<p align="center">
  Built with ❤️ and ☕ by <b>Arush Rastogi & Abhay Choudhary</b><br/>

</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/ArushRastogi47/AgriSense?style=for-the-badge" />
  <img src="https://img.shields.io/github/forks/ArushRastogi47/AgriSense?style=for-the-badge" />
  <img src="https://img.shields.io/github/issues/ArushRastogi47/AgriSense?style=for-the-badge" />
  <img src="https://img.shields.io/github/license/ArushRastogi47/AgriSense?style=for-the-badge" />
</p>


