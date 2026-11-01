/// <reference types="node" />
import { afterEach, beforeEach } from 'vitest';

/**
 * Timezones used to exercise local-date logic. Node re-reads process.env.TZ
 * on assignment, so Date objects created after the switch use the new zone.
 * - America/Los_Angeles: negative UTC offset, observes DST
 * - Asia/Tokyo: positive UTC offset (local midnight is the previous UTC day)
 * - UTC
 */
export const TEST_TIMEZONES = ['America/Los_Angeles', 'Asia/Tokyo', 'UTC'] as const;

/** Run every test in the enclosing describe block under the given timezone. */
export function useTimezone(tz: string): void {
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.TZ;
    process.env.TZ = tz;
  });
  afterEach(() => {
    if (original === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = original;
    }
  });
}
