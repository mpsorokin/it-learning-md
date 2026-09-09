# Lesson 6 — Lists: Dynamic Arrays, Indexing and Mutation

`list` — одна из самых используемых структур данных в Python.

На уровне syntax всё просто:

```python
users = [
    "Alex",
    "Bob",
    "John",
]
```

Но для нормального понимания важно знать:

* как list устроен концептуально;
* почему `append()` обычно быстрый;
* почему `insert(0, value)` дорогой;
* как работают indexes;
* какие операции mutating, а какие создают новый list;
* чем Python list отличается от JavaScript Array.

---

# 1. Что хранит list

Python list можно представить как динамический массив **references на objects**.

Например:

```python
items = [
    10,
    "hello",
    {"id": 1},
]
```

Conceptually:

```text
list
┌─────┬─────┬─────┐
│ ref │ ref │ ref │
└──┬──┴──┬──┴──┬──┘
   ↓     ↓     ↓
  10  "hello"  dict
```

Сам list не требует, чтобы все элементы были одного type.

Поэтому это valid:

```python
items = [
    10,
    "hello",
    None,
    lambda: 42,
]
```

---

# 2. List — dynamic array

В CPython `list` концептуально устроен как dynamic array.

Это значит:

* elements лежат в индексируемой последовательности;
* list имеет capacity;
* capacity может быть больше текущего `len`;
* при росте Python иногда перевыделяет внутренний массив.

Пример:

```python
items = []

items.append(10)
items.append(20)
items.append(30)
```

Python не обязан realloc memory на каждый `append()`.

Он резервирует дополнительное место заранее.

---

# 3. Почему `append()` обычно O(1)

```python
items.append(value)
```

обычно просто записывает новый reference в свободную позицию.

Поэтому complexity:

```text
append → amortized O(1)
```

Почему **amortized**, а не гарантированно O(1)?

Потому что иногда capacity заканчивается.

Тогда runtime должен:

```text
allocate larger internal array
↓
copy existing references
↓
add new reference
```

Такая операция дороже.

Но происходит не на каждом `append()`.

В среднем стоимость остаётся O(1).

---

# 4. Index access — O(1)

Например:

```python
items = ["a", "b", "c"]

print(items[1])
```

→

```text
b
```

Dynamic array позволяет вычислить позицию element напрямую.

Поэтому:

```text
items[index] → O(1)
```

Это важное отличие от linked list structures.

---

# 5. Positive indexes

Indexes начинаются с `0`:

```python
items = ["A", "B", "C"]

items[0]  # A
items[1]  # B
items[2]  # C
```

Если index вне range:

```python
items[10]
```

получим:

```text
IndexError
```

---

# 6. Negative indexes

Python позволяет индексировать с конца:

```python
items = ["A", "B", "C"]

items[-1]
# C

items[-2]
# B
```

Mental model:

```text
 A    B    C
 0    1    2
-3   -2   -1
```

Это гораздо чаще используется в Python, чем ручной вариант:

```python
items[len(items) - 1]
```

---

# 7. List mutable

Можно изменить element:

```python
items = ["A", "B", "C"]

items[1] = "X"

print(items)
```

Результат:

```python
["A", "X", "C"]
```

Identity list не меняется.

Меняется reference в конкретной позиции.

---

# 8. `append()`

Добавляет один object в конец:

```python
items = [1, 2]

items.append(3)
```

→

```python
[1, 2, 3]
```

Важно:

```python
items.append([3, 4])
```

даст:

```python
[1, 2, [3, 4]]
```

То есть `append()` добавляет **один object**.

---

# 9. `extend()`

Если нужно добавить элементы другого iterable:

```python
items = [1, 2]

items.extend([3, 4])
```

Получим:

```python
[1, 2, 3, 4]
```

Разница:

```python
items.append([3, 4])
```

→

```python
[1, 2, [3, 4]]
```

А:

```python
items.extend([3, 4])
```

→

```python
[1, 2, 3, 4]
```

---

# 10. `+` создаёт новый list

```python
a = [1, 2]
b = [3, 4]

result = a + b
```

Получаем новый outer list:

```python
[1, 2, 3, 4]
```

`a` и `b` не мутируются.

Это важно для performance.

Такой код в loop:

```python
result = []

for item in values:
    result = result + [item]
```

плохой.

На каждой iteration создаётся новый list.

---

# 11. Лучше `append()`

```python
result = []

for item in values:
    result.append(item)
```

Это значительно эффективнее.

Первый вариант может приблизиться к:

```text
O(n²)
```

из-за постоянного копирования.

Второй:

```text
O(n)
```

для построения списка из `n` элементов.

---

# 12. `insert()`

```python
items = [1, 3]

items.insert(1, 2)
```

Получим:

```python
[1, 2, 3]
```

Но insertion в середину требует сдвинуть элементы справа.

Поэтому:

```text
insert → O(n)
```

Особенно:

```python
items.insert(0, value)
```

дорогой, потому что нужно сдвинуть почти весь list.

---

# 13. List — плохая очередь с удалением из начала

Например:

```python
queue.pop(0)
```

работает.

Но complexity:

```text
O(n)
```

Оставшиеся элементы нужно сдвинуть.

Если нужна настоящая queue, обычно лучше:

```python
from collections import deque
```

Например:

```python
from collections import deque

queue = deque([1, 2, 3])

value = queue.popleft()
```

`popleft()`:

```text
O(1)
```

---

# 14. `pop()`

Без аргумента:

```python
items = [1, 2, 3]

value = items.pop()
```

Теперь:

```python
value
# 3

items
# [1, 2]
```

Удаление последнего element обычно:

```text
O(1)
```

---

С index:

```python
items.pop(0)
```

может быть:

```text
O(n)
```

из-за shifting.

---

# 15. `remove()`

Удаляет первое найденное значение:

```python
items = [10, 20, 30]

items.remove(20)
```

→

```python
[10, 30]
```

Python сначала должен найти element.

Поэтому:

```text
remove → O(n)
```

Если element отсутствует:

```python
items.remove(999)
```

получим:

```text
ValueError
```

---

# 16. `del`

Можно удалить по index:

```python
items = ["A", "B", "C"]

del items[1]
```

Получим:

```python
["A", "C"]
```

Можно удалять и диапазон:

```python
del items[1:3]
```

Slicing подробно будет следующим уроком.

---

# 17. Membership: `in`

```python
items = [10, 20, 30]

20 in items
```

→

```text
True
```

List ищет элементы последовательно.

Поэтому:

```text
value in list → O(n)
```

Если frequent membership checks — возможно, нужен `set`.

Например:

```python
allowed_ids = {10, 20, 30}

if user_id in allowed_ids:
    ...
```

обычно лучше, чем большой list.

---

# 18. `index()`

```python
items = ["A", "B", "C"]

items.index("B")
```

→

```text
1
```

Поиск идёт слева направо.

Complexity:

```text
O(n)
```

Если object не найден:

```text
ValueError
```

---

# 19. `count()`

```python
items = [1, 2, 1, 3, 1]

items.count(1)
```

→

```text
3
```

Нужно просмотреть весь list:

```text
O(n)
```

Для большого frequency analysis обычно удобнее:

```python
from collections import Counter
```

---

# 20. Sorting

Можно мутировать list:

```python
items = [3, 1, 2]

items.sort()
```

Теперь:

```python
[1, 2, 3]
```

`sort()` возвращает:

```python
None
```

Это важный Python pattern:

> mutating methods часто возвращают `None`.

Поэтому нельзя писать:

```python
sorted_items = items.sort()
```

и ожидать list.

`sorted_items` будет `None`.

---

# 21. `sorted()` создаёт новый list

```python
items = [3, 1, 2]

result = sorted(items)
```

Теперь:

```python
items
# [3, 1, 2]

result
# [1, 2, 3]
```

Разница:

```text
list.sort()
→ mutate existing list

sorted(...)
→ return new list
```

---

# 22. `reverse()` vs `reversed()`

Mutating:

```python
items.reverse()
```

Non-mutating iterator-based operation:

```python
reversed(items)
```

Например:

```python
items = [1, 2, 3]

result = list(reversed(items))
```

→

```python
[3, 2, 1]
```

---

# 23. List stores references

Это особенно важно для custom objects.

```python
user = {
    "name": "Alex"
}

users = [
    user,
]
```

List содержит reference на dictionary.

Поэтому:

```python
user["name"] = "Bob"

print(users[0]["name"])
```

получим:

```text
Bob
```

List не содержит independent copy.

---

# 24. Повторение list

Можно:

```python
values = [0] * 5
```

Получим:

```python
[0, 0, 0, 0, 0]
```

С immutable values это обычно безопасно.

Но:

```python
rows = [[]] * 3
```

создаёт shared inner list:

```text
rows
├──► same list
├──► same list
└──► same list
```

Поэтому:

```python
rows[0].append(1)

print(rows)
```

→

```python
[[1], [1], [1]]
```

---

# 25. JS / TS comparison

Python `list` ближе всего к JavaScript `Array`.

Обе структуры:

* dynamic;
* indexed;
* mutable;
* хранят heterogeneous values;
* используют references для objects;
* поддерживают push/append-like operations.

JavaScript:

```js
const items = [];

items.push(10);
```

Python:

```python
items = []

items.append(10)
```

---

Но API отличается.

JavaScript:

```js
items.push(1);
items.pop();
items.shift();
items.unshift(1);
```

Python:

```python
items.append(1)
items.pop()
items.pop(0)
items.insert(0, 1)
```

Последние две операции для большого list обычно нежелательны.

Python ecosystem ожидает `deque`, если нужна очередь.

---

# 26. Complexity cheat sheet

| Operation        |     Complexity |
| ---------------- | -------------: |
| `items[i]`       |           O(1) |
| `items[i] = x`   |           O(1) |
| `append()`       | amortized O(1) |
| `pop()` from end |           O(1) |
| `insert(0, x)`   |           O(n) |
| `pop(0)`         |           O(n) |
| `x in items`     |           O(n) |
| `index(x)`       |           O(n) |
| `remove(x)`      |           O(n) |
| copy list        |           O(n) |
| `sort()`         |     O(n log n) |

Не нужно учить таблицу механически.

Если помнить:

> list — dynamic array,

большинство complexity выводится логически.

---

# Common Mistakes

## 1. Использовать list как queue

```python
queue.pop(0)
```

на больших структурах дорого.

Используй `deque`.

---

## 2. Путать `append()` и `extend()`

```python
items.append([3, 4])
```

добавляет один nested list.

```python
items.extend([3, 4])
```

добавляет два элемента.

---

## 3. Писать

```python
items = items + [value]
```

в большом loop.

Лучше:

```python
items.append(value)
```

---

## 4. Ожидать значение от `.sort()`

```python
result = items.sort()
```

`result` будет `None`.

---

## 5. Делать nested lists через `*`

```python
matrix = [[0] * 3] * 3
```

создаёт shared rows.

---

# Practical Example

Нужно собрать IDs активных пользователей:

```python
users = [
    {"id": 1, "active": True},
    {"id": 2, "active": False},
    {"id": 3, "active": True},
]

active_ids = []

for user in users:
    if user["active"]:
        active_ids.append(user["id"])
```

Получим:

```python
[1, 3]
```

Здесь `append()` — естественный выбор:

* порядок важен;
* duplicates потенциально допустимы;
* строим sequence последовательно;
* append amortized O(1).

Если задача была бы:

> быстро проверять, входит ли ID в множество разрешённых,

`set` был бы более подходящей структурой.

---

# Interview Questions

## 1. How is Python list implemented conceptually?

**Ответ:**

Как dynamic array references на Python objects.

Это объясняет:

```text
random access → O(1)
append → amortized O(1)
insert/remove in middle → O(n)
```

---

## 2. Why is `append()` amortized O(1)?

**Ответ:**

List резервирует дополнительную capacity.

Большинство `append()` просто записывают reference в свободную позицию.

Иногда capacity заканчивается и нужен resize, который стоит O(n), но такие reallocations происходят не на каждом append.

---

## 3. Why is `insert(0, value)` O(n)?

**Ответ:**

Потому что existing elements нужно сдвинуть вправо.

List — contiguous dynamic array, а не linked list.

---

## 4. What is the difference between `append()` and `extend()`?

**Ответ:**

`append()` добавляет один object:

```python
[1, 2].append([3, 4])
```

conceptually даёт:

```python
[1, 2, [3, 4]]
```

`extend()` добавляет элементы iterable:

```python
[1, 2, 3, 4]
```

---

## 5. What is the difference between `sort()` and `sorted()`?

**Ответ:**

```python
items.sort()
```

мутирует существующий list и возвращает `None`.

```python
sorted(items)
```

создаёт новый sorted list и не требует менять исходный iterable.

---

# Check Yourself

## 1

```python
items = [1, 2]

result = items.append(3)

print(result)
```

**Ответ:**

```text
None
```

`append()` мутирует list и не возвращает новый list.

---

## 2

```python
items = [1, 2]

items.append([3, 4])

print(items)
```

**Ответ:**

```python
[1, 2, [3, 4]]
```

---

## 3

```python
items = [1, 2]

items.extend([3, 4])

print(items)
```

**Ответ:**

```python
[1, 2, 3, 4]
```

---

## 4

```python
a = [1, 2]
b = a + [3]

print(a)
print(b)
```

**Ответ:**

```text
[1, 2]
[1, 2, 3]
```

`+` создал новый list.

---

## 5

```python
rows = [[]] * 2

rows[0].append("x")

print(rows)
```

**Ответ:**

```python
[['x'], ['x']]
```

Обе позиции содержат reference на один inner list.

---

# Главное из урока

Python `list` — это:

```text
dynamic array
+
references на objects
+
mutable container
```

Отсюда следуют основные characteristics:

```text
index access       → O(1)
append              → amortized O(1)
insert in middle    → O(n)
membership          → O(n)
pop from end        → O(1)
pop from beginning  → O(n)
```

И главное practical правило:

> Если часто работаешь с концом sequence — `list` подходит отлично. Если часто добавляешь или удаляешь элементы с начала — скорее всего, нужна другая структура.
