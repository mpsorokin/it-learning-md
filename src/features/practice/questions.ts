import type { InterviewQuestionMeta } from "@/lib/content.types";
import { loadLessonBody, orderedLessons } from "@/lib/content";
import { parseInterviewQuestions } from "@/lib/contentParsing";
import { questions as generatedQuestions } from "virtual:ittheory/questions";

export interface InterviewQuestion {
  id: string;
  lessonId: string;
  section: string;
  folder: string;
  prompt: string;
  promptBody?: string;
  hasAnswer?: boolean;
}

const questionsByLesson = new Map<string, InterviewQuestionMeta[]>();
for (const question of generatedQuestions as InterviewQuestionMeta[]) {
  if (!question.hasAnswer) continue;
  const items = questionsByLesson.get(question.lessonId);
  if (items) items.push(question);
  else questionsByLesson.set(question.lessonId, [question]);
}
export const interviewQuestions: InterviewQuestion[] = orderedLessons.flatMap(
  (lesson) => questionsByLesson.get(lesson.id) ?? [],
);
export const interviewQuestionsById = new Map(interviewQuestions.map((question) => [question.id, question]));

const bodyPromises = new Map<string, Promise<string>>();

export async function loadInterviewAnswer(questionId: string): Promise<string> {
  const question = interviewQuestionsById.get(questionId);
  if (!question) throw new Error(`Unknown interview question: ${questionId}`);
  let bodyPromise = bodyPromises.get(question.lessonId);
  if (!bodyPromise) {
    bodyPromise = loadLessonBody(question.lessonId);
    bodyPromises.set(question.lessonId, bodyPromise);
    bodyPromise.catch(() => bodyPromises.delete(question.lessonId));
  }
  const body = await bodyPromise;
  const parsed = parseInterviewQuestions(question.lessonId, body).find((entry) => entry.id === questionId);
  if (!parsed) throw new Error(`Missing answer for interview question: ${questionId}`);
  return parsed.answer;
}
