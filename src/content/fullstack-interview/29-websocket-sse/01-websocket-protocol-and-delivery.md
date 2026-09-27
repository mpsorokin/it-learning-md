# WebSocket Protocol and Delivery

## Interview questions

### WebSocket handshake.
<!-- question-id: 29-websocket-sse-q01 -->

#### Ответ
В классическом browser handshake по RFC 6455 клиент открывает HTTP/1.1 GET с Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Key (случайное 16-байтовое значение в Base64), Sec-WebSocket-Version: 13 и, если есть, Origin/subprotocol/extensions. Сервер проверяет запрос и отвечает 101 Switching Protocols с рассчитанным Sec-WebSocket-Accept; после этого соединение переключается на WebSocket framing поверх того же TCP/TLS соединения. Sec-WebSocket-Key/Accept доказывает корректность handshake, но не аутентифицирует пользователя и не шифрует канал — для конфиденциальности используется wss. В HTTP/2 есть отдельный механизм Extended CONNECT (RFC 8441), так что буквальный Upgrade/101 описывает классический HTTP/1.1 путь, не все transport deployments. [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455), [RFC 8441](https://www.rfc-editor.org/rfc/rfc8441).

### HTTP → Upgrade.
<!-- question-id: 29-websocket-sse-q02 -->

#### Ответ
В HTTP/1.1 клиент начинает обычным GET и просит protocol switch заголовками Upgrade и Connection; сервер подтверждает 101, затем двусторонний поток использует WebSocket frames, а не HTTP request/response для каждого сообщения. Это экономит повторный HTTP overhead и оставляет один низколатентный канал, но требует долгоживущего соединения и отдельного управления reconnect, аутентификацией, порядком и backpressure. По RFC 8441 HTTP/2 может переносить WebSocket через Extended CONNECT, без классического 101 Upgrade; наличие поддержки зависит от браузера, прокси и сервера. Не считайте заголовки handshake подтверждением authz: сервер должен проверить сессию, Origin и разрешения.

### WS vs HTTP.
<!-- question-id: 29-websocket-sse-q03 -->

#### Ответ
HTTP-модель — отдельные конечные запросы/ответы: она хорошо подходит для CRUD, кэширования, прокси, retries и stateless handlers, но частые обновления требуют polling/дополнительного протокола. WebSocket после handshake держит двунаправленное соединение и сервер может отправить сообщение без запроса; это подходит для интерактивного realtime, но connection state, масштабирование, сетевые idle timeouts, реконнект и доставка становятся задачей приложения. У WebSocket нет HTTP caching/status на каждое app-сообщение; для observability задавайте message schema, correlation IDs и метрики. Наличие постоянного канала не делает обмен надёжным после разрыва и не отменяет application ACK/идемпотентность.

### WS vs SSE.
<!-- question-id: 29-websocket-sse-q04 -->

#### Ответ
WebSocket — двунаправленный канал, может передавать text/binary, требует протокола сообщений, heartbeats, authz и reconnect-логики. SSE — однонаправленный server-to-browser поток HTTP с text/event-stream: проще для notifications/feeds, имеет встроенный EventSource reconnect и Last-Event-ID, но для client→server отправки всё равно нужен fetch/HTTP. EventSource API ограничен GET/набором настроек и не позволяет произвольно задавать headers; WS handshake в браузере тоже имеет ограничения. SSE удобно за прокси и через HTTP/2, но остаётся долгоживущим соединением с buffering/idle-timeout нюансами. Выбирайте по направлению данных, frequency, replay и инфраструктуре, а не по слову «real-time». [WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html).

### SSE limitations.
<!-- question-id: 29-websocket-sse-q05 -->

#### Ответ
SSE передаёт только сервер → клиент, формат — UTF-8 текстовые события; для двунаправленного интерактивного обмена нужен отдельный HTTP endpoint или WebSocket. EventSource — специализированный API: нельзя свободно выбрать метод и произвольные request headers, что усложняет Bearer auth; есть withCredentials для CORS cookies, но это требует строгих origin правил. Доставка/повтор событий не является durable log: браузер reconnect-ится и может отправить Last-Event-ID, но backend обязан хранить и переигрывать события. Через HTTP/1.1 у браузеров исторически бывают низкие per-origin connection limits; HTTP/2 мультиплексирует streams, но реальные лимиты и proxy timeout зависят от браузера/infra. [WHATWG](https://html.spec.whatwg.org/multipage/server-sent-events.html), [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource).

### Heartbeats.
<!-- question-id: 29-websocket-sse-q06 -->

#### Ответ
Heartbeat обнаруживает idle/dead connection до того, как LB/NAT/proxy молча удалит её, и освобождает зависшее состояние. В RFC 6455 Ping должен получить Pong, если peer ещё не закрылся; heartbeat интервал задают ниже минимального idle timeout инфраструктуры с запасом, учитывая jitter и масштаб. Browser WebSocket API не даёт JS отправлять protocol Ping/Pong frame, поэтому браузерный клиент обычно отвечает на прикладное ping-сообщение или сервер сам ведёт frame-level ping. Для SSE отправляют комментарий keepalive, чтобы промежуточный proxy видел байты; это не подтверждение, что UI обработал событие. Метрики нужны по heartbeat RTT, missed beats и закрытиям; слишком частые heartbeat расходуют батарею/сеть.

### Reconnect.
<!-- question-id: 29-websocket-sse-q07 -->

#### Ответ
WebSocket браузерный API не переподключается автоматически. Реализуйте конечный state machine: закрыто → попытка → открыто → backoff при transient failure; exponential delay с jitter и пределом, offline/visibility handling, корректную отмену и ограниченный send queue. После нового соединения повторно аутентифицируйтесь и подписывайтесь; для восстановления пропущенных событий передавайте durable cursor/sequence и дедуплицируйте replay. Не retry-те навсегда отказ auth/protocol; разберите close code, refresh сессии и server overload. EventSource автоматически reconnect-ится, принимает `retry:` и отправляет Last-Event-ID при наличии id, но application replay должен выполнить сам сервер; протокол не обещает сохранённую историю или exactly-once. [WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html).

### Message ordering.
<!-- question-id: 29-websocket-sse-q08 -->

#### Ответ
В пределах одного открытого WebSocket/TCP соединения сообщения наблюдаются упорядоченно в направлении отправителя; RFC 6455 также требует доставлять фрагменты одного сообщения в порядке. Это не задаёт глобальный порядок между пользователями, соединениями, backend-инстансами или параллельными обработчиками. Несколько producers могут race, а async consumer — завершить обработку не в порядке прихода. Если бизнесу нужен порядок, выдавайте sequence per room/partition в одном sequencer/partition log, сохраняйте cursor и проверяйте gap; не обещайте total order по всей системе без единого bottleneck. При reconnect определите, как sequence/replay сочетаются с уже полученными событиями.

### Delivery guarantees.
<!-- question-id: 29-websocket-sse-q09 -->

#### Ответ
WebSocket даёт транспортную упорядоченную доставку пока TCP connection жив, но протокол не подтверждает, что приложение обработало или записало message, и не гарантирует доставку после разрыва. Если клиент не знает, успел ли сервер commit перед обрывом, retry может дать duplicate; если не retry — возможен loss. «Exactly once» обычно реализуется как at-least-once replay + idempotency/deduplication с durable event ID, ACK только после commit и курсором. SSE browser reconnect/Last-Event-ID помогает запросить продолжение, но только если server хранит события, IDs стабильны и replay атомарно покрывает race; это тоже не exactly-once processing. Heartbeat/Pong подтверждает liveness, не бизнес-обработку. Redis Pub/Sub тоже at-most-once, в отличие от Streams для persistence/replay.

### Authentication WebSocket.
<!-- question-id: 29-websocket-sse-q10 -->

#### Ответ
Для cookie session браузер приложит cookie к допустимому handshake, поэтому проверяйте сессию и явный allowlist Origin до upgrade — иначе возможен cross-site WebSocket hijacking. Проверка Origin важна, но не является аутентификацией: non-browser clients могут подделать заголовок. Авторизуйте каждого subscribe/send по channel/resource, ограничивайте срок соединения, размер сообщений, частоту и число соединений; учитывайте logout/revocation и expiry во время долгого connection. Для bearer credential используйте короткоживущий одноразовый ticket либо auth в первом сообщении до разрешения любых операций. Передавайте только через wss; токены/сообщения не записывайте в access logs. [OWASP WebSocket Security](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html).

