# Async effects and cleanup

## Interview questions

### Async operations внутри effects.
<!-- question-id: 10-react-effects-q19 -->
#### Ответ

Effect setup должен synchronously зарегистрировать ресурс и cleanup; асинхронную работу запускают из вложенной async-функции. Нужно спроектировать не только success, но и ошибку, отмену, повторный запуск и устаревший результат. При смене dependency предыдущий запрос может ещё завершиться: AbortController экономит работу там, где API поддерживает signal, а generation/ignore-флаг запрещает старому ответу менять текущий state. Проверяйте флаг после каждого await перед state update, учитывайте unmount и не превращайте AbortError в пользовательскую ошибку. Для production обычно лучше framework/query layer с cache, deduplication, retries и race policy; React docs также рекомендуют data layer, если она доступна.

### Почему effect callback нельзя напрямую сделать async?
<!-- question-id: 10-react-effects-q20 -->
#### Ответ

Сигнатура setup у useEffect возвращает void либо cleanup-функцию. async всегда возвращает Promise, даже если тело не возвращает значение; React не ожидает этот Promise и не сможет вызвать возвращённый после await cleanup. Promise может завершиться после unmount или смены dependency и обновить уже неактуальный state. Запустите inner async IIFE/функцию внутри синхронного setup, сразу создайте AbortController и верните cleanup синхронно. Ошибки async-функции нужно ловить внутри неё, иначе получите unhandled rejection; отмена и error-state — разные исходы.

### Race conditions.
<!-- question-id: 10-react-effects-q21 -->
#### Ответ

Race возникает, если два запроса стартовали в порядке A → B, а завершились B → A; если оба безусловно вызывают setState, устаревший A перезапишет актуальный B. Также результат может относиться к предыдущему userId/search query после unmount или dependency change. Решение: отменять старую работу при cleanup и независимо от cancellation проверять, что ответ ещё актуален (ignore flag или монотонный requestId). Проверка нужна, потому что не каждый API отменяемый и abort может прийти после завершения. Если серверная мутация уже ушла, abort клиента не откатывает её: для write нужны idempotency key/версионирование на backend. Тестируйте ответы в обратном порядке.

### AbortController.
<!-- question-id: 10-react-effects-q22 -->
#### Ответ

AbortController передаёт отмену API, которое принимает AbortSignal, например fetch, stream consumption и некоторых DOM operations. Создавайте controller на каждый Effect-run, передавайте signal и вызывайте controller.abort() в cleanup при смене dependency/unmount:

```ts
useEffect(() => {
  const controller = new AbortController();
  void fetch(url, { signal: controller.signal })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(setData)
    .catch(error => {
      if (error.name !== "AbortError") setError(error);
    });
  return () => controller.abort();
}, [url]);
```

Не переиспользуйте уже aborted controller при следующем запуске. Abort — best-effort отмена client-side операции: он не гарантирует, что сервер не выполнил запрос, и не защищает от API, игнорирующего signal. Для race-sensitive UI дополнительно проверяйте актуальность результата или используйте data-fetching layer с собственной cache/ordering policy.

### StrictMode double invocation.
<!-- question-id: 10-react-effects-q23 -->
#### Ответ

В React StrictMode при разработке React выполняет дополнительный цикл setup → cleanup → setup перед обычной первой установкой каждого Effect, чтобы проверить, что cleanup действительно нейтрализует setup. Компонент также может дополнительно рендериться в dev для выявления impure render. Это не production-дублирование и не «сломанный useEffect»; важно, что root StrictMode включает проверку, а граница StrictMode ниже root применяет только проверки, возможные в production. Сеть физически могла увидеть первый request, даже если cleanup его abort-нул, поэтому для read-запросов используйте cache/deduplication. Не подавляйте поведение ref-guard-ом «уже запускали».

### Почему StrictMode это делает?
<!-- question-id: 10-react-effects-q24 -->
#### Ответ

Дополнительный цикл обнаруживает эффекты, которые только наращивают состояние внешнего мира и не умеют освобождать ресурс: второй WebSocket, лишний listener, оставшийся timer, callback после unmount. Пользователь может получить ту же последовательность в production при фактическом unmount/remount, смене key, навигации или будущих режимах повторного использования UI. Корректный Effect должен выдерживать setup → cleanup → setup так, чтобы конечное состояние внешней системы было эквивалентно одному активному setup. StrictMode — диагностический stress-test, а не причина добавлять особую ветку поведения для dev или выключать проверку.

### Effect cleanup correctness.
<!-- question-id: 10-react-effects-q25 -->
#### Ответ

Проверяйте симметрию по каждому setup-run: каждый subscribe/connect/setInterval/addEventListener получает один соответствующий unsubscribe/disconnect/clearInterval/removeEventListener; cleanup использует именно локальный ресурс этого запуска и не теряет его из-за перезаписи ref. Cleanup должен безопасно исполняться перед re-setup и при unmount, включая повторный StrictMode цикл. Для async результата дополнительно abort-ните запрос и/или инвалидируйте его generation; отмена не гарантирует отмену сервера. Не запускайте новую подписку из cleanup. Практический тест: смонтировать, rerender-нуть с новой dependency и размонтировать; после этого активных ресурсов ровно столько, сколько видно на экране, а старый callback уже не меняет UI. React описывает cleanup как «undo» соответствующего setup в [руководстве](https://react.dev/learn/synchronizing-with-effects).
