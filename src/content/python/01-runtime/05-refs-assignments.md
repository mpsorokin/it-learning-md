# Lesson 5 — References, Assignment, Copying and Function Arguments

После предыдущих уроков у нас уже есть базовая модель:

```text
name ───► object
```

Теперь нужно связать её с тремя практическими вопросами:

1. Что реально происходит при assignment?
2. Когда объект копируется, а когда нет?
3. Что именно получает функция при передаче аргумента?

---

# 1. Assignment не копирует объект

Возьмём:

```python
a = [1, 2, 3]
b = a
```

После этого существует один list:

```text
a ───┐
     ├──► [1, 2, 3]
b ───┘
```

Поэтому:

```python
b.append(4)

print(a)
```

получим:

```text
[1, 2, 3, 4]
```

`b = a` создал новый binding, а не новый list.

---

# 2. Если нужна копия — её нужно создать явно

Например:

```python
a = [1, 2, 3]
b = a.copy()
```

Теперь:

```text
a ───► list A [1, 2, 3]

b ───► list B [1, 2, 3]
```

Поэтому:

```python
b.append(4)

print(a)
print(b)
```

Результат:

```text
[1, 2, 3]
[1, 2, 3, 4]
```

---

# 3. Способы shallow copy для list

Несколько распространённых вариантов:

```python
copy1 = original.copy()
```

```python
copy2 = list(original)
```

```python
copy3 = original[:]
```

Для обычного flat list результат примерно одинаков:

```python
original = [1, 2, 3]

copy = original.copy()

print(original == copy)
# True

print(original is copy)
# False
```

---

# 4. Но `.copy()` делает shallow copy

Вот здесь начинается главное.

Возьмём nested structure:

```python
original = [
    [1, 2],
    [3, 4],
]

copy = original.copy()
```

Создались два outer lists:

```text
original ───► outer list A
               ├──► inner list X
               └──► inner list Y

copy     ───► outer list B
               ├──► inner list X
               └──► inner list Y
```

Outer containers разные.

Inner objects те же.

---

# 5. Поэтому nested mutation видна через обе структуры

```python
original = [
    [1, 2],
    [3, 4],
]

copy = original.copy()

copy[0].append(100)

print(original)
```

Получим:

```python
[
    [1, 2, 100],
    [3, 4],
]
```

Почему?

Мы не меняли outer list.

Мы изменили shared inner list.

---

# 6. Shallow copy

Shallow copy означает:

> создать новый container, но оставить references на те же вложенные objects.

Conceptually:

```text
original
   │
   ▼
┌───────┬───────┐
│ ref X │ ref Y │
└───────┴───────┘


copy
   │
   ▼
┌───────┬───────┐
│ ref X │ ref Y │
└───────┴───────┘
```

`X` и `Y` общие.

---

# 7. Deep copy

Если нужно recursively копировать вложенные objects, есть:

```python
import copy

cloned = copy.deepcopy(original)
```

Теперь:

```python
import copy

original = [
    [1, 2],
    [3, 4],
]

cloned = copy.deepcopy(original)

cloned[0].append(100)

print(original)
```

Оригинал останется:

```python
[
    [1, 2],
    [3, 4],
]
```

---

# 8. `deepcopy()` не нужно использовать автоматически

Звучит заманчиво:

> Тогда всегда буду использовать deep copy.

Обычно это плохая идея.

Deep copy:

* дороже;
* может скопировать огромный object graph;
* иногда копирует то, что ты вообще не хотел копировать;
* может иметь сложное behaviour для custom classes;
* часто скрывает плохой ownership design.

Поэтому сначала нужно понять:

> какие objects реально должны быть независимыми?

---

# 9. Dictionary copy тоже shallow

Например:

```python
original = {
    "name": "Alex",
    "permissions": ["read"],
}

copy = original.copy()
```

Outer dictionaries разные:

```python
print(original is copy)
# False
```

Но:

```python
copy["permissions"].append("write")
```

изменит shared list.

```python
print(original["permissions"])
```

Получим:

```text
['read', 'write']
```

---

# 10. Immutable nested values обычно не создают проблему

Например:

```python
original = {
    "name": "Alex",
    "age": 30,
}

copy = original.copy()
```

`str` и `int` immutable.

Если:

```python
copy["age"] = 31
```

мы не изменяем integer `30`.

Мы просто меняем binding внутри dictionary `copy`.

Поэтому:

```python
print(original["age"])
# 30
```

---

# 11. Function arguments используют ту же binding model

Рассмотрим:

```python
def process(items):
    items.append(3)


values = [1, 2]

process(values)
```

Когда вызывается:

```python
process(values)
```

parameter name:

```text
items
```

внутри функции связывается с тем же object:

```text
values ───┐
          ├──► [1, 2]
items  ───┘
```

Поэтому mutation видна caller.

---

# 12. Python не делает automatic argument copy

Это важно.

Вот эта функция:

```python
def add_item(items):
    items.append("new")
```

не получает отдельную копию list.

Она работает с тем же object, который ей передали.

---

# 13. Но rebinding parameter не влияет на caller

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

До rebinding:

```text
values ───┐
          ├──► [1, 2]
items  ───┘
```

После:

```python
items = [100, 200]
```

получаем:

```text
values ───► [1, 2]

items  ───► [100, 200]
```

Caller binding `values` не изменился.

---

# 14. Mutation vs rebinding внутри функции

Сравним.

## Mutation

```python
def clear_users(users):
    users.clear()
```

Caller увидит изменение.

---

## Rebinding

```python
def clear_users(users):
    users = []
```

Caller ничего не увидит.

---

Пример:

```python
users = ["Alex", "Bob"]

clear_users(users)

print(users)
```

Для `users.clear()`:

```text
[]
```

Для `users = []`:

```text
['Alex', 'Bob']
```

---

# 15. Как правильно описывать передачу аргументов в Python

Можно встретить три формулировки:

```text
pass by value
pass by reference
pass by object reference
```

Самая полезная practical формулировка:

> Python использует call by sharing / object sharing: parameter name внутри функции связывается с тем же object, который передал caller.

Это объясняет оба поведения:

```python
items.append(...)
```

видно caller.

Но:

```python
items = ...
```

не меняет caller binding.

---

# 16. Почему `pass-by-reference` не совсем точно

В C++ reference parameter можно использовать для изменения самой caller variable.

Conceptually:

```cpp
void replace(vector<int>& items) {
    items = {100, 200};
}
```

Caller object может быть заменён через reference semantics.

В Python:

```python
def replace(items):
    items = [100, 200]
```

caller name не rebound.

Поэтому фраза:

> Python passes variables by reference

может создавать неправильный mental model.

---

# 17. Почему `pass-by-value` тоже звучит странно

Технически function получает object reference как value.

Но если сказать просто:

> Python pass-by-value

JS/Java/C developer может решить, что mutable object копируется.

А этого не происходит.

Поэтому `call by sharing` обычно лучше передаёт behaviour.

---

# 18. Immutable arguments

Например:

```python
def increment(value):
    value += 1


x = 10

increment(x)

print(x)
```

Получим:

```text
10
```

Потому что `int` immutable.

Inside function:

```python
value += 1
```

приводит к rebinding local name `value`.

---

# 19. Но дело не в том, что integer «передался по значению»

Это та же самая argument model.

Сначала:

```text
x ──────┐
        ├──► int object 10
value ──┘
```

После:

```python
value += 1
```

получаем:

```text
x     ───► 10

value ───► 11
```

Object `10` нельзя мутировать.

---

# 20. Возвращать новый object часто понятнее

Вместо:

```python
def normalize(user):
    user["name"] = user["name"].strip()
```

можно сделать non-mutating function:

```python
def normalize(user):
    return {
        **user,
        "name": user["name"].strip(),
    }
```

Теперь caller явно пишет:

```python
user = normalize(user)
```

Это делает ownership и mutation behaviour более очевидными.

---

# 21. Но mutation сама по себе не плоха

Например:

```python
def append_event(events, event):
    events.append(event)
```

может быть совершенно нормальным API.

Важно не:

```text
never mutate
```

а:

```text
mutation should be intentional and obvious
```

---

# 22. Copying custom objects

Standard module:

```python
import copy
```

предоставляет:

```python
copy.copy(obj)
```

для shallow copy и:

```python
copy.deepcopy(obj)
```

для deep copy.

Для custom classes behaviour можно контролировать через специальные protocols, например:

```python
__copy__
__deepcopy__
```

На практике это нужно нечасто, но важно знать, что copying — тоже protocol-driven behaviour.

---

# 23. Copying и dataclasses

Для dataclass часто не нужен `deepcopy`.

Например:

```python
from dataclasses import dataclass, replace


@dataclass
class User:
    name: str
    age: int


user = User(
    name="Alex",
    age=30,
)

updated = replace(
    user,
    age=31,
)
```

Получаем новый `User` с изменённым field.

Для value-like objects это часто читается лучше, чем arbitrary deep copy.

---

# 24. JS / TS comparison

В JavaScript похожая ситуация:

```js
const original = {
    name: "Alex",
    permissions: ["read"],
};

const copy = {
    ...original,
};
```

Spread создаёт shallow copy.

Поэтому:

```js
copy.permissions.push("write");
```

изменит shared nested Array.

Python:

```python
copy = {
    **original
}
```

имеет очень похожее shallow behaviour.

---

# 25. JS spread и Python unpacking — не deep copy

JavaScript:

```js
const copy = { ...original };
```

Python:

```python
copy = {**original}
```

Оба создают новый outer object/container.

Но nested references продолжают быть shared.

Это важное сходство.

---

# Common Mistakes

## 1. Думать, что assignment копирует object

```python
b = a
```

обычно просто создаёт ещё один binding.

---

## 2. Думать, что `.copy()` копирует весь object graph

`.copy()` у containers обычно shallow.

---

## 3. Использовать `deepcopy()` без необходимости

Deep copy может быть дорогим и скрывать ownership проблемы.

---

## 4. Называть Python просто pass-by-reference

Это не объясняет, почему:

```python
parameter = new_object
```

не меняет caller binding.

---

## 5. Не обозначать mutation в API

Функция, которая неожиданно меняет переданный object, часто создаёт трудноуловимые bugs.

---

# Practical Example

Допустим:

```python
DEFAULT_CONFIG = {
    "timeout": 10,
    "headers": {
        "Accept": "application/json",
    },
}
```

Нужно получить config для конкретного request.

Пишем:

```python
config = DEFAULT_CONFIG.copy()

config["headers"]["Authorization"] = "Bearer token"
```

Проблема:

```python
print(DEFAULT_CONFIG)
```

теперь тоже содержит `Authorization`.

Почему?

`.copy()` скопировал только outer dictionary.

Nested:

```python
"headers"
```

остался shared dictionary.

Можно сделать:

```python
import copy

config = copy.deepcopy(DEFAULT_CONFIG)
```

Но ещё лучше часто явно создавать только нужные независимые уровни:

```python
config = {
    **DEFAULT_CONFIG,
    "headers": {
        **DEFAULT_CONFIG["headers"],
    },
}
```

Так сразу видно, какие части структуры копируются.

---

# Interview Questions

## 1. Does assignment copy an object in Python?

**Ответ:**

Нет.

```python
b = a
```

создаёт новый binding к тому же object.

Чтобы получить independent object, нужно явно выполнить copying или создать новый object.

---

## 2. What is the difference between shallow copy and deep copy?

**Ответ:**

Shallow copy создаёт новый outer object, но сохраняет references на те же nested objects.

Deep copy recursively копирует object graph насколько это возможно.

Например:

```python
copy = original.copy()
```

обычно shallow.

```python
copy.deepcopy(original)
```

deep.

---

## 3. How are arguments passed in Python?

**Ответ:**

Полезная модель — call by sharing.

Parameter внутри функции связывается с тем же object, который передал caller.

Поэтому mutation объекта видна caller, но rebinding parameter — нет.

---

## 4. Why doesn't this replace the caller's list?

```python
def replace(items):
    items = []

values = [1, 2]

replace(values)
```

**Ответ:**

`items = []` rebinding только local parameter name.

Caller name `values` продолжает ссылаться на исходный list.

---

## 5. Why can shallow copy still cause shared-state bugs?

**Ответ:**

Потому что nested mutable objects остаются shared.

Например:

```python
a = {
    "items": [],
}

b = a.copy()

b["items"].append(1)
```

List в `a["items"]` и `b["items"]` — один object.

---

# Check Yourself

## 1

```python
a = [[1], [2]]
b = a.copy()

b[0].append(3)

print(a)
```

**Ответ:**

```python
[[1, 3], [2]]
```

Outer list скопирован, inner list shared.

---

## 2

```python
def process(items):
    items.append(3)


values = [1, 2]

process(values)

print(values)
```

**Ответ:**

```text
[1, 2, 3]
```

Shared list mutated.

---

## 3

```python
def process(items):
    items = items + [3]


values = [1, 2]

process(values)

print(values)
```

**Ответ:**

```text
[1, 2]
```

`items + [3]` создал новый list, после чего local parameter был rebound.

---

## 4

```python
original = {
    "roles": ["admin"],
}

copy = {
    **original,
}

copy["roles"].append("editor")

print(original["roles"])
```

**Ответ:**

```text
['admin', 'editor']
```

Dictionary unpacking создал shallow copy.

---

## 5

```python
def increment(value):
    value += 1


number = 10

increment(number)

print(number)
```

**Ответ:**

```text
10
```

Local parameter был rebound к другому integer object.

---

# Главное из урока

Assignment:

```python
b = a
```

не означает copy.

Shallow copy:

```text
new outer container
+
shared nested objects
```

Deep copy:

```text
recursive copying of object graph
```

Function arguments используют ту же object/binding model:

```text
caller name ───┐
               ├──► object
parameter ─────┘
```

Поэтому:

```python
parameter.append(...)
```

может изменить caller-visible object.

А:

```python
parameter = ...
```

меняет только local binding.

Главное практическое правило:

> Всегда понимай, создаёшь ли ты новый object, делаешь shallow copy или продолжаешь работать с shared object.
