import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dashboardSessionFromUser } from './dashboard-session.ts';

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
