import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import nodeRoutes from './routes/nodes.js';
import dashboardRoutes from './routes/dashboard.js';
import trashRoutes from './routes/trash.js';

const app = express();

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173',
  credentials: true,
}));

// ── Parsing Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ──
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limiting ──
app.use('/api', apiLimiter);

// ── Routes (will be added in Phase 2+) ──
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trash', trashRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', environment: env.NODE_ENV });
});

// ── 404 Handler ──
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Error Handler ──
app.use(errorHandler);

export default app;
