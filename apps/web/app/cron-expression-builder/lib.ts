export interface ParsedCron {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
  domRestricted: boolean;
  dowRestricted: boolean;
}

export type ParseResult = { ok: true; data: ParsedCron } | { ok: false; error: string };

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const DOW_NAMES: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

export const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DOW_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface FieldSpec {
  min: number;
  max: number;
  names?: Record<string, number>;
}

function resolveToken(token: string, spec: FieldSpec): number | null {
  const upper = token.toUpperCase();
  if (spec.names && upper in spec.names) return spec.names[upper];
  if (/^\d+$/.test(token)) return parseInt(token, 10);
  return null;
}

function parseField(
  raw: string,
  spec: FieldSpec,
  fieldName: string,
): { ok: true; values: number[] } | { ok: false; error: string } {
  const values = new Set<number>();

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) return { ok: false, error: `${fieldName}: empty value in "${raw}".` };

    const stepMatch = trimmed.match(/^(.+)\/(\d+)$/);
    const rangePart = stepMatch ? stepMatch[1] : trimmed;
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
    if (step <= 0) return { ok: false, error: `${fieldName}: step must be positive in "${trimmed}".` };

    let start: number;
    let end: number;
    if (rangePart === "*") {
      start = spec.min;
      end = spec.max;
    } else if (rangePart.includes("-")) {
      const [aRaw, bRaw] = rangePart.split("-");
      const a = resolveToken(aRaw, spec);
      const b = resolveToken(bRaw, spec);
      if (a === null || b === null) return { ok: false, error: `${fieldName}: invalid range "${rangePart}".` };
      start = a;
      end = b;
    } else {
      const a = resolveToken(rangePart, spec);
      if (a === null) return { ok: false, error: `${fieldName}: invalid value "${rangePart}".` };
      start = a;
      end = stepMatch ? spec.max : a;
    }

    if (start < spec.min || start > spec.max || end < spec.min || end > spec.max) {
      return { ok: false, error: `${fieldName}: value out of range ${spec.min}-${spec.max} in "${trimmed}".` };
    }
    if (end < start) return { ok: false, error: `${fieldName}: range end before start in "${trimmed}".` };

    for (let v = start; v <= end; v += step) values.add(v);
  }

  return { ok: true, values: Array.from(values).sort((a, b) => a - b) };
}

// Standard 5-field cron (minute hour day-of-month month day-of-week). When
// both day-of-month and day-of-week are restricted (not "*"), cron matches
// either one rather than requiring both — that quirk is tracked here so
// nextRunTimes can apply it.
export function parseCron(expr: string): ParseResult {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: "Enter a cron expression." };

  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    return {
      ok: false,
      error: `A cron expression has 5 fields (minute hour day month weekday) — found ${fields.length}.`,
    };
  }
  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = fields;

  const minute = parseField(minuteRaw, { min: 0, max: 59 }, "Minute");
  if (!minute.ok) return minute;
  const hour = parseField(hourRaw, { min: 0, max: 23 }, "Hour");
  if (!hour.ok) return hour;
  const dayOfMonth = parseField(domRaw, { min: 1, max: 31 }, "Day of month");
  if (!dayOfMonth.ok) return dayOfMonth;
  const month = parseField(monthRaw, { min: 1, max: 12, names: MONTH_NAMES }, "Month");
  if (!month.ok) return month;
  const dow = parseField(dowRaw, { min: 0, max: 7, names: DOW_NAMES }, "Day of week");
  if (!dow.ok) return dow;

  // Field allows both 0 and 7 for Sunday — fold 7 into 0.
  const dayOfWeek = Array.from(new Set(dow.values.map((v) => (v === 7 ? 0 : v)))).sort((a, b) => a - b);

  return {
    ok: true,
    data: {
      minute: minute.values,
      hour: hour.values,
      dayOfMonth: dayOfMonth.values,
      month: month.values,
      dayOfWeek,
      domRestricted: domRaw.trim() !== "*",
      dowRestricted: dowRaw.trim() !== "*",
    },
  };
}

function timePhrase(data: ParsedCron, minuteRaw: string, hourRaw: string): string {
  const minuteEvery = minuteRaw === "*";
  const hourEvery = hourRaw === "*";

  if (minuteEvery && hourEvery) return "every minute";

  const minuteStep = minuteRaw.match(/^\*\/(\d+)$/);
  if (minuteStep && hourEvery) return `every ${minuteStep[1]} minutes`;

  if (hourEvery) {
    return data.minute.length === 1
      ? `at minute ${data.minute[0]} past every hour`
      : `at minutes ${data.minute.join(", ")} past every hour`;
  }

  if (minuteEvery) {
    return data.hour.length === 1
      ? `every minute during hour ${data.hour[0]}`
      : `every minute during hours ${data.hour.join(", ")}`;
  }

  const hourStep = hourRaw.match(/^\*\/(\d+)$/);
  if (data.minute.length === 1 && data.hour.length === 1) {
    return `at ${String(data.hour[0]).padStart(2, "0")}:${String(data.minute[0]).padStart(2, "0")}`;
  }
  if (data.minute.length === 1 && hourStep) {
    return `at minute ${data.minute[0]} every ${hourStep[1]} hours`;
  }

  return data.minute.length === 1
    ? `at minute ${data.minute[0]} past hours ${data.hour.join(", ")}`
    : `at minutes ${data.minute.join(", ")} past hours ${data.hour.join(", ")}`;
}

function dayPhrase(data: ParsedCron): string {
  if (!data.domRestricted && !data.dowRestricted) return "every day";

  const domText = `on day ${data.dayOfMonth.join(", ")} of the month`;
  const dowText = `on ${data.dayOfWeek.map((d) => DOW_LABELS[d]).join(", ")}`;

  if (data.domRestricted && !data.dowRestricted) return domText;
  if (!data.domRestricted && data.dowRestricted) return dowText;
  return `${domText}, or ${dowText}`;
}

export function describeCron(expr: string): string {
  const parsed = parseCron(expr);
  if (!parsed.ok) return parsed.error;

  const [minuteRaw, hourRaw, , monthRaw] = expr.trim().split(/\s+/);
  const { data } = parsed;

  const monthText = monthRaw === "*" ? "" : ` in ${data.month.map((m) => MONTH_LABELS[m - 1]).join(", ")}`;
  const sentence = `${timePhrase(data, minuteRaw, hourRaw)}, ${dayPhrase(data)}${monthText}`;

  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

// Brute-force minute-by-minute search, capped at roughly a year out —
// cheap enough to rerun on every keystroke and covers annual schedules
// (e.g. "0 0 1 12 *") without scanning indefinitely for expressions that
// never match (e.g. Feb 30th).
const MAX_SEARCH_MINUTES = 60 * 24 * 366;

export function nextRunTimes(data: ParsedCron, from: Date, count: number): Date[] {
  const results: Date[] = [];
  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  for (let i = 0; i < MAX_SEARCH_MINUTES && results.length < count; i++) {
    const minute = cursor.getMinutes();
    const hour = cursor.getHours();
    const dom = cursor.getDate();
    const month = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    const domMatch = data.dayOfMonth.includes(dom);
    const dowMatch = data.dayOfWeek.includes(dow);
    const dayMatch = data.domRestricted && data.dowRestricted ? domMatch || dowMatch : domMatch && dowMatch;

    if (data.minute.includes(minute) && data.hour.includes(hour) && data.month.includes(month) && dayMatch) {
      results.push(new Date(cursor));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

export function formatRunTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
