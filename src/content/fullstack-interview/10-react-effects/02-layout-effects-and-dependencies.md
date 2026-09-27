# Layout effects and dependencies

## Interview questions

### Что такое useLayoutEffect?
<!-- question-id: 10-react-effects-q10 -->
#### Ответ

useLayoutEffect — Effect для синхронной работы после того, как React применил изменения к DOM, но до того, как браузер покажет кадр. Он нужен в основном для измерения layout и немедленной коррекции отображения: например, прочитать getBoundingClientRect у tooltip, вычислить его координату, обновить state и показать только итоговое положение без flicker. Cleanup работает так же, как у useEffect. Код и state update внутри layout effect блокируют paint, поэтому Hook следует оставлять только для визуальной синхронизации, которую пользователь заметит. Он не запускается при server rendering; для SSR-sensitive компонента нужно продумать initial state/клиентский mount. [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect).

### useEffect vs useLayoutEffect.
<!-- question-id: 10-react-effects-q11 -->
#### Ответ

Оба синхронизируют компонент с внешней системой и оба имеют setup/cleanup/dependencies. useEffect — обычный выбор для подписок, запросов, логирования и таймеров: React позволяет браузеру отрисовать обновление, прежде чем запускать Effect в типичном неинтерактивном случае. useLayoutEffect запускается после DOM mutation и до paint; его синхронная работа не даёт браузеру показать промежуточный кадр, но блокирует главный поток. Для tooltip position, selection/caret и измерения DOM до показа может быть необходим layout effect; для network subscription — нет. Timing useEffect относительно paint не является абсолютной гарантией и может зависеть от взаимодействия пользователя; useLayoutEffect применяют только когда нужен именно pre-paint порядок. См. [документацию](https://react.dev/reference/react/useEffect).

### Почему layout effect может блокировать paint?
<!-- question-id: 10-react-effects-q12 -->
#### Ответ

Layout effect выполняется синхронно в commit-фазе после DOM mutation, но прежде чем браузер отрисует обновлённый кадр. Пока JavaScript исполняется, main thread не может выполнить layout/paint. Если вызвать setState, React синхронно обработает обновление до следующего paint, чтобы браузер увидел скорректированный результат; оставшиеся Effects также могут быть выполнены раньше. Это устраняет видимый flicker, но длинная работа ухудшает responsiveness и создаёт jank. Измерения нужно держать малыми, группировать read-before-write, не делать там fetch/heavy computation и предпочитать useEffect, если промежуточный кадр не создаёт UX-проблему.

### Dependency array.
<!-- question-id: 10-react-effects-q13 -->
#### Ответ

Dependency array перечисляет все reactive values из setup/cleanup: props, state и переменные/функции, объявленные внутри компонента. React сравнивает каждый слот с прошлым render через Object.is; новый setup нужен на mount и после commit, где хотя бы один слот изменился. Количество и порядок слотов должны быть константными, массив — inline. Не включаются значения, гарантированно стабильные по контракту React (setter useState) и ref object; ref.current не reactive и изменение его не вызывает render. Следуйте exhaustive-deps lint rule: он помогает держать синхронизацию честной; если список кажется слишком большим, упрощайте код, а не отключайте проверку. [React docs](https://react.dev/reference/react/useEffect).

### Почему нельзя просто “выкинуть dependency”?
<!-- question-id: 10-react-effects-q14 -->
#### Ответ

Если убрать значение, которое Effect читает, существующий setup продолжит видеть snapshot предыдущего render. Это stale closure: подписка может отправлять старый userId, listener — читать выключенную настройку, а запрос — сохранить результат не для того элемента. Dependency array описывает реактивность процесса, а не способ оптимизировать число вызовов. Сначала проверьте, нужна ли синхронизация вообще; перенесите создание объекта/функции внутрь Effect, используйте functional state update, вынесите константу за компонент. В React 19.2+ Effect Event подходит для действительно не-reactive части callback, запущенного Effect-ом, и читает latest committed values; это нельзя использовать, чтобы скрыть значение, которое должно переинициализировать ресурс. [Правило React](https://react.dev/reference/react/useEffectEvent).

### Stable vs unstable dependencies.
<!-- question-id: 10-react-effects-q15 -->
#### Ответ

Стабильная зависимость сохраняет ту же идентичность между render, поэтому Object.is возвращает true. React гарантирует стабильность state setter и объекта, который вернул useRef; значения модуля вне компонента также не пересоздаются на каждом render. Объект или функция, объявленные в теле компонента, обычно получают новую ссылку каждый render, даже если содержимое то же, и запускают повторный Effect. Это не означает, что нужно везде добавлять useMemo/useCallback: сначала уберите искусственную зависимость (создайте объект внутри Effect, вынесите helper наружу); memoization нужна, если ссылка — часть API/performance контракта. Не используйте референциальную стабильность как единственный механизм correctness.

### Functions в dependencies.
<!-- question-id: 10-react-effects-q16 -->
#### Ответ

Функция, созданная в component body, новая при каждом render; включённая в dependency array, она может постоянно пересоздавать subscription/request. Лучшее решение часто — объявить helper внутри Effect, чтобы зависеть только от его входов. Если callback нужен отдельному коду и его идентичность важна, useCallback мемоизирует его, но dependencies callback должны сами быть корректны; useCallback не «лечит» stale closure. Для Effect-originated события, которому нужны последние значения без переподключения, в React 19.2 можно рассмотреть useEffectEvent, соблюдая ограничения API: вызывается только из Effect и не передаётся вниз. Официальные детали [useCallback](https://react.dev/reference/react/useCallback) и [useEffectEvent](https://react.dev/reference/react/useEffectEvent).

### Objects в dependencies.
<!-- question-id: 10-react-effects-q17 -->
#### Ответ

React сравнивает объект по ссылке через Object.is, не делает deep equality. Литерал options = { roomId } создаётся заново на каждом render, поэтому Effect будет reconnect-ить даже при неизменном roomId. Предпочтительно создать объект внутри Effect из roomId и перечислить сам roomId. Альтернативы: вынести неизменный объект наружу или мемоизировать, если это действительно нужно и dependency cache имеет корректную семантику. Не сериализуйте объект в JSON для dependency и не пишите кастомный deep compare без конкретного требования: большие/cyclic данные дороги и скрывают реальную модель синхронизации. Для данных, влияющих на render, обычно нужен state, а не ref с объектом.

### Infinite Effect loops.
<!-- question-id: 10-react-effects-q18 -->
#### Ответ

Цикл возникает, когда Effect обновляет state, обновление вызывает render, а после него dependency этого Effect опять изменилась (или dependency array вообще отсутствует). Частый вариант — Effect создаёт новый объект и сохраняет его в state: ссылка всегда новая, поэтому условие повторяется. Разберите обе части: действительно ли state нужен, и какая dependency изменяется? Производные данные вычислите напрямую; если требуется обновление на основе предыдущего значения — передайте functional updater, чтобы не читать старое значение из closure. Если Effect обновляет state, который является его dependency, добавьте точную остановку/семантику перехода; не маскируйте цикл пустым массивом или отключением lint. Стабильные примитивные значения и корректный teardown обычно устраняют саму причину.
