
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = "https://uovwtbqlrczzrnrrasjm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Truncated for safety
export const supabase = createClient(supabaseUrl, supabaseKey);
