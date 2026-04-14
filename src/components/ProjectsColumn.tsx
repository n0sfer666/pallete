import { For, type Component } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { projectState } from '~/store/project';
import { openSettings } from '~/store/settings-dialog';
import {
  workspaceState,
  openProject,
  createProject,
  removeProjectFromWorkspace,
  addProjectToWorkspace,
} from '~/store/workspace';
import styles from './Layout.module.css';
import itemStyles from './ProjectsColumn.module.css';

export const ProjectsColumn: Component = () => {
  const handleNew = async (): Promise<void> => {
    const dir = await open({ directory: true, multiple: false });
    if (!dir || typeof dir !== 'string') return;
    const name = window.prompt('Название проекта?');
    if (!name) return;
    await createProject(dir, name);
  };

  const handleOpenFolder = async (): Promise<void> => {
    const file = await open({
      directory: false,
      multiple: false,
      filters: [{ name: 'Palette', extensions: ['json'] }],
    });
    if (!file || typeof file !== 'string') return;
    await addProjectToWorkspace(file);
    await openProject(file);
  };

  return (
    <div class={styles.column}>
      <div class={styles.columnHeader}>Проекты</div>
      <div class={styles.columnBody}>
        <For
          each={workspaceState.workspace?.projects ?? []}
          fallback={<div class={styles.empty}>Нет проектов</div>}
        >
          {(p) => {
            const active = (): boolean => projectState.path === p.path;
            const label = (): string => {
              const parts = p.path.split(/[\\/]/);
              return parts[parts.length - 1] ?? p.path;
            };
            return (
              <div
                classList={{ [itemStyles.item]: true, [itemStyles.active]: active() }}
                onClick={() => openProject(p.path)}
              >
                <span classList={{ [itemStyles.missing]: p.missing }}>{label()}</span>
                <button
                  class={itemStyles.remove}
                  title="Убрать из workspace"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProjectFromWorkspace(p.path);
                  }}
                >
                  ×
                </button>
              </div>
            );
          }}
        </For>
      </div>
      <div class={styles.columnFooter}>
        <button onClick={handleNew}>+ Новый</button>
        <button onClick={handleOpenFolder}>Открыть…</button>
        <button onClick={openSettings} title="Настройки" style={{ 'margin-inline-start': 'auto' }}>
          ⚙
        </button>
      </div>
    </div>
  );
};
