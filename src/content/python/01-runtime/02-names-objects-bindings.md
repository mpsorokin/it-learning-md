# Lesson 2 — Names, Objects and Bindings

Одна из самых полезных вещей, которую стоит перестроить в голове после JavaScript / TypeScript:

> В Python лучше думать не «переменная хранит значение», а «имя связано с объектом».

На простом коде разница кажется философской:

```python
x = 10
```

Можно сказать:

> в `x` лежит `10`.

Для бытового объяснения этого достаточно.

Но такая модель начинает ломаться, когда появляются:

* mutable objects;
* несколько имён для одного объекта;
* function arguments;
* class attributes;
* closures;
* copying;
* identity;
* garbage collection.

Поэтому Python полезнее понимать через три понятия:

```text
name
object
binding
```

---

# 1. Object — это реальный runtime value

Например:

```python
10
```

— объект типа `int`.

```python
"hello"
```

— объект типа `str`.

```python
[1, 2, 3]
```

— объект типа `list`.

```python
{"name": "Alex"}
```

— объект типа `dict`.

Функция тоже объект:

```python
def foo():
    pass
```

Class тоже объект:

```python
class User:
    pass
```

---

# 2. Name — это имя

Когда пишем:

```python
x = 10
```

Python связывает имя:

```text
x
```

с объектом:

```text
10
```

Mental model:

```text
x ─────► 10
          int object
```

Это и есть binding.

---

# 3. Assignment создаёт binding

Оператор:

```python
=
```

в Python в первую очередь нужно воспринимать как:

> связать name с object.

Например:

```python
name = "Alex"
```

Conceptually:

```text
name ─────► "Alex"
             str
```

---

# 4. Assignment не копирует объект автоматически

Очень важный пример:

```python
a = [1, 2, 3]

b = a
```

После первой строки:

```text
a ─────► [1, 2, 3]
```

После:

```python
b = a
```

не появляется второй list.

Получается:

```text
a ─────┐
       │
       ▼
    [1, 2, 3]
       ▲
       │
b ─────┘
```

Два имени связаны с одним object.

---

# 5. Проверим это

```python
a = [1, 2, 3]
b = a

b.append(4)

print(a)
print(b)
```

Результат:

```text
[1, 2, 3, 4]
[1, 2, 3, 4]
```

Почему изменился `a`?

Потому что мы не меняли `a`.

Мы изменили объект, на который смотрят оба имени.

---

# 6. Это не «b изменило a»

Фраза:

> изменение `b` изменило `a`

не очень точна.

Более точная модель:

```text
a
 \
  \
   ───► same list object ◄─── b
```

Вызов:

```python
b.append(4)
```

изменил list object.

После этого:

```python
a
```

всё ещё смотрит на тот же list.

---

# 7. Rebinding и mutation — разные вещи

Это одно из важнейших distinctions Python.

Рассмотрим:

```python
a = [1, 2]
b = a
```

Теперь:

```python
b.append(3)
```

Это:

```text
mutation
```

Мы изменили существующий object.

---

Теперь другой вариант:

```python
b = [10, 20]
```

Это:

```text
rebinding
```

Мы не изменили старый list.

Мы связали имя `b` с новым object.

Получается:

```text
a ─────► [1, 2, 3]

b ─────► [10, 20]
```

---

# 8. Mutation

Mutation означает:

> внутреннее состояние существующего object изменилось.

Например:

```python
items = [1, 2]

items.append(3)
```

Object остаётся тем же.

Но содержимое изменилось:

```text
before:
items ───► [1, 2]

after:
items ───► [1, 2, 3]
```

---

# 9. Rebinding

Rebinding:

```python
items = [1, 2]

items = [10, 20]
```

Первый list не превращается во второй.

Создаётся или выбирается другой object, а имя `items` связывается уже с ним.

```text
before:

items ───► [1, 2]


after:

items ───► [10, 20]
```

Если больше никто не ссылается на `[1, 2]`, объект со временем может быть уничтожен.

---

# 10. Почему это особенно важно для immutable objects

Возьмём:

```python
x = 10
```

Теперь:

```python
x = x + 1
```

Может казаться:

> объект `10` изменился и стал `11`.

Нет.

Integer immutable.

Conceptually:

```text
x ───► 10
```

После:

```python
x = x + 1
```

создаётся результат:

```text
11
```

и имя `x` связывается с новым object:

```text
x ───► 11
```

Объект `10` не мутировал.

---

# 11. `+=` может выглядеть одинаково, но вести себя по-разному

Вот интересная Python-specific тема.

## Integer

```python
x = 10

x += 1
```

Результат:

```text
x ───► 11
```

Поскольку `int` immutable, происходит effectively rebinding к новому integer object.

---

## List

```python
items = [1, 2]

items += [3]
```

List может быть изменён in-place.

То есть behaviour зависит от type и его implementation.

---

# 12. Сравним

```python
a = 10
b = a

b += 1

print(a)
print(b)
```

Output:

```text
10
11
```

---

Теперь:

```python
a = [1, 2]
b = a

b += [3]

print(a)
print(b)
```

Output:

```text
[1, 2, 3]
[1, 2, 3]
```

Почему?

Потому что list поддерживает in-place mutation для `+=`.

---

# 13. Очень важный вывод про операторы

Нельзя смотреть только на syntax:

```python
x += y
```

и делать вывод о memory behaviour.

Нужно знать type объекта.

Условно:

```text
immutable type
→ новый object + rebinding

mutable type
→ возможна in-place mutation
```

Но это не универсальное правило для каждого custom type — конкретное поведение определяется implementation type.

---

# 14. Names не живут сами по себе

Имя существует внутри определённого namespace.

Например:

```python
x = 10
```

на module level создаёт binding в namespace module.

Упрощённо namespace можно представить как mapping:

```text
name → object
```

Например:

```text
"x" → 10
"user" → <User object>
"calculate" → <function object>
```

---

# 15. Namespace concept

Очень грубо namespace похож на dictionary:

```python
{
    "x": 10,
    "name": "Alex",
    "calculate": <function object>,
}
```

Это не значит, что каждый namespace буквально реализован как обычный Python `dict` во всех деталях.

Но mental model очень полезный:

> namespace связывает names с objects.

---

# 16. Module namespace

Например:

```python
# config.py

DEBUG = True
PORT = 8000
```

Module namespace содержит bindings примерно:

```text
DEBUG → True
PORT  → 8000
```

После:

```python
import config
```

можно обращаться:

```python
config.DEBUG
config.PORT
```

---

# 17. Function local namespace

Например:

```python
def calculate():
    price = 10
    quantity = 3

    return price * quantity
```

Во время function execution создаётся local environment, где есть bindings:

```text
price    → 10
quantity → 3
```

После завершения функции этот execution frame обычно больше не нужен.

Scope подробно будет отдельной темой, но namespace model полезен уже сейчас.

---

# 18. Assignment может связывать несколько имён

Например:

```python
a = b = []
```

Что произошло?

Не:

```text
создали два списка
```

А:

```text
a ───┐
     ├──► []
b ───┘
```

Поэтому:

```python
a.append(1)

print(b)
```

Output:

```text
[1]
```

---

# 19. Почему `a = b = []` иногда опасно

Сам syntax полностью valid.

Но с mutable object можно легко получить неожиданное shared state.

Например:

```python
errors = warnings = []

errors.append("Database unavailable")

print(warnings)
```

Получим:

```text
['Database unavailable']
```

Потому что это один list.

---

# 20. С immutable objects проблема обычно незаметна

Например:

```python
a = b = 0
```

Теперь:

```python
a += 1
```

Получим:

```python
print(a)
# 1

print(b)
# 0
```

Потому что integer не мутировал.

`a` просто rebound к `1`.

---

# 21. Multiple assignment

Python активно использует assignment как binding mechanism.

Например:

```python
x, y = 10, 20
```

Conceptually:

```text
x → 10
y → 20
```

Можно:

```python
x, y = y, x
```

Для swap.

---

# 22. Swap в Python

JavaScript / TypeScript тоже имеет destructuring:

```ts
[a, b] = [b, a];
```

Python:

```python
a, b = b, a
```

не требует temporary variable.

Conceptually сначала вычисляется правая часть:

```text
(b, a)
```

а потом происходят новые bindings:

```text
a → previous b
b → previous a
```

---

# 23. Это не magic swap instruction

Важно понимать semantics.

Например:

```python
a = 10
b = 20

a, b = b, a
```

Правая сторона сначала вычисляется на основе старых bindings.

И только затем обновляются names.

Поэтому результат:

```text
a = 20
b = 10
```

---

# 24. Unpacking тоже создаёт bindings

Например:

```python
user = ("Alex", 35)

name, age = user
```

Теперь:

```text
name → "Alex"
age  → 35
```

Это тот же assignment/binding concept, только с unpacking.

---

# 25. `for` тоже создаёт bindings

Посмотри:

```python
for item in items:
    print(item)
```

На каждой iteration имя:

```text
item
```

rebound к очередному object.

Например:

```python
items = ["A", "B", "C"]
```

Conceptually:

```text
iteration 1:
item → "A"

iteration 2:
item → "B"

iteration 3:
item → "C"
```

---

# 26. Поэтому loop variable остаётся последним binding

После:

```python
for item in ["A", "B", "C"]:
    pass

print(item)
```

получим:

```text
C
```

Потому что последнее rebinding было:

```text
item → "C"
```

---

# 27. `with ... as` тоже создаёт binding

Например:

```python
with open("data.txt") as file:
    ...
```

Имя:

```text
file
```

связывается с object, который context manager вернул из `__enter__`.

Это снова та же модель:

```text
name
↓
binding
↓
object
```

---

# 28. `import ... as` тоже binding

Например:

```python
import numpy as np
```

Здесь:

```text
np
```

— name, связанное с module object NumPy.

`np` не является каким-то специальным alias на уровне compiler.

Это обычное имя в namespace.

---

# 29. `def` тоже binding

```python
def calculate():
    return 42
```

После выполнения `def`:

```text
calculate
    ↓
function object
```

Если потом написать:

```python
foo = calculate
```

получим:

```text
calculate ──┐
            ├──► same function object
foo ────────┘
```

---

# 30. А потом можно rebinding function name

Например:

```python
def foo():
    return "original"


old_foo = foo


def foo():
    return "new"
```

Теперь:

```text
old_foo → first function object

foo     → second function object
```

Первый function object не исчез, потому что `old_foo` всё ещё на него ссылается.

---

# 31. То же самое с classes

```python
class User:
    pass
```

создаёт:

```text
User → class object
```

Можно:

```python
Model = User
```

Теперь:

```text
User ───┐
        ├──► same class object
Model ──┘
```

---

# 32. Name можно удалить

Python имеет:

```python
del
```

Например:

```python
x = 10

del x
```

После этого binding:

```text
x → 10
```

удалён.

Попытка:

```python
print(x)
```

приведёт к:

```text
NameError
```

---

# 33. `del x` не означает «уничтожить объект»

Это важное отличие.

Например:

```python
a = [1, 2]
b = a

del a
```

List всё ещё существует:

```text
b ───► [1, 2]
```

Потому что `b` продолжает ссылаться на object.

Удалён только один binding.

---

# 34. Когда объект реально может исчезнуть

Если object больше недоступен через references, CPython может освободить его.

Например:

```python
a = [1, 2]
b = a

del a
del b
```

Теперь прямых bindings к list больше нет.

Упрощённо:

```text
[]
↑
no references
```

И object становится кандидатом на уничтожение.

Детально reference counting и GC будут разбираться отдельно.

---

# 35. Object lifetime и name lifetime — разные вещи

Name может исчезнуть, а object продолжить жить.

Например:

```python
user = {"name": "Alex"}

items = [user]

del user
```

Dictionary всё ещё жив:

```text
items
  ↓
list
  ↓
dict {"name": "Alex"}
```

Хотя name:

```text
user
```

уже не существует.

---

# 36. Name не является объектом

Это subtle distinction.

Когда пишем:

```python
x = 10
```

`x` не является отдельным Python object, который «хранит reference».

`x` — identifier/binding внутри namespace.

Object — `10`.

Поэтому лучше не переносить слишком буквально C/C++ mental model переменной как memory slot.

---

# 37. Сравнение с JavaScript

В JavaScript похожая идея references тоже существует.

Например:

```js
const a = [1, 2];
const b = a;

b.push(3);

console.log(a);
```

Получим:

```js
[1, 2, 3]
```

То есть shared object behaviour здесь похоже.

---

# 38. Но `const` создаёт дополнительное ограничение

JavaScript:

```js
const a = [1, 2];

a.push(3);
```

разрешено.

Но:

```js
a = [10, 20];
```

нельзя.

Почему?

Потому что `const` запрещает rebinding variable.

Он не делает object immutable.

---

# 39. Python прямого `const` не имеет

Python:

```python
a = [1, 2]

a.append(3)

a = [10, 20]
```

всё разрешено.

Language-level declaration:

```text
const a
```

нет.

Есть conventions и typing constructs вроде `Final`, но это уже static tooling, а не обычный runtime prohibition уровня JS `const`.

---

# 40. Это важное отличие

JavaScript:

```js
const user = {
    name: "Alex"
};
```

Разрешает:

```js
user.name = "Bob";
```

Но запрещает:

```js
user = {};
```

---

Python:

```python
user = {
    "name": "Alex"
}
```

разрешает и:

```python
user["name"] = "Bob"
```

и:

```python
user = {}
```

---

# 41. Object mutability и binding mutability — разные concepts

Это важно даже за пределами Python.

Есть два разных вопроса:

### Можно ли изменить object?

```text
object mutability
```

### Можно ли связать name с другим object?

```text
rebinding
```

Python обычно разрешает rebinding.

Mutability зависит от type объекта.

---

# 42. Immutable object не означает immutable name

Например:

```python
name = "Alex"
```

String immutable.

Но можно:

```python
name = "Bob"
```

Почему?

Потому что `str` object не изменился.

Просто:

```text
name → "Alex"
```

заменилось на:

```text
name → "Bob"
```

---

# 43. Это одна из самых частых conceptual ошибок

Неверно:

> `str` immutable, поэтому variable нельзя изменить.

Правильно:

> `str` object нельзя изменить in-place, но name можно rebound к другому string object.

---

# 44. Пример с tuple

```python
point = (10, 20)
```

Tuple immutable.

Нельзя:

```python
point[0] = 100
```

Но можно:

```python
point = (100, 200)
```

Потому что это rebinding.

---

# 45. Immutable container может содержать mutable object

Очень важный edge case.

Например:

```python
data = (
    [1, 2],
    [3, 4],
)
```

Tuple immutable.

Но:

```python
data[0].append(100)
```

работает.

Получаем:

```python
(
    [1, 2, 100],
    [3, 4],
)
```

---

# 46. Почему tuple всё ещё immutable?

Потому что tuple хранит references.

Его bindings к elements не изменились.

Conceptually:

```text
tuple
├── ref ───► list A
└── ref ───► list B
```

Мы не заменили:

```text
ref → list A
```

Мы изменили сам `list A`.

---

# 47. Нельзя сделать так

```python
data[0] = [100]
```

Потому что это изменило бы сам tuple structure.

Но:

```python
data[0].append(100)
```

изменяет внешний mutable object.

---

# 48. Очень полезный mental model для containers

Container хранит:

> references на objects.

Например list:

```python
users = [
    user1,
    user2,
]
```

Conceptually:

```text
users list
┌──────────┬──────────┐
│ ref      │ ref      │
└────┬─────┴────┬─────┘
     ↓          ↓
   user1      user2
```

List не обязан хранить сами объекты «внутри себя» в бытовом смысле.

---

# 49. Поэтому nested structures быстро создают shared state

Например:

```python
user = {
    "name": "Alex",
}

users = [
    user,
    user,
]
```

Это не два independent dictionary copies.

Получаем:

```text
users[0] ───┐
            ├──► same dict
users[1] ───┘
```

---

# 50. Mutation будет видна через обе позиции

```python
users[0]["name"] = "Bob"

print(users[1]["name"])
```

Получим:

```text
Bob
```

Потому что обе references ведут к одному dictionary object.

---

# 51. Очень распространённая ловушка с multiplication

Например:

```python
rows = [
    [0, 0, 0]
] * 3
```

На первый взгляд кажется, что получим три independent lists.

Но реально:

```text
rows
├── ref ─┐
├── ref ─┼──► [0, 0, 0]
└── ref ─┘
```

Один inner list используется три раза.

---

# 52. Поэтому это удивляет

```python
rows = [
    [0, 0, 0]
] * 3

rows[0][0] = 1

print(rows)
```

Получим:

```python
[
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
]
```

---

# 53. Почему?

Потому что `* 3` повторил references, а не создал deep copies inner list.

---

# 54. Как создать independent lists

Например:

```python
rows = [
    [0, 0, 0]
    for _ in range(3)
]
```

Теперь каждую iteration создаётся новый list object.

Conceptually:

```text
rows
├──► list A
├──► list B
└──► list C
```

---

# 55. Сравнение с JavaScript

Очень похожая проблема возможна и там.

Например:

```js
const row = [0, 0, 0];

const rows = [
    row,
    row,
    row
];
```

Все entries смотрят на один Array.

То есть references не Python-specific.

Но Python syntax вроде:

```python
[[0] * 3] * 3
```

делает такую ловушку особенно компактной.

---

# 56. `id()` и object identity

Python позволяет получить identity объекта:

```python
a = []

print(id(a))
```

`id()` возвращает integer, уникально идентифицирующий object на протяжении его lifetime.

В CPython это часто связано с memory address, но писать code, полагающийся на это implementation detail, не стоит.

---

# 57. Можно увидеть shared object

```python
a = [1, 2]
b = a

print(id(a))
print(id(b))
```

Значения будут одинаковыми.

Потому что object один.

---

# 58. А independent objects

```python
a = [1, 2]
b = [1, 2]

print(id(a))
print(id(b))
```

обычно дадут разные values.

Хотя содержимое одинаковое.

Это различие:

```text
same value
vs
same object
```

подробно разберём отдельно через equality и identity.

---

# 59. Small integer / string caching — не строй на этом логику

Можно встретить странности:

```python
a = 10
b = 10
```

и обнаружить, что Python reuse одного object.

Или похожее со строками.

CPython делает caching/interning некоторых объектов как optimization.

Но нельзя рассуждать:

```text
одинаковое значение
→ значит один object
```

Это implementation detail.

Для semantic сравнения существуют отдельные operators.

---

# 60. Binding происходит после вычисления RHS

Например:

```python
x = calculate()
```

Сначала выполняется:

```python
calculate()
```

Получается object.

И только затем:

```text
x
```

bind к result.

---

# 61. Это важно при exceptions

Например:

```python
x = risky_operation()
```

Если:

```python
risky_operation()
```

выбросила exception, assignment не завершился.

То есть новый binding может вообще не появиться.

---

# 62. Пример

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    pass

print(result)
```

Если `result` раньше не существовал, получим:

```text
NameError
```

Потому что RHS не вычислился успешно.

Assignment не был выполнен.

---

# 63. Chained assignment вычисляет RHS один раз

Например:

```python
a = b = create_user()
```

`create_user()` вызывается один раз.

Оба names получают binding к одному result object.

Не два вызова.

---

# 64. Проверим

```python
def create():
    print("created")
    return []


a = b = create()
```

Output:

```text
created
```

один раз.

И:

```python
a is b
```

будет `True`.

---

# 65. Python objects не «принадлежат» одному имени

Объект может вообще не иметь очевидного user-defined name.

Например:

```python
print(
    {"name": "Alex"}
)
```

Dictionary существует как runtime object, хотя мы не сделали:

```python
user = ...
```

Он временно передаётся как argument.

---

# 66. Temporary objects

Например:

```python
result = len(
    [1, 2, 3]
)
```

List object:

```python
[1, 2, 3]
```

создаётся, используется как argument и после этого может больше не быть нужен.

Не каждый object обязан иметь постоянное имя.

---

# 67. Name — это удобный доступ к object, а не сам object

Это центральная идея урока.

```text
name ≠ object
```

А:

```text
name ───► object
```

И несколько names могут вести к одному object:

```text
a ───┐
b ───┼──► object
c ───┘
```

---

# JavaScript / TypeScript Comparison

| Concept                       | JavaScript / TypeScript            | Python                            |
| ----------------------------- | ---------------------------------- | --------------------------------- |
| Object references             | есть                               | есть                              |
| Primitive/value behaviour     | primitives immutable               | многие built-ins immutable        |
| Rebinding                     | `let` позволяет, `const` запрещает | обычный name обычно можно rebound |
| `const` equivalent            | language-level `const`             | прямого runtime аналога нет       |
| Object mutation через `const` | разрешена                          | зависит от mutability type        |
| Assignment object             | reference sharing для objects      | binding к object                  |
| Block variable                | `let`/`const` block scoped         | loop/if binding остаётся scope    |
| Destructuring                 | есть                               | unpacking есть                    |
| Swap                          | `[a,b]=[b,a]`                      | `a, b = b, a`                     |

Главное сходство:

> И JS, и Python работают с object references.

Главное отличие для mental model:

> Python гораздо последовательнее описывает всё через names, bindings и runtime objects.

---

# Common Mistakes

## 1. Думать, что `b = a` копирует object

```python
a = []
b = a
```

Создаёт два names, а не два lists.

---

## 2. Путать mutation и rebinding

```python
items.append(1)
```

mutation.

```python
items = []
```

rebinding.

Это fundamentally разные операции.

---

## 3. Думать, что immutable object делает name immutable

```python
x = "A"

x = "B"
```

полностью valid.

String immutable, name — нет.

---

## 4. Использовать chained assignment с mutable objects без понимания sharing

```python
a = b = []
```

Оба names смотрят на один list.

---

## 5. Создавать matrix через повторение одного nested list

Плохо:

```python
matrix = [[0] * 3] * 3
```

Если нужны independent rows.

Лучше:

```python
matrix = [
    [0] * 3
    for _ in range(3)
]
```

---

## 6. Считать `del name` уничтожением object

```python
del a
```

удаляет binding.

Object может продолжать жить через другие references.

---

# Practical Examples

## Example 1 — Rebinding

```python
value = 10

another = value

value = 20

print(value)
print(another)
```

Output:

```text
20
10
```

Почему?

Изначально:

```text
value   ───┐
           ├──► 10
another ───┘
```

После:

```python
value = 20
```

получаем:

```text
value   ───► 20

another ───► 10
```

Object `10` не изменялся.

---

## Example 2 — Mutation

```python
items = [1, 2]

another = items

items.append(3)

print(another)
```

Output:

```text
[1, 2, 3]
```

Потому что names делят один list object.

---

## Example 3 — Nested references

```python
user = {
    "name": "Alex",
}

users = [
    user,
    user,
]

users[0]["name"] = "Bob"

print(users[1]["name"])
```

Output:

```text
Bob
```

---

## Example 4 — Tuple containing list

```python
data = (
    [1, 2],
    "ready",
)

data[0].append(3)

print(data)
```

Output:

```python
(
    [1, 2, 3],
    "ready",
)
```

Tuple не был mutated structurally.

Изменился list object, на который tuple содержит reference.

---

## Example 5 — Repeated nested list

```python
matrix = [[0, 0]] * 3

matrix[0][0] = 1

print(matrix)
```

Output:

```python
[
    [1, 0],
    [1, 0],
    [1, 0],
]
```

Все три entries содержат reference на один inner list.

---

# Interview Questions

## 1. What is the difference between a name and an object in Python?

**Ответ:**

Object — runtime entity с определённым type и состоянием.

Name — identifier внутри namespace, который связан с object.

Например:

```python
x = [1, 2]
```

`x` — name.

`[1, 2]` — list object.

Assignment создаёт binding:

```text
x → list object
```

Несколько names могут быть связаны с одним object.

---

## 2. Does assignment copy objects in Python?

**Ответ:**

Нет, обычный assignment не копирует object.

Например:

```python
a = [1, 2]
b = a
```

`a` и `b` связаны с одним list.

Поэтому:

```python
b.append(3)
```

будет видно и через `a`.

Если нужна копия, её нужно создать явно.

---

## 3. What is the difference between mutation and rebinding?

**Ответ:**

Mutation изменяет существующий object.

Например:

```python
items.append(1)
```

Rebinding меняет object, с которым связано name:

```python
items = []
```

Это ключевое distinction для понимания mutable и immutable types.

---

## 4. Why does this modify all rows?

```python
matrix = [[0] * 3] * 3

matrix[0][0] = 1
```

**Ответ:**

Выражение:

```python
[[0] * 3] * 3
```

не создаёт три independent inner lists.

Оно создаёт один inner list и повторяет reference на него три раза.

Поэтому mutation одного row видна через остальные entries.

Для independent rows:

```python
matrix = [
    [0] * 3
    for _ in range(3)
]
```

---

## 5. What does `del x` do?

**Ответ:**

`del x` удаляет binding имени `x`.

Он не обязательно уничтожает object.

Если другой name или container всё ещё содержит reference на object, тот продолжает существовать.

Например:

```python
a = []
b = a

del a
```

Object продолжает жить через `b`.

---

# Check Yourself

## 1

```python
a = [1, 2]
b = a

b = [3, 4]

print(a)
```

**Ответ:**

```text
[1, 2]
```

`b = [3, 4]` — rebinding.

Исходный list не mutated.

---

## 2

```python
a = [1, 2]
b = a

b.append(3)

print(a)
```

**Ответ:**

```text
[1, 2, 3]
```

`append()` мутировал shared list.

---

## 3

```python
a = 10
b = a

a += 1

print(a)
print(b)
```

**Ответ:**

```text
11
10
```

Integer immutable.

`a += 1` приводит к binding `a` к новому integer result.

---

## 4

```python
a = [1]
b = a

a += [2]

print(b)
```

**Ответ:**

```text
[1, 2]
```

Для list `+=` выполняет in-place behaviour.

Shared object был mutated.

---

## 5

```python
a = b = []

a.append(10)

print(b)
```

**Ответ:**

```text
[10]
```

Оба names связаны с одним list object.

---

## 6

```python
items = (
    [],
    [],
)

items[0].append(1)

print(items)
```

**Ответ:**

```python
(
    [1],
    [],
)
```

Tuple immutable, но содержащиеся в нём lists mutable.

---

## 7

```python
value = [1, 2]

container = [value]

del value

print(container)
```

**Ответ:**

```python
[[1, 2]]
```

Удалён name `value`.

List object продолжает существовать, потому что `container` содержит reference.

---

# Главное из урока

Полезная Python-модель:

```text
namespace
   │
   ├── name ───► object
   ├── name ───► object
   └── name ───► object
```

Assignment:

```python
x = object
```

создаёт или меняет binding.

Он не означает automatic copy.

Несколько names могут смотреть на один object:

```text
a ───┐
     ├──► object
b ───┘
```

Нужно чётко различать:

```text
mutation
```

и:

```text
rebinding
```

Immutable object нельзя изменить in-place, но name можно связать с другим object.

Container хранит references на другие objects, поэтому nested mutable structures могут создавать shared state.

`del` удаляет binding, а не гарантированно уничтожает object.

И если коротко:

> Python-программа — это в значительной степени система runtime objects и bindings между именами и этими objects.
