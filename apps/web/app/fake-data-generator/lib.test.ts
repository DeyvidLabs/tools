import { describe, expect, it } from "vitest";
import {
  FIELD_DEFS,
  generateRows,
  mulberry32,
  toCsv,
  toJson,
  toTypeScript,
  type Column,
  type Row,
} from "./lib";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("always returns values in [0, 1)", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

const allColumns: Column[] = FIELD_DEFS.map((d) => ({ key: d.type, type: d.type }));

describe("generateRows", () => {
  it("produces reproducible batches for the same seed", () => {
    const options = { columns: allColumns, count: 10, seed: 123 };
    expect(generateRows(options)).toEqual(generateRows(options));
  });

  it("produces different batches for different seeds", () => {
    const a = generateRows({ columns: [{ key: "name", type: "fullName" }], count: 5, seed: 1 });
    const b = generateRows({ columns: [{ key: "name", type: "fullName" }], count: 5, seed: 2 });
    expect(a).not.toEqual(b);
  });

  it("returns exactly `count` rows, keyed by the user-chosen column names", () => {
    const columns: Column[] = [
      { key: "Indirizzo_Email", type: "email" },
      { key: "Nombre", type: "firstName" },
    ];
    const rows = generateRows({ columns, count: 4, seed: 1 });
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(Object.keys(row).sort()).toEqual(["Indirizzo_Email", "Nombre"]);
      expect(row.Indirizzo_Email).toContain("@");
    }
  });

  it("lets two columns use the same generator type under different keys", () => {
    const columns: Column[] = [
      { key: "billing_email", type: "email" },
      { key: "shipping_email", type: "email" },
    ];
    const rows = generateRows({ columns, count: 1, seed: 1 });
    expect(rows[0].billing_email).toContain("@");
    expect(rows[0].shipping_email).toContain("@");
  });

  it("keeps name-derived fields consistent within a row regardless of column key", () => {
    const columns: Column[] = [
      { key: "Nombre", type: "firstName" },
      { key: "Apellido", type: "lastName" },
      { key: "NombreCompleto", type: "fullName" },
      { key: "Correo", type: "email" },
    ];
    const rows = generateRows({ columns, count: 5, seed: 1 });
    for (const row of rows) {
      expect(row.NombreCompleto).toBe(`${row.Nombre} ${row.Apellido}`);
      expect(row.Correo.toLowerCase()).toContain(row.Nombre.toLowerCase());
    }
  });

  it("generates well-formed values for every field type", () => {
    const rows = generateRows({ columns: allColumns, count: 20, seed: 99 });
    for (const row of rows) {
      expect(row.email).toMatch(/^[a-z0-9._]+@[a-z.]+$/);
      expect(row.zipCode).toMatch(/^\d{5}$/);
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.fullName).toBe(`${row.firstName} ${row.lastName}`);
      expect(row.loremWords.split(" ")).toHaveLength(6);
      expect(row.loremParagraph.endsWith(".")).toBe(true);
    }
  });

  it("falls back to crypto randomness (non-deterministic) without a seed", () => {
    const a = generateRows({ columns: [{ key: "name", type: "fullName" }], count: 20 });
    const b = generateRows({ columns: [{ key: "name", type: "fullName" }], count: 20 });
    expect(a).not.toEqual(b);
  });
});

describe("toCsv", () => {
  const columns: Column[] = [
    { key: "Nombre", type: "firstName" },
    { key: "Ciudad", type: "city" },
  ];
  const rows: Row[] = [
    { Nombre: "Ada", Ciudad: "London" },
    { Nombre: "Grace, Jr.", Ciudad: 'Say "hi"' },
  ];

  it("builds a header from the column keys and one line per row", () => {
    const csv = toCsv(rows, columns);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Nombre,Ciudad");
    expect(lines[1]).toBe("Ada,London");
  });

  it("quotes and escapes values containing commas or quotes", () => {
    const csv = toCsv(rows, columns);
    const lines = csv.split("\n");
    expect(lines[2]).toBe('"Grace, Jr.","Say ""hi"""');
  });
});

describe("toJson", () => {
  it("serializes rows as pretty-printed JSON, keyed by column name", () => {
    const rows: Row[] = [{ Nombre: "Ada" }];
    expect(toJson(rows)).toBe(JSON.stringify(rows, null, 2));
  });
});

describe("toTypeScript", () => {
  const columns: Column[] = [
    { key: "Nombre", type: "firstName" },
    { key: "Indirizzo_Email", type: "email" },
  ];
  const rows: Row[] = [{ Nombre: "Ada", Indirizzo_Email: "ada@example.com" }];

  it("emits an interface with one string field per column", () => {
    const ts = toTypeScript(rows, columns);
    expect(ts).toContain("interface FakeDataRow {");
    expect(ts).toContain("  Nombre: string;");
    expect(ts).toContain("  Indirizzo_Email: string;");
  });

  it("emits a typed array literal with one object per row", () => {
    const ts = toTypeScript(rows, columns);
    expect(ts).toContain("const fakeData: FakeDataRow[] = [");
    expect(ts).toContain('{ Nombre: "Ada", Indirizzo_Email: "ada@example.com" },');
  });

  it("quotes column names that aren't valid identifiers", () => {
    const ts = toTypeScript(
      [{ "Full Name": "Ada" }],
      [{ key: "Full Name", type: "fullName" }],
    );
    expect(ts).toContain('  "Full Name": string;');
    expect(ts).toContain('{ "Full Name": "Ada" },');
  });

  it("escapes double quotes inside values via JSON.stringify", () => {
    const ts = toTypeScript(
      [{ Bio: 'Say "hi"' }],
      [{ key: "Bio", type: "loremWords" }],
    );
    expect(ts).toContain('{ Bio: "Say \\"hi\\"" },');
  });

  it("respects a custom interface name", () => {
    const ts = toTypeScript(rows, columns, "User");
    expect(ts).toContain("interface User {");
    expect(ts).toContain("const fakeData: User[] = [");
  });
});
