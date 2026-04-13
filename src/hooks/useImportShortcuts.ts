import { onCleanup, onMount } from 'solid-js';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { openImport } from '~/store/import';

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
};

export const useImportShortcuts = (): void => {
  const handler = async (e: KeyboardEvent): Promise<void> => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || e.key.toLowerCase() !== 'v' || e.shiftKey) return;
    if (isEditable(e.target)) return;
    e.preventDefault();
    try {
      const text = await readText();
      if (text && text.trim()) openImport(text);
    } catch {
      // clipboard inaccessible — silently ignore
    }
  };

  onMount(() => document.addEventListener('keydown', handler));
  onCleanup(() => document.removeEventListener('keydown', handler));
};
