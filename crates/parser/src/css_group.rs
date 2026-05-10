//! Группировка переменных без секций по общему префиксу имени.

use std::collections::HashMap;

use crate::{ParsedColor, ParsedPalette};

pub struct VarDecl {
    pub name: String,
    pub colors: Vec<ParsedColor>,
}

pub fn group_by_prefix(vars: Vec<VarDecl>) -> Vec<ParsedPalette> {
    let mut freq: HashMap<String, usize> = HashMap::new();
    for v in &vars {
        if let Some(p) = prefix_of(&v.name) {
            *freq.entry(p.to_owned()).or_insert(0) += 1;
        }
    }

    let mut order: Vec<Option<String>> = Vec::new();
    let mut groups: HashMap<Option<String>, Vec<ParsedColor>> = HashMap::new();
    for v in vars {
        let key = prefix_of(&v.name)
            .filter(|p| freq.get(*p).copied().unwrap_or(0) >= 2)
            .map(str::to_owned);
        if !groups.contains_key(&key) {
            order.push(key.clone());
        }
        groups.entry(key).or_default().extend(v.colors);
    }

    let mut palettes = Vec::new();
    for key in order {
        let Some(colors) = groups.remove(&key) else {
            continue;
        };
        if colors.is_empty() {
            continue;
        }
        let name = key.unwrap_or_else(|| "Variables".to_string());
        palettes.push(ParsedPalette { name, colors });
    }
    palettes
}

fn prefix_of(name: &str) -> Option<&str> {
    match name.rfind('-') {
        None | Some(0) => None,
        Some(idx) => Some(&name[..idx]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn decl(name: &str, hex: &str) -> VarDecl {
        VarDecl {
            name: name.to_string(),
            colors: vec![ParsedColor {
                hex: hex.to_string(),
                alpha: 1.0,
                name: Some(name.to_string()),
            }],
        }
    }

    #[test]
    fn groups_common_prefix() {
        let out = group_by_prefix(vec![
            decl("gray-50", "#FAFAFA"),
            decl("gray-100", "#F5F5F5"),
            decl("gray-200", "#E5E5E5"),
        ]);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].name, "gray");
        assert_eq!(out[0].colors.len(), 3);
    }

    #[test]
    fn singletons_fall_back_to_variables() {
        let out = group_by_prefix(vec![
            decl("gray-50", "#FAFAFA"),
            decl("gray-100", "#F5F5F5"),
            decl("white", "#FFFFFF"),
        ]);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].name, "gray");
        assert_eq!(out[0].colors.len(), 2);
        assert_eq!(out[1].name, "Variables");
        assert_eq!(out[1].colors.len(), 1);
        assert_eq!(out[1].colors[0].name.as_deref(), Some("white"));
    }

    #[test]
    fn no_prefix_yields_single_variables() {
        let out = group_by_prefix(vec![decl("brand", "#112233"), decl("danger", "#E53935")]);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].name, "Variables");
        assert_eq!(out[0].colors.len(), 2);
    }

    #[test]
    fn deep_prefix_uses_last_hyphen() {
        let out = group_by_prefix(vec![
            decl("deep-blue-700", "#005A8C"),
            decl("deep-blue-800", "#003B5C"),
        ]);
        assert_eq!(out[0].name, "deep-blue");
    }

    #[test]
    fn empty_input() {
        assert!(group_by_prefix(vec![]).is_empty());
    }
}
