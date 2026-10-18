import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/** Without both env vars the app runs in local demo mode (see demo.ts). */
export const hasSb=!!url&&!!key;
export const sb=hasSb?createClient(url!,key!):null;
