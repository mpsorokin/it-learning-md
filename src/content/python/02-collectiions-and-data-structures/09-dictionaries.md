# Lesson 9 — Dictionaries: Hash Tables, Keys and Lookup

`dict` — одна из центральных структур Python.

На уровне syntax:

```python
user = {
    "id": 42,
    "name": "Alex",
    "active": True,
}
```

Но важно понимать, что `dict` — это не просто «объект с полями», как легко подумать после JavaScript.

Концептуально Python dictionary — это:

> **hash table, которая связывает hashable keys с arbitrary Python objects.**

---

# 1. Базовая модель

```python
user = {
    "id": 42,
    "name": "Alex",
}
```

Можно представить так:

```text
dict
├── "id"   → 42
└── "name" → "Alex"
```

Keys и values — Python objects.

Например valid dictionary:

```python
data = {
    1: "integer key",
    "1": "string key",
    (10, 20): "tuple key",
    None: "none key",
}
```

---

# 2. Lookup по key

```python
user = {
    "id": 42,
    "name": "Alex",
}

print(user["name"])
```

Результат:

```text
Alex
```

Dictionary не ищет `"name"` последовательным перебором всех keys, как list.

Он использует hashing.

В среднем:

```text
dict[key] → O(1)
```

---

# 3. Что такое hash

Python может получить hash для hashable object:

```python
print(hash("name"))
print(hash(42))
print(hash((10, 20)))
```

Hash — integer, который используется dictionary для определения, где примерно искать key.

Очень упрощённо:

```text
key
 ↓
hash(key)
 ↓
table position
 ↓
stored key/value
```

---

# 4. Hash не является уникальным ID

Два разных objects теоретически могут иметь одинаковый hash.

Это называется:

```text
hash collision
```

Поэтому dictionary не делает только:

```text
hash совпал
→ key найден
```

После нахождения candidate Python также должен проверить equality keys.

Conceptually:

```text
hash
+
equality
```

оба участвуют в lookup.

---

# 5. Почему lookup обычно O(1)

Dictionary организован так, чтобы по hash быстро перейти к небольшой области таблицы.

Поэтому средняя complexity:

```text
lookup   → O(1)
insert   → O(1)
delete   → O(1)
```

Это average-case complexity.

Worst-case theoretical behaviour может быть хуже, особенно при pathological collisions.

Но для нормального application code mental model:

```text
dict lookup ≈ O(1)
```

---

# 6. Keys должны быть hashable

Можно:

```python
data = {
    "name": "Alex",
    42: "answer",
    (10, 20): "point",
}
```

Но нельзя:

```python
data = {
    [1, 2]: "value",
}
```

Получим:

```text
TypeError: unhashable type: 'list'
```

List mutable, поэтому не может использоваться как normal dictionary key.

---

# 7. Почему mutable key опасен

Представим hypothetical mutable key:

```text
key = [1, 2]

hash(key) = X
```

Dictionary положил его в bucket, соответствующий `X`.

Потом key изменился:

```text
[1, 2, 3]
```

и logical hash стал `Y`.

Теперь dictionary не понимает, где его искать.

Поэтому key должен иметь стабильные equality/hash semantics.

---

# 8. Tuple как key

Tuple часто подходит:

```python
cache = {
    ("user", 42): "cached result",
}
```

Но tuple hashable только если его элементы тоже hashable.

Работает:

```python
key = ("user", 42)
```

Не работает:

```python
key = ("user", [42])
```

потому что внутри есть list.

---

# 9. Insert и update

Добавить value:

```python
user = {}

user["name"] = "Alex"
```

Обновить:

```python
user["name"] = "Bob"
```

Один syntax используется и для insert, и для update.

---

# 10. Key uniqueness

Dictionary не хранит несколько одинаковых keys.

```python
user = {
    "name": "Alex",
    "name": "Bob",
}
```

Результат:

```python
{
    "name": "Bob",
}
```

Последнее значение заменяет предыдущее.

---

# 11. `KeyError`

Если key отсутствует:

```python
user = {
    "name": "Alex",
}

print(user["age"])
```

получим:

```text
KeyError
```

Это правильное behaviour, если отсутствие key считается ошибкой.

---

# 12. `.get()`

Если missing key — нормальная ситуация:

```python
age = user.get("age")
```

Если key нет:

```python
age is None
```

Можно указать default:

```python
age = user.get("age", 0)
```

---

# 13. `dict[key]` vs `.get()`

Используй:

```python
user["id"]
```

когда key **обязан существовать**.

Используй:

```python
user.get("nickname")
```

когда отсутствие key допустимо.

Не нужно механически заменять все `[]` на `.get()`.

Иногда `KeyError` как раз помогает быстро обнаружить invalid state.

---

# 14. Важный нюанс `.get()`

Например:

```python
user = {
    "nickname": None,
}
```

Теперь:

```python
user.get("nickname")
```

→ `None`

Но:

```python
user.get("missing")
```

тоже → `None`.

То есть эти состояния не различаются.

Если distinction важно:

```python
if "nickname" in user:
    ...
```

или используй sentinel.

---

# 15. Membership проверяет keys

```python
user = {
    "name": "Alex",
    "role": "admin",
}
```

```python
"name" in user
```

→ `True`

Но:

```python
"Alex" in user
```

→ `False`

`in dict` проверяет **keys**, не values.

Average complexity:

```text
key in dict → O(1)
```

---

# 16. Values membership

Если нужно искать value:

```python
"Alex" in user.values()
```

Но это уже обычно требует последовательного поиска:

```text
O(n)
```

Если frequent lookup идёт по value, возможно, data structure организована неправильно.

---

# 17. `.keys()`, `.values()`, `.items()`

```python
user = {
    "name": "Alex",
    "role": "admin",
}
```

Keys:

```python
user.keys()
```

Values:

```python
user.values()
```

Pairs:

```python
user.items()
```

---

# 18. Iteration

Обычный loop:

```python
for key in user:
    print(key)
```

итерирует keys.

То же самое:

```python
for key in user.keys():
    print(key)
```

Первый вариант обычно проще.

---

# 19. Iteration через `.items()`

Очень распространённый pattern:

```python
for key, value in user.items():
    print(key, value)
```

`items()` отдаёт key-value pairs, которые удобно unpack.

---

# 20. Dictionary сохраняет insertion order

Современный Python гарантирует сохранение insertion order.

Например:

```python
data = {
    "a": 1,
    "b": 2,
    "c": 3,
}
```

Iteration идёт:

```text
a
b
c
```

Это language guarantee в современных версиях Python, а не случайность implementation.

Но важно:

> ordered dictionary всё ещё остаётся hash table, а не list.

---

# 21. Обновление key не переносит его в конец

Например:

```python
data = {
    "a": 1,
    "b": 2,
}

data["a"] = 100
```

Order остаётся:

```text
a
b
```

Потому что key уже существовал.

---

# 22. `update()`

Можно обновить несколько entries:

```python
user = {
    "name": "Alex",
}

user.update({
    "age": 35,
    "role": "admin",
})
```

`user` мутируется.

Можно также:

```python
user.update(
    age=35,
    role="admin",
)
```

---

# 23. Dictionary unpacking

Можно создавать новый dict через:

```python
base = {
    "timeout": 10,
    "retries": 2,
}

config = {
    **base,
    "timeout": 30,
}
```

Получим:

```python
{
    "timeout": 30,
    "retries": 2,
}
```

Позднее value для одинакового key побеждает.

---

# 24. `|` для dictionaries

Современный Python поддерживает merge:

```python
base = {
    "timeout": 10,
}

override = {
    "timeout": 30,
    "debug": True,
}

config = base | override
```

Создаётся новый dictionary.

Result:

```python
{
    "timeout": 30,
    "debug": True,
}
```

---

# 25. `|=` мутирует dictionary

```python
config |= override
```

изменяет существующий `config`.

То есть снова:

```text
|
→ new dict

|=
→ in-place update
```

---

# 26. Dictionary copying shallow

```python
original = {
    "headers": {
        "Accept": "application/json",
    },
}

copy = original.copy()
```

Outer dict новый.

Inner dict shared.

Поэтому:

```python
copy["headers"]["Authorization"] = "token"
```

изменит nested dictionary, видимый через `original`.

Это тот же shallow-copy behaviour, который мы уже видели.

---

# 27. Удаление

Через:

```python
del user["role"]
```

Если key отсутствует:

```text
KeyError
```

---

Через:

```python
role = user.pop("role")
```

`pop()` одновременно удаляет и возвращает value.

Можно указать default:

```python
role = user.pop("role", None)
```

---

# 28. `setdefault()`

Например:

```python
groups = {}

groups.setdefault(
    "backend",
    [],
).append("Alex")
```

Если `"backend"` отсутствует, создаётся empty list.

Потом append.

Result:

```python
{
    "backend": ["Alex"],
}
```

Но для подобных patterns часто лучше `defaultdict`.

---

# 29. `defaultdict`

Например:

```python
from collections import defaultdict

groups = defaultdict(list)

groups["backend"].append("Alex")
groups["backend"].append("Bob")
```

Получаем:

```python
{
    "backend": [
        "Alex",
        "Bob",
    ],
}
```

Missing key автоматически получает value из factory `list`.

---

# 30. Dictionary comprehension

Например:

```python
users = [
    {"id": 1, "name": "Alex"},
    {"id": 2, "name": "Bob"},
]

users_by_id = {
    user["id"]: user
    for user in users
}
```

Результат:

```python
{
    1: {"id": 1, "name": "Alex"},
    2: {"id": 2, "name": "Bob"},
}
```

Очень полезный pattern:

> превратить list в lookup table.

---

# 31. Почему это может дать огромную разницу

Представим list:

```python
users = [...]
```

Каждый раз искать:

```python
next(
    user
    for user in users
    if user["id"] == user_id
)
```

стоит:

```text
O(n)
```

Если сделать:

```python
users_by_id = {
    user["id"]: user
    for user in users
}
```

lookup:

```python
users_by_id[user_id]
```

в среднем:

```text
O(1)
```

Это типичный пример выбора data structure под access pattern.

---

# 32. Dict как record vs dict как map

Python dict используется в двух разных ролях.

## Record-like data

```python
user = {
    "id": 42,
    "name": "Alex",
    "active": True,
}
```

Здесь keys — field names.

---

## Mapping

```python
users_by_id = {
    42: user1,
    57: user2,
    81: user3,
}
```

Здесь dictionary — настоящий lookup table.

Это разные semantic use cases одной структуры.

---

# 33. Когда dict как record становится неудобным

Например:

```python
user["naem"]
```

Typo даст runtime problem.

Для domain entities часто лучше:

* dataclass;
* class;
* `TypedDict` для static typing;
* validation model.

Но для dynamic data, JSON и mappings dictionary остаётся естественным выбором.

---

# 34. JavaScript Object vs Python dict

После JS легко сказать:

```text
dict = object
```

Но это только приблизительная аналогия.

JavaScript:

```js
const user = {
    name: "Alex",
};
```

Python:

```python
user = {
    "name": "Alex",
}
```

Syntax/use case похож.

Но internal models различаются.

---

# 35. JavaScript object keys

У обычного JavaScript Object property keys в runtime в основном:

```text
string
symbol
```

Например:

```js
const obj = {};

obj[10] = "value";
```

Key effectively становится string `"10"`.

---

Python dict различает:

```python
data = {
    10: "integer",
    "10": "string",
}
```

Это два разных keys.

```python
len(data)
# 2
```

---

# 36. Python dict ближе к JS `Map` по key semantics

JavaScript `Map` позволяет arbitrary values как keys:

```js
const map = new Map();

map.set(userObject, "value");
```

По этой характеристике Python dict ближе к `Map`.

Но Python требует:

```text
hashable key
```

и API остаётся dictionary-style:

```python
data[key]
```

---

# 37. Equality keys имеет значение

Например:

```python
data = {
    1: "integer",
    True: "boolean",
}
```

Можно ожидать два keys.

Но:

```python
1 == True
```

→ `True`

и их hashes совместимы.

Поэтому фактически эти keys конфликтуют.

Например результат может оказаться с одной entry.

Это следствие общего правила:

```text
equal hashable objects
→ represent same dictionary key
```

---

# 38. Custom objects as keys

Custom object можно сделать hashable, но нужно согласовать:

```python
__eq__
__hash__
```

Ключевое правило:

> если `a == b`, то для hashable objects должно выполняться `hash(a) == hash(b)`.

Иначе dictionary/set semantics ломаются.

Подробно это будет разбираться вместе с object model.

---

# Complexity

| Operation             | Average |
| --------------------- | ------: |
| `d[key]`              |    O(1) |
| `d[key] = value`      |    O(1) |
| `key in d`            |    O(1) |
| `del d[key]`          |    O(1) |
| iteration             |    O(n) |
| `value in d.values()` |    O(n) |
| copy                  |    O(n) |

Главная идея:

> Dictionary оптимизирован для lookup по key.

---

# Common Mistakes

## 1. Использовать `.get()` для обязательных keys

Например:

```python
user.get("id")
```

может тихо вернуть `None`.

Если `id` обязан существовать:

```python
user["id"]
```

часто правильнее.

---

## 2. Проверять value через `in dict`

```python
"Alex" in user
```

проверяет key, а не value.

---

## 3. Использовать mutable key

```python
data[[1, 2]] = "x"
```

невозможно.

---

## 4. Считать `.copy()` deep copy

Nested mutable objects остаются shared.

---

## 5. Искать данные в list снова и снова вместо построения lookup dict

Если часто нужен lookup по ID, mapping обычно лучше list scan.

---

# Practical Example

Есть API result:

```python
users = [
    {
        "id": 10,
        "name": "Alex",
    },
    {
        "id": 20,
        "name": "Bob",
    },
    {
        "id": 30,
        "name": "John",
    },
]
```

Нужно много раз получать user по ID.

Плохой access pattern:

```python
def find_user(user_id):
    for user in users:
        if user["id"] == user_id:
            return user

    return None
```

Каждый lookup:

```text
O(n)
```

Можно один раз построить index:

```python
users_by_id = {
    user["id"]: user
    for user in users
}
```

Теперь:

```python
user = users_by_id.get(20)
```

lookup в среднем:

```text
O(1)
```

Это один из самых частых реальных use cases `dict`.

---

# Interview Questions

## 1. How is a Python dictionary implemented conceptually?

**Ответ:**

Как hash table.

Key hash используется для быстрого поиска места в таблице, а equality помогает определить конкретный key при collisions.

Average lookup/insert/delete:

```text
O(1)
```

---

## 2. Why must dictionary keys be hashable?

**Ответ:**

Dictionary использует hash key для lookup.

Если key можно изменить так, что его hash/equality semantics изменятся, dictionary больше не сможет надёжно его находить.

Поэтому mutable containers вроде `list` и `dict` unhashable.

---

## 3. What is the difference between `d[key]` and `d.get(key)`?

**Ответ:**

```python
d[key]
```

выбрасывает `KeyError`, если key отсутствует.

```python
d.get(key)
```

возвращает `None` или указанный default.

Первый вариант подходит для required keys, второй — когда missing key является нормальным состоянием.

---

## 4. Does Python dict preserve insertion order?

**Ответ:**

Да, в современном Python insertion order является language guarantee.

Iteration происходит в порядке добавления keys.

При обычном update существующего key его позиция не меняется.

---

## 5. Why can `(1, 2)` be a dict key but `([1], 2)` cannot?

**Ответ:**

Tuple hashable только если все его элементы hashable.

`int` hashable, поэтому:

```python
(1, 2)
```

может быть key.

List unhashable, поэтому tuple:

```python
([1], 2)
```

тоже unhashable.

---

# Check Yourself

## 1

```python
data = {
    "name": "Alex",
}

print(data.get("age", 0))
```

**Ответ:**

```text
0
```

---

## 2

```python
data = {
    10: "number",
    "10": "string",
}

print(len(data))
```

**Ответ:**

```text
2
```

`10` и `"10"` — разные keys.

---

## 3

```python
data = {
    "a": 1,
    "b": 2,
}

print("a" in data)
print(1 in data)
```

**Ответ:**

```text
True
False
```

Membership проверяет keys.

---

## 4

```python
original = {
    "items": [],
}

copy = original.copy()

copy["items"].append(10)

print(original)
```

**Ответ:**

```python
{
    "items": [10],
}
```

Copy shallow.

---

## 5

```python
data = {
    1: "first",
    True: "second",
}

print(len(data))
```

**Ответ:**

```text
1
```

Потому что:

```python
1 == True
```

и эти values ведут себя как одинаковый dictionary key.

---

# Главное из урока

Python `dict` — это:

```text
hash table
+
hashable keys
+
arbitrary Python values
+
insertion order
```

Основной performance mental model:

```text
lookup by key → average O(1)
```

Keys определяются не только hash:

```text
hash
+
equality
```

И главное отличие после JavaScript:

> Python dictionary — не просто JS Object с другим syntax. Его keys являются полноценными hashable Python objects, поэтому `10` и `"10"` могут быть разными keys, а tuple может использоваться как composite key.
