//! Нормализация текста перед табличным парсингом.

const BORDER_CHARS: &[char] = &[
    '│', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼', '─', '━', '═', '║', '╔', '╗', '╚', '╝', '╠',
    '╣', '╦', '╩', '╬',
];

pub fn normalize(input: &str) -> String {
    input
        .lines()
        .map(strip_borders)
        .filter(|l| !is_md_separator(l))
        .collect::<Vec<_>>()
        .join("\n")
}

fn strip_borders(line: &str) -> String {
    let cleaned: String = line
        .chars()
        .map(|c| if BORDER_CHARS.contains(&c) { ' ' } else { c })
        .collect();
    cleaned
}

fn is_md_separator(line: &str) -> bool {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return false;
    }
    trimmed
        .chars()
        .all(|c| c == '-' || c == ':' || c == '|' || c == ' ' || c == '+')
        && trimmed.contains('-')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_unicode_borders() {
        let input = "┌──┐\n│ a │\n└──┘";
        let out = normalize(input);
        assert!(!out.contains('│'));
        assert!(!out.contains('─'));
    }

    #[test]
    fn drops_md_separator() {
        let input = "| a | b |\n| --- | --- |\n| 1 | 2 |";
        let out = normalize(input);
        assert_eq!(out.lines().count(), 2);
    }
}
