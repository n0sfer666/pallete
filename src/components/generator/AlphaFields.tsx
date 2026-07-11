import { For, type Component } from 'solid-js';
import type { AlphaParams } from '~/lib/generate/alpha';
import { ALPHA_MAX } from '~/lib/generate/steps';
import { setAlphaParam } from '~/store/generator';
import { NumberField } from './NumberField';
import styles from './fields.module.css';

interface AlphaFieldsProps {
  paletteId: string;
  params: AlphaParams;
}

const FIELDS: { key: keyof AlphaParams; label: string }[] = [
  { key: 'from', label: 'от %' },
  { key: 'to', label: 'до %' },
  { key: 'step', label: 'шаг %' },
];

export const AlphaFields: Component<AlphaFieldsProps> = (props) => (
  <div class={styles.fields}>
    <For each={FIELDS}>
      {(field) => (
        <NumberField
          label={field.label}
          value={props.params[field.key]}
          min={0}
          max={ALPHA_MAX}
          step={1}
          onCommit={(value) => setAlphaParam(props.paletteId, field.key, value)}
        />
      )}
    </For>
  </div>
);
