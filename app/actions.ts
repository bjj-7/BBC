'use server';

import { createClient } from '../utils/supabase/server';
import type { Order, ProductRequest, StoreSettings } from '../src/store/useAppStore';
import type { Product } from '../src/store/useCartStore';
import { productSchema, createOrderSchema, productRequestSchema } from './validations';

export async function addProductAction(product: Omit<Product, 'id'>) {
  const parsed = productSchema.parse(product);
  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from('products').insert([{ ...parsed, id }]);
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

  try {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Update the email in the DB to match the one provided in the checkout form
    await adminSupabase.from('orders').update({ email: parsed.email }).eq('id', data);

    const { sendInvoiceEmail } = await import('../utils/email');
    const { data: newOrder } = await adminSupabase.from('orders').select('*').eq('id', data).single();
    if (newOrder) {
      // Ensure numeric types are formatted correctly to avoid toFixed errors
      await sendInvoiceEmail(newOrder);
    }
  } catch (emailError) {
    console.error('Failed to send invoice email:', emailError);
  }

  return data;
}

export async function updateUserAddressesAction(addresses: any[]) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');
  
  const { error } = await supabase.auth.updateUser({
    data: { savedAddresses: addresses }
  });
  if (error) throw error;
}
