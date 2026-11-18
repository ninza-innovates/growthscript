'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  authAttemptFromResult,
  authAttemptFromThrown,
  validateAuthCredentials,
  type AuthAction,
} from '@/lib/auth-form';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<AuthAction | null>(null);
  const router = useRouter();

  const submit = async (action: AuthAction) => {
    if (submitting !== null) return;

    const validationMessage = validateAuthCredentials(email, password);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setSubmitting(action);

    try {
      const credentials = { email: email.trim(), password };
      const { data, error: authError } =
        action === 'sign-up'
          ? await supabase.auth.signUp(credentials)
          : await supabase.auth.signInWithPassword(credentials);
      const attempt = authAttemptFromResult({
        action,
        error: authError,
        session: data.session,
        identities: data.user?.identities,
      });
      if (!attempt.ok) {
        setError(attempt.message);
        setSubmitting(null);
        return;
      }
      router.push('/dashboard');
    } catch (caught) {
      setError(authAttemptFromThrown(caught).message);
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">GrowthScript</h1>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit('sign-in');
          }}
        >
          <input
            type="email"
            aria-label="Email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting !== null}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <input
            type="password"
            aria-label="Password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting !== null}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          {error && (
            <p role="alert" className="text-red-500 text-sm mb-4">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void submit('sign-up')}
            disabled={submitting !== null}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-60"
          >
            {submitting === 'sign-up' ? 'Signing up...' : 'Sign Up'}
          </button>
          <button
            type="submit"
            disabled={submitting !== null}
            className="w-full bg-gray-500 text-white p-3 rounded-lg mt-2 hover:bg-gray-600 transition disabled:opacity-60"
          >
            {submitting === 'sign-in' ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}