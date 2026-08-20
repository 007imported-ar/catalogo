import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://yxkeahczlguritsowbvq.supabase.co";

const SUPABASE_KEY = "TU_PUBLISHABLE_KEY";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
