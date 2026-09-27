# Lesson 10 — Sets, Frozensets and Hashability

`set` — структура данных для хранения **уникальных hashable values**.

Пример:

```python
tags = {
    "python",
    "backend",
    "asyncio",
}
```

Главные свойства:

```text
unordered collection
unique values
fast membership checks
hash-based implementation
```

По mental model `set` ближе не к list, а к dictionary без associated values.

---

# 1. Создание set

```python
numbers = {
    1,
    2,
    3,
}
```

Проверим type:

```python
print(type(numbers))
```

→

```text
<class 'set'>
```

---

# 2. Empty set

Вот важная ловушка:

```python
value = {}
```

Это не set.

Это:

```text
dict
```

Empty set создаётся так:

```python
value = set()
```

---

# 3. Set хранит только уникальные values

Например:

```python
numbers = {
    1,
    2,
    2,
    3,
    3,
    3,
}

print(numbers)
```

Получим logically:

```python
{1, 2, 3}
```

Duplicates автоматически исчезают.

---

# 4. Поэтому set удобен для deduplication

Например:

```python
user_ids = [
    10,
    20,
    10,
    30,
    20,
]

unique_ids = set(user_ids)
```

Теперь:

```python
print(unique_ids)
```

содержит:

```text
10
20
30
```

Каждое значение только один раз.

---

# 5. Но set не гарантирует positional order

Нельзя мыслить:

```text
set[0]
set[1]
```

Set не sequence.

Такого нет:

```python
tags[0]
```

Получим:

```text
TypeError
```

У set нет обычного indexing.

---

# 6. Не полагайся на порядок iteration

Например:

```python
tags = {
    "python",
    "backend",
    "asyncio",
}

for tag in tags:
    print(tag)
```

Iteration order не нужно воспринимать как semantic guarantee.

Даже если несколько запусков выглядят одинаково, application logic не должна зависеть от этого.

Если нужен порядок — используй другую структуру.

---

# 7. Membership — главный use case

```python
allowed_roles = {
    "admin",
    "editor",
    "moderator",
}

if role in allowed_roles:
    ...
```

Average complexity:

```text
value in set → O(1)
```

Для list:

```text
value in list → O(n)
```

Поэтому set особенно полезен для frequent membership checks.

---

# 8. Почему membership быстрый

Set, как и dict, использует hashing.

Conceptually:

```text
value
 ↓
hash(value)
 ↓
table position
 ↓
lookup
```

Поэтому Python не обязан сканировать все элементы sequentially.

---

# 9. Добавление

```python
tags = set()

tags.add("python")
tags.add("backend")
```

Если добавить существующий value:

```python
tags.add("python")
```

ничего особенного не произойдёт.

Set всё равно содержит один `"python"`.

---

# 10. `add()` vs list `append()`

List:

```python
items.append(value)
```

может хранить duplicates.

Set:

```python
items.add(value)
```

хранит value максимум один раз по equality/hash semantics.

---

# 11. Удаление через `remove()`

```python
tags = {
    "python",
    "backend",
}

tags.remove("backend")
```

Если value отсутствует:

```python
tags.remove("java")
```

получим:

```text
KeyError
```

---

# 12. `discard()`

Если отсутствие value нормально:

```python
tags.discard("java")
```

Exception не будет.

Разница:

```text
remove()
→ missing value = KeyError

discard()
→ missing value = no-op
```

---

# 13. `pop()`

```python
value = tags.pop()
```

удаляет и возвращает какой-то element.

Важно:

> `set.pop()` не означает «удалить последний element».

У set нет semantic notion последнего элемента.

---

# 14. Set operations

Set особенно полезен для операций теории множеств.

Пусть:

```python
backend = {
    "python",
    "postgres",
    "redis",
}

candidate = {
    "python",
    "docker",
    "redis",
}
```

---

# 15. Intersection

Что есть в обоих sets:

```python
backend & candidate
```

или:

```python
backend.intersection(candidate)
```

Результат:

```python
{
    "python",
    "redis",
}
```

---

# 16. Union

Все values из обоих:

```python
backend | candidate
```

Результат:

```python
{
    "python",
    "postgres",
    "redis",
    "docker",
}
```

Duplicates отсутствуют автоматически.

---

# 17. Difference

Что есть в `backend`, но нет в `candidate`:

```python
backend - candidate
```

Результат:

```python
{
    "postgres",
}
```

---

# 18. Symmetric difference

Values, которые есть только в одном из sets:

```python
backend ^ candidate
```

Результат:

```python
{
    "postgres",
    "docker",
}
```

---

# 19. Subset

```python
required = {
    "python",
    "redis",
}

skills = {
    "python",
    "redis",
    "postgres",
}
```

Проверка:

```python
required <= skills
```

→

```text
True
```

То есть все required values входят в `skills`.

---

# 20. Proper subset

```python
required < skills
```

означает:

* `required` subset `skills`;
* sets при этом не равны.

---

# 21. Superset

```python
skills >= required
```

→

```text
True
```

Очень удобно для permissions/features.

Например:

```python
required_permissions <= user_permissions
```

читается почти как business rule.

---

# 22. Set comprehension

Как и list/dict:

```python
names = [
    "Alex",
    "alex",
    "Bob",
    "BOB",
]

normalized = {
    name.lower()
    for name in names
}
```

Результат:

```python
{
    "alex",
    "bob",
}
```

Transformation и deduplication происходят сразу.

---

# 23. Elements должны быть hashable

Можно:

```python
values = {
    1,
    "hello",
    (10, 20),
}
```

Нельзя:

```python
values = {
    [1, 2],
}
```

Получим:

```text
TypeError: unhashable type: 'list'
```

---

# 24. Почему set требует hashability

Set использует тот же базовый принцип, что и dictionary keys:

```text
hash(value)
+
equality
```

Если object может менять equality/hash semantics во время нахождения внутри set, lookup становится ненадёжным.

Поэтому mutable containers вроде:

```text
list
dict
set
```

обычно unhashable.

---

# 25. Hashability не равна immutability на 100%

Полезное правило:

```text
immutable
→ often hashable
```

Но не всегда.

Например:

```python
value = (
    1,
    [2, 3],
)
```

Tuple immutable structurally.

Но:

```python
hash(value)
```

не работает, потому что nested list unhashable.

---

# 26. `frozenset`

`frozenset` — immutable версия set.

Создание:

```python
permissions = frozenset({
    "read",
    "write",
})
```

Нельзя:

```python
permissions.add("delete")
```

Потому что object immutable.

---

# 27. Зачем нужен `frozenset`

Главное преимущество:

> hashable set-like value.

Например ordinary set нельзя использовать как dictionary key:

```python
data = {
    {"admin", "editor"}: "value"
}
```

не работает.

Но:

```python
data = {
    frozenset({"admin", "editor"}): "value",
}
```

работает.

---

# 28. Frozenset как composite unordered key

Представим cache, где порядок permissions неважен.

```python
cache = {}

key = frozenset({
    "read",
    "write",
})

cache[key] = "result"
```

Следующий key:

```python
frozenset({
    "write",
    "read",
})
```

равен первому.

Это удобно, когда:

```text
{A, B}
```

и:

```text
{B, A}
```

semantic one thing.

---

# 29. Tuple vs frozenset как key

Tuple:

```python
("read", "write")
```

порядок важен.

```python
("write", "read")
```

— другой tuple.

Frozenset:

```python
frozenset({"read", "write"})
```

и:

```python
frozenset({"write", "read"})
```

равны.

Поэтому выбор зависит от semantics.

---

# 30. Set equality

Order не имеет значения.

```python
a = {
    1,
    2,
    3,
}

b = {
    3,
    2,
    1,
}

print(a == b)
```

→

```text
True
```

Equality определяется membership, а не order.

---

# 31. Set и `True` / `1`

Из предыдущих уроков:

```python
True == 1
```

→ `True`

И hashes совместимы.

Поэтому:

```python
values = {
    True,
    1,
}
```

фактически будет иметь один unique element.

```python
print(len(values))
```

→

```text
1
```

Это та же логика, что у dictionary keys.

---

# 32. Set может быть быстрее list, но не всегда нужен

Допустим:

```python
blocked_ids = [...]
```

Если ты один раз проходишь по collection:

```python
for user_id in blocked_ids:
    ...
```

set может ничего не улучшить.

Но если делаешь тысячи checks:

```python
if user_id in blocked_ids:
```

set может дать существенную разницу.

---

# 33. Cost преобразования в set

Создание:

```python
blocked_set = set(blocked_ids)
```

само стоит примерно:

```text
O(n)
```

Поэтому бессмысленно писать:

```python
if user_id in set(blocked_ids):
```

много раз в loop.

Ты будешь постоянно заново строить set.

Лучше:

```python
blocked_set = set(blocked_ids)

for user in users:
    if user.id in blocked_set:
        ...
```

---

# 34. Реальный performance пример

Допустим:

```python
allowed_ids = [1, 2, 3, ...]
```

и:

```python
users = [...]
```

Плохой pattern:

```python
for user in users:
    if user["id"] in allowed_ids:
        ...
```

Если обе collections большие, получится примерно:

```text
O(n * m)
```

Можно:

```python
allowed_ids = set(allowed_ids)
```

и затем membership будет average O(1).

Тогда общий pattern ближе к:

```text
O(n + m)
```

---

# 35. Set полезен для comparing collections

Например API вернул current permissions:

```python
current = {
    "read",
    "write",
}
```

Нужные permissions:

```python
required = {
    "read",
    "delete",
}
```

Missing:

```python
missing = required - current
```

Получим:

```python
{
    "delete",
}
```

Это намного яснее ручных nested loops.

---

# 36. Deduplication теряет ordering semantics

Можно сделать:

```python
unique = list(set(values))
```

Это удалит duplicates.

Но не используй этот pattern, если тебе важен original order.

В современном Python для order-preserving deduplication можно использовать:

```python
unique = list(
    dict.fromkeys(values)
)
```

или explicit loop.

---

# 37. JS / TS comparison

JavaScript имеет встроенный:

```js
const values = new Set([
    1,
    2,
    3,
]);
```

По базовому назначению он похож:

```text
unique values
fast membership
set-like collection
```

JavaScript:

```js
values.has(2);
values.add(4);
values.delete(1);
```

Python:

```python
2 in values
values.add(4)
values.remove(1)
```

---

# 38. Key difference: JS Set equality model

JavaScript Set может хранить object references:

```js
const a = { id: 1 };
const b = { id: 1 };

const values = new Set([a, b]);
```

Это два разных elements, потому что objects разные references.

Python custom objects могут определять:

```python
__eq__
__hash__
```

и таким образом влиять на set uniqueness.

---

# 39. Python set более тесно связан с object model

Например custom value object:

```python
class UserId:
    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        if not isinstance(other, UserId):
            return NotImplemented

        return self.value == other.value

    def __hash__(self):
        return hash(self.value)
```

Теперь:

```python
values = {
    UserId(10),
    UserId(10),
}
```

set может считать эти objects одинаковыми.

Итоговая длина:

```text
1
```

если equality/hash implementation согласована.

---

# 40. Главное правило `__eq__` + `__hash__`

Для hashable objects:

```text
if a == b

then

hash(a) == hash(b)
```

обязательно должно выполняться.

Обратное неверно:

```text
same hash
```

не обязательно означает:

```text
equal objects
```

потому что collisions возможны.

---

# Common Mistakes

## 1. Создавать empty set через `{}`

```python
value = {}
```

Это dict.

Правильно:

```python
value = set()
```

---

## 2. Использовать set, когда важен order

Set — не ordered sequence.

---

## 3. Пытаться положить list в set

```python
{
    [1, 2]
}
```

не работает, потому что list unhashable.

---

## 4. Строить set заново при каждом membership check

Плохо:

```python
for user in users:
    if user["id"] in set(ids):
        ...
```

Лучше построить set один раз.

---

## 5. Использовать `remove()` там, где отсутствие value нормально

Если missing допустим:

```python
values.discard(value)
```

часто лучше.

---

# Practical Example

Есть permissions пользователя:

```python
user_permissions = {
    "users:read",
    "users:update",
    "reports:read",
}
```

Endpoint требует:

```python
required_permissions = {
    "users:read",
    "users:update",
}
```

Проверка:

```python
if required_permissions <= user_permissions:
    allow()
```

Найти missing permissions:

```python
missing = (
    required_permissions
    - user_permissions
)
```

Такой код намного точнее отражает domain semantics, чем nested loops и несколько `if`.

---

# Interview Questions

## 1. How is a Python set implemented conceptually?

**Ответ:**

Как hash-based collection, похожая на dictionary без associated values.

Set использует hash и equality для определения membership и uniqueness.

Average membership lookup:

```text
O(1)
```

---

## 2. What is the main difference between `set` and `list`?

**Ответ:**

List:

```text
ordered sequence
duplicates allowed
indexing
membership O(n)
```

Set:

```text
unique hashable values
no positional indexing
membership average O(1)
```

---

## 3. Why must set elements be hashable?

**Ответ:**

Set использует hash для хранения и поиска elements.

Если object's hash/equality semantics могут изменяться после insertion, lookup станет некорректным.

Поэтому mutable containers обычно unhashable.

---

## 4. What is the difference between `set` and `frozenset`?

**Ответ:**

`set` mutable.

`frozenset` immutable и hashable, поэтому его можно использовать:

* как dictionary key;
* как element другого set;
* как immutable unordered value object.

---

## 5. What is the difference between `remove()` and `discard()`?

**Ответ:**

```python
values.remove(x)
```

выбрасывает `KeyError`, если `x` отсутствует.

```python
values.discard(x)
```

ничего не делает при отсутствии `x`.

---

# Check Yourself

## 1

```python
values = {
    1,
    2,
    2,
    3,
}

print(len(values))
```

**Ответ:**

```text
3
```

---

## 2

```python
values = {}

print(type(values))
```

**Ответ:**

```text
<class 'dict'>
```

---

## 3

```python
a = {
    1,
    2,
    3,
}

b = {
    2,
    3,
    4,
}

print(a & b)
```

**Ответ:**

```python
{2, 3}
```

---

## 4

```python
required = {
    "read",
}

permissions = {
    "read",
    "write",
}

print(required <= permissions)
```

**Ответ:**

```text
True
```

---

## 5

```python
values = {
    True,
    1,
}

print(len(values))
```

**Ответ:**

```text
1
```

Потому что `True == 1`, и их hashes совместимы.

---

# Главное из урока

`set` — это:

```text
hash-based collection
+
unique values
+
average O(1) membership
```

Основные operations:

```text
&  intersection
|  union
-  difference
^  symmetric difference

<= subset
>= superset
```

`frozenset` даёт те же set semantics, но immutable и может быть hashable.

Главный practical критерий:

> Если тебе не нужен positional order, но нужны uniqueness и быстрые membership checks, `set` часто является правильнее `list`.

## Interview questions

### Что требуется от hashable object, используемого как key?

Его hash должен оставаться стабильным, пока object используется как key, и равные objects должны иметь одинаковый hash. Поэтому изменяемые objects обычно не подходят для keys.

### Чем `set` отличается от `frozenset`?

Оба хранят уникальные hashable values и поддерживают set operations. `set` mutable и сам не hashable, а `frozenset` immutable и может быть key в dictionary, если его элементы hashable.
