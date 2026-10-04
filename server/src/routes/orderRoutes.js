import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate, createOrderSchema } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .post(validate(createOrderSchema), createOrder)
  .get(adminOnly, getAllOrders);
router.get('/mine', getMyOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', adminOnly, updateOrderStatus);

export default router;
