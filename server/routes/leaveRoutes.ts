import { Router } from 'express';
import { LeaveController } from '../controllers/leaveController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);

router.post('/calculate-days', LeaveController.calculatePreview);
router.get('/', LeaveController.getAll);
router.get('/:id', LeaveController.getById);
router.post('/', upload.single('documentFile'), LeaveController.apply);

// Approval actions
router.post('/:id/approve', authorizeRoles('ADMIN', 'HR', 'MANAGER'), LeaveController.approve);
router.post('/:id/reject', authorizeRoles('ADMIN', 'HR', 'MANAGER'), LeaveController.reject);
router.post('/:id/cancel', LeaveController.cancel);

export default router;
