//! Извлечение цветовых значений из произвольной строки.

use once_cell::sync::Lazy;
use regex::Regex;

use crate::ParsedColor;

static HEX_WITH_HASH: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b").unwrap()
});

static HEX_BARE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\b([0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b").unwrap());

static RGB_FUNC: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"(?i)rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9]*\.?[0-9]+)\s*)?\)",
    )
    .unwrap()
});

#[derive(Debug, Clone, PartialEq)]
pub struct ColorValue {
    pub hex: String,
    pub alpha: f32,
    pub span: (usize, usize),
}

impl ColorValue {
    pub fn into_parsed(self) -> ParsedColor {
        ParsedColor {
            hex: self.hex,
            alpha: self.alpha,
            name: None,
        }
    }

    pub fn with_name(self, name: Option<String>) -> ParsedColor {
        ParsedColor {
            hex: self.hex,
            alpha: self.alpha,
            name,
        }
    }
}

pub fn extract_colors(input: &str, accept_bare: bool) -> Vec<ColorValue> {
    let mut out: Vec<ColorValue> = Vec::new();
    let mut mask = vec![false; input.len()];

    for cap in HEX_WITH_HASH.captures_iter(input) {
        let m = cap.get(0).unwrap();
        mark(&mut mask, m.start(), m.end());
        let body = cap.get(1).unwrap().as_str();
        let (hex, alpha) = normalize_hex(body);
        out.push(ColorValue {
            hex,
            alpha,
            span: (m.start(), m.end()),
        });
    }

    for cap in RGB_FUNC.captures_iter(input) {
        let m = cap.get(0).unwrap();
        if overlaps(&mask, m.start(), m.end()) {
            continue;
        }
        mark(&mut mask, m.start(), m.end());
        let r: u16 = cap[1].parse().unwrap_or(0);
        let g: u16 = cap[2].parse().unwrap_or(0);
        let b: u16 = cap[3].parse().unwrap_or(0);
        if r > 255 || g > 255 || b > 255 {
            continue;
        }
        let alpha = cap
            .get(4)
            .and_then(|m| m.as_str().parse::<f32>().ok())
            .unwrap_or(1.0)
            .clamp(0.0, 1.0);
        let hex = format!("#{:02X}{:02X}{:02X}", r, g, b);
        out.push(ColorValue {
            hex,
            alpha,
            span: (m.start(), m.end()),
        });
    }

    if accept_bare {
        for cap in HEX_BARE.captures_iter(input) {
            let m = cap.get(0).unwrap();
            if overlaps(&mask, m.start(), m.end()) {
                continue;
            }
            mark(&mut mask, m.start(), m.end());
            let (hex, alpha) = normalize_hex(cap.get(1).unwrap().as_str());
            out.push(ColorValue {
                hex,
                alpha,
                span: (m.start(), m.end()),
            });
        }
    }

    out.sort_by_key(|c| c.span.0);
    out
}

pub fn count_colors(input: &str, accept_bare: bool) -> usize {
    extract_colors(input, accept_bare).len()
}

fn normalize_hex(body: &str) -> (String, f32) {
    let upper = body.to_ascii_uppercase();
    match upper.len() {
        3 => (expand_short(&upper), 1.0),
        4 => {
            let rgb = expand_short(&upper[..3]);
            let alpha_hex = &upper[3..4];
            let alpha = u8::from_str_radix(&alpha_hex.repeat(2), 16).unwrap_or(255) as f32 / 255.0;
            (rgb, alpha)
        }
        6 => (format!("#{}", upper), 1.0),
        8 => {
            let rgb = format!("#{}", &upper[..6]);
            let alpha = u8::from_str_radix(&upper[6..8], 16).unwrap_or(255) as f32 / 255.0;
            (rgb, alpha)
        }
        _ => (format!("#{}", upper), 1.0),
    }
}

fn expand_short(short: &str) -> String {
    let mut out = String::with_capacity(7);
    out.push('#');
    for ch in short.chars() {
        out.push(ch);
        out.push(ch);
    }
    out
}

fn mark(mask: &mut [bool], start: usize, end: usize) {
    let end = end.min(mask.len());
    for b in &mut mask[start..end] {
        *b = true;
    }
}

fn overlaps(mask: &[bool], start: usize, end: usize) -> bool {
    mask[start..end.min(mask.len())].iter().any(|b| *b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_hex_6() {
        let out = extract_colors("bg: #66BB6A;", false);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].hex, "#66BB6A");
        assert_eq!(out[0].alpha, 1.0);
    }

    #[test]
    fn extracts_hex_3_expanded() {
        let out = extract_colors("c = #abc", false);
        assert_eq!(out[0].hex, "#AABBCC");
    }

    #[test]
    fn extracts_hex_8_with_alpha() {
        let out = extract_colors("#11223380", false);
        assert_eq!(out[0].hex, "#112233");
        assert!((out[0].alpha - 0.502).abs() < 0.01);
    }

    #[test]
    fn extracts_rgb_function() {
        let out = extract_colors("color: rgb(102, 187, 106)", false);
        assert_eq!(out[0].hex, "#66BB6A");
        assert_eq!(out[0].alpha, 1.0);
    }

    #[test]
    fn extracts_rgba_with_alpha() {
        let out = extract_colors("rgba(0,0,0,0.5)", false);
        assert_eq!(out[0].hex, "#000000");
        assert!((out[0].alpha - 0.5).abs() < 0.001);
    }

    #[test]
    fn rejects_rgb_overflow() {
        let out = extract_colors("rgb(300,0,0)", false);
        assert_eq!(out.len(), 0);
    }

    #[test]
    fn bare_hex_opt_in() {
        assert_eq!(extract_colors("66BB6A", false).len(), 0);
        assert_eq!(extract_colors("66BB6A", true).len(), 1);
    }

    #[test]
    fn mixed_order_preserved() {
        let out = extract_colors("#111 rgb(0,0,0) #222", false);
        assert_eq!(out.len(), 3);
        assert_eq!(out[0].hex, "#111111");
        assert_eq!(out[1].hex, "#000000");
        assert_eq!(out[2].hex, "#222222");
    }
}
