import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MissingEnvError, requireEnv } from './env.ts';

describe('requireEnv', () => {
  it('returns the value when it is set', () => {
    assert.equal(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co'),
      'https://example.supabase.co',
    );
  });

  it('trims surrounding whitespace', () => {
    assert.equal(
      requireEnv('STRIPE_SECRET_KEY', '  sk_test_abc \n'),
      'sk_test_abc',
    );
  });

  it('keeps whitespace that is part of the value', () => {
    assert.equal(requireEnv('STRIPE_SECRET_KEY', 'sk test'), 'sk test');
  });

  it('throws MissingEnvError when the value is missing', () => {
    assert.throws(
      () => requireEnv('STRIPE_SECRET_KEY', undefined),
      (error: unknown) => {
        assert.ok(error instanceof MissingEnvError);
        assert.equal(error.variableName, 'STRIPE_SECRET_KEY');
        assert.equal(
          error.message,
          'Missing required environment variable: STRIPE_SECRET_KEY',
        );
        return true;
      },
    );
  });

  it('throws when the value is empty or only whitespace', () => {
    for (const value of ['', '   ', '\n\t']) {
      assert.throws(
        () => requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', value),
        (error: unknown) => {
          assert.ok(error instanceof MissingEnvError);
          assert.equal(error.variableName, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
          return true;
        },
      );
    }
  });
});
