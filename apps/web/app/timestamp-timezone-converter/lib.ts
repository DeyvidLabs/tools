export type TimestampUnit = "auto" | "unix-s" | "unix-ms" | "iso8601";

export const TIMESTAMP_UNIT_LABELS: Record<TimestampUnit, string> = {
  auto: "Auto-detect",
  "unix-s": "Unix seconds",
  "unix-ms": "Unix milliseconds",
  iso8601: "ISO 8601",
};

const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// Intl.supportedValuesOf isn't in every runtime yet (older Safari) — fall
// back to a curated list covering one representative zone per UTC offset.
// "UTC" itself is excluded from the IANA database's own supportedValuesOf
// result, so it's prepended explicitly since it's the most common choice.
export function getAvailableTimeZones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return ["UTC", ...Intl.supportedValuesOf("timeZone")];
  }
  return FALLBACK_TIME_ZONES;
}

// 10-digit unix seconds and 13-digit unix ms overlap in digit count around
// the current era, so the split is done on magnitude instead: today's
// seconds value (~1.8e9) is always well under 1e12, while today's ms value
// (~1.8e12) is always well over it.
function detectUnit(trimmed: string): Exclude<TimestampUnit, "auto"> {
  if (/^-?\d+$/.test(trimmed)) {
    return Math.abs(Number(trimmed)) < 1e12 ? "unix-s" : "unix-ms";
  }
  return "iso8601";
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function parseTimestamp(input: string, unit: TimestampUnit = "auto"): Date | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const resolvedUnit = unit === "auto" ? detectUnit(trimmed) : unit;

  switch (resolvedUnit) {
    case "unix-s": {
      if (!/^-?\d+$/.test(trimmed)) return null;
      const date = new Date(Number(trimmed) * 1000);
      return isValidDate(date) ? date : null;
    }
    case "unix-ms": {
      if (!/^-?\d+$/.test(trimmed)) return null;
      const date = new Date(Number(trimmed));
      return isValidDate(date) ? date : null;
    }
    case "iso8601": {
      const date = new Date(trimmed);
      return isValidDate(date) ? date : null;
    }
  }
}

export interface ConvertedTimestamp {
  unixSeconds: number;
  unixMs: number;
  iso: string;
  human: string;
}

export function formatTimestamp(date: Date, timeZone: string): ConvertedTimestamp {
  return {
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso: date.toISOString(),
    human: new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "full",
      timeStyle: "long",
    }).format(date),
  };
}

export interface BatchResult {
  input: string;
  result: ConvertedTimestamp | null;
}

export function convertBatch(
  input: string,
  timeZone: string,
  unit: TimestampUnit = "auto",
): BatchResult[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const date = parseTimestamp(line, unit);
      return { input: line, result: date ? formatTimestamp(date, timeZone) : null };
    });
}
