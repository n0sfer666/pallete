import { For, Show, type Component } from 'solid-js';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import {
  projectState,
  addColor,
  removeColor,
  renamePalette,
  duplicatePalette,
} from '~/store/project';
import { selection, selectColor } from '~/store/selection';
import { workspaceState } from '~/store/workspace';
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

  const handleCopy = async (hex: string, alpha: number): Promise<void> => {
    const format = workspaceState.workspace?.settings.copyFormat ?? 'hex';
    const text = formatColor(hex, alpha, format);
    await writeText(text);
  };

  const handleAddColor = (): void => {
    const pal = activePalette();
    if (!pal) return;
    addColor(pal.id, { hex: '#CCCCCC', alpha: 1 });
  };

  return (
    <div class={layout.column}>
      <div class={layout.columnHeader}>Настройка палитры</div>
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
                <button onClick={handleAddColor}>+ Цвет</button>
              </div>
              <div class={styles.colorList}>
                <For each={palette().colors} fallback={<div class={layout.empty}>Нет цветов</div>}>
                  {(c) => {
                    const isSelected = (): boolean => {
                      const s = selection();
                      return s.kind === 'color' && s.colorId === c.id;
                    };
                    return (
                      <div
                        classList={{ [styles.colorRow]: true, [styles.selected]: isSelected() }}
                        onClick={() => selectColor(palette().id, c.id)}
                      >
                        <div class={styles.chip} style={{ 'background-color': c.hex, opacity: c.alpha }} />
                        <span class={styles.hex} onClick={(e) => { e.stopPropagation(); handleCopy(c.hex, c.alpha); }}>
                          {c.hex}
                        </span>
                        <span class={styles.name}>{c.name ?? ''}</span>
                        <span class={styles.role}>{c.role ?? ''}</span>
                        <button
                          class={styles.remove}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeColor(palette().id, c.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  }}
                </For>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};

const formatColor = (hex: string, alpha: number, format: 'hex' | 'rgb' | 'hsl'): string => {
  if (format === 'hex') return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (format === 'rgb') {
    return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
  }
  return hexToHsl(r, g, b, alpha);
};

const hexToHsl = (r: number, g: number, b: number, a: number): string => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  const H = Math.round(h);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return a < 1 ? `hsla(${H}, ${S}%, ${L}%, ${a})` : `hsl(${H}, ${S}%, ${L}%)`;
};
