
-- Update get_archived_shopify_orders function to include shopify_order_number
CREATE OR REPLACE FUNCTION public.get_archived_shopify_orders(limit_count integer)
 RETURNS SETOF shopify_archived_orders
 LANGUAGE sql
AS $function$
  SELECT * FROM shopify_archived_orders
  ORDER BY archived_at DESC
  LIMIT limit_count;
$function$;
