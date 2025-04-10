
-- Add a function to get shopify_order_number as an alias for shopify_order_id
CREATE OR REPLACE FUNCTION public.get_shopify_order_number(order_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If order_id is null, return null to avoid errors
  IF order_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Just return the order_id as the order_number
  RETURN order_id;
END;
$$;
