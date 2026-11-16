import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applySupabaseCookies,
  isReadonlyCookiesError,
  type SupabaseAuthCookie,
  type SupabaseCookieWriter,
} from './supabase-cookies.ts';

const sessionCookie: SupabaseAuthCookie = {
  name: 'sb-access-token',
  value: 'access-token',
  options: { path: '/', httpOnly: true, sameSite: 'lax' },
};

const refreshCookie: SupabaseAuthCookie = {
  name: 'sb-refresh-token',
  value: 'refresh-token',
  options: { path: '/', maxAge: 3600 },
};

/** Next.js message from `cookies().set` in a Server Component. */
const READONLY_COOKIES_ERROR = new Error(
  'Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options',
);

function recordingStore(): SupabaseCookieWriter & {
  written: SupabaseAuthCookie[];
} {
  const written: SupabaseAuthCookie[] = [];
  return {
    written,
    set(name, value, options) {
      written.push({ name, value, options });
    },
  };
}

describe('isReadonlyCookiesError', () => {
  it('recognizes the Next.js read-only cookies error', () => {
    assert.equal(isReadonlyCookiesError(READONLY_COOKIES_ERROR), true);
  });

  it('rejects other errors and non-errors', () => {
    assert.equal(isReadonlyCookiesError(new Error('store unavailable')), false);
    assert.equal(
      isReadonlyCookiesError(
        new Error(
          'Failed earlier. Cookies can only be modified in a Server Action or Route Handler.',
        ),
      ),
      false,
    );
    assert.equal(isReadonlyCookiesError('Cookies can only be modified'), false);
    assert.equal(isReadonlyCookiesError(undefined), false);
  });
});

describe('applySupabaseCookies', () => {
  it('writes every cookie in order with its options', () => {
    const store = recordingStore();

    applySupabaseCookies(store, [sessionCookie, refreshCookie]);

    assert.deepEqual(store.written, [sessionCookie, refreshCookie]);
  });

  it('does nothing when there are no cookies', () => {
    const store = recordingStore();

    applySupabaseCookies(store, []);

    assert.deepEqual(store.written, []);
  });

  it('ignores a read-only cookies error and stops the batch', () => {
    const store = recordingStore();
    store.set = (name, value, options) => {
      if (name === refreshCookie.name) {
        throw READONLY_COOKIES_ERROR;
      }
      store.written.push({ name, value, options });
    };

    applySupabaseCookies(store, [sessionCookie, refreshCookie]);

    assert.deepEqual(store.written, [sessionCookie]);
  });

  it('rethrows an unexpected error after cookies already written', () => {
    const store = recordingStore();
    const failure = new Error('invalid cookie name');
    store.set = (name, value, options) => {
      if (name === refreshCookie.name) {
        throw failure;
      }
      store.written.push({ name, value, options });
    };

    assert.throws(
      () => applySupabaseCookies(store, [sessionCookie, refreshCookie]),
      (error: unknown) => error === failure,
    );
    assert.deepEqual(store.written, [sessionCookie]);
  });

  it('rethrows a non-Error failure', () => {
    const store = recordingStore();
    store.set = () => {
      throw 'cookie backend down';
    };

    assert.throws(
      () => applySupabaseCookies(store, [sessionCookie]),
      (error: unknown) => error === 'cookie backend down',
    );
  });
});
