import { Show, type Component } from 'solid-js';
import type { WorkspaceSettings } from '~/ipc/types';
import { workspaceState, updateSettings } from '~/store/workspace';
import { settingsOpen, closeSettings } from '~/store/settings-dialog';
import styles from './SettingsDialog.module.css';

const DEFAULTS: WorkspaceSettings = {
  theme: 'system',
  copyFormat: 'hex',
  acceptHexWithoutHash: false,
};

export const SettingsDialog: Component = () => {
  const current = (): WorkspaceSettings => workspaceState.workspace?.settings ?? DEFAULTS;

  const patch = async (p: Partial<WorkspaceSettings>): Promise<void> => {
    await updateSettings({ ...current(), ...p });
  };

  return (
    <Show when={settingsOpen()}>
      <div class={styles.backdrop} onClick={closeSettings}>
        <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header class={styles.header}>
            <h2>Настройки</h2>
            <button onClick={closeSettings}>×</button>
          </header>
          <div class={styles.body}>
            <label class={styles.row}>
              <span>Тема</span>
              <select
                value={current().theme}
                onChange={(e) => patch({ theme: e.currentTarget.value as WorkspaceSettings['theme'] })}
              >
                <option value="system">Системная</option>
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
              </select>
            </label>
            <label class={styles.row}>
              <span>Формат копирования</span>
              <select
                value={current().copyFormat}
                onChange={(e) =>
                  patch({ copyFormat: e.currentTarget.value as WorkspaceSettings['copyFormat'] })
                }
              >
                <option value="hex">hex</option>
                <option value="rgb">rgb / rgba</option>
                <option value="hsl">hsl / hsla</option>
              </select>
            </label>
            <label class={styles.row}>
              <input
                type="checkbox"
                checked={current().acceptHexWithoutHash}
                onChange={(e) => patch({ acceptHexWithoutHash: e.currentTarget.checked })}
              />
              <span>Принимать hex без «#» при импорте</span>
            </label>
          </div>
        </div>
      </div>
    </Show>
  );
};
