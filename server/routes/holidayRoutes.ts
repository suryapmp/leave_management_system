import { Router } from 'express';
import { HolidayController } from '../controllers/holidayController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', HolidayController.getAll);
router.post('/', authorizeRoles('ADMIN', 'HR'), HolidayController.create);
router.put('/:id', authorizeRoles('ADMIN', 'HR'), HolidayController.update);
router.delete('/:id', authorizeRoles('ADMIN', 'HR'), HolidayController.delete);

export default router;
