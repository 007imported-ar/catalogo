import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://yxkeahczlguritsowbvq.supabase.co";

const SUPABASE_KEY = "sb_publishable_kJ8K_79tRYBYBxvoZPkA0Q_ud7Fdo2B";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
