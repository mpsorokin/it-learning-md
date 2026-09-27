# Refs and imperative APIs

## Interview questions

### useRef.
<!-- question-id: 12-react-hooks-mechanics-q08 -->
#### Ответ

useRef(initialValue) возвращает стабильный объект { current }, который React сохраняет между render-ами этого экземпляра компонента. Изменяемое поле позволяет хранить mutable значение, не являющееся частью отображаемого state: DOM node, timer ID, imperative handle или предыдущий request token. Изменение current не уведомляет React и не вызывает rerender; при этом начальное выражение аргумента вычисляется при каждом вызове компонента, хотя React сохраняет только первое значение, поэтому дорогой объект инициализируйте лениво по проверке null, выполняя предсказуемую инициализацию. Не читайте/не мутируйте ref во время обычного render, кроме этого init-паттерна: это нарушает purity. [useRef docs](https://react.dev/reference/react/useRef).

### Изменение ref вызывает rerender?
<!-- question-id: 12-react-hooks-mechanics-q09 -->
#### Ответ

Нет. ref — обычный mutable JavaScript object; присваивание ref.current = value не проходит через React state queue, поэтому React не ставит render в очередь и UI не обновляется. Если отобразить ref.current в JSX, после мутации DOM останется прежним до какого-то другого render, а затем отразит случайно актуальное значение. State нужен для данных, влияющих на JSX; ref — для непрозрачных ресурсов/координации, не влияющих на отображение. Внешний код может вручную вызвать root.render, но это отдельный механизм и не реакция на ref. См. [React useRef](https://react.dev/reference/react/useRef).

### Когда ref лучше state?
<!-- question-id: 12-react-hooks-mechanics-q10 -->
#### Ответ

Ref лучше state, когда React не должен пересчитывать/перерисовывать интерфейс при изменении значения: interval/timeout ID, объект WebSocket, AbortController, DOM reference или техническая отметка generation. Ref переживает rerender, а локальная переменная была бы создана заново. Если число таймера, текущий tab или результат нужно показать пользователю, храните это в state; скрывать UI state в ref приводит к несогласованности. Не используйте ref вместо state ради performance до измерения, и не полагайтесь на мутацию ref как на поток данных между компонентами — передавайте нужное через props/context.

### DOM refs.
<!-- question-id: 12-react-hooks-mechanics-q11 -->
#### Ответ

Для DOM reference создайте useRef<HTMLButtonElement | null>(null) и передайте объект в ref JSX-узла. До commit (включая server render) current равен null; когда React вставляет DOM node, назначает его в current, а при удалении очищает. Читать node для focus/scroll/measure можно в event handler или Effect; геометрию, необходимую до paint, измеряйте в useLayoutEffect. Не управляйте DOM вручную там, где declarative props достаточно, иначе React и сторонняя мутация могут конфликтовать. Для коллекции элементов используйте callback refs/map, с cleanup и учётом повторного attach/detach в dev StrictMode. [Manipulating the DOM](https://react.dev/learn/manipulating-the-dom-with-refs).

### forwardRef.
<!-- question-id: 12-react-hooks-mechanics-q12 -->
#### Ответ

До React 19 функция-компонент не получала ref как обычный prop, поэтому forwardRef(render) создавал компонент, которому React передавал ref вторым аргументом; его применяют и в библиотеках с поддержкой React 18 и ниже. Начиная с React 19 ref доступен как prop и новый код может передать его прямо дочернему DOM/API компоненту; официальная документация говорит, что forwardRef станет deprecated в будущем. Это важно для совместимости: библиотека выбирает экспорт/типы согласно минимальной версии React peer dependency, а не заменяет API молча, если поддерживает старые consumers. Ref остаётся escape hatch; публичный компонент часто должен expose ограниченный imperative handle или вообще declarative props. [forwardRef docs](https://react.dev/reference/react/forwardRef), [React 19](https://react.dev/blog/2024/12/05/react-19).

### useImperativeHandle.
<!-- question-id: 12-react-hooks-mechanics-q13 -->
#### Ответ

useImperativeHandle(ref, createHandle, dependencies) позволяет компоненту задать значение, которое увидит parent через ref, вместо прямого доступа к внутреннему DOM или instance. Например, expose методы focus() и scrollToError(), сохранив закрытый inputRef; так родитель получает минимальный imperative surface. createHandle пересоздаётся при изменении перечисленных dependencies, сравниваемых Object.is; все reactive values внутри должны быть указаны. В React 18 и ранее ref обычно приходит через forwardRef, с React 19 его можно получить как prop. Не используйте это для обычных состояний open/disabled, которые проще и предсказуемее передавать как props; не делайте лишние методы, раскрывающие внутреннюю реализацию. [useImperativeHandle](https://react.dev/reference/react/useImperativeHandle).
