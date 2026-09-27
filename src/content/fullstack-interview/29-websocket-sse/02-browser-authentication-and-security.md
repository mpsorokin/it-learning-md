# Browser Authentication and Security

## Interview questions

### Можно ли установить произвольный Authorization header из browser WebSocket constructor?
<!-- question-id: 29-websocket-sse-q11 -->

#### Ответ
Нет. Стандартный WebSocket constructor в браузере принимает URL и optional subprotocol(s), но не объект произвольных HTTP headers. Поэтому нельзя передать `Authorization: Bearer ...` привычным fetch-style параметром; это ограничение browser API, не всего протокола и не нативных WebSocket-клиентов. Не помещайте долговечный токен в query string: URL попадает в proxy/access logs, telemetry и диагностику. Практические варианты: безопасная HttpOnly cookie плюс CSWSH Origin/CSRF защита; краткоживущий одноразовый handshake ticket; или authenticate первым сообщением с очень узкими до-auth полномочиями. Подпротокол не следует использовать как секретный канал. [MDN WebSocket constructor](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket).

### Cookie authentication.
<!-- question-id: 29-websocket-sse-q12 -->

#### Ответ
Cookie auth удобна для browser app: cookie для endpoint автоматически включается в handshake по правилам Domain/Path/Secure/SameSite, а HttpOnly скрывает её от JS. Но ambient credentials создают CSWSH риск: любой сайт может попытаться открыть socket из браузера уже вошедшего пользователя. Сервер обязан сверять Origin с точным allowlist (scheme/host/port), а при необходимости использовать отдельный CSRF token/ticket и SameSite как дополнительный слой. Поддомены могут быть same-site, но разными origins; Wildcard/substr allowlist опасен. Проверяйте сессию при upgrade и права на каждое сообщение/подписку; HTTPS/wss, expiry/revocation и limits сохраняются.

### Query token.
<!-- question-id: 29-websocket-sse-q13 -->

#### Ответ
Токен в query доступен серверам и сетевым посредникам как часть request target: его могут сохранить reverse proxy/access logs, трассировка, monitoring, error reports и developer tooling. TLS защищает содержимое на линии, но не удаляет его из этих логов. Предпочтите cookie с проверенным Origin или endpoint для выдачи одноразового короткоживущего ticket с ограниченной audience/room, который погашается при handshake. Если query неизбежен, токен должен истекать быстро, быть одноразовым/узко scoped; редактируйте URL в логах до записи и никогда не повторно используйте refresh/long-lived bearer token. Подписывание URL не отменяет утечки.

### First-message authentication.
<!-- question-id: 29-websocket-sse-q14 -->

#### Ответ
First-message authentication: разрешить handshake, но пометить socket как unauthenticated и в короткий deadline требовать первый auth frame. До успешной проверки нельзя подписывать пользователя на комнаты, читать/отправлять domain events или расходовать дорогие ресурсы; ограничьте frame size/rate и число pending connections. На неверный token немедленно закрыть канал безопасным кодом, не сообщая лишнее. После auth проверяйте authorization каждого следующего event и expiry/revocation. Этот дизайн обходит ограничение browser constructor на custom headers, но токен всё равно может попасть в application/message logs; запретите logging payload, используйте TLS и короткоживший credential. Рассчитайте DDoS стоимость анонимных открытых sockets.

### Security trade-offs.
<!-- question-id: 29-websocket-sse-q15 -->

#### Ответ
Выбор зависит от браузерного клиента, CSRF и логирования. Cookie проще интегрировать и защищает секрет от чтения JS при HttpOnly, но browser посылает её автоматически — нужен строгий Origin allowlist и CSWSH защита. Одноразовый query ticket прост для подключения, но у URL выше риск попадания в логи; он должен быть короткоживущим, scoped и одноразовым. First-frame token избегает URL, но до его принятия сервер держит unauthenticated соединение. Нативные клиенты могут посылать Authorization header, browser API — нет. Во всех случаях шифруйте wss, повторно проверяйте authz и лимитируйте соединения/messages; TLS и секретный subprotocol не заменяют разрешений.

