use serde_json::Value;

use crate::error::{AppError, AppResult};
use crate::model::CURRENT_VERSION;

pub fn migrate(data: Value) -> AppResult<Value> {
    let version = data.get("version").and_then(Value::as_u64).unwrap_or(1) as u32;

    if version > CURRENT_VERSION {
        return Err(AppError::UnknownVersion(version, CURRENT_VERSION));
    }

    // future migrations: while version < CURRENT_VERSION { data = migrate_n_to_n_plus_1(data)?; }

    Ok(data)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn current_version_is_pass_through() {
        let input = json!({ "version": CURRENT_VERSION, "palettes": [] });
        let out = migrate(input.clone()).unwrap();
        assert_eq!(out, input);
    }

    #[test]
    fn future_version_rejected() {
        let input = json!({ "version": CURRENT_VERSION + 5 });
        let err = migrate(input).unwrap_err();
        assert!(matches!(err, AppError::UnknownVersion(_, _)));
    }
}
