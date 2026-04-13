import { For, Show, createMemo, createSignal, type Component } from 'solid-js';
import {
  importState,
  setText,
  setOptions,
  applyImport,
  closeImport,
  totalImportColors,
  findConflicts,
  type DuplicateStrategy,
} from '~/store/import';
import styles from './ImportDialog.module.css';

const LIMIT_COLORS = 10_000;
const LIMIT_BYTES = 1024 * 1024;

export const ImportDialog: Component = () => {
  const [strategy, setStrategy] = createSignal<DuplicateStrategy>('merge');

  const conflicts = createMemo(() => findConflicts());
  const overLimit = createMemo(
    () => importState.text.length > LIMIT_BYTES || totalImportColors() > LIMIT_COLORS,
  );
  const isEmpty = createMemo(() => !importState.text.trim());
  const canApply = createMemo(
    () => !!importState.result && !overLimit() && !isEmpty() && !importState.error,
  );

  return (
    <Show when={importState.open}>
      <div class={styles.backdrop} onClick={closeImport}>
        <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header class={styles.header}>
            <h2>Импорт палитры</h2>
            <button onClick={closeImport}>×</button>
          </header>

          <div class={styles.body}>
            <div class={styles.left}>
              <textarea
                class={styles.textarea}
                value={importState.text}
                placeholder="Вставьте текст…"
                onInput={(e) => setText(e.currentTarget.value)}
              />
              <div class={styles.options}>
                <label>
                  <input
                    type="checkbox"
                    checked={importState.options.firstRowIsHeader === true}
                    onChange={(e) => setOptions({ firstRowIsHeader: e.currentTarget.checked })}
                  />
                  Первая строка — заголовок
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={importState.options.firstColIsName === true}
                    onChange={(e) => setOptions({ firstColIsName: e.currentTarget.checked })}
                  />
                  Первая колонка — имена палитр
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={importState.options.acceptHexWithoutHash ?? false}
                    onChange={(e) =>
                      setOptions({ acceptHexWithoutHash: e.currentTarget.checked })
                    }
                  />
                  Hex без #
                </label>
              </div>
            </div>

            <div class={styles.right}>
              <Show
                when={importState.result && importState.result.palettes.length > 0}
                fallback={<div class={styles.empty}>Палитры не распознаны</div>}
              >
                <For each={importState.result?.palettes ?? []}>
                  {(p) => (
                    <div class={styles.palette}>
                      <div class={styles.paletteName}>
                        {p.name}
                        <span class={styles.count}>{p.colors.length}</span>
                      </div>
                      <div class={styles.swatches}>
                        <For each={p.colors}>
                          {(c) => (
                            <div
                              class={styles.swatch}
                              style={{ 'background-color': c.hex, opacity: c.alpha }}
                              title={c.hex}
                            />
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </div>

          <footer class={styles.footer}>
            <Show when={overLimit()}>
              <div class={styles.warning}>
                Превышен лимит: {importState.text.length} байт / {totalImportColors()} цветов
                (макс. 1 MB / 10 000)
              </div>
            </Show>
            <Show when={importState.error}>
              <div class={styles.warning}>{importState.error}</div>
            </Show>
            <Show when={conflicts().length > 0}>
              <div class={styles.conflicts}>
                Конфликты ({conflicts().length}):
                <select
                  value={strategy()}
                  onChange={(e) => setStrategy(e.currentTarget.value as DuplicateStrategy)}
                >
                  <option value="merge">merge</option>
                  <option value="replace">replace</option>
                  <option value="skip">skip</option>
                </select>
              </div>
            </Show>
            <div class={styles.actions}>
              <button onClick={closeImport}>Отмена</button>
              <button
                disabled={!canApply()}
                onClick={() => applyImport(strategy())}
                class={styles.apply}
              >
                Импортировать
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Show>
  );
};
