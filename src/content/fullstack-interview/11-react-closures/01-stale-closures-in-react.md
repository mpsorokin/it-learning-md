# Stale closures in React

## Interview questions

### Почему:
<!-- question-id: 11-react-closures-q01 -->

```text
setTimeout(() => {
  setClicks(clicks + 1)
}, 2000)
```

#### Ответ

Обработчик создан конкретным render и захватывает snapshot clicks из этого render. Если clicks был 2, отложенный callback через две секунды вычислит 2 + 1 и запишет 3, даже если пользователь успел нажать ещё несколько раз и текущее значение уже 5; несколько callback-ов с тем же snapshot могут потерять инкременты. Если операция должна прибавить к актуальному состоянию, используйте функциональную форму setClicks(current => current + 1): React применяет updater к последнему значению очереди. Если важно именно значение на момент клика, захват старого snapshot — ожидаемое поведение. Timeout нужно отменить при unmount, если отложенное действие больше не должно происходить.

### Почему:
<!-- question-id: 11-react-closures-q02 -->

```text
const increment = useCallback(() => {
  setCount(count + 1)
}, [])
```

#### Ответ

useCallback с пустым dependency array возвращает одну и ту же функцию между render-ами, но эта функция замыкает count только того render, в котором она была создана впервые. Поэтому каждый вызов будет снова вычислять initial count + 1; обновления state не меняют уже созданное closure. Если надо прибавлять к текущему значению, используйте setCount(current => current + 1), и callback может не читать count. Если callback по смыслу зависит от count, включите его в dependencies — идентичность тогда изменится при изменении count. useCallback — оптимизация стабильности ссылки, а не механизм «latest state»; для Effect-originated callback в React 19.2+ есть useEffectEvent с более узкими правилами применения.

### Когда применять:
<!-- question-id: 11-react-closures-q03 -->

```text
setCount(current => current + 1)
```

#### Ответ

Функциональный updater нужен, когда новое значение вычисляется из предыдущего state, а callback может быть вызван позднее или несколько раз до следующего render: interval/timer, несколько быстрых событий, batching, queued updates. React применяет updater к актуальному предыдущему значению, поэтому чтение count из устаревшего closure не требуется. Updater обязан быть чистой функцией без сетевых вызовов, мутаций и других side effects; React может повторно вызвать её в dev StrictMode для проверки чистоты, игнорируя один результат. Он решает только зависимость от собственного state. Если вычисление зависит также от изменяемого prop или внешнего состояния, для них остаётся явная синхронизация/зависимость.

### Когда useRef помогает бороться со stale closure?
<!-- question-id: 11-react-closures-q04 -->
#### Ответ

Ref полезен, когда долгоживущий callback внешнего API должен читать последнее значение, но сам ресурс не нужно перезапускать на каждое изменение этого значения. Один паттерн — синхронизировать ref при commit и читать ref.current в listener; при React 19.2+ для логики, вызываемой из Effect, предпочтительнее useEffectEvent: он читает latest committed props/state без переподключения и не передаётся event-handler-ам/детям. Ref остаётся универсальным escape hatch для сторонних API, которые требуют стабильный callback. Не мутируйте ref во время обычного render и не используйте его для значения, которое должно отображаться: изменение current не вызывает render. Учтите окно между commit и passive Effect, если синхронизируете latest ref через useEffect; при необходимости применяют layout effect либо Effect Event. [useRef](https://react.dev/reference/react/useRef), [useEffectEvent](https://react.dev/reference/react/useEffectEvent).

### delayed counter
<!-- question-id: 11-react-closures-task01 -->
#### Ответ

Для delayed increment используйте updater, чтобы два таймера не записали одно и то же захваченное значение. Храните активные таймеры и отменяйте их при unmount:

```ts
const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

function handleClick() {
  let timer: ReturnType<typeof setTimeout>;
  timer = setTimeout(() => {
    timers.current.delete(timer);
    setCount(current => current + 1);
  }, 2000);
  timers.current.add(timer);
}

useEffect(() => {
  return () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  };
}, []);
```

Этот вариант сохраняет каждый быстрый клик как отдельное отложенное увеличение. Если по UX нужен только один pending increment, перед созданием нового таймера отмените предыдущий и храните один ID. Если callback использует другие props/state, добавьте их как реактивные значения или прочитайте через подходящий Effect Event; updater исправляет только зависимость от count.

### interval counter
<!-- question-id: 11-react-closures-task02 -->
#### Ответ

Функция interval обычно создана один раз, поэтому чтение count из closure было бы stale. Функциональный updater позволяет сохранить один interval на всё время жизни компонента:

```ts
useEffect(() => {
  const id = window.setInterval(() => {
    setCount(current => current + 1);
  }, 1000);
  return () => window.clearInterval(id);
}, []);
```

Cleanup обязателен: без него останутся лишние интервалы после unmount и StrictMode replay. Если частота меняется, delay является dependency и при смене React очистит старый timer и создаст новый. Если callback нужен другой актуальный state, можно добавить этот state как dependency (timer перезапустится) или, в React 19.2+, использовать useEffectEvent внутри tick. Не передавайте setCount(count + 1): interval сохранит первоначальный count.

### WebSocket handler
<!-- question-id: 11-react-closures-task03 -->
#### Ответ

Создавайте socket для текущего URL/room и удаляйте listener с закрытием соединения в cleanup. Список сообщений обновляйте от предыдущего state, чтобы callback не зависел от захваченного массива:

```ts
useEffect(() => {
  const socket = new WebSocket(url);
  const onMessage = (event: MessageEvent<string>) => {
    setMessages(current => [...current, event.data]);
  };
  socket.addEventListener("message", onMessage);
  return () => {
    socket.removeEventListener("message", onMessage);
    socket.close();
  };
}, [url]);
```

Если обработка сообщения должна учитывать актуальный theme/filter, для React 19.2+ вынесите только эту event logic в useEffectEvent и вызывайте её из listener. Смена url должна создавать новое соединение, поэтому url не скрывают из dependencies. В production обработайте open/error/close, reconnect backoff, heartbeat, authentication refresh, очередь сообщений и дедупликацию; callback также должен проверять формат входящего payload.

### event listener
<!-- question-id: 11-react-closures-task04 -->
#### Ответ

Для window listener важно не оставлять callback со старым prop и не переподписываться без необходимости. В React 19.2+ используйте Effect Event для latest-value логики:

```ts
const reportResize = useEffectEvent(() => {
  setWidth(window.innerWidth);
  onResize?.(window.innerWidth);
});

useEffect(() => {
  const handleResize = () => reportResize();
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

Effect Event можно вызывать здесь, потому что callback listener-а создан Effect-ом; не передавайте reportResize в JSX и не добавляйте его в dependency array. Если нужна поддержка React 18 и ниже, перечислите callback/value dependencies и допускайте переподписку либо поддерживайте latest-value ref вне render. Если изменение callback должно сбросить listener, useEffectEvent здесь не подходит. Для высокой частоты используйте throttle/requestAnimationFrame и passive listener, где уместно.

### async request callback
<!-- question-id: 11-react-closures-task05 -->
#### Ответ

Асинхронная функция захватывает исходный ключ запроса, но её результат может прийти после того, как компонент уже показывает другой ключ. Зависимости создают запрос для нового ключа, cleanup отменяет и инвалидирует предыдущий запуск:

```ts
useEffect(() => {
  const controller = new AbortController();
  let active = true;
  async function load() {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: unknown = await response.json();
      if (active) setUser(result);
    } catch (error) {
      if (active && !controller.signal.aborted) setError(error);
    }
  }
  void load();
  return () => {
    active = false;
    controller.abort();
  };
}, [userId]);
```

Для реального UI провалидируйте result как unknown, сбрасывайте/помечайте loading для нового userId и не показывайте данные предыдущего пользователя под новым заголовком. Abort не является транзакционной отменой backend; актуальность ответа определяется ещё и active/requestId. У сетевого слоя могут быть retry/cache/deduplication, поэтому эффект часто лучше заменить запросом через framework/query library.

### debounce callback
<!-- question-id: 11-react-closures-task06 -->
#### Ответ

Дебаунс имеет две отдельные задачи: пересоздать timer при новом value/delay и вызвать актуальный callback, когда задержка закончилась. В React 19.2+ Effect Event позволяет не перезапускать timer только потому, что ссылка callback поменялась:

```ts
function useDebouncedEffect(
  value: string,
  delay: number,
  callback: (value: string) => void,
) {
  const runLatest = useEffectEvent(callback);
  useEffect(() => {
    const id = window.setTimeout(() => runLatest(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
}
```

При каждом новом value старый timeout очищается, поэтому вызывается последнее значение. Если callback меняется по смыслу и именно это должно сбросить debounce, включите его в dependencies или используйте обычную функцию с явным контрактом. Effect Event вызывается только из Effect-originated callback; не используйте его для обычного onClick или чтобы скрыть реальную зависимость.

