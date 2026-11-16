import type { CookieOptions } from '@supabase/ssr';

/** One auth cookie Supabase asks the server client to persist. */
export type SupabaseAuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Minimal cookie store. Matches the `set` method on the store from
 * `cookies()` in `next/headers`.
 */
export type SupabaseCookieWriter = {
  set(name: string, value: string, options: CookieOptions): void;
};

/**
 * Opening sentence of the error Next.js throws when `cookies().set` runs
 * outside a Server Action or Route Handler.
 */
const READONLY_COOKIES_MESSAGE_PREFIX =
  'Cookies can only be modified in a Server Action or Route Handler.';

/**
 * Whether `error` is Next.js refusing a cookie write from a Server Component.
 *
 * The error class is not a public export. The message is the stable contract.
 * It starts with "Cookies can only be modified in a Server Action or Route Handler."
 *
 * @param error - Value caught from `cookieStore.set`.
 */
export function isReadonlyCookiesError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith(READONLY_COOKIES_MESSAGE_PREFIX)
  );
}

/**
 * Persists each Supabase auth cookie, in order.
 *
 * A Server Component cannot write cookies. Next.js throws in that case, and
 * this function ignores that specific error so rendering can finish. A later
 * middleware refresh persists the session. Any other failure from
 * `cookieStore.set` is rethrown, including failures after earlier cookies in
 * the same batch were already written.
 *
 * @param cookieStore - Destination for the cookies.
 * @param cookiesToSet - Cookies to write, in order.
 */
export function applySupabaseCookies(
  cookieStore: SupabaseCookieWriter,
  cookiesToSet: readonly SupabaseAuthCookie[],
): void {
  try {
    for (const { name, value, options } of cookiesToSet) {
      cookieStore.set(name, value, options);
    }
  } catch (error) {
    if (isReadonlyCookiesError(error)) {
      return;
    }
    throw error;
  }
}
