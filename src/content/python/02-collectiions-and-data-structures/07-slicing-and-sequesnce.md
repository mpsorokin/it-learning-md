# Lesson 7 — Slicing and Sequence Operations

Python slicing — одна из самых характерных частей языка.

Базовая форма:

```python
sequence[start:stop:step]
```

Например:

```python
items = [10, 20, 30, 40, 50]

print(items[1:4])
```

Результат:

```python
[20, 30, 40]
```

Главное правило:

> `start` включается, `stop` не включается.

---

# 1. Базовый slicing

```python
items = ["A", "B", "C", "D", "E"]

items[1:4]
```

Получим:

```python
["B", "C", "D"]
```

Indexes:

```text
 A   B   C   D   E
 0   1   2   3   4
```

Slice:

```text
[1:4]
 ^  ^
 |  stop excluded
 start included
```

---

# 2. Почему `stop` exclusive

Это делает slices удобными для interval arithmetic.

Например:

```python
items[:3]
```

возвращает ровно первые `3` элемента.

```python
items[3:5]
```

возвращает следующие `2`.

А:

```python
items[:3] + items[3:]
```

восстанавливает sequence целиком.

---

# 3. Можно пропускать `start`

```python
items = [10, 20, 30, 40]

items[:2]
```

→

```python
[10, 20]
```

Это значит:

```text
от начала
до index 2 exclusive
```

---

# 4. Можно пропускать `stop`

```python
items[2:]
```

→

```python
[30, 40]
```

То есть:

```text
от index 2
до конца
```

---

# 5. Можно пропустить оба

```python
items[:]
```

Для list создаётся shallow copy.

```python
a = [1, 2, 3]
b = a[:]

print(a == b)
# True

print(a is b)
# False
```

Но это именно shallow copy.

Nested objects остаются shared.

---

# 6. `step`

Полная форма:

```python
items[start:stop:step]
```

Например:

```python
items = [0, 1, 2, 3, 4, 5]

items[0:6:2]
```

→

```python
[0, 2, 4]
```

То есть берём каждый второй element.

---

# 7. Короткая форма step

Можно написать:

```python
items[::2]
```

Это значит:

```text
start = начало
stop = конец
step = 2
```

---

# 8. Reverse через slicing

Один из известных Python idioms:

```python
items[::-1]
```

Например:

```python
items = [1, 2, 3]

reversed_items = items[::-1]
```

Получаем:

```python
[3, 2, 1]
```

Создаётся новый list.

Исходный не мутируется.

---

# 9. Negative indexes

Slicing поддерживает negative indexes:

```python
items = ["A", "B", "C", "D"]

items[-2:]
```

→

```python
["C", "D"]
```

Mental model:

```text
 A    B    C    D
 0    1    2    3
-4   -3   -2   -1
```

---

# 10. Slice не падает при выходе за границы

Обычный indexing:

```python
items[100]
```

даст:

```text
IndexError
```

Но:

```python
items[:100]
```

валиден.

Python просто вернёт доступную часть sequence.

Например:

```python
items = [1, 2, 3]

print(items[:100])
```

→

```python
[1, 2, 3]
```

---

# 11. То же с отрицательными границами

```python
items[-100:100]
```

обычно просто захватит весь list.

Это делает slicing удобным для обработки ranges без большого количества boundary checks.

---

# 12. Slice создаёт новый list

Например:

```python
items = [1, 2, 3, 4]

part = items[1:3]
```

`part` — новый outer list.

```python
print(part is items)
# False
```

Но элементы внутри — те же objects.

---

# 13. Shallow nature slicing

```python
items = [
    {"id": 1},
    {"id": 2},
]

part = items[:]

part[0]["id"] = 999
```

Теперь:

```python
print(items[0]["id"])
```

→

```text
999
```

Почему?

Потому что:

```text
items ───► outer list A
            ├──► dict X
            └──► dict Y

part ─────► outer list B
            ├──► dict X
            └──► dict Y
```

Скопировался container, но не nested dictionaries.

---

# 14. Slice assignment

Python позволяет использовать slice слева от `=`.

Например:

```python
items = [1, 2, 3, 4]

items[1:3] = [20, 30]
```

Получим:

```python
[1, 20, 30, 4]
```

Это mutation исходного list.

---

# 15. Slice assignment может менять размер

Например:

```python
items = [1, 2, 3, 4]

items[1:3] = [100]
```

Результат:

```python
[1, 100, 4]
```

Два элемента заменились одним.

---

Можно наоборот:

```python
items[1:2] = [10, 20, 30]
```

List станет длиннее.

---

# 16. Удаление через slicing

Можно:

```python
items = [1, 2, 3, 4, 5]

del items[1:4]
```

Получим:

```python
[1, 5]
```

---

Можно и так:

```python
items[1:4] = []
```

Результат будет аналогичным.

---

# 17. Extended slice assignment

Если задан `step`, replacement обычно должен иметь подходящее количество элементов.

Например:

```python
items = [0, 1, 2, 3, 4, 5]

items[::2] = [10, 20, 30]
```

Получим:

```python
[10, 1, 20, 3, 30, 5]
```

Мы заменили indexes:

```text
0, 2, 4
```

---

# 18. Почему slicing может быть дорогим

Например:

```python
part = items[:500_000]
```

создаёт новый list и копирует references.

Complexity:

```text
O(k)
```

где `k` — размер slice.

То есть slicing — не бесплатный view на исходный list.

---

# 19. Это отличается от некоторых других экосистем

Некоторые structures/libraries дают views:

```text
original memory
↓
lightweight window
```

Обычный Python list slice делает новый list.

Поэтому:

```python
items[:] 
```

на list из миллионов элементов — реальная allocation и copying references.

---

# 20. Strings тоже поддерживают slicing

```python
text = "Python"

text[0:3]
```

→

```text
Pyt
```

Можно:

```python
text[::-1]
```

→

```text
nohtyP
```

Но `str` immutable, поэтому slice создаёт новую string.

---

# 21. Tuples тоже поддерживают slicing

```python
point = (10, 20, 30, 40)

point[1:3]
```

→

```python
(20, 30)
```

Тип результата остаётся tuple.

---

# 22. Sequence protocol

Slicing работает не только с list.

Многие sequence-like objects поддерживают:

```python
obj[index]
```

и:

```python
obj[start:stop:step]
```

Через special method:

```python
__getitem__()
```

В случае slice Python передаёт special object типа:

```python
slice
```

Например:

```python
value = slice(1, 5, 2)

print(value.start)
print(value.stop)
print(value.step)
```

---

# 23. `slice` — настоящий object

Запись:

```python
items[1:5:2]
```

conceptually связана с:

```python
items.__getitem__(
    slice(1, 5, 2)
)
```

Это хороший пример общей Python philosophy:

> даже syntax часто построен поверх object protocols.

---

# 24. Сравнение с JavaScript / TypeScript

JavaScript:

```js
const items = [1, 2, 3, 4];

const part = items.slice(1, 3);
```

Python:

```python
part = items[1:3]
```

Оба варианта создают shallow copy selected range.

---

Но Python syntax значительно мощнее:

```python
items[::2]
items[::-1]
items[-3:]
```

В JS для похожих операций обычно используются отдельные methods или комбинации методов.

---

# 25. Python slice vs JS `splice`

Не путать:

JavaScript:

```js
items.slice(...)
```

обычно non-mutating.

А:

```js
items.splice(...)
```

mutating.

Python:

```python
items[1:3]
```

non-mutating read.

А:

```python
items[1:3] = [...]
```

mutating slice assignment.

---

# Common Mistakes

## 1. Забывать, что stop exclusive

```python
items[1:3]
```

берёт indexes:

```text
1, 2
```

а не `1, 2, 3`.

---

## 2. Считать `[:]` deep copy

```python
copy = original[:]
```

это shallow copy.

---

## 3. Думать, что slice — view

Для обычного list создаётся новый list.

---

## 4. Использовать reverse slicing без понимания allocation

```python
items[::-1]
```

создаёт новый list.

Если нужен iterator без copy:

```python
reversed(items)
```

---

## 5. Путать read slice и slice assignment

```python
part = items[1:3]
```

не мутирует list.

Но:

```python
items[1:3] = [...]
```

мутирует.

---

# Practical Examples

## First N elements

```python
first_five = items[:5]
```

---

## Last N elements

```python
last_five = items[-5:]
```

---

## Everything except first item

```python
rest = items[1:]
```

---

## Every second item

```python
odd_positions = items[::2]
```

---

## Reverse

```python
reversed_copy = items[::-1]
```

---

# Interview Questions

## 1. What does `items[start:stop:step]` mean?

**Ответ:**

`start` — первый included index.

`stop` — excluded boundary.

`step` — шаг между selected elements.

Например:

```python
items[1:6:2]
```

выбирает indexes:

```text
1, 3, 5
```

---

## 2. Does list slicing create a copy?

**Ответ:**

Да, обычный list slice создаёт новый outer list.

Complexity примерно:

```text
O(k)
```

для `k` copied references.

Но copy shallow — nested objects остаются shared.

---

## 3. What does `items[::-1]` do?

**Ответ:**

Создаёт reversed shallow copy sequence.

`step = -1` означает движение справа налево.

Для list это новый list.

---

## 4. Why does slicing not raise `IndexError` for large boundaries?

**Ответ:**

Slice boundaries нормализуются относительно длины sequence.

Python возвращает доступную часть диапазона вместо ошибки.

Обычный single-index access работает иначе и может дать `IndexError`.

---

## 5. What is slice assignment?

**Ответ:**

Slice можно использовать как assignment target:

```python
items[1:3] = [10, 20]
```

Это mutating operation.

Она может даже изменить длину list, если slice не использует ограничивающий extended step.

---

# Check Yourself

## 1

```python
items = [0, 1, 2, 3, 4]

print(items[1:4])
```

**Ответ:**

```python
[1, 2, 3]
```

---

## 2

```python
items = [0, 1, 2, 3, 4]

print(items[::-2])
```

**Ответ:**

```python
[4, 2, 0]
```

---

## 3

```python
items = [[1], [2]]

copy = items[:]

copy[0].append(10)

print(items)
```

**Ответ:**

```python
[[1, 10], [2]]
```

Slice copy shallow.

---

## 4

```python
items = [1, 2, 3, 4]

items[1:3] = [10]

print(items)
```

**Ответ:**

```python
[1, 10, 4]
```

---

## 5

```python
items = [1, 2, 3]

print(items[10:20])
```

**Ответ:**

```python
[]
```

Slice за пределами sequence не вызывает `IndexError`.

---

# Главное из урока

Основной syntax:

```python
sequence[start:stop:step]
```

Главные правила:

```text
start → inclusive
stop  → exclusive
step  → шаг
```

Для list slicing:

```text
создаёт новый outer list
копирует references
имеет O(k) complexity
```

И важно различать:

```python
items[1:3]
```

— чтение и создание нового slice,

от:

```python
items[1:3] = [...]
```

— mutation существующего list.
