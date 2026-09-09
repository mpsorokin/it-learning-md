# Lesson 11 — Truthiness, `None` and Boolean Semantics

Python позволяет использовать в `if` не только `True` и `False`.

Например:

```python id="k3k0sp"
items = []

if items:
    print("Has items")
```

Этот код valid.

Почему?

Потому что Python умеет интерпретировать objects в boolean context.

Это называется:

```text id="tjsm2k"
truthiness
```

---

# 1. Boolean context

Когда Python видит:

```python id="w3jv7e"
if value:
    ...
```

он должен решить:

```text id="7gqtgj"
value считается True или False?
```

Для этого object не обязан буквально быть `bool`.

Например:

```python id="x8f0iw"
if 10:
    print("yes")
```

выведет:

```text id="k7xu6w"
yes
```

---

# 2. Falsy values

Основные built-in falsy values:

```python id="9dl2k9"
False
None
0
0.0
0j
""
[]
()
{}
set()
frozenset()
```

То есть обычно:

```text id="clqj8e"
zero
empty
None
False
```

считаются false.

---

# 3. Truthy values

Практически все остальные objects truthy.

Например:

```python id="ixubdq"
bool(1)
# True

bool(-10)
# True

bool("hello")
# True

bool([0])
# True
```

Обрати внимание:

```python id="w09cv7"
bool([0])
```

→ `True`

Потому что list не пустой.

Содержимое list не анализируется.

---

# 4. `bool()`

Можно явно проверить truthiness:

```python id="1yx578"
bool(value)
```

Например:

```python id="r1tkpb"
print(bool(""))
# False

print(bool(" "))
# True
```

String с пробелом не empty.

---

# 5. Pythonic empty check

Вместо:

```python id="xg2h6l"
if len(items) > 0:
    ...
```

обычно пишут:

```python id="x79ke8"
if items:
    ...
```

А вместо:

```python id="rj6js9"
if len(items) == 0:
    ...
```

обычно:

```python id="e0tcfi"
if not items:
    ...
```

Это стандартный Python style.

---

# 6. Но truthiness и explicit comparison — не одно и то же

Например:

```python id="gxoqeo"
value = 0
```

Проверка:

```python id="7d6g0v"
if not value:
    ...
```

сработает.

Но то же самое произойдёт для:

```python id="fdjy1q"
value = None
```

и:

```python id="dl801l"
value = ""
```

Поэтому важно понимать semantic intention.

---

# 7. Когда нужен `is None`

Представим:

```python id="hktfew"
def update_timeout(timeout=None):
    ...
```

Если:

```text id="ur417l"
0
```

является valid timeout value, нельзя писать:

```python id="ibmfuj"
if not timeout:
    timeout = 30
```

Потому что `0` falsy.

Лучше:

```python id="ccechb"
if timeout is None:
    timeout = 30
```

Теперь различаются:

```text id="q6lgfr"
None → value missing

0 → explicitly supplied zero
```

---

# 8. `None`

`None` — специальный singleton object, который обычно означает:

```text id="e43j6t"
no value
missing result
not initialized
absence
```

Проверять:

```python id="b57nsa"
value is None
```

или:

```python id="10pefd"
value is not None
```

а не через truthiness, если именно отсутствие значения важно.

---

# 9. `None` не равен false в смысле identity

Например:

```python id="ef8y1j"
None is False
```

→

```text id="nhozky"
False
```

И:

```python id="u8ltbx"
None == False
```

тоже:

```text id="8wlaxm"
False
```

Оба falsy, но это разные objects и разные semantic values.

---

# 10. `False`, `0` и empty collection тоже разные

Например:

```python id="5sod7w"
False == 0
```

→ `True`

из-за relationship `bool` и `int`.

Но:

```python id="ms1s7j"
False == []
```

→ `False`

При этом:

```python id="0hszhb"
bool(False)
bool(0)
bool([])
```

все дают:

```text id="5e3prj"
False
```

Truthiness не означает equality.

---

# 11. Как custom object определяет truthiness

Custom classes тоже могут управлять boolean behaviour.

Python сначала может использовать:

```python id="uipg48"
__bool__()
```

Например:

```python id="4ukb6j"
class Result:
    def __init__(self, success):
        self.success = success

    def __bool__(self):
        return self.success
```

Теперь:

```python id="ift8xi"
result = Result(True)

if result:
    print("Success")
```

работает через `__bool__()`.

---

# 12. `__len__()` тоже влияет на truthiness

Если `__bool__()` нет, Python может использовать:

```python id="1tzb3v"
__len__()
```

Например:

```python id="boxe6p"
class Queue:
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return len(self.items)
```

Теперь:

```python id="n7fqpy"
queue = Queue([])

print(bool(queue))
```

→

```text id="ke12yj"
False
```

Если length > 0:

```text id="qnvuw0"
True
```

---

# 13. Default truthiness custom objects

Если class не определяет ни `__bool__`, ни meaningful `__len__`, instance обычно truthy.

Например:

```python id="q0dn3j"
class User:
    pass


user = User()

print(bool(user))
```

→

```text id="c2n9gt"
True
```

---

# 14. `not`

Оператор:

```python id="qw30jq"
not value
```

возвращает настоящий `bool`.

Например:

```python id="n4g1za"
not []
```

→

```text id="opqs81"
True
```

```python id="3uvy14"
not [1]
```

→

```text id="nx6jaa"
False
```

---

# 15. `and` и `or` — важное отличие

Вот здесь Python сильно отличается от naive boolean model.

Операторы:

```python id="a03yk1"
and
or
```

не обязаны возвращать `True` или `False`.

Они возвращают **один из operands**.

---

# 16. `and`

Правило:

```text id="fvejg8"
a and b
```

Если `a` falsy:

```text id="nqxbmy"
return a
```

Иначе:

```text id="77zvkw"
return b
```

Например:

```python id="5yyos6"
10 and 20
```

→

```text id="66u8dm"
20
```

Потому что `10` truthy.

---

Другой пример:

```python id="54l6q4"
0 and 20
```

→

```text id="j1p7zu"
0
```

Потому что первый operand falsy.

---

# 17. `or`

Правило:

```text id="u4qhaf"
a or b
```

Если `a` truthy:

```text id="x38ik0"
return a
```

Иначе:

```text id="btngl9"
return b
```

Например:

```python id="u5nl29"
10 or 20
```

→

```text id="gz77qt"
10
```

А:

```python id="16g38a"
0 or 20
```

→

```text id="nw9wdg"
20
```

---

# 18. Short-circuit evaluation

`and` и `or` не обязаны вычислять правую часть.

Например:

```python id="g0k5fj"
user is not None and user.is_active
```

Если:

```python id="0d2fmb"
user is None
```

первая часть `False`.

Python уже знает, что весь `and` falsy, поэтому:

```python id="dm583m"
user.is_active
```

вообще не вычисляется.

---

# 19. Это защищает от ошибок

Например:

```python id="js1wc5"
items and items[0]
```

Если:

```python id="r9jx74"
items = []
```

expression вернёт:

```python id="i3jh5g"
[]
```

и `items[0]` не будет вызван.

Поэтому не будет `IndexError`.

---

# 20. `or` для defaults

Часто встречается:

```python id="r8te3b"
name = provided_name or "Anonymous"
```

Если `provided_name` falsy, используется `"Anonymous"`.

Например:

```python id="f4ylso"
provided_name = ""

name = provided_name or "Anonymous"
```

→

```text id="wqq8ms"
Anonymous
```

---

# 21. Но `or` как default может быть опасен

Представим:

```python id="2j16ds"
timeout = provided_timeout or 30
```

Если:

```python id="bl9vkc"
provided_timeout = 0
```

получим:

```text id="tmwibd"
30
```

Хотя `0` мог быть valid explicit value.

Если нужен только fallback на `None`:

```python id="vncssv"
timeout = (
    30
    if provided_timeout is None
    else provided_timeout
)
```

---

# 22. `and` как conditional value

Можно встретить:

```python id="kdl2ao"
result = user and user.name
```

Если `user` falsy, result будет `user`.

Если truthy — `user.name`.

Технически работает, но в современном Python часто explicit code читается лучше.

---

# 23. Chaining `and`

```python id="xiwetv"
a and b and c
```

Python идёт слева направо.

Возвращается:

* первый falsy operand;
* либо последний operand, если все truthy.

Например:

```python id="c2khpi"
1 and "hello" and [10]
```

→

```python id="6pjiv8"
[10]
```

---

А:

```python id="e09d47"
1 and "" and [10]
```

→

```text id="ilzdqr"
""
```

До `[10]` evaluation уже не доходит.

---

# 24. Chaining `or`

```python id="7ie979"
a or b or c
```

возвращает:

* первый truthy operand;
* либо последний operand, если все falsy.

Например:

```python id="h3zakz"
None or "" or "default"
```

→

```text id="70aevc"
default
```

---

# 25. Это похоже на JavaScript

JavaScript:

```js id="3kk07t"
const name = input || "Anonymous";
```

очень похож по semantics на:

```python id="yeekab"
name = input or "Anonymous"
```

Оба возвращают operands и используют short-circuit evaluation.

---

# 26. Но JS и Python falsy values отличаются

JavaScript имеет свои falsy values:

```text id="jf43h8"
false
0
-0
0n
""
null
undefined
NaN
```

Python:

```text id="rq4r60"
False
None
numeric zero
empty containers
empty strings
```

Особенно важно:

JavaScript:

```js id="d4sm5q"
Boolean([])
```

→

```text id="9zkr1j"
true
```

Python:

```python id="p5aiz3"
bool([])
```

→

```text id="j3zg6x"
False
```

Это важное отличие.

---

# 27. Empty object/dict: JS vs Python

JavaScript:

```js id="gslbzo"
Boolean({})
```

→ `true`

Python:

```python id="0ra47e"
bool({})
```

→ `False`

В Python empty containers обычно falsy.

---

# 28. Python не имеет `null` и `undefined`

В JavaScript есть два распространённых absence concepts:

```text id="1rbez6"
null
undefined
```

Python обычно использует:

```python id="2yqv6e"
None
```

Но `None` не является полным equivalent обоих concepts.

Например отсутствующий dictionary key:

```python id="i81pup"
user["missing"]
```

не возвращает `None`.

Он выбрасывает:

```text id="5etf0e"
KeyError
```

---

# 29. Chained comparisons

Python поддерживает:

```python id="7qrteq"
0 < age < 100
```

Это не просто syntax sugar уровня:

```python id="9khbp4"
0 < age and age < 100
```

Хотя semantic result похож.

Важная деталь: middle expression вычисляется один раз.

---

# 30. Пример

```python id="etwj85"
age = 35

if 18 <= age < 65:
    print("working age")
```

Это idiomatic Python.

В TypeScript пришлось бы:

```ts id="re087h"
if (age >= 18 && age < 65) {
    ...
}
```

---

# 31. Более длинные chains

Можно:

```python id="2g0xyh"
a < b < c < d
```

Conceptually это означает последовательные comparisons через `and`, но без повторного evaluation middle operands.

Это часто удобно для ranges.

---

# 32. `any()`

Проверяет, truthy ли хотя бы один element.

```python id="f62ink"
values = [
    False,
    0,
    "",
    10,
]

print(any(values))
```

→

```text id="328vtg"
True
```

---

# 33. `all()`

Проверяет, truthy ли все elements.

```python id="kp907p"
values = [
    1,
    "hello",
    [1],
]

print(all(values))
```

→

```text id="a8esry"
True
```

Если хотя бы один falsy:

```python id="gmv02o"
all([1, 0, 2])
```

→ `False`

---

# 34. `any()` и `all()` short-circuit

Они не обязаны обходить весь iterable.

`any()` останавливается при первом truthy value.

`all()` — при первом falsy.

Это полезно с generators и expensive checks.

Например:

```python id="u8ffop"
has_admin = any(
    user["role"] == "admin"
    for user in users
)
```

---

# 35. Interesting empty iterable semantics

```python id="zd14wb"
any([])
```

→

```text id="3f9hei"
False
```

А:

```python id="hpso2d"
all([])
```

→

```text id="b2kqsy"
True
```

Почему `all([])` true?

Потому что в empty collection нет ни одного element, который нарушает условие.

Это называется vacuous truth.

---

# 36. Boolean operators precedence

Упрощённо:

```text id="2qkeiq"
not
and
or
```

То есть:

```python id="3a1gyj"
a or b and c
```

читается как:

```python id="szbjqu"
a or (b and c)
```

Не как:

```python id="0uql38"
(a or b) and c
```

Если expression нетривиальный — parentheses обычно улучшают readability.

---

# 37. `not` и comparisons

Например:

```python id="pjojqq"
not a == b
```

работает, но обычно лучше:

```python id="94keqy"
a != b
```

А для identity:

```python id="bpm2ef"
a is not None
```

лучше, чем:

```python id="c0vv4x"
not a is None
```

---

# Common Mistakes

## 1. Использовать `if not value` когда нужно проверить только `None`

Плохо:

```python id="ewps7l"
if not timeout:
    timeout = 30
```

если `0` допустим.

Лучше:

```python id="r3pg59"
if timeout is None:
    timeout = 30
```

---

## 2. Думать, что `and` / `or` возвращают только bool

```python id="c8aaqv"
"hello" and 42
```

возвращает:

```text id="w8ezo8"
42
```

---

## 3. Переносить JS truthiness для arrays/objects

JS:

```text id="s4zfve"
[] → truthy
{} → truthy
```

Python:

```text id="bbyrt0"
[] → falsy
{} → falsy
```

---

## 4. Использовать `or` для default, когда falsy value valid

```python id="igye4m"
count = supplied_count or 10
```

сломает explicit `0`.

---

## 5. Путать falsiness с equality

```python id="k35a0s"
None
0
""
[]
```

все falsy, но они не являются одним и тем же value.

---

# Practical Example

Есть query params:

```python id="54itfu"
def build_query(
    search=None,
    limit=None,
):
    query = {}

    if search:
        query["search"] = search

    if limit is not None:
        query["limit"] = limit

    return query
```

Почему проверки разные?

Для `search` empty string:

```python id="0pkq12"
""
```

можно считать отсутствующим search term.

Поэтому:

```python id="d86tbx"
if search:
```

логично.

Но:

```python id="5aml1r"
limit = 0
```

может иметь отдельный semantic meaning.

Поэтому:

```python id="ntpkxm"
if limit is not None:
```

точнее.

Truthiness — это не просто syntax shortcut. Это часть API semantics.

---

# Interview Questions

## 1. What values are falsy in Python?

**Ответ:**

Основные:

```text id="2oozl4"
None
False
numeric zero
empty string
empty list
empty tuple
empty dict
empty set
```

Custom object также может быть falsy через `__bool__()` или `__len__()`.

---

## 2. Do `and` and `or` always return booleans?

**Ответ:**

Нет.

Они возвращают operands.

```python id="ivj5qy"
a and b
```

возвращает первый falsy operand или `b`.

```python id="iq96hj"
a or b
```

возвращает первый truthy operand или последний operand.

---

## 3. Why can `value or default` be dangerous?

**Ответ:**

Потому что fallback применяется для любого falsy value:

```text id="hcp0ha"
None
0
""
[]
False
```

Если только `None` означает absence, нужно проверять `is None` отдельно.

---

## 4. How does Python determine truthiness for a custom object?

**Ответ:**

Python может использовать:

```python id="53ejzt"
__bool__()
```

Если его нет, может использовать:

```python id="ie7xwr"
__len__()
```

Zero length считается falsy.

Если специального поведения нет, обычный instance обычно truthy.

---

## 5. What is the difference between Python and JavaScript truthiness for empty containers?

**Ответ:**

В Python:

```python id="fp896i"
bool([])
bool({})
```

→ `False`

В JavaScript empty Array и Object truthy:

```js id="oj1y7c"
Boolean([])
Boolean({})
```

→ `true`

Это частый источник ошибок при переходе между языками.

---

# Check Yourself

## 1

```python id="y5f5cy"
print(bool([]))
print(bool([0]))
```

**Ответ:**

```text id="7cjfed"
False
True
```

Первый list empty, второй нет.

---

## 2

```python id="g5k2bq"
print("" or "default")
```

**Ответ:**

```text id="t76044"
default
```

Empty string falsy.

---

## 3

```python id="wb9r6b"
print([] and 10)
```

**Ответ:**

```python id="8i219n"
[]
```

Первый operand falsy, поэтому `and` возвращает его.

---

## 4

```python id="bvkzyg"
value = 0

if value is not None:
    print("provided")
```

**Ответ:**

```text id="gg386v"
provided
```

`0` falsy, но не `None`.

---

## 5

```python id="yhnf6f"
print(
    None
    or ""
    or 0
    or "Python"
    or "fallback"
)
```

**Ответ:**

```text id="nw8waa"
Python
```

`or` возвращает первый truthy operand.

---

# Главное из урока

Python boolean context работает не только с `bool`.

Основные falsy values:

```text id="en3n4e"
None
False
zero
empty containers
empty strings
```

Главное различие:

```python id="jpybqs"
if value:
```

проверяет truthiness.

А:

```python id="qpfid7"
if value is None:
```

проверяет конкретно отсутствие значения.

`and` и `or` возвращают operands и используют short-circuit evaluation:

```text id="cgeqn9"
a and b
→ first falsy or last operand

a or b
→ first truthy or last operand
```

И после JavaScript особенно важно запомнить:

> В Python empty `list`, `dict`, `set` и другие containers falsy, тогда как empty Array/Object в JavaScript truthy.
