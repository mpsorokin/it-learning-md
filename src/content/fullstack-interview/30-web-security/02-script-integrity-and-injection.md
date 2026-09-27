# Script Integrity and Injection

## Interview questions

### hash.
<!-- question-id: 30-web-security-q10 -->

#### Ответ
В контексте CSP hash — криптографический дайджест точного inline script/style содержимого, включённый в script-src/style-src как sha256/sha384/sha512 expression. Browser разрешает соответствующий блок, если вычисленный hash совпадает; изменение байтов/пробелов может потребовать пересчёта, поэтому build должен генерировать и обновлять hash вместе с артефактом. Hash не означает, что код сам по себе безопасен: если атакующий влияет на build или разрешённый inline code, политика пропустит его. Не путайте CSP hash с SRI: SRI хранится в атрибуте external resource и проверяется для загружаемого файла. [CSP spec](https://www.w3.org/TR/CSP3/#integrity-metadata), [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

### SRI.
<!-- question-id: 30-web-security-q11 -->

#### Ответ
Subresource Integrity (SRI) позволяет браузеру проверить, что загруженный внешний script/stylesheet совпал с ожидаемым криптографическим hash в integrity attribute; при несовпадении resource не применяется/не исполняется. Это помогает обнаружить неожиданный tampering CDN или immutable стороннего asset. Для cross-origin SRI нужен CORS режим и разрешающий CORS ответ (обычно crossorigin=anonymous). SRI не подтверждает, что зафиксированная версия безопасна, не защищает inline script, динамически загружаемые потомки или compromised build pipeline; hash нужно обновлять при легитимном релизе. Пиньте точный asset и сочетайте с CSP, review и контролем поставки. [MDN SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity).

### XSS.
<!-- question-id: 30-web-security-q12 -->

#### Ответ
XSS — выполнение attacker-controlled JavaScript в origin приложения, обычно из-за небезопасного вывода/DOM sink. Скрипт может прочитать доступные данные, отправлять authenticated requests, менять интерфейс, похищать токены из localStorage и действовать от имени пользователя; HttpOnly снижает кражу cookie, но не блокирует действия активного XSS. Основные меры — context-sensitive output encoding, safe templating, sanitizer для намеренно разрешённого rich HTML, безопасные DOM APIs и строгая CSP/Trusted Types как дополнительный слой. Валидация input не заменяет правильное кодирование на выходе; одинаковая строка по-разному безопасна в HTML, JS, URL и CSS context. [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

### Stored XSS.
<!-- question-id: 30-web-security-q13 -->

#### Ответ
Stored XSS: attacker payload сохраняется в БД/CMS/comment/profile, а позже попадает в страницу других пользователей и исполняется в их origin. Эффект может быть массовым и переживать перезагрузки/кеши. Не пытайтесь устранить это только «очисткой при записи»: безопасно рендерьте каждый вывод с контекстным encoding; если продукт разрешает HTML, применяйте поддерживаемый allowlist sanitizer и обезвреживайте повторно после изменений pipeline. Аудируйте все templates/export/admin views, где это поле может выводиться, исправьте источник и очистите уже сохранённые вредоносные значения. CSP и Trusted Types ограничивают последствия, но не являются заменой output safety. [OWASP XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

### Reflected XSS.
<!-- question-id: 30-web-security-q14 -->

#### Ответ
Reflected XSS возникает, когда request-controlled значение — часто query/path/form input — немедленно включается в HTML/JS response и браузер интерпретирует его как код. Источник не обязан быть query string, а шаблон может быть vulnerable даже если backend не хранит значение. Выявите exact output context и примените соответствующий encoding через framework template; не конкатенируйте строку в inline script/HTML и не считайте blacklist/URL validation универсальным escape. Для диагностических страниц проверьте error/search/redirect сообщения, контент type и заголовки; добавьте CSP как defense in depth. Исправление должно покрыть общий renderer, а не только один payload.

### DOM XSS.
<!-- question-id: 30-web-security-q15 -->

#### Ответ
DOM-based XSS появляется, когда client-side код переносит управляемые атакующим данные из source (location.hash/search, postMessage, storage/API response) в опасный sink (innerHTML, document.write, eval, script.src или невалидированный URL). Сервер может вернуть неизменённую страницу, поэтому server logs/WAF часто не замечают инцидент. Предпочитайте textContent и безопасные DOM APIs, строгую проверку/разбор URL, sanitizer только для требуемого HTML; используйте Trusted Types CSP enforcement, чтобы поддерживаемые браузеры требовали TrustedHTML/TrustedScript для критических sinks. Проследите data flow от источника до sink статическим анализом и тестом браузера. [OWASP DOM XSS](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html), [Trusted Types via OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

### CSRF.
<!-- question-id: 30-web-security-q16 -->

#### Ответ
CSRF — использование браузера жертвы как confused deputy: браузер автоматически прикладывает её cookie/session к запросу, инициированному чужой страницей. Сервер не видит, хотел ли пользователь выполнить действие. Защищайте все state-changing endpoints synchronizer token/double-submit/custom header подходом; проверяйте Origin/Referer или Fetch Metadata как дополнительный сигнал, используйте SameSite и никогда не мутируйте состояние через GET. CORS сам по себе не предотвращает отправку simple request, а custom header защищает только при строго настроенном CORS и server-side проверке. Для высокорисковых операций добавьте повторную аутентификацию/подтверждение. [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### Cookies.
<!-- question-id: 30-web-security-q17 -->

#### Ответ
Session cookie проектируйте с минимальным scope и сроком: Secure (только HTTPS), HttpOnly (не читается JS), SameSite=Lax/Strict по UX/security модели, Path=/ и без Domain, если нужна только текущая host boundary; поддерживающий браузер префикс __Host- усиливает эти ограничения. На сервере используйте случайный opaque session ID, rotation после login/privilege change и серверную revocation/expiry. SameSite — defense-in-depth против CSRF, не полная защита, особенно при недоверенных sibling subdomains. Не храните чувствительные claims как будто cookie зашифрована: подписанная cookie часто лишь защищает целостность. [MDN secure cookies](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

### HttpOnly.
<!-- question-id: 30-web-security-q18 -->

#### Ответ
HttpOnly запрещает доступ к cookie через JavaScript API вроде document.cookie, поэтому XSS не может просто прочитать и отправить session identifier наружу. Browser по-прежнему прикладывает cookie к подходящим HTTP requests, поэтому HttpOnly не предотвращает CSRF и не мешает активному XSS выполнять same-origin действия через fetch/form. Ставьте его на session cookies, а CSRF защищайте отдельно SameSite + token/Origin controls. Не делайте cookie доступной JS только ради UI; публичное UI состояние передавайте отдельным неперсональным response. [MDN Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies).

