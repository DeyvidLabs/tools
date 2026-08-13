import { describe, expect, it } from "vitest";
import {
  buildBoxShadow,
  buildCircleClipPath,
  buildEllipseClipPath,
  buildInsetClipPath,
  buildLinearGradient,
  buildPolygonClipPath,
  buildRadialGradient,
  POLYGON_PRESETS,
} from "./lib";

describe("buildLinearGradient", () => {
  it("formats the angle and color stops", () => {
    expect(
      buildLinearGradient(90, [
        { color: "#6366f1", position: 0 },
        { color: "#ec4899", position: 100 },
      ]),
    ).toBe("linear-gradient(90deg, #6366f1 0%, #ec4899 100%)");
  });

  it("supports more than two stops", () => {
    expect(
      buildLinearGradient(45, [
        { color: "#fff", position: 0 },
        { color: "#888", position: 50 },
        { color: "#000", position: 100 },
      ]),
    ).toBe("linear-gradient(45deg, #fff 0%, #888 50%, #000 100%)");
  });
});

describe("buildRadialGradient", () => {
  it("formats shape, position, and stops", () => {
    expect(
      buildRadialGradient("circle", "center", [
        { color: "#fff", position: 0 },
        { color: "#000", position: 100 },
      ]),
    ).toBe("radial-gradient(circle at center, #fff 0%, #000 100%)");
  });

  it("supports ellipse shape and custom positions", () => {
    expect(buildRadialGradient("ellipse", "top left", [{ color: "#fff", position: 0 }])).toBe(
      "radial-gradient(ellipse at top left, #fff 0%)",
    );
  });
});

describe("buildBoxShadow", () => {
  it("formats a single non-inset layer", () => {
    expect(buildBoxShadow([{ x: 0, y: 4, blur: 12, spread: 0, color: "rgba(0,0,0,0.35)", inset: false }])).toBe(
      "0px 4px 12px 0px rgba(0,0,0,0.35)",
    );
  });

  it("prefixes inset layers with 'inset'", () => {
    expect(buildBoxShadow([{ x: 1, y: 2, blur: 3, spread: 4, color: "#000", inset: true }])).toBe(
      "inset 1px 2px 3px 4px #000",
    );
  });

  it("joins multiple layers with a comma", () => {
    expect(
      buildBoxShadow([
        { x: 0, y: 1, blur: 2, spread: 0, color: "#111", inset: false },
        { x: 0, y: 2, blur: 4, spread: 0, color: "#222", inset: true },
      ]),
    ).toBe("0px 1px 2px 0px #111, inset 0px 2px 4px 0px #222");
  });
});

describe("clip-path builders", () => {
  it("builds a circle()", () => {
    expect(buildCircleClipPath({ radius: 50, x: 50, y: 50 })).toBe("circle(50% at 50% 50%)");
  });

  it("builds an ellipse()", () => {
    expect(buildEllipseClipPath({ rx: 40, ry: 30, x: 50, y: 50 })).toBe("ellipse(40% 30% at 50% 50%)");
  });

  it("builds an inset() without rounding when round is 0", () => {
    expect(buildInsetClipPath({ top: 10, right: 10, bottom: 10, left: 10, round: 0 })).toBe("inset(10% 10% 10% 10%)");
  });

  it("builds an inset() with rounding when round is set", () => {
    expect(buildInsetClipPath({ top: 10, right: 10, bottom: 10, left: 10, round: 8 })).toBe(
      "inset(10% 10% 10% 10% round 8px)",
    );
  });

  it("builds a polygon() from a point list", () => {
    expect(buildPolygonClipPath("50% 0%, 0% 100%, 100% 100%")).toBe("polygon(50% 0%, 0% 100%, 100% 100%)");
  });

  it("exposes at least one named preset with a valid point list", () => {
    expect(POLYGON_PRESETS.length).toBeGreaterThan(0);
    for (const preset of POLYGON_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.points).toMatch(/^\d+% \d+%(, \d+% \d+%)*$/);
    }
  });
});
