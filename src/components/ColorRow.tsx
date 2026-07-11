import { Show, type Component } from 'solid-js';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import type { Color } from '~/ipc/types';
import { removeColor, updateColor } from '~/store/project';
import { selection, selectColor } from '~/store/selection';
import { workspaceState } from '~/store/workspace';
import { formatHex, parseHex } from '~/lib/color/hex';
import { formatColor, toHexString, toRgbString } from '~/lib/color/format';
import { ColorEditor } from './ColorEditor';
import styles from './ColorRow.module.css';

const RGB_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

interface ColorRowProps {
  paletteId: string;
  color: Color;
  readonly: boolean;
}

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

const copyColor = async (hex: string, alpha: number): Promise<void> => {
  const format = workspaceState.workspace?.settings.copyFormat ?? 'hex';
  await writeText(formatColor(hex, alpha, format));
};

export const ColorRow: Component<ColorRowProps> = (props) => {
  const isSelected = (): boolean => {
    const s = selection();
    return s.kind === 'color' && s.colorId === props.color.id;
  };

  const isEditable = (): boolean => isSelected() && !props.readonly;

  return (
    <div classList={{ [styles.colorItem]: true, [styles.selected]: isSelected() }}>
      <div class={styles.colorRow} onClick={() => selectColor(props.paletteId, props.color.id)}>
        <label
          class={styles.chip}
          style={{ 'background-color': props.color.hex, opacity: props.color.alpha }}
          onClick={(e) => e.stopPropagation()}
        >
          <Show when={!props.readonly}>
            <input
              type="color"
              value={props.color.hex}
              onChange={(e) =>
                updateColor(props.paletteId, props.color.id, {
                  hex: e.currentTarget.value.toUpperCase(),
                })
              }
            />
          </Show>
        </label>
        <Show
          when={isEditable()}
          fallback={
            <span class={styles.hex}>{toHexString(props.color.hex, props.color.alpha)}</span>
          }
        >
          <input
            class={styles.editInput}
            value={toHexString(props.color.hex, props.color.alpha)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => commitHex(props.paletteId, props.color.id, e.currentTarget.value)}
          />
        </Show>
        <Show
          when={isEditable()}
          fallback={<span class={styles.name}>{props.color.name ?? ''}</span>}
        >
          <input
            class={`${styles.editInput} ${styles.nameEdit}`}
            placeholder="имя"
            value={props.color.name ?? ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const v = e.currentTarget.value.trim();
              updateColor(props.paletteId, props.color.id, v ? { name: v } : {});
            }}
          />
        </Show>
        <button
          class={styles.copy}
          title="Копировать"
          onClick={(e) => {
            e.stopPropagation();
            void copyColor(props.color.hex, props.color.alpha);
          }}
        >
          ⧉
        </button>
        <Show when={!props.readonly} fallback={<span />}>
          <button
            class={styles.remove}
            onClick={(e) => {
              e.stopPropagation();
              removeColor(props.paletteId, props.color.id);
            }}
          >
            ×
          </button>
        </Show>
      </div>
      <Show when={isEditable()}>
        <ColorEditor
          paletteId={props.paletteId}
          color={props.color}
          rgbValue={toRgbString(props.color.hex, props.color.alpha)}
          onCommitRgb={(value) => commitRgb(props.paletteId, props.color.id, value)}
        />
      </Show>
    </div>
  );
};
