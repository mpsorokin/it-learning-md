# Custom Hooks

## Interview questions

### Custom Hooks.
<!-- question-id: 12-react-hooks-mechanics-q05 -->
#### Ответ

Custom Hook — обычная JavaScript-функция, имя которой начинается с use и которая вызывает другие React Hooks, чтобы инкапсулировать и переиспользовать stateful logic. Например, useOnlineStatus прячет подписку на browser/network API и отдаёт компоненту текущее состояние. Каждая точка вызова сохраняет своё независимое состояние в Fiber вызывающего компонента: custom Hook повторно использует логику, а не создаёт глобальный singleton и не делит state автоматически. Hook должен вызываться на верхнем уровне function component или другого custom Hook; внутри него применяются те же правила порядка и cleanup, что и у обычных Hooks. React не создаёт отдельную компонентную границу для custom Hook.

### Что должен делать custom hook?
<!-- question-id: 12-react-hooks-mechanics-q06 -->
#### Ответ

Хороший custom Hook выражает одну понятную stateful capability: входные параметры задают конфигурацию, результат даёт state/derived values и, если нужно, действия. Он владеет жизненным циклом ресурсов: subscription, listener или timer настраивается Effect-ом и корректно очищается при изменении входа/unmount. Hook не должен скрыто менять глобальное состояние, подавлять dependency lint, возвращать JSX как обязательный формат или объединять несвязанные функции. Стабильность возвращаемых функций/объектов обещайте только если она часть контракта и нужна вызывающему; иначе не добавляйте memoization ради вида. Проверьте несколько независимых вызовов, смену параметров, StrictMode replay, ошибку/отмену и cleanup.

### Hook vs utility function.
<!-- question-id: 12-react-hooks-mechanics-q07 -->
#### Ответ

Utility function — обычная функция JavaScript/TypeScript: она может быть чистой, вызывается где угодно, не имеет React state и не запускает rerender. Custom Hook вызывается только во время render function component/другого Hook, может использовать useState/useEffect/context, и его вызовы участвуют в hook-order контрактах. Название с префиксом use помогает React lint отличать Hook; нельзя вызвать его условно в обычном helper или event handler. Не превращайте простой преобразователь массива/форматтер в Hook. Напротив, логику, которая связывает данные с React lifecycle или внешней подпиской, удобно вынести в custom Hook, а чистые алгоритмы держать в отдельной utility.
