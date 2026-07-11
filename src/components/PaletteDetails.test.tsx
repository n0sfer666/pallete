import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'solid-js/web';
import type { Project } from '~/ipc/types';
import { projectState, setProject, addPalette, addColor } from '~/store/project';
import { clearHistory } from '~/store/undo';
import { selectPalette, clearSelection } from '~/store/selection';
import { disableGenerator, isGeneratorEnabled } from '~/store/generator';
import { PaletteDetails } from './PaletteDetails';

const makeProject = (): Project => ({
  version: 1,
  id: 'p-1',
  name: 'Test',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  palettes: [],
});

const colorsOf = (): { hex: string }[] => projectState.project?.palettes[0]?.colors ?? [];

describe('PaletteDetails generator switch', () => {
  let container: HTMLDivElement;
  let dispose: () => void;
  let paletteId: string;

  const toggle = (): HTMLInputElement | null =>
    container.querySelector('input[type="checkbox"]');

  beforeEach(() => {
    clearHistory();
    setProject(makeProject(), '/tmp/test.palette.json');
    paletteId = addPalette('Gen').id;
    selectPalette(paletteId);
    container = document.createElement('div');
    document.body.appendChild(container);
    dispose = render(() => <PaletteDetails />, container);
  });

  afterEach(() => {
    dispose();
    container.remove();
    disableGenerator(paletteId);
    clearSelection();
  });

  it('shows the switch for an empty palette', () => {
    expect(toggle()).not.toBeNull();
  });

  it('generates colors when the switch is turned on', () => {
    toggle()?.click();
    expect(isGeneratorEnabled(paletteId)).toBe(true);
    expect(colorsOf()).toHaveLength(10);
  });

  it('freezes generated colors when the switch is turned off', () => {
    toggle()?.click();
    const generated = colorsOf().map((c) => c.hex);
    toggle()?.click();
    expect(isGeneratorEnabled(paletteId)).toBe(false);
    expect(colorsOf().map((c) => c.hex)).toEqual(generated);
    expect(toggle()).toBeNull();
  });

  it('hides the switch for a palette that already has colors', () => {
    addColor(paletteId, { hex: '#123456', alpha: 1 });
    expect(toggle()).toBeNull();
  });
});
