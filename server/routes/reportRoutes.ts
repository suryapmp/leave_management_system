import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/summary', ReportController.getSummary);
router.get('/department', ReportController.getDepartmentReport);
router.get('/leave-summary', ReportController.getLeaveSummary);

export default router;
