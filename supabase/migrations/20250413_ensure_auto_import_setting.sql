
-- Ensure the auto_import_enabled setting exists
DO $$
BEGIN
  -- Check if the setting already exists
  IF NOT EXISTS (
    SELECT 1 FROM shopify_settings 
    WHERE setting_name = 'auto_import_enabled'
  ) THEN
    -- Insert the setting with default value 'true'
    INSERT INTO shopify_settings (setting_name, setting_value)
    VALUES ('auto_import_enabled', 'true');
  END IF;
  
  -- Check if the last_cron_run setting exists
  IF NOT EXISTS (
    SELECT 1 FROM shopify_settings 
    WHERE setting_name = 'last_cron_run'
  ) THEN
    -- Insert the setting with current timestamp
    INSERT INTO shopify_settings (setting_name, setting_value)
    VALUES ('last_cron_run', now()::text);
  END IF;
END
$$;
