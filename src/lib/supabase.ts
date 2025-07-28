import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const createSupabaseServerClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookies = require('next/headers').cookies();
          return cookies.get(name)?.value;
        },
        set: (name: string, value: string, options: any) => {
          const cookies = require('next/headers').cookies();
          cookies.set(name, value, options);
        },
        remove: (name: string) => {
          const cookies = require('next/headers').cookies();
          cookies.delete(name);
        },
      },
    }
  );
};