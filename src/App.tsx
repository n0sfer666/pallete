import { onMount, type Component } from 'solid-js';
import { Layout } from '~/components/Layout';
import { loadWorkspace } from '~/store/workspace';
import { useThemeSync } from '~/store/theme';
import { useGlobalShortcuts } from '~/hooks/useGlobalShortcuts';

export const App: Component = () => {
  useThemeSync();
  useGlobalShortcuts();

  onMount(() => {
    void loadWorkspace();
  });

  return <Layout />;
};
