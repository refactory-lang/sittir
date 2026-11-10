//! Every lock, atomic and shared owner in `src/`, counted per file and held
//! to a ceiling. A count above its file's ceiling is a new use; a count below
//! it means the ceiling must come down to the count. A file absent from
//! `CEILINGS` has a ceiling of 0.
//!
//! A use is one of the identifiers in `COUNTED`, one of `std::sync::atomic`'s
//! types (an identifier `Atomic…`), or a `sync::atomic` path.
//! Comments, string and character literals, and `#[cfg(test)]` modules
//! (inline, or a `mod name;` declaration and the file it names) are not
//! scanned.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

const COUNTED: &[&str] = &[
    "Mutex", "RwLock", "OnceLock", "LazyLock", "Arc", "Weak", "Rc", "RefCell",
];

const CEILINGS: &[(&str, u32)] = &[
    ("arena.rs", 14),
    ("arena/built_write.rs", 2),
    ("arena/count.rs", 5),
    ("arena/memory.rs", 4),
    ("arena/parsed.rs", 1),
    ("arena/rows.rs", 5),
    ("engine.rs", 71),
    ("heap.rs", 3),
    ("layout.rs", 33),
    ("napi_engine.rs", 14),
    ("nodes.rs", 6),
    ("read.rs", 5),
    ("render.rs", 2),
    ("trivia_store.rs", 32),
    ("trivia_table/place.rs", 52),
];

struct Use {
    line: usize,
    what: String,
}

fn ceiling_of(file: &str) -> u32 {
    CEILINGS
        .iter()
        .find(|(name, _)| *name == file)
        .map_or(0, |(_, ceiling)| *ceiling)
}

#[test]
fn lock_free_census_matches_its_ceilings() {
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let found = census(&src);
    let mut failures = Vec::new();
    for (file, uses) in &found {
        let count = u32::try_from(uses.len()).expect("a file's use count fits in u32");
        let ceiling = ceiling_of(file);
        if count > ceiling {
            let listed: Vec<String> = uses
                .iter()
                .map(|found| format!("{}:{} {}", file, found.line, found.what))
                .collect();
            failures.push(format!(
                "{file}: {count} uses, over its ceiling of {ceiling}:\n  {}",
                listed.join("\n  ")
            ));
        } else if count < ceiling {
            failures.push(format!("{file}: {count} uses, under its ceiling of {ceiling}; lower its ceiling to {count}"));
        }
    }
    for (file, ceiling) in CEILINGS {
        if !found.contains_key(*file) {
            failures.push(format!(
                "{file}: 0 uses, under its ceiling of {ceiling}; remove its entry"
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "the lock-free census changed:\n{}",
        failures.join("\n")
    );
}

#[test]
fn the_census_reads_code_only() {
    let source = r##"
use std::sync::Arc; // Mutex in a comment
/* RwLock in a block /* nested Rc */ comment */
const TEXT: &str = "OnceLock in a string";
const RAW: &str = r#"LazyLock in a raw string"#;
const BYTES: &[u8] = b"Weak in bytes";
const QUOTE: char = '"';
fn shared<'a>(cell: &'a RefCell<u32>) -> Rc<u32> { std::sync::atomic::fence(Ordering::SeqCst); todo!() }
static SEEN: std::sync::atomic::AtomicBool = AtomicBool::new(Atomically::ArcSwap);
#[cfg(test)]
mod tests {
	use std::sync::Mutex;
}
#[cfg(test)]
mod outside;
"##;
    let (uses, outside) = scan(source);
    let what: Vec<&str> = uses.iter().map(|found| found.what.as_str()).collect();
    assert_eq!(
        what,
        [
            "Arc",
            "RefCell",
            "Rc",
            "sync::atomic",
            "sync::atomic",
            "AtomicBool",
            "AtomicBool"
        ]
    );
    assert_eq!(outside, ["outside"]);
}

fn census(src: &Path) -> BTreeMap<String, Vec<Use>> {
    let mut files = Vec::new();
    collect(src, &mut files);
    files.sort();
    let mut skipped = BTreeSet::new();
    let mut found = BTreeMap::new();
    for path in &files {
        let source =
            fs::read_to_string(path).unwrap_or_else(|error| panic!("{}: {error}", path.display()));
        let (uses, outside) = scan(&source);
        let dir = module_dir(path);
        for name in outside {
            skipped.insert(dir.join(format!("{name}.rs")));
            skipped.insert(dir.join(&name).join("mod.rs"));
        }
        if !uses.is_empty() {
            found.insert(relative(src, path), uses);
        }
    }
    found.retain(|file, _| !skipped.contains(&src.join(file)));
    found
}

fn collect(dir: &Path, files: &mut Vec<PathBuf>) {
    for entry in fs::read_dir(dir).unwrap_or_else(|error| panic!("{}: {error}", dir.display())) {
        let path = entry.expect("a readable directory entry").path();
        if path.is_dir() {
            collect(&path, files);
        } else if path.extension().is_some_and(|extension| extension == "rs") {
            files.push(path);
        }
    }
}

fn module_dir(path: &Path) -> PathBuf {
    let parent = path.parent().expect("a source file has a directory");
    match path.file_stem().and_then(|stem| stem.to_str()) {
        Some("lib" | "main" | "mod") => parent.to_path_buf(),
        Some(stem) => parent.join(stem),
        None => parent.to_path_buf(),
    }
}

fn relative(src: &Path, path: &Path) -> String {
    path.strip_prefix(src)
        .expect("a source file under src")
        .to_string_lossy()
        .replace('\\', "/")
}

/// The uses in `source`, and the modules a `#[cfg(test)] mod name;` declares.
fn scan(source: &str) -> (Vec<Use>, Vec<String>) {
    let tokens = tokens(&code_only(source));
    let mut uses = Vec::new();
    let mut outside = Vec::new();
    let mut at = 0;
    while at < tokens.len() {
        if let Some(after) = test_module(&tokens, at, &mut outside) {
            at = after;
            continue;
        }
        let (line, text) = &tokens[at];
        if COUNTED.contains(&text.as_str()) || is_atomic_type(text) {
            uses.push(Use {
                line: *line,
                what: text.clone(),
            });
        } else if text == "atomic"
            && at >= 3
            && tokens[at - 1].1 == ":"
            && tokens[at - 2].1 == ":"
            && tokens[at - 3].1 == "sync"
        {
            uses.push(Use {
                line: *line,
                what: "sync::atomic".to_owned(),
            });
        }
        at += 1;
    }
    (uses, outside)
}

/// Whether `word` names one of `std::sync::atomic`'s types (`AtomicBool`, `AtomicU32`, …).
fn is_atomic_type(word: &str) -> bool {
    word.strip_prefix("Atomic")
        .and_then(|rest| rest.chars().next())
        .is_some_and(char::is_uppercase)
}

/// Where a `#[cfg(test)]` module starting at `at` ends, or `None` when none starts there.
fn test_module(tokens: &[(usize, String)], at: usize, outside: &mut Vec<String>) -> Option<usize> {
    let text = |index: usize| tokens.get(index).map(|(_, text)| text.as_str());
    let attribute = ["#", "[", "cfg", "(", "test", ")", "]"];
    if !attribute
        .iter()
        .enumerate()
        .all(|(offset, expected)| text(at + offset) == Some(expected))
    {
        return None;
    }
    let mut next = at + attribute.len();
    while text(next) == Some("#") && text(next + 1) == Some("[") {
        next = past_group(tokens, next + 1, "[", "]");
    }
    if text(next) == Some("pub") {
        next += 1;
        if text(next) == Some("(") {
            next = past_group(tokens, next, "(", ")");
        }
    }
    if text(next) != Some("mod") {
        return None;
    }
    let name = text(next + 1)?.to_owned();
    match text(next + 2) {
        Some(";") => {
            outside.push(name);
            Some(next + 3)
        }
        Some("{") => Some(past_group(tokens, next + 2, "{", "}")),
        _ => None,
    }
}

/// The token after the group `open` at `at` opens.
fn past_group(tokens: &[(usize, String)], at: usize, open: &str, close: &str) -> usize {
    let mut depth = 0usize;
    for (index, (_, text)) in tokens.iter().enumerate().skip(at) {
        if text == open {
            depth += 1;
        } else if text == close {
            depth -= 1;
            if depth == 0 {
                return index + 1;
            }
        }
    }
    tokens.len()
}

/// Identifiers and single punctuation characters, each with its line.
fn tokens(code: &str) -> Vec<(usize, String)> {
    let mut tokens = Vec::new();
    let mut line = 1;
    let mut chars = code.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\n' {
            line += 1;
        } else if c.is_alphabetic() || c == '_' {
            let mut word = String::from(c);
            while let Some(&next) = chars.peek() {
                if !(next.is_alphanumeric() || next == '_') {
                    break;
                }
                word.push(next);
                chars.next();
            }
            tokens.push((line, word));
        } else if !c.is_whitespace() && !c.is_numeric() {
            tokens.push((line, c.to_string()));
        }
    }
    tokens
}

/// `source` with every comment and literal blanked, its line breaks kept.
fn code_only(source: &str) -> String {
    let chars: Vec<char> = source.chars().collect();
    let mut code = String::with_capacity(source.len());
    let blank = |code: &mut String, c: char| code.push(if c == '\n' { '\n' } else { ' ' });
    let mut at = 0;
    while at < chars.len() {
        let c = chars[at];
        let next = chars.get(at + 1).copied();
        if c == '/' && next == Some('/') {
            while at < chars.len() && chars[at] != '\n' {
                at += 1;
            }
        } else if c == '/' && next == Some('*') {
            let mut depth = 0usize;
            while at < chars.len() {
                if chars[at] == '/' && chars.get(at + 1) == Some(&'*') {
                    depth += 1;
                    at += 2;
                } else if chars[at] == '*' && chars.get(at + 1) == Some(&'/') {
                    depth -= 1;
                    at += 2;
                    if depth == 0 {
                        break;
                    }
                } else {
                    blank(&mut code, chars[at]);
                    at += 1;
                }
            }
        } else if let Some(hashes) = raw_string_start(&chars, at) {
            let open = chars[at..]
                .iter()
                .position(|&c| c == '"')
                .expect("a raw string opens")
                + at;
            at = open + 1;
            let closing: Vec<char> = std::iter::once('"')
                .chain(std::iter::repeat_n('#', hashes))
                .collect();
            while at < chars.len() && chars[at..].iter().take(closing.len()).ne(closing.iter()) {
                blank(&mut code, chars[at]);
                at += 1;
            }
            at += closing.len();
            code.push(' ');
        } else if c == '"' || (c == 'b' && next == Some('"') && !continues_word(&chars, at)) {
            at += if c == 'b' { 2 } else { 1 };
            while at < chars.len() && chars[at] != '"' {
                if chars[at] == '\\' {
                    at += 1;
                }
                if let Some(&inside) = chars.get(at) {
                    blank(&mut code, inside);
                }
                at += 1;
            }
            at += 1;
            code.push(' ');
        } else if c == '\'' && is_char_literal(&chars, at) {
            at += 1;
            while at < chars.len() && chars[at] != '\'' {
                if chars[at] == '\\' {
                    at += 1;
                }
                at += 1;
            }
            at += 1;
            code.push(' ');
        } else {
            code.push(c);
            at += 1;
        }
    }
    code
}

fn continues_word(chars: &[char], at: usize) -> bool {
    at > 0 && (chars[at - 1].is_alphanumeric() || chars[at - 1] == '_')
}

/// The `#` count of a raw string (`r"…"`, `r#"…"#`, `br"…"`) starting at `at`.
fn raw_string_start(chars: &[char], at: usize) -> Option<usize> {
    if continues_word(chars, at) {
        return None;
    }
    let mut next = at;
    if chars.get(next) == Some(&'b') {
        next += 1;
    }
    if chars.get(next) != Some(&'r') {
        return None;
    }
    next += 1;
    let hashes = chars[next..].iter().take_while(|&&c| c == '#').count();
    (chars.get(next + hashes) == Some(&'"')).then_some(hashes)
}

/// Whether the `'` at `at` opens a character literal rather than a lifetime or a label.
fn is_char_literal(chars: &[char], at: usize) -> bool {
    match chars.get(at + 1) {
        Some('\\') => true,
        Some(_) => chars.get(at + 2) == Some(&'\''),
        None => false,
    }
}
