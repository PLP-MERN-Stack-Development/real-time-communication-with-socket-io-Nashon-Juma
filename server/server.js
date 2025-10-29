import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import configurations
import corsConfig from './config/cors.js';
import connectDB from './config/database.js';
import socketConfig from './config/socket.js';

// Import routes
import apiRoutes from './routes/index.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter, devLimiter } from './middleware/rateLimiter.js';

// Import socket handlers
import { setupSocketHandlers } from './socket/index.js';
import socketAuth from './socket/middleware/authSocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, socketConfig);

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));

// Apply rate limiting based on environment
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
} else {
  app.use('/api/', devLimiter);
}

// CORS configuration - MUST come before routes
app.use(cors(corsConfig));

// Handle preflight requests
app.options('*', cors(corsConfig));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Socket.io middleware
io.use(socketAuth);

// Setup socket handlers
setupSocketHandlers(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoint to verify CORS
app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    timestamp: new Date().toISOString()
  });
});

// Serve client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Ongea server running on port ${PORT}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS enabled for: ${process.env.CLIENT_URL}`);
});

export { app, io, server };
