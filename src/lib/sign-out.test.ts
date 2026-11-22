import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  signOutAttemptFromResult,
  signOutAttemptFromThrown,
} from './sign-out.ts';

describe('signOutAttemptFromResult', () => {
  it('continues to login when sign-out returns no error', () => {
    assert.deepEqual(signOutAttemptFromResult(null), { ok: true });
  });

  it('shows the sign-out error message', () => {
    assert.deepEqual(
      signOutAttemptFromResult({ message: '  Session expired \n' }),
      { ok: false, message: 'Session expired' },
    );
  });

  it('replaces a blank sign-out error message', () => {
    assert.deepEqual(signOutAttemptFromResult({ message: '   ' }), {
      ok: false,
      message: 'Something went wrong. Try again.',
    });
  });
});

describe('signOutAttemptFromThrown', () => {
  it('uses a thrown Error message', () => {
    assert.deepEqual(signOutAttemptFromThrown(new Error(' Network down ')), {
      ok: false,
      message: 'Network down',
    });
  });

  it('uses fallback copy for a blank or non-Error throw', () => {
    assert.deepEqual(signOutAttemptFromThrown(new Error('  ')), {
      ok: false,
      message: 'Something went wrong. Try again.',
    });
    assert.deepEqual(signOutAttemptFromThrown('nope'), {
      ok: false,
      message: 'Something went wrong. Try again.',
    });
  });
});
