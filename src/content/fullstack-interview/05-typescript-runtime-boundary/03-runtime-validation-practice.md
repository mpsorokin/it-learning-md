# Практика: unknown JSON

## Interview questions

### Получить неизвестный JSON:
<!-- question-id: fullstack-interview-05-typescript-runtime-boundary-014 -->

```ts
const data: unknown = await fetch(...).then(r => r.json());
```

и безопасно превратить его в domain type.

#### Ответ
В условии не задана форма domain type, поэтому ниже — **допущение для примера**: API должен вернуть `{ id, name, email, role }`, где `role` — `"admin"` или `"member"`. В реальном проекте контракт и правила email должны прийти из доменной модели/API. `fetch` отдельно проверяет HTTP-статус; JSON разбирается как `unknown`, после чего функция возвращает новый объект только после проверок.

```ts
type Role = "admin" | "member";
type User = { id: string; name: string; email: string; role: Role };
type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUser(value: unknown): User {
  if (!isJsonObject(value)) throw new Error("Invalid user response");

  const { id, name, email, role } = value;
  if (
    typeof id !== "string" || id.length === 0 ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    (role !== "admin" && role !== "member")
  ) {
    throw new Error("Invalid user response");
  }

  return { id, name, email, role };
}

async function loadUser(id: string): Promise<User> {
  const response = await fetch("/api/users/" + encodeURIComponent(id));
  if (!response.ok) throw new Error("User request failed: " + response.status);

  const data: unknown = await response.json();
  return parseUser(data);
}
```

Проверка должна быть глубокой и соответствовать реальному контракту; для сложных схем удобнее Zod/Joi или другая runtime-схема. В production добавляют типизированные ошибки валидации, корректно отображают 4xx/5xx, ограничивают размер тела и не логируют чувствительный payload. Не превращайте сетевое значение в `User` простым `as User`.

