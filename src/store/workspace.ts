import { createStore } from 'solid-js/store';
import type { Workspace, WorkspaceSettings } from '~/ipc/types';
import * as ipc from '~/ipc/commands';
import { clearHistory } from '~/store/undo';
import { setProject } from '~/store/project';

interface WorkspaceState {
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
}

const [state, setState] = createStore<WorkspaceState>({
  workspace: null,
  loading: false,
  error: null,
});

export { state as workspaceState };

export const loadWorkspace = async (): Promise<void> => {
  setState({ loading: true, error: null });
  try {
    const ws = await ipc.workspaceLoad();
    setState({ workspace: ws, loading: false });
  } catch (e) {
    setState({ loading: false, error: String(e) });
  }
};

export const openProject = async (path: string): Promise<void> => {
  try {
    const payload = await ipc.projectLoad(path);
    setProject(payload.project, payload.path);
    clearHistory();
    const ws = await ipc.workspaceSetLastOpened(path);
    setState('workspace', ws);
  } catch (e) {
    setState('error', String(e));
  }
};

export const createProject = async (dir: string, name: string): Promise<void> => {
  try {
    const payload = await ipc.projectCreate(dir, name);
    setProject(payload.project, payload.path);
    clearHistory();
    const ws = await ipc.workspaceAdd(payload.path);
    const ws2 = await ipc.workspaceSetLastOpened(payload.path);
    setState('workspace', ws2 ?? ws);
  } catch (e) {
    setState('error', String(e));
  }
};

export const addProjectToWorkspace = async (path: string): Promise<void> => {
  try {
    const ws = await ipc.workspaceAdd(path);
    setState('workspace', ws);
  } catch (e) {
    setState('error', String(e));
  }
};

export const removeProjectFromWorkspace = async (path: string): Promise<void> => {
  try {
    const ws = await ipc.workspaceRemove(path);
    setState('workspace', ws);
  } catch (e) {
    setState('error', String(e));
  }
};

export const updateSettings = async (settings: WorkspaceSettings): Promise<void> => {
  try {
    const ws = await ipc.workspaceSetSettings(settings);
    setState('workspace', ws);
  } catch (e) {
    setState('error', String(e));
  }
};
