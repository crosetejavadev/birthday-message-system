import { DateTime } from 'luxon';

export function computeLocalNineAmUtcInstant(localDate: string, timezone: string): Date {
  const nineLocal = DateTime.fromISO(localDate, { zone: timezone }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
  if (!nineLocal.isValid) {
    throw new Error(`Invalid date/timezone combination: ${localDate} ${timezone}`);
  }
  return nineLocal.toUTC().toJSDate();
}

export function isBirthdayOnLocalDate(birthday: string, localDate: string): boolean {
  const b = DateTime.fromISO(birthday);
  const d = DateTime.fromISO(localDate);
  return b.isValid && d.isValid && b.month === d.month && b.day === d.day;
}

export function getUserLocalDate(nowUtc: Date, timezone: string): string {
  return DateTime.fromJSDate(nowUtc, { zone: 'utc' }).setZone(timezone).toISODate()!;
}

export function nowUtc(): Date {
  return new Date();
}

