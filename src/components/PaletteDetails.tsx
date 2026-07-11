import { For, Show, type Component } from 'solid-js';
import { projectState, addColor, renamePalette, duplicatePalette } from '~/store/project';
import { selection } from '~/store/selection';
import { disableGenerator, enableGenerator, isGeneratorEnabled } from '~/store/generator';
import { ColorRow } from './ColorRow';
import { PaletteGenerator } from './PaletteGenerator';
import layout from './Layout.module.css';
import styles from './PaletteDetails.module.css';

export const PaletteDetails: Component = () => {
  const activePalette = () => {
    const s = selection();
    const p = projectState.project;
    if (!p) return null;
    const id = s.kind === 'palette' || s.kind === 'color' ? s.paletteId : null;
    return id ? (p.palettes.find((x) => x.id === id) ?? null) : null;
  };

  const handleAddColor = (): void => {
    const pal = activePalette();
    if (!pal) return;
    addColor(pal.id, { hex: '#CCCCCC', alpha: 1 });
  };

  const toggleGenerator = (paletteId: string, on: boolean): void => {
    if (on) enableGenerator(paletteId);
    else disableGenerator(paletteId);
  };

  const canGenerate = (): boolean => {
    const pal = activePalette();
    if (!pal) return false;
    return pal.colors.length === 0 || isGeneratorEnabled(pal.id);
  };

  return (
    <div class={layout.column}>
      <div class={layout.columnHeader}>
        Настройка палитры
        <Show when={canGenerate() && activePalette()}>
          {(palette) => (
            <label class={styles.generatorToggle}>
              <input
                type="checkbox"
                checked={isGeneratorEnabled(palette().id)}
                onChange={(e) => toggleGenerator(palette().id, e.currentTarget.checked)}
              />
              Генерация
            </label>
          )}
        </Show>
      </div>
      <div class={layout.columnBody}>
        <Show when={activePalette()} fallback={<div class={layout.empty}>Выберите палитру</div>}>
          {(palette) => (
            <>
              <div class={styles.head}>
                <input
                  class={styles.nameInput}
                  value={palette().name}
                  onChange={(e) => renamePalette(palette().id, e.currentTarget.value)}
                />
                <button onClick={() => duplicatePalette(palette().id)}>Дубликат</button>
                <Show when={!isGeneratorEnabled(palette().id)}>
                  <button onClick={handleAddColor}>+ Цвет</button>
                </Show>
              </div>
              <Show when={isGeneratorEnabled(palette().id)}>
                <PaletteGenerator paletteId={palette().id} />
              </Show>
              <div class={styles.colorList}>
                <For each={palette().colors} fallback={<div class={layout.empty}>Нет цветов</div>}>
                  {(c) => (
                    <ColorRow
                      paletteId={palette().id}
                      color={c}
                      readonly={isGeneratorEnabled(palette().id)}
                    />
                  )}
                </For>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};
