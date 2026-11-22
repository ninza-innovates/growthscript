'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  dashboardSessionFromUser,
  type DashboardSession,
} from '@/lib/dashboard-session';
import {
  signOutAttemptFromResult,
  signOutAttemptFromThrown,
} from '@/lib/sign-out';

export default function Dashboard() {
  const router = useRouter();
  /** `null` until the browser session check finishes. */
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || !data.user) {
          setSession({ status: 'signed-out' });
          return;
        }
        setSession(dashboardSessionFromUser(data.user));
      } catch {
        if (!cancelled) setSession({ status: 'signed-out' });
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;

    setActionError(null);
    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      const attempt = signOutAttemptFromResult(error);
      if (!attempt.ok) {
        setActionError(attempt.message);
        setSigningOut(false);
        return;
      }
      router.push('/login');
    } catch (caught) {
      setActionError(signOutAttemptFromThrown(caught).message);
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
          GrowthScript
        </h1>
        {session == null ? (
          <p className="text-center text-gray-600">Checking your session...</p>
        ) : session.status === 'signed-in' ? (
          <>
            <p className="text-center text-gray-700 mb-6">
              {session.email ? (
                <>
                  Signed in as{' '}
                  <span className="font-medium">{session.email}</span>
                </>
              ) : (
                'Signed in.'
              )}
            </p>
            {actionError && (
              <p role="alert" className="text-red-500 text-sm mb-4">
                {actionError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition disabled:opacity-60"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-gray-700 mb-6">
              Sign in to open your dashboard.
            </p>
            <Link
              href="/login"
              className="block w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition text-center"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
