# Pallete

Лёгкий кроссплатформенный сборщик палитр. Собирает палитры из произвольно вставленного текста: ASCII-таблицы, Markdown, CSS/SCSS-переменные, голые списки hex.

Полностью офлайн, без телеметрии.

## Стек

Tauri 2 (Rust) + SolidJS + Vite + TypeScript.

## Разработка

```sh
pnpm install
pnpm tauri dev
```

## Сборка

```sh
pnpm tauri build
```

## Первый запуск unsigned-билда

### macOS (Gatekeeper)

```sh
xattr -dr com.apple.quarantine /Applications/Pallete.app
```

Или: правый клик → «Open» → «Open anyway» в первый раз.

### Windows (SmartScreen)

На экране предупреждения: «More info» → «Run anyway».

### Linux

Запускать `.AppImage` напрямую, при необходимости `chmod +x`.

## Лицензия

MIT. См. [LICENSE](./LICENSE).
