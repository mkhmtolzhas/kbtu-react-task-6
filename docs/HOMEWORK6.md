# Чеклист требований — Homework 6 (Server Data, Caching & Firebase Authentication)

Источник: `06.react-homework-auth.pdf`. Проект продолжает midterm (`FleetDesk`): весь прежний
функционал сохранён, чеклист midterm — в `docs/REQUIREMENTS.md`.
После тире — где реализовано.

## Environment Variables & Firebase Setup

- [ ] E1. Создан Firebase-проект, включены Email/Password и Google. — **делает владелец**, пошаговая инструкция в README → «Setting up the Firebase project». Код полностью готов и ждёт только ключей.
- [x] E2. Конфигурация Firebase хранится в `.env.local` в переменных `VITE_`. — `.env.local` (не в git), шесть переменных `VITE_FIREBASE_*`.
- [x] E3. Firebase инициализируется в отдельном файле `firebase.js`. — `src/firebase.js`; это единственный модуль, который читает `import.meta.env`.
- [x] E4. `.env.local` в `.gitignore`, есть `.env.example`. — `.gitignore` (`.env.local`, `*.local`, явное исключение `!.env.example`), шаблон `.env.example` закоммичен.

Дополнительно: если ключей нет или они остались плейсхолдерами, `src/firebase.js` не инициализирует
SDK, а приложение показывает баннер со списком недостающих переменных. Остальная часть приложения
(список, фильтры, кэш) при этом продолжает работать.

## Authentication & Context

- [x] A1. `AuthContext` с `AuthProvider` и `useAuth`. — `src/context/AuthContext.js`, `src/context/AuthProvider.jsx`, `src/hooks/useAuth.js` (хук в отдельном файле — требование `react-refresh`).
- [x] A2. Отслеживание аутентификации через `onAuthStateChanged`. — `observeAuthState()` в `src/services/authService.js`, подписка в `AuthProvider` (отписка в cleanup эффекта).
- [x] A3. Persistent sessions. — `setPersistence(auth, browserLocalPersistence)` в `src/firebase.js`, ожидается перед каждым входом в `authService.js`.
- [x] A4. Loading state. — `status: 'loading' | 'ready' | 'unconfigured'`; `ProtectedRoute` на время `loading` показывает спиннер, а не редиректит (иначе при каждой перезагрузке залогиненного выбрасывало бы на `/login`).
- [x] A5. Ошибки аутентификации. — класс `AuthError` + словарь кодов Firebase → человеческие сообщения + привязка к конкретному полю формы (`auth/email-already-in-use` → поле email).
- [x] A6. Signup, login, Google sign-in, logout. — `signUpWithEmail`, `signInWithEmail`, `signInWithGoogle` (`signInWithPopup` + `prompt: 'select_account'`), `logOut`.

## Authentication Pages & Routing

- [x] P1. `/login` — вход по email/паролю и через Google. — `src/pages/LoginPage.jsx`.
- [x] P2. `/signup` — email, пароль, подтверждение пароля, валидация. — `src/pages/SignupPage.jsx` + `src/utils/authValidation.js` (формат email, минимум 6 символов, буквы и цифры, совпадение паролей).
- [x] P3. `/profile` — защищённая страница с email и UID, кнопка выхода. — `src/pages/ProfilePage.jsx` (также метод входа, подтверждение email, даты создания и последнего входа).
- [x] P4. Неаутентифицированных редиректит на `/login`. — `src/components/ProtectedRoute.jsx`; исходный путь передаётся в `state.from`, после входа пользователь возвращается именно туда.
- [x] P5. NavBar показывает Login/Signup или Profile/Logout. — `src/components/UserMenu.jsx` в шапке `AppLayout`; на время восстановления сессии — «Checking session…».

Защищённые маршруты: `/profile` и `/vehicles/new`. Смена статуса и удаление машины анонимному
посетителю показываются, но заблокированы с подсказкой «Log in to …» — осознанное решение
(диспетчерская панель не должна позволять случайному посетителю двигать машины), см. README → Authentication.

## Server Data & Caching

- [x] C1. Кэширование минимум одного API-ресурса. — TanStack Query кэширует все четыре ресурса: список, карточку, счётчики, «похожие машины» (`src/hooks/useVehicleQueries.js`).
- [x] C2. Осмысленные query keys и стратегия устаревания/ревалидации. — фабрика ключей `src/queries/queryKeys.js` (параметры запроса входят в ключ); `staleTime` 60 с (счётчики — 30 с), `gcTime` 5 мин, `refetchOnWindowFocus` и `refetchOnReconnect` — `src/queries/queryClient.js`.
- [x] C3. Инвалидация кэша после create/update/delete. — `invalidateQueries` для списков, счётчиков и «похожих» + точечный `setQueryData` / `removeQueries` для карточки в каждой из трёх мутаций.
- [x] C4. Loading, error и empty состояния. — `isPending` → спиннер, `isError` → `ErrorMessage` с кнопкой Retry (`refetch`), `total === 0` → `EmptyState`; retry только для 5xx, 4xx не повторяется.
- [x] C5. Устаревшие запросы не перезаписывают свежие. — (1) `signal` из React Query передаётся в API и прерывает устаревший запрос; (2) ответ пишется в кэш своего ключа, а не в текущий; (3) `cancelQueries` перед мутацией статуса, чтобы ответ уже летящего GET не вернул старый статус. Плюс `placeholderData: keepPreviousData` для списка.

Подробное описание стратегии — в README → «Server data and caching».

## Architecture

- [x] R1. API, аутентификация и кэширование вынесены в сервисы и хуки. — `src/api/`, `src/services/authService.js`, `src/queries/`, `src/hooks/`.
- [x] R2. Компоненты не обращаются к `localStorage` и не делают запросы напрямую. — `localStorage` только в `src/api/storage.js`, `sessionStorage` только в хуке `useSessionState`, Firebase SDK — только в `src/firebase.js` и `authService.js`; компоненты вызывают хуки.
- [x] R3. Сохранены все маршруты, фильтры, пагинация и функциональность прошлой работы. — список, карточка, добавление, поиск, фильтры, сортировка, пагинация, сохранение состояния вкладки, `?simulateError` — всё на месте; добавлены `/login`, `/signup`, `/profile` и удаление машины.

## Acceptance Criteria

- [ ] AC1. Работает аутентификация Email/Password и Google. — код готов; проверяется после подстановки реальных ключей (см. E1).
- [x] AC2. Сессия сохраняется после перезагрузки. — `browserLocalPersistence` + `onAuthStateChanged`.
- [x] AC3. Защищённые маршруты и условная навигация работают. — проверено в браузере: `#/vehicles/new` и `#/profile` анонимного пользователя уводят на `#/login`, NavBar переключается по состоянию.
- [x] AC4. Переменные окружения настроены. — `.env.example` + `.env.local` + валидация в `src/firebase.js`.
- [x] AC5. Кэширование и инвалидация работают, прежний функционал цел. — `npm run lint` и `npm run build` проходят без ошибок; сценарии прокликаны в браузере (список → карточка → назад открывается из кэша без спиннера).

## Submission

- [ ] S1. Ссылка на GitHub-репозиторий с обновлённым README и `.env.example`. — репозиторий инициализирован локально, README и `.env.example` готовы; push делает владелец.
- [ ] S2. Ссылка на задеплоенное приложение. — инструкция для Vercel в README (включая перенос `VITE_FIREBASE_*` в Environment Variables и добавление домена в Authorized domains).
- [x] S3. Краткое описание стратегии кэширования и момента инвалидации в README. — раздел «Server data and caching».
