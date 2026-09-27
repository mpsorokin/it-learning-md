# React Compiler and manual memoization

## Interview questions

### React Compiler и роль manual memoization.
<!-- question-id: 13-react-memoization-performance-q15 -->
#### Ответ

В проектном допущении React 19.2.8 важно разделять React runtime и React Compiler: версия React сама по себе не включает compiler. Это отдельный build-time инструмент/плагин, который должен быть установлен и настроен в сборке. При включении он анализирует компонентный код и автоматически вставляет кеширование значений, JSX и функций, чтобы сократить cascading renders и повторные вычисления; compiler не делает все внешние функции глобально memoized и не убирает стоимость сети, DOM, layout или работы, которую приложение действительно должно выполнить.

Ручные `memo`, `useMemo`, `useCallback` по-прежнему существуют. Без compiler они — явный способ поставить оптимизационную границу; с compiler их обычно нужно меньше, но они могут оставаться escape hatch, например когда нужна контролируемая identity для Effect dependency или API. Не удаляйте существующие мемоизации вслепую: compiler может анализировать их как часть графа, а изменение может изменить частоту Effect или поведение кода, нарушающего Rules of React.

Production adoption требует корректной purity/immutability, lint diagnostics, tests и постепенной проверки compiled output, React DevTools Profiler и реальных метрик. В текущем проекте, если build plugin не установлен/не включён, исходите из обычной ручной семантики React. React Compiler 1.0 был объявлен отдельно 7 октября 2025 года; эта ссылка нужна как версия build tool, а не как утверждение о «самой новой React». [React Compiler: что делает и как подключается](https://react.dev/learn/react-compiler/introduction), [объявление Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1).
