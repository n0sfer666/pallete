//! Парсер CSS custom properties и SCSS-переменных с группировкой по секциям.

use once_cell::sync::Lazy;
use regex::Regex;

use crate::color::extract_colors;
use crate::css_group::{group_by_prefix, VarDecl};
use crate::{ParseResult, ParsedColor, ParsedPalette};

static VAR_DECL: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?:--|\$)([A-Za-z0-9_-]+)\s*:\s*([^;\n]+)").unwrap());

static SECTION_COMMENT: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^\s*(?://\s*(.*?)|/\*\s*(.*?)\s*\*/)\s*$").unwrap());

struct Section {
    name: Option<String>,
    vars: Vec<VarDecl>,
}

pub fn try_parse(input: &str) -> Option<ParseResult> {
    let sections = scan_sections(input);

    let mut palettes: Vec<ParsedPalette> = Vec::new();
    for section in sections {
        match section.name {
            Some(name) => append_named(&mut palettes, name, section.vars),
            None => palettes.extend(group_by_prefix(section.vars)),
        }
    }

    if palettes.is_empty() {
        return None;
    }
    Some(ParseResult { palettes })
}

fn append_named(palettes: &mut Vec<ParsedPalette>, name: String, vars: Vec<VarDecl>) {
    let colors: Vec<ParsedColor> = vars.into_iter().flat_map(|v| v.colors).collect();
    if !colors.is_empty() {
        palettes.push(ParsedPalette { name, colors });
    }
}

fn scan_sections(input: &str) -> Vec<Section> {
    let mut sections: Vec<Section> = Vec::new();
    let mut pending: Option<String> = None;

    for line in input.lines() {
        if let Some(title) = section_title(line) {
            if !title.is_empty() {
                pending = Some(title);
            }
            continue;
        }
        let decls = parse_var_line(line);
        if !decls.is_empty() {
            push_decls(&mut sections, &mut pending, decls);
        }
    }
    sections
}

fn section_title(line: &str) -> Option<String> {
    let cap = SECTION_COMMENT.captures(line)?;
    let text = cap.get(1).or_else(|| cap.get(2))?.as_str().trim();
    Some(text.to_string())
}

fn parse_var_line(line: &str) -> Vec<VarDecl> {
    let mut out = Vec::new();
    for cap in VAR_DECL.captures_iter(line) {
        let name = &cap[1];
        let found = extract_colors(&cap[2], false);
        if found.is_empty() {
            continue;
        }
        let colors = found
            .into_iter()
            .enumerate()
            .map(|(i, c)| {
                let color_name = if i == 0 {
                    name.to_string()
                } else {
                    format!("{name}-{i}")
                };
                c.with_name(Some(color_name))
            })
            .collect();
        out.push(VarDecl {
            name: name.to_string(),
            colors,
        });
    }
    out
}

fn push_decls(sections: &mut Vec<Section>, pending: &mut Option<String>, decls: Vec<VarDecl>) {
    match pending.take() {
        Some(name) => sections.push(Section {
            name: Some(name),
            vars: Vec::new(),
        }),
        None if sections.is_empty() => sections.push(Section {
            name: None,
            vars: Vec::new(),
        }),
        None => {}
    }
    if let Some(section) = sections.last_mut() {
        section.vars.extend(decls);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn palette_names(result: &ParseResult) -> Vec<&str> {
        result.palettes.iter().map(|p| p.name.as_str()).collect()
    }

    #[test]
    fn parses_css_custom_properties() {
        let css = ":root {\n  --primary: #66BB6A;\n  --accent: #E53935;\n}";
        let result = try_parse(css).unwrap();
        assert_eq!(palette_names(&result), vec!["Variables"]);
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
        assert_eq!(palette_names(&result), vec!["Variables"]);
        assert_eq!(result.palettes[0].colors.len(), 2);
        assert_eq!(result.palettes[0].colors[1].name.as_deref(), Some("danger"));
    }

    #[test]
    fn no_match_returns_none() {
        assert!(try_parse("just some text").is_none());
    }

    #[test]
    fn splits_palettes_by_section_comments() {
        let scss = "// Gray Scale\n$gray-50: #fafafa;\n$gray-900: #171717;\n\n// Ocean\n$ocean-50: #f0fdfa;\n$ocean-500: #14b8a6;";
        let result = try_parse(scss).unwrap();
        assert_eq!(palette_names(&result), vec!["Gray Scale", "Ocean"]);
        assert_eq!(result.palettes[0].colors.len(), 2);
        assert_eq!(
            result.palettes[1].colors[0].name.as_deref(),
            Some("ocean-50")
        );
    }

    #[test]
    fn single_line_block_comment_is_section() {
        let css = "/* Section */\n--a-1: #fff;\n--a-2: #000;";
        let result = try_parse(css).unwrap();
        assert_eq!(palette_names(&result), vec!["Section"]);
        assert_eq!(result.palettes[0].colors.len(), 2);
    }

    #[test]
    fn last_non_empty_comment_wins() {
        let scss = "// ignored\n//\n// Real Name\n$b-1: #fff;\n$b-2: #000;";
        let result = try_parse(scss).unwrap();
        assert_eq!(palette_names(&result), vec!["Real Name"]);
    }

    #[test]
    fn vars_before_first_section_use_prefix_grouping() {
        let scss = "$a-1: #fff;\n$a-2: #000;\n// Sec\n$b-1: #111;\n$b-2: #222;";
        let result = try_parse(scss).unwrap();
        assert_eq!(palette_names(&result), vec!["a", "Sec"]);
    }

    #[test]
    fn trailing_comment_is_ignored() {
        let scss = "// Ocean\n$ocean-400: #40e0d0; // Main turquoise\n$ocean-500: #14b8a6;";
        let result = try_parse(scss).unwrap();
        assert_eq!(
            result.palettes[0].colors[0].name.as_deref(),
            Some("ocean-400")
        );
        assert_eq!(result.palettes[0].colors.len(), 2);
    }

    #[test]
    fn section_without_vars_yields_no_palette() {
        let scss = "// Empty\n// Real\n$r-1: #fff;\n$r-2: #000;";
        let result = try_parse(scss).unwrap();
        assert_eq!(palette_names(&result), vec!["Real"]);
    }
}
