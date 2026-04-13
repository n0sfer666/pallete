import { describe, it, expect, beforeEach } from 'vitest';
import { run, undo, redo, canUndo, canRedo, clearHistory } from '~/store/undo';

describe('undo stack', () => {
  beforeEach(() => clearHistory());

  it('runs, undoes, redoes', () => {
    let v = 0;
    run({ label: 'inc', apply: () => { v++; }, revert: () => { v--; } });
    expect(v).toBe(1);
    undo();
    expect(v).toBe(0);
    redo();
    expect(v).toBe(1);
  });

  it('new command clears redo stack', () => {
    const log: string[] = [];
    run({ label: 'a', apply: () => log.push('a'), revert: () => log.push('-a') });
    undo();
    expect(canRedo()).toBe(true);
    run({ label: 'b', apply: () => log.push('b'), revert: () => log.push('-b') });
    expect(canRedo()).toBe(false);
    expect(canUndo()).toBe(true);
    expect(log).toEqual(['a', '-a', 'b']);
  });

  it('undo on empty stack returns null', () => {
    expect(undo()).toBeNull();
  });
});
