import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes';
import employeeRoutes from './server/routes/employeeRoutes';
import departmentRoutes from './server/routes/departmentRoutes';
import leaveTypeRoutes from './server/routes/leaveTypeRoutes';
import leaveRoutes from './server/routes/leaveRoutes';
import leaveBalanceRoutes from './server/routes/leaveBalanceRoutes';
import holidayRoutes from './server/routes/holidayRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import reportRoutes from './server/routes/reportRoutes';
import { settingsRouter, auditRouter } from './server/routes/settingsRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Body Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static Uploads Folder
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'LeaveEase Backend API', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/leave-types', leaveTypeRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/leave-balances', leaveBalanceRoutes);
  app.use('/api/holidays', holidayRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/settings', settingsRouter);
  app.use('/api/audit-logs', auditRouter);

  // Vite middleware for development vs static production serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeaveEase server running on port ${PORT}`);
  });
}

startServer();
