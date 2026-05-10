use insta::assert_yaml_snapshot;
use parser::{parse, ParseOptions};

fn default_opts() -> ParseOptions {
    ParseOptions::default()
}

#[test]
fn snapshot_ascii_table() {
    let input = "\
┌────────┬─────────┬─────────┬─────────┐
│ Name   │ Color 1 │ Color 2 │ Color 3 │
├────────┼─────────┼─────────┼─────────┤
│ CASH   │ #66BB6A │ #43A047 │ #2E7D32 │
│ DEBT   │ #E53935 │ #C62828 │ #B71C1C │
│ NEUTRAL│ #FAFAFA │ #EEEEEE │ #BDBDBD │
└────────┴─────────┴─────────┴─────────┘";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("ascii_table", result);
}

#[test]
fn snapshot_markdown_table() {
    let input = "\
| Name    | Primary  | Secondary |
| ------- | -------- | --------- |
| Ocean   | #2196F3  | #0D47A1   |
| Forest  | #4CAF50  | #1B5E20   |
";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("markdown_table", result);
}

#[test]
fn snapshot_css_variables() {
    let input = "\
:root {
  --primary: #3366FF;
  --accent: #E53935;
  --bg: rgb(250, 250, 250);
}";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("css_variables", result);
}

#[test]
fn snapshot_scss_variables() {
    let input = "\
$brand: #112233;
$danger: rgba(229, 57, 53, 0.8);
$bg: #FAFAFA;
";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("scss_variables", result);
}

#[test]
fn snapshot_scss_sections() {
    let input = "\
// Gray Scale
$gray-50: #fafafa;
$gray-100: #f5f5f5;
$gray-900: #171717;

// Primary Colors (Ocean Theme)
$ocean-50: #f0fdfa;
$ocean-400: #40e0d0; // Main turquoise
$ocean-900: #134e4a;

// Semantic Colors
$white: #fff;
$black: #1a1a1a;

// Status Colors
$success-50: #f0fdf4;
$success-500: #16a34a;
$error-50: #fef2f2;
$warning-50: #fefce8;
";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("scss_sections", result);
}

#[test]
fn snapshot_bare_hex_list() {
    let input = "#111 #222 #333 #444";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("bare_hex_list", result);
}

#[test]
fn snapshot_mixed_hex_and_rgb() {
    let input = "primary #66BB6A, accent rgb(229,57,53), bg #FAFAFA";
    let result = parse(input, &default_opts()).unwrap();
    assert_yaml_snapshot!("mixed_hex_rgb", result);
}

#[test]
fn snapshot_hex_without_hash_opt_in() {
    let input = "66BB6A E53935";
    let mut opts = default_opts();
    opts.accept_hex_without_hash = true;
    let result = parse(input, &opts).unwrap();
    assert_yaml_snapshot!("bare_hex_no_hash", result);
}

#[test]
fn snapshot_over_color_limit() {
    let mut input = String::new();
    for _ in 0..10_001 {
        input.push_str("#FFFFFF\n");
    }
    let err = parse(&input, &default_opts()).unwrap_err();
    assert_yaml_snapshot!("over_limit", err.to_string());
}
