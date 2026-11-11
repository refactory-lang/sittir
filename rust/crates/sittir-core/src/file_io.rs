//! The one reader of a source file and the one writer of a rendered file.
//! Every save, write, create and batch file goes through them.

use std::fmt;
use std::fs;
use std::io::{self, Write};
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
/// The bytes go to a scratch file this call creates beside the target,
/// which is then renamed over it (`Replace`) or linked to it (`CreateNew`,
/// which a file at the path refuses). So an error or a crash of the process
/// never leaves the target truncated or half-written, and a failure removes
/// the scratch file. Nothing is synced to disk.
///
/// `Replace` leaves a file that already holds `bytes` untouched and answers
/// `false`, and refuses a path that names anything but a regular file. It
/// writes a symlink's target, keeping the link, even when the target
/// doesn't exist yet. A replaced file keeps its owner, group and permission
/// bits, refusing the write when its owner or group can't be kept, and its
/// new bytes are readable only by the owner until they replace it. No
/// directory is ever created.
pub fn write_file(path: &Path, bytes: &[u8], mode: WriteMode) -> Result<bool, FileError> {
    let refused = |cause| FileError::Write { path: path.to_owned(), cause };
    let (target, replaced) = match mode {
        WriteMode::Replace => match fs::canonicalize(path) {
            Ok(resolved) => {
                let meta = fs::metadata(&resolved).map_err(refused)?;
                if !meta.is_file() {
                    return Err(refused(io::Error::other("it is not a regular file")));
                }
                if holds(&resolved, &meta, bytes) {
                    return Ok(false);
                }
                (resolved, Some(meta))
            }
            Err(cause) if cause.kind() == io::ErrorKind::NotFound => (referent(path).map_err(refused)?, None),
            Err(cause) => return Err(refused(cause)),
        },
        WriteMode::CreateNew => (path.to_owned(), None),
    };
    let (scratch, mut file) = create_scratch(&target, replaced.is_some()).map_err(refused)?;
    let staged = file.write_all(bytes).and_then(|()| match &replaced {
        Some(meta) => keep_owner(&file, meta).and_then(|()| file.set_permissions(meta.permissions())),
        None => Ok(()),
    });
    drop(file);
    let written = staged.and_then(|()| match mode {
        WriteMode::Replace => fs::rename(&scratch, &target),
        WriteMode::CreateNew => fs::hard_link(&scratch, &target),
    });
    if mode == WriteMode::CreateNew || written.is_err() {
        let _ = fs::remove_file(&scratch);
    }
    written.map(|()| true).map_err(|cause| match (mode, cause.kind()) {
        (WriteMode::CreateNew, io::ErrorKind::AlreadyExists) => FileError::Exists { path: path.to_owned() },
        _ => refused(cause),
    })
}

fn holds(path: &Path, meta: &fs::Metadata, bytes: &[u8]) -> bool {
    meta.len() == bytes.len() as u64 && fs::read(path).is_ok_and(|current| current == bytes)
}

/// Gives `file` the owner and group of the file it replaces (`replaced`),
/// so the replacement is readable by no one the replaced file wasn't.
/// Refuses when the process may not, rather than widening who can read it.
#[cfg(unix)]
fn keep_owner(file: &fs::File, replaced: &fs::Metadata) -> io::Result<()> {
    use std::os::unix::fs::MetadataExt;
    let own = file.metadata()?;
    let uid = (own.uid() != replaced.uid()).then_some(replaced.uid());
    let gid = (own.gid() != replaced.gid()).then_some(replaced.gid());
    if uid.is_none() && gid.is_none() {
        return Ok(());
    }
    std::os::unix::fs::fchown(file, uid, gid).map_err(|cause| io::Error::new(cause.kind(), format!("its owner and group can't be kept: {cause}")))
}

#[cfg(not(unix))]
#[allow(clippy::unnecessary_wraps, reason = "the unix twin refuses an owner it can't keep")]
fn keep_owner(_: &fs::File, _: &fs::Metadata) -> io::Result<()> {
    Ok(())
}

/// `path` with each symlink its last component names followed, so a link to
/// a file that doesn't exist yet names that file. A path that isn't a link
/// is itself.
fn referent(path: &Path) -> io::Result<PathBuf> {
    let mut current = path.to_owned();
    for _ in 0..MAX_LINKS {
        match fs::symlink_metadata(&current) {
            Ok(meta) if meta.file_type().is_symlink() => {
                let link = fs::read_link(&current)?;
                current = current.parent().map_or_else(|| link.clone(), |dir| dir.join(&link));
            }
            _ => return Ok(current),
        }
    }
    Err(io::Error::other(format!("more than {MAX_LINKS} symbolic links")))
}

const MAX_LINKS: usize = 40;

const SCRATCH_ATTEMPTS: u32 = 16;

/// A scratch file this call creates beside `target`: exclusively, so it is
/// never a file or link that was already there, and readable only by the
/// owner when it will replace a file (`private`).
fn create_scratch(target: &Path, private: bool) -> io::Result<(PathBuf, fs::File)> {
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    if private {
        std::os::unix::fs::OpenOptionsExt::mode(&mut options, 0o600);
    }
    #[cfg(not(unix))]
    let _ = private;
    for attempt in 0..SCRATCH_ATTEMPTS {
        let scratch = scratch_name(target, attempt);
        match options.open(&scratch) {
            Ok(file) => return Ok((scratch, file)),
            Err(cause) if cause.kind() == io::ErrorKind::AlreadyExists => {}
            Err(cause) => return Err(cause),
        }
    }
    Err(io::Error::new(io::ErrorKind::AlreadyExists, format!("{SCRATCH_ATTEMPTS} scratch names beside it are taken")))
}

/// The scratch path of `attempt` in `target`'s directory, named for the
/// process and the thread, so writers in flight don't contend for one.
fn scratch_name(target: &Path, attempt: u32) -> PathBuf {
    let name = target.file_name().map_or_else(String::new, |name| name.to_string_lossy().into_owned());
    let thread: String = format!("{:?}", std::thread::current().id()).chars().filter(char::is_ascii_digit).collect();
    target.with_file_name(format!(".{name}.{}-{thread}-{attempt}.sittir-tmp", std::process::id()))
}

#[cfg(test)]
mod tests {
    use super::{create_scratch, read_source, scratch_name, write_file, FileError, WriteMode};
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
    #[cfg(unix)]
    fn a_stale_scratch_linked_to_the_target_never_changes_it() {
        let dir = directory("stale");
        let path = dir.join("a.rs");
        fs::write(&path, "keep\n").unwrap();
        let stale = scratch_name(&path, 0);
        fs::hard_link(&path, &stale).unwrap();
        let error = write_file(&path, b"new\n", WriteMode::CreateNew).unwrap_err();
        assert!(matches!(error, FileError::Exists { .. }), "{error:?}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "keep\n");
        assert!(write_file(&path, b"new\n", WriteMode::Replace).unwrap());
        assert_eq!(fs::read_to_string(&path).unwrap(), "new\n");
        assert_eq!(fs::read_to_string(&stale).unwrap(), "keep\n");
    }

    #[test]
    #[cfg(unix)]
    fn a_planted_scratch_link_is_never_written_through() {
        let dir = directory("planted");
        let path = dir.join("a.rs");
        let other = dir.join("other.rs");
        fs::write(&path, "a\n").unwrap();
        fs::write(&other, "other\n").unwrap();
        std::os::unix::fs::symlink(&other, scratch_name(&path, 0)).unwrap();
        assert!(write_file(&path, b"b\n", WriteMode::Replace).unwrap());
        assert_eq!(fs::read_to_string(&other).unwrap(), "other\n");
        assert_eq!(fs::read_to_string(&path).unwrap(), "b\n");
        assert!(!fs::symlink_metadata(&path).unwrap().file_type().is_symlink());
    }

    #[test]
    #[cfg(unix)]
    fn the_scratch_replacing_a_file_is_owner_only_from_its_creation() {
        use std::os::unix::fs::PermissionsExt;
        let dir = directory("private");
        let path = dir.join("secret.rs");
        let (scratch, file) = create_scratch(&path, true).unwrap();
        assert_eq!(file.metadata().unwrap().permissions().mode() & 0o777, 0o600);
        fs::remove_file(scratch).unwrap();
    }

    #[test]
    #[cfg(unix)]
    fn a_replaced_file_keeps_its_group() {
        use std::os::unix::fs::{MetadataExt, PermissionsExt};
        let dir = directory("group");
        let path = dir.join("shared.rs");
        fs::write(&path, "a\n").unwrap();
        let default = fs::metadata(&path).unwrap().gid();
        let groups = std::process::Command::new("id").arg("-G").output().unwrap();
        let Some(other) = String::from_utf8_lossy(&groups.stdout).split_whitespace().filter_map(|gid| gid.parse::<u32>().ok()).find(|&gid| gid != default) else {
            return;
        };
        std::os::unix::fs::chown(&path, None, Some(other)).unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o640)).unwrap();
        assert!(write_file(&path, b"b\n", WriteMode::Replace).unwrap());
        let meta = fs::metadata(&path).unwrap();
        assert_eq!((meta.gid(), meta.permissions().mode() & 0o777), (other, 0o640));
        assert_eq!(fs::read_to_string(&path).unwrap(), "b\n");
    }

    #[test]
    #[cfg(unix)]
    fn a_socket_or_pipe_is_refused_and_kept() {
        use std::os::unix::fs::FileTypeExt;
        let dir = directory("special");
        let socket = dir.join("a.sock");
        let _listener = std::os::unix::net::UnixListener::bind(&socket).unwrap();
        let pipe = dir.join("a.pipe");
        assert!(std::process::Command::new("mkfifo").arg(&pipe).status().unwrap().success());
        let link = dir.join("link.rs");
        std::os::unix::fs::symlink(&pipe, &link).unwrap();
        for path in [&socket, &pipe, &link] {
            let error = write_file(path, b"a\n", WriteMode::Replace).unwrap_err();
            assert!(matches!(error, FileError::Write { .. }), "{error:?}");
            assert!(error.to_string().contains("not a regular file"), "{error}");
        }
        assert!(fs::symlink_metadata(&socket).unwrap().file_type().is_socket());
        assert!(fs::symlink_metadata(&pipe).unwrap().file_type().is_fifo());
        assert!(fs::symlink_metadata(&link).unwrap().file_type().is_symlink());
        assert_eq!(entries(&dir), ["a.pipe", "a.sock", "link.rs"]);
    }

    #[test]
    #[cfg(unix)]
    fn a_dangling_symlink_writes_its_referent() {
        let dir = directory("dangling");
        let link = dir.join("link.rs");
        std::os::unix::fs::symlink("missing.rs", &link).unwrap();
        assert!(write_file(&link, b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert!(fs::symlink_metadata(&link).unwrap().file_type().is_symlink());
        assert_eq!(fs::read_to_string(dir.join("missing.rs")).unwrap(), "fn a() {}\n");
        assert_eq!(entries(&dir), ["link.rs", "missing.rs"]);
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
