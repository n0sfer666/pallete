import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'solid-js/web';
import type { Project } from '~/ipc/types';
import { projectState, setProject, addPalette, updateColor } from '~/store/project';
import { clearHistory, canRedo, undo } from '~/store/undo';
import {
  disableGenerator,
  enableGenerator,
  setBaseHex,
  setHarmonyScheme,
  setMode,
  setSemanticScale,
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

const colorsOf = (): { id: string; hex: string; alpha: number; name?: string }[] =>
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

  it('switches to harmony and exposes the scheme select', () => {
    setMode(paletteId, 'harmony');
    expect(names()).toEqual(['base', 'complement']);
    expect(container.querySelectorAll('select')).toHaveLength(2);
  });

  it('shows the angle input only for angled harmony schemes', () => {
    setMode(paletteId, 'harmony');
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0);
    setHarmonyScheme(paletteId, 'analogous');
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(1);
    expect(names()).toEqual(['analogous-1', 'base', 'analogous-2']);
  });

  it('does not resurrect a cleared palette when a failing generator remounts', () => {
    setShadeParam(paletteId, 'step', 0);
    expect(colorsOf()).toHaveLength(0);
    undo();
    expect(colorsOf()).toHaveLength(10);
    dispose();
    dispose = render(() => <PaletteGenerator paletteId={paletteId} />, container);
    expect(colorsOf()).toHaveLength(10);
    expect(canRedo()).toBe(true);
  });

  it('expands the semantic set into scales when the checkbox is on', () => {
    setMode(paletteId, 'semantic');
    expect(names()).toEqual(['primary', 'success', 'warning', 'danger', 'info', 'neutral']);
    setSemanticScale(paletteId, true);
    expect(names()).toHaveLength(18);
    expect(names()[0]).toBe('primary-light');
  });
});
