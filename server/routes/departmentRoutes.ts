import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', DepartmentController.getAll);
router.post('/', authorizeRoles('ADMIN', 'HR'), DepartmentController.create);
router.put('/:id', authorizeRoles('ADMIN', 'HR'), DepartmentController.update);
router.delete('/:id', authorizeRoles('ADMIN', 'HR'), DepartmentController.delete);

export default router;
