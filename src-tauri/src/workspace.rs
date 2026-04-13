use std::fs;
use std::path::{Path, PathBuf};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

pub const WORKSPACE_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProjectRef {
    pub path: PathBuf,
    #[serde(
        rename = "lastOpenedAt",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub last_opened_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub missing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorkspaceSettings {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(rename = "copyFormat", default = "default_copy_format")]
    pub copy_format: String,
    #[serde(rename = "acceptHexWithoutHash", default)]
    pub accept_hex_without_hash: bool,
}

impl Default for WorkspaceSettings {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            copy_format: default_copy_format(),
            accept_hex_without_hash: false,
        }
    }
}

fn default_theme() -> String {
    "system".to_string()
}
fn default_copy_format() -> String {
    "hex".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Workspace {
    pub version: u32,
    #[serde(default)]
    pub projects: Vec<ProjectRef>,
    #[serde(
        rename = "lastOpenedProjectPath",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    pub last_opened_project_path: Option<PathBuf>,
    #[serde(default)]
    pub settings: WorkspaceSettings,
}

impl Default for Workspace {
    fn default() -> Self {
        Self {
            version: WORKSPACE_VERSION,
            projects: Vec::new(),
            last_opened_project_path: None,
            settings: WorkspaceSettings::default(),
        }
    }
}

pub fn workspace_path() -> AppResult<PathBuf> {
    let base = dirs::data_dir()
        .ok_or_else(|| AppError::InvalidPath("data_dir unavailable".to_string()))?;
    Ok(base.join("Pallete").join("workspace.json"))
}

pub fn load(path: &Path) -> AppResult<Workspace> {
    if !path.exists() {
        return Ok(Workspace::default());
    }
    let raw = fs::read_to_string(path)?;
    let mut ws: Workspace = serde_json::from_str(&raw)?;
    for p in &mut ws.projects {
        p.missing = !p.path.exists();
    }
    Ok(ws)
}

pub fn save(ws: &Workspace, path: &Path) -> AppResult<()> {
    let parent = path
        .parent()
        .ok_or_else(|| AppError::InvalidPath(path.display().to_string()))?;
    fs::create_dir_all(parent)?;
    let json = serde_json::to_string_pretty(ws)?;
    fs::write(path, json)?;
    Ok(())
}

pub fn add_project(ws: &mut Workspace, path: PathBuf) {
    if ws.projects.iter().any(|p| p.path == path) {
        return;
    }
    ws.projects.push(ProjectRef {
        path,
        last_opened_at: None,
        missing: false,
    });
}

pub fn remove_project(ws: &mut Workspace, path: &Path) {
    ws.projects.retain(|p| p.path != path);
    if ws.last_opened_project_path.as_deref() == Some(path) {
        ws.last_opened_project_path = None;
    }
}

pub fn set_last_opened(ws: &mut Workspace, path: PathBuf) {
    let now = Utc::now();
    if let Some(p) = ws.projects.iter_mut().find(|p| p.path == path) {
        p.last_opened_at = Some(now);
    } else {
        ws.projects.push(ProjectRef {
            path: path.clone(),
            last_opened_at: Some(now),
            missing: false,
        });
    }
    ws.last_opened_project_path = Some(path);
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn load_missing_returns_default() {
        let dir = tempdir().unwrap();
        let ws = load(&dir.path().join("ws.json")).unwrap();
        assert_eq!(ws.version, WORKSPACE_VERSION);
        assert!(ws.projects.is_empty());
    }

    #[test]
    fn roundtrip_workspace() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("ws.json");
        let mut ws = Workspace::default();
        add_project(&mut ws, dir.path().join("a.palette.json"));
        set_last_opened(&mut ws, dir.path().join("a.palette.json"));
        save(&ws, &path).unwrap();
        let loaded = load(&path).unwrap();
        assert_eq!(loaded.projects.len(), 1);
        assert!(loaded.projects[0].missing);
    }
}
