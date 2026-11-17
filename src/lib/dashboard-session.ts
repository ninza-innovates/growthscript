/** What `/dashboard` should show for the current Supabase user. */
export type DashboardSession =
  | { status: 'signed-out' }
  | { status: 'signed-in'; email: string | null };

/**
 * Map a Supabase user to the dashboard view.
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
