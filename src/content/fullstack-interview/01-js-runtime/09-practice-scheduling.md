# Практика: scheduling

## Interview questions

### Предсказать output сложной цепочки Promise + setTimeout + async/await.
<!-- question-id: fullstack-interview-01-js-runtime-051 -->

#### Ответ

В самом задании нет исходного фрагмента, поэтому конкретный output определить нельзя: порядок зависит от точного расположения `then`, `await`, таймеров и синхронных `console.log`. На интервью сначала фиксирую host (браузер или Node.js), затем нумерую синхронные строки и строю очередь продолжений.

Алгоритм разбора: исполнить текущий стек до конца; каждый `then` на Promise, который уже fulfilled/rejected, поставить в microtask queue; `await` приостанавливает только текущую async-функцию и планирует её продолжение как Promise job; `setTimeout` становится готовой host task после задержки, но не может прервать текущий task. После текущего task microtasks обрабатываются до опустошения, включая добавленные ими новые microtasks, затем host может выбрать следующую task/rendering opportunity. Не считать все timers, I/O и сообщения одной глобальной FIFO очередью.

Полезно записать события как `sync → microtask → следующая task`, отдельно отмечая место, где async-функция продолжится. Для Node.js схема дополняется фазами цикла и очередью `process.nextTick`; не переносить браузерный результат автоматически.

### Разобрать microtask starvation.
<!-- question-id: fullstack-interview-01-js-runtime-052 -->

#### Ответ

Типичный источник starvation — рекурсивная microtask, например `queueMicrotask(loop)`, где `loop` снова ставит себя в очередь. Очередь не опустеет, поэтому браузер не перейдёт к следующей task: таймеры и ввод задержатся, rendering не получит возможности обновить кадр. Аналогично ведёт себя бесконечная цепочка `Promise.resolve().then(loop)` или `await Promise.resolve()` в цикле. Это отличается от одного длинного синхронного task тем, что каждая итерация может быть короткой, но checkpoint остаётся открытым.

Лечение — не микротаской «уступать» снова, а периодически отдавать управление host task queue либо вынести тяжёлую работу в Worker. Пример порционной обработки:

    async function processInBatches<T>(items: T[], handle: (item: T) => void, batchSize = 100) {
      for (let i = 0; i < items.length; i += batchSize) {
        for (const item of items.slice(i, i + batchSize)) handle(item);
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
    }

Здесь timer создаёт новую task между batch-ами; для точного production scheduling выбирают подходящий scheduler и измеряют размер batch-а. Также добавляют отмену и обработку ошибок. `await Promise.resolve()` проблему не решит: это только очередная microtask.

### Сделать собственную очередь задач.
<!-- question-id: fullstack-interview-01-js-runtime-053 -->

#### Ответ

Ниже простая последовательная FIFO-очередь. Каждый `enqueue` получает собственный Promise результата; ошибки задачи возвращаются её вызывающему коду, не останавливая очередь. После каждой задачи планировщик уступает через timer, поэтому бесконечное пополнение не удерживает один microtask checkpoint.

    class TaskQueue {
      private tasks: Array<() => Promise<void>> = [];
      private running = false;

      enqueue<T>(task: () => T | PromiseLike<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
          this.tasks.push(async () => {
            try {
              resolve(await task());
            } catch (error) {
              reject(error);
            }
          });
          this.schedule();
        });
      }

      private schedule(): void {
        if (this.running) return;
        this.running = true;
        setTimeout(() => { void this.drain(); }, 0);
      }

      private async drain(): Promise<void> {
        while (this.tasks.length > 0) {
          const task = this.tasks.shift()!;
          await task();
          if (this.tasks.length > 0) {
            await new Promise<void>(resolve => setTimeout(resolve, 0));
          }
        }
        this.running = false;
        if (this.tasks.length > 0) this.schedule();
      }
    }

Queue имеет один активный consumer, сохраняет FIFO и не задаёт параллелизм. Для production нужно дополнить отменой, shutdown/close, backpressure или ограничением длины; для параллельной очереди нужен явный лимит workers и политика порядка завершения. Значения, возвращённые `enqueue`, надо обрабатывать, иначе их ошибки могут стать unhandled rejection.
