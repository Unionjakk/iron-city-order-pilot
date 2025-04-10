
-- Create a function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.column_exists(table_name text, column_name text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$function$;
