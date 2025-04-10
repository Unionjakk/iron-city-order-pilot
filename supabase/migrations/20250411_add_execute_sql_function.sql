
-- Add a function to execute arbitrary SQL (for admin use only)
-- This function should be used with caution as it allows executing arbitrary SQL
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$;
