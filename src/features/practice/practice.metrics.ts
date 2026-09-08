import type { Lesson } from "@/lib/content.types";
import type { ProgressState } from "@/features/progress/progress.types";
import type { InterviewQuestion } from "@/features/practice/questions";
import type { PracticeRating, PracticeState } from "@/features/practice/practice.types";

const intervals = [1, 3, 7, 14, 30];

export interface QuestionStatus {
  questionId: string;
  attempts: number;
  stage: number;
  lastRating?: PracticeRating;
  lastAnsweredAt?: string;
  dueDate?: string;
}

export interface PracticeSummary {
  today: number;
  due: number;
  dueTomorrow: number;
  currentStreak: number;
  bestStreak: number;
  seen: number;
  mastered: number;
  weak: InterviewQuestion[];
  activity: Array<{ date: string; count: number }>;
}

export const dayKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function shiftDay(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

function questionAttempts(state: PracticeState, questionId: string) {
  return Object.values(state.attempts)
    .filter((attempt) => attempt.questionId === questionId)
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt) || a.updatedAt.localeCompare(b.updatedAt));
}

export function questionStatus(state: PracticeState, questionId: string): QuestionStatus {
  const attempts = questionAttempts(state, questionId);
  let stage = 0;
  for (const attempt of attempts) {
    if (attempt.rating === "again") stage = 0;
    else if (attempt.rating === "known") stage = Math.min(intervals.length, stage + 1);
  }

  const last = attempts.at(-1);
  if (!last) return { questionId, attempts: 0, stage: 0 };

  const waitDays = last.rating === "again" ? 0 : last.rating === "hard" ? 1 : intervals[Math.max(0, stage - 1)];
  return {
    questionId,
    attempts: attempts.length,
    stage,
    lastRating: last.rating,
    lastAnsweredAt: last.answeredAt,
    dueDate: shiftDay(last.studyDate, waitDays),
  };
}

function completedQuestionIds(progress: ProgressState, questions: InterviewQuestion[]): Set<string> {
  return new Set(
    questions
      .filter((question) => Boolean(progress.lessons[question.lessonId]))
      .map((question) => question.id),
  );
}

export function practiceQueue(
  progress: ProgressState,
  state: PracticeState,
  questions: InterviewQuestion[],
  now = new Date(),
): InterviewQuestion[] {
  const today = dayKey(now);
  const completed = completedQuestionIds(progress, questions);
  const available = questions.filter((question) => completed.has(question.id));
  const ranked = available.map((question, index) => {
    const status = questionStatus(state, question.id);
    const unseen = status.attempts === 0;
    const due = !unseen && Boolean(status.dueDate && status.dueDate <= today);
    const weak = status.lastRating === "again" || status.lastRating === "hard";
    return { question, index, unseen, due, weak, dueDate: status.dueDate ?? "" };
  });

  const actionable = ranked.filter((entry) => entry.due || entry.weak || entry.unseen);
  return actionable
    .sort((a, b) => {
      const priority = (entry: typeof a) => (entry.due ? 0 : entry.weak ? 1 : entry.unseen ? 2 : 3);
      return priority(a) - priority(b) || a.dueDate.localeCompare(b.dueDate) || a.index - b.index;
    })
    .map((entry) => entry.question);
}

function streaks(dates: Set<string>, today: string): { current: number; best: number } {
  const start = dates.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  for (let cursor = start; dates.has(cursor); cursor = shiftDay(cursor, -1)) current += 1;

  let best = 0;
  const sorted = [...dates].sort();
  let run = 0;
  let previous = "";
  for (const date of sorted) {
    run = previous && shiftDay(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return { current, best };
}

export function practiceSummary(
  progress: ProgressState,
  state: PracticeState,
  questions: InterviewQuestion[],
  now = new Date(),
): PracticeSummary {
  const today = dayKey(now);
  const tomorrow = shiftDay(today, 1);
  const available = questions.filter((question) => Boolean(progress.lessons[question.lessonId]));
  const statuses = available.map((question) => ({ question, status: questionStatus(state, question.id) }));
  const todayAttempts = Object.values(state.attempts).filter((attempt) => attempt.studyDate === today).length;
  const due = statuses.filter(({ status }) => status.attempts > 0 && Boolean(status.dueDate && status.dueDate <= today)).length;
  const dueTomorrow = statuses.filter(({ status }) => status.dueDate === tomorrow).length;
  const dates = new Set(Object.values(state.attempts).map((attempt) => attempt.studyDate));
  const activity = Array.from({ length: 28 }, (_, index) => {
    const date = shiftDay(today, index - 27);
    return { date, count: Object.values(state.attempts).filter((attempt) => attempt.studyDate === date).length };
  });
  const streak = streaks(dates, today);

  return {
    today: todayAttempts,
    due,
    dueTomorrow,
    currentStreak: streak.current,
    bestStreak: streak.best,
    seen: statuses.filter(({ status }) => status.attempts > 0).length,
    mastered: statuses.filter(({ status }) => status.stage >= 3).length,
    weak: statuses
      .filter(({ status }) => status.lastRating === "again" || status.lastRating === "hard")
      .sort((a, b) => (a.status.lastAnsweredAt ?? "").localeCompare(b.status.lastAnsweredAt ?? ""))
      .map(({ question }) => question)
      .slice(0, 5),
    activity,
  };
}

export const lessonDateActivity = (progress: ProgressState, lessons: Lesson[], now = new Date()) => {
  const today = dayKey(now);
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    const completed = progress.lessons[lesson.id];
    if (!completed) continue;
    const date = dayKey(new Date(completed.completedAt));
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return Array.from({ length: 28 }, (_, index) => {
    const date = shiftDay(today, index - 27);
    return { date, count: counts.get(date) ?? 0 };
  });
};
