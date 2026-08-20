import { DateTime } from 'luxon';

const DEFAULT_TZ = 'Africa/Nairobi';

/**
 * Returns the UTC Date range [start, end) for a calendar day in the given
 * IANA timezone. `end` is exclusive so range queries should use `>= start AND < end`.
 */
export function dayRangeUtc(
  date: Date | string,
  timezone: string = DEFAULT_TZ,
): { start: Date; end: Date } {
  const dt =
    date instanceof Date ? DateTime.fromJSDate(date, { zone: timezone }) : DateTime.fromISO(date, { zone: timezone });
  const dayStart = dt.startOf('day');
  const dayEnd = dayStart.plus({ days: 1 });
  return { start: dayStart.toJSDate(), end: dayEnd.toJSDate() };
}

/** Range for "today" in the business timezone. */
export function todayRangeUtc(timezone: string = DEFAULT_TZ): {
  start: Date;
  end: Date;
} {
  return dayRangeUtc(new Date(), timezone);
}

/** Range for the last N days (inclusive of today) in the business timezone. */
export function lastNDaysRangeUtc(
  days: number,
  timezone: string = DEFAULT_TZ,
): { start: Date; end: Date } {
  const now = DateTime.now().setZone(timezone);
  const start = now.minus({ days: days - 1 }).startOf('day');
  const end = now.plus({ days: 1 }).startOf('day');
  return { start: start.toJSDate(), end: end.toJSDate() };
}

/** Month range (1..12) for a given year in the business timezone. */
export function monthRangeUtc(
  year: number,
  month: number,
  timezone: string = DEFAULT_TZ,
): { start: Date; end: Date } {
  const dt = DateTime.fromObject({ year, month }, { zone: timezone });
  const start = dt.startOf('month');
  const end = dt.endOf('month').plus({ milliseconds: 1 });
  return { start: start.toJSDate(), end: end.toJSDate() };
}

/** Range for the current calendar month in the business timezone. */
export function currentMonthRangeUtc(
  timezone: string = DEFAULT_TZ,
): { start: Date; end: Date } {
  const now = DateTime.now().setZone(timezone);
  return monthRangeUtc(now.year, now.month, timezone);
}