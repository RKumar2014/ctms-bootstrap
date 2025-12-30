// backend/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import drugUnitRoutes from './routes/drugUnit.routes.js';
import siteRoutes from './routes/site.routes.js';
import accountabilityRoutes from './routes/accountability.routes.js';
import drugRoutes from './routes/drug.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/drug-units', drugUnitRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/accountability', accountabilityRoutes);
app.use('/api/drug', drugRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CTMS Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});