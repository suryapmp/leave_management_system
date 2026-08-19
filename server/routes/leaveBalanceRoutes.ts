import { Router } from 'express';
import { LeaveBalanceController } from '../controllers/leaveBalanceController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', LeaveBalanceController.getAll);
router.get('/:employeeId', LeaveBalanceController.getByEmployee);
router.post('/adjust', authorizeRoles('ADMIN', 'HR'), LeaveBalanceController.adjust);

export default router;
