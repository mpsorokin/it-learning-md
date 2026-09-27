# Origin and Content Security Policy

## Interview questions

### CORS.
<!-- question-id: 30-web-security-q01 -->

#### Ответ
CORS — механизм, через который сервер разрешает browser JavaScript читать cross-origin response. Это не серверная аутентификация и не firewall: curl/backend client не ограничен CORS, а простая cross-origin request может быть отправлена даже если браузер потом не даст скрипту прочитать ответ. Для credentialed API верните точный разрешённый Origin, Access-Control-Allow-Credentials: true и Vary: Origin; не отражайте произвольный Origin и не используйте wildcard с credentials. Отдельно авторизуйте запрос и защищайте state-changing операции от CSRF. Preflight разрешает определённые методы/headers, но не является универсальной CSRF защитой. [Fetch Standard](https://fetch.spec.whatwg.org/#http-cors-protocol), [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

### Same-Origin Policy.
<!-- question-id: 30-web-security-q02 -->

#### Ответ
Same-Origin Policy (SOP) изолирует документы и ограничивает cross-origin чтение/взаимодействие веб-страницы с другими origin. Origin — tuple scheme/host/port: изменение любого из трёх делает origin другим; path не участвует. SOP контролирует DOM, storage и доступ к сетевым response, но не блокирует всякую cross-origin загрузку или попытку отправить запрос. CORS разрешает отдельные виды чтения по ответу сервера, postMessage — контролируемую межоконную передачу. SOP не защищает сервер от прямого клиента и не заменяет authorization. [MDN SOP](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy).

### Preflight.
<!-- question-id: 30-web-security-q03 -->

#### Ответ
Preflight — автоматически выполняемый браузером OPTIONS перед фактическим CORS request, если метод/header/content type не входят в safelist. Запрос сообщает Origin, Access-Control-Request-Method и Access-Control-Request-Headers; сервер отвечает разрешёнными origin/method/header и при необходимости max-age, после чего browser решает, отправлять ли actual request и открывать ли response скрипту. Это negotiation браузерной политики, не аутентификация пользователя; native clients могут пропустить его. Simple request не требует preflight, поэтому нельзя строить всю CSRF защиту на требовании OPTIONS. Настраивайте allowlist минимально; не wildcard-ьте методы/headers без необходимости. [Fetch Standard](https://fetch.spec.whatwg.org/#cors-preflight-fetch).

### Simple request.
<!-- question-id: 30-web-security-q04 -->

#### Ответ
«Simple request» — исторический термин CORS для запроса, который не требует preflight: стандартные методы GET/HEAD/POST, safelisted request headers и, для Content-Type, ограниченный набор форматов (application/x-www-form-urlencoded, multipart/form-data, text/plain с ограничениями). Браузер может отправить его cross-origin, а CORS затем решает, доступен ли ответ вызывающему JS. Поэтому форма-запрос может изменить состояние даже при ошибке CORS в консоли; сервер всё равно должен валидировать auth/CSRF. Не принимайте text/plain как JSON и не рассчитывайте, что всякий JSON POST обязательно защищён: endpoint можно вызвать другими клиентами или изменить формат.

### Credentials.
<!-- question-id: 30-web-security-q05 -->

#### Ответ
Для credentialed Fetch нужно явно включить credentials: include (для cross-origin); сервер должен вернуть Access-Control-Allow-Credentials: true и конкретный Access-Control-Allow-Origin — wildcard запрещён для разрешения чтения credentialed response. Если origin выбирается динамически, добавьте Vary: Origin, иначе shared cache может выдать разрешение/ответ не тому origin. Cookies дополнительно подчиняются SameSite, third-party cookie policy и Secure; успешная CORS настройка не заставляет browser отправить cookie вопреки этим правилам. Allowlist точный и минимальный; отражение любого Origin открывает чтение приватных данных любому сайту. CORS не заменяет проверку пользователя и CSRF token.

### CSP.
<!-- question-id: 30-web-security-q06 -->

#### Ответ
Content Security Policy — браузерная политика, обычно переданная Content-Security-Policy response header, которая ограничивает источники скриптов, стилей, соединений, изображений и embedding. Strict CSP на nonce/hash снижает impact некоторых XSS, а frame-ancestors защищает от embedding; Report-Only помогает найти поломки до enforcement. CSP — defense in depth: она не обезвреживает небезопасный HTML, не исправляет уязвимый sink и не авторизует API. Разворачивайте постепенно, собирайте и фильтруйте reports, держите policy route-specific при необходимости и тестируйте реальные аналитические/chunk/script сценарии. `unsafe-inline`/`unsafe-eval` и широкий host allowlist часто сводят защиту на нет. [CSP Level 3](https://www.w3.org/TR/CSP3/), [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

### CSP directives.
<!-- question-id: 30-web-security-q07 -->

#### Ответ
CSP состоит из директив. Fetch directives: default-src как fallback, script-src, style-src, img-src, connect-src, font-src, media-src, object-src. base-uri ограничивает base URL; form-action — куда отправляются формы; frame-src — какие iframe документ сам загружает; frame-ancestors — кто может встроить этот документ; report-uri/report-to/upgrade-insecure-requests решают другие задачи. Не все директивы наследуют default-src: например, frame-ancestors и base-uri нужно задать отдельно. Обычно задают default-src 'self', затем explicit overrides, object-src 'none', base-uri 'self'/'none' и frame-ancestors нужную политику, не считая этот пример универсальной готовой конфигурацией.

### script-src.
<!-- question-id: 30-web-security-q08 -->

#### Ответ
script-src управляет разрешёнными executable scripts: внешними источниками и inline-кодом. При заданном default-src или script-src inline script и eval-like API блокируются, пока политика явно не разрешит их. Предпочтительны response-specific nonce или hash, при необходимости CSP3 strict-dynamic для доверенной загрузочной цепочки; избегайте unsafe-inline, unsafe-eval и широких доменных allowlist, которые можно обойти через разрешённый небезопасный host. nonce/hash должны совпадать именно с доверенным кодом. Добавляйте require-trusted-types-for 'script' как дополнительное ограничение DOM sinks в поддерживающих браузерах. Любая CSP тестируется в Report-Only и в полном browser matrix. [MDN script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).

### nonce.
<!-- question-id: 30-web-security-q09 -->

#### Ответ
CSP nonce — непредсказуемое случайное значение для конкретного ответа; сервер включает его в script-src/style-src и только в собственные доверенные script/style элементы этого HTML. Browser выполняет элемент лишь при совпадении. Один nonce может маркировать несколько легитимных блоков на данной странице, но следующий response должен получить новый nonce; он не является секретом пользователя или CSRF token. Не добавляйте nonce ко всем DOM-вставкам автоматически: так инжектированный скрипт тоже будет разрешён. Nonce-based policy требует динамического ответа и согласованного кеширования header/body; статические страницы удобнее фиксировать CSP hashes. [MDN CSP nonce guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP#nonces).

