# useId

## Interview questions

### useId.
<!-- question-id: 12-react-hooks-mechanics-q14 -->
#### Ответ

useId() выдаёт ID, связанный с позицией Hook-вызова в дереве React, чтобы согласованно связать доступные DOM-элементы: например, input с label и aria-describedby hint/error. Он полезен при SSR/hydration: идентификаторы на сервере и клиенте совпадают, если render-деревья соответствуют друг другу. Вызывать нужно на верхнем уровне компонента/Hook, а не в цикле. У нескольких независимых React roots задайте согласованные уникальные identifierPrefix при серверном render и hydrateRoot, иначе разные приложения могут столкнуться ID. Это не бизнес-ID и не источник случайности; для асинхронных Server Components проверьте поддержку конкретной модели рендеринга. [useId docs](https://react.dev/reference/react/useId).

### Почему useId нельзя использовать как list key?
<!-- question-id: 12-react-hooks-mechanics-q15 -->
#### Ответ

key идентифицирует элемент данных между render-ами одного списка при insert/remove/reorder; он должен происходить из стабильной идентичности item (например, database id). useId отражает место Hook-вызова в дереве компонента для accessibility links, не идентичность строки списка. Генерировать key через useId нельзя: новые/несогласованные ключи при изменениях списка мешают React сопоставлять экземпляры, могут сбрасывать локальный state и не решают reconciliation. Кроме того, Hook нельзя вызывать внутри map по правилам порядка вызовов. Используйте item.id в key, а useId — для id/htmlFor/aria-describedby внутри компонента строки, если нужна уникальная DOM-связь. [React docs](https://react.dev/reference/react/useId).
