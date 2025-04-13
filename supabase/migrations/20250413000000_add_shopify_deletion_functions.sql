
-- Add SQL functions to handle deletion of Shopify data
-- These provide a more reliable way to delete data when the standard delete operations fail

-- Function to delete all shopify order items
CREATE OR REPLACE FUNCTION delete_all_shopify_order_items()
RETURNS void AS $$
BEGIN
  DELETE FROM shopify_order_items WHERE order_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all shopify orders
CREATE OR REPLACE FUNCTION delete_all_shopify_orders()
RETURNS void AS $$
BEGIN
  DELETE FROM shopify_orders WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION delete_all_shopify_order_items() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_all_shopify_orders() TO authenticated;
