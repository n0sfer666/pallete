import { batch, For, type Component, type JSX } from 'solid-js';
import { formatHex, parseHex, withAlpha } from '~/lib/color/hex';
import { MAX_GENERATED } from '~/lib/generate/types';
import {
  MIN_COUNT,
  type InterpolateParams,
  type InterpolateSpace,
} from '~/lib/generate/interpolate';
import { setInterpolateHex, setInterpolateNumber, setInterpolateSpace } from '~/store/generator';
import { HexField } from './HexField';
import { NumberField } from './NumberField';
import styles from './fields.module.css';

interface InterpolateFieldsProps {
  paletteId: string;
  params: InterpolateParams;
}

type Endpoint = 'from' | 'to';

const FALLBACK_HEX = '#000000';

const SPACES: { value: InterpolateSpace; label: string }[] = [
  { value: 'oklab', label: 'OKLab (через серый)' },
  { value: 'oklch', label: 'OKLCH (насыщенный путь)' },
];

const spaceFrom = (value: string): InterpolateSpace | null =>
  SPACES.find((space) => space.value === value)?.value ?? null;

export const InterpolateFields: Component<InterpolateFieldsProps> = (props) => {
  const hexOf = (endpoint: Endpoint): string =>
    endpoint === 'from' ? props.params.fromHex : props.params.toHex;

  const alphaOf = (endpoint: Endpoint): number =>
    endpoint === 'from' ? props.params.fromAlpha : props.params.toAlpha;

  const displayOf = (endpoint: Endpoint): string =>
    withAlpha(hexOf(endpoint), alphaOf(endpoint)) ?? hexOf(endpoint);

  const changeSpace = (value: string): void => {
    const space = spaceFrom(value);
    if (space) setInterpolateSpace(props.paletteId, space);
  };

  const hexKeyOf = (endpoint: Endpoint): 'fromHex' | 'toHex' =>
    endpoint === 'from' ? 'fromHex' : 'toHex';

  const alphaKeyOf = (endpoint: Endpoint): 'fromAlpha' | 'toAlpha' =>
    endpoint === 'from' ? 'fromAlpha' : 'toAlpha';

  const validHexOf = (endpoint: Endpoint): string | null => {
    const parsed = parseHex(hexOf(endpoint));
    return parsed === null ? null : formatHex(parsed.rgb);
  };

  const commitHex = (endpoint: Endpoint, value: string): void => {
    const parsed = parseHex(value);
    const normalized = parsed === null ? null : formatHex(parsed.rgb);
    if (parsed === null || normalized === null) {
      setInterpolateHex(props.paletteId, hexKeyOf(endpoint), value);
      return;
    }
    batch(() => {
      setInterpolateHex(props.paletteId, hexKeyOf(endpoint), normalized);
      setInterpolateNumber(props.paletteId, alphaKeyOf(endpoint), parsed.alpha ?? 1);
    });
  };

  const commitPicker = (endpoint: Endpoint, value: string): void => {
    const parsed = parseHex(value);
    const normalized = parsed === null ? null : formatHex(parsed.rgb);
    if (normalized === null) return;
    setInterpolateHex(props.paletteId, hexKeyOf(endpoint), normalized);
  };

  const openPicker = (endpoint: Endpoint): void => {
    if (validHexOf(endpoint) !== null) return;
    setInterpolateHex(props.paletteId, hexKeyOf(endpoint), FALLBACK_HEX);
  };

  const endpoint = (key: Endpoint, label: string): JSX.Element => (
    <div class={styles.endpoint}>
      <label
        class={styles.swatch}
        style={{ 'background-color': validHexOf(key) ?? 'transparent' }}
      >
        <input
          type="color"
          value={validHexOf(key) ?? FALLBACK_HEX}
          onClick={() => openPicker(key)}
          onChange={(e) => commitPicker(key, e.currentTarget.value)}
        />
      </label>
      <HexField label={label} value={displayOf(key)} onCommit={(v) => commitHex(key, v)} />
    </div>
  );

  return (
    <div class={styles.fields}>
      {endpoint('from', 'цвет A')}
      {endpoint('to', 'цвет B')}
      <NumberField
        label="цветов"
        value={props.params.count}
        min={MIN_COUNT}
        max={MAX_GENERATED}
        step={1}
        onCommit={(value) => setInterpolateNumber(props.paletteId, 'count', value)}
      />
      <label class={styles.field}>
        <span class={styles.fieldLabel}>пространство</span>
        <select
          class={styles.space}
          value={props.params.space}
          onChange={(e) => changeSpace(e.currentTarget.value)}
        >
          <For each={SPACES}>
            {(space) => <option value={space.value}>{space.label}</option>}
          </For>
        </select>
      </label>
    </div>
  );
};
