# Legacy migration strategy

## Interview questions

### Ты получил старый React проект: classes, Redux everywhere, нет tests, всё медленное.
<!-- question-id: 19-react-application-architecture-task01 -->

Составить migration strategy.

#### Ответ

Предположение: проект обслуживает реальные production users, а backend contract и бизнес-правила пока должны сохраняться. Я бы сначала согласовал цель с продуктом и владельцами: какие ошибки/задержки/стоимость изменений важнее, какие route критичны, какое окно релиза и rollback доступно. В первые дни инвентаризировал бы React/build/router/Redux версии, структуру routes, внешние зависимости, deploy pipeline, API, test coverage и incident/performance data. Провёл бы аудит пользовательских потоков и воспроизвёл бы самые опасные дефекты; снял бы baseline по Web Vitals, bundle, console/client errors, API latency и успешности ключевых действий. До крупных изменений добавил бы CI build/typecheck, smoke E2E для критических journeys и characterization tests для существующего поведения.

Затем определил бы целевую архитектуру как небольшие feature slices с направленными dependency boundaries, route-level composition и явным owner каждого типа state. Не переносил бы весь Redux за раз: оставил бы его совместимым с новой частью, ввёл facade, а состояние переносил бы по одному domain/route, удаляя старый reducer только после перевода всех читателей и писателей. Redux не является сам по себе проблемой: если он надёжно обслуживает cross-route client workflow, можно временно оставить его; удаление оправдано, если конкретная стоимость/сложность подтверждена. Server data не следует копировать в новый store автоматически: выберите один owner/cache, согласуйте invalidation, logout и SSR/request scope. Классы также мигрировал бы точечно после behavioral tests, не превращая lifecycle methods механически в Effects.

План rollout: зафиксировать API и event/analytics schema; сделать adapter и один non-critical vertical slice; выпустить за feature flag на internal/canary cohort; сравнить ошибки, latency, bundle, task completion и обращения к API с baseline; иметь owner on-call и проверенный rollback. После прохождения SLO включать большую долю пользователей, затем следующие slices. Если результат хуже, отключить flag и исследовать данные, а не расширять refactor. На каждом шаге собирать errors по route/build, React render/performance traces и API request IDs без утечки персональных данных; dashboards должны различать старый и новый path. Обновление зависимостей и улучшение state model проводить отдельно там, где это возможно, чтобы регрессия имела одну понятную причину. Завершение — это удалённые legacy paths, подтверждённые тесты/метрики и документация новых boundaries, а не просто новая раскладка папок.
