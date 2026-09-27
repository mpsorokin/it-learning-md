# Lesson 8 — Tuples: Immutability, Packing and Structural Data

`tuple` похож на `list`, но с принципиально другим смыслом.

List обычно означает:

> набор элементов, который может меняться.

Tuple чаще означает:

> фиксированная структура или группа значений.

Например:

```python id="7ku2g8"
point = (10, 20)
```

или:

```python id="7yvjhy"
user = ("Alex", 35, "admin")
```

Главное отличие:

```text id="rhv3nk"
list  → mutable
tuple → immutable
```

Но смысл tuple не сводится только к immutability.

---

# 1. Создание tuple

Обычная форма:

```python id="rk8c5i"
point = (10, 20)
```

Можно:

```python id="1mh4w2"
values = (1, 2, 3, 4)
```

Tuple поддерживает indexing:

```python id="0rwhi8"
point[0]
# 10
```

и slicing:

```python id="tz8g7v"
values[1:3]
# (2, 3)
```

---

# 2. Tuple immutable

Нельзя:

```python id="pemgvc"
point = (10, 20)

point[0] = 100
```

Получим:

```text id="f6z7mm"
TypeError
```

Tuple нельзя изменить structurally после создания.

Нельзя:

* заменить element;
* добавить element;
* удалить element.

---

# 3. Но name можно rebound

```python id="oj6egr"
point = (10, 20)

point = (100, 200)
```

Это valid.

Мы не изменили старый tuple.

Мы связали `point` с новым object.

```text id="8y12wr"
before:

point ───► (10, 20)

after:

point ───► (100, 200)
```

---

# 4. Tuple создаёт запятая, а не скобки

Это важная Python detail.

Например:

```python id="36pd7o"
value = 1, 2, 3
```

Это tuple.

```python id="2w2ljq"
print(type(value))
```

→

```text id="8htchv"
<class 'tuple'>
```

Скобки чаще нужны для readability и grouping.

---

# 5. Tuple из одного элемента

Вот распространённая ловушка:

```python id="q5t1e9"
value = (10)
```

Это не tuple.

Это обычный `int`.

```python id="51zyiy"
print(type(value))
# <class 'int'>
```

Чтобы создать single-element tuple:

```python id="hgsxea"
value = (10,)
```

Ключевой символ:

```text id="tl392r"
,
```

---

# 6. Empty tuple

```python id="xphsg4"
empty = ()
```

или:

```python id="9lm1ra"
empty = tuple()
```

---

# 7. Tuple packing

Python автоматически умеет pack values в tuple.

Например:

```python id="dx3ad4"
user = "Alex", 35, "admin"
```

Conceptually:

```python id="4i536e"
user = (
    "Alex",
    35,
    "admin",
)
```

Это называется tuple packing.

---

# 8. Tuple unpacking

Обратная операция:

```python id="ji0yrp"
user = ("Alex", 35, "admin")

name, age, role = user
```

Теперь:

```text id="jk2h11"
name → "Alex"
age  → 35
role → "admin"
```

Важно, чтобы количество targets соответствовало количеству values.

---

# 9. Ошибка unpacking

Например:

```python id="qg5r8h"
point = (10, 20)

x, y, z = point
```

получим:

```text id="8n2r0x"
ValueError
```

Потому что значений недостаточно.

---

# 10. Extended unpacking

Можно использовать:

```python id="7ez2md"
*
```

Например:

```python id="44vwq4"
values = (1, 2, 3, 4, 5)

first, *middle, last = values
```

Получим:

```python id="wskugp"
first
# 1

middle
# [2, 3, 4]

last
# 5
```

Обрати внимание:

> starred target получает `list`, а не tuple.

---

# 11. Swap через tuple-style unpacking

```python id="h2lspo"
a = 10
b = 20

a, b = b, a
```

После:

```text id="liqhjw"
a = 20
b = 10
```

Это работает потому, что правая сторона сначала вычисляется, а потом происходит unpacking в новые bindings.

---

# 12. Functions часто возвращают несколько значений через tuple

Например:

```python id="ua1zkm"
def get_user():
    return "Alex", 35
```

На самом деле function возвращает один object:

```text id="ysv711"
tuple
```

Использование:

```python id="tz9plz"
name, age = get_user()
```

Очень распространённый Python pattern.

---

# 13. Tuple как fixed structure

Tuple часто удобен для структур, где количество и meaning элементов фиксированы.

Например:

```python id="iylzy0"
coordinates = (50.45, 30.52)
```

Здесь:

```text id="pt2aqj"
index 0 → latitude
index 1 → longitude
```

Tuple хорошо выражает:

> структура состоит ровно из этих частей.

---

# 14. List vs tuple по смыслу

Например:

```python id="c9nhlv"
users = [
    "Alex",
    "Bob",
    "John",
]
```

Это collection однотипных logical entities.

Количество может меняться.

List подходит естественно.

---

А:

```python id="0vdy5v"
rgb = (255, 128, 0)
```

Это скорее одна entity с фиксированными positions.

Tuple выглядит естественнее.

---

# 15. Но tuple не должен превращаться в unreadable structure

Например:

```python id="uegc93"
user = (
    123,
    "Alex",
    "admin",
    True,
    "Romania",
    35,
)
```

А потом:

```python id="f5qz22"
if user[3]:
    ...
```

Плохо читается.

Если structure имеет много semantic fields, лучше использовать:

* dataclass;
* class;
* named tuple;
* typed structure.

Tuple хорош для небольших и очевидных structures.

---

# 16. Tuple может содержать разные types

```python id="l2h4ki"
user = (
    42,
    "Alex",
    True,
)
```

Tuple не требует одинакового type элементов.

В этом смысле он похож на list.

---

# 17. Tuple хранит references

Tuple immutable, но хранит references на objects.

Например:

```python id="rkjl1i"
data = (
    [1, 2],
    {"active": True},
)
```

Conceptually:

```text id="pmqlb1"
tuple
├──► list
└──► dict
```

Tuple structure immutable.

Но referenced objects могут быть mutable.

---

# 18. Поэтому это работает

```python id="uh551y"
data = (
    [1, 2],
    {"active": True},
)

data[0].append(3)

data[1]["active"] = False
```

Теперь:

```python id="k7qg2q"
print(data)
```

→

```python id="ry9eum"
(
    [1, 2, 3],
    {"active": False},
)
```

Tuple не изменил references.

Изменились referenced objects.

---

# 19. Tuple и hashability

Tuple может быть hashable.

Например:

```python id="83ow8g"
point = (10, 20)

print(hash(point))
```

Это позволяет использовать tuple как dictionary key:

```python id="gi2gch"
locations = {
    (50.45, 30.52): "Kyiv",
    (44.43, 26.10): "Bucharest",
}
```

---

# 20. Но не каждый tuple hashable

Например:

```python id="jmgmzs"
value = (
    [1, 2],
    [3, 4],
)
```

Попытка:

```python id="ned3ph"
hash(value)
```

даст:

```text id="w76p4i"
TypeError
```

Почему?

Потому что inner lists unhashable.

---

# 21. Hashability tuple зависит от содержимого

Например:

```python id="8sq8hv"
hash((1, 2, 3))
```

работает.

Но:

```python id="tqi6mn"
hash((1, [2, 3]))
```

не работает.

Правило:

> tuple hashable только если его элементы тоже hashable.

---

# 22. Composite dictionary keys

Это один из самых полезных practical use cases tuple.

Например:

```python id="tvixhd"
permissions = {
    ("admin", "read"): True,
    ("admin", "write"): True,
    ("guest", "write"): False,
}
```

Lookup:

```python id="6z4qgh"
permissions[("guest", "write")]
```

→

```text id="1jg0j5"
False
```

Tuple здесь natural composite key.

---

# 23. Membership

Как и list:

```python id="uq6wbx"
values = (10, 20, 30)

20 in values
```

→

```text id="oq55ar"
True
```

Tuple не является hash table.

Поэтому membership обычно:

```text id="f014kk"
O(n)
```

---

# 24. Index lookup

```python id="d77b7i"
values[2]
```

→

```text id="w7356f"
O(1)
```

Tuple хранит indexed sequence references, поэтому random access быстрый.

---

# 25. Tuple обычно немного компактнее list

Поскольку tuple fixed-size и не должен поддерживать dynamic growth, runtime может хранить его компактнее.

Например:

```python id="6h6c3x"
import sys

a = [1, 2, 3]
b = (1, 2, 3)

print(sys.getsizeof(a))
print(sys.getsizeof(b))
```

Размеры зависят от Python version и platform, но tuple обычно требует меньше overhead.

Однако выбирать tuple только ради нескольких bytes обычно не стоит.

Главный критерий — semantics.

---

# 26. Tuple не имеет mutating API

List:

```python id="3kvb7e"
items.append(...)
items.extend(...)
items.remove(...)
items.sort(...)
```

Tuple этих operations не имеет.

Можно:

```python id="z28b1m"
a = (1, 2)
b = (3, 4)

c = a + b
```

Получим новый tuple:

```python id="x1yoy9"
(1, 2, 3, 4)
```

Исходные tuples не меняются.

---

# 27. `+` создаёт новый tuple

```python id="va5j98"
a = (1, 2)

a = a + (3,)
```

Нельзя сказать, что tuple «добавил элемент».

Создан новый object:

```text id="29gyto"
old tuple → (1, 2)

new tuple → (1, 2, 3)
```

и `a` был rebound.

---

# 28. JavaScript / TypeScript comparison

У JavaScript нет прямого runtime equivalent Python tuple.

Обычно используют Array:

```ts id="0kl945"
const point = [10, 20];
```

TypeScript позволяет описать tuple type:

```ts id="tbj1z2"
const point: [number, number] = [10, 20];
```

Но runtime это всё равно обычный JavaScript Array.

То есть:

```ts id="d4tp4p"
point.push(30);
```

runtime Array умеет мутироваться.

TypeScript checker может ограничить часть неправильных операций, но JavaScript runtime не получает отдельный immutable tuple object.

---

# 29. Python tuple — настоящий runtime type

Python:

```python id="2fsur8"
point = (10, 20)

print(type(point))
```

→

```text id="zmhjof"
<class 'tuple'>
```

Это отдельная runtime data structure.

Не просто typing construct.

---

# 30. TypeScript tuple vs Python tuple

TypeScript:

```ts id="hhg9wy"
type UserRecord = [
    number,
    string,
    boolean
];
```

Главная ценность — static structure.

Python tuple:

```python id="e52w53"
user = (
    1,
    "Alex",
    True,
)
```

имеет runtime immutability и может быть hashable.

То есть similarity есть на уровне:

```text id="fndx84"
fixed positional structure
```

но runtime semantics разные.

---

# Common Mistakes

## 1. Забывать comma в single-element tuple

Неправильно:

```python id="y1oibm"
value = (10)
```

Это `int`.

Правильно:

```python id="1zzmx4"
value = (10,)
```

---

## 2. Считать tuple deeply immutable

```python id="b0yhr4"
value = ([],)
```

Tuple immutable.

List внутри — нет.

---

## 3. Использовать длинные tuple records

```python id="s9fwl4"
user[5]
```

быстро становится непонятным.

Для сложной domain structure лучше class/dataclass.

---

## 4. Считать каждый tuple hashable

Tuple с mutable/unhashable element тоже unhashable.

---

## 5. Использовать list там, где structure логически fixed

Например:

```python id="xrvca8"
coordinate = [10, 20]
```

может работать.

Но:

```python id="p5hslo"
coordinate = (10, 20)
```

лучше выражает fixed value structure.

---

# Practical Examples

## Coordinates

```python id="163cdn"
location = (
    44.4268,
    26.1025,
)

latitude, longitude = location
```

---

## Function result

```python id="6spkpy"
def min_max(values):
    return min(values), max(values)


minimum, maximum = min_max(
    [10, 3, 25, 8]
)
```

---

## Composite dictionary key

```python id="ioyfzh"
cache = {}

key = (
    "user",
    42,
)

cache[key] = "result"
```

---

# Interview Questions

## 1. What is the main difference between a list and a tuple?

**Ответ:**

`list` mutable, `tuple` immutable.

Но semantic difference тоже важна:

* list обычно представляет изменяемую collection;
* tuple часто представляет fixed positional structure.

---

## 2. What creates a tuple: parentheses or commas?

**Ответ:**

Главным syntactic element является comma.

Например:

```python id="1cm4xo"
value = 1, 2
```

создаёт tuple.

Single-element tuple требует trailing comma:

```python id="fvlhm5"
value = (1,)
```

---

## 3. Can a tuple contain mutable objects?

**Ответ:**

Да.

Например:

```python id="v3visj"
value = ([1, 2],)
```

Tuple нельзя structurally изменить, но inner list можно мутировать.

---

## 4. When is a tuple hashable?

**Ответ:**

Когда все его elements hashable.

Например:

```python id="hfwtlx"
(1, "a", None)
```

может быть hashable.

Но:

```python id="gqxwsf"
(1, [])
```

не будет hashable.

---

## 5. Why are tuples useful as dictionary keys?

**Ответ:**

Hashable tuple может объединить несколько values в один composite key.

Например:

```python id="vek69l"
(user_id, permission)
```

Это удобно для caches, coordinates, lookup tables и других compound identifiers.

---

# Check Yourself

## 1

```python id="tzrygx"
value = (10)

print(type(value))
```

**Ответ:**

```text id="3zqabg"
<class 'int'>
```

---

## 2

```python id="njtw9e"
value = (10,)

print(type(value))
```

**Ответ:**

```text id="z7hmir"
<class 'tuple'>
```

---

## 3

```python id="59j28l"
a, b = (10, 20)

print(a)
print(b)
```

**Ответ:**

```text id="2jt91a"
10
20
```

---

## 4

```python id="trt7kb"
value = (
    [1, 2],
    10,
)

value[0].append(3)

print(value)
```

**Ответ:**

```python id="j387s2"
([1, 2, 3], 10)
```

Inner list mutable.

---

## 5

```python id="vkd2u9"
values = (1, 2, 3, 4)

first, *middle, last = values

print(middle)
```

**Ответ:**

```python id="iclr8i"
[2, 3]
```

Starred unpacking target получает list.

---

# Главное из урока

Tuple:

```text id="sjvdet"
ordered
indexed
immutable
can be heterogeneous
can be hashable
```

Наиболее полезно воспринимать его как:

> **fixed positional structure**, а не просто immutable list.

Основные patterns:

```python id="3tqyjn"
point = (10, 20)

x, y = point

return result, error

cache[(user_id, action)] = value
```

И главное отличие от TypeScript:

> Python tuple — отдельный immutable runtime object, а TypeScript tuple в runtime остаётся обычным JavaScript Array.

## Interview questions

### Чем tuple полезен помимо хранения нескольких значений?

Tuple подходит для фиксированной позиционной структуры: например, пары координат или набора значений, возвращаемых функцией. Его элементы можно распаковать по позициям, а сам tuple нельзя менять после создания.

### Всегда ли tuple можно использовать как dictionary key?

Нет. Tuple hashable только если hashable все его элементы. Tuple, содержащий list, например, нельзя использовать как key или элемент set.
