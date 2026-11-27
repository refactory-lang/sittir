//! Every lock, atomic and shared owner in `src/`, counted per file and held
//! to a ceiling. A count above its file's ceiling is a new use; a count below
//! it means the ceiling must come down to the count. A file absent from
//! `CEILINGS` has a ceiling of 0.
//!
//! A use is one of the identifiers in `COUNTED`, one of `std::sync::atomic`'s
//! types (an identifier `Atomic…`), or a `sync::atomic` path.
//! Comments, string and character literals, and `#[cfg(test)]` modules are
//! not scanned. Neither is a file the module tree from `lib.rs` reaches only
//! through a `#[cfg(test)]` module; a file the tree doesn't reach is scanned.

mod common;

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use common::{code_tokens, module_tokens, Module, Token};

const COUNTED: &[&str] = &[
    "Mutex", "RwLock", "OnceLock", "LazyLock", "Arc", "Weak", "Rc", "RefCell",
];

const CEILINGS: &[(&str, u32)] = &[
    ("arena.rs", 14),
    ("arena/built_write.rs", 2),
    ("arena/count.rs", 5),
    ("arena/memory.rs", 4),
    ("engine.rs", 40),
    ("heap.rs", 3),
    ("layout.rs", 18),
    ("napi_engine.rs", 12),
    ("nodes.rs", 2),
    ("read.rs", 5),
    ("trivia_store.rs", 26),
    ("trivia_table/place.rs", 42),
];

struct Use {
    line: usize,
    what: String,
}

struct Scan {
    uses: Vec<Use>,
    modules: Vec<Module>,
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
const C_TEXT: &CStr = c"RwLock in a C string";
const C_RAW: &CStr = cr#"" Mutex ""#;
const QUOTE: char = '"';
fn shared<'a>(cell: &'a RefCell<u32>) -> Rc<u32> { std::sync::atomic::fence(Ordering::SeqCst); todo!() }
static SEEN: std::sync::atomic::AtomicBool = AtomicBool::new(Atomically::ArcSwap);
use std::sync::Mutex/**/as Lock;
#[cfg(test)]
mod tests {
	use std::sync::Mutex;
}
#[cfg(test)]
mod outside;
"##;
    let found = scan(source);
    let what: Vec<&str> = found.uses.iter().map(|found| found.what.as_str()).collect();
    assert_eq!(
        what,
        [
            "Arc",
            "RefCell",
            "Rc",
            "sync::atomic",
            "sync::atomic",
            "AtomicBool",
            "AtomicBool",
            "Mutex"
        ]
    );
    let modules: Vec<(String, bool)> = found
        .modules
        .iter()
        .map(|module| (module.path.join("/"), module.test))
        .collect();
    assert_eq!(modules, [("outside".to_owned(), true)]);
}

#[test]
fn the_census_follows_the_module_tree() {
    let src = fixture(
        "module-tree",
        &[
            (
                "lib.rs",
                "use std::rc::Rc;\nmod tests;\nmod child { #[cfg(test)] mod tests; }\n#[cfg(test)] mod unit;\n#[cfg(test)] mod spec;\n#[cfg(test)] mod inline { mod outside; }\n",
            ),
            ("tests.rs", "use std::sync::Arc;\n"),
            ("child/tests.rs", "use std::sync::Mutex;\n"),
            ("unit/mod.rs", "mod helper;\n"),
            ("unit/helper.rs", "use std::sync::RwLock;\n"),
            ("spec.rs", "mod fixture;\n"),
            ("spec/fixture.rs", "use std::rc::Weak;\n"),
            ("inline/outside.rs", "use std::cell::RefCell;\n"),
            ("orphan.rs", "use std::sync::OnceLock;\n"),
        ],
    );
    let counted: Vec<(String, Vec<String>)> = census(&src)
        .into_iter()
        .map(|(file, uses)| (file, uses.into_iter().map(|found| found.what).collect()))
        .collect();
    let expected = [
        ("lib.rs", "Rc"),
        ("orphan.rs", "OnceLock"),
        ("tests.rs", "Arc"),
    ]
    .map(|(file, what)| (file.to_owned(), vec![what.to_owned()]));
    assert_eq!(counted, expected);
}

/// A fresh `src/` under the test's temporary directory, holding `files`.
fn fixture(name: &str, files: &[(&str, &str)]) -> PathBuf {
    let src = Path::new(env!("CARGO_TARGET_TMPDIR"))
        .join(name)
        .join("src");
    if src.exists() {
        fs::remove_dir_all(&src).unwrap_or_else(|error| panic!("{}: {error}", src.display()));
    }
    for (file, text) in files {
        let path = src.join(file);
        fs::create_dir_all(path.parent().expect("a fixture file has a directory"))
            .unwrap_or_else(|error| panic!("{}: {error}", path.display()));
        fs::write(&path, text).unwrap_or_else(|error| panic!("{}: {error}", path.display()));
    }
    src
}

fn census(src: &Path) -> BTreeMap<String, Vec<Use>> {
    code_tokens(src)
        .into_iter()
        .map(|(file, tokens)| (file, uses(&tokens)))
        .filter(|(_, uses)| !uses.is_empty())
        .collect()
}

/// The uses in `source` outside `#[cfg(test)]` modules, and each `mod name;` it declares.
fn scan(source: &str) -> Scan {
    let (tokens, modules) = module_tokens(source);
    Scan { uses: uses(&tokens), modules }
}

/// The uses among `tokens`.
fn uses(tokens: &[Token]) -> Vec<Use> {
    let mut found = Vec::new();
    for (at, (line, text)) in tokens.iter().enumerate() {
        match text.as_str() {
            word if COUNTED.contains(&word) || is_atomic_type(word) => found.push(Use { line: *line, what: text.clone() }),
            "atomic" if at >= 3 && tokens[at - 1].1 == ":" && tokens[at - 2].1 == ":" && tokens[at - 3].1 == "sync" => {
                found.push(Use { line: *line, what: "sync::atomic".to_owned() });
            }
            _ => {}
        }
    }
    found
}

/// Whether `word` names one of `std::sync::atomic`'s types (`AtomicBool`, `AtomicU32`, …).
fn is_atomic_type(word: &str) -> bool {
    word.strip_prefix("Atomic")
        .and_then(|rest| rest.chars().next())
        .is_some_and(char::is_uppercase)
}

