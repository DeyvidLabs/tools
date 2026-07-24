import { describe, expect, it } from "vitest";
import {
  ALL_SYMBOLS,
  DEFAULT_OPTIONS,
  calculateEntropyBits,
  generatePassword,
  getStrength,
  hasAnyCharacters,
  type GeneratorOptions,
} from "./lib";

const NONE: GeneratorOptions = {
  length: 20,
  uppercase: false,
  lowercase: false,
  numbers: false,
  symbolsEnabled: false,
  symbolChars: "",
  excludeAmbiguous: false,
};

describe("generatePassword", () => {
  it("always returns the requested length", () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePassword(DEFAULT_OPTIONS)).toHaveLength(DEFAULT_OPTIONS.length);
    }
  });

  it("includes at least one character from every selected category", () => {
    const options: GeneratorOptions = { ...DEFAULT_OPTIONS, length: 12 };
    for (let i = 0; i < 500; i++) {
      const pw = generatePassword(options);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect([...ALL_SYMBOLS].some((c) => pw.includes(c))).toBe(true);
    }
  });

  it("still returns the exact length when length is shorter than the category count", () => {
    const options: GeneratorOptions = { ...DEFAULT_OPTIONS, length: 2 };
    for (let i = 0; i < 50; i++) {
      expect(generatePassword(options)).toHaveLength(2);
    }
  });

  it("excludes ambiguous characters (I l 1 O 0) when requested", () => {
    const options: GeneratorOptions = {
      ...DEFAULT_OPTIONS,
      length: 200,
      symbolsEnabled: false,
      symbolChars: "",
      excludeAmbiguous: true,
    };
    expect(generatePassword(options)).not.toMatch(/[Il1O0]/);
  });

  it("only draws from the selected category when just one is on", () => {
    const options: GeneratorOptions = { ...NONE, length: 30, numbers: true };
    expect(generatePassword(options)).toMatch(/^[0-9]{30}$/);
  });

  it("returns an empty string when nothing is selected", () => {
    expect(generatePassword(NONE)).toBe("");
  });

  it("only produces characters from a restricted symbol subset", () => {
    const options: GeneratorOptions = {
      ...NONE,
      length: 200,
      symbolsEnabled: true,
      symbolChars: "$!@#",
    };
    const pw = generatePassword(options);
    expect(pw).toHaveLength(200);
    expect(pw).toMatch(/^[$!@#]+$/);
    expect(new Set(pw).size).toBe(4);
  });

  it("produces different output across consecutive calls with identical options", () => {
    expect(generatePassword(DEFAULT_OPTIONS)).not.toBe(generatePassword(DEFAULT_OPTIONS));
  });

  describe("symbols picker regression (enabled state independent from selection)", () => {
    it("Clear (empty symbolChars) does not disable the category", () => {
      const options: GeneratorOptions = {
        ...NONE,
        length: 50,
        symbolsEnabled: true,
        symbolChars: "",
      };
      expect(hasAnyCharacters(options)).toBe(false);
      expect(generatePassword(options)).toBe("");
    });

    it("picking exactly one symbol after Clear works", () => {
      const options: GeneratorOptions = {
        ...NONE,
        length: 50,
        symbolsEnabled: true,
        symbolChars: "%",
      };
      expect(hasAnyCharacters(options)).toBe(true);
      const pw = generatePassword(options);
      expect(pw).toHaveLength(50);
      expect(pw).toMatch(/^%+$/);
    });

    it("disabling symbols does not clear the previously picked subset", () => {
      const picked: GeneratorOptions = { ...NONE, symbolsEnabled: true, symbolChars: "%" };
      const disabled: GeneratorOptions = { ...picked, symbolsEnabled: false };
      expect(disabled.symbolChars).toBe("%");
      const reEnabled: GeneratorOptions = { ...disabled, symbolsEnabled: true };
      expect(reEnabled.symbolChars).toBe("%");
    });
  });
});

describe("calculateEntropyBits", () => {
  it("is 0 when nothing is selected", () => {
    expect(calculateEntropyBits(NONE)).toBe(0);
  });

  it("matches length * log2(poolSize)", () => {
    const options: GeneratorOptions = { ...NONE, length: 10, lowercase: true };
    expect(calculateEntropyBits(options)).toBeCloseTo(10 * Math.log2(26), 9);
  });
});

describe("hasAnyCharacters", () => {
  it("is false only when truly nothing is selected", () => {
    expect(hasAnyCharacters(NONE)).toBe(false);
    expect(hasAnyCharacters({ ...NONE, numbers: true })).toBe(true);
    expect(hasAnyCharacters({ ...NONE, symbolsEnabled: true, symbolChars: "$" })).toBe(true);
  });
});

describe("getStrength", () => {
  // Thresholds follow NIST SP 800-57/800-131A security-strength bands.
  it.each([
    [0, "—"],
    [79, "Weak"],
    [80, "Fair"],
    [111, "Fair"],
    [112, "Good"],
    [127, "Good"],
    [128, "Strong"],
    [191, "Strong"],
    [192, "Excellent"],
  ])("labels %i bits as %s", (bits, label) => {
    expect(getStrength(bits).label).toBe(label);
  });

  it("produces non-decreasing segment counts as bits increase", () => {
    const samples = [0, 10, 79, 80, 111, 112, 127, 128, 191, 192, 300];
    let last = -1;
    for (const bits of samples) {
      const { segments } = getStrength(bits);
      expect(segments).toBeGreaterThanOrEqual(last);
      last = segments;
    }
  });
});
