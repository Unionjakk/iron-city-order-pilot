
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize the Supabase client with environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);
