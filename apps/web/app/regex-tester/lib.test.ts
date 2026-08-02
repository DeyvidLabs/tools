import { describe, expect, it } from "vitest";
import { REGEX_PRESETS, buildRegex, explainRegex, findMatches, highlightText } from "./lib";

describe("REGEX_PRESETS", () => {
  it("every preset is a valid regex that matches at least once in its own sample text", () => {
    for (const preset of REGEX_PRESETS) {
      const built = buildRegex(preset.pattern, preset.flags);
      expect(built.ok, `${preset.name} should be a valid regex`).toBe(true);
      if (built.ok) {
        const matches = findMatches(built.regex, preset.sampleText);
        expect(matches.length, `${preset.name} should match its sample text`).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildRegex", () => {
  it("builds a valid regex", () => {
    const result = buildRegex("\\d+", "g");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.regex.source).toBe("\\d+");
      expect(result.regex.flags).toBe("g");
    }
  });

  it("reports an error for an invalid pattern", () => {
    const result = buildRegex("(unclosed", "");
    expect(result.ok).toBe(false);
  });

  it("reports an error for invalid flags", () => {
    const result = buildRegex("abc", "z");
    expect(result.ok).toBe(false);
  });
});

describe("findMatches", () => {
  it("finds all matches even without the g flag on the input regex", () => {
    const matches = findMatches(/\d+/, "a1 b22 c333");
    expect(matches.map((m) => m.match)).toEqual(["1", "22", "333"]);
    expect(matches.map((m) => m.index)).toEqual([1, 4, 8]);
  });

  it("collects numbered capture groups", () => {
    const matches = findMatches(/(\d+)-(\d+)/, "10-20");
    expect(matches[0].groups).toEqual([
      { name: "1", value: "10" },
      { name: "2", value: "20" },
    ]);
  });

  it("collects named capture groups", () => {
    const matches = findMatches(new RegExp("(?<year>\\d{4})-(?<month>\\d{2})"), "2024-05");
    expect(matches[0].groups).toEqual([
      { name: "1", value: "2024" },
      { name: "2", value: "05" },
      { name: "year", value: "2024" },
      { name: "month", value: "05" },
    ]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(findMatches(/xyz/, "abc")).toEqual([]);
  });
});

describe("highlightText", () => {
  it("splits text into matched and unmatched segments", () => {
    const matches = findMatches(/\d+/, "a1 b22");
    expect(highlightText("a1 b22", matches)).toEqual([
      { text: "a", matchIndex: null },
      { text: "1", matchIndex: 0 },
      { text: " b", matchIndex: null },
      { text: "22", matchIndex: 1 },
    ]);
  });

  it("returns the whole text as one unmatched segment when there are no matches", () => {
    expect(highlightText("hello", [])).toEqual([{ text: "hello", matchIndex: null }]);
  });

  it("handles a match at the very start and end of the text", () => {
    const matches = findMatches(/^a|z$/g, "abcz");
    expect(highlightText("abcz", matches)).toEqual([
      { text: "a", matchIndex: 0 },
      { text: "bc", matchIndex: null },
      { text: "z", matchIndex: 1 },
    ]);
  });
});

describe("explainRegex", () => {
  it("explains anchors, digit classes, and exact-count quantifiers", () => {
    const tokens = explainRegex("^\\d{3}$");
    expect(tokens).toEqual([
      { token: "^", description: "start of the string (or of the line, with the m flag)" },
      { token: "\\d{3}", description: "a digit (0-9), exactly 3 times" },
      { token: "$", description: "end of the string (or of the line, with the m flag)" },
    ]);
  });

  it("explains a character class and a + quantifier", () => {
    expect(explainRegex("[a-z]+")).toEqual([
      { token: "[a-z]+", description: 'one of the characters "a-z", one or more times' },
    ]);
  });

  it("explains a negated character class", () => {
    expect(explainRegex("[^abc]")).toEqual([
      { token: "[^abc]", description: 'none of the characters "abc"' },
    ]);
  });

  it("explains named capture groups", () => {
    const tokens = explainRegex("(?<year>\\d{4})");
    expect(tokens[0]).toEqual({
      token: "(?<year>",
      description: 'start of a named capturing group "year"',
    });
  });

  it("explains a lazy quantifier", () => {
    expect(explainRegex("a+?")).toEqual([
      { token: "a+?", description: 'the literal character "a", one or more times (lazy, as few as possible)' },
    ]);
  });

  it("explains optional, non-capturing groups, and alternation", () => {
    const tokens = explainRegex("(?:abc)?|d");
    expect(tokens.map((t) => t.token)).toEqual(["(?:", "a", "b", "c", ")?", "|", "d"]);
    expect(tokens[0].description).toBe("start of a non-capturing group");
    expect(tokens[4].description).toBe("end of group, the group repeats zero or one time (optional)");
    expect(tokens[5].description).toBe("or (alternation)");
  });

  it("explains lookahead and lookbehind", () => {
    expect(explainRegex("(?=x)")[0].description).toBe(
      "start of a positive lookahead (must follow, without consuming text)",
    );
    expect(explainRegex("(?!x)")[0].description).toBe("start of a negative lookahead (must not follow)");
    expect(explainRegex("(?<=x)")[0].description).toBe("start of a positive lookbehind (must precede)");
    expect(explainRegex("(?<!x)")[0].description).toBe("start of a negative lookbehind (must not precede)");
  });

  it("explains a numbered backreference", () => {
    expect(explainRegex("(a)\\1")[3]).toEqual({
      token: "\\1",
      description: "backreference to group 1",
    });
  });

  it("explains a named backreference", () => {
    const tokens = explainRegex("(?<x>a)\\k<x>");
    expect(tokens[tokens.length - 1]).toEqual({
      token: "\\k<x>",
      description: 'backreference to named group "x"',
    });
  });

  it("explains a range quantifier with only a minimum", () => {
    expect(explainRegex("a{2,}")).toEqual([
      { token: "a{2,}", description: 'the literal character "a", at least 2 times' },
    ]);
  });

  it("explains a range quantifier with min and max", () => {
    expect(explainRegex("a{2,4}")).toEqual([
      { token: "a{2,4}", description: 'the literal character "a", 2 to 4 times' },
    ]);
  });

  it("explains the dot metacharacter", () => {
    expect(explainRegex(".")).toEqual([
      { token: ".", description: "any character (except newline, unless the s flag is set)" },
    ]);
  });

  it("returns an empty array for an empty pattern", () => {
    expect(explainRegex("")).toEqual([]);
  });
});
