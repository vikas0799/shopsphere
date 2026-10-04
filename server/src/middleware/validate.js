import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || [];
    const errors = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }
  req.body = result.data;
  next();
};

// Auth schemas
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a non-negative number'),
  category: z.enum(['electronics', 'fashion', 'home', 'books', 'sports', 'beauty'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  brand: z.string().optional(),
  image: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  rating: z.coerce.number().min(0).max(5).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Order schema
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product: z.string().min(1, 'Product ID is required'),
      name: z.string().optional(),
      price: z.coerce.number().min(0).optional(),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    line1: z.string().trim().min(1, 'Address line 1 is required'),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    pincode: z.string().trim().min(1, 'Pincode is required'),
  }),
  paymentMethod: z.enum(['COD', 'ONLINE']).optional().default('COD'),
});
