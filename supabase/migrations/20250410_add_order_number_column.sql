
-- Add shopify_order_number column to shopify_orders table
ALTER TABLE public.shopify_orders ADD COLUMN shopify_order_number text;

-- Add shopify_order_number column to shopify_archived_orders table
ALTER TABLE public.shopify_archived_orders ADD COLUMN shopify_order_number text;
