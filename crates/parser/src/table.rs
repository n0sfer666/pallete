//! Парсер таблиц (ASCII/Markdown/pipe-separated).

use crate::color::{extract_colors, ColorValue};
use crate::{Grouping, ParseOptions, ParseResult, ParsedColor, ParsedPalette};

pub fn try_parse(input: &str, opts: &ParseOptions) -> Option<ParseResult> {
    let rows = split_rows(input);
    if rows.is_empty() {
        return None;
    }

    if !has_any_color(&rows, opts.accept_hex_without_hash) {
        return None;
    }

    let (data_rows, _header) = apply_header_detection(rows, opts);

    match opts.grouping {
        Grouping::Rows => Some(parse_rows(&data_rows, opts)),
        Grouping::All => Some(parse_all(&data_rows, opts)),
    }
}

fn split_rows(input: &str) -> Vec<Vec<String>> {
    input
        .lines()
        .map(|line| {
            let trimmed = line.trim_matches('|').trim();
            if trimmed.is_empty() {
                return vec![];
            }
            let cells: Vec<String> = trimmed.split('|').map(|c| c.trim().to_string()).collect();
            if cells.len() > 1 {
                cells
            } else {
                trimmed
                    .split(|c: char| c == ',' || c == ';' || c.is_whitespace())
                    .filter(|s| !s.is_empty())
                    .map(|s| s.to_string())
                    .collect()
            }
        })
        .filter(|r| !r.is_empty())
        .collect()
}

fn has_any_color(rows: &[Vec<String>], accept_bare: bool) -> bool {
    rows.iter().any(|row| {
        row.iter()
            .any(|cell| !extract_colors(cell, accept_bare).is_empty())
    })
}

fn apply_header_detection(
    rows: Vec<Vec<String>>,
    opts: &ParseOptions,
) -> (Vec<Vec<String>>, Option<Vec<String>>) {
    if rows.is_empty() {
        return (rows, None);
    }

    let explicit = opts.first_row_is_header;
    let auto = {
        let first = &rows[0];
        first
            .iter()
            .all(|cell| extract_colors(cell, opts.accept_hex_without_hash).is_empty())
    };

    let is_header = explicit.unwrap_or(auto);
    if is_header && rows.len() > 1 {
        let header = rows[0].clone();
        (rows.into_iter().skip(1).collect(), Some(header))
    } else {
        (rows, None)
    }
}

fn parse_rows(rows: &[Vec<String>], opts: &ParseOptions) -> ParseResult {
    let first_col_is_name = opts
        .first_col_is_name
        .unwrap_or_else(|| detect_first_col_is_name(rows, opts.accept_hex_without_hash));

    let mut palettes = Vec::new();
    for (idx, row) in rows.iter().enumerate() {
        let (name, color_cells) = if first_col_is_name && row.len() > 1 {
            let name_cell = row[0].clone();
            let rest = row[1..].to_vec();
            let name = if name_cell.is_empty() {
                format!("Palette {}", idx + 1)
            } else {
                name_cell
            };
            (name, rest)
        } else {
            (format!("Palette {}", idx + 1), row.clone())
        };

        let colors = cells_to_colors(&color_cells, opts.accept_hex_without_hash);
        if !colors.is_empty() {
            palettes.push(ParsedPalette { name, colors });
        }
    }

    ParseResult { palettes }
}

fn parse_all(rows: &[Vec<String>], opts: &ParseOptions) -> ParseResult {
    let all_cells: Vec<String> = rows.iter().flat_map(|r| r.iter().cloned()).collect();
    let colors = cells_to_colors(&all_cells, opts.accept_hex_without_hash);
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

fn detect_first_col_is_name(rows: &[Vec<String>], accept_bare: bool) -> bool {
    if rows.iter().all(|r| r.len() <= 1) {
        return false;
    }
    let names_without_hex = rows
        .iter()
        .filter(|r| r.len() > 1)
        .filter(|r| extract_colors(&r[0], accept_bare).is_empty())
        .count();
    let multi_col_rows = rows.iter().filter(|r| r.len() > 1).count();
    multi_col_rows > 0 && names_without_hex * 2 >= multi_col_rows
}

fn cells_to_colors(cells: &[String], accept_bare: bool) -> Vec<ParsedColor> {
    let mut out = Vec::new();
    for cell in cells {
        let found = extract_colors(cell, accept_bare);
        for color in found {
            let name = extract_trailing_name(cell, &color);
            out.push(color.with_name(name));
        }
    }
    out
}

fn extract_trailing_name(cell: &str, color: &ColorValue) -> Option<String> {
    let after = cell.get(color.span.1..)?.trim_start_matches(|c: char| {
        c.is_whitespace() || c == ',' || c == ';' || c == ':' || c == '-'
    });
    let trimmed = after.trim();
    if trimmed.is_empty() {
        let before = cell.get(..color.span.0)?.trim();
        if before.is_empty() {
            return None;
        }
        return Some(before.to_string());
    }
    Some(trimmed.to_string())
}
