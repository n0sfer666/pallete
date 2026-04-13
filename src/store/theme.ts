import { createEffect } from 'solid-js';
import { workspaceState } from '~/store/workspace';

export const applyTheme = (theme: 'light' | 'dark' | 'system'): void => {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export const useThemeSync = (): void => {
  createEffect(() => {
    const ws = workspaceState.workspace;
    const theme = ws?.settings.theme ?? 'system';
    applyTheme(theme);
  });
};
