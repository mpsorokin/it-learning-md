# 38. ESM and Type-only Imports

В TypeScript import может существовать по двум совершенно разным причинам:

1. значение нужно **runtime**;
2. declaration нужно только **type checker-у**.

Например:

```ts
import { User } from "./user";
```

Если `User` используется только так:

```ts
function save(user: User) {}
```

то runtime JavaScript может вообще не нуждаться в этом import.

TypeScript types после compilation исчезают.

Именно поэтому существует explicit syntax:

```ts
import type {
  User,
} from "./user";
```

Это означает:

> этот import существует исключительно для type system.

---

## Type и value namespaces — разные вещи

Например interface:

```ts
export interface User {
  id: string;
}
```

существует только compile time.

Поэтому:

```ts
import type { User } from "./user";
```

естественно.

Class другая:

```ts
export class User {
  constructor(
    public id: string
  ) {}
}
```

`User` существует одновременно:

```text
type position
→ instance type User

value position
→ constructor User
```

Поэтому:

```ts
import type { User } from "./user";
```

позволяет:

```ts
let user: User;
```

но нельзя затем использовать:

```ts
new User("u-1");
```

Потому что runtime constructor мы сознательно не импортировали.

---

## Один import может содержать value и types

В современном TypeScript можно:

```ts
import {
  createUser,
  type User,
  type CreateUserInput,
} from "./users";
```

Здесь:

```text
createUser
→ runtime import

User
CreateUserInput
→ type-only imports
```

Это часто удобнее двух declarations:

```ts
import {
  createUser,
} from "./users";

import type {
  User,
  CreateUserInput,
} from "./users";
```

Оба styles возможны.

---

## Зачем explicit `import type` вообще нужен

TypeScript исторически мог анализировать usage и удалять imports, которые использовались только как types.

Но это создаёт несколько проблем:

* behavior emit зависит от type analysis;
* side-effect imports могут стать менее очевидными;
* другой transpiler может анализировать код иначе;
* Babel/SWC/esbuild работают не так, как full TypeScript type checker;
* ESM/CJS boundary становится менее прозрачной.

Современный `verbatimModuleSyntax` делает правило гораздо более прямым:

```text
import без type
→ сохраняется как runtime import

import type
→ удаляется из JavaScript
```

TypeScript documentation прямо описывает `verbatimModuleSyntax` как упрощение прежней системы import elision; старые `importsNotUsedAsValues` и `preserveValueImports` были заменены этим более явным подходом.

---

## Почему это особенно важно с ESM

Представим:

```ts
import { User } from "./user.js";

export function print(
  user: User
) {}
```

Если `User` — только interface, runtime import ему не нужен.

Лучше intent явно:

```ts
import type {
  User,
} from "./user.js";
```

Теперь developer и compiler сразу понимают:

```text
никакого runtime dependency
между этими modules нет
```

Это важно не только для emitted JS.

Это делает dependency graph понятнее.

---

## Side effects — важный nuance

Представим module:

```ts
// register.ts

registerSomething();

export interface Config {
  enabled: boolean;
}
```

Если другой module импортирует только:

```ts
import type {
  Config,
} from "./register";
```

runtime module **не будет загружен ради этого type import**.

Следовательно:

```ts
registerSomething();
```

не выполнится.

Если side effect нужен, его нужно импортировать явно:

```ts
import "./register";
```

и type отдельно:

```ts
import type {
  Config,
} from "./register";
```

Это хороший reason не смешивать mental models:

```text
type dependency
≠
runtime module dependency
```

---

## ESM и CommonJS — это не просто разный syntax

ESM:

```ts
import {
  readFile,
} from "node:fs/promises";

export function load() {}
```

CommonJS:

```js
const {
  readFile,
} = require("node:fs/promises");

module.exports = {
  load,
};
```

Но в современном Node.js вопрос не ограничивается внешним видом syntax.

Он влияет на:

* module resolution;
* package `type`;
* `.js`, `.mjs`, `.cjs`;
* emitted code;
* resolution packages;
* whether imports are statically analyzable;
* runtime behavior.

Поэтому TypeScript options:

```text
module
moduleResolution
verbatimModuleSyntax
```

должны соответствовать реальному runtime/bundler environment, а не выбираться случайно.

---

## Node.js projects: `NodeNext`

Для современного Node ESM TypeScript projects часто можно встретить:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

Смысл не просто:

> emit ES imports.

TypeScript пытается моделировать module resolution semantics Node.

Если application собирается bundler-ом, могут быть более подходящие bundler-oriented настройки.

То есть нельзя давать универсальный совет:

```text
module = ESNext всегда
```

Configuration должна моделировать реальный toolchain.

---

## ESM imports могут требовать `.js` extension

Это часто удивляет разработчиков.

Исходник:

```text
user.ts
```

А import при Node ESM configuration может выглядеть:

```ts
import {
  UserService,
} from "./user.js";
```

Хотя файла `user.js` ещё нет в source tree.

Почему?

Потому что TypeScript source:

```text
user.ts
```

станет:

```text
user.js
```

и emitted JavaScript должен содержать runtime-valid specifier.

TypeScript в Node-oriented module resolution моделирует именно runtime semantics, а не просто удобство исходников.

---

## Type-only export

Можно также:

```ts
export type {
  User,
  Order,
};
```

Или:

```ts
export {
  type User,
  createUser,
};
```

Это особенно полезно в barrel files:

```ts
// index.ts
export {
  createUser,
  type User,
  type CreateUserInput,
} from "./users.js";
```

Сразу видно:

```text
что является runtime API
что является type API
```

---

## Почему barrel files могут быть опасны

Например:

```ts
import {
  UserService,
} from "../index.js";
```

где `index.ts` re-export-ит десятки modules.

В NestJS/backend code это может:

* делать dependency graph менее очевидным;
* создавать circular dependencies;
* случайно добавлять runtime imports;
* усложнять tree shaking/bundling;
* скрывать architectural boundaries.

Для type-only exports риск runtime cycles меньше, потому что import исчезает.

Но для classes/providers/modules imports существуют runtime.

Это особенно важно в NestJS, где class часто является DI token.

---

## Class нельзя всегда импортировать как `type`

Представим Nest provider:

```ts
@Injectable()
export class UserService {}
```

Controller:

```ts
@Controller()
export class UserController {
  constructor(
    private readonly users:
      UserService
  ) {}
}
```

На уровне TypeScript `UserService` используется в type position.

Но Nest может нуждаться в class constructor runtime для dependency injection metadata/token resolution.

Поэтому бездумно заменить всё на:

```ts
import type {
  UserService,
} from "./user.service";
```

нельзя.

Это прекрасный пример:

> одно и то же имя может быть type для TypeScript и одновременно runtime value для framework.

`import type` нужно использовать только если runtime value действительно не нужна.

---

## Interface не может быть обычным DI token runtime

Например:

```ts
interface UserRepository {
  findById(id: string):
    Promise<User | null>;
}
```

После compilation `UserRepository` исчезает.

Поэтому Nest нельзя runtime сказать:

```ts
@Inject(UserRepository)
```

если `UserRepository` только interface.

Нужен runtime token:

```ts
export const USER_REPOSITORY =
  Symbol("USER_REPOSITORY");
```

И:

```ts
constructor(
  @Inject(USER_REPOSITORY)
  private readonly repository:
    UserRepository
) {}
```

Здесь:

```text
UserRepository
→ compile-time contract

USER_REPOSITORY
→ runtime DI token
```

Это очень важный bridge между TypeScript type system и Nest runtime.

---

## Вопросы на собеседовании

### Что такое `import type`?

Это import, существующий только для TypeScript type system. Он не создаёт соответствующий runtime import в emitted JavaScript.

### Зачем использовать explicit type-only imports?

Они делают distinction между compile-time и runtime dependencies явным, помогают избежать случайных runtime imports и особенно полезны при современных ESM configurations и transpilers.

### Может ли class быть импортирован через `import type`?

Да, если он используется исключительно как type. Но после такого import нельзя обращаться к constructor runtime. Frameworks вроде NestJS могут требовать class как runtime DI token, поэтому там нужно быть внимательным.

### Что делает `verbatimModuleSyntax`?

В упрощённой модели imports/exports без `type` сохраняются, а explicitly type-only imports удаляются. Это делает emitted module behavior более предсказуемым.

### Почему interface нельзя использовать как runtime DI token?

Потому что interface удаляется во время compilation. Nest container нужен runtime identifier — например class, string или `Symbol` token.

### Почему ESM configuration должна соответствовать runtime?

Потому что module system определяет не только syntax, но и resolution rules, file extensions и runtime loading semantics.
