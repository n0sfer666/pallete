import type { Component } from 'solid-js';
import type { Color } from '~/ipc/types';
import { updateColor } from '~/store/project';
import styles from './ColorRow.module.css';

interface ColorEditorProps {
  paletteId: string;
  color: Color;
  rgbValue: string;
  onCommitRgb: (value: string) => void;
}

export const ColorEditor: Component<ColorEditorProps> = (props) => {
  const commitAlpha = (raw: string): void => {
    const value = parseFloat(raw);
    if (Number.isNaN(value)) return;
    updateColor(props.paletteId, props.color.id, {
      alpha: Math.min(1, Math.max(0, value)),
    });
  };

  return (
    <div class={styles.editor}>
      <span>RGB</span>
      <input
        class={styles.editInput}
        value={props.rgbValue}
        onChange={(e) => props.onCommitRgb(e.currentTarget.value)}
      />
      <span>Alpha</span>
      <div class={styles.alphaRow}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.color.alpha}
          onInput={(e) => commitAlpha(e.currentTarget.value)}
        />
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={props.color.alpha}
          onChange={(e) => commitAlpha(e.currentTarget.value)}
        />
      </div>
    </div>
  );
};
