
-- Creates a function to append notes
CREATE OR REPLACE FUNCTION public.append_note(current_notes text, new_note text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_notes IS NULL OR current_notes = '' THEN
    RETURN new_note;
  ELSE
    RETURN current_notes || ' | ' || new_note;
  END IF;
END;
$$;
