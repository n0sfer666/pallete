import { For, Show, type Component } from 'solid-js';
import {
  ANGLE_FIELD_MAX,
  ANGLE_FIELD_MIN,
  ANGLED_SCHEMES,
  type HarmonyParams,
  type HarmonyScheme,
} from '~/lib/generate/harmony';
import { setHarmonyAngle, setHarmonyScheme } from '~/store/generator';
import { NumberField } from './NumberField';
import styles from './fields.module.css';

interface HarmonyFieldsProps {
  paletteId: string;
  params: HarmonyParams;
}

const SCHEMES: { value: HarmonyScheme; label: string }[] = [
  { value: 'complementary', label: 'Комплементарная' },
  { value: 'analogous', label: 'Аналоговая' },
  { value: 'triadic', label: 'Триада' },
  { value: 'split', label: 'Раздельно-комплементарная' },
  { value: 'tetradic', label: 'Тетрада (квадрат)' },
];

const schemeFrom = (value: string): HarmonyScheme | null =>
  SCHEMES.find((scheme) => scheme.value === value)?.value ?? null;

export const HarmonyFields: Component<HarmonyFieldsProps> = (props) => {
  const changeScheme = (value: string): void => {
    const scheme = schemeFrom(value);
    if (scheme) setHarmonyScheme(props.paletteId, scheme);
  };

  return (
    <div class={styles.fields}>
      <label class={styles.field}>
        <span class={styles.fieldLabel}>схема</span>
        <select
          class={styles.space}
          value={props.params.scheme}
          onChange={(e) => changeScheme(e.currentTarget.value)}
        >
          <For each={SCHEMES}>
            {(scheme) => <option value={scheme.value}>{scheme.label}</option>}
          </For>
        </select>
      </label>
      <Show when={ANGLED_SCHEMES.includes(props.params.scheme)}>
        <NumberField
          label="угол°"
          value={props.params.angle}
          min={ANGLE_FIELD_MIN}
          max={ANGLE_FIELD_MAX}
          step={1}
          onCommit={(value) => setHarmonyAngle(props.paletteId, value)}
        />
      </Show>
    </div>
  );
};
