export interface Color {
  id: string;
  hex: string;
  alpha: number;
  name?: string;
  role?: string;
}

export interface Palette {
  id: string;
  name: string;
  tags: string[];
  colors: Color[];
}

export interface Project {
  version: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  palettes: Palette[];
}

export interface ProjectPayload {
  project: Project;
  path: string;
}

export interface ProjectRef {
  path: string;
  lastOpenedAt?: string;
  missing: boolean;
}

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'system';
  copyFormat: 'hex' | 'rgb' | 'hsl';
  acceptHexWithoutHash: boolean;
}

export interface Workspace {
  version: number;
  projects: ProjectRef[];
  lastOpenedProjectPath?: string;
  settings: WorkspaceSettings;
}

export interface ParsedColor {
  hex: string;
  alpha: number;
  name: string | null;
}

export interface ParsedPalette {
  name: string;
  colors: ParsedColor[];
}

export interface ParseResult {
  palettes: ParsedPalette[];
}

export interface ParseOptionsDto {
  firstRowIsHeader?: boolean;
  firstColIsName?: boolean;
  acceptHexWithoutHash?: boolean;
}
