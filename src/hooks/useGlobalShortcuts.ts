import { onCleanup, onMount } from 'solid-js';
import { undo, redo } from '~/store/undo';
import { selection, clearSelection } from '~/store/selection';
import { removePalette, removeColor } from '~/store/project';

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
};

export const useGlobalShortcuts = (): void => {
  const handler = (e: KeyboardEvent): void => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditable(e.target)) {
      const s = selection();
      if (s.kind === 'palette') {
        e.preventDefault();
        removePalette(s.paletteId);
        clearSelection();
      } else if (s.kind === 'color') {
        e.preventDefault();
        removeColor(s.paletteId, s.colorId);
      }
    }
  };

  onMount(() => document.addEventListener('keydown', handler));
  onCleanup(() => document.removeEventListener('keydown', handler));
};
