export interface LessonStudyData {
  note: string;
  bookmarked: boolean;
  updatedAt: string;
  writerId: string;
}

export interface StudyState {
  version: 1;
  lessons: Record<string, LessonStudyData>;
}

export const STUDY_VERSION = 1;
export const STUDY_STORAGE_KEY = "ittheory:study:v1";

export const emptyStudy = (): StudyState => ({ version: STUDY_VERSION, lessons: {} });
