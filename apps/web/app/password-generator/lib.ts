export const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~",
} as const;

export type CharsetKey = keyof typeof CHARSETS;

// Visually confusable characters (1/l/I, 0/O) — off by default toggle, useful
// when a password will be transcribed by hand or read aloud.
const AMBIGUOUS = "Il1O0";

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

function charsetFor(key: CharsetKey, excludeAmbiguous: boolean): string {
  const chars = CHARSETS[key];
  if (!excludeAmbiguous) return chars;
  return [...chars].filter((c) => !AMBIGUOUS.includes(c)).join("");
}

function activeCategories(options: GeneratorOptions): string[] {
  return (Object.keys(CHARSETS) as CharsetKey[])
    .filter((key) => options[key])
    .map((key) => charsetFor(key, options.excludeAmbiguous))
    .filter((chars) => chars.length > 0);
}

// Rejection-sampled uniform int in [0, maxExclusive) — avoids the modulo bias
// a plain `getRandomValues()[0] % max` would introduce.
function secureRandomInt(maxExclusive: number): number {
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  let value: number;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return value % maxExclusive;
}

function pickRandomChar(chars: string): string {
  return chars[secureRandomInt(chars.length)];
}

function secureShuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generatePassword(options: GeneratorOptions): string {
  const categories = activeCategories(options);
  if (categories.length === 0) return "";

  const pool = categories.join("");
  const result: string[] = [];

  // Guarantee at least one char from each selected category (as long as
  // length allows it), so e.g. "symbols on" can't silently produce none.
  const guaranteedCount = Math.min(categories.length, options.length);
  for (const category of secureShuffle(categories).slice(0, guaranteedCount)) {
    result.push(pickRandomChar(category));
  }

  for (let i = result.length; i < options.length; i++) {
    result.push(pickRandomChar(pool));
  }

  return secureShuffle(result).join("");
}

export function calculateEntropyBits(options: GeneratorOptions): number {
  const poolChars = new Set<string>();
  for (const category of activeCategories(options)) {
    for (const c of category) poolChars.add(c);
  }
  if (poolChars.size === 0) return 0;
  return options.length * Math.log2(poolChars.size);
}

export interface Strength {
  label: string;
  colorVar: string;
  segments: number;
}

export function getStrength(bits: number): Strength {
  if (bits <= 0) return { label: "—", colorVar: "var(--muted-foreground)", segments: 0 };
  if (bits < 40) return { label: "Weak", colorVar: "var(--accent-rose)", segments: 1 };
  if (bits < 60) return { label: "Fair", colorVar: "var(--accent-orange)", segments: 2 };
  if (bits < 80) return { label: "Good", colorVar: "var(--accent-amber)", segments: 3 };
  if (bits < 120) return { label: "Strong", colorVar: "var(--primary)", segments: 4 };
  return { label: "Excellent", colorVar: "var(--accent-purple)", segments: 5 };
}
