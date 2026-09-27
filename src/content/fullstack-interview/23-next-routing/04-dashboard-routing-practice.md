# Dashboard routing practice

## Interview questions

### Спроектировать сложный dashboard routing tree.
<!-- question-id: 23-next-routing-task01 -->
#### Ответ
Предположения: dashboard закрыт авторизацией; есть overview, аналитика, список/детали проектов, настройки проекта и открытие project details модальным окном из списка; прямой URL должен давать полноценную страницу. Возможное дерево App Router (группы не попадают в URL):

    app/(public)/login/page.tsx
    app/(workspace)/layout.tsx
    app/(workspace)/dashboard/layout.tsx
    app/(workspace)/dashboard/page.tsx
    app/(workspace)/dashboard/analytics/page.tsx
    app/(workspace)/dashboard/projects/page.tsx
    app/(workspace)/dashboard/projects/[projectId]/page.tsx
    app/(workspace)/dashboard/projects/[projectId]/settings/page.tsx
    app/(workspace)/dashboard/@modal/default.tsx
    app/(workspace)/dashboard/@modal/(.)projects/[projectId]/page.tsx
    app/(workspace)/dashboard/@modal/[...catchAll]/page.tsx

Dashboard layout принимает children и modal slot. Slot fallback возвращает null; catch-all также возвращает null, когда навигация уходит с modal-сценария. При Link из списка перехваченный маршрут показывает modal с URL /dashboard/projects/:id, а прямой URL/refresh отображает полноценный page.tsx. Если фактическое расположение slot/сегмента меняется, пересчитайте (.)/(..) по URL-сегментам — папка @modal не считается. В layout добавьте sidebar/loading/error boundary, но authorization каждого page/data/action выполняйте в DAL. Валидация projectId и notFound предотвращают некорректные запросы. Проверьте soft/hard navigation, refresh, back/forward и отсутствие route-group collisions.

