# Практика: utilities и closures

## Interview questions

### Реализовать String.prototype.capitalize.
<!-- question-id: fullstack-interview-01-js-runtime-060 -->

#### Ответ

Сначала нужно определить семантику: ниже capitalize означает «перевести в верхний регистр первый Unicode code point, оставив остаток без изменений». Для пользовательского текста grapheme cluster может состоять из нескольких code points; если требуется такая корректность, следует сегментировать через `Intl.Segmenter` и проверить поддержку среды.

    function capitalize(value: string, locale?: string): string {
      const [first, ...rest] = Array.from(value);
      if (first === undefined) return value;
      return first.toLocaleUpperCase(locale) + rest.join('');
    }

Если условие буквально требует расширить встроенный прототип, TypeScript-тип добавляют через interface merging, а свойство устанавливают неперечисляемым:

    export {};

    declare global {
      interface String {
        capitalize(locale?: string): string;
      }
    }

    Object.defineProperty(String.prototype, 'capitalize', {
      configurable: true,
      writable: true,
      enumerable: false,
      value(this: string, locale?: string) {
        return capitalize(String(this), locale);
      },
    });

Модифицировать глобальный prototype в приложении/библиотеке рискованно из-за конфликтов и неожиданного изменения чужого кода; предпочтительнее экспортируемая функция. Отдельно протестировать пустую строку, Unicode вне BMP, немецкий `ß` (uppercase может дать два code points), locale и комбинируемые символы.

### Найти элементы массива, встречающиеся ровно один раз.
<!-- question-id: fullstack-interview-01-js-runtime-061 -->

#### Ответ

Считаем частоты в `Map`, затем фильтруем исходный массив по частоте, равной одному. Так сохраняется исходный порядок, а сравнение ключей следует SameValueZero, как у `Map`/`Set` (например, `NaN` совпадает с `NaN`, `+0` и `-0` совпадают). Объекты сравниваются по ссылке.

    function uniqueByFrequency<T>(items: readonly T[]): T[] {
      const counts = new Map<T, number>();
      for (const item of items) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
      return items.filter(item => counts.get(item) === 1);
    }

Время O(n) ожидаемо, память O(k), где k — число различных значений. Если нужно структурное равенство объектов, сначала определяют ключ/нормализацию, иначе одинаковые по содержимому объекты будут разными. Проверки: пустой массив, дубликаты, порядок, `NaN`, `undefined` и несколько ссылок на тот же объект.

### Реализовать debounce.
<!-- question-id: fullstack-interview-01-js-runtime-062 -->

#### Ответ

Ниже trailing-edge debounce: каждый вызов сбрасывает таймер, а исходная функция вызывается один раз с последними аргументами и `this`, когда в течение `wait` больше вызовов не было. Возвращаемое значение намеренно не передаётся вызывающей стороне: выполнение отложено.

    type AnyFunction = (this: any, ...args: any[]) => any;

    function debounce<T extends AnyFunction>(fn: T, wait: number) {
      if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait must be finite and non-negative');
      let timer: ReturnType<typeof setTimeout> | undefined;

      function debounced(this: ThisParameterType<T>, ...args: Parameters<T>): void {
        const context = this;
        if (timer !== undefined) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = undefined;
          fn.apply(context, args);
        }, Math.max(0, wait));
      }

      return Object.assign(debounced, {
        cancel() {
          if (timer !== undefined) clearTimeout(timer);
          timer = undefined;
        },
      });
    }

Сложность вызова O(1), активен максимум один timer. Это полезно для поиска/resize, но не гарантирует периодический вызов при непрерывном потоке событий (для этого нужен maxWait/другой алгоритм). В production следует продумать `cancel` при unmount, `flush`, leading option и поведение rejected Promise, если fn асинхронная; Lodash уже решает эти нюансы. В TS-реализации `any` ограничен границей универсальной функции, доменные типы остаются параметрами T.

### Реализовать throttle.
<!-- question-id: fullstack-interview-01-js-runtime-063 -->

#### Ответ

Задача фиксирует не конкретное определение leading/trailing, поэтому ниже выбран распространённый вариант: первый вызов происходит немедленно, последующие в окне объединяются в один trailing вызов с последними аргументами. `this` и аргументы последнего вызова сохраняются; `cancel()` удаляет ожидающий хвост.

    type AnyFunction = (this: any, ...args: any[]) => any;

    function throttle<T extends AnyFunction>(fn: T, wait: number) {
      if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait must be finite and non-negative');
      let lastInvoke: number | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let pendingArgs: Parameters<T> | undefined;
      let pendingThis: ThisParameterType<T> | undefined;

      const invoke = (time: number) => {
        lastInvoke = time;
        const args = pendingArgs!;
        const context = pendingThis!;
        pendingArgs = undefined;
        pendingThis = undefined;
        fn.apply(context, args);
      };

      function throttled(this: ThisParameterType<T>, ...args: Parameters<T>): void {
        const now = Date.now();
        pendingArgs = args;
        pendingThis = this;

        if (lastInvoke === undefined || now - lastInvoke >= wait) {
          if (timer !== undefined) clearTimeout(timer);
          timer = undefined;
          invoke(now);
        } else if (timer === undefined) {
          timer = setTimeout(() => {
            timer = undefined;
            if (pendingArgs !== undefined) invoke(Date.now());
          }, wait - (now - lastInvoke));
        }
      }

      return Object.assign(throttled, {
        cancel() {
          if (timer !== undefined) clearTimeout(timer);
          timer = undefined;
          lastInvoke = undefined;
          pendingArgs = undefined;
          pendingThis = undefined;
        },
      });
    }

`wait` трактуется как минимальный интервал между вызовами, но timer может сработать позже из-за нагрузки/фонового throttling. `Date.now()` зависит от системных часов; в точном UI-планировании лучше использовать монотонный `performance.now()`. Нужны тесты на первый вызов, burst, последний набор аргументов, границу окна, cancel и системное изменение времени. В некоторых задачах требуется leading-only или trailing-only — это отдельная явно заданная политика.

### Найти и исправить stale closure.
<!-- question-id: fullstack-interview-01-js-runtime-064 -->

#### Ответ

Без исходного фрагмента нельзя найти конкретную строку бага, поэтому разберу типичный React-кейс: эффект устанавливает интервал один раз, а callback закрывает `count` из первого рендера. Каждый тик пишет `setCount(count + 1)` со старым `count`, из-за чего счётчик застревает на 1.

Если новое значение зависит от предыдущего, правильнее передать updater:

    useEffect(() => {
      const id = setInterval(() => {
        setCount(current => current + 1);
      }, 1000);
      return () => clearInterval(id);
    }, []);

Функциональный setter получает актуальное предыдущее состояние и не замыкает его. Если callback должен читать меняющиеся props/state, синхронизируйте effect dependencies и корректно снимайте/устанавливайте подписку. В React 19.2+ для логики, запускаемой только из Effect и желающей читать последние committed значения без переподключения, доступен `useEffectEvent`; это не способ скрывать настоящие зависимости.

Для асинхронного запроса дополнительно защититесь от race: abort предыдущую операцию или игнорируйте её результат в cleanup. Проверить нужно несколько тиков/изменений state, размонтирование и поведение в Strict Mode.
