/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "virtual:ittheory/catalog" {
  import type { Lesson } from "@/lib/content.types";
  export const lessons: Lesson[];
}

declare module "virtual:ittheory/questions" {
  import type { InterviewQuestionMeta } from "@/lib/content.types";
  export const questions: InterviewQuestionMeta[];
}

declare module "virtual:ittheory/search-index" {
  import type { SearchIndexEntry } from "@/lib/content.types";
  export function loadSearchEntries(): Promise<SearchIndexEntry[]>;
}

declare module "virtual:ittheory/search-index/*" {
  import type { SearchIndexEntry } from "@/lib/content.types";
  const index: SearchIndexEntry[];
  export default index;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
