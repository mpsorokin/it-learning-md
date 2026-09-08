# 40. Decorators and NestJS

Decorator — это runtime mechanism, позволяющий привязать behavior или metadata к class и её members через syntax:

```ts
@Something()
class UserService {}
```

В NestJS decorators используются практически везде:

```ts
@Controller("users")
export class UserController {
  @Get(":id")
  findOne(
    @Param("id") id: string
  ) {
    // ...
  }
}
```

Здесь:

```text
@Controller
@Get
@Param
```

не являются просто красивыми TypeScript annotations.

Они участвуют в runtime framework behavior.

Nest читает metadata и на её основе строит:

* routing;
* dependency injection;
* modules;
* guards;
* pipes;
* interceptors;
* exception handling.

Nest documentation прямо описывает `@Module()` как decorator, передающий framework metadata для построения application graph, а providers управляются Nest IoC container.

---

## Decorator выполняется runtime

Простой legacy-style decorator conceptually:

```ts
function Log(
  target: object,
  propertyKey: string,
  descriptor:
    PropertyDescriptor
) {
  const original =
    descriptor.value;

  descriptor.value =
    function (...args: unknown[]) {
      console.log(
        propertyKey,
        args
      );

      return original.apply(
        this,
        args
      );
    };
}
```

Использование:

```ts
class UserService {
  @Log
  findUser(id: string) {
    // ...
  }
}
```

Decorator может:

* читать declaration;
* регистрировать metadata;
* wrapping method;
* менять descriptor;
* в некоторых models заменять definition.

То есть decorators отличаются от interfaces/types фундаментально:

```text
interface
type
generic
→ erased

decorator
→ runtime behavior
```

---

## В TypeScript сегодня существуют две decorator models

Это важный contemporary nuance.

TypeScript поддерживает современную decorators model, основанную на более новом ECMAScript proposal, а также старую experimental/legacy model через `experimentalDecorators`.

Эти модели **не полностью совместимы**. В частности, современная decorator model отличается по typing/emit, не совместима со старым `emitDecoratorMetadata` mechanism и не поддерживает legacy parameter decorators тем же способом.

Для NestJS developer это важно потому, что экосистема Nest исторически сильно использует legacy decorator + metadata patterns.

Нельзя просто прочитать статью про «новые TypeScript decorators» и предположить, что все Nest decorators работают по точно той же semantic model.

---

## `@Injectable()` не означает «создай singleton»

Например:

```ts
@Injectable()
export class UserService {}
```

Очень грубое объяснение:

> `@Injectable` делает class injectable.

Но реальная model шире.

Nest должен:

1. знать provider;
2. зарегистрировать provider в module/container;
3. знать token;
4. построить dependency graph;
5. создать или получить instance согласно scope.

Например:

```ts
@Module({
  providers: [
    UserService,
  ],
})
export class UserModule {}
```

Теперь container знает provider.

Сам decorator без регистрации в нужном graph context — не магический global service registry.

---

## Constructor injection

```ts
@Injectable()
export class UserService {
  constructor(
    private readonly repository:
      UserRepository
  ) {}
}
```

В обычном TypeScript `UserRepository`, если это class, существует:

```text
compile time
→ type

runtime
→ constructor value
```

Это позволяет framework использовать class как DI token.

Nest documentation описывает constructor-based injection как основной pattern и разрешает dependencies через IoC container.

---

## Почему interfaces не работают как DI tokens

Допустим:

```ts
export interface UserRepository {
  findById(
    id: string
  ): Promise<User | null>;
}
```

И хочется:

```ts
constructor(
  repository:
    UserRepository
) {}
```

TypeScript всё понимает compile time.

Но runtime:

```text
UserRepository interface
↓ compilation
nothing
```

Nest container не может lookup provider по type, которого больше нет.

Поэтому нужен token:

```ts
export const USER_REPOSITORY =
  Symbol("USER_REPOSITORY");
```

Registration:

```ts
@Module({
  providers: [
    {
      provide:
        USER_REPOSITORY,

      useClass:
        PostgresUserRepository,
    },
  ],
})
export class UserModule {}
```

Injection:

```ts
@Injectable()
export class UserService {
  constructor(
    @Inject(
      USER_REPOSITORY
    )
    private readonly repository:
      UserRepository
  ) {}
}
```

Здесь существует чёткое разделение:

```text
UserRepository
→ compile-time contract

USER_REPOSITORY
→ runtime identity

PostgresUserRepository
→ runtime implementation
```

Nest официально поддерживает custom tokens и `@Inject(token)` именно для таких provider scenarios.

---

## Это важный ответ на вопрос «как Nest знает тип constructor parameter?»

Наивная модель:

> TypeScript types каким-то образом доступны Nest runtime.

Нет.

Большинство TypeScript types erased.

Framework может работать с runtime constructs и metadata.

Например class:

```ts
UserService
```

имеет runtime constructor.

Interface:

```ts
UserRepository
```

не имеет.

Поэтому Nest DI architecture вынуждена учитывать границу:

```text
TypeScript type system
──────────────
runtime JavaScript
```

Decorators/metadata/tokens — bridge между этими слоями.

---

## `emitDecoratorMetadata`

Legacy decorator ecosystems могут использовать:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

`emitDecoratorMetadata` позволяет TypeScript emit дополнительную design-type metadata для decorated declarations; документация TypeScript подчёркивает, что это experimental metadata mechanism.

Conceptually source:

```ts
constructor(
  service: UserService
) {}
```

может привести к metadata, позволяющей framework получить runtime constructor `UserService`.

Но metadata имеет ограничения.

---

## Metadata не сохраняет всю TypeScript type system

Представим:

```ts
constructor(
  users: User[]
) {}
```

Runtime metadata не может magically сохранить:

```text
Array<User>
```

во всей TypeScript semantic richness.

Runtime существует `Array`.

Но generic parameter:

```text
User
```

стирается.

То же касается:

```ts
Promise<User>
User | null
UserRepository interface
Readonly<User>
```

TypeScript type system намного богаче runtime JavaScript reflection capabilities.

Это очень важно понимать при работе с:

* validation;
* Swagger;
* serialization;
* dependency injection.

Framework часто требует explicit decorators или schema information именно поэтому.

---

## `@Controller()` — metadata, не inheritance

```ts
@Controller("users")
export class UserController {}
```

Controller не обязан:

```ts
extends NestController
```

Decorator сообщает Nest:

```text
этот class
→ controller

base route
→ /users
```

Это довольно characteristic Nest design:

```text
plain-ish classes
+
decorative metadata
+
IoC container
```

вместо большого framework inheritance hierarchy.

---

## Method decorators строят routing metadata

```ts
@Controller("users")
export class UserController {
  @Get(":id")
  getUser(
    @Param("id") id: string
  ) {
    return this.service.find(id);
  }
}
```

Conceptually Nest собирает:

```text
controller:
  /users

method:
  GET

path:
  :id

parameter:
  id ← route params
```

и затем регистрирует соответствующий route в underlying HTTP adapter.

`@Get()` сам не является HTTP server.

Это metadata/instruction, которую framework bootstrap process интерпретирует.

---

## Decorator factory

Почему пишется:

```ts
@Get("users")
```

а не:

```ts
@Get
```

Потому что `Get(...)` является decorator factory:

```text
Get("users")
↓
returns decorator
↓
decorator applied to method
```

Упрощённо:

```ts
function Route(
  method: string,
  path: string
) {
  return function (
    target: object,
    key: string
  ) {
    // register metadata
  };
}
```

Decorator factory позволяет передать configuration decorator-у.

---

## Custom decorators в Nest

Можно создать custom parameter decorator:

```ts
export const CurrentUser =
  createParamDecorator(
    (
      data: unknown,
      context:
        ExecutionContext
    ) => {
      const request =
        context
          .switchToHttp()
          .getRequest();

      return request.user;
    }
  );
```

Использование:

```ts
@Get("me")
getMe(
  @CurrentUser()
  user: AuthenticatedUser
) {
  return user;
}
```

Это полезно, когда framework-specific extraction logic повторяется.

Controller получает domain-friendly abstraction:

```text
@CurrentUser()
```

вместо постоянного:

```ts
request.user
```

---

## Но decorator не должен скрывать произвольную бизнес-логику

Decorator temptation:

```ts
@CheckSubscription()
@TrackUser()
@LoadAccount()
@ValidatePayment()
@UpdateStatistics()
processPayment() {}
```

В какой-то момент method behavior становится невозможно понять локально.

Cross-cutting concerns хорошо подходят decorators:

* authorization metadata;
* logging;
* validation metadata;
* caching metadata;
* routing;
* instrumentation.

Core business logic обычно лучше оставлять явной в service/domain code.

Иначе появляется «магия framework-а», где control flow виден только после изучения пяти decorators.

---

## Decorators vs guards/interceptors/pipes

В Nest decorator часто **объявляет metadata**, а реальную работу делает другой framework component.

Например:

```ts
@Roles("admin")
deleteUser() {}
```

Custom `@Roles()` может просто записать:

```text
roles = ["admin"]
```

А `RolesGuard` затем читает metadata и принимает решение.

То есть architecture:

```text
decorator
→ declarative metadata

guard
→ authorization behavior
```

Так separation of concerns значительно чище, чем если decorator сам реализует всю authorization logic.

---

## Decorators не дают runtime validation TypeScript types автоматически

Например DTO:

```ts
class CreateUserDto {
  email: string;
  age: number;
}
```

Сам факт существования TypeScript declarations не проверяет incoming JSON.

HTTP request:

```json
{
  "email": 123,
  "age": "banana"
}
```

не становится автоматически valid только из-за class property types.

Для runtime validation в Nest обычно используется validation pipeline/schema/decorators соответствующей validation ecosystem.

Снова:

```text
TypeScript declaration
→ compile-time

HTTP JSON
→ runtime

между ними нужна validation
```

---

## Decorator-heavy architecture имеет trade-offs

### Плюсы

```text
меньше boilerplate
declarative APIs
framework integration
centralized cross-cutting behavior
dependency injection
metadata-driven tooling
```

### Минусы

```text
hidden control flow
runtime metadata complexity
harder debugging
framework coupling
decorator ordering subtleties
reflection limitations
```

Поэтому Senior Nest developer должен понимать не только:

> какой decorator куда поставить,

но и:

> **кто читает metadata, когда это происходит и какой runtime mechanism реально выполняет работу.**

---

## Вопросы на собеседовании

### Что такое decorator?

Это runtime mechanism/metaprogramming syntax, который позволяет framework или application code обработать class или class member и связать с ним metadata или behavior.

### Почему NestJS так активно использует decorators?

Потому что Nest является metadata-driven framework. Decorators описывают controllers, routes, providers, modules и другие framework concepts, после чего Nest runtime строит application graph и behavior.

### Почему interface нельзя использовать как Nest DI token?

Потому что interface erased при compilation. DI container работает runtime и ему нужен runtime token — например class, string или `Symbol`.

### Что делает `@Injectable()`?

Он участвует в объявлении class как Nest provider, которым может управлять IoC container. При этом provider также должен находиться в соответствующем module/container registration graph.

### Что такое `emitDecoratorMetadata`?

Это TypeScript mechanism, который при legacy decorator setup может emit design-type metadata для decorated declarations. Framework может использовать её runtime, но эта metadata не представляет всю TypeScript type system.

### Почему `Array<User>` нельзя полностью восстановить из runtime metadata?

Потому что generic argument `User` является TypeScript type information и стирается. Runtime может знать constructor `Array`, но не всю compile-time generic structure.

### Какую роль custom decorator обычно должен играть в Nest?

Чаще всего declarative: извлечь framework data или записать metadata. Сложную business logic лучше оставлять в services, guards, interceptors или domain layer, чтобы control flow не становился скрытым.

### В чём различие современных JavaScript decorators и legacy TypeScript decorators?

Это разные decorator models с отличающимися signatures, emit и capabilities. TypeScript поддерживает современную модель, а `experimentalDecorators` включает более старую implementation; legacy metadata patterns вроде `emitDecoratorMetadata` не являются просто частью новой decorator model.
