/** Shared Markdown parsing for the Vite content index and browser features. */
export function slugFromFilename(fileSlug: string): string {
  const stripped = fileSlug.replace(/^\d+[-_.]/, "");
  return stripped || fileSlug;
}

export function resolveOrder(fileSlug: string): number {
  const prefix = /^(\d+)[-_.]/.exec(fileSlug);
  return prefix ? Number.parseInt(prefix[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function humanizeSlug(slug: string): string {
  return slug
    .replace(/^\d+[-_.]/, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function titleFromMarkdown(source: string, slug: string): string {
  const match = /^#\s+(.+)$/m.exec(source);
  return match ? match[1].trim() : humanizeSlug(slug);
}

export interface ParsedInterviewQuestion {
  id: string;
  prompt: string;
  /** Markdown content that belongs to the prompt, such as a code example. */
  promptBody: string;
  answer: string;
  hasAnswer: boolean;
  hasAnswerMarker: boolean;
  hasExplicitId: boolean;
}

export function questionSlug(prompt: string): string {
  return prompt
    .replace(/`/g, "")
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

/** Headings in a fenced code sample are code, not Markdown structure. */
function markdownOutsideFences(source: string): string {
  const masked = source.split("");
  let offset = 0;
  let fenceCharacter = "";
  let fenceLength = 0;

  for (const line of source.split("\n")) {
    const content = line.endsWith("\r") ? line.slice(0, -1) : line;
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(content);
    if (fence) {
      const marker = fence[1];
      if (!fenceCharacter) {
        fenceCharacter = marker[0];
        fenceLength = marker.length;
      } else if (
        marker[0] === fenceCharacter &&
        marker.length >= fenceLength &&
        new RegExp(`^ {0,3}${fenceCharacter === "`" ? "`" : "~"}{${fenceLength},}\\s*$`).test(
          content,
        )
      ) {
        fenceCharacter = "";
        fenceLength = 0;
      }
      for (let index = 0; index < line.length; index += 1) {
        if (line[index] !== "\r") masked[offset + index] = " ";
      }
    } else if (fenceCharacter) {
      for (let index = 0; index < line.length; index += 1) {
        if (line[index] !== "\r") masked[offset + index] = " ";
      }
    }
    offset += line.length + 1;
  }

  return masked.join("");
}

function afterLine(source: string, index: number, length: number): number {
  const newline = source.indexOf("\n", index + length);
  return newline < 0 ? source.length : newline + 1;
}

const stableIdComment = /<!--\s*question-id:\s*([a-z0-9][a-z0-9-]*)\s*-->/i;
const stripStableIdComments = (value: string): string =>
  value.replace(/\s*<!--\s*question-id:\s*[a-z0-9][a-z0-9-]*\s*-->/gi, "").trim();

export function parseInterviewQuestions(lessonId: string, body: string): ParsedInterviewQuestion[] {
  const markdown = markdownOutsideFences(body);
  const marker = /^ {0,3}##[ \t]+(?:Interview questions|Вопросы на собеседовании)[ \t]*$/im.exec(
    markdown,
  );
  if (!marker) return [];

  const sectionStart = afterLine(body, marker.index, marker[0].length);
  const nextSection = /^ {0,3}##[ \t]+/m.exec(markdown.slice(sectionStart));
  const sectionEnd = nextSection ? sectionStart + nextSection.index : body.length;
  const questionsBody = markdown.slice(sectionStart, sectionEnd);
  const headings = [...questionsBody.matchAll(/^ {0,3}###(?!#)[ \t]+(.+?)[ \t]*$/gm)];

  return headings.flatMap((heading, index) => {
    const prompt = heading[1].trim();
    const headingIndex = heading.index ?? 0;
    const contentStart = afterLine(body, sectionStart + headingIndex, heading[0].length);
    const contentEnd =
      headings[index + 1]?.index === undefined
        ? sectionEnd
        : sectionStart + headings[index + 1].index;
    const questionBody = body.slice(contentStart, contentEnd);
    const stableId = stableIdComment.exec(questionBody)?.[1];
    const maskedQuestionBody = markdownOutsideFences(questionBody);
    const answerMarker = /^ {0,3}####(?!#)[ \t]+(?:Answer|Ответ)[ \t]*$/im.exec(maskedQuestionBody);

    const promptBody = answerMarker
      ? stripStableIdComments(questionBody.slice(0, answerMarker.index))
      : "";
    const answerStart = answerMarker
      ? afterLine(questionBody, answerMarker.index, answerMarker[0].length)
      : 0;
    const answer = stripStableIdComments(questionBody.slice(answerStart));
    if (!prompt) return [];

    return [
      {
        id: `${lessonId}#${stableId ?? (questionSlug(prompt) || index + 1)}`,
        prompt,
        promptBody,
        answer,
        hasAnswer: answer.length > 0,
        hasAnswerMarker: Boolean(answerMarker),
        hasExplicitId: Boolean(stableId),
      },
    ];
  });
}

/** Keep code text searchable while dropping the Markdown punctuation around it. */
export function searchableTextFromMarkdown(source: string): string {
  return source
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`{1,3}/g, " ")
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/gm, " ")
    .replace(/[*_~|]/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}
