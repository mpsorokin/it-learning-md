# Lesson 13 — Unpacking: `*`, `**` and Extended Assignment

Unpacking — одна из очень характерных Python-фич.

Базовая идея:

> взять структуру из нескольких values и связать её элементы с отдельными names.

Например:

```python
point = (10, 20)

x, y = point
```

Теперь:

```text
x → 10
y → 20
```

Но unpacking в Python идёт намного дальше обычного tuple destructuring.

---

# 1. Basic unpacking

```python
user = (
    "Alex",
    35,
    "admin",
)

name, age, role = user
```

Это работает не только с tuple.

Например list:

```python
name, age = [
    "Alex",
    35,
]
```

String:

```python
a, b, c = "ABC"
```

Получим:

```text
a = "A"
b = "B"
c = "C"
```

Главное требование:

> object должен быть iterable и отдавать нужное количество elements.

---

# 2. Количество values должно совпадать

```python
x, y = [10, 20]
```

работает.

Но:

```python
x, y = [10, 20, 30]
```

даст:

```text
ValueError: too many values to unpack
```

А:

```python
x, y, z = [10, 20]
```

даст:

```text
ValueError: not enough values to unpack
```

---

# 3. Starred unpacking

Если количество middle elements заранее неизвестно, можно использовать:

```python
*
```

Например:

```python
first, *rest = [
    1,
    2,
    3,
    4,
]
```

Результат:

```python
first
# 1

rest
# [2, 3, 4]
```

Starred target получает `list`.

---

# 4. Можно собрать середину

```python
first, *middle, last = [
    1,
    2,
    3,
    4,
    5,
]
```

Получим:

```python
first
# 1

middle
# [2, 3, 4]

last
# 5
```

---

# 5. Starred target может получить empty list

```python
first, *middle, last = [
    1,
    2,
]
```

Результат:

```python
first
# 1

middle
# []

last
# 2
```

---

# 6. Можно использовать только один starred target

Нельзя:

```python
first, *middle, *rest = values
```

Python не сможет однозначно определить, как разделить values.

Разрешён максимум один starred target в одном unpacking level.

---

# 7. Игнорирование values

Часто используют `_`:

```python
name, _, role = (
    "Alex",
    35,
    "admin",
)
```

`_` — не специальный syntax.

Это обычное имя.

Convention:

> это значение нам не интересно.

---

Можно:

```python
first, *_, last = values
```

если middle values не нужны.

---

# 8. Nested unpacking

Unpacking может быть nested.

Например:

```python
user = (
    "Alex",
    (
        "Bucharest",
        "Romania",
    ),
)

name, (city, country) = user
```

Получаем:

```text
name    → Alex
city    → Bucharest
country → Romania
```

---

# 9. Unpacking в `for`

Очень распространённый pattern:

```python
users = [
    ("Alex", 30),
    ("Bob", 35),
]

for name, age in users:
    print(name, age)
```

Каждый element iterable unpacked прямо в loop target.

---

# 10. `dict.items()` + unpacking

```python
user = {
    "name": "Alex",
    "age": 35,
}

for key, value in user.items():
    print(key, value)
```

`items()` выдаёт pairs:

```text
("name", "Alex")
("age", 35)
```

которые автоматически unpack.

---

# 11. `enumerate()` тоже работает через unpacking

```python
for index, user in enumerate(users):
    ...
```

`enumerate()` отдаёт pairs:

```text
(index, value)
```

А loop target:

```python
index, user
```

их unpack.

---

# 12. `zip()` аналогично

```python
names = [
    "Alex",
    "Bob",
]

ages = [
    30,
    35,
]

for name, age in zip(names, ages):
    ...
```

`zip()` выдаёт tuples, которые unpacked на каждой iteration.

---

# 13. Swap

Классический Python pattern:

```python
a = 10
b = 20

a, b = b, a
```

После:

```text
a = 20
b = 10
```

Правая часть сначала вычисляется, а потом происходит assignment targets.

Поэтому temporary variable не нужен.

---

# 14. Multiple return values

Например:

```python
def get_bounds():
    return 10, 100
```

Функция фактически возвращает tuple.

Можно:

```python
minimum, maximum = get_bounds()
```

Это обычный unpacking.

---

# 15. `*` справа от assignment

`*` используется не только в targets.

Можно unpack iterable внутрь новой collection.

Например:

```python
a = [1, 2]
b = [3, 4]

result = [
    *a,
    *b,
    5,
]
```

Получим:

```python
[1, 2, 3, 4, 5]
```

---

# 16. Tuple unpacking через `*`

```python
values = (
    *range(3),
    10,
)
```

Получим:

```python
(0, 1, 2, 10)
```

---

# 17. Set unpacking

Можно:

```python
a = {1, 2}
b = {2, 3}

result = {
    *a,
    *b,
}
```

Результат logically:

```python
{1, 2, 3}
```

Поскольку set удаляет duplicates.

---

# 18. Function arguments: `*`

Очень важный use case:

```python
def add(a, b):
    return a + b
```

Есть tuple:

```python
values = (
    10,
    20,
)
```

Можно:

```python
result = add(*values)
```

Conceptually:

```python
add(10, 20)
```

---

# 19. Что делает `*args` при call

```python
function(*iterable)
```

означает:

> взять elements iterable и передать их как positional arguments.

Например:

```python
values = [
    1,
    2,
    3,
]

print(*values)
```

Conceptually:

```python
print(
    1,
    2,
    3,
)
```

---

# 20. `**` для dictionaries

Если функция:

```python
def create_user(
    name,
    age,
):
    return {
        "name": name,
        "age": age,
    }
```

и есть:

```python
data = {
    "name": "Alex",
    "age": 35,
}
```

можно:

```python
user = create_user(**data)
```

Conceptually:

```python
create_user(
    name="Alex",
    age=35,
)
```

---

# 21. Keys должны совпадать с parameter names

Например:

```python
data = {
    "username": "Alex",
    "age": 35,
}

create_user(**data)
```

если function ожидает `name`, получим `TypeError`.

`**` не делает mapping автоматически.

Dictionary keys становятся keyword argument names.

---

# 22. `**` при создании dict

Например:

```python
base = {
    "timeout": 10,
    "debug": False,
}

config = {
    **base,
    "debug": True,
}
```

Результат:

```python
{
    "timeout": 10,
    "debug": True,
}
```

Последнее значение одинакового key побеждает.

---

# 23. Merge нескольких mappings

```python
defaults = {
    "timeout": 10,
    "retries": 2,
}

environment = {
    "timeout": 20,
}

user_config = {
    "debug": True,
}
```

Можно:

```python
config = {
    **defaults,
    **environment,
    **user_config,
}
```

Order важен:

```text
later keys override earlier keys
```

---

# 24. `*` и `**` имеют разные роли

Очень грубо:

```text
*
→ positional sequence expansion

**
→ keyword mapping expansion
```

Например:

```python
args = [
    10,
    20,
]

kwargs = {
    "scale": 2,
}
```

```python
calculate(
    *args,
    **kwargs,
)
```

---

# 25. JS / TS comparison

JavaScript destructuring:

```js
const [first, ...rest] = values;
```

Python:

```python
first, *rest = values
```

Очень похожая идея.

---

JavaScript object spread:

```js
const config = {
    ...defaults,
    debug: true,
};
```

Python:

```python
config = {
    **defaults,
    "debug": True,
}
```

Здесь mental bridge довольно прямой.

---

# 26. Но syntax role отличается

JavaScript:

```js
function foo(...args) {
}
```

Python:

```python
def foo(*args):
    ...
```

На уровне идеи это похоже:

> собрать positional arguments.

При call:

JavaScript:

```js
foo(...values);
```

Python:

```python
foo(*values)
```

---

# 27. Unpacking не означает deep copy

Например:

```python
users = [
    {"id": 1},
    {"id": 2},
]

copy = [
    *users,
]
```

Outer list новый.

Но dictionaries shared.

```python
copy[0]["id"] = 100

print(users[0]["id"])
```

→

```text
100
```

Unpacking копирует references, не object graph.

---

# 28. Dictionary unpacking тоже shallow

```python
original = {
    "settings": {
        "debug": False,
    },
}

copy = {
    **original,
}

copy["settings"]["debug"] = True
```

Теперь original тоже видит mutation nested dictionary.

---

# 29. Unpacking arbitrary iterables

Starred unpacking не ограничен list/tuple.

Например:

```python
values = [
    *range(5),
]
```

Получим:

```python
[0, 1, 2, 3, 4]
```

Можно unpack generator:

```python
values = [
    *(x * 2 for x in range(3)),
]
```

Но здесь уже происходит eager materialization всех values.

---

# 30. Осторожно с огромными iterables

Например:

```python
values = [
    *range(100_000_000),
]
```

создаёт огромный list.

Хотя:

```python
range(100_000_000)
```

сам по себе memory-efficient.

Unpacking materializes iterable.

Это важный performance distinction.

---

# Common Mistakes

## 1. Забывать, что starred target получает list

```python
first, *rest = (1, 2, 3)
```

`rest` будет:

```python
[2, 3]
```

не tuple.

---

## 2. Путать `*` и `**`

```text
*
→ positional

**
→ keyword/mapping
```

---

## 3. Ожидать deep copy от unpacking

```python
copy = [*original]
```

shallow.

---

## 4. Использовать `**data`, когда keys не совпадают с parameters

Это приведёт к `TypeError`.

---

## 5. Materialize огромный iterable через `*`

```python
[*huge_range]
```

может создать большой memory allocation.

---

# Practical Example

Есть default query:

```python
defaults = {
    "limit": 20,
    "offset": 0,
}
```

Пользователь передал overrides:

```python
params = {
    "limit": 50,
}
```

Можно собрать:

```python
query = {
    **defaults,
    **params,
}
```

Получим:

```python
{
    "limit": 50,
    "offset": 0,
}
```

А затем передать function:

```python
def fetch_users(
    limit,
    offset,
):
    ...
```

```python
fetch_users(**query)
```

Это хороший пример двух разных usages `**`:

```text
mapping → mapping expansion

mapping → keyword arguments
```

---

# Interview Questions

## 1. What is unpacking in Python?

**Ответ:**

Это распределение элементов iterable по нескольким assignment targets.

Например:

```python
x, y = (10, 20)
```

создаёт bindings:

```text
x → 10
y → 20
```

---

## 2. What does a starred target do?

**Ответ:**

Собирает оставшиеся values в list.

Например:

```python
first, *rest = [1, 2, 3]
```

получаем:

```text
first = 1
rest = [2, 3]
```

---

## 3. What does `*values` mean in a function call?

**Ответ:**

Elements iterable разворачиваются в positional arguments.

```python
values = (10, 20)

foo(*values)
```

эквивалентно:

```python
foo(10, 20)
```

---

## 4. What does `**mapping` mean in a function call?

**Ответ:**

Keys mapping становятся keyword argument names, values — их arguments.

```python
data = {
    "name": "Alex",
}
```

```python
foo(**data)
```

эквивалентно:

```python
foo(name="Alex")
```

---

## 5. Is collection unpacking a deep copy?

**Ответ:**

Нет.

Например:

```python
copy = [*original]
```

создаёт новый outer list, но nested objects остаются shared.

То есть copy shallow.

---

# Check Yourself

## 1

```python
first, *middle, last = [
    1,
    2,
    3,
    4,
]

print(middle)
```

**Ответ:**

```python
[2, 3]
```

---

## 2

```python
a = [1, 2]
b = [3, 4]

print([
    *a,
    *b,
])
```

**Ответ:**

```python
[1, 2, 3, 4]
```

---

## 3

```python
def add(a, b):
    return a + b


values = (
    10,
    20,
)

print(add(*values))
```

**Ответ:**

```text
30
```

---

## 4

```python
def create(name, age):
    return name, age


data = {
    "name": "Alex",
    "age": 35,
}

print(create(**data))
```

**Ответ:**

```python
("Alex", 35)
```

---

## 5

```python
original = [
    {"id": 1},
]

copy = [
    *original,
]

copy[0]["id"] = 10

print(original)
```

**Ответ:**

```python
[
    {"id": 10},
]
```

Outer list новый, dictionary shared.

---

# Главное из урока

Basic unpacking:

```python
a, b = values
```

Extended unpacking:

```python
first, *middle, last = values
```

Expansion:

```python
[*values]
```

Function positional expansion:

```python
foo(*args)
```

Keyword expansion:

```python
foo(**kwargs)
```

Dictionary merge:

```python
{
    **defaults,
    **overrides,
}
```

И главное:

> `*` и `**` работают с structure/bindings и references; они не означают automatic deep copy.
