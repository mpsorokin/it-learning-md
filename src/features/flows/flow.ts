import { findFolder, findSection } from "@/lib/content";
import type { Folder, Lesson } from "@/lib/content.types";

export type FlowGroupLabelKey =
  | "flows.groups.jsTs"
  | "flows.groups.browser"
  | "flows.groups.react"
  | "flows.groups.next"
  | "flows.groups.backendSecurity"
  | "flows.groups.dataSystemDesign"
  | "flows.groups.deliverySeniorPractice";

export interface FlowGroupDefinition {
  id: string;
  labelKey: FlowGroupLabelKey;
  folderSlugs: readonly string[];
}

export interface FlowDefinition {
  id: string;
  section: string;
  groups: readonly FlowGroupDefinition[];
}

export interface ResolvedFlowTopic {
  group: FlowGroupDefinition;
  folder: Folder;
}

export interface ResolvedFlowGroup {
  definition: FlowGroupDefinition;
  topics: ResolvedFlowTopic[];
}

export interface ResolvedFlow {
  definition: FlowDefinition;
  groups: ResolvedFlowGroup[];
  topics: ResolvedFlowTopic[];
}

export const fullstackInterviewFlow = {
  id: "fullstack-interview",
  section: "fullstack-interview",
  groups: [
    {
      id: "js-ts",
      labelKey: "flows.groups.jsTs",
      folderSlugs: [
        "01-js-runtime",
        "02-js-objects-prototypes-oop",
        "03-typescript-core",
        "04-typescript-advanced",
        "05-typescript-runtime-boundary",
      ],
    },
    {
      id: "browser",
      labelKey: "flows.groups.browser",
      folderSlugs: ["06-browser-internals", "07-browser-performance-web-vitals"],
    },
    {
      id: "react",
      labelKey: "flows.groups.react",
      folderSlugs: [
        "08-react-rendering-model",
        "09-react-state",
        "10-react-effects",
        "11-react-closures",
        "12-react-hooks-mechanics",
        "13-react-memoization-performance",
        "14-context",
        "15-react-portals",
        "16-react-concurrent-rendering",
        "17-data-fetching-react",
        "18-code-review",
        "19-react-application-architecture",
      ],
    },
    {
      id: "next",
      labelKey: "flows.groups.next",
      folderSlugs: ["20-next-rendering", "21-next-data-fetching-cache", "22-next-server-actions", "23-next-routing"],
    },
    {
      id: "backend-security",
      labelKey: "flows.groups.backendSecurity",
      folderSlugs: [
        "24-nodejs-runtime",
        "25-nestjs-architecture",
        "26-nestjs-request-lifecycle",
        "27-nestjs-authentication-authorization",
        "28-http-rest-api-design",
        "29-websocket-sse",
        "30-web-security",
      ],
    },
    {
      id: "data-system-design",
      labelKey: "flows.groups.dataSystemDesign",
      folderSlugs: ["31-databases-sql-postgresql", "32-orm-typeorm", "33-redis", "34-ddd", "35-cqrs", "36-microservices", "37-system-design"],
    },
    {
      id: "delivery-senior-practice",
      labelKey: "flows.groups.deliverySeniorPractice",
      folderSlugs: ["38-docker", "39-ci-cd", "40-full-stack-machine-coding", "41-production-debugging", "42-architecture-engineering-judgment"],
    },
  ],
} as const satisfies FlowDefinition;

export const flowSectionSlug = fullstackInterviewFlow.section;

const flowDefinitions: readonly FlowDefinition[] = [fullstackInterviewFlow];

export function getFlowDefinition(flowId: string): FlowDefinition | undefined {
  return flowDefinitions.find((flow) => flow.id === flowId);
}

/** Resolve configured topic folders in flow order; absent content is skipped. */
export function resolveFlow(flowId: string): ResolvedFlow | undefined {
  const definition = getFlowDefinition(flowId);
  if (!definition || !findSection(definition.section)) return undefined;

  const groups = definition.groups.map((group) => ({
    definition: group,
    topics: group.folderSlugs.flatMap((slug) => {
      const folder = findFolder(definition.section, slug);
      return folder ? [{ group, folder }] : [];
    }),
  }));

  return { definition, groups, topics: groups.flatMap((group) => group.topics) };
}

/** Return the flow's lesson order from its configured group and folder order. */
export function orderedFlowLessons(flow: FlowDefinition): Lesson[] {
  if (!findSection(flow.section)) return [];
  return flow.groups.flatMap((group) =>
    group.folderSlugs.flatMap((slug) => findFolder(flow.section, slug)?.lessons ?? []),
  );
}

export function orderedLessonNeighbours(
  lessons: Lesson[],
  lessonId: string,
): { index: number; previous?: Lesson; next?: Lesson } {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return { index };
  return { index, previous: lessons[index - 1], next: lessons[index + 1] };
}

export function getFlowForLesson(lesson: Lesson | undefined): FlowDefinition | undefined {
  if (!lesson) return undefined;
  return flowDefinitions.find(
    (flow) => lesson.section === flow.section && flow.groups.some((group) => group.folderSlugs.includes(lesson.folder)),
  );
}

export function getFlowTopic(flowId: string, topicSlug: string): ResolvedFlowTopic | undefined {
  return resolveFlow(flowId)?.topics.find((topic) => topic.folder.slug === topicSlug);
}
