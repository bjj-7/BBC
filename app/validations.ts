import { z } from 'zod';

// Product Validation
export const productSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.string().max(50).nullable(),
  subcategory: z.string().max(50).nullable(),
  price: z.number().min(0).max(1000000),
  stock: z.number().int().min(0).max(100000),
  description: z.string().max(5000).nullable(),
  imageUrl: z.string()
    .max(10000000)
    .regex(/^data:image\/(jpeg|png|gif|webp);base64,/, "Invalid image format. Must be a base64 JPEG, PNG, GIF, or WEBP.")
    .nullable()
});

// Order Creation Validation
export const createOrderSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(50),
  address: z.string().min(1).max(1000),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(
    z.object({
      id: z.string().min(1),
      quantity: z.number().int().positive(),
      name: z.string().min(1),
      price: z.number().min(0),
      category: z.string().optional().nullable(),
      subcategory: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      image: z.string().optional().nullable()
    })
  ).min(1, "Order must contain at least one item")
});

// Product Request Validation
export const productRequestSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).max(150),
  quantity: z.number().int().min(1).max(100000),
  email: z.string().email().max(255)
});
