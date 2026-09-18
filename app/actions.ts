'use server';

import { createClient } from '../utils/supabase/server';
import type { Order, ProductRequest, StoreSettings } from '../src/store/useAppStore';
import type { Product } from '../src/store/useCartStore';
import { productSchema, createOrderSchema, productRequestSchema } from './validations';

export async function addProductAction(product: Omit<Product, 'id'>) {
  const parsed = productSchema.parse(product);
  const supabase = await createClient();
  const { error } = await supabase.from('products').insert([parsed]);
  if (error) throw error;
}

export async function updateProductAction(product: Product) {
  const parsed = productSchema.parse(product);
  const supabase = await createClient();
  const { error } = await supabase.from('products').update(parsed).eq('id', product.id);
  if (error) throw error;
}

export async function deleteProductAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function updateStoreSettingsAction(settings: StoreSettings) {
  const supabase = await createClient();
  const { error } = await supabase.from('settings').upsert({ id: 'general', ...settings });
  if (error) throw error;
}

export async function getAllOrdersAction(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function getUserOrdersAction(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('orders').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatusAction(orderId: string, status: Order['status']) {
  const supabase = await createClient();
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export async function cancelOrderAction(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
  if (error) throw error;
}

export async function getAllProductRequestsAction(): Promise<ProductRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('product_requests').select('*').order('createdAt', { ascending: false });
  if (error) throw error;
  return data as ProductRequest[];
}

export async function createProductRequestAction(request: Omit<ProductRequest, 'id'>) {
  const parsed = productRequestSchema.parse(request);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = user ? { ...parsed, userId: user.id } : parsed;
  const { error } = await supabase.from('product_requests').insert([payload]);
  if (error) throw error;
}

export async function createOrderAction(order: any) {
  const parsed = createOrderSchema.parse(order);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_order', {
    order_name: parsed.name,
    order_phone: parsed.phone,
    order_address: parsed.address,
    order_notes: parsed.notes,
    order_items: parsed.items
  });
  if (error) throw error;
  return data;
}
