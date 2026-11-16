import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireEnv } from './env';
import {
  applySupabaseCookies,
  type SupabaseAuthCookie,
} from './supabase-cookies';

/**
 * Server Supabase client for the current request.
 * Lives in its own module so the login page can import the browser client
 * without pulling `next/headers` into the client bundle.
 * `cookies()` is async in Next.js 15, so this function is async too.
 */
export const createSupabaseServerClient = async () => {
  const supabaseUrl = requireEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const supabaseAnonKey = requireEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: SupabaseAuthCookie[]) {
        applySupabaseCookies(cookieStore, cookiesToSet);
      },
    },
  });
};
