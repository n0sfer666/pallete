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
import { formatHex, parseHex, withAlpha } from '~/lib/color/hex';
import type { Rgb } from '~/lib/color/types';
import layout from './Layout.module.css';
import styles from './PaletteDetails.module.css';

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
    const parsed = parseHex(value);
    if (!parsed) return;
    const hex = formatHex(parsed.rgb);
    if (hex === null) return;
    if (parsed.alpha === null) {
      updateColor(paletteId, colorId, { hex });
      return;
    }
    updateColor(paletteId, colorId, { hex, alpha: parsed.alpha });
  };

  const commitRgb = (paletteId: string, colorId: string, value: string): void => {
    const m = RGB_RE.exec(value.trim());
    if (!m) return;
    const channel = (raw: string | undefined): number =>
      Math.min(255, Math.max(0, parseInt(raw ?? '0', 10))) / 255;
    const hex = formatHex({ r: channel(m[1]), g: channel(m[2]), b: channel(m[3]) });
    if (hex === null) return;
    const alpha = m[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(m[4]))) : 1;
    updateColor(paletteId, colorId, { hex, alpha });
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

const toHexString = (c: Color): string => withAlpha(c.hex, c.alpha) ?? c.hex;

const toRgbString = (c: Color): string => formatColor(c.hex, c.alpha, 'rgb');

const formatColor = (hex: string, alpha: number, format: 'hex' | 'rgb' | 'hsl'): string => {
  if (format === 'hex') return hex;
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  if (format === 'rgb') return rgbToCss(parsed.rgb, alpha);
  return rgbToHsl(parsed.rgb, alpha);
};

const rgbToCss = ({ r, g, b }: Rgb, a: number): string => {
  const channels = [r, g, b].map((channel) => Math.round(channel * 255)).join(', ');
  return a < 1 ? `rgba(${channels}, ${a})` : `rgb(${channels})`;
};

const rgbToHsl = ({ r, g, b }: Rgb, a: number): string => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (l > 0.5 ? 2 - max - min : max + min);
  const h = d === 0 ? 0 : hueOf({ r, g, b }, max, d) * 60;
  const parts = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  return a < 1 ? `hsla(${parts}, ${a})` : `hsl(${parts})`;
};

const hueOf = ({ r, g, b }: Rgb, max: number, d: number): number => {
  if (max === r) return (g - b) / d + (g < b ? 6 : 0);
  if (max === g) return (b - r) / d + 2;
  return (r - g) / d + 4;
};
