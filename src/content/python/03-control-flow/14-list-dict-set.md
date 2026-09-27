# Lesson 14 — List, Dict and Set Comprehensions

Comprehensions — один из самых характерных Python constructs.

Они позволяют описать:

> как построить новую collection из iterable.

Например обычный loop:

```python id="hnb28p"
result = []

for value in values:
    result.append(
        value * 2
    )
```

Можно записать:

```python id="9aq0w3"
result = [
    value * 2
    for value in values
]
```

Это **list comprehension**.

---

# 1. Базовая структура

Форма:

```python id="mc99a2"
[
    expression
    for item in iterable
]
```

Например:

```python id="kftb1b"
numbers = [
    1,
    2,
    3,
]

squares = [
    number ** 2
    for number in numbers
]
```

Результат:

```python id="f14vm9"
[1, 4, 9]
```

---

# 2. Mental model

Comprehension:

```python id="l6w5qt"
[
    transform(item)
    for item in items
]
```

conceptually соответствует:

```python id="w1rqom"
result = []

for item in items:
    result.append(
        transform(item)
    )
```

То есть comprehension обычно состоит из:

```text id="wck5ue"
iteration
+
optional filtering
+
transformation
```

---

# 3. Filtering

Можно добавить `if`:

```python id="f22i45"
numbers = [
    1,
    2,
    3,
    4,
    5,
]

even = [
    number
    for number in numbers
    if number % 2 == 0
]
```

Результат:

```python id="3vqdr8"
[2, 4]
```

---

# 4. Filter выполняется до добавления result

Conceptually:

```python id="yw2fei"
result = []

for number in numbers:
    if number % 2 == 0:
        result.append(number)
```

Это важно отличать от conditional expression.

---

# 5. Transformation + filter

Например:

```python id="rzgo1v"
squares = [
    number ** 2
    for number in numbers
    if number % 2 == 0
]
```

Здесь:

```text id="uvufl8"
number % 2 == 0
→ filter

number ** 2
→ transformation
```

Результат:

```python id="kzlnx7"
[4, 16]
```

---

# 6. Conditional expression внутри comprehension

Можно:

```python id="lreqt0"
labels = [
    "even"
    if number % 2 == 0
    else "odd"
    for number in numbers
]
```

Здесь `if ... else` — не filter.

Это expression.

Каждый input element всё равно даёт result element.

---

# 7. Filter vs conditional expression

Filter:

```python id="24jbjb"
[
    x
    for x in values
    if x > 0
]
```

Некоторые elements исчезают.

---

Conditional expression:

```python id="mq8qli"
[
    x
    if x > 0
    else 0
    for x in values
]
```

Количество elements сохраняется.

---

# 8. List comprehension создаёт новый list

Например:

```python id="n4yfdx"
users = [
    {"id": 1},
    {"id": 2},
]

copy = [
    user
    for user in users
]
```

Outer list новый:

```python id="a6gk6f"
copy is users
# False
```

Но dictionaries те же.

Comprehension не делает deep copy.

---

# 9. Dict comprehension

Форма:

```python id="fvzuja"
{
    key_expression: value_expression
    for item in iterable
}
```

Например:

```python id="0r16eq"
users = [
    {
        "id": 10,
        "name": "Alex",
    },
    {
        "id": 20,
        "name": "Bob",
    },
]

users_by_id = {
    user["id"]: user
    for user in users
}
```

Результат:

```python id="i4v0fi"
{
    10: {
        "id": 10,
        "name": "Alex",
    },
    20: {
        "id": 20,
        "name": "Bob",
    },
}
```

Это очень распространённый real-world pattern.

---

# 10. Dict comprehension может transform values

```python id="sx94pb"
prices = {
    "book": 10,
    "course": 20,
}

with_tax = {
    name: price * 1.2
    for name, price
    in prices.items()
}
```

Результат:

```python id="neufkp"
{
    "book": 12.0,
    "course": 24.0,
}
```

---

# 11. Dict comprehension с filter

```python id="1omtyx"
active_users = {
    user["id"]: user
    for user in users
    if user["active"]
}
```

Здесь одновременно:

```text id="bxrt5r"
filter
+
index building
```

---

# 12. Duplicate keys

Если comprehension создаёт одинаковый key несколько раз:

```python id="yjwfvd"
values = [
    ("a", 1),
    ("a", 2),
]

result = {
    key: value
    for key, value in values
}
```

Result:

```python id="51vbda"
{
    "a": 2,
}
```

Позднее value заменяет более раннее.

---

# 13. Set comprehension

Форма:

```python id="kehl51"
{
    expression
    for item in iterable
}
```

Например:

```python id="pf6sbo"
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

Результат logically:

```python id="6qsyor"
{
    "alex",
    "bob",
}
```

Transformation и deduplication выполняются вместе.

---

# 14. Set vs dict comprehension syntax

Set:

```python id="ts0c63"
{
    value
    for value in values
}
```

Dict:

```python id="gki7dt"
{
    key: value
    for key, value in items
}
```

Наличие:

```text id="bxvegd"
key:
```

делает construct dict comprehension.

---

# 15. Tuple comprehension не существует

Вот важная ловушка:

```python id="h3oijx"
(
    x * 2
    for x in values
)
```

Это не tuple comprehension.

Это:

```text id="3qg03m"
generator expression
```

Чтобы получить tuple:

```python id="e4ofot"
result = tuple(
    x * 2
    for x in values
)
```

Generators будут отдельной темой.

---

# 16. Nested comprehension

Можно:

```python id="1jj4rm"
matrix = [
    [1, 2],
    [3, 4],
]

flat = [
    value
    for row in matrix
    for value in row
]
```

Result:

```python id="vq1uo3"
[1, 2, 3, 4]
```

---

# 17. Как читать nested comprehension

Вот это:

```python id="70huf3"
[
    value
    for row in matrix
    for value in row
]
```

соответствует:

```python id="2xomhc"
result = []

for row in matrix:
    for value in row:
        result.append(value)
```

Порядок `for` остаётся тем же.

---

# 18. Nested comprehensions быстро становятся нечитаемыми

Например технически можно:

```python id="l3zf0l"
result = [
    transform(x, y)
    for x in xs
    if valid_x(x)
    for y in ys
    if valid_y(y)
]
```

Но после определённой сложности обычный loop намного понятнее.

Pythonic не означает:

> написать максимум logic в одну строку.

Readability важнее.

---

# 19. Side effects внутри comprehension — плохой style

Например:

```python id="rxog4m"
[
    print(user)
    for user in users
]
```

Технически сработает.

Но результатом будет list из:

```python id="ntfz7b"
None
```

и intention непонятен.

Если нужен side effect:

```python id="1v9rzr"
for user in users:
    print(user)
```

лучше.

Comprehension предназначен прежде всего для построения values.

---

# 20. Comprehension имеет свой scope

Это важное отличие от обычного `for`.

Например:

```python id="61i7ff"
values = [
    x * 2
    for x in range(3)
]

print(x)
```

В современном Python `x` снаружи недоступен.

Получим:

```text id="1y9bo9"
NameError
```

---

# 21. Сравнение с обычным `for`

```python id="7r6dlv"
for x in range(3):
    pass

print(x)
```

Здесь:

```text id="111608"
2
```

Потому что обычный `for` не создаёт отдельный scope.

Но comprehension создаёт собственный scope для iteration variables.

Это важный нюанс Python scope model.

---

# 22. Outer variables доступны

Например:

```python id="1xgeye"
multiplier = 10

values = [
    x * multiplier
    for x in range(3)
]
```

Comprehension видит outer binding `multiplier`.

Получаем:

```python id="ygg64x"
[0, 10, 20]
```

---

# 23. Performance

Comprehensions часто немного быстрее equivalent manual Python loop с repeated `append()`.

Например:

```python id="ha3vu9"
result = [
    x * 2
    for x in values
]
```

может иметь меньше interpreter overhead, чем:

```python id="f0whnf"
result = []

for x in values:
    result.append(x * 2)
```

Но это не повод превращать сложный algorithm в unreadable comprehension.

---

# 24. Comprehension eager

List comprehension:

```python id="u7clsb"
result = [
    transform(x)
    for x in values
]
```

сразу создаёт весь list.

Если `values` содержит миллион elements, result тоже materialized в memory.

Это отличается от generator expressions, которые lazy.

---

# 25. Когда comprehension особенно хорош

### Transformation

```python id="t7rny5"
names = [
    user["name"]
    for user in users
]
```

### Filtering

```python id="ayh2ue"
active = [
    user
    for user in users
    if user["active"]
]
```

### Indexing

```python id="tvh3ti"
users_by_id = {
    user["id"]: user
    for user in users
}
```

### Deduplication after transformation

```python id="flzgqh"
roles = {
    user["role"]
    for user in users
}
```

---

# 26. Когда обычный loop лучше

Если нужно:

* несколько mutations;
* logging;
* exceptions;
* early `break`;
* complicated branching;
* several intermediate variables;
* side effects.

Например:

```python id="zivsh6"
result = []

for user in users:
    if not user["active"]:
        continue

    try:
        normalized = normalize(user)
    except InvalidUser:
        logger.warning(
            "Invalid user: %s",
            user["id"],
        )
        continue

    result.append(normalized)
```

Не стоит пытаться сжимать это в comprehension.

---

# 27. JS / TS comparison

JavaScript часто использует:

```js id="yn7ac5"
const result = values
    .filter(x => x > 0)
    .map(x => x * 2);
```

Python:

```python id="jehcpe"
result = [
    x * 2
    for x in values
    if x > 0
]
```

Здесь comprehension объединяет:

```text id="x5zby7"
filter
+
map
```

в одну конструкцию.

---

# 28. Python comprehension vs `.map()` / `.filter()`

Python тоже имеет:

```python id="e85rlm"
map()
filter()
```

Но для простых transformations Python code чаще использует comprehensions:

```python id="px8wgj"
[
    user["name"]
    for user in users
]
```

вместо:

```python id="un0i4m"
list(
    map(
        lambda user: user["name"],
        users,
    )
)
```

Первый вариант обычно легче читать.

---

# 29. Practical example: normalize API data

Есть:

```python id="hxiumj"
users = [
    {
        "id": 1,
        "name": " Alex ",
        "active": True,
    },
    {
        "id": 2,
        "name": " Bob ",
        "active": False,
    },
]
```

Получить normalized active users:

```python id="a11u25"
active_users = [
    {
        **user,
        "name": user["name"].strip(),
    }
    for user in users
    if user["active"]
]
```

Получим:

```python id="q6b3w2"
[
    {
        "id": 1,
        "name": "Alex",
        "active": True,
    },
]
```

Исходные dictionaries при этом не мутируются, потому что создаётся новый outer dictionary для каждого result element.

---

# Common Mistakes

## 1. Делать comprehension ради side effects

Плохо:

```python id="3j7iwo"
[
    send_email(user)
    for user in users
]
```

Лучше обычный `for`.

---

## 2. Делать слишком сложный nested comprehension

Если его приходится долго расшифровывать — обычный loop лучше.

---

## 3. Путать filter и conditional expression

Filter:

```python id="xj3x9k"
[
    x
    for x in values
    if condition
]
```

Conditional transform:

```python id="6yufin"
[
    a if condition else b
    for x in values
]
```

---

## 4. Считать `(...)` tuple comprehension

```python id="schkeg"
(x for x in values)
```

создаёт generator expression.

---

## 5. Забывать, что list comprehension eager

Весь result materialized сразу.

---

# Interview Questions

## 1. What is a list comprehension?

**Ответ:**

Compact syntax для построения нового list из iterable с optional transformation и filtering.

Например:

```python id="1og0tc"
[
    x * 2
    for x in values
    if x > 0
]
```

соответствует loop с `if` и `append()`.

---

## 2. What is the difference between a filter and a conditional expression in a comprehension?

**Ответ:**

Filter:

```python id="2tezzn"
[
    x
    for x in values
    if x > 0
]
```

решает, попадёт ли element в result.

Conditional expression:

```python id="q66e05"
[
    x if x > 0 else 0
    for x in values
]
```

определяет, какой result value получить для каждого element.

---

## 3. Do comprehension variables leak into the outer scope?

**Ответ:**

В современном Python — нет.

```python id="89vu3a"
values = [
    x
    for x in range(3)
]
```

`x` после comprehension недоступен, если не существовал отдельно во внешнем scope.

Это отличается от обычного `for`.

---

## 4. Is a list comprehension lazy?

**Ответ:**

Нет.

List comprehension сразу создаёт весь list.

Lazy equivalent concept — generator expression:

```python id="cmn2jp"
(
    transform(x)
    for x in values
)
```

---

## 5. When should you prefer a normal loop over a comprehension?

**Ответ:**

Когда logic содержит:

* сложное branching;
* side effects;
* logging;
* exception handling;
* `break`;
* несколько промежуточных steps.

Comprehensions лучше всего работают для понятных transformations/filtering.

---

# Check Yourself

## 1

```python id="5fg8sa"
values = [
    1,
    2,
    3,
    4,
]

result = [
    x * 10
    for x in values
    if x % 2 == 0
]

print(result)
```

**Ответ:**

```python id="ebpv0q"
[20, 40]
```

---

## 2

```python id="zq2rdt"
values = [
    -2,
    0,
    3,
]

result = [
    x if x > 0 else 0
    for x in values
]

print(result)
```

**Ответ:**

```python id="y8zb2c"
[0, 0, 3]
```

---

## 3

```python id="zmvrbd"
values = [
    "A",
    "a",
    "B",
]

result = {
    value.lower()
    for value in values
}

print(len(result))
```

**Ответ:**

```text id="03f5e6"
2
```

Set comprehension удалил duplicate `"a"`.

---

## 4

```python id="b6ul2e"
users = [
    {"id": 10},
    {"id": 20},
]

result = {
    user["id"]: user
    for user in users
}

print(result[20])
```

**Ответ:**

```python id="bpybdh"
{"id": 20}
```

---

## 5

```python id="h8vb1y"
values = [
    x
    for x in range(3)
]

print(x)
```

**Ответ:**

`NameError`, если `x` не был определён отдельно во внешнем scope.

Comprehension iteration variable не leak наружу.

---

# Главное из урока

Три основных forms:

```python id="lvhhk5"
[
    expression
    for item in iterable
]
```

```python id="kptjgn"
{
    key: value
    for item in iterable
}
```

```python id="v867eb"
{
    expression
    for item in iterable
}
```

Filter добавляется:

```python id="vuchx1"
if condition
```

Главное правило:

> comprehension хорош, когда transformation/filtering можно быстро понять глазами. Если logic становится сложной — обычный `for` обычно лучше.

## Interview questions

### В чём разница между filter и conditional expression в comprehension?

Filter `if condition` решает, попадёт ли элемент в результат. Conditional expression `a if condition else b` выбирает значение результата для элемента, поэтому сам по себе не отбрасывает его.

### Является ли list comprehension lazy?

Нет. List comprehension сразу строит весь list в памяти. Для ленивой итерации подходит generator expression, например `(transform(x) for x in values)`.
