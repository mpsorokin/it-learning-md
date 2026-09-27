# Purity and component lifecycle

## Interview questions

### Почему render function должна быть pure?
<!-- question-id: 08-react-rendering-model-q27 -->
#### Ответ

Render-функция должна быть pure: для одних props, state и context возвращать эквивалентный UI и не мутировать внешние данные. React может вызвать её повторно, поменять приоритет, прервать или отбросить результат; side effect во время render способен выполниться дважды или для дерева, которое никогда не было показано. В Strict Mode дополнительные вызовы development-only помогают обнаружить нарушение purity.

Pure render делает предсказуемыми reconciliation, concurrent rendering, server rendering и memoization. Сеть, подписки, timers и imperative DOM выполняют в event handler или effect с корректным cleanup. Не мутируйте props/state: immutable update сохраняет предыдущий snapshot и позволяет сравнивать identity.

«Функция чистая» не означает, что в ней запрещены все вычисления: локальные временные объекты и детерминированное форматирование допустимы. Главное — не иметь внешних наблюдаемых side effects и не зависеть от случайных/меняющихся источников без включения их в модель входов.

### Что происходит при unmount?
<!-- question-id: 08-react-rendering-model-q28 -->
#### Ответ

Когда ветка удаляется из React tree или заменяется компонентом другой identity, React unmount-ит её: теряется принадлежащий ей state, refs обнуляются, запускается cleanup установленных Effects/layout Effects и class lifecycle (если применимо), удаляются её host nodes. При повторном появлении компонент монтируется заново с initial state.

Скрытие через CSS не является unmount: компонент продолжает существовать и может удерживать state, подписки и память. Снятие с DOM и lifecycle-поведение зависят от того, остаётся ли ветка в React tree. В React 19.2+ компонент [`Activity`](https://react.dev/reference/react/Activity) может скрывать UI, сохраняя state, но очищая Effects; это не обычное удаление компонента.

В development Strict Mode React может повторно запускать render и цикл setup/cleanup эффектов, чтобы выявить недостаточный cleanup; это диагностическое поведение не означает реальный пользовательский unmount. Cleanup должен быть идемпотентным и освобождать listener, timer, subscription или abortable operation.

### Почему state привязан к position в tree?
<!-- question-id: 08-react-rendering-model-q29 -->
#### Ответ

React связывает state не с JSX-объектом и не просто с именем функции, а с позицией/identity компонента в отрендеренном UI tree. Родитель, тип ребёнка и key среди siblings определяют, продолжает ли следующий render тот же компонент. Два `<Counter />` в разных местах получают независимый state; тот же тип и key на прежней позиции обычно сохраняют его.

Если ветка удалена, её state уничтожается; если по тому же адресу пришёл другой тип или новый key, React создаёт новую identity. Поэтому условный JSX может сохранить или сбросить state в зависимости от итоговой структуры дерева, а не от строки source code. Нестабильный key или функция компонента, объявленная внутри родителя и создаваемая заново, может неожиданно remount-ить детей.

Для hooks дополнительно действует правило неизменного порядка вызовов: React сопоставляет hook state по последовательности hooks внутри component identity. Нельзя вызывать hook в условии/цикле.

### Как заставить React reset state?
<!-- question-id: 08-react-rendering-model-q30 -->
#### Ответ

Самый ясный способ сбросить состояние всего поддерева — дать ему новый key, когда меняется entity/контекст, который задаёт новую identity. Например:

    function UserEditor({ userId }: { userId: string }) {
      return <Editor key={userId} userId={userId} />;
    }

При смене `userId` React размонтирует старый Editor, запускает cleanup, очищает локальный state и монтирует новый. Это удобнее, чем вручную сбрасывать десятки полей в Effect, который может показать промежуточный state и создать лишний render.

Key нужно строить из значения, определяющего именно lifetime формы; нестабильный key сбрасывает её на каждый render. Если часть состояния должна переживать смену, вынесите её выше и передайте как prop/controlled value. Можно также условно удалить ветку или отрендерить другой component type, но key явнее выражает требуемый reset.
