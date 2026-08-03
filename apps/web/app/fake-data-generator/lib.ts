export type FieldType =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "streetAddress"
  | "city"
  | "country"
  | "zipCode"
  | "date"
  | "loremWords"
  | "loremParagraph";

export const FIELD_DEFS: { type: FieldType; label: string }[] = [
  { type: "firstName", label: "First Name" },
  { type: "lastName", label: "Last Name" },
  { type: "fullName", label: "Full Name" },
  { type: "email", label: "Email" },
  { type: "streetAddress", label: "Street Address" },
  { type: "city", label: "City" },
  { type: "country", label: "Country" },
  { type: "zipCode", label: "Zip Code" },
  { type: "date", label: "Date" },
  { type: "loremWords", label: "Lorem Words" },
  { type: "loremParagraph", label: "Lorem Paragraph" },
];

export type Rng = () => number;

// Small, fast, seedable PRNG (public domain, by Tommy Ettinger) — used
// instead of crypto.getRandomValues() when a seed is provided so the same
// seed always reproduces the same batch.
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cryptoRng(): Rng {
  return () => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  };
}

function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ---------- Bundled static data (kept small on purpose) ----------

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Luca", "Giulia", "Marco", "Sofia",
  "Alessandro", "Chiara", "Andrea", "Francesca", "Matteo", "Elena",
] as const;

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci",
  "Marino", "Greco", "Bruno",
] as const;

const EMAIL_DOMAINS = [
  "example.com", "mail.com", "gmail.com", "outlook.com", "yahoo.com", "proton.me",
] as const;

const STREET_NAMES = [
  "Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Elm St", "Park Ave", "Pine St",
  "Via Roma", "Via Milano", "Corso Italia", "Piazza Garibaldi", "Via Dante",
  "Sunset Blvd", "Lake Shore Dr", "Highland Ave",
] as const;

const CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Milan", "Rome",
  "Turin", "Naples", "Florence", "London", "Paris", "Berlin", "Madrid", "Amsterdam",
] as const;

const COUNTRIES = [
  "United States", "Italy", "United Kingdom", "France", "Germany", "Spain",
  "Netherlands", "Canada", "Australia", "Japan", "Brazil", "Portugal",
] as const;

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "reprehenderit", "voluptate", "velit",
] as const;

// ---------- Field generators ----------

function genFirstName(rng: Rng): string {
  return pick(rng, FIRST_NAMES);
}

function genLastName(rng: Rng): string {
  return pick(rng, LAST_NAMES);
}

function genEmail(rng: Rng, first: string, last: string): string {
  const separator = pick(rng, [".", "_", ""] as const);
  const suffix = rng() < 0.3 ? String(randomInt(rng, 1, 99)) : "";
  const domain = pick(rng, EMAIL_DOMAINS);
  return `${first.toLowerCase()}${separator}${last.toLowerCase()}${suffix}@${domain}`;
}

function genStreetAddress(rng: Rng): string {
  return `${randomInt(rng, 1, 9999)} ${pick(rng, STREET_NAMES)}`;
}

function genZipCode(rng: Rng): string {
  return String(randomInt(rng, 10000, 99999));
}

function genDate(rng: Rng, start = new Date(2000, 0, 1), end = new Date()): string {
  const t = randomInt(rng, start.getTime(), end.getTime());
  return new Date(t).toISOString().slice(0, 10);
}

function genLoremWords(rng: Rng, count = 6): string {
  return Array.from({ length: count }, () => pick(rng, LOREM_WORDS)).join(" ");
}

function genLoremParagraph(rng: Rng, sentences = 3): string {
  return Array.from({ length: sentences }, () => {
    const words = genLoremWords(rng, randomInt(rng, 5, 12)).split(" ");
    words[0] = words[0][0].toUpperCase() + words[0].slice(1);
    return `${words.join(" ")}.`;
  }).join(" ");
}

function genFieldValue(type: FieldType, rng: Rng, first: string, last: string): string {
  switch (type) {
    case "firstName":
      return first;
    case "lastName":
      return last;
    case "fullName":
      return `${first} ${last}`;
    case "email":
      return genEmail(rng, first, last);
    case "streetAddress":
      return genStreetAddress(rng);
    case "city":
      return pick(rng, CITIES);
    case "country":
      return pick(rng, COUNTRIES);
    case "zipCode":
      return genZipCode(rng);
    case "date":
      return genDate(rng);
    case "loremWords":
      return genLoremWords(rng);
    case "loremParagraph":
      return genLoremParagraph(rng);
  }
}

// ---------- Batch generation ----------

// The column key (e.g. "Nombre", "Indirizzo_Email") is independent of the
// generator type (e.g. "firstName", "email") so the output can match an
// arbitrary schema instead of being locked to the built-in field names.
export interface Column {
  key: string;
  type: FieldType;
}

export type Row = Record<string, string>;

export interface GenerateOptions {
  columns: Column[];
  count: number;
  seed?: number;
}

export function generateRows(options: GenerateOptions): Row[] {
  const rng = options.seed !== undefined ? mulberry32(options.seed) : cryptoRng();

  return Array.from({ length: options.count }, () => {
    const first = genFirstName(rng);
    const last = genLastName(rng);
    const row: Row = {};

    for (const column of options.columns) {
      row[column.key] = genFieldValue(column.type, rng, first, last);
    }

    return row;
  });
}

// ---------- Export ----------

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: Row[], columns: Column[]): string {
  const header = columns.map((c) => csvEscape(c.key)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvEscape(row[c.key] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

export function toJson(rows: Row[]): string {
  return JSON.stringify(rows, null, 2);
}

function tsPropertyKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

// Emits an `interface` inferred from the column names plus a typed array
// literal, so the batch can be pasted straight into TS code that already
// expects a specific shape instead of the built-in field names.
export function toTypeScript(rows: Row[], columns: Column[], interfaceName = "FakeDataRow"): string {
  const fields = columns.map((c) => `  ${tsPropertyKey(c.key)}: string;`).join("\n");

  const items = rows.map((row) => {
    const props = columns
      .map((c) => `${tsPropertyKey(c.key)}: ${JSON.stringify(row[c.key] ?? "")}`)
      .join(", ");
    return `  { ${props} },`;
  });

  return [
    `interface ${interfaceName} {`,
    fields,
    "}",
    "",
    `const fakeData: ${interfaceName}[] = [`,
    ...items,
    "];",
  ].join("\n");
}
