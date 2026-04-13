# План: Pallete MVP

Дата: 2026-04-13
Спека: `.context/specs/2026-04-13-pallete-mvp.md`
ADR: `.context/decisions/2026-04-13-file-format-versioning.md`

## Подход

Инкрементальные тонкие срезы. После каждого task — проверки (clippy/typecheck/lint/test) и коммит. Очерёдность: сначала каркас → парсер с тестами → хранилище → UI → шорткаты/UX-полировка.

## Tasks

### T0. Инициализация репо
- `git init`, `.gitignore` (Rust, Node, macOS, IDE)
- `LICENSE` (MIT, © 2026 n0sfer)
- `README.md` (коротко: что это, стек, обход Gatekeeper/SmartScreen)
- Корневой `Cargo.toml` как workspace: members = `src-tauri`, `crates/parser`
- DoD: `git status` чистый после первого коммита

### T1. Скаффолд Tauri + SolidJS + Vite
- `package.json` (pnpm, scripts: dev, build, tauri, typecheck, lint, test, check)
- `vite.config.ts`, `tsconfig.json` (strict), `index.html`, `src/main.tsx`, `src/App.tsx`
- `src-tauri/tauri.conf.json`: bundle id `dev.n0sfer.pallete`, window 1280x800 / min 960x600
- `src-tauri/Cargo.toml`, `src-tauri/src/main.rs`, `build.rs`
- ESLint + typescript-eslint + solid plugin; Vitest
- DoD: `pnpm tauri dev` запускает пустое окно; `pnpm check` и `cargo clippy` зелёные

### T2. Crate parser — скелет + типы
- `crates/parser/Cargo.toml`, `lib.rs`
- Типы: `ParsedColor { hex, alpha, name }`, `ParsedPalette { name, colors }`, `ParseResult`
- Trait/функция `parse(input: &str, opts: ParseOptions) -> ParseResult`
- Ошибки через `thiserror`
- DoD: компилируется, пустой вход → пустой результат с тестом

### T3. Парсер — hex детектор и нормализация
- Regex `#[0-9a-fA-F]{3,8}` (3/4/6/8 символов), поддержка опции «hex без `#`»
- RGB: `rgb(r,g,b)` / `rgba(r,g,b,a)` → hex+alpha
- Снэпшот-тесты (`insta`) на примерах
- DoD: все тесты проходят

### T4. Парсер — ASCII/Markdown таблицы
- Нормализатор рамок: `│┌┐└┘├┤┬┴┼─|`, markdown `---`
- Токенизация: строки × ячейки
- Авто-детект header (строка без hex → header)
- Группировка: строка → палитра, имя из первой ячейки без hex
- Опции: `first_row_is_header`, `first_col_is_name`, `grouping: rows|all`
- DoD: snapshot-тесты для ASCII и MD таблиц

### T5. Парсер — CSS/SCSS переменные
- Regex `(?:--|\$)([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\(...\))`
- Имя цвета из токена
- DoD: тесты для CSS и SCSS

### T6. Парсер — fallback и лимиты
- Fallback-палитра «Imported YYYY-MM-DD HH:MM» если нет группировки
- Жёсткие лимиты: 1 MB / 10000 цветов → `ParseError::LimitExceeded { chars, colors }`
- DoD: тест на лимит

### T7. Rust: модель проекта и миграции
- `src-tauri/src/model.rs`: `Project`, `Palette`, `Color`, serde serialize/deserialize
- `src-tauri/src/migrate.rs`: скелет `migrate()`, `CURRENT_VERSION = 1`
- Тест: `version > CURRENT_VERSION` → ошибка `UnknownVersion`
- DoD: раунд-трип JSON, тесты зелёные

### T8. Rust: файловое IO проектов
- Команды Tauri: `project_load(path)`, `project_save(project, path)`, `project_create(path, name)`
- Backup перед сохранением при миграции (`<file>.v<N>.bak`)
- DoD: команды работают в dev, ручной smoke

### T9. Rust: workspace-индекс
- `workspace.json` path: macOS Application Support, XDG на Linux, AppData на Windows (через `dirs` crate)
- Поля: `{ version: 1, projects: [{ path, lastOpenedAt }], lastOpenedProjectPath }`
- Команды: `workspace_load`, `workspace_add_project`, `workspace_remove_project`, `workspace_set_last_opened`
- Missing-файлы помечаются флагом при чтении
- DoD: тесты на сериализацию + ручной smoke

### T10. Tauri commands для парсера
- `parse_clipboard(text, opts) -> ParseResult` (async command)
- Биндинги типов через `ts-rs` или ручные TS-интерфейсы в `src/ipc/types.ts`
- DoD: вызов из фронта возвращает типизированный результат

### T11. Frontend: токены, темы, layout
- `src/styles/tokens.css`: `--color-*`, `--spacing-*`, `--font-size-*`, `--radius-*`, `--z-*`
- `src/styles/global.css`: reset, `prefers-color-scheme`, CSS-переменные light/dark
- `src/components/Layout.tsx`: 3 колонки 20/30/50 (CSS Grid)
- Переключатель темы (light/dark/system)
- DoD: пустые колонки видны, тема переключается

### T12. Frontend: стор (SolidJS)
- `src/store/project.ts`: активный проект, CRUD палитр/цветов
- `src/store/workspace.ts`: список проектов, активный
- `src/store/undo.ts`: command-стек `{ apply, revert, label }`
- `src/store/selection.ts`: что выделено (палитра/цвет)
- Vitest: undo/redo на всех операциях
- DoD: `pnpm test` зелёный

### T13. Frontend: колонка проектов
- Список проектов, активный подсвечен
- «+ New project» (диалог: имя + папка через `dialog` плагин Tauri)
- «Open folder» → добавить в workspace
- Missing-проекты помечены, действие Remove
- DoD: ручной smoke

### T14. Frontend: колонка палитр
- Горизонтальные полосы: имя сверху, ряд свотчей снизу
- Выделение кликом, hover → иконка корзины
- Delete/Backspace удаляет выделенную палитру (через undo)
- F2 переименовывает (inline input)
- DoD: ручной smoke + undo работает

### T15. Frontend: колонка настройки палитры
- Редактируемое имя, список цветов (hex / имя / роль / alpha)
- Действия: копировать hex (через tauri clipboard), удалить, дубликат
- Формат копирования настраивается (hex/rgb/hsl) в settings
- DoD: клик по свотчу кладёт в буфер

### T16. Frontend: глобальный импорт Cmd+V
- Listener на document, игнор когда фокус в textarea/input
- Вызов `parse_clipboard`, открытие preview-диалога
- Undo-toast после применения импорта
- DoD: Cmd+V с палитрой в буфере → открылся preview

### T17. Frontend: preview-диалог импорта
- Слева: редактируемый textarea со вставленным текстом (повторный parse on change, debounce)
- Справа: разобранные палитры (preview)
- Тогглы: header, first-col-is-name, grouping
- Диалог дубликатов при применении: merge / replace / skip (для каждой конфликтующей)
- Лимит превышен → кнопка подтверждения disabled + warning с реальными цифрами
- DoD: end-to-end ручной smoke

### T18. Frontend: drag-and-drop файлов
- `.txt/.md/.css` → прочитать через Tauri fs → тот же preview-диалог
- DoD: DnD файла открывает preview

### T19. Настройки приложения
- Panel/dialog: тема, формат копирования, «hex без `#`» для парсера
- Persist в `workspace.json` (поле `settings`)
- DoD: настройки переживают рестарт

### T20. Документация и финальный smoke
- README: скриншоты, инструкции по сборке, обход Gatekeeper/SmartScreen
- Проверить: бинарник <15MB, старт <500мс (замер), RAM <100MB (Activity Monitor)
- DoD: документация на месте, цифры зафиксированы

## Зависимости

- T2 → T3 → T4 → T5 → T6 (парсер линейно)
- T7 → T8 → T9 (persistence)
- T11 → T12 → T13, T14, T15 (UI после стора)
- T10 нужен для T16, T17
- T6 нужен для T17 (лимиты)

## Проверки

После каждого task:
- Rust: `cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace`
- Frontend: `pnpm check` (typecheck + lint + test)

## Definition of Done (весь MVP)

- [ ] Все T0-T20 выполнены, чеки зелёные
- [ ] `pnpm tauri build` успешно собирает бинарь на macOS
- [ ] Бинарник <15MB, старт <500мс, RAM <100MB (зафиксированы в отчёте)
- [ ] Спека покрыта: иерархия, импорт всех форматов, preview, дубликаты, undo/redo, темы, шорткаты
- [ ] Тесты парсера и стора зелёные
- [ ] README + обход Gatekeeper документирован
