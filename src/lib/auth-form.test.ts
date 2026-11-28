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
      validateAuthCredentials('ada@example.com', 'correct horse', 'sign-in'),
      null,
    );
  });

  it('rejects a missing or blank email before the password', () => {
    assert.equal(
      validateAuthCredentials('', 'secret', 'sign-in'),
      'Enter an email address.',
    );
    assert.equal(
      validateAuthCredentials('  \n', 'secret', 'sign-up'),
      'Enter an email address.',
    );
  });

  it('rejects a missing or blank password', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', '', 'sign-in'),
      'Enter a password.',
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', ' \t', 'sign-up'),
      'Enter a password.',
    );
  });

  it('accepts a tagged address and surrounding whitespace', () => {
    assert.equal(
      validateAuthCredentials(
        '  ada+tag@mail.example.co.uk \n',
        'secret',
        'sign-in',
      ),
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
      'ada@gmail..com',
      'ada@.gmail.com',
      'ada@gmail.com.',
      'ada..lovelace@example.com',
      '.ada@example.com',
      'ada.@example.com',
      'ada@-example.com',
      'ada@example-.com',
    ]) {
      assert.equal(
        validateAuthCredentials(email, 'secret', 'sign-up'),
        'Enter a valid email address.',
      );
    }
  });

  it('accepts a hyphenated domain', () => {
    assert.equal(
      validateAuthCredentials('ada@my-mail.example.com', 'secret', 'sign-in'),
      null,
    );
  });

  it('rejects an email longer than Supabase Auth allows', () => {
    const atLimit = `${'a'.repeat(243)}@example.com`;
    assert.equal(Buffer.byteLength(atLimit), 255);
    assert.equal(validateAuthCredentials(atLimit, 'secret', 'sign-in'), null);

    const tooManyCharacters = `${'a'.repeat(244)}@example.com`;
    assert.equal(
      validateAuthCredentials(tooManyCharacters, 'secret', 'sign-up'),
      'Email address is too long.',
    );
    // "é" is one character and two UTF-8 bytes, so this is under 255
    // characters and over 255 bytes.
    const tooManyBytes = `${'é'.repeat(200)}@x.co`;
    assert.ok(tooManyBytes.length < 255);
    assert.ok(Buffer.byteLength(tooManyBytes) > 255);
    assert.equal(
      validateAuthCredentials(tooManyBytes, 'secret', 'sign-in'),
      'Email address is too long.',
    );
  });

  it('reports an invalid email before a blank or short password', () => {
    assert.equal(
      validateAuthCredentials('not-an-email', '   ', 'sign-in'),
      'Enter a valid email address.',
    );
    assert.equal(
      validateAuthCredentials('not-an-email', 'abc', 'sign-up'),
      'Enter a valid email address.',
    );
  });

  it('rejects a sign-up password shorter than Supabase Auth allows', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', 'abcde', 'sign-up'),
      'Password must be at least 6 characters.',
    );
    // Three emoji are three characters; each is a surrogate pair.
    assert.equal(
      validateAuthCredentials('ada@example.com', '😀😀😀', 'sign-up'),
      'Password must be at least 6 characters.',
    );
    // Spaces are sent as typed, so they count toward the length.
    assert.equal(
      validateAuthCredentials('ada@example.com', '  abc', 'sign-up'),
      'Password must be at least 6 characters.',
    );
  });

  it('rejects a sign-up password longer than bcrypt will store', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', 'a'.repeat(73), 'sign-up'),
      'Password must be at most 72 characters.',
    );
    // "é" is one character and two UTF-8 bytes, so 37 of them are 74 bytes.
    assert.equal(
      validateAuthCredentials('ada@example.com', 'é'.repeat(37), 'sign-up'),
      'Password must be at most 72 characters.',
    );
  });

  it('accepts a sign-up password at either length limit', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', 'abcdef', 'sign-up'),
      null,
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', '😀😀😀😀😀😀', 'sign-up'),
      null,
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', 'a'.repeat(72), 'sign-up'),
      null,
    );
    // 36 "é" are 72 bytes.
    assert.equal(
      validateAuthCredentials('ada@example.com', 'é'.repeat(36), 'sign-up'),
      null,
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', '  abcd', 'sign-up'),
      null,
    );
  });

  it('does not apply sign-up length limits when signing in', () => {
    assert.equal(
      validateAuthCredentials('ada@example.com', 'abcde', 'sign-in'),
      null,
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', 'a'.repeat(80), 'sign-in'),
      null,
    );
    assert.equal(
      validateAuthCredentials('ada@example.com', 'é'.repeat(40), 'sign-in'),
      null,
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
