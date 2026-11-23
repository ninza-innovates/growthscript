import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  authAttemptFromResult,
  authAttemptFromThrown,
  validateAuthCredentials,
} from './auth-form.ts';

describe('validateAuthCredentials', () => {
  it('accepts an email and a password', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', 'correct horse'),
      null,
    );
  });

  it('rejects a missing or blank email before the password', () => {
    assert.equal(validateAuthCredentials('', 'secret'), 'Enter an email address.');
    assert.equal(
      validateAuthCredentials('  \n', 'secret'),
      'Enter an email address.',
    );
  });

  it('rejects a missing or blank password', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', ''),
      'Enter a password.',
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', ' \t'),
      'Enter a password.',
    );
  });

  it('accepts a tagged address and surrounding whitespace', () => {
    assert.equal(
      validateAuthCredentials('  ada+tag@mail.example.co.uk \n', 'secret'),
      null,
    );
  });

  it('rejects an email that is not a single address', () => {
    for (const email of [
      'ada',
      'ada@',
      '@example.com',
      'ada@example',
      'ada @example.com',
      'ada@example.com extra',
      'a@b@c.com',
    ]) {
      assert.equal(
        validateAuthCredentials(email, 'secret'),
        'Enter a valid email address.',
      );
    }
  });

  it('reports an invalid email before a blank password', () => {
    assert.equal(
      validateAuthCredentials('not-an-email', '   '),
      'Enter a valid email address.',
    );
  });
});

describe('authAttemptFromResult', () => {
  it('shows the auth error message', () => {
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-in',
        error: { message: '  Invalid login credentials \n' },
        session: null,
      }),
      { ok: false, tone: 'error', message: 'Invalid login credentials' },
    );
  });

  it('replaces a blank auth error message', () => {
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-up',
        error: { message: '   ' },
        session: null,
      }),
      {
        ok: false,
        tone: 'error',
        message: 'Something went wrong. Try again.',
      },
    );
  });

  it('continues when a session is present', () => {
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-in',
        error: null,
        session: { access_token: 'token' },
      }),
      { ok: true },
    );
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-up',
        error: null,
        session: { access_token: 'token' },
        identities: [{ id: 'identity' }],
      }),
      { ok: true },
    );
  });

  it('asks for email confirmation as a status when sign-up returns no session', () => {
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-up',
        error: null,
        session: null,
        identities: [{ id: 'identity' }],
      }),
      {
        ok: false,
        tone: 'status',
        message: 'Check your email to confirm your account, then sign in.',
      },
    );
  });

  it('treats an empty identities array as an existing account', () => {
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-up',
        error: null,
        session: null,
        identities: [],
      }),
      {
        ok: false,
        tone: 'error',
        message: 'An account with this email already exists. Sign in instead.',
      },
    );
  });

  it('stays on the form when sign-in returns no session', () => {
    assert.deepEqual(
      authAttemptFromResult({
        action: 'sign-in',
        error: null,
        session: null,
      }),
      {
        ok: false,
        tone: 'error',
        message: 'Sign-in did not start a session. Try again.',
      },
    );
  });
});

describe('authAttemptFromThrown', () => {
  it('uses a thrown Error message', () => {
    assert.deepEqual(authAttemptFromThrown(new Error(' Network down ')), {
      ok: false,
      tone: 'error',
      message: 'Network down',
    });
  });

  it('uses fallback copy for a blank or non-Error throw', () => {
    assert.deepEqual(authAttemptFromThrown(new Error('  ')), {
      ok: false,
      tone: 'error',
      message: 'Something went wrong. Try again.',
    });
    assert.deepEqual(authAttemptFromThrown('nope'), {
      ok: false,
      tone: 'error',
      message: 'Something went wrong. Try again.',
    });
  });
});
