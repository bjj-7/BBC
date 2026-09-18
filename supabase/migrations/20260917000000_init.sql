-- Supabase Schema for BBC Store

-- 1. Tables

CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  subcategory text,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  description text,
  "imageUrl" text CHECK (
    ("imageUrl" IS NULL) OR 
    ("imageUrl" ~ '^data:image/(jpeg|png|gif|webp);base64,' AND length("imageUrl") < 10000000)
  )
);

CREATE TABLE settings (
  id text PRIMARY KEY, -- We'll use 'general' as the ID
  "heroSubtitle" text,
  "offersTitle" text,
  "offersDiscount" text,
  "offersDesc" text,
  "bestsellerIds" text[] DEFAULT '{}',
  "bestsellersTitle" text,
  "bestsellersSubtitle" text,
  "featuredIds" text[] DEFAULT '{}',
  "featuredTitle" text,
  "featuredSubtitle" text,
  "exploreCategories" jsonb DEFAULT '[]',
  "exploreTitle" text,
  "exploreSubtitle" text,
  "sectionLayout" jsonb DEFAULT '[]',
  "managedCategories" text[] DEFAULT '{}',
  "managedSubcategories" text[] DEFAULT '{}',
  "categoryMapping" jsonb DEFAULT '{}'
);

CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "invoiceNumber" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES auth.users(id),
  email text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  notes text,
  items jsonb NOT NULL,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_requests (
  id text PRIMARY KEY, -- {userId}_{productId}
  "productId" text NOT NULL,
  "productName" text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  "userId" uuid NOT NULL REFERENCES auth.users(id),
  email text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- 2. Admin Check Function
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') IN (
    'bbc.savoye@gmail.com',
    'v.jonathanwilliamusa@gmail.com',
    'w.vivekan@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Row Level Security (RLS)

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin write products" ON products FOR ALL USING (is_admin());

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin write settings" ON settings FOR ALL USING (is_admin());

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins read all orders" ON orders FOR SELECT USING (is_admin());
-- Users can only update their own shipped orders to complete
CREATE POLICY "Users update own shipped orders" ON orders FOR UPDATE USING (
  auth.uid() = "userId" AND status = 'shipped'
) WITH CHECK (
  auth.uid() = "userId" AND status = 'complete'
);
CREATE POLICY "Admins update all orders" ON orders FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete orders" ON orders FOR DELETE USING (is_admin());
-- Note: Order creation is handled via RPC, so no insert policy for clients.

ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own requests" ON product_requests FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins read all requests" ON product_requests FOR SELECT USING (is_admin());
CREATE POLICY "Users insert own requests" ON product_requests FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users update own requests" ON product_requests FOR UPDATE USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins delete requests" ON product_requests FOR DELETE USING (is_admin());

-- 4. Order Creation RPC
CREATE OR REPLACE FUNCTION create_order(
  order_name text,
  order_phone text,
  order_address text,
  order_notes text,
  order_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_total numeric := 0;
  v_item jsonb;
  v_product record;
  v_item_id text;
  v_item_qty integer;
  v_invoice text;
  v_order_id uuid;
BEGIN
  IF length(order_name) > 100 OR length(order_phone) > 50 OR length(order_address) > 1000 OR length(COALESCE(order_notes, '')) > 2000 THEN
    RAISE EXCEPTION 'Input exceeds maximum allowed length';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_email := auth.jwt() ->> 'email';

  IF jsonb_array_length(order_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain items';
  END IF;

  -- Iterate items, lock rows, verify stock, calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    v_item_id := v_item->>'id';
    v_item_qty := (v_item->>'quantity')::integer;

    IF v_item_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;

    -- Lock the product row (assuming product IDs from Firestore are text, not UUIDs, wait! 
    -- If we migrate from Firestore, product IDs will be text, so I should change products.id to text in the schema if we preserve IDs).
    -- Wait, let me adjust the schema above to use text for IDs so it matches Firestore data.
    
    SELECT * INTO v_product FROM products WHERE id = v_item_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item_id;
    END IF;

    IF v_product.stock < v_item_qty THEN
      RAISE EXCEPTION 'Out of stock: %', v_product.name;
    END IF;

    v_total := v_total + (v_product.price * v_item_qty);

    UPDATE products SET stock = stock - v_item_qty WHERE id = v_item_id;
  END LOOP;

  -- Generate invoice number
  v_invoice := 'INV-' || upper(substring(md5(random()::text) from 1 for 6));
  
  v_order_id := gen_random_uuid();

  INSERT INTO orders (id, "invoiceNumber", "userId", email, name, phone, address, notes, items, total, status)
  VALUES (v_order_id, v_invoice, v_user_id, v_email, order_name, order_phone, order_address, order_notes, order_items, v_total, 'pending');

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
