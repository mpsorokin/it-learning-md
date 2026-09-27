# Security Incident Scenarios

## Interview questions

### украденный JWT
<!-- question-id: 30-web-security-task01 -->

Разбираем:

#### Ответ
Считать токен скомпрометированным и действовать по blast radius, не предполагая, что JWT можно «отозвать» сам по себе. Сначала подтвердить сигнал и сохранить временную линию: issuer/audience/jti/срок, user/session, IP/device и логи использования (никогда не копировать сам token в тикет или обычный лог). Немедленно закрыть affected refresh/session family, отозвать refresh token, заблокировать user/session или jti на resource servers до expiry; при подозрительном аккаунте сбросить credential и потребовать повторную аутентификацию. Перевыпускайте signing key только если скомпрометирован ключ/issuer, так как это инвалидирует весь пул токенов и создаёт большой operational blast radius. Определить источник утечки — browser storage, URL, logs, CDN, CI — и закрыть его; проверить привилегированные действия, предупредить владельца данных по процедуре организации, восстановить доступ из чистого состояния и добавить краткий TTL, least privilege, refresh rotation/sender constraint и мониторинг replay. Вывод: stateless access JWT без denylist/versioning обычно нельзя мгновенно отозвать. [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), [NIST IR Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final).

### malicious script
<!-- question-id: 30-web-security-task02 -->

Разбираем:

#### Ответ
Предположить выполнение кода в origin приложения, пока доказательства не сузят сценарий. Остановить подачу скрипта: отключить vendor/integration или отдать emergency CSP block конкретного script source/hash, откатить проверенный build, purge CDN/service-worker caches и устранить injection path. Сохранить access/deploy/CSP reports, но исключить секреты из копий; определить окно экспозиции, получателей, доступные данные и совершённые от имени пользователей действия. Считать доступные JavaScript токены/PII потенциально прочитанными: revoke sessions/tokens подходящего scope и исправить хранение. Затем локализовать точный sink/source, безопасно кодировать/санитизировать вывод, добавить CSP/Trusted Types как defense-in-depth, покрыть regression tests, восстановить чистый релиз и наблюдать reports/ошибки. CSP block может сломать легитимные bundles, поэтому сначала оценить affected assets, но containment не откладывать при активной эксфильтрации. Зафиксировать решение и lessons в incident record. [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

### compromised CDN
<!-- question-id: 30-web-security-task03 -->

Разбираем:

#### Ответ
Считать доставляемый JS с CDN исполнением с полномочиями origin приложения: он потенциально может читать DOM, отправлять authenticated API requests и менять поведение UI. Немедленно остановить загрузку подозрительного host/version (удалить tag или временно заблокировать через CSP), переключить critical assets на проверенную origin/build и purge CDN edge cache; откатить/приостановить deploy, сохранив response headers, artifact hashes, provider/deploy logs и sample без загрузки/исполнения в production browser. Определить, был ли скомпрометирован аккаунт/CDN origin/build pipeline, какие страницы и пользователи получили asset и какие client-side данные были доступны; отозвать/rotate все потенциально exposed credentials/tokens. SRI помогает только если ожидаемый hash не обновлялся атакующим, а CSP полезна как независимая allowlist/nonce policy; проверить также service workers и other third-party scripts. Восстановить из immutable подписанного build и проверить origin/CDN integrity, доступы и audit trail. [MDN SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity), [NIST IR](https://csrc.nist.gov/pubs/sp/800/61/r3/final).

### CORS misconfiguration
<!-- question-id: 30-web-security-task04 -->

Разбираем:

#### Ответ
Сначала установить точную конфигурацию: отражает ли API любой Origin, разрешены ли credentials, есть ли wildcard, какой endpoint/body data доступны, присутствует ли Vary: Origin/cache behavior и реально посылает ли victim browser cookies. Быстро заменить reflection на точный allowlist, отключить credentialed CORS там, где он не нужен, удалить старые edge caches и проверить, что shared cache не переиспользует allow response между origin. Если конфигурация позволила чужому JS читать приватные responses с пользовательскими credentials, это инцидент конфиденциальности: сохранить CORS/API/auth logs без копирования токенов, определить чувствительные поля, временно ограничить endpoint/revoke затронутые credentials по оценке риска и пройти процедуру уведомления. Если был только ACAO: *, но credentials запрещены и данные публичны, риск другой; не преувеличивать воздействие. CORS не равен CSRF: проверить state-changing простые requests отдельно и исправить authz/CSRF защиты. Добавить allowlist tests и мониторинг Origin mismatch. [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [NIST IR](https://csrc.nist.gov/pubs/sp/800/61/r3/final).

### CSRF на cookie auth
<!-- question-id: 30-web-security-task05 -->

Разбираем:

#### Ответ
Воспроизвести только в тестовой среде и определить affected state-changing routes, методы и session-cookie policy. Немедленно сделать GET read-only, для mutations требовать POST/PUT/PATCH/DELETE, а затем проверять synchronizer CSRF token (или корректный double-submit/custom-header flow), Origin/Referer/Fetch Metadata; установить SameSite Lax/Strict как дополнительный слой и убедиться, что credentialed CORS не разрешает attacker origin. SameSite не закрывает все сценарии — особенно same-site sibling subdomain/client-side CSRF. Review recent audit records за нежелательные переводы/изменения, откатить только доказанные действия через auditable workflow, сообщить затронутым пользователям/командам согласно процедуре. Не логировать CSRF/session tokens, но сохранить request metadata и idempotent operation IDs. Добавить e2e тесты через cross-origin form/simple request и проверку, что защиту нельзя обойти вторым endpoint. [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### XSS + localStorage token
<!-- question-id: 30-web-security-task06 -->

Разбираем:

#### Ответ
Исходить из того, что XSS могла прочитать bearer token из localStorage и отправить его злоумышленнику; удаление вредоносного скрипта само по себе не делает украденные копии недействительными. Сначала локализовать/исправить injection source и остановить исполнение, затем отозвать активные access/refresh tokens или server sessions для affected пользователей/устройств, выявить использование после момента компрометации и защитить дальнейшие привилегированные операции. Перевести долгоживущую сессию в server-managed cookie с Secure, HttpOnly, подходящим SameSite и CSRF defense; access tokens в браузере всё равно держать короткоживущими и с узкими permissions. Добавить output/context encoding, sanitization для разрешённого HTML, CSP nonce/hash и Trusted Types где поддерживается. Сохранить временную линию/логи без копирования токенов, оценить доступ/эксфильтрацию и выполнить clean recovery по incident процессу. [OWASP XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [MDN session management](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Session_management), [NIST IR](https://csrc.nist.gov/pubs/sp/800/61/r3/final).

