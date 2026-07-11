import { For, type Component } from 'solid-js';
import type { ShadeParams } from '~/lib/generate/shade';
import { SHADE_MAX } from '~/lib/generate/steps';
import { setShadeParam } from '~/store/generator';
import { NumberField } from './NumberField';
import styles from './fields.module.css';

interface ShadeFieldsProps {
  paletteId: string;
  params: ShadeParams;
}

const FIELDS: { key: keyof ShadeParams; label: string }[] = [
  { key: 'from', label: 'от' },
  { key: 'to', label: 'до' },
  { key: 'step', label: 'шаг' },
  { key: 'baseShade', label: 'база' },
];

export const ShadeFields: Component<ShadeFieldsProps> = (props) => (
  <div class={styles.fields}>
    <For each={FIELDS}>
      {(field) => (
        <NumberField
          label={field.label}
          value={props.params[field.key]}
          min={0}
          max={SHADE_MAX}
          step={1}
          onCommit={(value) => setShadeParam(props.paletteId, field.key, value)}
        />
      )}
    </For>
  </div>
);
