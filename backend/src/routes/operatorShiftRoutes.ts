import { Router } from 'express';
import { OperatorShiftController } from '../controllers/OperatorShiftController';

const router = Router();
const controller = new OperatorShiftController();

router.get('/', controller.getShifts);
router.get('/current', controller.getCurrentShift);
router.post('/start', controller.startShift);
router.post('/:id/end', controller.endShift);
router.put('/:id', controller.updateShift);

export default router; 