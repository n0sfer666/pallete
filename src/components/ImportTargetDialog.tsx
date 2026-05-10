import { For, Show, type Component } from 'solid-js';
import type { ProjectRef } from '~/ipc/types';
import { workspaceState } from '~/store/workspace';
import {
  importTargetOpen,
  closeImportTarget,
  importTargetStrategy,
} from '~/store/import-target-dialog';
import { importIntoExistingProject, importIntoNewProject } from '~/store/import';
import styles from './ImportTargetDialog.module.css';

const baseName = (path: string): string => {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
};

export const ImportTargetDialog: Component = () => {
  const projects = (): ProjectRef[] =>
    (workspaceState.workspace?.projects ?? []).filter((p) => !p.missing);

  const single = (): ProjectRef | null => {
    const list = projects();
    return list.length === 1 ? (list[0] ?? null) : null;
  };

  const pickExisting = (path: string): void => {
    const strategy = importTargetStrategy();
    closeImportTarget();
    void importIntoExistingProject(path, strategy);
  };

  const pickNew = (): void => {
    const strategy = importTargetStrategy();
    closeImportTarget();
    importIntoNewProject(strategy);
  };

  return (
    <Show when={importTargetOpen()}>
      <div class={styles.backdrop} onClick={closeImportTarget}>
        <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header class={styles.header}>
            <h2>Куда импортировать?</h2>
            <button onClick={closeImportTarget}>×</button>
          </header>
          <Show
            when={single()}
            fallback={
              <div class={styles.body}>
                <span class={styles.hint}>Выберите проект для импорта палитр:</span>
                <div class={styles.list}>
                  <For each={projects()}>
                    {(p) => (
                      <button class={styles.projectButton} onClick={() => pickExisting(p.path)}>
                        <span class={styles.projectName}>{baseName(p.path)}</span>
                        <span class={styles.projectPath}>{p.path}</span>
                      </button>
                    )}
                  </For>
                  <button class={styles.newButton} onClick={pickNew}>
                    + Новый проект
                  </button>
                </div>
              </div>
            }
          >
            {(p) => (
              <>
                <div class={styles.body}>
                  <span>
                    Сохранить импортированные палитры в проект <strong>{baseName(p().path)}</strong>?
                  </span>
                  <span class={styles.hint}>{p().path}</span>
                </div>
                <footer class={styles.footer}>
                  <button onClick={pickNew}>Нет, новый проект</button>
                  <button onClick={() => pickExisting(p().path)}>Да</button>
                </footer>
              </>
            )}
          </Show>
        </div>
      </div>
    </Show>
  );
};
