# Stack

- **Desktop runtime**: Tauri 2 (Rust stable)
- **Frontend**: SolidJS + Vite + TypeScript (strict)
- **Стили**: Vanilla CSS + CSS Modules, CSS custom properties для токенов
- **Package manager**: pnpm
- **Bundle identifier**: `dev.n0sfer.pallete`
- **Лицензия**: MIT
- **Таргеты**: macOS, Windows, Linux (unsigned билды в MVP)

## Cargo workspace

```
/Cargo.toml            # workspace root
/src-tauri/            # Tauri app (bin)
/crates/parser/        # парсер палитр (lib, переиспользуется в будущем CLI)
```

## Frontend

```
/src/                  # SolidJS
/index.html
/vite.config.ts
/package.json
/pnpm-lock.yaml
```

## Окно

Default 1280x800, min 960x600.
