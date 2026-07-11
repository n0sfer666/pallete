# Pallete

**English** · [Русский](./README.ru.md)

A lightweight cross-platform palette collector. It builds palettes from arbitrary pasted text: ASCII tables, Markdown, CSS/SCSS variables, plain hex lists.

Fully offline, no telemetry.

📖 **Detailed features and import formats — [docs/description.md](./docs/description.md) (in Russian).**

## Features

- Import palettes from arbitrary text: hex, `rgb()/rgba()`, ASCII tables, Markdown, CSS/SCSS variables ([what can and cannot be imported](./docs/description.md#импорт-палитр))
  - CSS/SCSS variables are grouped into palettes by section comments (`// Gray Scale`, `/* Status */`), and without them — by a shared name prefix (`gray-*`, `ocean-*`)
- [Palette generator](./docs/palette-generator.md) from a single base color in OKLCH: shades, tonal scale, gradient, alpha scale, harmonies, semantic set
- Three-column layout: projects → palettes → colors
- Command-based undo/redo
- Click to copy a color (hex / rgb / hsl, configurable)
- Drag-and-drop a file into the window to import
- Dark / light / system theme

## Shortcuts

- `Ctrl/Cmd+V` — import a palette from the clipboard
- `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` — undo / redo
- `Delete` / `Backspace` — delete the selected palette or color

## Stack

Tauri 2 (Rust) + SolidJS + Vite + TypeScript.

## Development

```sh
pnpm install
pnpm tauri dev
```

## Build

```sh
pnpm tauri build
```

## First launch of an unsigned build

### macOS (Gatekeeper)

```sh
xattr -dr com.apple.quarantine /Applications/Pallete.app
```

Or: right click → "Open" → "Open anyway" the first time.

### Windows (SmartScreen)

On the warning screen: "More info" → "Run anyway".

### Linux

Run the `.AppImage` directly, `chmod +x` it if needed.

## License

MIT. See [LICENSE](./LICENSE).
