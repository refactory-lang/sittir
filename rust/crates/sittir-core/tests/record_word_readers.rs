//! Each fact a record's words hold is read and written by the one function
//! that owns it (`ArenaRead::header_kind`, `side_of`, `rewrite_layout`,
//! `CellWord` and the cell decoders, the cell walkers). No source file
//! outside the owners indexes a record's header by a literal or shifts or
//! masks a cell word by its tag bits; a call of an owner's decoder is not a
//! hand read. The scan reads code tokens outside `#[cfg(test)]` modules
//! (`common::code_tokens`).

mod common;

use std::path::Path;

use common::{code_tokens, Token};

/// The files that own a record's words: the header's readers and writer,
/// the cell word and its walker, and the side record.
const OWNERS: &[&str] = &["arena/borrowed.rs", "arena/cell.rs", "arena/side.rs"];

/// What a file outside the owners must not do, as the token run it is
/// written with.
fn hand_reads(tokens: &[Token]) -> Vec<(usize, String)> {
    let text = |at: usize| tokens.get(at).map_or("", |(_, text)| text.as_str());
    let number = |at: usize| text(at).starts_with(|c: char| c.is_ascii_digit());
    let mut found = Vec::new();
    for (at, (line, word)) in tokens.iter().enumerate() {
        let what = match word.as_str() {
            "header" | "words" if text(at + 1) == "[" && number(at + 2) && text(at + 3) == "]" => Some(format!("{word}[{}]", text(at + 2))),
            "HEADER_WORDS" if text(at + 1) == ")" && text(at + 2) == "?" && text(at + 3) == "[" => Some("a header read indexed by a literal".to_owned()),
            ">" if text(at + 1) == ">" && text(at + 2) == "2" => Some(">> 2".to_owned()),
            "<" if text(at + 1) == "<" && text(at + 2) == "2" && !(number(at.wrapping_sub(1)) && text(at.wrapping_sub(2)) != ".") => Some("<< 2".to_owned()),
            "&" if text(at + 1) == "3" => Some("& 3".to_owned()),
            "checked_mul" if text(at + 1) == "(" && text(at + 2) == "4" => Some("checked_mul(4)".to_owned()),
            _ => None,
        };
        found.extend(what.map(|what| (*line, what)));
    }
    found
}

#[test]
fn no_file_outside_the_owners_reads_a_record_s_words_by_hand() {
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let found: Vec<String> = code_tokens(&src)
        .into_iter()
        .filter(|(file, _)| !OWNERS.contains(&file.as_str()))
        .flat_map(|(file, tokens)| hand_reads(&tokens).into_iter().map(move |(line, what)| format!("{file}:{line} {what}")))
        .collect();
    assert!(found.is_empty(), "a record's words read by hand outside their owners:\n  {}", found.join("\n  "));
}

#[test]
fn the_scan_finds_each_hand_read_and_nothing_else() {
    let source = r#"
fn f(header: &[u32], words: &[u32], word: u32, at: Address) {
    let side = header[1];
    let kind = words[0];
    let read = arena.words(at, HEADER_WORDS)?[1];
    let address = word >> 2;
    let cell = at.0 << 2;
    let edges = word & 3;
    let entry = at.0.checked_mul(4);
    let cell = Cell::decode_built(word, arena, bits);
    let flag = 1 << 2;
    let text = "header[1] >> 2"; // words[0] & 3
    let other = items[1];
}
#[cfg(test)]
mod tests {
    fn g(header: &[u32]) -> u32 { header[1] }
}
"#;
    let (tokens, _) = common::module_tokens(source);
    let found: Vec<String> = hand_reads(&tokens).into_iter().map(|(_, what)| what).collect();
    assert_eq!(found, ["header[1]", "words[0]", "a header read indexed by a literal", ">> 2", "<< 2", "& 3", "checked_mul(4)"]);
}
