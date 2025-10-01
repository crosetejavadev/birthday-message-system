import { describe, it, expect } from 'vitest';
import { computeLocalNineAmUtcInstant, getUserLocalDate, isBirthdayOnLocalDate } from '../src/time';
import { DateTime } from 'luxon';

describe('time helpers', () => {
  it('computes 9am local in UTC for New York', () => {
    const date = '2025-06-01';
    const d = computeLocalNineAmUtcInstant(date, 'America/New_York');
    const dt = DateTime.fromJSDate(d, { zone: 'utc' });
    expect(dt.hour).toBeGreaterThanOrEqual(13); // EDT 9am = 13:00 UTC
  });

  it('user local date changes with timezone', () => {
    const now = new Date('2025-01-01T00:30:00Z');
    const ny = getUserLocalDate(now, 'America/New_York');
    const mel = getUserLocalDate(now, 'Australia/Melbourne');
    expect(ny).not.toEqual(mel);
  });

  it('birthday matches by month/day', () => {
    expect(isBirthdayOnLocalDate('1990-10-02', '2025-10-02')).toBe(true);
    expect(isBirthdayOnLocalDate('1990-10-02', '2025-10-03')).toBe(false);
  });
});

