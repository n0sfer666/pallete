import { describe, it, expect, beforeEach } from 'vitest';
import {
  projectState,
  setProject,
  addPalette,
  removePalette,
  renamePalette,
  duplicatePalette,
  addColor,
  removeColor,
  replaceColors,
} from '~/store/project';
import { undo, redo, clearHistory, canUndo } from '~/store/undo';
import type { Project } from '~/ipc/types';

const makeProject = (): Project => ({
  version: 1,
  id: 'p-1',
  name: 'Test',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  palettes: [],
});

describe('project store', () => {
  beforeEach(() => {
    clearHistory();
    setProject(makeProject(), '/tmp/test.palette.json');
  });

  it('adds palette and undoes', () => {
    const p = addPalette('Primary');
    expect(projectState.project?.palettes).toHaveLength(1);
    undo();
    expect(projectState.project?.palettes).toHaveLength(0);
    redo();
    expect(projectState.project?.palettes[0]?.id).toBe(p.id);
  });

  it('removes palette and undoes', () => {
    const p = addPalette('X');
    removePalette(p.id);
    expect(projectState.project?.palettes).toHaveLength(0);
    undo();
    expect(projectState.project?.palettes[0]?.id).toBe(p.id);
  });

  it('renames palette and undoes', () => {
    const p = addPalette('A');
    renamePalette(p.id, 'B');
    expect(projectState.project?.palettes[0]?.name).toBe('B');
    undo();
    expect(projectState.project?.palettes[0]?.name).toBe('A');
  });

  it('duplicates palette with new ids', () => {
    const p = addPalette('Orig');
    addColor(p.id, { hex: '#FF0000', alpha: 1 });
    const dup = duplicatePalette(p.id);
    expect(dup).not.toBeNull();
    expect(dup?.id).not.toBe(p.id);
    expect(dup?.colors[0]?.id).not.toBe(projectState.project?.palettes[0]?.colors[0]?.id);
  });

  it('adds and removes color with undo', () => {
    const p = addPalette('C');
    const c = addColor(p.id, { hex: '#00FF00', alpha: 1 });
    expect(projectState.project?.palettes[0]?.colors).toHaveLength(1);
    removeColor(p.id, c.id);
    expect(projectState.project?.palettes[0]?.colors).toHaveLength(0);
    undo();
    expect(projectState.project?.palettes[0]?.colors[0]?.id).toBe(c.id);
  });

  it('rename to empty string is ignored', () => {
    const p = addPalette('Keep');
    renamePalette(p.id, '   ');
    expect(projectState.project?.palettes[0]?.name).toBe('Keep');
  });

  it('replaces colors as a single undoable step', () => {
    const p = addPalette('Gen');
    addColor(p.id, { hex: '#111111', alpha: 1 });
    replaceColors(p.id, [
      { hex: '#AAAAAA', alpha: 1, name: '50' },
      { hex: '#BBBBBB', alpha: 1, name: '100' },
      { hex: '#CCCCCC', alpha: 1, name: '200' },
    ]);
    expect(projectState.project?.palettes[0]?.colors).toHaveLength(3);
    undo();
    const colors = projectState.project?.palettes[0]?.colors;
    expect(colors).toHaveLength(1);
    expect(colors?.[0]?.hex).toBe('#111111');
    redo();
    expect(projectState.project?.palettes[0]?.colors[2]?.name).toBe('200');
  });

  it('assigns fresh ids to replaced colors', () => {
    const p = addPalette('Gen');
    replaceColors(p.id, [{ hex: '#AAAAAA', alpha: 1, name: '50' }]);
    const first = projectState.project?.palettes[0]?.colors[0]?.id;
    replaceColors(p.id, [{ hex: '#BBBBBB', alpha: 1, name: '50' }]);
    const second = projectState.project?.palettes[0]?.colors[0]?.id;
    expect(first).toBeTruthy();
    expect(second).not.toBe(first);
  });

  it('skips undo entry when colors are unchanged', () => {
    const p = addPalette('Gen');
    replaceColors(p.id, [{ hex: '#AAAAAA', alpha: 1, name: '50' }]);
    clearHistory();
    replaceColors(p.id, [{ hex: '#AAAAAA', alpha: 1, name: '50' }]);
    expect(canUndo()).toBe(false);
  });

  it('ignores replace for unknown palette', () => {
    addPalette('Gen');
    replaceColors('missing', [{ hex: '#AAAAAA', alpha: 1 }]);
    expect(projectState.project?.palettes[0]?.colors).toHaveLength(0);
  });
});
