import { normalizeSearchTerm } from "../normalize";

describe("normalizeSearchTerm", () => {
  it("converts to lowercase", () => {
    expect(normalizeSearchTerm("DIPIRONA")).toBe("dipirona");
  });

  it("trims and collapses whitespace", () => {
    expect(normalizeSearchTerm("  dipirona   500mg  ")).toBe("dipirona 500mg");
  });

  it("removes accents", () => {
    expect(normalizeSearchTerm("farmácia drogão")).toBe("farmacia drogao");
  });

  it("standardizes dosage spacing", () => {
    expect(normalizeSearchTerm("dipirona 500 mg")).toBe("dipirona 500mg");
  });

  it("converts grams to mg", () => {
    expect(normalizeSearchTerm("amoxicilina 1g")).toBe("amoxicilina 1000mg");
  });

  it("handles combined normalization", () => {
    expect(normalizeSearchTerm("  DIPIRONA Sódica  500 mg ")).toBe(
      "dipirona sodica 500mg"
    );
  });

  it("returns empty string for empty input", () => {
    expect(normalizeSearchTerm("")).toBe("");
    expect(normalizeSearchTerm("   ")).toBe("");
  });
});
