Farmer's Assistant - Full Stack

Monorepo with backend (Express + MongoDB + Socket.io) and frontend (React + Vite).

Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

Setup
1. Backend
   - cd backend
   - Create .env from the sample below:
```
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/farmers_assistant
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change_me
```
   - npm install
   - npm run dev

2. Frontend
   - cd frontend
   - Create .env:
```
VITE_BACKEND_URL=http://localhost:8080
```
   - npm install
   - npm run dev

API Endpoints
- POST /api/query
- GET /api/response/:id
- GET /api/weather/:location
- GET /api/market/:crop
- GET /api/schemes
- POST /api/officer/validate
- GET /api/officer/queries (JWT required)

Local LLM Integration
- Replace aiService.runLocalLLM with an adapter to GPT4All or Mistral local model
- Add model files and bindings as needed; ensure responses are streamed or polled

Deployment
- Frontend: Netlify (netlify.toml) or Vercel (vercel.json)
- Backend: Dockerfile provided; deploy to Railway/Render


