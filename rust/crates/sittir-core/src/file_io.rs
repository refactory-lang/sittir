//! The one reader of a source file and the one writer of a rendered file.
//! Every save, write, create and batch file goes through them.

use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

/// How [`write_file`] treats a path that already holds a file.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WriteMode {
    /// Replace the file, leaving one that already holds the bytes untouched.
    Replace,
    /// Write a new file, refusing a path that holds one.
    CreateNew,
}

/// Why a file couldn't be read or written. Each names the path it was given.
#[derive(Debug)]
pub enum FileError {
    /// The file couldn't be read.
    Read { path: PathBuf, cause: io::Error },
    /// The file isn't valid UTF-8; `byte` is the offset of the first invalid byte.
    Encoding { path: PathBuf, byte: usize },
    /// The file couldn't be written. The file at the path is as it was.
    Write { path: PathBuf, cause: io::Error },
    /// A create found a file at the path, and left it as it was.
    Exists { path: PathBuf },
}

impl FileError {
    /// The refusal's reason, as a batch reports it.
    #[must_use]
    pub fn reason(&self) -> &'static str {
        match self {
            Self::Read { .. } => "unreadable",
            Self::Encoding { .. } => "encoding",
            Self::Write { .. } => "unwritable",
            Self::Exists { .. } => "exists",
        }
    }
}

impl fmt::Display for FileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Read { path, cause } => write!(f, "cannot read {}: {cause}", path.display()),
            Self::Encoding { path, byte } => write!(f, "{} is not valid UTF-8 (byte {byte})", path.display()),
            Self::Write { path, cause } => write!(f, "cannot write {}: {cause}", path.display()),
            Self::Exists { path } => write!(f, "cannot create {}: it exists", path.display()),
        }
    }
}

impl std::error::Error for FileError {}

/// The text of the file at `path`, refused when it can't be read or isn't
/// valid UTF-8.
pub fn read_source(path: &Path) -> Result<String, FileError> {
    let bytes = fs::read(path).map_err(|cause| FileError::Read { path: path.to_owned(), cause })?;
    String::from_utf8(bytes).map_err(|error| FileError::Encoding { path: path.to_owned(), byte: error.utf8_error().valid_up_to() })
}

/// Writes `bytes` to `path`, answering whether it wrote.
///
/// The bytes go to a scratch file beside the target, which is then renamed
/// over it (`Replace`) or linked to it (`CreateNew`, which a file at the
/// path refuses). So an error or a crash of the process never leaves the
/// target truncated or half-written, and a failure removes the scratch
/// file. Nothing is synced to disk.
///
/// `Replace` leaves a file that already holds `bytes` untouched and answers
/// `false`. It writes a symlink's target, keeping the link, and keeps the
/// replaced file's permission bits. No directory is ever created.
pub fn write_file(path: &Path, bytes: &[u8], mode: WriteMode) -> Result<bool, FileError> {
    let refused = |cause| FileError::Write { path: path.to_owned(), cause };
    let existing = match mode {
        WriteMode::Replace => match fs::canonicalize(path) {
            Ok(resolved) => Some(resolved),
            Err(cause) if cause.kind() == io::ErrorKind::NotFound => None,
            Err(cause) => return Err(refused(cause)),
        },
        WriteMode::CreateNew => None,
    };
    let permissions = match &existing {
        Some(target) => {
            let meta = fs::metadata(target).map_err(refused)?;
            if meta.is_file() && holds(target, &meta, bytes) {
                return Ok(false);
            }
            Some(meta.permissions())
        }
        None => None,
    };
    let target = existing.as_deref().unwrap_or(path);
    let scratch = scratch_beside(target);
    let written = fs::write(&scratch, bytes)
        .and_then(|()| permissions.map_or(Ok(()), |permissions| fs::set_permissions(&scratch, permissions)))
        .and_then(|()| match mode {
            WriteMode::Replace => fs::rename(&scratch, target),
            WriteMode::CreateNew => fs::hard_link(&scratch, target).and_then(|()| fs::remove_file(&scratch)),
        });
    written.map(|()| true).map_err(|cause| {
        let _ = fs::remove_file(&scratch);
        match (mode, cause.kind()) {
            (WriteMode::CreateNew, io::ErrorKind::AlreadyExists) => FileError::Exists { path: path.to_owned() },
            _ => refused(cause),
        }
    })
}

fn holds(path: &Path, meta: &fs::Metadata, bytes: &[u8]) -> bool {
    meta.len() == bytes.len() as u64 && fs::read(path).is_ok_and(|current| current == bytes)
}

/// A scratch path in `target`'s directory, named for the process and the
/// thread, so no two writers in flight share one.
fn scratch_beside(target: &Path) -> PathBuf {
    let name = target.file_name().map_or_else(String::new, |name| name.to_string_lossy().into_owned());
    let thread: String = format!("{:?}", std::thread::current().id()).chars().filter(char::is_ascii_digit).collect();
    target.with_file_name(format!(".{name}.{}-{thread}.sittir-tmp", std::process::id()))
}

#[cfg(test)]
mod tests {
    use super::{read_source, write_file, FileError, WriteMode};
    use std::fs;
    use std::path::{Path, PathBuf};

    fn directory(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("sittir-file-io-{}-{name}", std::process::id()));
        if dir.exists() {
            fs::remove_dir_all(&dir).unwrap();
        }
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn entries(dir: &Path) -> Vec<String> {
        let mut names: Vec<String> = fs::read_dir(dir).unwrap().map(|entry| entry.unwrap().file_name().to_string_lossy().into_owned()).collect();
        names.sort();
        names
    }

    #[cfg(unix)]
    fn identity(path: &Path) -> (u64, std::time::SystemTime) {
        use std::os::unix::fs::MetadataExt;
        let meta = fs::metadata(path).unwrap();
        (meta.ino(), meta.modified().unwrap())
    }

    #[test]
    #[cfg(unix)]
    fn an_unchanged_file_is_not_rewritten() {
        let dir = directory("unchanged");
        let path = dir.join("a.rs");
        fs::write(&path, "fn a() {}\n").unwrap();
        let before = identity(&path);
        assert!(!write_file(&path, b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert_eq!(identity(&path), before);
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    #[test]
    fn a_changed_file_is_replaced_whole() {
        let dir = directory("changed");
        let path = dir.join("a.rs");
        fs::write(&path, "fn a() { let longer = 1; }\n").unwrap();
        assert!(write_file(&path, b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn a() {}\n");
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    #[test]
    fn a_new_file_is_written() {
        let dir = directory("new");
        let path = dir.join("a.rs");
        assert!(write_file(&path, b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert!(write_file(&dir.join("b.rs"), b"fn b() {}\n", WriteMode::CreateNew).unwrap());
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn a() {}\n");
        assert_eq!(fs::read_to_string(dir.join("b.rs")).unwrap(), "fn b() {}\n");
        assert_eq!(entries(&dir), ["a.rs", "b.rs"]);
    }

    #[test]
    fn create_new_refuses_an_existing_file() {
        let dir = directory("exists");
        let path = dir.join("a.rs");
        fs::write(&path, "fn a() {}\n").unwrap();
        let error = write_file(&path, b"fn b() {}\n", WriteMode::CreateNew).unwrap_err();
        assert!(matches!(error, FileError::Exists { .. }), "{error:?}");
        assert_eq!(error.reason(), "exists");
        assert!(error.to_string().contains(&path.display().to_string()), "{error}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn a() {}\n");
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    #[test]
    fn a_missing_directory_is_refused_by_path() {
        let dir = directory("missing");
        let path = dir.join("no-such-dir").join("a.rs");
        for mode in [WriteMode::Replace, WriteMode::CreateNew] {
            let error = write_file(&path, b"fn a() {}\n", mode).unwrap_err();
            assert!(matches!(error, FileError::Write { .. }), "{error:?}");
            assert_eq!(error.reason(), "unwritable");
            assert!(error.to_string().contains(&path.display().to_string()), "{error}");
        }
        assert_eq!(entries(&dir), Vec::<String>::new());
    }

    #[test]
    #[cfg(unix)]
    fn overwrite_keeps_permission_bits() {
        use std::os::unix::fs::PermissionsExt;
        let dir = directory("mode");
        let path = dir.join("run.py");
        fs::write(&path, "a = 1\n").unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o755)).unwrap();
        assert!(write_file(&path, b"a = 2\n", WriteMode::Replace).unwrap());
        assert_eq!(fs::metadata(&path).unwrap().permissions().mode() & 0o777, 0o755);
    }

    #[test]
    #[cfg(unix)]
    fn a_symlinked_path_writes_its_target() {
        let dir = directory("link");
        let target = dir.join("target.rs");
        let link = dir.join("link.rs");
        fs::write(&target, "fn a() {}\n").unwrap();
        std::os::unix::fs::symlink(&target, &link).unwrap();
        assert!(write_file(&link, b"fn b() {}\n", WriteMode::Replace).unwrap());
        assert!(fs::symlink_metadata(&link).unwrap().file_type().is_symlink());
        assert_eq!(fs::read_to_string(&target).unwrap(), "fn b() {}\n");
        assert_eq!(entries(&dir), ["link.rs", "target.rs"]);
    }

    #[test]
    fn a_failed_write_leaves_no_scratch() {
        let dir = directory("failed");
        let path = dir.join("a.rs");
        fs::create_dir(&path).unwrap();
        let error = write_file(&path, b"fn a() {}\n", WriteMode::Replace).unwrap_err();
        assert!(matches!(error, FileError::Write { .. }), "{error:?}");
        assert!(error.to_string().contains(&path.display().to_string()), "{error}");
        assert!(path.is_dir());
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    #[test]
    fn a_non_utf8_source_is_refused_by_path() {
        let dir = directory("encoding");
        let path = dir.join("a.rs");
        fs::write(&path, [b'a', 0xff]).unwrap();
        let error = read_source(&path).unwrap_err();
        assert!(matches!(error, FileError::Encoding { byte: 1, .. }), "{error:?}");
        assert_eq!(error.reason(), "encoding");
        let message = error.to_string();
        assert!(message.contains(&path.display().to_string()) && message.contains("not valid UTF-8"), "{message}");
    }

    #[test]
    fn an_unreadable_source_is_refused_by_path() {
        let dir = directory("unreadable");
        let path = dir.join("missing.rs");
        let error = read_source(&path).unwrap_err();
        assert!(matches!(error, FileError::Read { .. }), "{error:?}");
        assert_eq!(error.reason(), "unreadable");
        assert!(error.to_string().contains(&path.display().to_string()), "{error}");
        fs::write(&path, "fn a() {}\n").unwrap();
        assert_eq!(read_source(&path).unwrap(), "fn a() {}\n");
    }
}
