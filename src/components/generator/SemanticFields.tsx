import type { Component } from 'solid-js';
import type { SemanticParams } from '~/lib/generate/semantic';
import { setSemanticScale } from '~/store/generator';
import styles from './fields.module.css';

interface SemanticFieldsProps {
  paletteId: string;
  params: SemanticParams;
}

export const SemanticFields: Component<SemanticFieldsProps> = (props) => (
  <div class={styles.fields}>
    <label class={styles.checkbox}>
      <input
        type="checkbox"
        checked={props.params.withScale}
        onChange={(e) => setSemanticScale(props.paletteId, e.currentTarget.checked)}
      />
      <span>со шкалой</span>
    </label>
  </div>
);
