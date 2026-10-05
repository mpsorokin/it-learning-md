import type {
  PracticeAttempt,
  PracticeRating,
  PracticeState,
} from "@/features/practice/practice.types";
import type { InterviewQuestion } from "@/features/practice/questions";
import { isCompleted } from "@/features/progress/metrics";
import type { ProgressState } from "@/features/progress/progress.types";
import type { Lesson } from "@/lib/content.types";

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

export interface PracticeOverviewSummary {
  today: number;
  due: number;
  currentStreak: number;
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

function indexAttempts(state: PracticeState): Map<string, PracticeAttempt[]> {
  const byQuestion = new Map<string, PracticeAttempt[]>();
  for (const attempt of Object.values(state.attempts)) {
    const attempts = byQuestion.get(attempt.questionId);
    if (attempts) attempts.push(attempt);
    else byQuestion.set(attempt.questionId, [attempt]);
  }
  for (const attempts of byQuestion.values()) {
    attempts.sort(
      (a, b) => a.answeredAt.localeCompare(b.answeredAt) || a.updatedAt.localeCompare(b.updatedAt),
    );
  }
  return byQuestion;
}

function statusFromAttempts(questionId: string, attempts: PracticeAttempt[] = []): QuestionStatus {
  let stage = 0;
  for (const attempt of attempts) {
    if (attempt.rating === "again") stage = 0;
    else if (attempt.rating === "known") stage = Math.min(intervals.length, stage + 1);
  }

  const last = attempts.at(-1);
  if (!last) return { questionId, attempts: 0, stage: 0 };

  const waitDays =
    last.rating === "again" ? 0 : last.rating === "hard" ? 1 : intervals[Math.max(0, stage - 1)];
  return {
    questionId,
    attempts: attempts.length,
    stage,
    lastRating: last.rating,
    lastAnsweredAt: last.answeredAt,
    dueDate: shiftDay(last.studyDate, waitDays),
  };
}

export function questionStatus(state: PracticeState, questionId: string): QuestionStatus {
  return statusFromAttempts(questionId, indexAttempts(state).get(questionId));
}

function completedQuestionIds(
  progress: ProgressState,
  questions: InterviewQuestion[],
): Set<string> {
  return new Set(
    questions
      .filter((question) => isCompleted(progress, question.lessonId))
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
  const attemptsByQuestion = indexAttempts(state);
  const ranked = available.map((question, index) => {
    const status = statusFromAttempts(question.id, attemptsByQuestion.get(question.id));
    const unseen = status.attempts === 0;
    const due = !unseen && Boolean(status.dueDate && status.dueDate <= today);
    return { question, index, unseen, due, dueDate: status.dueDate ?? "" };
  });

  const actionable = ranked.filter((entry) => entry.due || entry.unseen);
  return actionable
    .sort((a, b) => {
      const priority = (entry: typeof a) => (entry.due ? 0 : 1);
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
  const available = questions.filter((question) => isCompleted(progress, question.lessonId));
  const attempts = Object.values(state.attempts);
  const attemptsByQuestion = indexAttempts(state);
  const statuses = available.map((question) => ({
    question,
    status: statusFromAttempts(question.id, attemptsByQuestion.get(question.id)),
  }));
  const activityCounts = new Map<string, number>();
  const dates = new Set<string>();
  for (const attempt of attempts) {
    activityCounts.set(attempt.studyDate, (activityCounts.get(attempt.studyDate) ?? 0) + 1);
    dates.add(attempt.studyDate);
  }
  const todayAttempts = activityCounts.get(today) ?? 0;
  const due = statuses.filter(
    ({ status }) => status.attempts > 0 && Boolean(status.dueDate && status.dueDate <= today),
  ).length;
  const dueTomorrow = statuses.filter(({ status }) => status.dueDate === tomorrow).length;
  const activity = Array.from({ length: 28 }, (_, index) => {
    const date = shiftDay(today, index - 27);
    return { date, count: activityCounts.get(date) ?? 0 };
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

/**
 * The overview only needs three counters. It derives due question lesson IDs
 * from the stable `<lessonId>#<questionSlug>` key, so it can show these values
 * without loading every interview prompt into the first screen's bundle.
 */
export function practiceOverviewSummary(
  progress: ProgressState,
  state: PracticeState,
  now = new Date(),
): PracticeOverviewSummary {
  const today = dayKey(now);
  const groupedAttempts = indexAttempts(state);
  let due = 0;
  for (const [questionId, attempts] of groupedAttempts) {
    const separator = questionId.lastIndexOf("#");
    if (separator < 1 || !isCompleted(progress, questionId.slice(0, separator))) continue;
    const status = statusFromAttempts(questionId, attempts);
    if (status.dueDate && status.dueDate <= today) due += 1;
  }

  const activityCounts = new Map<string, number>();
  const dates = new Set<string>();
  for (const attempt of Object.values(state.attempts)) {
    activityCounts.set(attempt.studyDate, (activityCounts.get(attempt.studyDate) ?? 0) + 1);
    dates.add(attempt.studyDate);
  }
  const streak = streaks(dates, today);
  return { today: activityCounts.get(today) ?? 0, due, currentStreak: streak.current };
}

export const lessonDateActivity = (
  progress: ProgressState,
  lessons: Lesson[],
  now = new Date(),
) => {
  const today = dayKey(now);
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    const completed = progress.lessons[lesson.id];
    if (!completed?.completedAt) continue;
    const date = dayKey(new Date(completed.completedAt));
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return Array.from({ length: 28 }, (_, index) => {
    const date = shiftDay(today, index - 27);
    return { date, count: counts.get(date) ?? 0 };
  });
};
