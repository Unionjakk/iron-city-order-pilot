
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or service role key");
  throw new Error("Missing required environment variables for Supabase client");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
