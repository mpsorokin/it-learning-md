# 39. `tsconfig` and Strict Mode

`tsconfig.json` — это не просто место, где TypeScript хранит настройки compiler-а.

Он определяет **модель type safety и runtime environment проекта**.

Например:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Каждая option отвечает на отдельный вопрос.

Например:

```text
target
→ какой JavaScript runtime мы предполагаем?

module/moduleResolution
→ как modules существуют и находятся?

strict
→ насколько сильные type guarantees мы требуем?

noUncheckedIndexedAccess
→ считаем ли indexed access потенциально отсутствующим?

exactOptionalPropertyTypes
→ как именно трактовать optional properties?
```

---

## `strict` — это группа проверок

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

не является одной маленькой проверкой.

Он включает семейство более строгих type-checking options, включая такие механизмы, как `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` и другие. TypeScript также предупреждает, что будущие версии могут усиливать набор проверок под umbrella `strict`, поэтому upgrade compiler-а иногда обнаруживает новые ошибки.

Практически для нового production TypeScript application:

```text
strict: true
```

— хороший baseline.

Если конкретная check действительно мешает по обоснованной причине, её можно отключить отдельно.

---

## `strictNullChecks`

Без строгой обработки `null` compiler может позволять model вроде:

```ts
function findUser(
  id: string
): User {
  // реально может не найти
}
```

и код:

```ts
const user =
  findUser("missing");

user.name;
```

При корректном contract:

```ts
function findUser(
  id: string
): User | null {
  // ...
}
```

caller обязан обработать отсутствие:

```ts
const user =
  findUser(id);

if (!user) {
  throw new NotFoundError();
}

user.name;
```

`null` перестаёт быть invisible runtime possibility и становится частью API.

Это одна из самых фундаментальных strict guarantees.

---

## `noImplicitAny`

Без него:

```ts
function process(value) {
}
```

может silently получить:

```ts
value: any
```

И мы снова получаем escape hatch из type system.

С:

```json
{
  "noImplicitAny": true
}
```

compiler заставляет либо дать нормальный contract:

```ts
function process(
  value: User
) {}
```

либо сознательно написать:

```ts
function process(
  value: any
) {}
```

Второй вариант всё ещё может быть плохим, но unsafe decision хотя бы становится explicit.

---

## `strictPropertyInitialization`

Рассмотрим class:

```ts
class UserService {
  private repository:
    UserRepository;
}
```

Compiler спрашивает:

> где гарантируется initialization?

Правильно:

```ts
class UserService {
  constructor(
    private readonly repository:
      UserRepository
  ) {}
}
```

Или нужно иначе доказать initialization.

Это помогает избежать runtime:

```text
Cannot read properties of undefined
```

из class fields, которые developer объявил, но не initialized.

---

## `useUnknownInCatchVariables`

JavaScript позволяет:

```ts
throw new Error();
throw "error";
throw 123;
throw {};
```

Поэтому:

```ts
catch (error) {
  error.message;
}
```

не всегда безопасно.

Более честная model:

```ts
catch (error) {
  if (error instanceof Error) {
    logger.error(
      error.message
    );
  }
}
```

где error рассматривается как `unknown`.

Это хорошо иллюстрирует philosophy strict mode:

> type system должна моделировать реальное JavaScript behavior, а не удобное предположение developer-а.

---

## `noUncheckedIndexedAccess`

Рассмотрим:

```ts
const users:
  Record<string, User> = {};

const user =
  users["missing"];
```

Runtime:

```ts
undefined
```

Но без дополнительной строгости type может выглядеть слишком оптимистично.

С:

```json
{
  "noUncheckedIndexedAccess": true
}
```

indexed access начинает учитывать возможность отсутствия:

```ts
User | undefined
```

Теперь:

```ts
users[id].name;
```

требует проверки.

Это особенно полезно для:

* dictionaries;
* environment variables;
* arrays;
* dynamic lookup maps.

---

## Arrays тоже становятся честнее

```ts
const users: User[] = [];

const first =
  users[0];
```

Runtime:

```ts
undefined
```

С `noUncheckedIndexedAccess`:

```ts
first: User | undefined
```

Это иногда создаёт больше проверок, но type model становится значительно ближе к JavaScript.

---

## `exactOptionalPropertyTypes`

Ранее мы обсуждали:

```ts
type User = {
  nickname?: string;
};
```

Есть важная semantic difference между:

```ts
{}
```

и:

```ts
{
  nickname: undefined
}
```

Property отсутствует:

```text
"nickname" in user
→ false
```

Property существует, но value undefined:

```text
"nickname" in user
→ true
```

`exactOptionalPropertyTypes` делает TypeScript строже в отношении этого различия.

Если contract:

```ts
nickname?: string;
```

это означает:

> property либо отсутствует, либо, если присутствует, содержит `string`.

Если developer хочет explicit:

```ts
nickname: undefined
```

нужно включить это в value type:

```ts
nickname?:
  string | undefined;
```

Это особенно полезно в patch APIs и serialization logic, где «отсутствует» и «явно передано undefined» могут иметь разные значения.

---

## `noUncheckedIndexedAccess` и `exactOptionalPropertyTypes` не входят автоматически в обычный mental model `strict`

На практике многие команды включают их отдельно, потому что они ещё сильнее заставляют type system моделировать потенциальное отсутствие данных.

Их не обязательно blindly включать в legacy project за один commit.

Но для нового backend они часто дают очень полезные guarantees.

---

## `target` — не «версия TypeScript»

Например:

```json
{
  "target": "ES2022"
}
```

означает:

> какой уровень JavaScript syntax/runtime features compiler может оставить в emitted output.

Если target старый, TypeScript может downlevel некоторые syntax transformations.

Но `target` не устанавливает:

* версию Node;
* browser support автоматически;
* module system;
* polyfills.

Например compiler может преобразовать syntax, но не обязан polyfill runtime API.

---

## `lib` и runtime capabilities

Допустим TypeScript знает о:

```ts
document
```

потому что project включает DOM library definitions.

Но backend Node project может не иметь DOM runtime.

Поэтому environment typings тоже должны соответствовать реальному application.

TypeScript declaration availability:

```text
"compiler знает API"
```

не означает:

```text
"runtime предоставляет API"
```

Это recurring principle всей TypeScript системы.

---

## `skipLibCheck`

Очень распространённая option:

```json
{
  "skipLibCheck": true
}
```

Она пропускает full type checking declaration files зависимостей.

Это может заметно уменьшить noise/build cost в реальных projects.

Но важно понимать:

> это не отключает TypeScript для application code.

И это не означает:

> third-party types становятся корректными.

Это pragmatic compiler/build trade-off.

---

## Не копируй `tsconfig` из случайного проекта

Конфигурация:

```json
{
  "target": "ES5",
  "module": "commonjs",
  "experimentalDecorators": true
}
```

может быть правильной для одного stack и странной для другого.

React/Vite app, Node ESM backend, Nest application и published library имеют разные requirements.

`tsconfig` должен отвечать на вопросы:

```text
что запускает JavaScript?
что собирает JavaScript?
кто обрабатывает modules?
нужны ли declaration files?
это app или library?
```

После этого выбираются options.

---

## Хороший baseline для нового Node backend

Conceptually:

```json
{
  "compilerOptions": {
    "strict": true,

    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    "target": "ES2022",

    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    "verbatimModuleSyntax": true,

    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

Это не универсальный copy-paste config.

Например Nest build pipeline или конкретный package setup может требовать другие module/decorator settings.

Смысл примера — показать categories решений, а не выдать магический `tsconfig`.

---

## Вопросы на собеседовании

### Что делает `strict: true`?

Он включает семейство строгих type-checking options, которые усиливают guarantees TypeScript. Это baseline, а не отдельная единичная проверка.

### Зачем нужен `strictNullChecks`?

Чтобы `null` и `undefined` моделировались как реальные отдельные possibilities, которые API и caller должны учитывать.

### Что делает `noUncheckedIndexedAccess`?

Добавляет возможность `undefined` при indexed access там, где compiler не может доказать наличие значения, например `array[index]` или dictionary lookup.

### Чем полезен `exactOptionalPropertyTypes`?

Он точнее различает отсутствующее optional property и property, явно установленное в `undefined`.

### Что означает `target`?

Это target JavaScript language level для generated code. Он не является версией Node и не добавляет runtime polyfills автоматически.

### Можно ли просто использовать один `tsconfig` для всех TypeScript-проектов?

Нет. Module resolution, target, emit и environment options должны соответствовать реальному runtime, bundler и типу проекта.
