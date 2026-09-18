-- 1. Replace the create_order function with input validation
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

  FOR v_item IN SELECT * FROM jsonb_array_elements(order_items)
  LOOP
    v_item_id := v_item->>'id';
    v_item_qty := (v_item->>'quantity')::integer;

    IF v_item_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    
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

  v_invoice := 'INV-' || upper(substring(md5(random()::text) from 1 for 6));
  
  v_order_id := gen_random_uuid();

  INSERT INTO orders (id, "invoiceNumber", "userId", email, name, phone, address, notes, items, total, status)
  VALUES (v_order_id, v_invoice, v_user_id, v_email, order_name, order_phone, order_address, order_notes, order_items, v_total, 'pending');

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the existing check constraint on products if possible, and add the new one.
-- First we need to find the name of the existing constraint. In Postgres, if it was named automatically, it might be products_imageUrl_check.
-- Let's just drop the column and add it again? No, data loss!
-- Let's drop the generic check constraint.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'products'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%length(%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE products
ADD CONSTRAINT products_imageurl_check CHECK (
  ("imageUrl" IS NULL) OR 
  ("imageUrl" ~ '^data:image/(jpeg|png|gif|webp);base64,' AND length("imageUrl") < 10000000)
);
