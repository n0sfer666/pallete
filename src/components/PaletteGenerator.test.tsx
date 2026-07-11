import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'solid-js/web';
import type { Project } from '~/ipc/types';
import { projectState, setProject, addPalette, updateColor } from '~/store/project';
import { clearHistory, canRedo, undo } from '~/store/undo';
import {
  disableGenerator,
  enableGenerator,
  setBaseHex,
  setShadeParam,
} from '~/store/generator';
import { PaletteGenerator } from './PaletteGenerator';

const makeProject = (): Project => ({
  version: 1,
  id: 'p-1',
  name: 'Test',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  palettes: [],
});

const colorsOf = (): { id: string; hex: string; name?: string }[] =>
  projectState.project?.palettes[0]?.colors ?? [];

const names = (): (string | undefined)[] => colorsOf().map((c) => c.name);

describe('PaletteGenerator', () => {
  let container: HTMLDivElement;
  let dispose: () => void;
  let paletteId: string;

  beforeEach(() => {
    clearHistory();
    setProject(makeProject(), '/tmp/test.palette.json');
    paletteId = addPalette('Gen').id;
    enableGenerator(paletteId);
    container = document.createElement('div');
    document.body.appendChild(container);
    dispose = render(() => <PaletteGenerator paletteId={paletteId} />, container);
  });

  afterEach(() => {
    dispose();
    container.remove();
    disableGenerator(paletteId);
  });

  it('fills the palette on mount with default params', () => {
    expect(names()).toEqual(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });

  it('renders mode select and four shade inputs', () => {
    expect(container.querySelectorAll('select')).toHaveLength(1);
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(4);
  });

  it('regenerates live when a param changes', () => {
    setShadeParam(paletteId, 'step', 50);
    expect(names()).toEqual([
      '50', '100', '150', '200', '250', '300', '350', '400', '450',
      '500', '550', '600', '650', '700', '750', '800', '850', '900',
    ]);
  });

  it('shows an error and clears colors on invalid params', () => {
    setShadeParam(paletteId, 'step', 0);
    expect(colorsOf()).toHaveLength(0);
    expect(container.textContent).toContain('Шаг');
  });

  it('recovers from an invalid param without reload', () => {
    setShadeParam(paletteId, 'step', 0);
    setShadeParam(paletteId, 'step', 100);
    expect(names()).toHaveLength(10);
  });

  it('reverts a regeneration with a single undo', () => {
    setShadeParam(paletteId, 'step', 50);
    expect(names()).toHaveLength(18);
    undo();
    expect(names()).toHaveLength(10);
  });

  it('keeps an undone generation undone across a remount', () => {
    undo();
    expect(colorsOf()).toHaveLength(0);
    dispose();
    dispose = render(() => <PaletteGenerator paletteId={paletteId} />, container);
    expect(colorsOf()).toHaveLength(0);
    expect(canRedo()).toBe(true);
  });

  it('keeps manual edits made after a generation across a remount', () => {
    const colorId = colorsOf()[0]?.id ?? '';
    updateColor(paletteId, colorId, { name: 'custom' });
    dispose();
    dispose = render(() => <PaletteGenerator paletteId={paletteId} />, container);
    expect(names()[0]).toBe('custom');
  });

  it('rejects a degenerate scale built from a near-white base', () => {
    setBaseHex(paletteId, '#FFFFFF');
    expect(colorsOf()).toHaveLength(0);
    expect(container.textContent).toContain('вырождается');
  });
});
