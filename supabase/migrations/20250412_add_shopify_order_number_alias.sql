
-- Add a function to get shopify_order_number as an alias for shopify_order_id
CREATE OR REPLACE FUNCTION public.get_shopify_order_number(order_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN order_id;
END;
$$;
