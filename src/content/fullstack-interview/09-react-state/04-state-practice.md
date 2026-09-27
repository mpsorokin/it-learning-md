# State practice

## Interview questions

### counter с несколькими updates;
<!-- question-id: 09-react-state-task01 -->
#### Ответ

Обе операции используют одно и то же значение из snapshot текущего render-а, поэтому прямое `setCount(count + 1)` дважды обычно поставит один replacement value. Для последовательных изменений используйте functional updater:

    import { useState } from 'react';

    function Counter() {
      const [count, setCount] = useState(0);

      function incrementTwice() {
        setCount(current => current + 1);
        setCount(current => current + 1);
      }

      return <button onClick={incrementTwice}>Count: {count}</button>;
    }

React применит два updater-а по очереди к pending state, а batching обычно приведёт к одному итоговому commit-у. Updater должен оставаться pure; нельзя в нём делать `count++` или побочный эффект. Если требовалось установить конкретное значение, независимое от предыдущего, прямой setter уместен.

### form reducer;
<!-- question-id: 09-react-state-task02 -->
#### Ответ

Reducer группирует form values, validation и submission status в одну согласованную модель. Reducer остаётся pure и не отправляет запрос; event handler валидирует текущий snapshot и запускает I/O, затем dispatch-ит результат. Для краткости пример обрабатывает name/email и смену одного поля.

    type Values = { name: string; email: string };
    type Errors = Partial<Record<keyof Values, string>>;
    type FormState = {
      values: Values;
      errors: Errors;
      status: 'editing' | 'submitting' | 'success' | 'failure';
    };
    type Action =
      | { type: 'fieldChanged'; field: keyof Values; value: string }
      | { type: 'validationFailed'; errors: Errors }
      | { type: 'submissionStarted' }
      | { type: 'submissionSucceeded' }
      | { type: 'submissionFailed' };

    const initialState: FormState = {
      values: { name: '', email: '' }, errors: {}, status: 'editing',
    };

    function formReducer(state: FormState, action: Action): FormState {
      switch (action.type) {
        case 'fieldChanged': {
          const errors = { ...state.errors };
          delete errors[action.field];
          return {
            ...state,
            values: { ...state.values, [action.field]: action.value },
            errors,
            status: 'editing',
          };
        }
        case 'validationFailed':
          return { ...state, errors: action.errors, status: 'editing' };
        case 'submissionStarted':
          return { ...state, errors: {}, status: 'submitting' };
        case 'submissionSucceeded':
          return { ...state, status: 'success' };
        case 'submissionFailed':
          return { ...state, status: 'failure' };
      }
    }

Перед submit вычислите `errors = validate(state.values)`: если они есть — dispatch `validationFailed`; иначе dispatch `submissionStarted`, `await save(state.values)`, затем dispatch success/failure. Пока статус submitting, заблокируйте повторную отправку или задайте idempotency policy. Для конкурентных submissions добавьте request id/AbortController, чтобы устаревший ответ не перезаписал новый. Поля и значения остаются immutably updated.

### refactor state explosion;
<!-- question-id: 09-react-state-task03 -->
#### Ответ

Без конкретного компонента нельзя определить, какие именно поля следует объединить; сначала перечислите все boolean flags и найдите невозможные комбинации/источники истины. Типичный пример — `isLoading`, `hasData`, `hasError`, `isEmpty`, где при произвольной комбинации flags возможны одновременно «loading» и «success».

Смоделируйте mutually exclusive lifecycle discriminated union-ом:

    type ResultState<T> =
      | { status: 'idle' }
      | { status: 'loading' }
      | { status: 'success'; data: T }
      | { status: 'error'; error: Error };

    const [result, setResult] = useState<ResultState<User[]>>({ status: 'idle' });

Теперь `data` существует только в success, `error` — в error; TypeScript сужает вариант по status. Независимые UI-флаги (`isDialogOpen`) оставьте отдельно, а вычисляемые значения вроде `canSubmit` вычисляйте из текущего state/props. Если переходов много, оформите reducer, который явно задаёт допустимые actions. Так сокращается state explosion и состояние становится проверяемым.

### убрать duplicated/derived state.
<!-- question-id: 09-react-state-task04 -->
#### Ответ

Сначала отметьте, какие поля — source of truth, а какие полностью выводятся из них. Удалите хранимые копии типа `completedCount`, `isAllSelected` или `filteredItems`, если их можно однозначно вычислить из массива и filter selection. Иначе setter-ы и Effects должны синхронизировать дубликаты, и при одном пропущенном пути UI устаревает.

    const [todos, setTodos] = useState<Todo[]>(initialTodos);
    const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
    const completedCount = todos.filter(todo => todo.done).length;
    const visibleTodos = todos.filter(todo =>
      filter === 'all' || (filter === 'done' ? todo.done : !todo.done),
    );

`useMemo` можно добавить только если профилировщик показывает значимую цену и dependencies заданы корректно; кеш — performance optimization, не дополнительный authoritative state. Сохраняйте копию лишь при отдельном lifecycle, например editable draft до Save, и определите явное применение/reset. После рефакторинга проверьте каждый transition: edit, reset, submit, load и переключение owner-а.
