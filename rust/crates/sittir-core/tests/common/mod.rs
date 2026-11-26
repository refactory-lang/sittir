//! What a scan of a crate's sources reads: each file's code tokens outside
//! `#[cfg(test)]` modules, comments and literals, with the files the module
//! tree from the crate roots reaches only through `#[cfg(test)]` modules left
//! out; a file the tree doesn't reach is read.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

/// A token and the line it is on.
pub type Token = (usize, String);

/// A `mod name;` declaration: the inline modules it sits in, then its name.
pub struct Module {
    pub path: Vec<String>,
    pub test: bool,
}

struct ModuleItem {
    name: String,
    test: bool,
    body: bool,
    after: usize,
}

/// Each file under `src` the module tree reaches outside tests, by its path
/// under `src`, with its tokens outside `#[cfg(test)]` modules
/// (`module_tokens`).
pub fn code_tokens(src: &Path) -> BTreeMap<String, Vec<Token>> {
    let mut files = Vec::new();
    collect(src, &mut files);
    let scans: BTreeMap<PathBuf, (Vec<Token>, Vec<Module>)> = files
        .into_iter()
        .map(|path| {
            let source = fs::read_to_string(&path).unwrap_or_else(|error| panic!("{}: {error}", path.display()));
            let scan = module_tokens(&source);
            (path, scan)
        })
        .collect();
    let test_only = test_only_files(src, &scans);
    scans.into_iter().filter(|(path, _)| !test_only.contains(path)).map(|(path, (tokens, _))| (relative(src, &path), tokens)).collect()
}

/// The tokens of `source` outside `#[cfg(test)]` modules, and each
/// `mod name;` it declares.
pub fn module_tokens(source: &str) -> (Vec<Token>, Vec<Module>) {
    let tokens = tokens(&code_only(source));
    let mut kept = Vec::new();
    let mut modules = Vec::new();
    let mut scopes: Vec<(String, bool, usize)> = Vec::new();
    let mut depth = 0usize;
    let mut at = 0;
    while at < tokens.len() {
        let in_test = scopes.iter().any(|(_, test, _)| *test);
        if let Some(item) = module_item(&tokens, at) {
            let test = in_test || item.test;
            if item.body {
                depth += 1;
                scopes.push((item.name, test, depth));
            } else {
                let mut path: Vec<String> = scopes.iter().map(|(name, _, _)| name.clone()).collect();
                path.push(item.name);
                modules.push(Module { path, test });
            }
            at = item.after;
            continue;
        }
        match tokens[at].1.as_str() {
            "{" => depth += 1,
            "}" => {
                if scopes.last().is_some_and(|(_, _, opened)| *opened == depth) {
                    scopes.pop();
                }
                depth = depth.saturating_sub(1);
            }
            _ => {}
        }
        if !in_test {
            kept.push(tokens[at].clone());
        }
        at += 1;
    }
    (kept, modules)
}

/// The files the module tree from the crate roots reaches only through `#[cfg(test)]` modules.
/// A file the tree doesn't reach is not among them.
fn test_only_files(src: &Path, scans: &BTreeMap<PathBuf, (Vec<Token>, Vec<Module>)>) -> BTreeSet<PathBuf> {
    let mut reached: BTreeMap<PathBuf, bool> = BTreeMap::new();
    let mut pending: Vec<(PathBuf, bool)> = ["lib.rs", "main.rs"]
        .iter()
        .map(|root| (src.join(root), false))
        .collect();
    while let Some((file, test)) = pending.pop() {
        let Some((_, modules)) = scans.get(&file) else {
            continue;
        };
        match reached.get(&file) {
            Some(false) => continue,
            Some(true) if test => continue,
            _ => {}
        }
        reached.insert(file.clone(), test);
        let dir = module_dir(&file);
        for module in modules {
            let (name, scopes) = module.path.split_last().expect("a module has a name");
            let parent = scopes
                .iter()
                .fold(dir.clone(), |dir, scope| dir.join(scope));
            for candidate in [
                parent.join(format!("{name}.rs")),
                parent.join(name).join("mod.rs"),
            ] {
                pending.push((candidate, test || module.test));
            }
        }
    }
    reached
        .into_iter()
        .filter(|(_, test)| *test)
        .map(|(file, _)| file)
        .collect()
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

/// The `mod` item starting at `at`, past its attributes and visibility, or `None` when none starts there.
fn module_item(tokens: &[(usize, String)], at: usize) -> Option<ModuleItem> {
    let text = |index: usize| tokens.get(index).map(|(_, text)| text.as_str());
    let mut next = at;
    let mut test = false;
    while text(next) == Some("#") && text(next + 1) == Some("[") {
        let end = past_group(tokens, next + 1, "[", "]");
        test |= tokens[next..end]
            .iter()
            .map(|(_, text)| text.as_str())
            .eq(["#", "[", "cfg", "(", "test", ")", "]"]);
        next = end;
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
    let body = match text(next + 2) {
        Some(";") => false,
        Some("{") => true,
        _ => return None,
    };
    Some(ModuleItem {
        name,
        test,
        body,
        after: next + 3,
    })
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

/// Identifiers, numbers and single punctuation characters, each with its line.
fn tokens(code: &str) -> Vec<(usize, String)> {
    let mut tokens = Vec::new();
    let mut line = 1;
    let mut chars = code.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\n' {
            line += 1;
        } else if c.is_alphanumeric() || c == '_' {
            let mut word = String::from(c);
            while let Some(&next) = chars.peek() {
                if !(next.is_alphanumeric() || next == '_') {
                    break;
                }
                word.push(next);
                chars.next();
            }
            tokens.push((line, word));
        } else if !c.is_whitespace() {
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
            code.push(' ');
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
        } else if c == '"'
            || (matches!(c, 'b' | 'c') && next == Some('"') && !continues_word(&chars, at))
        {
            at += if c == '"' { 1 } else { 2 };
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

/// The `#` count of a raw string (`r"…"`, `r#"…"#`, `br"…"`, `cr"…"`) starting at `at`.
fn raw_string_start(chars: &[char], at: usize) -> Option<usize> {
    if continues_word(chars, at) {
        return None;
    }
    let mut next = at;
    if matches!(chars.get(next), Some('b' | 'c')) {
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
