# Pallete

Лёгкий кроссплатформенный сборщик палитр. Собирает палитры из произвольно вставленного текста: ASCII-таблицы, Markdown, CSS/SCSS-переменные, голые списки hex.

Полностью офлайн, без телеметрии.

## Возможности

- Импорт палитр из произвольного текста: hex, `rgb()/rgba()`, `hsl()/hsla()`, ASCII-таблицы, Markdown, CSS/SCSS переменные
  - CSS/SCSS-переменные группируются в палитры по комментариям-секциям (`// Gray Scale`, `/* Status */`), а без них — по общему префиксу имени (`gray-*`, `ocean-*`)
- Трёхколоночный layout: проекты → палитры → цвета
- Undo/redo по командам
- Копирование цвета по клику (hex / rgb / hsl, настраивается)
- Drag-and-drop файла в окно для импорта
- Тёмная/светлая/системная тема

## Горячие клавиши

- `Ctrl/Cmd+V` — импортировать палитру из буфера
- `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` — undo / redo
- `Esc` — закрыть диалог

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
