use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;
use serde_json::Value;

use crate::error::{AppError, AppResult};
use crate::migrate::migrate;
use crate::model::{Project, CURRENT_VERSION};

pub fn load_project(path: &Path) -> AppResult<Project> {
    let raw = fs::read_to_string(path)?;
    let value: Value = serde_json::from_str(&raw)?;

    let original_version = value.get("version").and_then(Value::as_u64).unwrap_or(1) as u32;
    let migrated = migrate(value)?;

    if original_version < CURRENT_VERSION {
        let backup = backup_path(path, original_version);
        fs::write(&backup, &raw)?;
    }

    let project: Project = serde_json::from_value(migrated)?;
    Ok(project)
}

pub fn save_project(project: &Project, path: &Path) -> AppResult<Project> {
    let mut project = project.clone();
    project.version = CURRENT_VERSION;
    project.updated_at = Utc::now();

    let parent = path
        .parent()
        .ok_or_else(|| AppError::InvalidPath(path.display().to_string()))?;
    fs::create_dir_all(parent)?;

    let json = serde_json::to_string_pretty(&project)?;
    fs::write(path, json)?;
    Ok(project)
}

pub fn create_project(dir: &Path, name: &str) -> AppResult<(Project, PathBuf)> {
    fs::create_dir_all(dir)?;
    let slug = slugify(name);
    let path = dir.join(format!("{slug}.palette.json"));
    if path.exists() {
        return Err(AppError::InvalidPath(format!(
            "file already exists: {}",
            path.display()
        )));
    }
    let project = Project::new(name.to_string());
    let saved = save_project(&project, &path)?;
    Ok((saved, path))
}

fn backup_path(path: &Path, version: u32) -> PathBuf {
    let mut name = path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    name.push_str(&format!(".v{version}.bak"));
    path.with_file_name(name)
}

fn slugify(name: &str) -> String {
    let mut out = String::with_capacity(name.len());
    let mut last_dash = false;
    for c in name.chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c.to_ascii_lowercase());
            last_dash = false;
        } else if !last_dash && !out.is_empty() {
            out.push('-');
            last_dash = true;
        }
    }
    while out.ends_with('-') {
        out.pop();
    }
    if out.is_empty() {
        "project".to_string()
    } else {
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn roundtrip_save_and_load() {
        let dir = tempdir().unwrap();
        let (project, path) = create_project(dir.path(), "My Project").unwrap();
        let loaded = load_project(&path).unwrap();
        assert_eq!(loaded.id, project.id);
        assert_eq!(loaded.name, "My Project");
        assert_eq!(loaded.version, CURRENT_VERSION);
    }

    #[test]
    fn slugify_handles_spaces_and_special_chars() {
        assert_eq!(slugify("Hello World!"), "hello-world");
        assert_eq!(slugify("Москва 2026"), "2026");
        assert_eq!(slugify("---"), "project");
    }

    #[test]
    fn refuses_future_version() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("fake.palette.json");
        fs::write(&path, r#"{"version": 99, "palettes": []}"#).unwrap();
        let err = load_project(&path).unwrap_err();
        assert!(matches!(err, AppError::UnknownVersion(99, _)));
    }
}
