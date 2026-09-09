# Lesson 3 — Identity and Equality: `is`, `==` and `id()`

После прошлого урока у нас есть базовая модель:

```text
name ───► object
```

Несколько names могут быть связаны с одним object:

```text
a ───┐
     ├──► [1, 2]
b ───┘
```

Теперь возникает два разных вопроса:

1. **Это один и тот же object?**
2. **Эти objects считаются равными по значению?**

В Python это две разные операции:

```python
is
==
```

---

# 1. Equality: `==`

Оператор:

```python
a == b
```

проверяет **value equality**.

То есть:

> считает ли object `a` себя равным object `b`.

Например:

```python
a = [1, 2]
b = [1, 2]

print(a == b)
```

Результат:

```text
True
```

Хотя lists создавались независимо.

Conceptually:

```text
a ───► [1, 2]

b ───► [1, 2]
```

Objects разные, но их contents равны.

---

# 2. Identity: `is`

Оператор:

```python
a is b
```

проверяет:

> являются ли `a` и `b` references на один и тот же object.

Для предыдущего примера:

```python
a = [1, 2]
b = [1, 2]

print(a is b)
```

получим:

```text
False
```

Потому что objects разные.

---

# 3. Один object через два имени

```python
a = [1, 2]
b = a
```

Теперь:

```python
print(a == b)
print(a is b)
```

Получим:

```text
True
True
```

Потому что:

```text
a ───┐
     ├──► same list object
b ───┘
```

`==` возвращает `True`, потому что value одинаковое.

`is` возвращает `True`, потому что object буквально один.

---

# 4. Главное различие

Запомнить можно так:

```text
==    same value?

is    same object?
```

Например:

```python
a = {"id": 10}
b = {"id": 10}
```

```python
a == b
# True
```

```python
a is b
# False
```

---

# 5. Что делает `id()`

Python имеет функцию:

```python
id(obj)
```

Она возвращает identity объекта в виде integer.

Например:

```python
a = []
b = a

print(id(a))
print(id(b))
```

Значения будут одинаковыми.

Потому что object один.

---

Для:

```python
a = []
b = []
```

обычно:

```python
id(a) != id(b)
```

потому что существуют два разных list objects.

---

# 6. `id()` и memory address

В CPython `id()` часто соответствует memory address объекта.

Но важно:

> это implementation detail CPython, а не универсальный semantic contract Python.

Правильный mental model:

```text
id(object)
→ unique identity during object's lifetime
```

Не стоит писать application logic, зависящий от конкретного numeric value `id()`.

---

# 7. Как работает `==`

Для многих objects `==` в итоге использует special method:

```python
__eq__()
```

Например:

```python
a == b
```

conceptually связано с:

```python
a.__eq__(b)
```

Хотя реальный operator dispatch имеет дополнительные нюансы.

---

# 8. Custom equality

Например:

```python
class User:
    def __init__(self, user_id):
        self.user_id = user_id
```

Создадим:

```python
a = User(10)
b = User(10)
```

По умолчанию:

```python
a == b
```

обычно будет:

```text
False
```

Потому что это два разных instances, и custom value equality мы не определили.

---

Можно определить:

```python
class User:
    def __init__(self, user_id):
        self.user_id = user_id

    def __eq__(self, other):
        if not isinstance(other, User):
            return NotImplemented

        return self.user_id == other.user_id
```

Теперь:

```python
a = User(10)
b = User(10)

print(a == b)
```

получим:

```text
True
```

При этом:

```python
a is b
```

по-прежнему:

```text
False
```

Objects разные.

---

# 9. Почему `is` нельзя переопределить

`==` означает semantic equality и может быть определён самим type.

Но:

```python
is
```

проверяет object identity на уровне runtime.

Нельзя написать custom method и заставить:

```python
a is b
```

возвращать `True` для двух разных объектов.

Это фундаментальное различие.

---

# 10. Самый важный use case `is`: `None`

Python convention:

```python
if value is None:
    ...
```

а не:

```python
if value == None:
    ...
```

Почему?

`None` — singleton.

В нормальной Python program существует один специальный `None` object.

Поэтому нас интересует именно:

```text
is this object None?
```

а не custom equality semantics.

---

# 11. Почему `== None` хуже

Представим custom class:

```python
class Strange:
    def __eq__(self, other):
        return True
```

Теперь:

```python
value = Strange()

print(value == None)
```

может вернуть:

```text
True
```

Потому что `==` вызывает custom equality logic.

Но:

```python
value is None
```

вернёт:

```text
False
```

И это именно то, что нам нужно.

---

# 12. Singleton values

`None` — наиболее важный singleton для повседневного Python.

Поэтому:

```python
value is None
value is not None
```

является стандартным style.

Также identity иногда применяют к другим sentinel objects.

Например:

```python
MISSING = object()
```

Теперь:

```python
def process(value=MISSING):
    if value is MISSING:
        ...
```

Здесь identity подходит идеально.

---

# 13. Зачем sentinel object

Допустим функция принимает `None` как valid value:

```python
def update_description(description=None):
    ...
```

Как отличить:

```text
argument not supplied
```

от:

```text
argument explicitly supplied as None
```

Можно создать sentinel:

```python
MISSING = object()


def update_description(description=MISSING):
    if description is MISSING:
        print("Not supplied")
    elif description is None:
        print("Explicitly cleared")
```

Теперь:

```python
update_description()
```

и:

```python
update_description(None)
```

имеют разные semantics.

---

# 14. Почему нельзя использовать `is` для numbers

Можно случайно увидеть:

```python
a = 10
b = 10

print(a is b)
```

и получить:

```text
True
```

После этого легко решить:

> значит для ints `is` работает как `==`.

Нет.

CPython может reuse некоторые immutable objects, особенно небольшие integers.

Это optimization.

---

# 15. Integer caching

Например CPython часто кэширует определённый диапазон small integers.

Поэтому:

```python
a = 10
b = 10
```

может дать:

```python
a is b
# True
```

Но это не означает:

```text
equal integers
→ same object
```

Такой semantic guarantee отсутствует.

---

# 16. То же со strings

Python может делать string interning.

Например:

```python
a = "hello"
b = "hello"

print(a is b)
```

иногда может вернуть:

```text
True
```

Потому что runtime решил reuse string object.

Но нельзя использовать:

```python
is
```

для сравнения текстового значения.

Правильно:

```python
a == b
```

---

# 17. Почему implementation details опасны

Такой код:

```python
if status is 200:
    ...
```

неправильный.

Нужно:

```python
if status == 200:
    ...
```

То же самое:

```python
if role is "admin":
```

неправильно.

Нужно:

```python
if role == "admin":
```

---

# 18. `is not`

Для отрицательной identity check существует:

```python
is not
```

Например:

```python
if user is not None:
    process(user)
```

Это предпочтительнее конструкции:

```python
if not user is None:
```

хотя она syntactically возможна.

---

# 19. Equality не обязательно возвращает только очевидное сравнение fields

Type сам определяет semantics equality.

Например:

```python
1 == True
```

вернёт:

```text
True
```

Потому что `bool` связан с integer hierarchy.

---

Другой пример:

```python
1 == 1.0
```

вернёт:

```text
True
```

Хотя:

```python
type(1)
```

и:

```python
type(1.0)
```

разные.

Equality не означает:

```text
same type
```

---

# 20. Equal objects могут иметь разные types

```python
a = 1
b = 1.0

print(a == b)
```

→

```text
True
```

Но:

```python
type(a) is type(b)
```

→

```text
False
```

Поэтому нужно различать:

```text
same value
same type
same object
```

Это три разных вопроса.

---

# 21. Три разных проверки

```python
a == b
```

проверяет equality.

```python
a is b
```

проверяет identity.

```python
type(a) is type(b)
```

проверяет, имеют ли objects буквально один type object.

Но чаще для type relationships используется:

```python
isinstance()
```

а не прямое сравнение `type`.

---

# 22. Equality и mutable objects

Если два независимых lists:

```python
a = [1, 2]
b = [1, 2]
```

то:

```python
a == b
# True
```

После:

```python
b.append(3)
```

получим:

```python
a == b
# False
```

Identity при этом всё время:

```python
a is b
# False
```

не менялась.

---

# 23. Identity стабильна в течение lifetime объекта

Например:

```python
user = {"name": "Alex"}

before = id(user)

user["name"] = "Bob"

after = id(user)
```

Для того же dictionary:

```python
before == after
```

будет `True`.

Мы изменили state object, но не создали новый dictionary.

---

# 24. Rebinding меняет object identity

```python
user = {"name": "Alex"}

before = id(user)

user = {"name": "Bob"}

after = id(user)
```

Теперь `user` связан с другим object.

Поэтому identity обычно изменится.

---

# 25. Сравнение с JavaScript

В JavaScript есть похожее distinction, но operators работают немного иначе.

Для objects:

```js
const a = { id: 1 };
const b = { id: 1 };

console.log(a === b);
```

Результат:

```text
false
```

JS object equality через `===` фактически проверяет reference identity.

---

Python:

```python
a = {"id": 1}
b = {"id": 1}

print(a == b)
```

получим:

```text
True
```

Потому что Python `dict` определяет value equality по contents.

Это важное отличие.

---

# 26. JS object comparison vs Python object comparison

JavaScript:

```js
[] === []
```

→

```text
false
```

Python:

```python
[] == []
```

→

```text
True
```

Но:

```python
[] is []
```

→

```text
False
```

То есть Python разделяет:

```text
value equality → ==
identity       → is
```

очень явно.

---

# 27. Custom classes тоже могут менять equality semantics

JavaScript object identity обычно остаётся reference-based.

Python custom class может определить:

```python
__eq__
```

и сказать:

> два разных instances считаются semantically equal, если их IDs совпадают.

Например:

```python
class Money:
    def __init__(self, amount, currency):
        self.amount = amount
        self.currency = currency

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented

        return (
            self.amount == other.amount
            and self.currency == other.currency
        )
```

Теперь:

```python
a = Money(100, "EUR")
b = Money(100, "EUR")

print(a == b)
```

→ `True`

Но:

```python
a is b
```

→ `False`

---

# 28. Почему `NotImplemented`, а не `False`

В custom `__eq__` полезно возвращать:

```python
NotImplemented
```

если operation между этими types не поддерживается.

Например:

```python
def __eq__(self, other):
    if not isinstance(other, Money):
        return NotImplemented
```

Это позволяет Python попробовать reflected/complementary comparison logic другого operand.

`NotImplemented` здесь — специальный singleton object.

Это не то же самое, что:

```python
raise NotImplementedError
```

---

# 29. `NotImplemented` vs `NotImplementedError`

Это часто путают.

```python
NotImplemented
```

— специальное значение, используемое binary operation protocols.

А:

```python
NotImplementedError
```

— exception.

Например:

```python
class Base:
    def process(self):
        raise NotImplementedError
```

Это совершенно другая вещь.

---

# 30. Equality и hashing связаны

Позже подробно разберём hashability, но уже сейчас важно знать правило:

Если objects считаются равными:

```python
a == b
```

и оба hashable, то ожидается:

```python
hash(a) == hash(b)
```

Иначе `dict` и `set` будут работать некорректно.

Поэтому custom `__eq__` имеет последствия не только для `==`.

---

# Common Mistakes

## 1. Использовать `is` вместо `==`

Плохо:

```python
if status is 200:
    ...
```

Правильно:

```python
if status == 200:
    ...
```

---

## 2. Сравнивать strings через `is`

Плохо:

```python
if role is "admin":
    ...
```

Правильно:

```python
if role == "admin":
    ...
```

---

## 3. Сравнивать `None` через `==`

Работать часто будет, но convention и semantic intention лучше выражает:

```python
value is None
```

---

## 4. Считать одинаковый `id()` semantic equality

Identity ничего не говорит о равенстве содержимого.

---

## 5. Делать выводы по integer/string interning

Если:

```python
a is b
```

случайно вернул `True` для двух literals, это не причина использовать identity comparison для values.

---

# Practical Examples

## Example 1

```python
a = [1, 2]
b = [1, 2]
c = a

print(a == b)
print(a is b)
print(a is c)
```

Output:

```text
True
False
True
```

---

## Example 2

```python
value = None

print(value == None)
print(value is None)
```

Оба обычно дадут `True`.

Но второй вариант является правильным semantic/style choice.

---

## Example 3

```python
a = {"id": 10}
b = {"id": 10}

print(a == b)
print(a is b)
```

Output:

```text
True
False
```

---

## Example 4

```python
MISSING = object()

value = MISSING

print(value is MISSING)
```

Output:

```text
True
```

Sentinel identity позволяет надёжно проверить специальное состояние.

---

# Interview Questions

## 1. What is the difference between `==` and `is`?

**Ответ:**

`==` проверяет semantic/value equality и может использовать `__eq__`.

`is` проверяет object identity — являются ли оба operands одним object.

Например:

```python
a = [1]
b = [1]

a == b
# True

a is b
# False
```

---

## 2. Why should `None` be compared using `is`?

**Ответ:**

`None` — singleton.

Нас интересует именно identity со специальным `None` object.

Кроме того, `==` может быть переопределён custom `__eq__`, поэтому theoretical object способен необычно сравниваться с `None`.

Стандартный style:

```python
value is None
value is not None
```

---

## 3. Can `==` return `True` for two different objects?

**Ответ:**

Да.

Например:

```python
a = [1, 2]
b = [1, 2]
```

Objects разные:

```python
a is b
# False
```

но lists имеют одинаковое содержимое:

```python
a == b
# True
```

---

## 4. Why shouldn't `is` be used to compare integers or strings?

**Ответ:**

Runtime может reuse некоторые immutable objects через caching/interning.

Поэтому identity иногда случайно совпадёт.

Но это implementation optimization, а не semantic guarantee.

Для values нужен:

```python
==
```

---

## 5. What is `NotImplemented` in `__eq__`?

**Ответ:**

Это специальный singleton, которым operation method сообщает Python:

> Я не умею сравнивать себя с этим type.

Например:

```python
def __eq__(self, other):
    if not isinstance(other, Money):
        return NotImplemented
```

Это не exception и не то же самое, что `NotImplementedError`.

---

# Check Yourself

## 1

```python
a = [1, 2]
b = [1, 2]

print(a == b)
print(a is b)
```

**Ответ:**

```text
True
False
```

---

## 2

```python
a = []
b = a

print(a == b)
print(a is b)
```

**Ответ:**

```text
True
True
```

---

## 3

```python
a = 1
b = 1.0

print(a == b)
print(type(a) is type(b))
```

**Ответ:**

```text
True
False
```

Equality не требует identical type.

---

## 4

```python
MISSING = object()

value = None

print(value is MISSING)
print(value is None)
```

**Ответ:**

```text
False
True
```

---

## 5

```python
class User:
    def __init__(self, user_id):
        self.user_id = user_id

    def __eq__(self, other):
        if not isinstance(other, User):
            return NotImplemented

        return self.user_id == other.user_id


a = User(10)
b = User(10)

print(a == b)
print(a is b)
```

**Ответ:**

```text
True
False
```

`__eq__` определяет semantic equality, но objects остаются независимыми.

---

# Главное из урока

Разделяй три вопроса:

```text
a == b
→ одинаковое ли значение?

a is b
→ один ли это object?

type(a) is type(b)
→ один ли у них type object?
```

Для обычного value comparison почти всегда нужен:

```python
==
```

Для identity:

```python
is
```

Главный повседневный use case `is`:

```python
value is None
```

И не нужно делать выводы из того, что CPython иногда reuse integers или strings — caching и interning являются runtime optimizations, а не заменой normal equality semantics.
