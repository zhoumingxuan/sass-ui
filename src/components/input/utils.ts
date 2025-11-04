export function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Strict local parsing for YYYY-MM-DD (no timezone surprises)
export function parseDateStrict(v?: string): Date | undefined {
  if (!v) return undefined;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(v.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!isValidYMD(y, mo, d)) return undefined;
  return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

// Strict local parsing for YYYY-MM-DD HH:mm
export function parseDateTimeStrict(v?: string): { date: Date; hasTime: boolean } | undefined {
  if (!v) return undefined;
  const s = v.trim();
  const m1 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (m1) {
    const y = Number(m1[1]); const mo = Number(m1[2]); const d = Number(m1[3]);
    if (!isValidYMD(y, mo, d)) return undefined;
    return { date: new Date(y, mo - 1, d, 0, 0, 0, 0), hasTime: false };
  }
  const m2 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})\s+([0-9]{2}):([0-9]{2})$/.exec(s);
  if (m2) {
    const y = Number(m2[1]); const mo = Number(m2[2]); const d = Number(m2[3]);
    const hh = Number(m2[4]); const mm = Number(m2[5]);
    if (!isValidYMD(y, mo, d)) return undefined;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return undefined;
    return { date: new Date(y, mo - 1, d, hh, mm, 0, 0), hasTime: true };
  }
  return undefined;
}

export function parseISO(v?: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export function formatISO(d?: Date): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(d?: Date): string {
  if (!d) return '';
  const date = formatISO(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, n: number) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + n);
  return dt;
}

export function inRange(d: Date, min?: Date, max?: Date) {
  if (min && d < min) return false;
  if (max && d > max) return false;
  return true;
}

export function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidYMD(year: number, month: number, day: number) {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const dim = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= dim;
}

// Inclusive day span (start and end inclusive)
export function spanDaysInclusive(start: Date, end: Date) {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000) + 1;
}
