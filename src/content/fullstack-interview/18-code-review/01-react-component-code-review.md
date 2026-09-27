# React component code review

## Interview questions

### Берём плохой component с:
<!-- question-id: 18-code-review-q01 -->

```text
- неправильным useEffect;
- conditional hooks;
- broken dependency array;
- stale closure;
- неправильным reduce;
- missing response.json();
- race condition;
- missing cleanup;
- unstable functions;
- плохими keys;
- duplicated state;
- отсутствием loading/error;
- unnecessary rerenders;

И идём:
найти проблему → объяснить mechanism → исправить → объяснить production consequences.
```

#### Ответ

Без конкретного исходного компонента ревью идёт по его наблюдаемому контракту: сначала воспроизвести баг и определить пользовательский риск, затем исправлять первопричины в порядке correctness → lifecycle → data flow → performance. Conditional Hook — блокер: Hook может вызываться только в стабильном порядке на каждом render; условную ветвь следует перенести внутрь Hook/Effect или разнести на компоненты. Broken dependency array исправляют исходя из синхронизируемой внешней системы, а не добавлением пустого массива; все reactive values должны быть перечислены или код нужно переписать так, чтобы значение перестало быть reactive dependency. Stable function и useMemo нужны только если есть измеренное поведение/контракт ссылки, а не для маскировки неправильной зависимости.

У fetch проверяют каждый слой: URL и query params закодированы, fetch не считает HTTP 4xx/5xx rejection, поэтому response.ok должен дать ошибку, response.json() нужно await-ить, а unknown payload — валидировать на API boundary. Эффект очистки должен отменять запрос и игнорировать late result, иначе быстрая смена параметра создаёт race и устаревшие данные затирают актуальные. Cleanup не делает запрос безопасным для backend side effect. Показать надо состояния начального ожидания, background refetch, error, empty и retry; ошибку загрузки не следует превращать в пустой список. Для reduce передают initial accumulator и возвращают его из callback; для list используют стабильный ID key, иначе reconciliation может переместить локальное состояние строки не к тому элементу. Дублированное state заменяют вычисляемым значением, если оно полностью выводится из props/query/state.

Критичность выше у неверных данных, утечки между пользователями, двойной записи и crash; unnecessary rerender обычно ниже, пока profiler не докажет влияние. Ревьюер должен не только отметить строку, но объяснить механизм, минимальный fix, регрессионный тест и production consequence. Если участок слишком большой для безопасного исправления, разделить refactor и behavior change на отдельные PR. На реальном patch я бы попросил тесты на conditional render, 4xx, malformed JSON, смену ID с ответами в обратном порядке, unmount/cleanup и empty state. После выкладки наблюдал бы client error rate, latency, повторные вызовы API и ключевые пользовательские действия. Улучшение производительности проверяется React Profiler до/после, а не количеством добавленных memo.

Корректный fetch slice для одного client-only запроса может выглядеть так; импортировать useEffect/useState из React и вывести тип/валидатор ответа в API-модуль:

    useEffect(() => {
      const controller = new AbortController();
      let active = true;
      setStatus("loading");
      setError(null);

      async function load() {
        try {
          const response = await fetch("/api/items?owner=" + encodeURIComponent(ownerId), {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("HTTP " + response.status);
          const payload: unknown = await response.json();
          const items = parseItems(payload);
          if (active) {
            setItems(items);
            setStatus(items.length === 0 ? "empty" : "success");
          }
        } catch (error) {
          if (
            active &&
            !(error instanceof DOMException && error.name === "AbortError")
          ) {
            setError(toDisplayError(error));
            setStatus("error");
          }
        }
      }

      void load();
      return () => {
        active = false;
        controller.abort();
      };
    }, [ownerId]);

Это лишь локальный образец. Если данные разделяются между экранами или нужны cache/retry/invalidation, вместо расширения Effect логичнее использовать route data layer или query cache. В React 19.2.8 Effect cleanup выполняется перед повторным setup с новыми dependencies и при unmount; в development Strict Mode дополнительный setup/cleanup цикл проверяет симметрию. [Официальное описание useEffect](https://react.dev/reference/react/useEffect).
