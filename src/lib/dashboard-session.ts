/** What `/dashboard` should show after checking the Supabase session. */
export type DashboardSession =
  | { status: 'signed-out' }
  | { status: 'signed-in'; email: string | null }
  | { status: 'unavailable'; message: string };

/** Shown when a session check fails and Supabase did not provide a message. */
const SESSION_CHECK_FAILED = 'Could not check your session. Try again.';

/**
 * Auth error fields the dashboard needs. Matches `AuthError` from
 * `@supabase/auth-js` without importing it, so this module stays free of
 * the client.
 */
export type DashboardAuthError = {
  message: string;
  name?: string;
  code?: string;
};

/**
 * Map a Supabase user to the signed-in or signed-out view.
 *
 * A missing user is signed out. A user with a blank email is still signed in;
 * the page then omits the address instead of treating them as logged out.
 */
export function dashboardSessionFromUser(
  user: { email?: string | null } | null | undefined,
): DashboardSession {
  if (user == null) {
    return { status: 'signed-out' };
  }

  const email = user.email?.trim() ?? '';
  return {
    status: 'signed-in',
    email: email === '' ? null : email,
  };
}

/**
 * Map a Supabase `getUser` result to the dashboard view.
 *
 * A present user is signed in, even if an error was also returned. No user
 * and no error, or Supabase's missing-session error, is the normal logged-out
 * result. Any other error (network, 5xx, an unexpected auth failure) is
 * `unavailable`, so the page does not tell that visitor they are simply
 * signed out.
 */
export function dashboardSessionFromAuth(input: {
  user: { email?: string | null } | null | undefined;
  error: DashboardAuthError | null;
}): DashboardSession {
  if (input.user != null) {
    return dashboardSessionFromUser(input.user);
  }

  if (isMissingSession(input.error)) {
    return { status: 'signed-out' };
  }

  return {
    status: 'unavailable',
    message: messageOrFallback(input.error?.message ?? ''),
  };
}

/**
 * Map a thrown session-check failure to dashboard copy.
 * `getUser` usually returns `{ error }` instead of throwing; this covers
 * the cases that do throw.
 */
export function dashboardSessionFromThrown(error: unknown): {
  status: 'unavailable';
  message: string;
} {
  if (error instanceof Error) {
    return { status: 'unavailable', message: messageOrFallback(error.message) };
  }
  return { status: 'unavailable', message: SESSION_CHECK_FAILED };
}

/**
 * Whether this result means nobody is logged in.
 *
 * The client reports that as `AuthSessionMissingError` with the message
 * "Auth session missing!". `session_not_found` is the same outcome when the
 * API code is still attached. Any other message, including one that only
 * contains that sentence, is a real failure.
 */
function isMissingSession(error: DashboardAuthError | null): boolean {
  if (error == null) return true;
  if (error.name === 'AuthSessionMissingError') return true;
  if (error.code === 'session_not_found') return true;
  return error.message.trim() === 'Auth session missing!';
}

function messageOrFallback(message: string): string {
  const trimmed = message.trim();
  return trimmed === '' ? SESSION_CHECK_FAILED : trimmed;
}
