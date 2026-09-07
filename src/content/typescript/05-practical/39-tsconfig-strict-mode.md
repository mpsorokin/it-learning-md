---
title: tsconfig and Strict Mode
titleRu: tsconfig и строгий режим
slug: tsconfig-strict-mode
section: practical
order: 39
difficulty: intermediate
estimatedMinutes: 6
tags:
  - typescript
  - tsconfig
prerequisites:
  - any
  - unknown
---

# tsconfig and Strict Mode

## TL;DR

`tsconfig.json` задаёт границы проекта, правила проверки и emitted modules. `strict: true` включает согласованный набор проверок, который ловит null, implicit any и небезопасные вызовы до runtime.

## Mental model

```text
source files + tsconfig policy → checked program + output
```

Типы библиотеки и IDE зависят от той же project configuration.

## Core idea

- `strict` включает семейство strict flags, которые могут расширяться между версиями.
- `target` выбирает JavaScript syntax, `module`/`moduleResolution` — module model.
- `include`, `exclude`, `files` задают program boundary.
- `noEmit` проверяет без генерации файлов; bundler может собирать отдельно.

> **Interview note**

Особенно важны `strictNullChecks`, `noImplicitAny` и `strictFunctionTypes`; не выключай их ради быстрого обхода ошибок.

## Example 1 — Basic

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "NodeNext"
  }
}
```

Конфигурация проверяет modern Node ESM без отдельного emit.

## Example 2 — Real-world

```ts
function upper(name: string | null) {
  return name.toUpperCase(); // Error with strictNullChecks
}

function safeUpper(name: string | null) {
  return name?.toUpperCase() ?? "";
}
```

Strict mode превращает возможный runtime crash в явную ветку.

## Example 3 — Important nuance

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true },
  "include": ["src/**/*.ts"]
}
```

В monorepo общий base уменьшает drift, а project references разделяют программы.

## Common mistake

```json
// problematic
{ "compilerOptions": { "strict": false, "skipLibCheck": true } }

// better
{ "compilerOptions": { "strict": true } }
```

Не отключай весь набор из-за одной ошибки. Пойми конкретную границу и исправь тип или локально изолируй несовместимую библиотеку.

## Interview answer

> **What does `strict: true` do in TypeScript?**

`strict: true` enables a coordinated family of stronger checks, including nullability, implicit `any`, function variance, property initialization, and safer catch variables. It is not a runtime mode and does not choose the JavaScript target. I enable it for new projects, migrate existing code incrementally, and avoid broad opt-outs that allow unsafe values to spread.

## Interview follow-ups

- What does `strictNullChecks` change?
- How are `target` and `module` different?
- Does `skipLibCheck` skip checking application code?

## Recall

- Какие задачи решают `target` и `module`?
- Почему project boundary важна для IDE?
- Как мигрировать к strict без глобального отключения?

## Mini challenge

Объясни ошибку nullable `env.PORT` и безопасно получи число с fallback 3000.

<details>
<summary>Solution</summary>

```ts
const port = env.PORT === undefined ? 3000 : Number(env.PORT);
```

</details>

## Remember

```text
tsconfig → project policy
strict → safer family of checks
target/module → output and module semantics
```

## Related topics

- [any](#/s/typescript/01-foundation/any)
- [Unknown](#/s/typescript/01-foundation/unknown)
- [ESM and type-only imports](#/s/typescript/05-practical/esm-type-only-imports)
