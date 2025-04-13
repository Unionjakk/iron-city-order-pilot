
-- Update the upsert_shopify_setting function to be more robust
-- and handle errors more gracefully
CREATE OR REPLACE FUNCTION public.upsert_shopify_setting(
  setting_name_param text,
  setting_value_param text
) RETURNS text AS $$
DECLARE
  result_message text;
BEGIN
  -- Use a transaction for consistency
  BEGIN
    -- Try to update an existing setting
    UPDATE public.shopify_settings
    SET setting_value = setting_value_param,
        updated_at = now()
    WHERE setting_name = setting_name_param;
    
    -- If no rows were updated, we need to insert a new setting
    IF NOT FOUND THEN
      INSERT INTO public.shopify_settings(setting_name, setting_value)
      VALUES (setting_name_param, setting_value_param);
      result_message := 'inserted';
    ELSE
      result_message := 'updated';
    END IF;
    
    RETURN result_message;
  EXCEPTION WHEN OTHERS THEN
    -- Provide detailed error information
    result_message := 'error: ' || SQLERRM;
    RETURN result_message;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure permissions are correct
GRANT EXECUTE ON FUNCTION public.upsert_shopify_setting(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_shopify_setting(text, text) TO service_role;
