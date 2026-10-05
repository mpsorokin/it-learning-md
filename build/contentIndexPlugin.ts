import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import {
  parseInterviewQuestions,
  resolveOrder,
  searchableTextFromMarkdown,
  slugFromFilename,
  titleFromMarkdown,
} from "../src/lib/contentParsing.ts";

interface ScannedLesson {
  id: string;
  section: string;
  folder: string;
  slug: string;
  title: string;
  order: number;
  sourcePath: string;
  questionCount: number;
  body: string;
}

const catalogPublicId = "virtual:ittheory/catalog";
const questionsPublicId = "virtual:ittheory/questions";
const searchPublicId = "virtual:ittheory/search-index";
const catalogId = `\0${catalogPublicId}`;
const questionsId = `\0${questionsPublicId}`;
const searchId = `\0${searchPublicId}`;
const searchSectionPrefix = `${searchPublicId}/`;
const internalSearchSectionPrefix = `\0${searchSectionPrefix}`;

function markdownFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(fullPath);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function scanLessons(contentDirectory: string): ScannedLesson[] {
  const flowQuestionIds = new Set<string>();
  const lessons = markdownFiles(contentDirectory).flatMap((absolutePath) => {
    const relativePath = path.relative(contentDirectory, absolutePath).split(path.sep);
    if (relativePath.length !== 3) {
      console.warn(
        `Ignoring "${absolutePath}": lessons live at content/<section>/<folder>/<slug>.md`,
      );
      return [];
    }
    const [section, folder, filename] = relativePath;
    const fileSlug = filename.slice(0, -3);
    const slug = slugFromFilename(fileSlug);
    const body = readFileSync(absolutePath, "utf8");
    const id = `${section}/${folder}/${slug}`;
    const questions = parseInterviewQuestions(id, body);
    if (section === "fullstack-interview") {
      if (questions.length === 0 || questions.length > 10) {
        throw new Error(
          `"${absolutePath}" must contain between 1 and 10 questions; found ${questions.length}.`,
        );
      }
      if (questions.some((question) => !question.hasExplicitId || !question.hasAnswerMarker)) {
        throw new Error(
          `Every question in "${absolutePath}" needs an explicit ID and an Answer marker.`,
        );
      }
      const questionIds = new Set(questions.map((question) => question.id));
      if (questionIds.size !== questions.length) {
        throw new Error(`"${absolutePath}" contains duplicate question IDs.`);
      }
      for (const question of questions) {
        const stableId = question.id.slice(question.id.lastIndexOf("#") + 1);
        if (flowQuestionIds.has(stableId)) {
          throw new Error(`Duplicate question ID "${stableId}" in the fullstack-interview flow.`);
        }
        flowQuestionIds.add(stableId);
      }
    }
    return [
      {
        id,
        section,
        folder,
        slug,
        title: titleFromMarkdown(body, slug),
        order: resolveOrder(fileSlug),
        sourcePath: `../content/${section}/${folder}/${filename}`,
        questionCount: questions.length,
        body,
      },
    ];
  });

  const ids = new Set<string>();
  for (const lesson of lessons) {
    if (ids.has(lesson.id)) throw new Error(`Duplicate lesson id in src/content: ${lesson.id}`);
    ids.add(lesson.id);
  }
  return lessons;
}

export function contentIndexPlugin(): Plugin {
  let config: ResolvedConfig;
  const contentDirectory = () => path.resolve(config.root, "src/content");
  const publicIds = new Map([
    [catalogPublicId, catalogId],
    [questionsPublicId, questionsId],
    [searchPublicId, searchId],
  ]);

  return {
    name: "ittheory-content-index",
    enforce: "pre",
    configResolved(resolved) {
      config = resolved;
    },
    resolveId(id) {
      return publicIds.get(id) ?? (id.startsWith(searchSectionPrefix) ? `\0${id}` : null);
    },
    load(id) {
      if (
        id !== catalogId &&
        id !== questionsId &&
        id !== searchId &&
        !id.startsWith(internalSearchSectionPrefix)
      )
        return null;
      const lessons = scanLessons(contentDirectory());
      if (id === catalogId) {
        const catalog = lessons.map(({ body: _body, ...lesson }) => lesson);
        return `export const lessons = ${JSON.stringify(catalog)};`;
      }
      if (id === questionsId) {
        const questions = lessons.flatMap((lesson) =>
          parseInterviewQuestions(lesson.id, lesson.body)
            .filter((question) => question.hasAnswer)
            .map(({ id, prompt, promptBody, hasAnswer }) => ({
              id,
              lessonId: lesson.id,
              section: lesson.section,
              folder: lesson.folder,
              prompt,
              promptBody,
              hasAnswer,
            })),
        );
        return `export const questions = ${JSON.stringify(questions)};`;
      }
      if (id === searchId) {
        const sections = [...new Set(lessons.map((lesson) => lesson.section))];
        const imports = sections
          .map(
            (section) =>
              `import("${searchSectionPrefix}${section}").then((module) => module.default)`,
          )
          .join(",");
        return `export async function loadSearchEntries() { return (await Promise.all([${imports}])).flat(); }`;
      }
      const section = id.slice(internalSearchSectionPrefix.length);
      const index = lessons
        .filter((lesson) => lesson.section === section)
        .map((lesson) => ({
          lessonId: lesson.id,
          text: `${lesson.title}\n${searchableTextFromMarkdown(lesson.body)}`,
        }));
      return `export default ${JSON.stringify(index)};`;
    },
    configureServer(server) {
      const directory = contentDirectory();
      server.watcher.add(directory);
      server.watcher.on("all", (event, changedPath) => {
        if (!changedPath.startsWith(directory) || !["add", "change", "unlink"].includes(event))
          return;
        for (const module of server.moduleGraph.idToModuleMap.values()) {
          if (module.id.startsWith("\0virtual:ittheory/"))
            server.moduleGraph.invalidateModule(module);
        }
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
