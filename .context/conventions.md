# Conventions

## TypeScript
- Strict mode, без `any`, `as`, `@ts-ignore`, non-null `!`
- interface для объектов, type для union/intersection
- Функциональные компоненты SolidJS, props через interface
- Хуки и стор-модули — один файл = одна ответственность
- Импорты через alias `~/*` → `src/*`
- Максимум 200 строк на файл, декомпозировать при превышении

## SolidJS
- Стор: `createStore` из `solid-js/store`
- Сигналы только для локальных эфемерных состояний
- Эффекты минимально, предпочитать derived signals

## CSS
- CSS Modules на компонент, camelCase
- Все цвета/отступы/шрифты — через CSS custom properties из `src/styles/tokens.css`
- Logical properties (`margin-inline`, `padding-block`)
- `prefers-reduced-motion` для анимаций
- z-index через шкалу переменных

## Rust
- `clippy` без предупреждений (`-D warnings`)
- `rustfmt` со стандартным конфигом
- Ошибки через `thiserror`, результаты `Result<T, Error>`
- Публичный API крейта документировать doc-комментариями
- Unit-тесты рядом с модулем через `#[cfg(test)] mod tests`

## Именование
- Файлы TS/TSX: kebab-case (`palette-list.tsx`)
- Компоненты: PascalCase
- Rust модули: snake_case
