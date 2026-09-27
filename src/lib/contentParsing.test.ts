import { describe, expect, it } from "vitest";
import { normalizeSearchText, parseInterviewQuestions, searchableTextFromMarkdown } from "@/lib/contentParsing";

describe("content parsing", () => {
  it("extracts stable practice question ids and answers from a lesson section", () => {
    const questions = parseInterviewQuestions("python/runtime/names", [
      "# Names",
      "## Interview questions",
      "### What is a name?",
      "A name refers to an object.",
      "### How does rebinding work?",
      "Rebinding changes which object a name refers to.",
      "## Further reading",
      "Not a question.",
    ].join("\n\n"));

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      id: "python/runtime/names#what-is-a-name",
      prompt: "What is a name?",
      answer: "A name refers to an object.",
      hasAnswer: true,
    });
  });

  it("keeps blank answers separate from question conditions and fenced code", () => {
    const questions = parseInterviewQuestions("fullstack-interview/react-state/03-updaters", [
      "# State updates",
      "## Interview questions",
      "### Why can this callback use stale state?",
      "<!-- question-id: updater-stale-state -->",
      "Compare the call with the functional updater.",
      "```ts",
      "const handler = () => setCount(count + 1);",
      "### Not another question",
      "```",
      "#### Ответ",
      "",
      "### What does the functional updater receive?",
      "<!-- question-id: updater-argument -->",
      "#### Ответ",
      "It receives the previous state value.",
    ].join("\n\n"));

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({
      id: "fullstack-interview/react-state/03-updaters#updater-stale-state",
      promptBody: expect.stringContaining("const handler = () => setCount(count + 1);"),
      answer: "",
      hasAnswer: false,
      hasAnswerMarker: true,
      hasExplicitId: true,
    });
    expect(questions[0].promptBody).toContain("### Not another question");
    expect(questions[0].promptBody).not.toContain("question-id:");
    expect(questions[1]).toMatchObject({
      id: "fullstack-interview/react-state/03-updaters#updater-argument",
      answer: "It receives the previous state value.",
      hasAnswer: true,
      hasAnswerMarker: true,
      hasExplicitId: true,
    });
  });

  it("keeps code searchable and normalizes Cyrillic case and ё", () => {
    expect(searchableTextFromMarkdown("## Example\n\n```ts\nconst answer = 42;\n```\n\n**Ёж**")).toContain("const answer = 42;");
    expect(normalizeSearchText("ЁЖ TypeScript")).toBe("еж typescript");
  });

  it("preserves generic and JSX-like syntax while indexing code", () => {
    const text = searchableTextFromMarkdown("```ts\nconst values: Array<{ id: string }> = [];\n```");
    expect(text).toContain("Array<{ id: string }>");
  });
});
