import type { Lesson } from "@/lib/content.types";
import { orderedLessons } from "@/lib/content";

export interface InterviewQuestion {
  id: string;
  lessonId: string;
  section: string;
  folder: string;
  prompt: string;
  answer: string;
}

const interviewHeading = /^##\s+(?:Interview questions|Вопросы на собеседовании)\s*$/im;
const headingPattern = /^###\s+(.+?)\s*$/gm;

function questionSlug(prompt: string): string {
  return prompt
    .replace(/`/g, "")
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

export function extractInterviewQuestions(lesson: Lesson): InterviewQuestion[] {
  const marker = interviewHeading.exec(lesson.body);
  if (!marker) return [];

  const section = lesson.body.slice(marker.index + marker[0].length);
  const nextSection = /^##\s+/m.exec(section);
  const body = nextSection ? section.slice(0, nextSection.index) : section;
  const headings = [...body.matchAll(headingPattern)];

  return headings.flatMap((heading, index) => {
    const prompt = heading[1].trim();
    const answerStart = (heading.index ?? 0) + heading[0].length;
    const answerEnd = headings[index + 1]?.index ?? body.length;
    const answer = body.slice(answerStart, answerEnd).trim();
    if (!prompt || !answer) return [];

    return [{
      id: `${lesson.id}#${questionSlug(prompt) || index + 1}`,
      lessonId: lesson.id,
      section: lesson.section,
      folder: lesson.folder,
      prompt,
      answer,
    }];
  });
}

export const interviewQuestions = orderedLessons.flatMap(extractInterviewQuestions);
export const interviewQuestionsById = new Map(interviewQuestions.map((question) => [question.id, question]));
