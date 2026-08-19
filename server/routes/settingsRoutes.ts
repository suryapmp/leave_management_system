import { Router, Response } from 'express';
import { SettingsController } from '../controllers/notificationController';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export const settingsRouter = Router();
settingsRouter.use(authenticateToken);
settingsRouter.get('/', SettingsController.getAll);
settingsRouter.post('/', authorizeRoles('ADMIN', 'HR'), SettingsController.update);

export const auditRouter = Router();
auditRouter.use(authenticateToken, authorizeRoles('ADMIN', 'HR'));
auditRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const module = req.query.module ? String(req.query.module) : undefined;
    const user = req.query.user ? String(req.query.user) : undefined;

    const result = AuditService.getLogs(limit, offset, module, user);
    return res.json({ success: true, data: result.logs, total: result.total });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
