import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from 'solid-js/web';
import type { Project } from '~/ipc/types';
import { projectState, setProject, addPalette } from '~/store/project';
import { clearHistory, undo } from '~/store/undo';
import { disableGenerator, enableGenerator, setMode } from '~/store/generator';
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

describe('PaletteGenerator interpolate fields', () => {
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
    setMode(paletteId, 'interpolate');
  });

  afterEach(() => {
    dispose();
    container.remove();
    disableGenerator(paletteId);
  });

  const hexField = (): HTMLInputElement => {
    const field = container.querySelector('input[type="text"]');
    if (!(field instanceof HTMLInputElement)) throw new Error('no hex field');
    return field;
  };

  const picker = (): HTMLInputElement => {
    const field = container.querySelector('input[type="color"]');
    if (!(field instanceof HTMLInputElement)) throw new Error('no picker');
    return field;
  };

  const commit = (field: HTMLInputElement, value: string): void => {
    field.value = value;
    field.dispatchEvent(new Event('change', { bubbles: true }));
  };

  it('reads the endpoint alpha from an eight-digit hex input', () => {
    commit(hexField(), '#FF000080');
    expect(colorsOf()[0]?.hex).toBe('#FF0000');
    expect(colorsOf()[0]?.alpha).toBeCloseTo(0.5, 2);
  });

  it('keeps the endpoint alpha when the color picker moves', () => {
    commit(hexField(), '#FF000080');
    commit(picker(), '#00ff00');
    expect(colorsOf()[0]?.hex).toBe('#00FF00');
    expect(colorsOf()[0]?.alpha).toBeCloseTo(0.5, 2);
  });

  it('reverts a hex commit with a single undo', () => {
    const before = colorsOf().map((color) => color.hex);
    commit(hexField(), '#FF000080');
    undo();
    expect(colorsOf().map((color) => color.hex)).toEqual(before);
  });

  it('falls back to a neutral swatch while the hex is unparsable', () => {
    commit(hexField(), 'ZZZ');
    expect(picker().value).toBe('#000000');
    expect(container.textContent).toContain('Некорректный');
  });

  it('recovers a broken endpoint when the picker opens on an unparsable hex', () => {
    commit(hexField(), 'ZZZ');
    expect(colorsOf()).toHaveLength(0);
    picker().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(colorsOf()[0]?.hex).toBe('#000000');
  });

  it('snaps the hex field back to the canonical value when input normalizes to it', () => {
    const field = hexField();
    commit(field, '#3b82f6ff');
    expect(field.value).toBe('#3B82F6');
  });
});
