# Function overloads

## Interview questions

### Overloads.
<!-- question-id: fullstack-interview-04-typescript-advanced-025 -->

#### Ответ

Overloads описывают несколько допустимых публичных способов вызова одной функции, когда форма аргументов связана с типом результата. Сначала пишут сигнатуры, затем одну реализацию:

```ts
function parse(value: string): Date;
function parse(value: number): Date;
function parse(value: string | number): Date {
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid date");
  return new Date(timestamp);
}
```

Вызывающий получает только обещания overload-сигнатур, а тело обязано корректно обрабатывать их объединённый вход. Более специфичные overload обычно ставят раньше общего, иначе общий может затенить нужный вывод. Overload оправдан, когда разные формы вызова дают разную точность результата; если достаточно одинакового результата, проще и удобнее union параметра. Если возможен аргумент string | number, добавьте такую overload-сигнатуру или выберите union, иначе TS не сможет сопоставить union-аргумент с единственной сигнатурой.

### Почему overload implementation signature не видна caller'у?
<!-- question-id: fullstack-interview-04-typescript-advanced-026 -->

#### Ответ

Implementation signature описывает только внутреннюю реализацию и специально не считается публичным обещанием: callers могут использовать лишь явно объявленные overload-сигнатуры. Например, реализация с двумя optional parameters не означает, что разрешён вызов с любым их количеством — допустимы только формы, объявленные overloads. Это разделяет широкий тип, удобный для проверки тела (часто union входов и общий результат), и точный контракт API (связь аргумента с результатом). Проверка компилятора требует, чтобы implementation была совместима со всеми overloads, но не доказывает runtime-ветвление; тесты должны подтверждать каждую публичную форму. Если overloads не дают дополнительной точности, замените их на union-сигнатуру.
