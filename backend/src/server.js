const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const { connectToDatabase } = require('./utils/db');

const queryRoutes = require('./routes/query');
const infoRoutes = require('./routes/info');
const officerRoutes = require('./routes/officer');
const { initChatSockets } = require('./sockets/chat');
const { setIo } = require('./utils/io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Debug endpoint for plant disease service
app.get('/api/debug/disease', async (req, res) => {
  try {
    const plantDiseaseService = require('./services/plantDiseaseService');
    
    // Use a small test image (1x1 pixel PNG)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImage.replace('data:image/png;base64,', ''), 'base64');
    
    const result = await plantDiseaseService.identifyDisease(buffer);
    
    res.json({
      status: 'ok',
      hfToken: process.env.HF_TOKEN ? 'configured' : 'missing',
      result
    });
  } catch (error) {
    res.json({
      status: 'error',
      error: error.message,
      hfToken: process.env.HF_TOKEN ? 'configured' : 'missing'
    });
  }
});

// Routes
app.use('/api/query', queryRoutes);
app.use('/api', infoRoutes);
app.use('/api/officer', officerRoutes);

// Socket.io
initChatSockets(io);
setIo(io);

// Start
const PORT = process.env.PORT || 3001;
connectToDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Backend listening on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🤖 AI test: http://localhost:${PORT}/api/query/test-ai`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database', err);
    process.exit(1);
  });


