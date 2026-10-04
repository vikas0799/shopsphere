import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string('Name is required').trim().min(1, 'Name is required'),
  email: z.email('Enter a valid email address'),
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string('Password is required').min(1, 'Password is required'),
});

export const productSchema = z.object({
  name: z.string('Name is required').trim().min(1, 'Name is required'),
  description: z.string('Description is required').trim().min(1, 'Description is required'),
  price: z.number('Price must be a number').min(0, 'Price cannot be negative'),
  category: z.enum(
    ['electronics', 'fashion', 'home', 'books', 'sports', 'beauty'],
    'Category must be electronics, fashion, home, books, sports or beauty'
  ),
  stock: z
    .number('Stock must be a number')
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .optional(),
  brand: z.string('Brand must be text').optional(),
  image: z.string('Image must be text').optional(),
});

export const updateProductSchema = productSchema.partial();

const orderItemSchema = z.object({
  product: z.string('Product id is required'),
  quantity: z
    .number('Quantity must be a number')
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema, 'Items must be a list').min(1, 'Order must contain at least one item'),
  shippingAddress: z.object(
    {
      line1: z.string('Address line is required').trim().min(1, 'Address line is required'),
      city: z.string('City is required').trim().min(1, 'City is required'),
      state: z.string('State is required').trim().min(1, 'State is required'),
      pincode: z.string('Pincode is required').trim().min(1, 'Pincode is required'),
    },
    'Shipping address is required'
  ),
  paymentMethod: z.enum(['COD', 'ONLINE'], 'Payment method must be COD or ONLINE').optional(),
});
