/**
 * Thrown when a required environment variable is missing or blank.
 * `variableName` is the env var that failed the check.
 */
export class MissingEnvError extends Error {
  readonly variableName: string;

  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
    this.name = 'MissingEnvError';
    this.variableName = variableName;
  }
}

/**
 * Validate a required environment variable the caller has already read.
 *
 * Pass the value with a direct `process.env.SOME_NAME` access. Next.js only
 * inlines `NEXT_PUBLIC_*` variables into client bundles when that access is
 * written out in source; looking the name up on `process.env` dynamically
 * drops the value in the browser.
 *
 * Returns the trimmed value. Throws {@link MissingEnvError} when `value` is
 * missing or only whitespace.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MissingEnvError(name);
  }
  return value.trim();
}
