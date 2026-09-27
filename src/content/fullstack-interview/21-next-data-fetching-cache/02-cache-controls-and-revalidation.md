# Cache controls and revalidation

## Interview questions

### cache: 'no-store'.
<!-- question-id: 21-next-data-fetching-cache-q07 -->
#### Ответ
В previous model вызов fetch(url, { cache: 'no-store' }) запрещает сохранять этот ответ в Next Data Cache и означает, что данные нужно получить заново на серверном запросе; это часто выбирают для пользовательского или быстро меняющегося результата. Он может сделать маршрут динамическим, но не выключает другие слои автоматически: CDN, браузер, Router Cache или клиентский query cache надо проверять отдельно. Он также не отменяет request memoization одинаковых чтений в рамках одного render. Не включайте no-store для всего без измерения, если можно явно кэшировать публичную часть. При Cache Components проектируйте политику через use cache/Suspense; не смешивайте её с настройками старой модели. [Previous model](https://nextjs.org/docs/app/guides/caching-without-cache-components).

### Revalidation.
<!-- question-id: 21-next-data-fetching-cache-q08 -->
#### Ответ
Revalidation — обновление сохранённого результата по времени или после события. Сначала фиксируется успешная мутация в источнике данных, затем отмечаются устаревшими связанные записи и, при необходимости, маршрут. После истечения срока Next может отдать старое значение и обновить его в фоне либо дождаться свежего значения — это определяется выбранным API и режимом. Revalidation не эквивалентна синхронному подтверждению всех CDN/кластерных копий. Для критичного read-your-own-writes используйте режим немедленного expiry там, где он доступен; для публичного контента часто допустим stale-while-revalidate. В production согласуйте tags, cache key, deployment instances и external CDN.

### Time-based revalidation.
<!-- question-id: 21-next-data-fetching-cache-q09 -->
#### Ответ
В прежней модели fetch можно задать next.revalidate в секундах: положительный срок задаёт time-based revalidation, а 0 означает отказ от кэширования/динамический render для соответствующего запроса. Когда запись становится stale, Next может вернуть старый вариант и инициировать фоновое обновление; при сбое обычно сохраняется последний успешный результат для последующих попыток. Это не hard freshness SLA и не гарантия обновления точно по таймеру. В Next 16 Cache Components срок задаёт cacheLife внутри use cache; у профиля есть разные stale/revalidate/expire границы, поэтому термин «revalidate 60» не означает ту же семантику во всех моделях. См. [предыдущую модель](https://nextjs.org/docs/app/guides/caching-without-cache-components) и [Cache Components revalidation](https://nextjs.org/docs/app/getting-started/revalidating).

### On-demand revalidation.
<!-- question-id: 21-next-data-fetching-cache-q10 -->
#### Ответ
On-demand revalidation привязывает очистку к событию — например, после сохранения продукта или webhook из CMS. Тег описывает логическую сущность, которую читают несколько страниц; путь адресует конкретную страницу/сегмент. Выбирайте теги при известной связи данных, путь — когда нужно перевалидировать весь route output. В Next 16 Cache Components записи помечают cacheTag, а затем вызывают revalidateTag(tag, 'max') для stale-while-revalidate или updateTag в Server Action для немедленного read-your-own-writes. В previous model API и defaults другие; проверьте отдельное руководство. Инвалидацию запускайте после успешной фиксации транзакции, иначе новое значение может тут же закэшировать старое состояние.

### revalidatePath.
<!-- question-id: 21-next-data-fetching-cache-q11 -->
#### Ответ
revalidatePath(path) инвалидирует кэшированный результат указанного pathname, а не все данные с общей семантической меткой. Путь может быть конкретным, например /products/42, или шаблоном вроде /products/[slug] с типом page/layout согласно API. Это удобно, когда нужно обновить маршрут и его данные, но может инвалидировать больше, чем один тег, если на странице много источников. В Server Action UI может обновиться в том же переходе; Route Handler помечает соответствующее содержимое к revalidation при посещении. В Cache Components Next рекомендует по возможности точные cache tags, чтобы не затрагивать лишние страницы. [API revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath).

### revalidateTag.
<!-- question-id: 21-next-data-fetching-cache-q12 -->
#### Ответ
revalidateTag связывает обновление с cache tag, который был назначен кэшированным fetch/функции, поэтому один вызов может затронуть несколько потребителей данных. В актуальном Next 16 для Cache Components рекомендуется второй аргумент-профиль: revalidateTag('products', 'max') помечает данные stale и использует stale-while-revalidate, что подходит для каталога. Для немедленного обновления данных после пользовательской записи предназначен updateTag, но он разрешён только в Server Action; revalidateTag можно вызывать из Server Action и Route Handler. Старый однопараметрический вызов в Next 16 deprecated и его семантика исторически менялась. [Официальное различие API](https://nextjs.org/docs/app/getting-started/revalidating).

