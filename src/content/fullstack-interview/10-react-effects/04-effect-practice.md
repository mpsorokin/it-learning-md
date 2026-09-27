# Effect practice

## Interview questions

### useEffect(() => {})
<!-- question-id: 10-react-effects-task01 -->
#### Ответ

Без второго аргумента setup повторяется после каждого commit компонента. Это не «один раз после рендера страницы»: любой state/prop update, вызвавший commit, запускает новый setup; если есть cleanup, он сначала освобождает предыдущий ресурс. Пустое тело ничего не синхронизирует, поэтому такой Effect обычно нужно просто удалить. Если внутрь добавить setState без условия, вероятен цикл: Effect → update → commit → Effect. Указывайте dependency array по реально используемым значениям, а не по желаемой частоте запуска.

### useEffect(() => {}, [])
<!-- question-id: 10-react-effects-task02 -->
#### Ответ

Пустое тело с [] не выполняет полезной работы; если заполнить его, setup запускается при commit монтирования и cleanup при unmount. В dev StrictMode setup/cleanup/setup повторится для проверки, а повторный mount тоже запустит его снова. [] корректно только когда Effect не использует reactive props/state. Например, listener, который читает state из closure, будет видеть начальный snapshot; либо перечислите state в dependencies, либо для событийной логики React 19.2+ рассмотрите useEffectEvent. Не применяйте ref-flag, чтобы добиться «одного раза»: он скрывает сломанную симметрию.

### useEffect(() => {}, [a, b])
<!-- question-id: 10-react-effects-task03 -->
#### Ответ

После первого commit React запускает setup; далее сравнивает a и b с предыдущим render по Object.is. Если изменился хотя бы один, сначала вызывается cleanup с предыдущими значениями, затем setup с новыми; если оба стабильны, Effect не повторяется. Этот массив должен соответствовать значениям, которые код реально читает, и всегда иметь одинаковую длину/порядок. Если a/b — каждый раз новый object/function, Effect будет повторяться каждый commit. Dependency array — декларация реактивной связи, а не ручной throttle.

### fetch race condition;
<!-- question-id: 10-react-effects-task04 -->
#### Ответ

Сценарий: запрос для старого query медленный, для нового быстрый; старый ответ последним перезаписывает результат. Отмените старый fetch в cleanup и независимо пометьте запуск неактивным:

```ts
useEffect(() => {
  const controller = new AbortController();
  let active = true;

  async function load() {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: unknown = await response.json();
      if (active) setResult(result);
    } catch (error) {
      if (active && !controller.signal.aborted) setError(error);
    }
  }

  void load();
  return () => {
    active = false;
    controller.abort();
  };
}, [query]);
```

Проверка active сохраняет correctness для API, которое не поддерживает abort; AbortController экономит клиентскую работу. Для реального API провалидируйте unknown JSON до setResult и используйте cache/query layer, если нужны dedupe, retries и shared state. Отмена fetch не откатывает серверный side effect.

### AbortController;
<!-- question-id: 10-react-effects-task05 -->
#### Ответ

Передайте AbortSignal каждому cancellable запросу, а controller создавайте внутри конкретного Effect-run:

```ts
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => setState({ status: "success", data }))
    .catch(error => {
      if (!controller.signal.aborted) setState({ status: "error", error });
    });
  return () => controller.abort();
}, [url]);
```

Каждый следующий Effect получает новый controller: уже отменённый signal остаётся aborted. Ловите AbortError/проверяйте signal, иначе ожидаемая отмена будет показана как ошибка. Abort не гарантирует отмены серверной работы и не помогает библиотеке, игнорирующей signal; generation guard защищает UI от устаревшего результата. Обработайте HTTP status и runtime-валидируйте JSON, если важна форма ответа.

### infinite loop;
<!-- question-id: 10-react-effects-task06 -->
#### Ответ

Проверьте цикл из двух условий: Effect вызывает state setter, и dependency при следующем commit меняется. Например:

```ts
const options = { roomId };
useEffect(() => {
  connect(options);
  return () => disconnect(options);
}, [options]); // options получает новый identity на каждом render
```

Создавайте options непосредственно внутри Effect и зависите от roomId; если меняющийся state нужен только для вычисления следующего значения, используйте functional updater. Если значение можно вычислить в render, уберите дублирующий state/Effect. Не лечите цикл пустым dependency array, бесконечным debounce или подавлением lint: сначала выясните, какой внешний ресурс синхронизируется и какой state действительно должен измениться.

### missing dependency;
<!-- question-id: 10-react-effects-task07 -->
#### Ответ

Если Effect читает reactive value, но dependency list его опускает, callback хранит snapshot старого render:

```ts
useEffect(() => {
  const unsubscribe = subscribe(roomId, message => {
    showMessage(message, theme);
  });
  return unsubscribe;
}, []); // roomId и theme отсутствуют
```

Если изменение roomId требует переподключения, перечислите roomId и theme; при необходимости создания options сделайте это внутри Effect. В React 19.2+ theme можно вынести в useEffectEvent только если она действительно не должна инициировать reconnect, а нужна при обработке события. Не отключайте exhaustive-deps, чтобы замолчать предупреждение: проверьте, что каждый прочитанный prop/state либо запускает новую синхронизацию, либо явно является не-reactive событием.

### subscription leak;
<!-- question-id: 10-react-effects-task08 -->
#### Ответ

Подписка, установленная без unsubscribe, продолжает держать callback и может обновлять компонент после смены экрана; повторный setup добавляет дубликаты. Сохраняйте disposer, возвращаемый API, и отдавайте его как cleanup:

```ts
useEffect(() => {
  const unsubscribe = store.subscribe(onChange);
  return () => unsubscribe();
}, [store, onChange]);
```

Если onChange создаётся при каждом render, это будет переподписка: переместите handler в Effect, мемоизируйте при обоснованной стабильности или используйте Effect Event для latest-value logic при React 19.2+. Проверяйте, что disposer относится к этой конкретной подписке и вызывается до новой; под StrictMode активных подписчиков после setup/cleanup/setup должен быть один. На unmount не должно оставаться callback, timer или socket.

### stale closure.
<!-- question-id: 10-react-effects-task09 -->
#### Ответ

Closure видит props/state того render, в котором функция была создана. Пустой dependency array с callback, использующим state, зафиксирует его начальное значение. Если задача — изменить предыдущее state, не читайте его из closure:

```ts
setCount(current => current + 1);
```

Такой updater получает актуальную очередь state и не требует count в dependency callback-а. Если listener должен читать несколько последних значений, синхронизируйте его зависимости либо в React 19.2+ используйте локальный useEffectEvent для события, пришедшего от Effect. Ref с последним значением — другой вариант для callback внешнего API, но обновляйте и читайте его вне render по чёткой политике. Не делайте любой callback «always latest»: иногда смена closure должна сознательно отменять старую задачу.
