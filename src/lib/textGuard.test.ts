import { describe, expect, it } from "vitest";
import { checkText } from "./textGuard";

describe("checkText", () => {
  it("accepts ordinary house rules", () => {
    const r = checkText("Vegetarian food only in the flat. No smoking. Visitors until 9 pm. Quiet after 10.");
    expect(r.verdict).toBe("ok");
  });

  it("rejects religion terms", () => {
    expect(checkText("Only Hindu family preferred").verdict).toBe("reject");
    expect(checkText("no muslim tenants").verdict).toBe("reject");
    expect(checkText("Jain family only").verdict).toBe("reject");
  });

  it("rejects caste and community terms", () => {
    expect(checkText("Brahmin tenants only").verdict).toBe("reject");
    expect(checkText("Same community please").verdict).toBe("reject");
  });

  it("rejects obfuscated spellings", () => {
    expect(checkText("m u s l i m").verdict).toBe("reject");
    expect(checkText("Mus1im not welcome").verdict).toBe("reject");
    expect(checkText("H1ndu only").verdict).toBe("reject");
  });

  it("rejects Devanagari and Gujarati script terms", () => {
    expect(checkText("सिर्फ हिंदू परिवार").verdict).toBe("reject");
    expect(checkText("માત્ર જૈન પરિવાર").verdict).toBe("reject");
  });

  it("rejects region of origin used as a filter", () => {
    expect(checkText("Only Gujarati family").verdict).toBe("reject");
    expect(checkText("No outsiders").verdict).toBe("reject");
    expect(checkText("North Indian not preferred").verdict).toBe("reject");
  });

  it("only flags a region word that is not used as a filter", () => {
    const r = checkText("Near the Gujarati Sahitya Parishad building");
    expect(r.verdict).toBe("flag");
  });

  it("flags surnames for review instead of rejecting", () => {
    const r = checkText("Flat available on Patel Colony road");
    expect(r.verdict).toBe("flag");
    expect(r.matches.some((m) => m.category === "surname")).toBe(true);
  });

  it("allows ordinary uses of the word community in property descriptions", () => {
    expect(checkText("Well-kept gated community with a community hall and garden").verdict).toBe("ok");
    expect(checkText("Same community preferred").verdict).toBe("reject");
  });

  it("does not flag substrings inside other words", () => {
    expect(checkText("Shahibaug road, close to the metro").verdict).toBe("ok");
    expect(checkText("Singhal Tower is nearby").verdict).toBe("ok");
  });
});
