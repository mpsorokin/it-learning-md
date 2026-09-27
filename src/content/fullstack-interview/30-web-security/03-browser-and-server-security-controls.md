# Browser and Server Security Controls

## Interview questions

### Secure.
<!-- question-id: 30-web-security-q19 -->

#### Ответ
Атрибут Secure указывает браузеру отправлять cookie только по защищённому HTTPS соединению (есть localhost/browser-specific exceptions, поэтому не используйте их как production модель). Он уменьшает риск утечки по открытому HTTP, но не шифрует значение в хранилище, не защищает от XSS чтения cookie без HttpOnly и не доказывает серверу личность пользователя. Ставьте Secure вместе с HttpOnly/SameSite, включайте HTTPS/HSTS на сайте и убедитесь, что TLS termination и внутренний forwarding доверены. Для WebSocket используйте wss; Secure-cookie не должна полагаться на redirect с HTTP как на единственный транспортный контроль. [MDN cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies).

### SameSite.
<!-- question-id: 30-web-security-q20 -->

#### Ответ
SameSite задаёт, в каком cross-site контексте браузер отправляет cookie: Strict почти исключает её на переходах с другого site; Lax сохраняет основные top-level безопасные навигации, но блокирует многие cross-site subrequest/POST случаи; None разрешает third-party отправку и требует Secure. «Site» — не то же самое, что Origin: sibling subdomain обычно same-site, хотя origin различается; schemeful site также учитывает HTTP/HTTPS. Поэтому SameSite не защищает от уязвимого доверенного sibling host или client-side CSRF и является лишь слоем защиты. Для state changes добавьте CSRF token/Origin checks и запретите мутации на GET. [MDN cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies), [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### Clickjacking.
<!-- question-id: 30-web-security-q21 -->

#### Ответ
Clickjacking (UI redressing) — attacker page встраивает легитимную страницу в frame, скрывает/перекрывает её и заставляет пользователя нажать на элемент, который совершит не то действие, которое пользователь видит. Браузер всё равно прикладывает допустимые credentials, поэтому итогом может быть смена настроек/покупка без XSS. Основная защита — response CSP frame-ancestors 'none' или точный allowlist trusted parents; X-Frame-Options: DENY/SAMEORIGIN можно оставить для совместимости со старым браузером. SameSite помогает в iframe сценариях, но не заменяет запрет embedding для чувствительных страниц. [MDN clickjacking](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Clickjacking).

### frame-ancestors.
<!-- question-id: 30-web-security-q22 -->

#### Ответ
CSP frame-ancestors определяет, какие origin могут встроить текущий документ через frame/iframe/object/embed; проверяется вся цепочка ancestors. Значения вроде 'none', 'self' или явный host allowlist задают запрет/разрешение. Это отличается от frame-src: он регулирует, какие дочерние frames текущая страница сама загружает. У frame-ancestors нет fallback на default-src, и его нельзя задать через meta element — отдавайте response header. При легитимном embedding проверьте каждый parent origin и окружения, иначе policy сломает интеграцию или откроет страницу шире, чем требуется. [MDN frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

### Open redirect.
<!-- question-id: 30-web-security-q23 -->

#### Ответ
Open redirect — приложение принимает контролируемое пользователем destination и перенаправляет туда с доверенного домена; злоумышленник использует брендированный URL для phishing или иногда уводит OAuth/code/token flow. По возможности принимайте внутренний route ID/короткое имя и разрешайте его на сервере. Если URL обязателен, разберите стандартным URL parser, сравните точный normalized origin/host и разрешённый path; избегайте startsWith-проверок, substring/regex denylist, схем //evil, обратных слешей и encoded обходов. Учитывайте редиректы в OAuth — redirect URI должен быть точным. Не отражайте произвольное Location из query. [OWASP Open Redirect](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html).

### SSRF.
<!-- question-id: 30-web-security-q24 -->

#### Ответ
SSRF возникает, когда сервер использует сетевой адрес, контролируемый пользователем, и получает доступ к внутренней сети, loopback, metadata service или локальным обработчикам протоколов. Если назначение известно заранее, принимаю идентификатор интеграции и строю URL сам; разрешаю только нужные host/scheme/port. Для произвольного внешнего URL принимаю только HTTP(S), разбираю его одной библиотекой, отклоняю credentials, неоднозначные формы и IP-адреса, которые не являются публичными; для allowlist доверенных внутренних сервисов использую отдельные явные адреса/CIDR.

Проверки DNS недостаточно: иначе HTTP-клиент может повторно разрешить hostname уже после валидации и подключиться к другому адресу (DNS rebinding). Получаю A и AAAA, проверяю каждый результат и заставляю транспорт подключиться именно к выбранному проверенному IP — через custom DNS lookup/dispatcher либо контролируемый egress proxy, который сам валидирует и pin-ит адрес. При этом исходный hostname сохраняется для HTTP Host, TLS SNI и проверки сертификата. Нельзя отключать проверку TLS или отдельно валидировать адрес, оставляя сетевому клиенту независимый DNS lookup.

Автоматические redirects отключаю. Если redirect нужен по продуктовым требованиям, каждый Location разбираю заново относительно текущего URL, повторяю все host/IP-проверки и pin-ю новый адрес до подключения; ограничиваю число переходов и не пересылаю credentials между origin. На сетевом уровне запрещаю приложению прямой egress к внутренним диапазонам и metadata endpoints. Если трафик обязан идти через proxy, блокирую обход proxy и задаю ту же политику назначения на нём. Дополняю защиту коротким timeout, лимитом ответа и запретом неожиданных content types. [OWASP SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

### SQL Injection.
<!-- question-id: 30-web-security-q25 -->

#### Ответ
SQL injection возникает, когда данные пользователя становятся синтаксисом SQL, например через конкатенацию запроса. Главный контроль — parameterized/prepared queries, где значения передаются отдельно от query; ORM безопасен только при параметризованных API, а raw SQL, identifiers и dynamic sort columns требуют особого внимания. Для имен таблиц/поля/направления сортировки используйте фиксированный allowlist, поскольку bind parameter обычно не заменяет SQL identifier. Least-privilege DB role, ограничения на стороне БД, безопасное исключение ошибок и security tests уменьшают ущерб. Input validation полезна для доменных правил, но не заменяет binding/parameterization. [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

### Prototype pollution.
<!-- question-id: 30-web-security-q26 -->

#### Ответ
Prototype pollution — добавление вредоносных ключей (часто __proto__ или constructor.prototype) в общий prototype через небезопасный deep merge/парсер входного объекта. Это может изменить поведение других объектов и привести к auth/logic bypass, XSS gadget или DoS. Не доверяйте произвольным ключам и вложенным структурам; проверяйте schema и запрещённые ключи, используйте Map для dictionary, Object.create(null) там, где нужен dictionary, и безопасные merge библиотеки. Freeze/disable-proto flags могут быть дополнительным слоем, но не закрывают все пути, например constructor.prototype. Обновляйте уязвимые зависимости и тестируйте merges с неожиданной вложенностью. [OWASP Prototype Pollution](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html).

### Dependency supply-chain risks.
<!-- question-id: 30-web-security-q27 -->

#### Ответ
Supply-chain риск приходит не только из уязвимого npm package: typosquatting/dependency confusion, захват maintainer account, poisoned release/build plugin, postinstall script, stolen CI token или скомпрометированный CDN/build artifact. Сначала инвентаризируйте direct/transitive dependencies и build tools, закрепляйте версии и lockfile с `npm ci`, проверяйте package integrity/provenance/адвайзори и обновляйте review-ом. Ограничьте CI permissions/секреты, изолируйте install scripts где допустимо, разделяйте release credentials и используйте reproducible/provenance artifacts. Audit scanner помогает обнаружить часть известных CVE, но не определяет вредоносную новую публикацию или опасное использование API. Нужен план отзыва версии, ротации CI secrets и rebuild из чистой среды. [OWASP Supply Chain Security](https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html).

