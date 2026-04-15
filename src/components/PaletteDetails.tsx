import { For, Show, type Component } from 'solid-js';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import type { Color } from '~/ipc/types';
import {
  projectState,
  addColor,
  removeColor,
  renamePalette,
  duplicatePalette,
  updateColor,
} from '~/store/project';
import { selection, selectColor } from '~/store/selection';
import { workspaceState } from '~/store/workspace';
import layout from './Layout.module.css';
import styles from './PaletteDetails.module.css';

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;
const HEX8_RE = /^#[0-9a-fA-F]{8}$/;
const RGB_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

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
    await writeText(formatColor(hex, alpha, format));
  };

  const handleAddColor = (): void => {
    const pal = activePalette();
    if (!pal) return;
    addColor(pal.id, { hex: '#CCCCCC', alpha: 1 });
  };

  const commitHex = (paletteId: string, colorId: string, value: string): void => {
    const v = value.startsWith('#') ? value : `#${value}`;
    if (HEX8_RE.test(v)) {
      const hex = v.slice(0, 7).toUpperCase();
      const alpha = parseInt(v.slice(7, 9), 16) / 255;
      updateColor(paletteId, colorId, { hex, alpha });
      return;
    }
    if (HEX6_RE.test(v)) {
      updateColor(paletteId, colorId, { hex: v.toUpperCase() });
    }
  };

  const commitRgb = (paletteId: string, colorId: string, value: string): void => {
    const m = RGB_RE.exec(value.trim());
    if (!m) return;
    const r = Math.min(255, Math.max(0, parseInt(m[1] ?? '0', 10)));
    const g = Math.min(255, Math.max(0, parseInt(m[2] ?? '0', 10)));
    const b = Math.min(255, Math.max(0, parseInt(m[3] ?? '0', 10)));
    const a = m[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(m[4]))) : 1;
    const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    updateColor(paletteId, colorId, { hex, alpha: a });
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
                        classList={{ [styles.colorItem]: true, [styles.selected]: isSelected() }}
                      >
                        <div
                          class={styles.colorRow}
                          onClick={() => selectColor(palette().id, c.id)}
                        >
                          <label
                            class={styles.chip}
                            style={{ 'background-color': c.hex, opacity: c.alpha }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="color"
                              value={c.hex}
                              onChange={(e) =>
                                updateColor(palette().id, c.id, {
                                  hex: e.currentTarget.value.toUpperCase(),
                                })
                              }
                            />
                          </label>
                          <Show
                            when={isSelected()}
                            fallback={<span class={styles.hex}>{toHexString(c)}</span>}
                          >
                            <input
                              class={styles.editInput}
                              value={toHexString(c)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                commitHex(palette().id, c.id, e.currentTarget.value)
                              }
                            />
                          </Show>
                          <Show
                            when={isSelected()}
                            fallback={<span class={styles.name}>{c.name ?? ''}</span>}
                          >
                            <input
                              class={`${styles.editInput} ${styles.nameEdit}`}
                              placeholder="имя"
                              value={c.name ?? ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const v = e.currentTarget.value.trim();
                                updateColor(palette().id, c.id, v ? { name: v } : {});
                              }}
                            />
                          </Show>
                          <button
                            class={styles.copy}
                            title="Копировать"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCopy(c.hex, c.alpha);
                            }}
                          >
                            ⧉
                          </button>
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
                        <Show when={isSelected()}>
                          <div class={styles.editor}>
                            <span>RGB</span>
                            <input
                              class={styles.editInput}
                              value={toRgbString(c)}
                              onChange={(e) =>
                                commitRgb(palette().id, c.id, e.currentTarget.value)
                              }
                            />
                            <span>Alpha</span>
                            <div class={styles.alphaRow}>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={c.alpha}
                                onInput={(e) =>
                                  updateColor(palette().id, c.id, {
                                    alpha: parseFloat(e.currentTarget.value),
                                  })
                                }
                              />
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={c.alpha}
                                onChange={(e) => {
                                  const v = parseFloat(e.currentTarget.value);
                                  if (!Number.isNaN(v)) {
                                    updateColor(palette().id, c.id, {
                                      alpha: Math.min(1, Math.max(0, v)),
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </Show>
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

const toHexString = (c: Color): string => {
  if (c.alpha >= 1) return c.hex;
  const a = Math.round(c.alpha * 255).toString(16).padStart(2, '0').toUpperCase();
  return `${c.hex}${a}`;
};

const toRgbString = (c: Color): string => {
  const r = parseInt(c.hex.slice(1, 3), 16);
  const g = parseInt(c.hex.slice(3, 5), 16);
  const b = parseInt(c.hex.slice(5, 7), 16);
  return c.alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${c.alpha})` : `rgb(${r}, ${g}, ${b})`;
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
