import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dashboardSessionFromAuth,
  dashboardSessionFromThrown,
  dashboardSessionFromUser,
} from './dashboard-session.ts';

describe('dashboardSessionFromUser', () => {
  it('treats a missing user as signed out', () => {
    assert.deepEqual(dashboardSessionFromUser(null), { status: 'signed-out' });
    assert.deepEqual(dashboardSessionFromUser(undefined), {
      status: 'signed-out',
    });
  });

  it('returns the trimmed email when the user has one', () => {
    assert.deepEqual(
      dashboardSessionFromUser({ email: '  ada@example.com \n' }),
      { status: 'signed-in', email: 'ada@example.com' },
    );
  });

  it('stays signed in when the email is missing or blank', () => {
    assert.deepEqual(dashboardSessionFromUser({}), {
      status: 'signed-in',
      email: null,
    });
    assert.deepEqual(dashboardSessionFromUser({ email: null }), {
      status: 'signed-in',
      email: null,
    });
    assert.deepEqual(dashboardSessionFromUser({ email: '   ' }), {
      status: 'signed-in',
      email: null,
    });
  });
});

describe('dashboardSessionFromAuth', () => {
  it('returns the signed-in view when a user is present', () => {
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: { email: '  ada@example.com \n' },
        error: null,
      }),
      { status: 'signed-in', email: 'ada@example.com' },
    );
  });

  it('stays signed in when a user is present alongside an error', () => {
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: { email: 'ada@example.com' },
        error: { message: 'stale' },
      }),
      { status: 'signed-in', email: 'ada@example.com' },
    );
  });

  it('treats a missing session as signed out', () => {
    assert.deepEqual(dashboardSessionFromAuth({ user: null, error: null }), {
      status: 'signed-out',
    });
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: undefined,
        error: {
          name: 'AuthSessionMissingError',
          message: 'different wording',
        },
      }),
      { status: 'signed-out' },
    );
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: null,
        error: { message: '  Auth session missing! \n' },
      }),
      { status: 'signed-out' },
    );
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: null,
        error: {
          name: 'AuthApiError',
          code: 'session_not_found',
          message: 'Session from session_id claim in JWT does not exist',
        },
      }),
      { status: 'signed-out' },
    );
  });

  it('shows other auth errors instead of the signed-out prompt', () => {
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: null,
        error: {
          name: 'AuthRetryableFetchError',
          message: '  Failed to fetch \n',
        },
      }),
      { status: 'unavailable', message: 'Failed to fetch' },
    );
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: null,
        error: {
          name: 'AuthApiError',
          message: 'Failed earlier. Auth session missing!',
        },
      }),
      {
        status: 'unavailable',
        message: 'Failed earlier. Auth session missing!',
      },
    );
  });

  it('replaces a blank auth error message', () => {
    assert.deepEqual(
      dashboardSessionFromAuth({
        user: null,
        error: { message: '   ' },
      }),
      {
        status: 'unavailable',
        message: 'Could not check your session. Try again.',
      },
    );
  });
});

describe('dashboardSessionFromThrown', () => {
  it('uses a thrown Error message', () => {
    assert.deepEqual(dashboardSessionFromThrown(new Error(' Network down ')), {
      status: 'unavailable',
      message: 'Network down',
    });
  });

  it('uses fallback copy for a blank or non-Error throw', () => {
    assert.deepEqual(dashboardSessionFromThrown(new Error('  ')), {
      status: 'unavailable',
      message: 'Could not check your session. Try again.',
    });
    assert.deepEqual(dashboardSessionFromThrown('nope'), {
      status: 'unavailable',
      message: 'Could not check your session. Try again.',
    });
  });
});
