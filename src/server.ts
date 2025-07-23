import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import prisma from './lib/prisma';
import { requestLogger, corsOptions } from './middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security and CORS middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with options
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use(requestLogger);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes - Mount all API routes under /api prefix
app.use('/api', routes);

// Health check endpoint for deployment platforms (legacy support)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ContactHub Identity Reconciliation',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ContactHub API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    frontend: req.get('host') ? `${req.protocol}://${req.get('host')}` : 'Available',
    timestamp: new Date().toISOString()
  });
});

// Legacy routes for backward compatibility
app.use('/identify', (req, res, next) => {
  req.url = '/api/contacts/identify';
  routes(req, res, next);
});

app.use('/contacts', (req, res, next) => {
  req.url = '/api/contacts';
  routes(req, res, next);
});

app.use('/stats', (req, res, next) => {
  req.url = '/api/contacts/stats';
  routes(req, res, next);
});

app.use('/hierarchy', (req, res, next) => {
  req.url = '/api/contacts/hierarchy';
  routes(req, res, next);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server gracefully...');
  
  try {
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server only if not in Vercel (production) environment
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      // Test database connection
      await prisma.$connect();
      console.log('Database connected successfully');

      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🌐 Frontend GUI: http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔍 Identify endpoint: http://localhost:${PORT}/identify`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
}

export default app;
