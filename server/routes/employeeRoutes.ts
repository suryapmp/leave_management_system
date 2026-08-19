import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', EmployeeController.getAll);
router.get('/team', EmployeeController.getTeamMembers);
router.get('/:id', EmployeeController.getById);

// Admin & HR management
router.post('/', authorizeRoles('ADMIN', 'HR'), EmployeeController.create);
router.put('/:id', authorizeRoles('ADMIN', 'HR'), EmployeeController.update);
router.post('/:id/reset-password', authorizeRoles('ADMIN', 'HR'), EmployeeController.resetPassword);

export default router;
