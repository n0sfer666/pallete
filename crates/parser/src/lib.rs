//! Парсер палитр из текста. Скелет: конкретная реализация — в следующих задачах.

use serde::Serialize;
use thiserror::Error;

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

#[derive(Debug, Clone, Default, Serialize)]
pub struct ParseOptions {
    pub first_row_is_header: Option<bool>,
    pub first_col_is_name: Option<bool>,
    pub accept_hex_without_hash: bool,
}

#[derive(Debug, Error)]
pub enum ParseError {
    #[error("input exceeds limits: {chars} chars, {colors} colors")]
    LimitExceeded { chars: usize, colors: usize },
}

pub fn parse(input: &str, _opts: &ParseOptions) -> Result<ParseResult, ParseError> {
    if input.trim().is_empty() {
        return Ok(ParseResult { palettes: vec![] });
    }
    Ok(ParseResult { palettes: vec![] })
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
}
