import { createEffect, createSignal, untrack, For, Match, Show, Switch } from 'solid-js';
import type { Component } from 'solid-js';
import { generate, type GeneratorParams } from '~/lib/generate';
import type { GeneratedColor, GeneratorMode } from '~/lib/generate/types';
import { generatorFor, setApplied, setBaseHex, setMode } from '~/store/generator';
import { replaceColors } from '~/store/project';
import { ShadeFields } from './generator/ShadeFields';
import { AlphaFields } from './generator/AlphaFields';
import { InterpolateFields } from './generator/InterpolateFields';
import { HarmonyFields } from './generator/HarmonyFields';
import { SemanticFields } from './generator/SemanticFields';
import styles from './PaletteGenerator.module.css';

interface ModeOption {
  value: GeneratorMode;
  label: string;
}

const MODES: ModeOption[] = [
  { value: 'shade', label: 'Оттенки: от x до y с шагом z' },
  { value: 'tonal', label: 'Тональная шкала: 50…950' },
  { value: 'interpolate', label: 'Градиент: цвет A → цвет B' },
  { value: 'alpha', label: 'Шкала прозрачности' },
  { value: 'harmony', label: 'Гармония: комплементарная, триада…' },
  { value: 'semantic', label: 'Семантический набор: success/warning/danger' },
];

const MODES_WITHOUT_BASE: GeneratorMode[] = ['interpolate'];

const modeFrom = (value: string): GeneratorMode | null =>
  MODES.find((mode) => mode.value === value)?.value ?? null;

interface PaletteGeneratorProps {
  paletteId: string;
}

export const PaletteGenerator: Component<PaletteGeneratorProps> = (props) => {
  const [error, setError] = createSignal<string | null>(null);
  const generator = (): ReturnType<typeof generatorFor> => generatorFor(props.paletteId);

  const applyColors = (applied: string | null, signature: string, colors: GeneratedColor[]): void => {
    if (applied === signature) return;
    replaceColors(props.paletteId, colors);
    setApplied(props.paletteId, signature);
  };

  const clearColors = (applied: string | null): void => {
    if (applied === null) return;
    replaceColors(props.paletteId, []);
    setApplied(props.paletteId, null);
  };

  createEffect(() => {
    const state = generator();
    if (!state) return;
    const params: GeneratorParams = {
      mode: state.mode,
      baseHex: state.baseHex,
      shade: { ...state.shade },
      interpolate: { ...state.interpolate },
      alpha: { ...state.alpha },
      harmony: { ...state.harmony },
      semantic: { ...state.semantic },
    };
    const signature = JSON.stringify(params);
    const result = generate(params);
    setError(result.ok ? null : result.error);
    untrack(() =>
      result.ok
        ? applyColors(state.applied, signature, result.value)
        : clearColors(state.applied),
    );
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
            <Show when={!MODES_WITHOUT_BASE.includes(state().mode)}>
              <label class={styles.swatch} style={{ 'background-color': state().baseHex }}>
                <input
                  type="color"
                  value={state().baseHex}
                  onChange={(e) =>
                    setBaseHex(props.paletteId, e.currentTarget.value.toUpperCase())
                  }
                />
              </label>
            </Show>
          </div>

          <Switch>
            <Match when={state().mode === 'shade'}>
              <ShadeFields paletteId={props.paletteId} params={state().shade} />
            </Match>
            <Match when={state().mode === 'interpolate'}>
              <InterpolateFields paletteId={props.paletteId} params={state().interpolate} />
            </Match>
            <Match when={state().mode === 'alpha'}>
              <AlphaFields paletteId={props.paletteId} params={state().alpha} />
            </Match>
            <Match when={state().mode === 'harmony'}>
              <HarmonyFields paletteId={props.paletteId} params={state().harmony} />
            </Match>
            <Match when={state().mode === 'semantic'}>
              <SemanticFields paletteId={props.paletteId} params={state().semantic} />
            </Match>
          </Switch>

          <Show when={error()}>
            {(message) => <div class={styles.error}>{message()}</div>}
          </Show>
        </div>
      )}
    </Show>
  );
};
