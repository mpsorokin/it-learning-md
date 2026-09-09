# Lesson 4 — Mutability and Immutability

В Python очень важно различать:

```text
mutable object
immutable object
```

Это влияет на:

* assignment;
* function arguments;
* containers;
* copying;
* hashing;
* dictionary keys;
* `+=`;
* shared state;
* поведение кода при передаче объекта между разными частями программы.

Главная идея:

> **Mutable object можно изменить без создания нового объекта. Immutable object изменить нельзя — вместо изменения создаётся другой объект.**

---

# 1. Mutable object

Например `list`:

```python
items = [1, 2]

items.append(3)
```

После `append()` list изменился:

```python
print(items)
# [1, 2, 3]
```

Но object остался тем же.

Это можно увидеть через `id()`:

```python
items = [1, 2]

before = id(items)

items.append(3)

after = id(items)

print(before == after)
# True
```

То есть произошла:

```text
mutation
```

а не rebinding.

---

# 2. Immutable object

Например `int`:

```python
value = 10

before = id(value)

value += 1

after = id(value)
```

`10` не превратился в `11`.

Conceptually:

```text
before:

value ───► 10


after:

value ───► 11
```

Имя `value` теперь связано с другим object.

---

# 3. Основные mutable types

Чаще всего:

```text
list
dict
set
bytearray
```

Custom classes тоже обычно mutable, если специально не ограничивать изменения.

Например:

```python
class User:
    def __init__(self, name):
        self.name = name


user = User("Alex")

user.name = "Bob"
```

Instance `user` изменился.

---

# 4. Основные immutable types

Например:

```text
int
float
bool
str
tuple
frozenset
bytes
NoneType
```

Например string:

```python
name = "Alex"
```

Нельзя сделать:

```python
name[0] = "B"
```

Получим:

```text
TypeError
```

String object нельзя изменить in-place.

---

# 5. Но string можно «изменить»

Например:

```python
name = "Alex"

name = "B" + name[1:]
```

Получим:

```text
Blex
```

Но исходная string `"Alex"` не изменилась.

Создался новый string object, а `name` был rebound.

---

# 6. Почему это важно при нескольких references

Mutable object:

```python
a = [1, 2]
b = a

a.append(3)

print(b)
```

Получим:

```text
[1, 2, 3]
```

Потому что:

```text
a ───┐
     ├──► same list
b ───┘
```

---

Immutable object:

```python
a = 10
b = a

a += 1

print(b)
```

Получим:

```text
10
```

`10` не мутировал.

`a` просто стал указывать на `11`.

---

# 7. `+=` особенно интересен

Одинаковый syntax может означать разное behaviour.

## `int`

```python
a = 10
b = a

a += 5
```

Теперь:

```text
a → 15
b → 10
```

---

## `list`

```python
a = [1, 2]
b = a

a += [3]
```

Теперь:

```python
print(a)
# [1, 2, 3]

print(b)
# [1, 2, 3]
```

Для list `+=` обычно изменяет object in-place.

---

# 8. `+` и `+=` для list отличаются

Например:

```python
a = [1, 2]
b = a

a = a + [3]
```

Теперь:

```python
print(a)
# [1, 2, 3]

print(b)
# [1, 2]
```

Почему?

`a + [3]` создаёт новый list.

После этого:

```python
a = ...
```

делает rebinding.

---

А:

```python
a += [3]
```

для list использует in-place operation.

Conceptually это связано с:

```python
__iadd__()
```

а обычный `+` — с:

```python
__add__()
```

---

# 9. Immutable container может содержать mutable objects

Например:

```python
data = (
    [1, 2],
    [3, 4],
)
```

Tuple immutable.

Нельзя:

```python
data[0] = [100]
```

Но можно:

```python
data[0].append(100)
```

Получим:

```python
(
    [1, 2, 100],
    [3, 4],
)
```

Почему?

Tuple хранит references:

```text
tuple
├──► list A
└──► list B
```

Tuple не изменился.

Изменился object `list A`.

---

# 10. Immutability бывает shallow

Фраза:

> tuple immutable

не означает:

> всё дерево объектов внутри tuple immutable.

Например:

```python
config = (
    "production",
    {
        "debug": False,
    },
)
```

Можно:

```python
config[1]["debug"] = True
```

Dictionary mutable.

---

# 11. Почему immutable objects полезны

У immutability несколько преимуществ.

## Predictability

Если object нельзя изменить, его состояние стабильнее.

Например:

```python
point = (10, 20)
```

Ты знаешь, что другой код не сможет сделать:

```python
point[0] = 999
```

---

## Hashability

Многие immutable objects могут использоваться как keys:

```python
coordinates = {
    (50.45, 30.52): "Kyiv",
}
```

Tuple может быть hashable, если его elements тоже hashable.

---

## Safe sharing

Immutable object проще безопасно использовать из разных частей программы, потому что никто не может неожиданно изменить его state.

---

# 12. Но immutable не всегда значит hashable

Например tuple:

```python
value = (
    [1, 2],
    [3, 4],
)
```

Сам tuple immutable.

Но:

```python
hash(value)
```

даст ошибку.

Почему?

Потому что внутри есть lists, а они unhashable.

Для hashability важно, чтобы вся структура имела стабильный hash.

---

# 13. Mutable objects обычно unhashable

Например:

```python
hash([1, 2])
```

→ `TypeError`

```python
hash({"a": 1})
```

→ `TypeError`

Почему?

Hash используется `dict` и `set`.

Если object можно изменить после вычисления hash, структура может стать inconsistent.

---

# 14. Пример проблемы с mutable key

Представим hypothetical object:

```text
key = [1, 2]
hash(key) = X
```

Dictionary кладёт key в bucket `X`.

Потом object меняется:

```text
[1, 2, 3]
```

и его логический hash становится `Y`.

Теперь dictionary искал бы object уже в другом bucket.

Поэтому mutable built-in containers нельзя использовать как dictionary keys.

---

# 15. `frozenset`

Обычный set mutable:

```python
tags = {"python", "backend"}

tags.add("asyncio")
```

`frozenset` immutable:

```python
tags = frozenset({
    "python",
    "backend",
})
```

Нельзя:

```python
tags.add("asyncio")
```

Зато `frozenset` может быть hashable.

Например:

```python
cache = {
    frozenset({"admin", "editor"}): "full-access"
}
```

---

# 16. Mutable object как function argument

Например:

```python
def add_item(items):
    items.append("new")


values = []

add_item(values)

print(values)
```

Получим:

```text
['new']
```

Function получила reference на тот же list object и мутировала его.

---

# 17. Это не pass-by-reference в классическом смысле

Иногда говорят:

> Python passes objects by reference.

Это слишком грубо.

Более точная модель:

> Python передаёт object reference как value; parameter name связывается с тем же object.

Например:

```python
def replace(items):
    items = [100, 200]


values = [1, 2]

replace(values)

print(values)
```

Получим:

```text
[1, 2]
```

Почему?

Inside function:

```python
items = [100, 200]
```

просто rebound local name `items`.

Исходный object не изменился.

---

# 18. Сравним mutation и rebinding внутри функции

Mutation:

```python
def mutate(items):
    items.append(3)


values = [1, 2]

mutate(values)

print(values)
# [1, 2, 3]
```

Rebinding:

```python
def replace(items):
    items = [10, 20]


values = [1, 2]

replace(values)

print(values)
# [1, 2]
```

Это очень важная разница.

---

# 19. JavaScript / TypeScript comparison

Поведение объектов здесь во многом знакомо.

JavaScript:

```js
const a = [1, 2];
const b = a;

b.push(3);

console.log(a);
```

Получим:

```text
[1, 2, 3]
```

То есть shared mutable object работает аналогично.

---

Но в JavaScript есть distinction между:

```text
primitive values
objects
```

Python mental model более uniform:

```text
everything is an object
```

Например integer тоже object, просто immutable.

---

# 20. JS `const` не означает immutability

JavaScript:

```js
const user = {
    name: "Alex"
};

user.name = "Bob";
```

валидно.

`const` запрещает:

```js
user = {};
```

но не mutation object.

Python прямого аналога `const` для обычных names не имеет.

---

# 21. Custom immutable classes

Можно создавать собственные объекты, которые ведут себя ближе к immutable value objects.

Например через frozen dataclass:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Money:
    amount: int
    currency: str
```

Теперь:

```python
money = Money(
    amount=100,
    currency="EUR",
)
```

Попытка:

```python
money.amount = 200
```

будет запрещена обычным dataclass API.

Это не делает Python вообще statically immutable, но даёт useful constraint.

---

# 22. Когда выбирать immutable structure

Immutable objects особенно удобны для:

* IDs;
* coordinates;
* money/value objects;
* configuration snapshots;
* dictionary keys;
* cache keys;
* fixed combinations values.

Mutable objects удобны там, где state действительно должен изменяться:

* collections;
* accumulated results;
* caches;
* entities;
* mutable application state.

---

# Common Mistakes

## 1. Думать, что `+=` всегда создаёт новый object

Для immutable types часто да.

Для list — обычно нет.

---

## 2. Считать tuple полностью immutable graph

Tuple нельзя изменить structurally.

Но referenced objects могут быть mutable.

---

## 3. Путать function rebinding с mutation

```python
def foo(items):
    items = []
```

не очищает исходный list.

А:

```python
def foo(items):
    items.clear()
```

очищает.

---

## 4. Использовать mutable object как dictionary key

```python
{
    [1, 2]: "value"
}
```

невозможно.

---

## 5. Считать `const` в JS эквивалентом immutable object

`const` ограничивает rebinding, а не mutation самого object.

---

# Practical Example

Рассмотрим:

```python
def normalize_users(users):
    for user in users:
        user["name"] = user["name"].strip()

    return users
```

Использование:

```python
users = [
    {"name": " Alex "},
    {"name": " Bob "},
]

normalized = normalize_users(users)
```

После вызова изменился и исходный `users`.

Почему?

Потому что:

```text
users
↓
list
↓
dict objects
```

и функция мутирует dictionary objects внутри списка.

Если caller не ожидает mutation, такой API может быть неприятным.

Альтернативный style:

```python
def normalize_users(users):
    return [
        {
            **user,
            "name": user["name"].strip(),
        }
        for user in users
    ]
```

Теперь создаются новые dictionaries.

Это уже design decision:

```text
mutating API
vs
non-mutating API
```

Оба подхода могут быть правильными, но behaviour должен быть очевиден.

---

# Interview Questions

## 1. What is the difference between mutable and immutable objects?

**Ответ:**

Mutable object можно изменить без замены его identity.

Например:

```python
items = []
items.append(1)
```

List остаётся тем же object.

Immutable object изменить нельзя.

Например:

```python
x = 10
x += 1
```

создаётся или выбирается другой integer object, а `x` rebound к нему.

---

## 2. Why does `+=` behave differently for lists and integers?

**Ответ:**

`int` immutable, поэтому `x += 1` не может изменить integer object.

Для `list` существует in-place operation, поэтому:

```python
items += [3]
```

может мутировать существующий list.

Поведение зависит от implementation конкретного type.

---

## 3. Can an immutable tuple contain mutable objects?

**Ответ:**

Да.

Например:

```python
value = ([1, 2], "test")
```

Tuple нельзя structurally изменить:

```python
value[0] = ...
```

Но list внутри tuple можно мутировать:

```python
value[0].append(3)
```

---

## 4. Why are lists not valid dictionary keys?

**Ответ:**

Dictionary keys должны быть hashable.

Mutable list может изменить своё содержимое, поэтому стабильный hash нельзя безопасно использовать для dictionary lookup.

Поэтому `list` unhashable.

---

## 5. Does assigning to a function parameter modify the caller's variable?

**Ответ:**

Нет.

Например:

```python
def foo(items):
    items = []
```

меняет только local binding `items`.

Но если функция мутирует shared object:

```python
items.clear()
```

изменение будет видно caller, потому что object один и тот же.

---

# Check Yourself

## 1

```python
a = [1, 2]
b = a

a = a + [3]

print(b)
```

**Ответ:**

```text
[1, 2]
```

`+` создал новый list, и `a` был rebound.

---

## 2

```python
a = [1, 2]
b = a

a += [3]

print(b)
```

**Ответ:**

```text
[1, 2, 3]
```

List был изменён in-place.

---

## 3

```python
data = (
    [],
    [],
)

data[0].append(10)

print(data)
```

**Ответ:**

```python
(
    [10],
    [],
)
```

Tuple immutable, но inner list mutable.

---

## 4

```python
def replace(value):
    value = [100]


items = [1, 2]

replace(items)

print(items)
```

**Ответ:**

```text
[1, 2]
```

Function сделала rebinding local parameter.

---

## 5

```python
def mutate(value):
    value.append(100)


items = [1, 2]

mutate(items)

print(items)
```

**Ответ:**

```text
[1, 2, 100]
```

Функция мутировала shared list object.

---

# Главное из урока

```text
mutable
→ object может изменить своё состояние

immutable
→ object не изменяется; появляется новый object/rebinding
```

Основные mutable built-ins:

```text
list
dict
set
```

Основные immutable:

```text
int
float
bool
str
tuple
frozenset
bytes
```

Но container immutability не означает deep immutability всего object graph.

И всегда полезно различать:

```text
mutation
vs
rebinding
```

Особенно при functions, shared references и `+=`.
