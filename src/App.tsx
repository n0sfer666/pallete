import { onMount, type Component } from 'solid-js';
import { Layout } from '~/components/Layout';
import { ImportDialog } from '~/components/ImportDialog';
import { SettingsDialog } from '~/components/SettingsDialog';
import { NewProjectDialog } from '~/components/NewProjectDialog';
import { loadWorkspace } from '~/store/workspace';
import { useThemeSync } from '~/store/theme';
import { useGlobalShortcuts } from '~/hooks/useGlobalShortcuts';
import { useImportShortcuts } from '~/hooks/useImportShortcuts';
import { useFileDrop } from '~/hooks/useFileDrop';
import { useAutoSave } from '~/hooks/useAutoSave';

export const App: Component = () => {
  useThemeSync();
  useGlobalShortcuts();
  useImportShortcuts();
  useFileDrop();
  useAutoSave();

  onMount(() => {
    void loadWorkspace();
  });

  return (
    <>
      <Layout />
      <ImportDialog />
      <SettingsDialog />
      <NewProjectDialog />
    </>
  );
};
