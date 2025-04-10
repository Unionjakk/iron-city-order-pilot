
-- Add a function to get shopify_order_number as an alias for shopify_order_id
CREATE OR REPLACE FUNCTION public.get_shopify_order_number(order_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Just return the order_id as the order_number for now
  -- This can be updated later if needed to extract a specific format
  RETURN order_id;
END;
$$;
