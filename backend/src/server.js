const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectToDatabase } = require('./utils/db');

const queryRoutes = require('./routes/query');
const infoRoutes = require('./routes/info');
const officerRoutes = require('./routes/officer');
const krishiSevaKendraRoutes = require('./routes/krishiSevaKendra');
const cropPricesRoutes = require('./routes/cropPrices');
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

// Root endpoint for Render
app.get('/', (req, res) => {
  res.json({ 
    message: 'AgriSense Backend API is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/query', queryRoutes);
app.use('/api', infoRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/krishi-seva-kendra', krishiSevaKendraRoutes);
app.use('/api/crop-prices', cropPricesRoutes);

// Socket.io
initChatSockets(io);
setIo(io);

// Start server - MongoDB Atlas ready
const PORT = process.env.PORT || 3001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

async function startServer() {
  try {
    // Connect to MongoDB Atlas
    await connectToDatabase();
    console.log('✅ Connected to MongoDB Atlas');
    
    // Start the server
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Backend listening on ${HOST}:${PORT}`);
      console.log(`🌐 Health check: http://${HOST}:${PORT}/api/health`);
      console.log(`🤖 AI test: http://${HOST}:${PORT}/api/query/test-ai`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: MongoDB Atlas`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ MongoDB Atlas connection failed');
    
    // In production, still start server but log the error
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Starting server without database in production mode');
      server.listen(PORT, HOST, () => {
        console.log(`🚀 Backend listening on ${HOST}:${PORT} (DB connection failed)`);
      });
    } else {
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();


