import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config';
import { connectDB } from './server/config/db';
import { errorHandler } from './server/middleware/error.middleware';

// Routes
import authRoutes from './server/routes/auth.routes';
import experienceRoutes from './server/routes/experience.routes';
import moduleRoutes from './server/routes/module.routes';
import contributorRoutes from './server/routes/contributor.routes';
import recipientRoutes from './server/routes/recipient.routes';
import aiRoutes from './server/routes/ai.routes';
import mediaRoutes from './server/routes/media.routes';
import analyticsRoutes from './server/routes/analytics.routes';

const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

  res.json({
    status: dbState === 'connected' ? 'ok' : 'degraded',
    database: dbState,
    environment: config.nodeEnv,
    time: new Date().toISOString(),
  });
});

// Network info - provides local network IP & public URL for devices
app.get('/api/network-info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ip: '127.0.0.1',
      allIps: ['127.0.0.1'],
      publicUrl: config.clientUrl && !config.clientUrl.includes('localhost') ? config.clientUrl : null,
      lanPort: config.port,
      frontendPort: 5173,
    },
  });
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/public', recipientRoutes);
app.use('/api/recipient', recipientRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/experiences', moduleRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api', contributorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);

// Centralized error handling middleware
app.use(errorHandler);

// Vite Frontend Integration
async function startServer() {
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (err: any) {
    console.error('Failed to initialize MongoDB connection on startup:', err.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[DearYou] Production-grade server running on http://0.0.0.0:${config.port}`);
  });
}

startServer();

export { app };
