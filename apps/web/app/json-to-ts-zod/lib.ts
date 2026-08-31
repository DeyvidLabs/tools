export type Shape =
  | { kind: "null" }
  | { kind: "boolean" }
  | { kind: "number" }
  | { kind: "string" }
  | { kind: "unknown" }
  | { kind: "array"; item: Shape }
  | { kind: "object"; fields: FieldEntry[] }
  | { kind: "union"; options: Shape[] };

export interface FieldEntry {
  key: string;
  shape: Shape;
  optional: boolean;
}

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };
export type GenerateResult = { ok: true; output: string } | { ok: false; error: string };

export function parseJsonSample(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

export function inferShape(value: unknown): Shape {
  if (value === null) return { kind: "null" };
  if (typeof value === "boolean") return { kind: "boolean" };
  if (typeof value === "number") return { kind: "number" };
  if (typeof value === "string") return { kind: "string" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", item: { kind: "unknown" } };
    let item = inferShape(value[0]);
    for (let i = 1; i < value.length; i++) item = mergeShapes(item, inferShape(value[i]));
    return { kind: "array", item };
  }
  const obj = value as Record<string, unknown>;
  const fields = Object.keys(obj).map((key) => ({ key, shape: inferShape(obj[key]), optional: false }));
  return { kind: "object", fields };
}

export function shapeEquals(a: Shape, b: Shape): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "null":
    case "boolean":
    case "number":
    case "string":
    case "unknown":
      return true;
    case "array":
      return shapeEquals(a.item, (b as Extract<Shape, { kind: "array" }>).item);
    case "object": {
      const bFields = (b as Extract<Shape, { kind: "object" }>).fields;
      if (a.fields.length !== bFields.length) return false;
      const bByKey = new Map(bFields.map((f) => [f.key, f]));
      return a.fields.every((f) => {
        const bf = bByKey.get(f.key);
        return bf !== undefined && bf.optional === f.optional && shapeEquals(f.shape, bf.shape);
      });
    }
    case "union": {
      const bOptions = (b as Extract<Shape, { kind: "union" }>).options;
      if (a.options.length !== bOptions.length) return false;
      return a.options.every((o) => bOptions.some((bo) => shapeEquals(o, bo)));
    }
  }
}

// Merges the shapes inferred from two elements of the same array (or two
// samples of the same field) into one shape that describes both: matching
// object keys merge recursively, a key present in only one side becomes
// optional (that's the only source of "optional" in the output — a single
// JSON sample has no other way to express it), and differing primitive
// kinds (or null) collapse into a union rather than picking one arbitrarily.
export function mergeShapes(a: Shape, b: Shape): Shape {
  if (a.kind === "unknown") return b;
  if (b.kind === "unknown") return a;

  if (a.kind === "object" && b.kind === "object") {
    const bByKey = new Map(b.fields.map((f) => [f.key, f]));
    const seen = new Set<string>();
    const fields: FieldEntry[] = [];
    for (const f of a.fields) {
      seen.add(f.key);
      const bf = bByKey.get(f.key);
      if (bf) {
        fields.push({ key: f.key, shape: mergeShapes(f.shape, bf.shape), optional: f.optional || bf.optional });
      } else {
        fields.push({ key: f.key, shape: f.shape, optional: true });
      }
    }
    for (const f of b.fields) {
      if (!seen.has(f.key)) fields.push({ key: f.key, shape: f.shape, optional: true });
    }
    return { kind: "object", fields };
  }

  if (a.kind === "array" && b.kind === "array") {
    return { kind: "array", item: mergeShapes(a.item, b.item) };
  }

  if (shapeEquals(a, b)) return a;

  const options = [...(a.kind === "union" ? a.options : [a]), ...(b.kind === "union" ? b.options : [b])];
  const deduped: Shape[] = [];
  for (const opt of options) {
    if (!deduped.some((d) => shapeEquals(d, opt))) deduped.push(opt);
  }
  return deduped.length === 1 ? deduped[0] : { kind: "union", options: deduped };
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function formatKey(key: string): string {
  return IDENTIFIER_RE.test(key) ? key : JSON.stringify(key);
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function renderObjectTs(fields: FieldEntry[], level: number): string {
  if (fields.length === 0) return "{}";
  const lines = fields.map((f) => {
    const optionalMark = f.optional ? "?" : "";
    const typeStr = renderTypeExprTs(f.shape, level + 1);
    return `${indent(level + 1)}${formatKey(f.key)}${optionalMark}: ${typeStr};`;
  });
  return `{\n${lines.join("\n")}\n${indent(level)}}`;
}

function renderTypeExprTs(shape: Shape, level: number): string {
  switch (shape.kind) {
    case "null":
      return "null";
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "unknown":
      return "unknown";
    case "array": {
      const itemStr = renderTypeExprTs(shape.item, level);
      return shape.item.kind === "union" ? `(${itemStr})[]` : `${itemStr}[]`;
    }
    case "object":
      return renderObjectTs(shape.fields, level);
    case "union":
      return shape.options.map((o) => renderTypeExprTs(o, level)).join(" | ");
  }
}

export function renderTypeScript(shape: Shape, rootName = "Root"): string {
  if (shape.kind === "object") {
    return `interface ${rootName} ${renderObjectTs(shape.fields, 0)}\n`;
  }
  return `type ${rootName} = ${renderTypeExprTs(shape, 0)};\n`;
}

// z.union([X, z.null()]) works but isn't idiomatic Zod — .nullable() reads
// better, so a union that's just "something or null" is unwrapped here and
// rendered as that something with a trailing .nullable() instead.
function extractNullable(shape: Shape): { shape: Shape; nullable: boolean } {
  if (shape.kind === "union") {
    const hasNull = shape.options.some((o) => o.kind === "null");
    if (hasNull) {
      const rest = shape.options.filter((o) => o.kind !== "null");
      const collapsed: Shape = rest.length === 1 ? rest[0] : { kind: "union", options: rest };
      return { shape: collapsed, nullable: true };
    }
  }
  return { shape, nullable: false };
}

function renderObjectZod(fields: FieldEntry[], level: number): string {
  if (fields.length === 0) return "z.object({})";
  const lines = fields.map((f) => {
    const { shape, nullable } = extractNullable(f.shape);
    let expr = renderZodExpr(shape, level + 1);
    if (nullable) expr += ".nullable()";
    if (f.optional) expr += ".optional()";
    return `${indent(level + 1)}${formatKey(f.key)}: ${expr},`;
  });
  return `z.object({\n${lines.join("\n")}\n${indent(level)}})`;
}

function renderZodExpr(shape: Shape, level: number): string {
  switch (shape.kind) {
    case "null":
      return "z.null()";
    case "boolean":
      return "z.boolean()";
    case "number":
      return "z.number()";
    case "string":
      return "z.string()";
    case "unknown":
      return "z.unknown()";
    case "array": {
      const { shape: itemShape, nullable } = extractNullable(shape.item);
      let expr = renderZodExpr(itemShape, level);
      if (nullable) expr += ".nullable()";
      return `z.array(${expr})`;
    }
    case "object":
      return renderObjectZod(shape.fields, level);
    case "union":
      return `z.union([${shape.options.map((o) => renderZodExpr(o, level)).join(", ")}])`;
  }
}

export function renderZodSchema(shape: Shape, rootName = "Root"): string {
  const { shape: topShape, nullable } = extractNullable(shape);
  let expr = renderZodExpr(topShape, 0);
  if (nullable) expr += ".nullable()";
  return `const ${rootName}Schema = ${expr};\n`;
}

export function generateTypeScript(jsonText: string, rootName = "Root"): GenerateResult {
  const parsed = parseJsonSample(jsonText);
  if (!parsed.ok) return parsed;
  return { ok: true, output: renderTypeScript(inferShape(parsed.value), rootName) };
}

export function generateZodSchema(jsonText: string, rootName = "Root"): GenerateResult {
  const parsed = parseJsonSample(jsonText);
  if (!parsed.ok) return parsed;
  return { ok: true, output: renderZodSchema(inferShape(parsed.value), rootName) };
}
