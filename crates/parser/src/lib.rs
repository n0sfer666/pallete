//! Парсер палитр из произвольного текста.
//!
//! Поддерживаемые форматы: ASCII-таблицы, Markdown-таблицы, CSS/SCSS-переменные,
//! голые списки hex и `rgb()` значений.

mod color;
mod css;
mod css_group;
mod normalize;
mod table;

use serde::Serialize;
use thiserror::Error;

pub use color::{extract_colors, ColorValue};

pub const MAX_INPUT_BYTES: usize = 1024 * 1024;
pub const MAX_COLORS: usize = 10_000;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct ParsedColor {
    pub hex: String,
    pub alpha: f32,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct ParsedPalette {
    pub name: String,
    pub colors: Vec<ParsedColor>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct ParseResult {
    pub palettes: Vec<ParsedPalette>,
}

#[derive(Debug, Clone, Copy, Default, Serialize, PartialEq, Eq)]
pub enum Grouping {
    #[default]
    Rows,
    All,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct ParseOptions {
    pub first_row_is_header: Option<bool>,
    pub first_col_is_name: Option<bool>,
    pub accept_hex_without_hash: bool,
    pub grouping: Grouping,
    pub fallback_palette_name: Option<String>,
}

#[derive(Debug, Clone, Error, PartialEq)]
pub enum ParseError {
    #[error("input exceeds limits: {chars} chars, {colors} colors")]
    LimitExceeded { chars: usize, colors: usize },
}

pub fn parse(input: &str, opts: &ParseOptions) -> Result<ParseResult, ParseError> {
    if input.len() > MAX_INPUT_BYTES {
        let approx_colors = color::count_colors(input, opts.accept_hex_without_hash);
        return Err(ParseError::LimitExceeded {
            chars: input.len(),
            colors: approx_colors,
        });
    }

    if input.trim().is_empty() {
        return Ok(ParseResult { palettes: vec![] });
    }

    if let Some(result) = css::try_parse(input) {
        return enforce_limit(result);
    }

    let normalized = normalize::normalize(input);
    let table_result = table::try_parse(&normalized, opts);

    let result = match table_result {
        Some(r) if !r.palettes.is_empty() => r,
        _ => fallback_parse(input, opts),
    };

    enforce_limit(result)
}

fn fallback_parse(input: &str, opts: &ParseOptions) -> ParseResult {
    let colors: Vec<ParsedColor> = color::extract_colors(input, opts.accept_hex_without_hash)
        .into_iter()
        .map(|c| c.into_parsed())
        .collect();

    if colors.is_empty() {
        return ParseResult { palettes: vec![] };
    }

    let name = opts
        .fallback_palette_name
        .clone()
        .unwrap_or_else(|| "Imported".to_string());

    ParseResult {
        palettes: vec![ParsedPalette { name, colors }],
    }
}

fn enforce_limit(result: ParseResult) -> Result<ParseResult, ParseError> {
    let total_colors: usize = result.palettes.iter().map(|p| p.colors.len()).sum();
    if total_colors > MAX_COLORS {
        return Err(ParseError::LimitExceeded {
            chars: 0,
            colors: total_colors,
        });
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_input_returns_empty_result() {
        let result = parse("", &ParseOptions::default()).unwrap();
        assert_eq!(result.palettes.len(), 0);
    }

    #[test]
    fn whitespace_input_returns_empty_result() {
        let result = parse("   \n\t  ", &ParseOptions::default()).unwrap();
        assert_eq!(result.palettes.len(), 0);
    }

    #[test]
    fn input_over_limit_fails() {
        let huge = "a".repeat(MAX_INPUT_BYTES + 1);
        let err = parse(&huge, &ParseOptions::default()).unwrap_err();
        matches!(err, ParseError::LimitExceeded { .. });
    }
}
