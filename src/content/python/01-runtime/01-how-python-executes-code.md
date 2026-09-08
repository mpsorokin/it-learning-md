# Lesson 1 — How Python Executes Code: CPython, AST, Bytecode and Runtime

Python после JavaScript / TypeScript поначалу выглядит очень знакомо:

```python
name = "Alex"

if name:
    print(name)
```

Нет `const`, `let`, `{}`, `;`, типов возле каждой переменной — и кажется, что разница в основном синтаксическая.

На деле это не так.

Чтобы нормально читать Python-код и позже понимать Django, FastAPI, SQLAlchemy, decorators, descriptors и `asyncio`, сначала нужно разобраться с базовой runtime-моделью языка.

В этом уроке:

* Python vs CPython;
* как Python-код превращается в исполняемую программу;
* AST;
* bytecode;
* compiled vs interpreted;
* runtime objects;
* dynamic typing;
* strong typing;
* type hints;
* несколько важных отличий от JavaScript / TypeScript.

---

# 1. Python и CPython — разные вещи

**Python** — язык.

**CPython** — наиболее распространённая реализация Python.

Можно провести аналогию:

```text
JavaScript
├── V8
├── SpiderMonkey
└── JavaScriptCore

Python
├── CPython
├── PyPy
├── MicroPython
└── другие реализации
```

Когда ты устанавливаешь обычный Python и запускаешь:

```bash
python app.py
```

в большинстве случаев используется именно CPython.

CPython называется так потому, что значительная часть runtime реализована на C.

Упрощённо:

```text
Python code
    ↓
CPython
    ↓
C implementation
    ↓
OS / CPU
```

Это станет особенно важно позже, когда мы будем разбирать:

* GIL;
* reference counting;
* garbage collector;
* C extensions;
* почему NumPy может быть намного быстрее обычного Python-кода.

---

# 2. Что происходит при запуске `.py`

Рассмотрим:

```python
def calculate_total(price, quantity):
    return price * quantity


total = calculate_total(15, 3)

print(total)
```

Неполезный mental model:

```text
Python читает строку
↓
выполняет
↓
читает следующую
↓
выполняет
```

Реальная схема CPython ближе к:

```text
Python source
     ↓
parsing
     ↓
AST
     ↓
compilation
     ↓
bytecode
     ↓
CPython interpreter
     ↓
execution
```

То есть Python-код сначала анализируется и компилируется во внутреннее представление.

---

# 3. Parsing

Возьмём строку:

```python
result = price * quantity
```

Для нас здесь очевидно:

* `result` — имя;
* `=` — assignment;
* `price * quantity` — expression;
* `*` — multiplication.

Interpreter должен сначала превратить текст в структурированное representation программы.

Концептуально:

```text
Assignment
├── target
│   └── result
└── value
    └── Binary operation
        ├── left: price
        ├── operator: *
        └── right: quantity
```

Эта структура называется AST.

---

# 4. AST — Abstract Syntax Tree

AST — дерево синтаксической структуры программы.

Например:

```python
result = 10 + 20
```

можно представить как:

```text
Module
└── Assign
    ├── Name(result)
    └── BinOp
        ├── Constant(10)
        ├── Add
        └── Constant(20)
```

Python позволяет посмотреть AST самостоятельно:

```python
import ast

source = """
result = 10 + 20
"""

tree = ast.parse(source)

print(
    ast.dump(
        tree,
        indent=4,
    )
)
```

Получится структура примерно такого вида:

```text
Module(
    body=[
        Assign(
            targets=[
                Name(id='result')
            ],
            value=BinOp(
                left=Constant(value=10),
                op=Add(),
                right=Constant(value=20)
            )
        )
    ]
)
```

Точный output зависит от версии Python, но идея одна:

```text
source code
↓
structured syntax tree
```

---

# 5. Где AST используется

AST нужен не только interpreter.

Его используют:

* linters;
* formatters;
* static analyzers;
* IDE;
* code transformation tools;
* security analyzers;
* refactoring tools.

Например, анализатор может искать:

```python
eval(user_input)
```

не обычным поиском строки `"eval("`, а именно как function call в syntax tree.

---

# 6. Сравнение с JavaScript / TypeScript

Здесь различия небольшие.

JavaScript тоже проходит parsing.

Например:

```ts
const result = price * quantity;
```

превращается в AST.

С этим работают:

```text
TypeScript Compiler
Babel
ESLint
SWC
OXC
```

То есть концепция:

```text
source
↓
AST
```

общая для обеих экосистем.

---

# 7. Python компилируется в bytecode

После AST CPython компилирует код во внутренний bytecode.

Например:

```python
def add(a, b):
    return a + b
```

превращается во внутренние инструкции виртуальной машины Python.

Концептуально:

```text
load a
load b
perform addition
return result
```

Это уже не Python source, но ещё и не native machine code.

---

# 8. Посмотреть bytecode

Для этого существует стандартный module `dis`.

```python
import dis


def add(a, b):
    return a + b


dis.dis(add)
```

Ты увидишь инструкции Python VM.

Конкретные opcodes могут меняться между версиями CPython, поэтому запоминать их не нужно.

Важно увидеть сам pipeline:

```text
Python function
↓
code object
↓
bytecode instructions
```

---

# 9. Python — compiled или interpreted?

Это частый вопрос на интервью.

Простой ответ:

> Python interpreted.

не совсем неверен, но слишком примитивен.

Точнее:

> В CPython исходный Python-код сначала компилируется в Python bytecode, после чего этот bytecode исполняется интерпретатором CPython.

То есть:

```text
.py
 ↓
compile
 ↓
bytecode
 ↓
interpret
```

Поэтому Python можно считать и compiled, и interpreted на разных стадиях execution pipeline.

---

# 10. Bytecode — не machine code

Не нужно путать:

```text
Python bytecode
```

и:

```text
x86 / ARM machine code
```

Bytecode выполняется Python virtual machine.

Упрощённо:

```text
Python bytecode
      ↓
CPython interpreter
      ↓
native instructions
      ↓
CPU
```

---

# 11. Что такое `.pyc`

Ты можешь увидеть:

```text
__pycache__/
```

и внутри что-то вроде:

```text
module.cpython-313.pyc
```

`.pyc` содержит cached bytecode Python module.

Идея простая:

```text
module.py
   ↓
compile
   ↓
bytecode
   ↓
cache
```

Python не обязан каждый раз выполнять одни и те же compilation steps заново, если cached bytecode можно безопасно использовать.

Но `.pyc` — это всё ещё не standalone native executable.

Для исполнения нужен совместимый Python runtime.

---

# 12. Сравнение с V8

После Node.js здесь полезно заметить важную разницу.

Современный V8 использует сложную JIT-oriented pipeline.

Очень упрощённо:

```text
JavaScript
   ↓
AST
   ↓
bytecode
   ↓
interpreter
   ↓
profiling
   ↓
JIT optimization
   ↓
optimized machine code
```

Если функция часто выполняется с похожими данными, V8 может сильно её оптимизировать.

CPython традиционно работает гораздо ближе к interpreter model.

Поэтому:

```python
total = 0

for value in values:
    total += value
```

имеет заметный interpreter overhead на каждой iteration.

---

# 13. Почему Python тогда используется в AI и data

Потому что тяжёлые вычисления часто выполняет не сам Python interpreter.

Например:

```python
result = numpy.dot(a, b)
```

можно представить так:

```text
Python
↓
NumPy API
↓
C / native numerical code
↓
CPU
```

С PyTorch:

```text
Python
↓
PyTorch
↓
C++
↓
CUDA
↓
GPU
```

Python здесь выступает как orchestration layer.

Он говорит:

> возьми эти данные, вызови эту библиотеку, передай результат дальше.

Именно поэтому Python может быть относительно медленным как pure interpreter language, но при этом отлично работать как interface к очень быстрым native libraries.

---

# 14. Python очень runtime-oriented

Теперь важная часть mental model.

В Python функции, классы и modules существуют как runtime objects.

Это не просто declarations, которые исчезают после compilation.

---

# 15. Functions are objects

Например:

```python
def calculate():
    return 42
```

После выполнения `def` создаётся function object.

Имя:

```python
calculate
```

связано с этим объектом.

Можно написать:

```python
another_name = calculate

print(another_name())
```

Результат:

```text
42
```

Концептуально:

```text
calculate ───┐
             ├──► function object
another_name ┘
```

---

# 16. Функции можно передавать

```python
def add(a, b):
    return a + b


def execute(operation, a, b):
    return operation(a, b)


result = execute(add, 10, 5)
```

Получим:

```text
15
```

Function — обычный объект, который можно:

* присвоить имени;
* положить в `list`;
* положить в `dict`;
* передать в другую функцию;
* вернуть из функции.

Это станет фундаментом для:

* decorators;
* callbacks;
* higher-order functions.

---

# 17. Classes тоже объекты

Например:

```python
class User:
    pass
```

`User` — runtime object.

Можно:

```python
print(User)
print(type(User))
```

Типичный результат:

```text
<class '__main__.User'>
<class 'type'>
```

То есть:

```text
user
 ↓ instance of
User
 ↓ instance of
type
```

Эта модель позже приведёт нас к metaclasses.

---

# 18. Body класса реально выполняется

Например:

```python
class User:
    print("Creating User class")

    role = "user"
```

При загрузке этого кода ты увидишь:

```text
Creating User class
```

То есть `class` — не просто compile-time declaration.

Body класса выполняется, а результатом становится class object.

---

# 19. Сравнение с TypeScript

TypeScript:

```ts
interface User {
    id: number;
    name: string;
}
```

После transpilation interface исчезает.

Это compile-time construct.

Python:

```python
class User:
    pass
```

создаёт настоящий runtime object.

Можно сделать:

```python
classes = [User]

factory = User

user = factory()
```

Это важное отличие.

---

# 20. Modules тоже объекты

Например:

```python
import math
```

После import имя `math` связано с module object.

Можно:

```python
print(type(math))
```

или:

```python
def show_name(module):
    print(module.__name__)


show_name(math)
```

---

# 21. Import выполняет код

Допустим:

```python
# settings.py

print("Loading settings")

DEBUG = True
```

В другом файле:

```python
import settings
```

При первом import Python выполнит top-level code module.

То есть появится:

```text
Loading settings
```

Очень грубый mental model:

```text
import module
↓
найти module
↓
загрузить
↓
выполнить top-level code
↓
создать module object
↓
bind name
```

Позже отдельно разберём caching и `sys.modules`.

---

# 22. Everything is an object

Фраза звучит абстрактно, но буквально означает, что объектами являются:

```python
42
```

```python
"hello"
```

```python
[1, 2, 3]
```

```python
def foo():
    pass
```

```python
class User:
    pass
```

и imported modules.

Их можно хранить в структурах:

```python
items = [
    42,
    "hello",
    User,
    foo,
]
```

Python list просто хранит references на объекты.

---

# 23. Names, а не typed variables

Напишем:

```python
value = 10
```

После TypeScript хочется думать:

```text
создали variable value типа int
```

Для Python полезнее такой mental model:

```text
value
  │
  ▼
int object 10
```

Имя `value` связано с объектом.

---

# 24. Rebinding

Теперь:

```python
value = 10
value = "hello"
```

Сначала:

```text
value ───► 10
```

Потом:

```text
value ───► "hello"
```

Имя стало связано с другим объектом.

Это называется rebinding.

---

# 25. Тип принадлежит объекту

```python
type(10)
```

→ `int`

```python
type("hello")
```

→ `str`

```python
type([])
```

→ `list`

Тип есть у runtime object.

Имя не обязано быть навсегда связано с одним типом.

---

# 26. Dynamic typing

Python dynamically typed.

Например:

```python
def double(value):
    return value * 2
```

Можно:

```python
double(10)
```

→

```text
20
```

Можно:

```python
double("Hi")
```

→

```text
HiHi
```

Можно:

```python
double([1, 2])
```

→

```python
[1, 2, 1, 2]
```

Потому что operation semantics определяются runtime type объекта.

---

# 27. Dynamic typing не означает отсутствие типов

Это важное различие.

Python не является:

```text
untyped language
```

У объектов есть строгий runtime type.

Например:

```python
value = 10

print(type(value))
```

вернёт:

```text
<class 'int'>
```

Dynamic typing означает, что:

* name bindings не фиксируются compile-time;
* многие type decisions происходят runtime.

---

# 28. Python type hints

Python позволяет:

```python
def double(value: int) -> int:
    return value * 2
```

Но это не превращает Python в TypeScript.

Можно вызвать:

```python
double("Hi")
```

и CPython сам по себе обычно не остановит выполнение.

Результат:

```text
HiHi
```

---

# 29. Type hints не являются runtime validation

Annotation:

```python
value: int
```

не означает:

```text
runtime автоматически проверит isinstance(value, int)
```

Type hints в основном используют:

* Pyright;
* mypy;
* IDE;
* documentation;
* linters;
* frameworks;
* runtime introspection.

---

# 30. Сравнение с TypeScript

TypeScript:

```ts
function double(value: number): number {
    return value * 2;
}

double("Hi");
```

Compiler выдаст ошибку.

Python:

```python
def double(value: int) -> int:
    return value * 2


double("Hi")
```

может отработать runtime.

Это фундаментальное отличие.

---

# 31. Strong typing

Python dynamic, но обычно его относят к strongly typed languages.

Например:

```python
"10" + 5
```

даёт:

```text
TypeError
```

Python не пытается автоматически превратить число в строку.

Нужно явно:

```python
"10" + str(5)
```

или:

```python
int("10") + 5
```

---

# 32. Сравнение с JavaScript coercion

JavaScript:

```js
"10" + 5
```

→

```text
"105"
```

Python:

```python
"10" + 5
```

→ `TypeError`

---

JavaScript:

```js
1 == "1"
```

может вернуть:

```text
true
```

Python:

```python
1 == "1"
```

вернёт:

```text
False
```

Python гораздо реже пытается автоматически угадывать желаемую type conversion.

---

# 33. Но Python тоже имеет необычные type relationships

Например:

```python
True == 1
```

→

```text
True
```

И:

```python
isinstance(True, int)
```

→

```text
True
```

Потому что:

```text
bool
↓
subclass of
int
```

Поэтому:

```python
True + True
```

даёт:

```text
2
```

Это хороший пример того, что Python не лишён собственных странностей.

---

# 34. Statements и expressions

Expression производит значение.

Например:

```python
10 + 20
```

```python
user.name
```

```python
calculate()
```

```python
a if condition else b
```

---

Statement управляет структурой программы или создаёт bindings.

Например:

```python
if condition:
    ...
```

```python
for item in items:
    ...
```

```python
def foo():
    ...
```

```python
class User:
    ...
```

---

# 35. Assignment отличается от JavaScript

JavaScript:

```js
let x;

console.log(x = 10);
```

Assignment можно использовать как expression.

Python:

```python
x = 10
```

обычный assignment expression таким образом не используется.

Например:

```python
if x = 10:
    ...
```

нельзя.

---

# 36. Walrus operator

Python имеет специальный assignment expression:

```python
:=
```

Например:

```python
if match := pattern.search(text):
    print(match.group())
```

Здесь:

1. вызывается `pattern.search(text)`;
2. результат связывается с `match`;
3. этот же результат проверяется как condition.

Оператор называют walrus operator.

Использовать его стоит только тогда, когда он реально упрощает код.

---

# 37. Indentation — часть syntax

JavaScript:

```js
if (user.active) {
    process(user);
}
```

Block задают `{}`.

Python:

```python
if user.active:
    process(user)
```

Block задаёт indentation.

Это не formatter convention.

Это grammar.

Например:

```python
if user.active:
process(user)
```

не просто плохо отформатировано.

Это invalid syntax.

---

# 38. Стандартный indentation

Типичный стиль:

```text
4 spaces
```

Например:

```python
def process_user(user):
    if user.active:
        save(user)
        audit(user)

    notify(user)
```

Структура:

```text
function
├── if
│   ├── save
│   └── audit
└── notify
```

---

# 39. `if` и `for` не создают block scope

Вот здесь важное отличие от JavaScript.

JavaScript:

```js
if (true) {
    const name = "Alex";
}

console.log(name);
```

`name` недоступно вне блока.

Python:

```python
if True:
    name = "Alex"

print(name)
```

выведет:

```text
Alex
```

---

# 40. Loop variable тоже остаётся

```python
for number in range(3):
    pass

print(number)
```

Результат:

```text
2
```

`for` не создаёт отдельный local scope.

---

# 41. Основные Python scope boundaries

Упрощённо:

```text
module
function
class
```

`if`, `for`, `while`, `with` не создают обычный новый local scope.

Позже scope разберём отдельно через LEGB.

---

# 42. `def` создаёт функцию, но не выполняет body

Например:

```python
print("A")


def foo():
    print("B")


print("C")
```

Результат:

```text
A
C
```

`B` не появляется.

Почему?

Потому что `def` создал function object, но body функции пока не выполнялся.

---

# 43. Definition time vs execution time

Например:

```python
def calculate():
    return TAX_RATE * 100


TAX_RATE = 0.2

print(calculate())
```

работает:

```text
20.0
```

Когда создавалась функция `calculate`, `TAX_RATE` ещё не существовал.

Но имя ищется во время execution функции.

---

Если поменять порядок:

```python
def calculate():
    return TAX_RATE * 100


print(calculate())

TAX_RATE = 0.2
```

получим:

```text
NameError
```

Потому что во время execution нужного binding ещё нет.

---

# 44. Syntax error vs runtime error

Например:

```python
if True
    print("hello")
```

→

```text
SyntaxError
```

Parser не может построить корректную программу.

---

А:

```python
10 + "20"
```

синтаксически корректно.

Но runtime выдаст:

```text
TypeError
```

---

# 45. Почему это важно для Python engineering

Python compiler не обязан заранее доказать корректность каждой operation.

Например:

```python
def add(a, b):
    return a + b
```

полностью valid Python.

Но:

```python
add([], {})
```

упадёт runtime.

Поэтому в больших Python-проектах особенно важны:

```text
type hints
static analysis
tests
runtime validation
linters
```

---

# 46. Runtime introspection

Python позволяет исследовать objects во время выполнения.

Например:

```python
value = 10

print(type(value))
```

Можно:

```python
print(dir(value))
```

Можно:

```python
print(hasattr(value, "bit_length"))
```

Можно:

```python
method = getattr(value, "bit_length")

print(method())
```

Это называется runtime introspection.

---

# 47. Почему framework'и любят Python

Потому что runtime позволяет делать много dynamic вещей.

Например:

```python
def create_user(
    name: str,
    age: int,
):
    ...
```

Framework может inspect:

* имя функции;
* её параметры;
* annotations;
* default values.

И на основе этого автоматически строить поведение.

Именно поэтому Python-framework code часто выглядит очень декларативным.

---

# 48. Decorators — preview

Например:

```python
@logged
def create_user():
    ...
```

Концептуально:

```python
create_user = logged(create_user)
```

Function object передаётся в другую функцию и заменяется результатом.

То есть никакой мистики.

В основе снова:

```text
functions are runtime objects
```

---

# 49. Operators работают через runtime types

Например:

```python
1 + 2
```

→ `3`

Но:

```python
"hello" + " world"
```

→ `"hello world"`

И:

```python
[1, 2] + [3, 4]
```

→ `[1, 2, 3, 4]`

Один syntax:

```python
a + b
```

имеет разную semantics в зависимости от types объектов.

Позже увидим, что это связано с special methods вроде:

```python
__add__
```

---

# 50. Python активно использует protocols

Многие language operations сводятся к ожидаемому поведению объекта.

Например:

```python
len(items)
```

связано с protocol:

```python
__len__
```

---

```python
for item in items:
```

использует iteration protocol.

---

```python
with resource:
```

использует context manager protocol.

---

```python
a == b
```

может использовать:

```python
__eq__
```

Это одна из фундаментальных идей Python:

> объект не обязательно должен принадлежать определённому классу — часто достаточно поддерживать нужное поведение.

Позже это приведёт нас к duck typing и `Protocol`.

---

# JavaScript / TypeScript Comparison

| Concept                     | JavaScript / TypeScript             | Python                                                       |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Popular runtime             | Node / V8                           | CPython                                                      |
| Parsing                     | AST                                 | AST                                                          |
| Intermediate representation | bytecode / JIT internals            | Python bytecode                                              |
| JIT                         | активно используется V8             | не классическая модель CPython                               |
| Runtime typing              | dynamic                             | dynamic                                                      |
| Static typing               | TypeScript                          | type hints + Pyright/mypy                                    |
| Type hints runtime-enforced | TS исчезает до runtime              | Python annotations обычно тоже не валидируются автоматически |
| Blocks                      | `{}`                                | indentation                                                  |
| Block scope                 | `let` / `const`                     | `if` / `for` нового scope не создают                         |
| Functions                   | runtime objects                     | runtime objects                                              |
| Classes                     | prototype-based model               | class-based object model                                     |
| Modules                     | runtime modules                     | module objects + execution                                   |
| Coercion                    | довольно активный                   | значительно более explicit                                   |
| Default execution model     | event-loop-centric в Node ecosystem | обычный Python sync по умолчанию                             |

Важно использовать эти соответствия только как мост.

Например:

```text
Python class ≠ JavaScript class
```

Обе конструкции называются `class`, но object models разные.

---

# Common Mistakes after JavaScript / TypeScript

## 1. Думать, что Python — это JS без `{}`

Разница гораздо глубже:

```text
object model
typing
scope
runtime
protocols
concurrency
```

---

## 2. Воспринимать annotation как TypeScript type

```python
def foo(value: int):
    ...
```

не означает automatic runtime validation.

---

## 3. Ожидать block scope

```python
if True:
    value = 10

print(value)
```

работает.

---

## 4. Переносить JavaScript coercion

```python
"5" + 5
```

в Python даст `TypeError`.

---

## 5. Думать, что `class` — статическая declaration

Class body исполняется, а class является runtime object.

---

## 6. Думать, что `import` просто подключает declarations

Import может реально выполнить top-level code module.

---

# Practical Examples

## Example 1 — Function object

```python
def hello():
    return "Hello"


another = hello

print(hello)
print(another)
print(another())
```

`hello` и `another` указывают на один function object.

---

## Example 2 — Class body

```python
class User:
    print("Creating class")

    role = "user"


print("Class created")
```

Output:

```text
Creating class
Class created
```

---

## Example 3 — Runtime typing

```python
def repeat(value: int) -> int:
    return value * 2


print(repeat(10))
print(repeat("Hi"))
```

Output:

```text
20
HiHi
```

Annotation ничего автоматически не запретила.

---

## Example 4 — Scope

```python
for i in range(3):
    doubled = i * 2

print(i)
print(doubled)
```

Output:

```text
2
4
```

---

## Example 5 — Name lookup

```python
def calculate():
    return RATE * 100


RATE = 0.21

print(calculate())
```

Output:

```text
21.0
```

---

# Interview Questions

## 1. Is Python compiled or interpreted?

**Ответ:**

В CPython Python source сначала компилируется в Python bytecode, после чего bytecode выполняется CPython interpreter.

Поэтому простое утверждение «Python interpreted» описывает только часть pipeline.

```text
source
↓
AST
↓
bytecode
↓
interpreter
```

Python bytecode при этом не является native machine code.

---

## 2. What is CPython?

**Ответ:**

CPython — наиболее распространённая implementation языка Python.

Большая часть runtime написана на C.

Именно CPython обычно подразумевается, когда обсуждают:

* Python bytecode;
* reference counting;
* GIL;
* `__pycache__`;
* стандартное поведение Python runtime.

Python — язык, CPython — одна из его implementations.

---

## 3. What does dynamically typed mean in Python?

**Ответ:**

Runtime object имеет type, но name не имеет обязательного фиксированного compile-time type.

Например:

```python
value = 10
value = "hello"
```

Имя `value` сначала связано с `int` object, а затем с `str` object.

Dynamic typing не означает отсутствие типов.

У каждого объекта есть runtime type.

---

## 4. Are Python type hints enforced at runtime?

**Ответ:**

Обычно нет.

Например:

```python
def double(value: int) -> int:
    return value * 2
```

CPython не обязан запретить:

```python
double("Hi")
```

Type hints в основном используются static analyzers, IDE и framework tooling.

Например:

```text
Pyright
mypy
```

---

## 5. Do `if`, `for` and `while` create a new scope in Python?

**Ответ:**

Нет.

Например:

```python
if True:
    value = 10

print(value)
```

работает.

То же самое с loop variables:

```python
for i in range(3):
    pass

print(i)
```

выведет `2`.

Это отличается от JavaScript `let` / `const`, которые имеют block scope.

---

# Check Yourself

## 1

```python
value = 10
value = "10"

print(type(value))
```

**Ответ:**

```text
<class 'str'>
```

Имя `value` было rebound к string object.

---

## 2

```python
def process(value: str) -> str:
    return value + value


print(process(10))
```

**Ответ:**

```text
20
```

Annotation `str` не является runtime guard.

Для integer:

```python
10 + 10
```

валидно.

---

## 3

```python
if True:
    x = 5

print(x)
```

**Ответ:**

```text
5
```

`if` не создаёт новый local scope.

---

## 4

```python
def calculate():
    return RATE


print(calculate())

RATE = 10
```

**Ответ:**

`NameError`.

На момент execution функции binding `RATE` ещё не существует.

---

## 5

```python
def foo():
    return 42


bar = foo

print(foo is bar)
```

**Ответ:**

```text
True
```

`bar = foo` не создаёт новую функцию.

Оба names связаны с одним function object.

---

# Главное из урока

Python-код в CPython проходит примерно такую pipeline:

```text
source
↓
AST
↓
bytecode
↓
CPython interpreter
```

Python — dynamic language, но objects имеют runtime types.

Полезный mental model:

```text
name
 ↓
binding
 ↓
object
 ↓
object has type
```

Functions, classes и modules — runtime objects.

Type hints не равны TypeScript compile-time guarantees.

Indentation является частью syntax.

`if` и `for` не создают JavaScript-style block scope.

И самое важное:

> Python стоит воспринимать не как упрощённый JavaScript, а как отдельный runtime и object model со своими правилами.
