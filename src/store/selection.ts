import { createSignal } from 'solid-js';

export type Selection =
  | { kind: 'none' }
  | { kind: 'palette'; paletteId: string }
  | { kind: 'color'; paletteId: string; colorId: string };

const [selection, setSelection] = createSignal<Selection>({ kind: 'none' });

export { selection };

export const selectPalette = (paletteId: string): void => {
  setSelection({ kind: 'palette', paletteId });
};

export const selectColor = (paletteId: string, colorId: string): void => {
  setSelection({ kind: 'color', paletteId, colorId });
};

export const clearSelection = (): void => {
  setSelection({ kind: 'none' });
};
