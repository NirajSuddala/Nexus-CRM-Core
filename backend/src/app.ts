import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { connectDatabase, syncDatabase, isDatabaseConnected } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';
import { initSocket } from './socket';
import './models'; // Initialize models and associations

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Try to connect to database (non-blocking)
    await connectDatabase();

    // Try to connect to Redis (non-blocking)
    await connectRedis();

    // Sync database if connected
    await syncDatabase();

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${isDatabaseConnected ? 'Connected' : 'Not connected (demo mode)'}`);
      console.log(`\n💡 To connect database, create a .env file with your PostgreSQL credentials\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
