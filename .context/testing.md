# Testing

## Парсер (Rust, `crates/parser`)
- Unit-тесты на все форматы: ASCII-таблицы, Markdown, CSS/SCSS, голые списки hex, RGB-функции
- Edge cases: пустой вход, `#abc`, hex без `#`, смешанный контент, header auto-detect, rgb()
- Снэпшот-тесты через `insta` для больших fixture-таблиц

## Store (frontend, Vitest)
- Undo/redo на все мутации
- CRUD палитр/цветов
- Диалог дубликатов (merge/replace/skip)

## Migrations (Rust, `src-tauri`)
- Тест на `version > CURRENT_VERSION` → ошибка
- Тест на backup-файл перед миграцией
- Snapshot для каждой миграции v_n → v_(n+1)

## Ручное
- UI smoke на macOS (приоритет), Windows/Linux по возможности
- Глобальные шорткаты (Cmd+V, Cmd+Z, F2, Delete)
- Импорт больших вставок (>1 MB) → блок кнопки

## Вне MVP
- E2E (Playwright или tauri-driver)
