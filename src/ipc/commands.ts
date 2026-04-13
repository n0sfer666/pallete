import { invoke } from '@tauri-apps/api/core';
import type {
  ParseOptionsDto,
  ParseResult,
  Project,
  ProjectPayload,
  Workspace,
  WorkspaceSettings,
} from '~/ipc/types';

export const parseText = (input: string, opts?: ParseOptionsDto): Promise<ParseResult> =>
  invoke('parse_text', { input, opts });

export const projectLoad = (path: string): Promise<ProjectPayload> =>
  invoke('project_load', { path });

export const projectSave = (project: Project, path: string): Promise<Project> =>
  invoke('project_save', { project, path });

export const projectCreate = (dir: string, name: string): Promise<ProjectPayload> =>
  invoke('project_create', { dir, name });

export const workspaceLoad = (): Promise<Workspace> => invoke('workspace_load');

export const workspaceAdd = (path: string): Promise<Workspace> =>
  invoke('workspace_add', { path });

export const workspaceRemove = (path: string): Promise<Workspace> =>
  invoke('workspace_remove', { path });

export const workspaceSetLastOpened = (path: string): Promise<Workspace> =>
  invoke('workspace_set_last_opened', { path });

export const workspaceSetSettings = (settings: WorkspaceSettings): Promise<Workspace> =>
  invoke('workspace_set_settings', { settings });
