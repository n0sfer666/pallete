# Nord Aurora — Palette Documentation

A balanced, modern UI palette with semantic roles. Ready to drop into a design
system as tokens (CSS / JSON / SCSS). Light theme.

---

## English

### Overview

Nord Aurora is a general-purpose interface palette. Each color has a **semantic
role** rather than a purely decorative name, so it maps directly to component
states (buttons, alerts, surfaces, text). Use the role, not the raw hex, when
wiring it into components — that keeps the theme swappable.

### Color tokens

| Role | Name | HEX | RGB | Usage |
|------|------|-----|-----|-------|
| Primary | Indigo | `#5B6CFF` | 91, 108, 255 | Primary buttons, links, key accents |
| Primary Hover | Indigo Deep | `#4553E6` | 69, 83, 230 | Hover / pressed state of primary |
| Secondary | Teal | `#12B5A6` | 18, 181, 166 | Secondary actions, badges |
| Accent | Coral | `#FF6B6B` | 255, 107, 107 | Highlights, promo elements |
| Success | Emerald | `#22C55E` | 34, 197, 94 | Success, confirmations |
| Warning | Amber | `#F5A524` | 245, 165, 36 | Warnings, cautions |
| Danger | Rose | `#EF4444` | 239, 68, 68 | Errors, destructive actions |
| Background | Snow | `#F8FAFC` | 248, 250, 252 | Page background |
| Surface | White | `#FFFFFF` | 255, 255, 255 | Cards, panels |
| Border | Mist | `#E2E8F0` | 226, 232, 240 | Borders, dividers |
| Text | Ink | `#0F172A` | 15, 23, 42 | Primary text |
| Text Muted | Slate | `#64748B` | 100, 116, 139 | Secondary text |

### Usage guidelines

- **Primary vs Accent** — Primary drives the main call-to-action; Accent (Coral)
  is for occasional highlights. Don't use both on the same element.
- **Semantic colors** (Success / Warning / Danger) are reserved for status. Avoid
  reusing them as decoration so their meaning stays unambiguous.
- **Contrast** — Ink on Snow/White and White on Primary both clear WCAG AA for
  body text. Verify any new pairing (e.g. Text Muted on Surface) before shipping.
- **Surfaces** — Background is the page canvas; Surface sits above it for cards.
  Keep the one-step elevation (Snow → White) rather than mixing arbitrary grays.

### Integration

**CSS Custom Properties**
```css
:root {
  --color-primary: #5B6CFF;
  --color-primary-hover: #4553E6;
  --color-secondary: #12B5A6;
  --color-accent: #FF6B6B;
  --color-success: #22C55E;
  --color-warning: #F5A524;
  --color-danger: #EF4444;
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
}
```

**JSON (design tokens)**
```json
{
  "primary":      "#5B6CFF",
  "primaryHover": "#4553E6",
  "secondary":    "#12B5A6",
  "accent":       "#FF6B6B",
  "success":      "#22C55E",
  "warning":      "#F5A524",
  "danger":       "#EF4444",
  "background":   "#F8FAFC",
  "surface":      "#FFFFFF",
  "border":       "#E2E8F0",
  "text":         "#0F172A",
  "textMuted":    "#64748B"
}
```

**SCSS variables**
```scss
$color-primary:       #5B6CFF;
$color-primary-hover: #4553E6;
$color-secondary:     #12B5A6;
$color-accent:        #FF6B6B;
$color-success:       #22C55E;
$color-warning:       #F5A524;
$color-danger:        #EF4444;
$color-bg:            #F8FAFC;
$color-surface:       #FFFFFF;
$color-border:        #E2E8F0;
$color-text:          #0F172A;
$color-text-muted:    #64748B;
```

### Importing into Pallete

Paste any of the blocks above into the app's import dialog — CSS, JSON, or SCSS
are all recognized, and the variables become a named palette automatically.

---

## Русский

### Обзор

Nord Aurora — универсальная палитра для интерфейса. У каждого цвета есть
**семантическая роль**, а не просто декоративное имя, поэтому он напрямую
ложится на состояния компонентов (кнопки, алерты, поверхности, текст). При
подключении к компонентам используйте роль, а не сырой hex — так тему легко
заменить целиком.

### Токены цветов

| Роль | Название | HEX | RGB | Применение |
|------|----------|-----|-----|------------|
| Primary | Indigo | `#5B6CFF` | 91, 108, 255 | Основные кнопки, ссылки, акценты |
| Primary Hover | Indigo Deep | `#4553E6` | 69, 83, 230 | Ховер / нажатие основной кнопки |
| Secondary | Teal | `#12B5A6` | 18, 181, 166 | Вторичные действия, бейджи |
| Accent | Coral | `#FF6B6B` | 255, 107, 107 | Выделения, промо-элементы |
| Success | Emerald | `#22C55E` | 34, 197, 94 | Успех, подтверждения |
| Warning | Amber | `#F5A524` | 245, 165, 36 | Предупреждения |
| Danger | Rose | `#EF4444` | 239, 68, 68 | Ошибки, удаление |
| Background | Snow | `#F8FAFC` | 248, 250, 252 | Фон страницы |
| Surface | White | `#FFFFFF` | 255, 255, 255 | Карточки, панели |
| Border | Mist | `#E2E8F0` | 226, 232, 240 | Границы, разделители |
| Text | Ink | `#0F172A` | 15, 23, 42 | Основной текст |
| Text Muted | Slate | `#64748B` | 100, 116, 139 | Второстепенный текст |

### Рекомендации по использованию

- **Primary vs Accent** — Primary отвечает за главное действие; Accent (Coral)
  нужен для редких выделений. Не используйте оба на одном элементе.
- **Семантические цвета** (Success / Warning / Danger) зарезервированы под
  статусы. Не применяйте их как декор, иначе смысл размывается.
- **Контраст** — Ink на Snow/White и White на Primary проходят WCAG AA для
  основного текста. Любую новую пару (например, Text Muted на Surface) проверяйте
  перед релизом.
- **Поверхности** — Background это холст страницы; Surface лежит над ним для
  карточек. Держите один шаг возвышения (Snow → White), не подмешивая
  произвольные серые.

### Интеграция

**CSS Custom Properties**
```css
:root {
  --color-primary: #5B6CFF;
  --color-primary-hover: #4553E6;
  --color-secondary: #12B5A6;
  --color-accent: #FF6B6B;
  --color-success: #22C55E;
  --color-warning: #F5A524;
  --color-danger: #EF4444;
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
}
```

**JSON (дизайн-токены)**
```json
{
  "primary":      "#5B6CFF",
  "primaryHover": "#4553E6",
  "secondary":    "#12B5A6",
  "accent":       "#FF6B6B",
  "success":      "#22C55E",
  "warning":      "#F5A524",
  "danger":       "#EF4444",
  "background":   "#F8FAFC",
  "surface":      "#FFFFFF",
  "border":       "#E2E8F0",
  "text":         "#0F172A",
  "textMuted":    "#64748B"
}
```

**SCSS-переменные**
```scss
$color-primary:       #5B6CFF;
$color-primary-hover: #4553E6;
$color-secondary:     #12B5A6;
$color-accent:        #FF6B6B;
$color-success:       #22C55E;
$color-warning:       #F5A524;
$color-danger:        #EF4444;
$color-bg:            #F8FAFC;
$color-surface:       #FFFFFF;
$color-border:        #E2E8F0;
$color-text:          #0F172A;
$color-text-muted:    #64748B;
```

### Импорт в Pallete

Вставьте любой из блоков выше в диалог импорта приложения — CSS, JSON и SCSS
распознаются, а переменные автоматически становятся именованной палитрой.
