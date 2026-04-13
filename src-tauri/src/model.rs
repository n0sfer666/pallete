use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const CURRENT_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Color {
    pub id: Uuid,
    pub hex: String,
    #[serde(default = "default_alpha")]
    pub alpha: f32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
}

fn default_alpha() -> f32 {
    1.0
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Palette {
    pub id: Uuid,
    pub name: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub colors: Vec<Color>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Project {
    pub version: u32,
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
    pub palettes: Vec<Palette>,
}

impl Project {
    pub fn new(name: String) -> Self {
        let now = Utc::now();
        Self {
            version: CURRENT_VERSION,
            id: Uuid::new_v4(),
            name,
            created_at: now,
            updated_at: now,
            palettes: Vec::new(),
        }
    }
}
