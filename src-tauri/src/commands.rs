use std::path::PathBuf;
use std::sync::Mutex;

use parser::{parse, ParseOptions, ParseResult};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::model::Project;
use crate::storage;
use crate::workspace::{self, Workspace};

#[derive(Default)]
pub struct AppState {
    pub workspace: Mutex<Workspace>,
}

#[derive(Debug, Serialize)]
pub struct ProjectPayload {
    pub project: Project,
    pub path: PathBuf,
}

#[derive(Debug, Deserialize, Default)]
pub struct ParseOptionsDto {
    #[serde(default, rename = "firstRowIsHeader")]
    pub first_row_is_header: Option<bool>,
    #[serde(default, rename = "firstColIsName")]
    pub first_col_is_name: Option<bool>,
    #[serde(default, rename = "acceptHexWithoutHash")]
    pub accept_hex_without_hash: bool,
}

impl From<ParseOptionsDto> for ParseOptions {
    fn from(d: ParseOptionsDto) -> Self {
        ParseOptions {
            first_row_is_header: d.first_row_is_header,
            first_col_is_name: d.first_col_is_name,
            accept_hex_without_hash: d.accept_hex_without_hash,
            grouping: parser::Grouping::Rows,
            fallback_palette_name: None,
        }
    }
}

#[tauri::command]
pub fn parse_text(input: String, opts: Option<ParseOptionsDto>) -> AppResult<ParseResult> {
    let opts: ParseOptions = opts.unwrap_or_default().into();
    parse(&input, &opts).map_err(|e| AppError::Parse(e.to_string()))
}

#[tauri::command]
pub fn project_load(path: PathBuf) -> AppResult<ProjectPayload> {
    let project = storage::load_project(&path)?;
    Ok(ProjectPayload { project, path })
}

#[tauri::command]
pub fn project_save(project: Project, path: PathBuf) -> AppResult<Project> {
    storage::save_project(&project, &path)
}

#[tauri::command]
pub fn project_create(dir: PathBuf, name: String) -> AppResult<ProjectPayload> {
    let (project, path) = storage::create_project(&dir, &name)?;
    Ok(ProjectPayload { project, path })
}

#[tauri::command]
pub fn workspace_load(state: State<'_, AppState>) -> AppResult<Workspace> {
    let path = workspace::workspace_path()?;
    let ws = workspace::load(&path)?;
    *state.workspace.lock().unwrap() = ws.clone();
    Ok(ws)
}

#[tauri::command]
pub fn workspace_add(path: PathBuf, state: State<'_, AppState>) -> AppResult<Workspace> {
    mutate_workspace(&state, |ws| workspace::add_project(ws, path))
}

#[tauri::command]
pub fn workspace_remove(path: PathBuf, state: State<'_, AppState>) -> AppResult<Workspace> {
    mutate_workspace(&state, |ws| workspace::remove_project(ws, &path))
}

#[tauri::command]
pub fn workspace_set_last_opened(
    path: PathBuf,
    state: State<'_, AppState>,
) -> AppResult<Workspace> {
    mutate_workspace(&state, |ws| workspace::set_last_opened(ws, path))
}

#[tauri::command]
pub fn workspace_set_settings(
    settings: workspace::WorkspaceSettings,
    state: State<'_, AppState>,
) -> AppResult<Workspace> {
    mutate_workspace(&state, |ws| ws.settings = settings)
}

fn mutate_workspace<F: FnOnce(&mut Workspace)>(
    state: &State<'_, AppState>,
    f: F,
) -> AppResult<Workspace> {
    let path = workspace::workspace_path()?;
    let mut ws = state.workspace.lock().unwrap();
    f(&mut ws);
    workspace::save(&ws, &path)?;
    Ok(ws.clone())
}
