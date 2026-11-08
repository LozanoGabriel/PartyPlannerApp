import 'dotenv/config';
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error('Missing SUPABASE_URL in .env')
if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env')

// Server-side client. The service-role key skips database permissions, which is why every
// backend function checks that the logged-in host owns what they are touching.
// NEVER put this key in the Expo app or commit it to GitHub.
// The two auth options stop the client from keeping a login session, which a server doesn't need.
export const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
})