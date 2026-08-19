import { Router } from 'express';
import { LeaveTypeController } from '../controllers/leaveTypeController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', LeaveTypeController.getAll);
router.post('/', authorizeRoles('ADMIN', 'HR'), LeaveTypeController.create);
router.put('/:id', authorizeRoles('ADMIN', 'HR'), LeaveTypeController.update);
router.delete('/:id', authorizeRoles('ADMIN', 'HR'), LeaveTypeController.delete);

export default router;
