# Nest CQRS Flow

## Interview questions

### Сделать простой Nest CQRS flow.
<!-- question-id: 35-cqrs-task01 -->

#### Ответ

Для локального сценария подключаю `CqrsModule.forRoot()` в модуле и регистрирую обработчики как providers. HTTP controller валидирует DTO и передаёт `new PlaceOrderCommand(...)` в `CommandBus.execute`; command описывает намерение и содержит только нужные данные. `@CommandHandler(PlaceOrderCommand)` загружает `Order` через repository, вызывает доменный метод, сохраняет агрегат в транзакции и возвращает ID/результат. Для чтения контроллер отправляет `GetOrderQuery` через `QueryBus`; `@QueryHandler` строит DTO, не меняя агрегат.

При доменном изменении модель может накопить события; handler связывает root с `EventPublisher`, сохраняет изменение, затем вызывает `commit()` для локального `EventBus`. Зарегистрированный `@EventsHandler` обновляет проекцию или инициирует следующий шаг. В Nest event handlers работают вне обычного HTTP request lifecycle: исключение нужно явно обработать, повтор и мониторинг определить отдельно; HTTP-ответ клиенту возвращает command handler, а не event handler. Для многошагового процесса можно использовать saga, которая переводит события в новые команды.

Это in-process flow, а не готовая гарантия доставки между сервисами. Если событие должно пережить падение процесса между commit БД и publish, записываю outbox-запись в ту же транзакцию и отдельным relay публикую её; внешние consumers идемпотентны и имеют retry/DLQ. Сериализую событие стабильным версионируемым контрактом, передаю trace/correlation context, проверяю авторизацию до команды и фиксирую результаты/ошибки. Транзакционность сохранения root и outbox задаёт persistence-слой; простой вызов `commit()` CQRS EventBus сам её не обеспечивает.
