# Rendering modes and dynamic APIs

## Interview questions

### Dynamic rendering.
<!-- question-id: 21-next-data-fetching-cache-q13 -->
#### Ответ
Dynamic rendering означает, что часть результата вычисляется с request-time данными, поэтому нельзя безопасно выдавать один готовый HTML для всех пользователей. В previous model cookies(), headers(), searchParams/uncached fetch обычно переводят маршрут в dynamic rendering; отдельные явно кэшированные публичные запросы при этом могут оставаться в Data Cache. В Next 16 Cache Components динамические данные могут быть помещены за Suspense, чтобы сохранить prerendered shell и стримить персональный фрагмент; без границы сборка может сообщить, что runtime access не покрыт. Не принимайте dynamic route за запрет любого кэширования — проверяйте область каждого cache scope и изоляцию пользователя. [Миграционное руководство](https://nextjs.org/docs/app/guides/migrating-to-cache-components).

### Static rendering.
<!-- question-id: 21-next-data-fetching-cache-q14 -->
#### Ответ
Static rendering вычисляет маршрут при build/prerender этапе или его последующей revalidation и переиспользует результат между запросами. Это хорошо для общедоступных страниц с контролируемой свежестью и позволяет CDN отдавать быстрый HTML/RSC. Данные должны быть независимы от текущего пользователя; динамические параметры могут быть перечислены через generateStaticParams, либо дорендериваться позже — в зависимости от режима. Статичность маршрута не означает, что каждый вложенный запрос автоматически имеет нужную свежесть в любой версии Next. В Next 16 Cache Components shell может быть статическим, в то время как вложенный request-time fragment остаётся динамическим за Suspense.

### Что делает cookies().
<!-- question-id: 21-next-data-fetching-cache-q15 -->
#### Ответ
cookies() из next/headers читает Cookie текущего запроса в Server Component/Server Function/Route Handler; в Server Function и Route Handler можно также записать/удалить cookie через Set-Cookie. Функция асинхронная: на Next 16 используйте await cookies(). Начиная с Next 15 API переводили на Promise, а синхронный compatibility доступ постепенно удаляли; поэтому старые примеры могут не собираться. Так как значение известно только из запроса, чтение влияет на prerendering/динамическую часть. Cookie — пользовательский ввод: проверяйте сессию, флаги HttpOnly/Secure/SameSite и не кэшируйте персональный результат общим ключом. [cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies).

### Что делает headers().
<!-- question-id: 21-next-data-fetching-cache-q16 -->
#### Ответ
headers() возвращает read-only Web Headers для входящего HTTP-запроса, например для трассировки или аккуратно выбранного контекста; она не задаёт исходящие заголовки ответа. На актуальном App Router вызов асинхронный — const h = await headers(). Данные заголовков доступны лишь во время запроса, поэтому их использование означает dynamic/runtime участок или требует отложенного рендера в Cache Components. Значения вроде x-forwarded-host/user-agent нельзя бездумно считать доверенными: доверие зависит от настроенного proxy. Не копируйте произвольные заголовки в cache key и не пересылайте Authorization без явной причины. [headers API](https://nextjs.org/docs/app/api-reference/functions/headers).

### Как dynamic APIs влияют на rendering?
<!-- question-id: 21-next-data-fetching-cache-q17 -->
#### Ответ
Dynamic APIs привязаны к HTTP request и поэтому их результат нельзя вычислить заранее для всех пользователей. В Next 16 params, searchParams, cookies(), headers() и draftMode() асинхронны — доступ нужно await-ить. В previous model их использование часто переводит весь маршрут в dynamic rendering; в Cache Components runtime data должна быть отделена от use cache scope и обычно обёрнута в Suspense, чтобы остался статический shell. Значения cookies/headers сначала прочитайте вне cache scope и передайте явно как аргумент только если намеренно задаёте безопасный ключ. Не кэшируйте внутри scope доступ к request API или приватное содержимое без явной стратегии. [Async Dynamic APIs](https://nextjs.org/docs/app/guides/upgrading/version-16).

