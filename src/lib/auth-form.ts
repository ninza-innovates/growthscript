/** Which login-page button started the request. */
export type AuthAction = 'sign-in' | 'sign-up';

/** What the login page should do after validation or a Supabase response. */
export type AuthAttempt =
  | { ok: true }
  | { ok: false; message: string };

const UNEXPECTED_MESSAGE = 'Something went wrong. Try again.';

/**
 * One address: a local part, one `@`, and a domain with a dot.
 * The login form sets `noValidate`, so this replaces the browser's `type="email"` check.
 */
const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side check before calling Supabase Auth.
 *
 * Returns a message to show on the form, or `null` when both fields can be sent.
 * Email is judged after trimming and must be a single address (`local@domain.tld`).
 * A password of only whitespace is empty; other passwords are sent unchanged,
 * including leading or trailing spaces.
 */
export function validateAuthCredentials(
  email: string,
  password: string,
): string | null {
  const trimmedEmail = email.trim();
  if (trimmedEmail === '') {
    return 'Enter an email address.';
  }
  if (!EMAIL_ADDRESS.test(trimmedEmail)) {
    return 'Enter a valid email address.';
  }
  if (password.trim() === '') {
    return 'Enter a password.';
  }
  return null;
}

/**
 * Map a Supabase Auth response to a form outcome.
 *
 * A returned auth error stays on the form. Sign-up with an empty `identities`
 * array is Supabase's response for an email that is already registered. Sign-up
 * with a user and no session still needs email confirmation. A missing session
 * on sign-in is a failure. Any present session continues to `/dashboard`.
 */
export function authAttemptFromResult(input: {
  action: AuthAction;
  error: { message: string } | null;
  session: unknown | null;
  identities?: readonly unknown[] | null;
}): AuthAttempt {
  if (input.error) {
    return { ok: false, message: messageOrFallback(input.error.message) };
  }

  if (input.session != null) {
    return { ok: true };
  }

  if (input.action === 'sign-up' && input.identities?.length === 0) {
    return {
      ok: false,
      message: 'An account with this email already exists. Sign in instead.',
    };
  }

  if (input.action === 'sign-up') {
    return {
      ok: false,
      message: 'Check your email to confirm your account, then sign in.',
    };
  }

  return {
    ok: false,
    message: 'Sign-in did not start a session. Try again.',
  };
}

/**
 * Map a thrown client failure (network, unexpected exception) to form copy.
 * Supabase Auth usually returns `{ error }` instead of throwing; this covers
 * the cases that do throw.
 */
export function authAttemptFromThrown(error: unknown): {
  ok: false;
  message: string;
} {
  if (error instanceof Error) {
    return { ok: false, message: messageOrFallback(error.message) };
  }
  return { ok: false, message: UNEXPECTED_MESSAGE };
}

function messageOrFallback(message: string): string {
  const trimmed = message.trim();
  return trimmed === '' ? UNEXPECTED_MESSAGE : trimmed;
}
