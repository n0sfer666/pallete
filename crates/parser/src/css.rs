//! Парсер CSS custom properties и SCSS-переменных.

use once_cell::sync::Lazy;
use regex::Regex;

use crate::color::extract_colors;
use crate::{ParseResult, ParsedColor, ParsedPalette};

static VAR_DECL: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?m)(?:--|\$)([A-Za-z0-9_-]+)\s*:\s*([^;\n]+)").unwrap());

pub fn try_parse(input: &str) -> Option<ParseResult> {
    let mut colors: Vec<ParsedColor> = Vec::new();

    for cap in VAR_DECL.captures_iter(input) {
        let name = cap.get(1)?.as_str().to_string();
        let value = cap.get(2)?.as_str();
        let found = extract_colors(value, false);
        if found.is_empty() {
            continue;
        }
        for (i, c) in found.into_iter().enumerate() {
            let color_name = if i == 0 {
                Some(name.clone())
            } else {
                Some(format!("{name}-{i}"))
            };
            colors.push(c.with_name(color_name));
        }
    }

    if colors.is_empty() {
        return None;
    }

    Some(ParseResult {
        palettes: vec![ParsedPalette {
            name: "Variables".to_string(),
            colors,
        }],
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_css_custom_properties() {
        let css = ":root {\n  --primary: #66BB6A;\n  --accent: #E53935;\n}";
        let result = try_parse(css).unwrap();
        assert_eq!(result.palettes.len(), 1);
        assert_eq!(result.palettes[0].colors.len(), 2);
        assert_eq!(
            result.palettes[0].colors[0].name.as_deref(),
            Some("primary")
        );
    }

    #[test]
    fn parses_scss_variables() {
        let scss = "$brand: #112233;\n$danger: rgb(229, 57, 53);";
        let result = try_parse(scss).unwrap();
        assert_eq!(result.palettes[0].colors.len(), 2);
        assert_eq!(result.palettes[0].colors[1].name.as_deref(), Some("danger"));
    }

    #[test]
    fn no_match_returns_none() {
        assert!(try_parse("just some text").is_none());
    }
}
