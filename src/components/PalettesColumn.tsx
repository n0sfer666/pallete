import { For, Show, createSignal, type Component } from 'solid-js';
import { projectState, addPalette, removePalette, renamePalette } from '~/store/project';
import { selection, selectPalette } from '~/store/selection';
import layout from './Layout.module.css';
import styles from './PalettesColumn.module.css';

export const PalettesColumn: Component = () => {
  const [editingId, setEditingId] = createSignal<string | null>(null);

  const activePaletteId = (): string | null => {
    const s = selection();
    if (s.kind === 'palette') return s.paletteId;
    if (s.kind === 'color') return s.paletteId;
    return null;
  };

  const handleAdd = (): void => {
    if (!projectState.project) return;
    const count = projectState.project.palettes.length + 1;
    addPalette(`Palette ${count}`);
  };

  const commitRename = (id: string, input: HTMLInputElement): void => {
    renamePalette(id, input.value.trim());
    setEditingId(null);
  };

  return (
    <div class={layout.column}>
      <div class={layout.columnHeader}>
        <span>Палитры</span>
        <Show when={projectState.project}>
          <button onClick={handleAdd}>+</button>
        </Show>
      </div>
      <div class={layout.columnBody}>
        <Show
          when={projectState.project}
          fallback={<div class={layout.empty}>Выберите проект</div>}
        >
          <For
            each={projectState.project?.palettes ?? []}
            fallback={<div class={layout.empty}>Нет палитр</div>}
          >
            {(palette) => {
              const active = (): boolean => activePaletteId() === palette.id;
              return (
                <div
                  classList={{ [styles.palette]: true, [styles.active]: active() }}
                  onClick={() => selectPalette(palette.id)}
                  onDblClick={() => setEditingId(palette.id)}
                >
                  <div class={styles.head}>
                    <Show
                      when={editingId() === palette.id}
                      fallback={<span class={styles.name}>{palette.name}</span>}
                    >
                      <input
                        class={styles.rename}
                        value={palette.name}
                        autofocus
                        onBlur={(e) => commitRename(palette.id, e.currentTarget)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(palette.id, e.currentTarget);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    </Show>
                    <button
                      class={styles.trash}
                      title="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePalette(palette.id);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                  <div class={styles.swatchRow}>
                    <For each={palette.colors}>
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
              );
            }}
          </For>
        </Show>
      </div>
    </div>
  );
};
