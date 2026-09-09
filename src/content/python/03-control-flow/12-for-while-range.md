# Lesson 12 — `for`, `while`, `range`, `enumerate` and `zip`

Python loops выглядят знакомо после JavaScript, но mental model у `for` другой.

В JavaScript можно думать о нескольких стилях:

```js id="tw1dyi"
for (let i = 0; i < items.length; i++) {
    ...
}
```

```js id="rj670y"
for (const item of items) {
    ...
}
```

В Python основной `for` ближе ко второму варианту:

```python id="6bvk2t"
for item in items:
    ...
```

Python `for` — это не C-style loop со встроенными:

```text id="pql45g"
initializer
condition
increment
```

Он работает через iteration protocol.

---

# 1. Базовый `for`

```python id="a5ejga"
users = [
    "Alex",
    "Bob",
    "John",
]

for user in users:
    print(user)
```

Output:

```text id="zv5c81"
Alex
Bob
John
```

На каждой iteration имя:

```python id="orosp9"
user
```

связывается с очередным object.

Conceptually:

```text id="s3f9jm"
iteration 1:
user → "Alex"

iteration 2:
user → "Bob"

iteration 3:
user → "John"
```

---

# 2. `for` работает не только с list

Можно:

```python id="d8uvnn"
for char in "Python":
    print(char)
```

Можно:

```python id="jbp9mx"
for value in (10, 20, 30):
    ...
```

Можно:

```python id="0oxqi5"
for key in {"a": 1, "b": 2}:
    ...
```

Можно:

```python id="xomw38"
for value in {1, 2, 3}:
    ...
```

То есть `for` работает с iterable objects.

---

# 3. Что `for` делает концептуально

Позже iterator protocol будет отдельным уроком, но полезно уже сейчас видеть lowering.

Код:

```python id="2eh5fl"
for item in items:
    process(item)
```

концептуально похож на:

```python id="8clw0p"
iterator = iter(items)

while True:
    try:
        item = next(iterator)
    except StopIteration:
        break

    process(item)
```

Это объясняет важную вещь:

> Python `for` не управляет числовым index автоматически. Он получает очередные values из iterator.

---

# 4. Поэтому index часто вообще не нужен

JS-style approach:

```js id="cfpcw1"
for (let i = 0; i < users.length; i++) {
    console.log(users[i]);
}
```

Python обычно:

```python id="2a1w9t"
for user in users:
    print(user)
```

Если index не нужен — не создавай его искусственно.

---

# 5. `range()`

Если всё-таки нужна последовательность numbers:

```python id="lg8kef"
for i in range(5):
    print(i)
```

Output:

```text id="6erwsk"
0
1
2
3
4
```

Важно:

```text id="vnk34h"
stop exclusive
```

Так же, как в slicing.

---

# 6. Формы `range()`

```python id="mknzzx"
range(stop)
```

```python id="x9jvap"
range(start, stop)
```

```python id="f90jhe"
range(start, stop, step)
```

Например:

```python id="6ltva6"
list(range(2, 6))
```

→

```python id="ff6t6u"
[2, 3, 4, 5]
```

---

С step:

```python id="1n3oic"
list(range(0, 10, 2))
```

→

```python id="7mcg53"
[0, 2, 4, 6, 8]
```

---

# 7. Negative step

```python id="yficqv"
list(range(5, 0, -1))
```

→

```python id="3ihv92"
[5, 4, 3, 2, 1]
```

Важно правильно сочетать direction и step.

Например:

```python id="fi9unn"
range(0, 5, -1)
```

будет empty, потому что negative step движется не в сторону `stop`.

---

# 8. `range` не создаёт огромный list

Вот важная implementation detail.

```python id="kkg2h0"
numbers = range(1_000_000_000)
```

не создаёт list из миллиарда integers.

`range` — compact iterable object, который хранит примерно параметры:

```text id="4x3jwh"
start
stop
step
```

и вычисляет values по необходимости.

---

# 9. Поэтому это нормально

```python id="9pmklu"
for i in range(10_000_000):
    ...
```

С точки зрения memory создание самого `range` дешёвое.

Конечно, сам loop из 10 миллионов iterations всё равно потребует CPU time.

---

# 10. Не используй `range(len(...))` без причины

Можно:

```python id="i9em8w"
for i in range(len(users)):
    print(users[i])
```

Но если нужен только user:

```python id="wrhf8s"
for user in users:
    print(user)
```

лучше.

---

# 11. Если нужен index — `enumerate()`

Вместо:

```python id="7nh7hh"
for i in range(len(users)):
    user = users[i]

    print(i, user)
```

обычно:

```python id="nw9ed5"
for i, user in enumerate(users):
    print(i, user)
```

Это один из наиболее характерных Python patterns.

---

# 12. Как работает `enumerate()`

```python id="r6p5pq"
users = [
    "Alex",
    "Bob",
]

for index, user in enumerate(users):
    print(index, user)
```

Output:

```text id="vbc9zb"
0 Alex
1 Bob
```

`enumerate()` выдаёт pairs:

```text id="av5nsp"
(0, "Alex")
(1, "Bob")
```

А loop делает unpacking:

```python id="vqbbz7"
index, user
```

---

# 13. Можно изменить начальный index

```python id="wy4jxw"
for index, user in enumerate(
    users,
    start=1,
):
    print(index, user)
```

Output:

```text id="v7hwlj"
1 Alex
2 Bob
```

Удобно для UI numbering.

---

# 14. `zip()`

`zip()` позволяет обходить несколько iterables одновременно.

Например:

```python id="3l3bsz"
names = [
    "Alex",
    "Bob",
    "John",
]

ages = [
    30,
    35,
    40,
]

for name, age in zip(names, ages):
    print(name, age)
```

Pairs будут:

```text id="zdng5c"
("Alex", 30)
("Bob", 35)
("John", 40)
```

---

# 15. `zip()` останавливается на shortest iterable

Например:

```python id="74ijk4"
names = [
    "Alex",
    "Bob",
    "John",
]

ages = [
    30,
    35,
]
```

```python id="gckl5u"
list(zip(names, ages))
```

Получим:

```python id="y0l534"
[
    ("Alex", 30),
    ("Bob", 35),
]
```

`John` silently не попал в result.

---

# 16. Почему это может быть опасно

Представим:

```python id="dp7i1u"
user_ids = [...]
emails = [...]
```

Если lengths должны обязательно совпадать, обычный `zip()` может скрыть bug.

Современный Python позволяет:

```python id="0m99zp"
zip(
    user_ids,
    emails,
    strict=True,
)
```

Если длины различаются, будет:

```text id="1f67hn"
ValueError
```

Для invariant-sensitive code это хороший option.

---

# 17. `zip()` lazy

Как и `range`, `zip()` не обязан заранее создавать полный list pairs.

Например:

```python id="r7glhk"
pairs = zip(names, ages)
```

`pairs` — iterable/iterator-like object.

Если нужен list:

```python id="3pncs4"
pairs = list(
    zip(names, ages)
)
```

---

# 18. `while`

Python `while` работает привычно:

```python id="xjhhrx"
count = 0

while count < 3:
    print(count)
    count += 1
```

Output:

```text id="r6kq3w"
0
1
2
```

`while` выполняется, пока condition truthy.

---

# 19. Когда `while` уместнее `for`

`for` хорошо подходит, когда:

> нужно пройти iterable.

`while` — когда termination определяется condition/state.

Например retry loop:

```python id="mifbwb"
attempt = 0

while attempt < 3:
    attempt += 1

    if send_request():
        break
```

Здесь заранее нет collection, которую нужно iterate.

Есть changing condition.

---

# 20. Infinite loop

Стандартный pattern:

```python id="rnz3cl"
while True:
    event = read_event()

    if event is None:
        break

    process(event)
```

Это нормальный Python pattern, если termination происходит внутри loop.

---

# 21. `break`

`break` немедленно завершает ближайший loop.

```python id="4ltwtj"
for user in users:
    if user["id"] == user_id:
        found = user
        break
```

После `break` loop больше не продолжает iterations.

---

# 22. `continue`

`continue` пропускает остаток текущей iteration.

Например:

```python id="v2l0oo"
for user in users:
    if not user["active"]:
        continue

    process(user)
```

Часто это помогает уменьшить nesting.

Вместо:

```python id="9w7lo6"
for user in users:
    if user["active"]:
        if user["verified"]:
            process(user)
```

можно:

```python id="e619gb"
for user in users:
    if not user["active"]:
        continue

    if not user["verified"]:
        continue

    process(user)
```

---

# 23. `else` после loop

Python имеет необычную конструкцию:

```python id="q5ce4o"
for item in items:
    ...
else:
    ...
```

`else` выполняется, если loop завершился **без `break`**.

Это сначала выглядит странно.

---

# 24. Пример `for ... else`

```python id="z638b1"
users = [
    {"id": 1},
    {"id": 2},
]

for user in users:
    if user["id"] == 10:
        print("Found")
        break
else:
    print("Not found")
```

Output:

```text id="t45wyc"
Not found
```

Почему?

Loop дошёл до конца и ни разу не вызвал `break`.

---

# 25. Если `break` случился

```python id="dsi6z9"
for user in users:
    if user["id"] == 2:
        print("Found")
        break
else:
    print("Not found")
```

Output:

```text id="11x2ru"
Found
```

`else` не выполняется.

---

# 26. Mental model `for ... else`

Лучше думать не:

> else относится к for.

А:

> else означает "loop finished normally, without break".

Это особенно удобно для search algorithms.

---

# 27. `while ... else`

То же работает с `while`:

```python id="awaaav"
attempt = 0

while attempt < 3:
    if connected():
        break

    attempt += 1
else:
    raise RuntimeError(
        "Could not connect"
    )
```

`else` выполняется только если loop закончился condition-driven, а не через `break`.

---

# 28. Modifying collection while iterating

Опасный pattern:

```python id="omjgfv"
items = [1, 2, 3, 4]

for item in items:
    if item % 2 == 0:
        items.remove(item)
```

Иногда результат может оказаться неожиданным, потому что indexes сдвигаются во время iteration.

---

# 29. Лучше создать новый collection

Например:

```python id="ijbcp3"
items = [
    item
    for item in items
    if item % 2 != 0
]
```

Или iterating over copy:

```python id="djsi2f"
for item in items[:]:
    if item % 2 == 0:
        items.remove(item)
```

Но первый вариант часто проще.

---

# 30. Dictionary mutation during iteration

Особенно опасно менять size dictionary:

```python id="fph6p7"
for key in data:
    del data[key]
```

обычно приведёт к runtime error.

Если реально нужно:

```python id="8ggyi5"
for key in list(data):
    del data[key]
```

Но чаще лучше сначала подумать, нельзя ли построить новую структуру.

---

# 31. JS / TS comparison

JavaScript C-style loop:

```js id="p7kvpg"
for (
    let i = 0;
    i < users.length;
    i++
) {
    const user = users[i];
}
```

Python прямого эквивалента не имеет.

Можно сделать:

```python id="f131rq"
for i in range(len(users)):
    user = users[i]
```

но обычно это не Pythonic.

---

# 32. Python ближе к `for...of`

JavaScript:

```js id="8q6ydf"
for (const user of users) {
    process(user);
}
```

Python:

```python id="n6sq85"
for user in users:
    process(user)
```

Conceptually очень близко.

Оба итерируют values, а не numeric indexes.

---

# 33. `enumerate()` vs manual counter

Плохо:

```python id="pxlcuo"
index = 0

for user in users:
    print(index, user)

    index += 1
```

Лучше:

```python id="8am5ws"
for index, user in enumerate(users):
    print(index, user)
```

Это и короче, и точнее выражает intention.

---

# 34. `zip()` vs indexing two lists

Плохо:

```python id="5ewwod"
for i in range(len(names)):
    print(
        names[i],
        ages[i],
    )
```

Лучше:

```python id="9j5khq"
for name, age in zip(
    names,
    ages,
    strict=True,
):
    print(name, age)
```

Если collections должны иметь одинаковую длину, `strict=True` ещё и проверяет invariant.

---

# Common Mistakes

## 1. Использовать `range(len(items))` без необходимости

Если index не нужен:

```python id="wjnlk5"
for item in items:
    ...
```

проще.

---

## 2. Делать manual counter вместо `enumerate()`

Используй:

```python id="h06juj"
enumerate(items)
```

---

## 3. Использовать indexes для parallel collections вместо `zip()`

Используй:

```python id="a87enq"
zip(a, b)
```

---

## 4. Забывать, что обычный `zip()` truncates

Если lengths обязаны совпадать:

```python id="l6po0a"
zip(a, b, strict=True)
```

безопаснее.

---

## 5. Мутировать collection size во время iteration

Это может приводить к skipped elements или runtime errors.

---

# Practical Example

Есть API users:

```python id="fu8nhn"
users = [
    {
        "id": 10,
        "active": True,
    },
    {
        "id": 20,
        "active": False,
    },
    {
        "id": 30,
        "active": True,
    },
]
```

Вывести numbered active users:

```python id="f08ysh"
active_users = [
    user
    for user in users
    if user["active"]
]

for number, user in enumerate(
    active_users,
    start=1,
):
    print(
        number,
        user["id"],
    )
```

Если нужно найти user:

```python id="o5nslq"
target_id = 20

for user in users:
    if user["id"] == target_id:
        found = user
        break
else:
    found = None
```

Здесь `for ... else` естественно выражает:

```text id="530rjc"
searched everything
+
never broke
→ not found
```

---

# Interview Questions

## 1. How does Python `for` work conceptually?

**Ответ:**

Он работает через iterator protocol.

Conceptually Python получает iterator через `iter()`, затем вызывает `next()` до `StopIteration`.

Поэтому `for` работает с любым iterable, а не только indexed collections.

---

## 2. Does `range()` create a list of all numbers?

**Ответ:**

Нет.

`range` — compact iterable object, который хранит `start`, `stop`, `step` и вычисляет values по необходимости.

Поэтому:

```python id="db6g1x"
range(1_000_000_000)
```

не требует memory под миллиард integers.

---

## 3. When should you use `enumerate()`?

**Ответ:**

Когда во время iteration нужны одновременно:

```text id="4f7d9u"
index
+
value
```

Вместо:

```python id="vdo90f"
for i in range(len(items)):
```

обычно лучше:

```python id="01st5s"
for i, item in enumerate(items):
```

---

## 4. How does `zip()` behave with iterables of different lengths?

**Ответ:**

Обычный `zip()` останавливается на shortest iterable.

Если различие lengths должно считаться ошибкой, можно использовать:

```python id="9qjeuc"
zip(a, b, strict=True)
```

тогда Python выбросит `ValueError`.

---

## 5. What does `else` on a `for` loop mean?

**Ответ:**

`else` выполняется, если loop завершился без `break`.

Это удобно для search logic:

```python id="ijki31"
for item in items:
    if matches(item):
        break
else:
    handle_not_found()
```

---

# Check Yourself

## 1

```python id="ls5pew"
for i in range(2, 7, 2):
    print(i)
```

**Ответ:**

```text id="uj318x"
2
4
6
```

---

## 2

```python id="av85r1"
users = [
    "Alex",
    "Bob",
]

for i, user in enumerate(
    users,
    start=1,
):
    print(i, user)
```

**Ответ:**

```text id="xqt401"
1 Alex
2 Bob
```

---

## 3

```python id="c2z2ij"
a = [1, 2, 3]
b = ["A", "B"]

print(
    list(zip(a, b))
)
```

**Ответ:**

```python id="im9901"
[
    (1, "A"),
    (2, "B"),
]
```

Обычный `zip()` остановился на shorter iterable.

---

## 4

```python id="bg0ivj"
for value in [1, 2, 3]:
    if value == 2:
        break
else:
    print("done")
```

**Ответ:**

Ничего не напечатает.

`break` произошёл, поэтому `else` не выполняется.

---

## 5

```python id="g93okw"
for value in [1, 2, 3]:
    if value == 10:
        break
else:
    print("done")
```

**Ответ:**

```text id="ddf15f"
done
```

Loop завершился normally без `break`.

---

# Главное из урока

Python `for` — это iteration, а не C-style counter loop:

```python id="sxehl5"
for item in iterable:
    ...
```

Если нужны числа:

```python id="fmi65n"
range()
```

Если нужен index:

```python id="3gb4ps"
enumerate()
```

Если нужно параллельно обходить несколько iterables:

```python id="sa8jna"
zip()
```

Для condition-driven loops:

```python id="r5k90n"
while
```

И полезная Python-specific конструкция:

```text id="7iuij6"
for / while ... else
→ else runs when loop finishes without break
```
