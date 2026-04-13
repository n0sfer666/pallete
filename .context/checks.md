# Checks

Команды запускаются из корня проекта.

## Frontend
- Типы: `pnpm typecheck`
- Линтер: `pnpm lint`
- Юнит-тесты: `pnpm test`

## Rust
- Формат: `cargo fmt --all -- --check`
- Линтер: `cargo clippy --workspace --all-targets -- -D warnings`
- Тесты: `cargo test --workspace`

## Полный прогон
- `pnpm check` (алиас на `pnpm typecheck && pnpm lint && pnpm test`)
- `cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings && cargo test --workspace`

## Dev / build
- Dev: `pnpm tauri dev`
- Prod-билд: `pnpm tauri build`
