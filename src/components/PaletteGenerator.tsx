import { createEffect, createSignal, untrack, For, Show, type Component } from 'solid-js';
import { generate, type GeneratorParams } from '~/lib/generate';
import type { GeneratorMode } from '~/lib/generate/types';
import type { ShadeParams } from '~/lib/generate/shade';
import { generatorFor, setApplied, setBaseHex, setMode, setShadeParam } from '~/store/generator';
import { replaceColors } from '~/store/project';
import styles from './PaletteGenerator.module.css';

interface ModeOption {
  value: GeneratorMode;
  label: string;
}

interface ShadeField {
  key: keyof ShadeParams;
  label: string;
}

const MODES: ModeOption[] = [{ value: 'shade', label: 'Оттенки: от x до y с шагом z' }];

const SHADE_FIELDS: ShadeField[] = [
  { key: 'from', label: 'от' },
  { key: 'to', label: 'до' },
  { key: 'step', label: 'шаг' },
  { key: 'baseShade', label: 'база' },
];

const modeFrom = (value: string): GeneratorMode | null =>
  MODES.find((mode) => mode.value === value)?.value ?? null;

interface PaletteGeneratorProps {
  paletteId: string;
}

export const PaletteGenerator: Component<PaletteGeneratorProps> = (props) => {
  const [error, setError] = createSignal<string | null>(null);
  const generator = (): ReturnType<typeof generatorFor> => generatorFor(props.paletteId);

  createEffect(() => {
    const state = generator();
    if (!state) return;
    const params: GeneratorParams = {
      mode: state.mode,
      baseHex: state.baseHex,
      shade: { ...state.shade },
    };
    const signature = JSON.stringify(params);
    const result = generate(params);
    setError(result.ok ? null : result.error);
    untrack(() => {
      if (state.applied === signature) return;
      replaceColors(props.paletteId, result.ok ? result.value : []);
      setApplied(props.paletteId, signature);
    });
  });

  const changeMode = (value: string): void => {
    const mode = modeFrom(value);
    if (mode) setMode(props.paletteId, mode);
  };

  return (
    <Show when={generator()}>
      {(state) => (
        <div class={styles.panel}>
          <div class={styles.controls}>
            <select
              class={styles.mode}
              value={state().mode}
              onChange={(e) => changeMode(e.currentTarget.value)}
            >
              <For each={MODES}>
                {(mode) => <option value={mode.value}>{mode.label}</option>}
              </For>
            </select>
            <label class={styles.swatch} style={{ 'background-color': state().baseHex }}>
              <input
                type="color"
                value={state().baseHex}
                onChange={(e) => setBaseHex(props.paletteId, e.currentTarget.value.toUpperCase())}
              />
            </label>
          </div>

          <Show when={state().mode === 'shade'}>
            <div class={styles.fields}>
              <For each={SHADE_FIELDS}>
                {(field) => (
                  <label class={styles.field}>
                    <span class={styles.fieldLabel}>{field.label}</span>
                    <input
                      type="number"
                      value={state().shade[field.key]}
                      onChange={(e) =>
                        setShadeParam(props.paletteId, field.key, e.currentTarget.valueAsNumber)
                      }
                    />
                  </label>
                )}
              </For>
            </div>
          </Show>

          <Show when={error()}>
            {(message) => <div class={styles.error}>{message()}</div>}
          </Show>
        </div>
      )}
    </Show>
  );
};
