# Commits

Conventional Commits на английском.

## Формат
`<type>(<scope>): <subject>`

## Типы
- `feat` — новая функциональность
- `fix` — исправление бага
- `refactor` — без изменения поведения
- `docs` — документация
- `chore` — инфра, конфиги, зависимости
- `test` — тесты
- `perf` — производительность

## Scopes (примеры)
- `parser`, `store`, `ui`, `tauri`, `workspace`, `theme`

## Правила
- Subject в императиве, lowercase, без точки в конце
- Максимум 72 символа в subject
- Без `Co-Authored-By`, без AI-меток
- Один логический коммит — одна идея
