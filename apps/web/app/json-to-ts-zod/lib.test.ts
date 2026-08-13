import { describe, expect, it } from "vitest";
import {
  generateTypeScript,
  generateZodSchema,
  inferShape,
  mergeShapes,
  renderTypeScript,
  renderZodSchema,
  shapeEquals,
  type Shape,
} from "./lib";

describe("inferShape", () => {
  it("infers primitive kinds", () => {
    expect(inferShape(null)).toEqual({ kind: "null" });
    expect(inferShape(true)).toEqual({ kind: "boolean" });
    expect(inferShape(42)).toEqual({ kind: "number" });
    expect(inferShape("x")).toEqual({ kind: "string" });
  });

  it("infers an object's fields as non-optional", () => {
    expect(inferShape({ a: 1, b: "x" })).toEqual({
      kind: "object",
      fields: [
        { key: "a", shape: { kind: "number" }, optional: false },
        { key: "b", shape: { kind: "string" }, optional: false },
      ],
    });
  });

  it("infers an empty array as an array of unknown", () => {
    expect(inferShape([])).toEqual({ kind: "array", item: { kind: "unknown" } });
  });

  it("infers a homogeneous array's item type", () => {
    expect(inferShape([1, 2, 3])).toEqual({ kind: "array", item: { kind: "number" } });
  });

  it("merges an array of objects, marking keys missing from some elements as optional", () => {
    const shape = inferShape([{ a: 1, b: "x" }, { a: 2 }]);
    expect(shape).toEqual({
      kind: "array",
      item: {
        kind: "object",
        fields: [
          { key: "a", shape: { kind: "number" }, optional: false },
          { key: "b", shape: { kind: "string" }, optional: true },
        ],
      },
    });
  });

  it("unions differing primitive types across array elements", () => {
    const shape = inferShape([1, "x"]);
    expect(shape).toEqual({
      kind: "array",
      item: { kind: "union", options: [{ kind: "number" }, { kind: "string" }] },
    });
  });

  it("unions a value with null across array elements into a nullable-looking union", () => {
    const shape = inferShape([1, null]);
    expect(shape).toEqual({
      kind: "array",
      item: { kind: "union", options: [{ kind: "number" }, { kind: "null" }] },
    });
  });

  it("infers nested arrays and objects", () => {
    expect(inferShape({ tags: ["a", "b"] })).toEqual({
      kind: "object",
      fields: [{ key: "tags", shape: { kind: "array", item: { kind: "string" } }, optional: false }],
    });
  });
});

describe("mergeShapes", () => {
  it("collapses two identical shapes into one instead of a union", () => {
    const a: Shape = { kind: "string" };
    const b: Shape = { kind: "string" };
    expect(mergeShapes(a, b)).toEqual({ kind: "string" });
  });

  it("merges nested object shapes recursively", () => {
    const a: Shape = { kind: "object", fields: [{ key: "x", shape: { kind: "object", fields: [{ key: "y", shape: { kind: "number" }, optional: false }] }, optional: false }] };
    const b: Shape = { kind: "object", fields: [{ key: "x", shape: { kind: "object", fields: [{ key: "z", shape: { kind: "string" }, optional: false }] }, optional: false }] };
    const merged = mergeShapes(a, b);
    expect(merged).toEqual({
      kind: "object",
      fields: [
        {
          key: "x",
          optional: false,
          shape: {
            kind: "object",
            fields: [
              { key: "y", shape: { kind: "number" }, optional: true },
              { key: "z", shape: { kind: "string" }, optional: true },
            ],
          },
        },
      ],
    });
  });

  it("flattens unions instead of nesting them", () => {
    const a: Shape = { kind: "union", options: [{ kind: "number" }, { kind: "string" }] };
    const b: Shape = { kind: "boolean" };
    const merged = mergeShapes(a, b);
    expect(merged).toEqual({
      kind: "union",
      options: [{ kind: "number" }, { kind: "string" }, { kind: "boolean" }],
    });
  });

  it("treats unknown (from an empty array) as absorbed by the other side", () => {
    expect(mergeShapes({ kind: "unknown" }, { kind: "string" })).toEqual({ kind: "string" });
    expect(mergeShapes({ kind: "string" }, { kind: "unknown" })).toEqual({ kind: "string" });
  });
});

describe("shapeEquals", () => {
  it("compares object shapes by key set, optionality, and nested shape", () => {
    const a: Shape = { kind: "object", fields: [{ key: "a", shape: { kind: "number" }, optional: false }] };
    const b: Shape = { kind: "object", fields: [{ key: "a", shape: { kind: "number" }, optional: false }] };
    const c: Shape = { kind: "object", fields: [{ key: "a", shape: { kind: "number" }, optional: true }] };
    expect(shapeEquals(a, b)).toBe(true);
    expect(shapeEquals(a, c)).toBe(false);
  });
});

describe("renderTypeScript", () => {
  it("renders a flat object as an interface", () => {
    const shape = inferShape({ name: "bob", age: 30 });
    expect(renderTypeScript(shape, "Root")).toBe("interface Root {\n  name: string;\n  age: number;\n}\n");
  });

  it("renders optional fields with a question mark", () => {
    const arrShape = inferShape([{ a: 1, b: "x" }, { a: 2 }]) as Extract<Shape, { kind: "array" }>;
    expect(renderTypeScript(arrShape.item, "Root")).toBe(
      "interface Root {\n  a: number;\n  b?: string;\n}\n",
    );
  });

  it("renders a nested object inline", () => {
    const shape = inferShape({ address: { city: "NY", zip: "10001" } });
    expect(renderTypeScript(shape, "Root")).toBe(
      "interface Root {\n  address: {\n    city: string;\n    zip: string;\n  };\n}\n",
    );
  });

  it("renders a top-level array as a type alias", () => {
    const shape = inferShape(["a", "b"]);
    expect(renderTypeScript(shape, "Tags")).toBe("type Tags = string[];\n");
  });

  it("renders a top-level primitive as a type alias", () => {
    expect(renderTypeScript({ kind: "number" }, "Count")).toBe("type Count = number;\n");
  });

  it("parenthesizes a union item type in an array", () => {
    const shape = inferShape([1, "x"]);
    expect(renderTypeScript(shape, "Mixed")).toBe("type Mixed = (number | string)[];\n");
  });

  it("quotes a non-identifier key", () => {
    const shape = inferShape({ "foo-bar": 1 });
    expect(renderTypeScript(shape, "Root")).toBe('interface Root {\n  "foo-bar": number;\n}\n');
  });

  it("renders an empty object compactly", () => {
    expect(renderTypeScript(inferShape({}), "Root")).toBe("interface Root {}\n");
  });
});

describe("renderZodSchema", () => {
  it("renders a flat object", () => {
    const shape = inferShape({ name: "bob", age: 30 });
    expect(renderZodSchema(shape, "Root")).toBe(
      "const RootSchema = z.object({\n  name: z.string(),\n  age: z.number(),\n});\n",
    );
  });

  it("marks optional fields with .optional()", () => {
    const arrShape = inferShape([{ a: 1, b: "x" }, { a: 2 }]) as Extract<Shape, { kind: "array" }>;
    expect(renderZodSchema(arrShape.item, "Root")).toBe(
      "const RootSchema = z.object({\n  a: z.number(),\n  b: z.string().optional(),\n});\n",
    );
  });

  it("renders a nullable field with .nullable() instead of a raw union", () => {
    const arrShape = inferShape([{ a: 1 }, { a: null }]) as Extract<Shape, { kind: "array" }>;
    expect(renderZodSchema(arrShape.item, "Root")).toBe(
      "const RootSchema = z.object({\n  a: z.number().nullable(),\n});\n",
    );
  });

  it("renders a top-level array", () => {
    expect(renderZodSchema(inferShape(["a", "b"]), "Tags")).toBe("const TagsSchema = z.array(z.string());\n");
  });

  it("renders a mixed-type union with z.union", () => {
    const arrShape = inferShape([1, "x"]) as Extract<Shape, { kind: "array" }>;
    expect(renderZodSchema(arrShape.item, "Item")).toBe("const ItemSchema = z.union([z.number(), z.string()]);\n");
  });

  it("quotes a non-identifier key", () => {
    const shape = inferShape({ "foo-bar": 1 });
    expect(renderZodSchema(shape, "Root")).toBe('const RootSchema = z.object({\n  "foo-bar": z.number(),\n});\n');
  });

  it("renders an empty object compactly", () => {
    expect(renderZodSchema(inferShape({}), "Root")).toBe("const RootSchema = z.object({});\n");
  });
});

describe("generateTypeScript / generateZodSchema", () => {
  it("parses JSON text end-to-end into a TypeScript interface", () => {
    const result = generateTypeScript('{"a": 1}', "Root");
    expect(result).toEqual({ ok: true, output: "interface Root {\n  a: number;\n}\n" });
  });

  it("parses JSON text end-to-end into a Zod schema", () => {
    const result = generateZodSchema('{"a": 1}', "Root");
    expect(result).toEqual({ ok: true, output: "const RootSchema = z.object({\n  a: z.number(),\n});\n" });
  });

  it("reports an error for invalid JSON", () => {
    expect(generateTypeScript("{not valid", "Root").ok).toBe(false);
    expect(generateZodSchema("{not valid", "Root").ok).toBe(false);
  });
});
