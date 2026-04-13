---
date: 2026-04-13
status: accepted
tags: [adr, architecture, storage]
---

# ADR: Версионирование формата файла проекта

## Контекст

Палитры хранятся как JSON-файлы (`<name>.palette.json`). Нужна стратегия эволюции схемы без ломки существующих файлов пользователя.

## Решение

Целочисленный `version: N` в корне файла + последовательные миграторы на Rust.

```rust
fn migrate(data: Value) -> Result<Value> {
    let mut v = data["version"].as_u64().unwrap_or(1);
    let mut data = data;
    while v < CURRENT_VERSION {
        data = match v {
            1 => migrate_1_to_2(data)?,
            2 => migrate_2_to_3(data)?,
            _ => return Err(Error::UnknownVersion(v)),
        };
        v += 1;
    }
    Ok(data)
}
```

**Правила**:
- Перед миграцией — backup: `<file>.v<N>.bak` рядом с оригиналом.
- Миграции идемпотентны и односторонние (downgrade не поддерживаем).
- Если `version > CURRENT_VERSION` (файл из новой версии приложения) — refuse to open, показать сообщение «обновите приложение».
- Добавление опциональных полей — НЕ bump version (forward-compat).
- Переименование / удаление поля / смена семантики — bump version + migrator.

## v1 (стартовая схема)

```json
{
  "version": 1,
  "id": "uuid",
  "name": "Banking",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "palettes": [
    {
      "id": "uuid",
      "name": "CASH",
      "tags": [],
      "colors": [
        { "id": "uuid", "hex": "#66BB6A", "alpha": 1.0, "name": "изумруд", "role": "primary" }
      ]
    }
  ]
}
```

`tags: string[]` включён сразу в v1 (слот для будущего поиска/фильтрации).

## Альтернативы

- **Semver**: избыточно для локального JSON, нет отдельной семантики major/minor.
- **Без миграций + опциональные поля**: работает до первого breaking change, потом всё равно нужен migrator.

## Последствия

- + Простая эволюция, явные точки миграции в коде.
- + Backup защищает от ошибок миграции.
- − Нужно дисциплинированно писать migrator при каждом breaking change.
