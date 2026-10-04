import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import {
  getProductReviews,
  createProductReview,
} from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.route('/').get(getProducts).post(protect, adminOnly, createProduct);
router
  .route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);
router
  .route('/:id')
  .get(getProduct)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;

