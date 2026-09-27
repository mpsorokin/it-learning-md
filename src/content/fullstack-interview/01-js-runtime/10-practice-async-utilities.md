# Практика: async utilities

## Interview questions

### Реализовать concurrency limiter.
<!-- question-id: fullstack-interview-01-js-runtime-054 -->

#### Ответ

Реализация запускает не более `limit` worker-ов, назначает им следующую задачу по общему индексу и складывает результаты в исходные позиции. При первой ошибке больше не выдаёт новые задачи, дожидается уже запущенных операций и затем reject-ится первой причиной. Уже начатые side effect-ы автоматически остановить нельзя; для этого mapper должен поддерживать AbortSignal.

    async function mapWithConcurrency<T, R>(
      items: readonly T[],
      limit: number,
      mapper: (item: T, index: number) => Promise<R> | R,
    ): Promise<R[]> {
      if (!Number.isInteger(limit) || limit < 1) {
        throw new RangeError('limit must be a positive integer');
      }

      const results = new Array<R>(items.length);
      let nextIndex = 0;
      let failed = false;
      let firstError: unknown;

      async function worker(): Promise<void> {
        while (!failed) {
          const index = nextIndex++;
          if (index >= items.length) return;
          try {
            results[index] = await mapper(items[index], index);
          } catch (error) {
            if (!failed) firstError = error;
            failed = true;
          }
        }
      }

      const workerCount = Math.min(limit, items.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
      if (failed) throw firstError;
      return results;
    }

Сложность диспетчеризации O(n), память для результата O(n), одновременно выполняется максимум `limit` mapper-ов. Нужно проверить пустой список, limit 0/дробь, mapper с sync throw, rejection и стабильный порядок результата. Если требуется input stream бесконечной длины, массивный API не подходит — нужна очередь с backpressure.

### Реализовать sleep().
<!-- question-id: fullstack-interview-01-js-runtime-055 -->

#### Ответ

`sleep` — Promise-обёртка над timer-ом; в варианте ниже отрицательная задержка сводится к нулю, а отмена очищает таймер и listener, чтобы не удерживать ресурсы.

    function sleep(ms: number, signal?: AbortSignal): Promise<void> {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(signal.reason ?? new Error('Sleep aborted'));
          return;
        }

        const timer = setTimeout(() => {
          cleanup();
          resolve();
        }, Math.max(0, ms));

        const onAbort = () => {
          clearTimeout(timer);
          cleanup();
          reject(signal?.reason ?? new Error('Sleep aborted'));
        };
        const cleanup = () => signal?.removeEventListener('abort', onAbort);
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    }

Разрешение Promise означает только, что timer callback получил возможность выполниться; это не точная задержка wall-clock. Для очень больших сроков учитывайте ограничение максимального timer delay конкретного runtime. В тестах используйте fake timers, проверяйте abort до вызова и во время ожидания, а на production boundary распространяйте единый AbortSignal.

### Реализовать retry с exponential backoff.
<!-- question-id: fullstack-interview-01-js-runtime-056 -->

#### Ответ

Retry допустим только для ошибок, которые могут временно исчезнуть, и операций с безопасной повторной семантикой (idempotent или с idempotency key). Иначе timeout мог случиться после фактического commit, и повтор создаст дубликат платежа/записи. Вариант ниже использует exponential backoff с full jitter, ограничение попыток и классификатор ошибок; `attempts` включает первый вызов.

    type RetryOptions = {
      attempts: number;
      baseDelayMs: number;
      maxDelayMs: number;
      signal?: AbortSignal;
      shouldRetry: (error: unknown) => boolean;
    };

    async function retry<T>(
      operation: (attempt: number, signal?: AbortSignal) => Promise<T>,
      options: RetryOptions,
    ): Promise<T> {
      const { attempts, baseDelayMs, maxDelayMs, signal, shouldRetry } = options;
      if (!Number.isInteger(attempts) || attempts < 1) {
        throw new RangeError('attempts must be a positive integer');
      }
      if (!Number.isFinite(baseDelayMs) || baseDelayMs < 0 ||
          !Number.isFinite(maxDelayMs) || maxDelayMs < 0) {
        throw new RangeError('retry delays must be finite and non-negative');
      }

      for (let attempt = 1; ; attempt++) {
        if (signal?.aborted) throw signal.reason ?? new Error('Retry aborted');
        try {
          return await operation(attempt, signal);
        } catch (error) {
          if (attempt >= attempts || !shouldRetry(error)) throw error;
          const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
          await sleep(Math.random() * cap, signal);
        }
      }
    }

Классификатор должен исключать validation/auth ошибки, учитывать server `Retry-After`, а метрики должны показывать число повторов. Jitter снижает синхронный retry storm; нужно также ограничить общий deadline и число одновременных retry. В коде используется базовая проверка `signal.aborted`, чтобы не зависеть от поддержки более нового convenience method.

### Реализовать timeout вокруг Promise.
<!-- question-id: fullstack-interview-01-js-runtime-057 -->

#### Ответ

Чтобы timeout действительно прекращал работу, API операции должен принимать AbortSignal. Обёртка ниже сама abort-ит operation по сроку; Promise.race без AbortController только перестал бы ждать, но оставил бы запрос/вычисление выполняться.

    function withTimeout<T>(
      start: (signal: AbortSignal) => Promise<T>,
      timeoutMs: number,
    ): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const controller = new AbortController();
        const timeoutError = new Error(`Timed out after ${timeoutMs} ms`);
        timeoutError.name = 'TimeoutError';

        const timer = setTimeout(() => {
          controller.abort(timeoutError);
          reject(timeoutError);
        }, Math.max(0, timeoutMs));

        Promise.resolve()
          .then(() => start(controller.signal))
          .then(
            value => { clearTimeout(timer); resolve(value); },
            error => { clearTimeout(timer); reject(error); },
          );
      });
    }

Settlement обёртки — гонка: кто первым выполнит timer или завершит работу, тот определяет результат. Более позднее завершение исходной операции безопасно имеет подключённый rejection handler. Это локальная timeout-ошибка, не следует подменять ею внешнюю отмену; хороший API объединяет timeout и caller-provided signal. `AbortController` лишь отправляет запрос на отмену: операция должна обработать signal, а серверная транзакция могла уже завершиться.

### Реализовать Promise.all.
<!-- question-id: fullstack-interview-01-js-runtime-058 -->

#### Ответ

Упрощённый generic combinator принимает iterable, приводит элементы к Promise, сохраняет порядок входа и reject-ится при первой наблюдаемой ошибке. Начальное `remaining = 1` защищает пустой iterable и синхронные callback-края.

    function promiseAll<T>(
      values: Iterable<T | PromiseLike<T>>,
    ): Promise<Awaited<T>[]> {
      return new Promise((resolve, reject) => {
        const results: Awaited<T>[] = [];
        let remaining = 1;
        let index = 0;

        try {
          for (const value of values) {
            const current = index++;
            remaining++;
            Promise.resolve(value).then(result => {
              results[current] = result as Awaited<T>;
              remaining--;
              if (remaining === 0) resolve(results);
            }, reject);
          }
        } catch (error) {
          reject(error);
          return;
        }

        remaining--;
        if (remaining === 0) resolve(results);
      });
    }

Сложность и память O(n). Реализация учитывает sync iterator throw, thenable assimilation и порядок результата, но это учебная версия: native `Promise.all` также учитывает Promise subclass/constructor/species и алгоритмические детали iterator closing. Rejection не отменяет другие операции. Тесты: пустой iterable, обычные значения, out-of-order settlement, rejected Promise, thenable, iterator, который бросает.

### Реализовать Promise.allSettled.
<!-- question-id: fullstack-interview-01-js-runtime-059 -->

#### Ответ

`allSettled` ждёт завершения каждого элемента, независимо от результата, и возвращает записи в исходном порядке. В этой реализации каждому Promise назначается обработчик и для fulfillment, и для rejection; счётчик начинает с одного, чтобы пустой список также завершился.

    type Settled<T> =
      | { status: 'fulfilled'; value: T }
      | { status: 'rejected'; reason: unknown };

    function promiseAllSettled<T>(
      values: Iterable<T | PromiseLike<T>>,
    ): Promise<Settled<Awaited<T>>[]> {
      return new Promise((resolve, reject) => {
        const results: Settled<Awaited<T>>[] = [];
        let remaining = 1;
        let index = 0;

        try {
          for (const value of values) {
            const current = index++;
            remaining++;
            Promise.resolve(value).then(
              result => {
                results[current] = { status: 'fulfilled', value: result as Awaited<T> };
                if (--remaining === 0) resolve(results);
              },
              reason => {
                results[current] = { status: 'rejected', reason };
                if (--remaining === 0) resolve(results);
              },
            );
          }
        } catch (error) {
          reject(error);
          return;
        }

        if (--remaining === 0) resolve(results);
      });
    }

Ошибки при перечислении самого iterable приводят к rejection, поскольку нельзя получить результат для элементов, которые не удалось перечислить. Сложность и память O(n). Для production обычно предпочтителен встроенный `Promise.allSettled`; здесь показан алгоритм и тип результата.
