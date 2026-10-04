import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must not be negative'),
  category: z.enum(['electronics', 'fashion', 'home', 'books', 'sports', 'beauty'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  brand: z.string().optional(),
  image: z.string().optional(),
  stock: z.number().min(0, 'Stock must not be negative').optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().min(1, 'Product ID is required'),
        name: z.string().optional(),
        price: z.number().min(0, 'Price must not be negative'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    line1: z.string().trim().min(1, 'Address line 1 is required'),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    pincode: z.string().trim().min(1, 'Pincode is required'),
  }),
  paymentMethod: z.enum(['COD', 'ONLINE']).optional(),
});
