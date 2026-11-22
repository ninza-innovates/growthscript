/** What the dashboard should do after Supabase `signOut`. */
export type SignOutAttempt =
  | { ok: true }
  | { ok: false; message: string };

const UNEXPECTED_MESSAGE = 'Something went wrong. Try again.';

/**
 * Map a Supabase `signOut` response to a dashboard outcome.
 *
 * A returned error stays on the page. A blank message uses the same fallback
 * as a thrown failure. No error means the page can navigate to `/login`.
 */
export function signOutAttemptFromResult(
  error: { message: string } | null,
): SignOutAttempt {
  if (error) {
    return { ok: false, message: messageOrFallback(error.message) };
  }
  return { ok: true };
}

/**
 * Map a thrown client failure (network, unexpected exception) to dashboard copy.
 * Supabase Auth usually returns `{ error }` instead of throwing; this covers
 * the cases that do throw so the sign-out button can be used again.
 */
export function signOutAttemptFromThrown(error: unknown): {
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
