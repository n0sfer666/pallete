pub mod commands;
pub mod error;
pub mod migrate;
pub mod model;
pub mod storage;
pub mod workspace;

use commands::AppState;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::parse_text,
            commands::project_load,
            commands::project_save,
            commands::project_create,
            commands::workspace_load,
            commands::workspace_add,
            commands::workspace_remove,
            commands::workspace_set_last_opened,
            commands::workspace_set_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
