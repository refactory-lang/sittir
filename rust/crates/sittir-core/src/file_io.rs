//! The one reader of a source file and the one writer of a rendered file.
//! Every save, write, create and batch file goes through them.

use std::fmt;
use std::fs;
use std::io::{self, Read, Seek, Write};
use std::path::{Path, PathBuf};

/// How [`write_file`] treats a path that already holds a file.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WriteMode {
    /// Write over the file in place, leaving one that already holds the bytes untouched.
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
    /// The file couldn't be written. The message says whether the file went back to what it was.
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

/// Writes `bytes` to `path` in place, answering whether it wrote.
///
/// The file is never replaced, so everything stored on it survives: its
/// owner, mode, ACL, extended attributes, flags and hard links. A symlink
/// writes its target, and a link to a missing file creates that file.
/// `Replace` leaves a file that already holds `bytes` untouched and answers
/// `false`. `CreateNew` refuses a path that holds a file. A path naming
/// anything but a regular file is refused before it is opened, so a pipe
/// never blocks, and a missing directory is refused; none is ever created.
///
/// A write that fails partway puts the file back as it was
/// (`write_or_restore`). A process killed mid-write can still leave a
/// partial file. Nothing is synced to disk.
pub fn write_file(path: &Path, bytes: &[u8], mode: WriteMode) -> Result<bool, FileError> {
    write_through(path, bytes, mode, |file| file)
}

/// `write_file`, writing through what `wrap` makes of the opened file, so a
/// test can make the write fail partway.
fn write_through<F: Rewrite>(path: &Path, bytes: &[u8], mode: WriteMode, wrap: impl FnOnce(fs::File) -> F) -> Result<bool, FileError> {
    let refused = |cause| FileError::Write { path: path.to_owned(), cause };
    let not_regular = || refused(io::Error::other("it is not a regular file"));
    let created = |at: &Path| fs::OpenOptions::new().write(true).create_new(true).open(at);
    let (file, before) = match mode {
        WriteMode::Replace => match fs::metadata(path) {
            Ok(meta) if !meta.is_file() => return Err(not_regular()),
            Ok(_) => {
                let mut file = fs::OpenOptions::new().read(true).write(true).open(path).map_err(refused)?;
                if !file.metadata().map_err(refused)?.is_file() {
                    return Err(not_regular());
                }
                let mut original = Vec::new();
                file.read_to_end(&mut original).map_err(refused)?;
                if original == bytes {
                    return Ok(false);
                }
                (file, Before::Held(original))
            }
            Err(cause) if cause.kind() == io::ErrorKind::NotFound => {
                let target = referent(path).map_err(refused)?;
                (created(&target).map_err(refused)?, Before::Absent(target))
            }
            Err(cause) => return Err(refused(cause)),
        },
        WriteMode::CreateNew => {
            let file = created(path).map_err(|cause| match cause.kind() {
                io::ErrorKind::AlreadyExists => FileError::Exists { path: path.to_owned() },
                _ => refused(cause),
            })?;
            (file, Before::Absent(path.to_owned()))
        }
    };
    write_or_restore(path, wrap(file), bytes, before)
}

/// An opened file a write goes through. Writing it and putting it back
/// both go through the descriptor the write opened, so a file another
/// process renames over the path meanwhile is never touched.
trait Rewrite {
    /// Empties the file and writes `bytes` to it.
    fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()>;
    /// Whether `path` still names this file. Unsupported where the platform
    /// can't tell, and a file isn't removed then.
    fn is_at(&self, path: &Path) -> io::Result<bool>;
}

impl Rewrite for fs::File {
    fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()> {
        self.set_len(0)?;
        self.seek(io::SeekFrom::Start(0))?;
        self.write_all(bytes)?;
        self.flush()
    }

    #[cfg(unix)]
    fn is_at(&self, path: &Path) -> io::Result<bool> {
        use std::os::unix::fs::MetadataExt;
        let (own, named) = (self.metadata()?, fs::symlink_metadata(path)?);
        Ok(own.dev() == named.dev() && own.ino() == named.ino())
    }

    #[cfg(not(unix))]
    fn is_at(&self, _: &Path) -> io::Result<bool> {
        Err(io::Error::new(io::ErrorKind::Unsupported, "this platform can't tell whether the path still names it"))
    }
}

/// What a file was before a write opened it: its bytes, or no file at the
/// path the write created.
enum Before {
    Held(Vec<u8>),
    Absent(PathBuf),
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

/// Writes `bytes` through `file`, which `path` opened, answering `true`.
/// When the write fails partway, the file goes back to what it was
/// (`before`), through the same descriptor: its bytes are written again, or
/// the file the write created is removed, unless another file has taken
/// its path since, or the platform can't tell, when it is left as it is. The error names the path and the
/// failure, and says whether the file went back.
fn write_or_restore<F: Rewrite>(path: &Path, mut file: F, bytes: &[u8], before: Before) -> Result<bool, FileError> {
    let Err(cause) = file.rewrite(bytes) else {
        return Ok(true);
    };
    let outcome = match before {
        Before::Held(original) => match file.rewrite(&original) {
            Ok(()) => "its original bytes were restored".to_owned(),
            Err(failed) => format!("restoring its original bytes failed too: {failed}"),
        },
        Before::Absent(created) => match file.is_at(&created) {
            Ok(true) => match fs::remove_file(&created) {
                Ok(()) => "the file it created was removed".to_owned(),
                Err(failed) => format!("removing the file it created failed too: {failed}"),
            },
            Ok(false) => "another file replaced the one it created, and was left as it is".to_owned(),
            Err(failed) if failed.kind() == io::ErrorKind::NotFound => "the file it created is gone".to_owned(),
            Err(failed) if failed.kind() == io::ErrorKind::Unsupported => format!("the file it created was left, since {failed}"),
            Err(failed) => format!("removing the file it created failed too: {failed}"),
        },
    };
    drop(file);
    Err(FileError::Write { path: path.to_owned(), cause: io::Error::new(cause.kind(), format!("{cause}; {outcome}")) })
}

#[cfg(test)]
mod tests {
    use super::{read_source, write_file, write_through, FileError, Rewrite, WriteMode};
    use std::fs;
    use std::io;
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
    fn inode(path: &Path) -> u64 {
        std::os::unix::fs::MetadataExt::ino(&fs::metadata(path).unwrap())
    }

    /// A file whose first write takes `left` bytes and then fails, as a full
    /// disk does, running `meanwhile` (another process at work on the path)
    /// just before. Later writes, the restore among them, go through.
    struct FailsAfter<F> {
        inner: F,
        left: usize,
        meanwhile: Option<Box<dyn FnOnce()>>,
    }

    fn fails_after(left: usize, meanwhile: impl FnOnce() + 'static) -> impl FnOnce(fs::File) -> FailsAfter<fs::File> {
        move |inner| FailsAfter { inner, left, meanwhile: Some(Box::new(meanwhile)) }
    }

    impl<F: Rewrite> Rewrite for FailsAfter<F> {
        fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()> {
            let Some(meanwhile) = self.meanwhile.take() else {
                return self.inner.rewrite(bytes);
            };
            self.inner.rewrite(&bytes[..bytes.len().min(self.left)])?;
            meanwhile();
            Err(io::Error::new(io::ErrorKind::StorageFull, "no space left"))
        }

        fn is_at(&self, path: &Path) -> io::Result<bool> {
            self.inner.is_at(path)
        }
    }

    #[test]
    #[cfg(unix)]
    fn an_unchanged_file_is_not_rewritten() {
        let dir = directory("unchanged");
        let path = dir.join("a.rs");
        fs::write(&path, "fn a() {}\n").unwrap();
        let before = (inode(&path), fs::metadata(&path).unwrap().modified().unwrap());
        assert!(!write_file(&path, b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert_eq!((inode(&path), fs::metadata(&path).unwrap().modified().unwrap()), before);
    }

    #[test]
    fn a_changed_file_is_written_in_place() {
        let dir = directory("changed");
        let path = dir.join("a.rs");
        fs::write(&path, "fn a() { let longer = 1; }\n").unwrap();
        #[cfg(unix)]
        let before = inode(&path);
        assert!(write_file(&path, b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn a() {}\n");
        #[cfg(unix)]
        assert_eq!(inode(&path), before);
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    #[test]
    fn a_new_file_is_written() {
        let dir = directory("new");
        assert!(write_file(&dir.join("a.rs"), b"fn a() {}\n", WriteMode::Replace).unwrap());
        assert!(write_file(&dir.join("b.rs"), b"fn b() {}\n", WriteMode::CreateNew).unwrap());
        assert_eq!(fs::read_to_string(dir.join("a.rs")).unwrap(), "fn a() {}\n");
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
    fn a_save_keeps_mode_and_hard_links() {
        use std::os::unix::fs::PermissionsExt;
        let dir = directory("mode");
        let path = dir.join("run.py");
        let link = dir.join("also.py");
        fs::write(&path, "a = 1\n").unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o755)).unwrap();
        fs::hard_link(&path, &link).unwrap();
        assert!(write_file(&path, b"a = 2\n", WriteMode::Replace).unwrap());
        assert_eq!(fs::metadata(&path).unwrap().permissions().mode() & 0o777, 0o755);
        assert_eq!(fs::read_to_string(&link).unwrap(), "a = 2\n");
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn a_save_keeps_extended_attributes() {
        let dir = directory("xattr");
        let path = dir.join("a.rs");
        fs::write(&path, "fn a() {}\n").unwrap();
        let set = std::process::Command::new("xattr").args(["-w", "com.sittir.test", "kept"]).arg(&path).status().unwrap();
        assert!(set.success());
        assert!(write_file(&path, b"fn b() {}\n", WriteMode::Replace).unwrap());
        let read = std::process::Command::new("xattr").args(["-p", "com.sittir.test"]).arg(&path).output().unwrap();
        assert_eq!(String::from_utf8_lossy(&read.stdout).trim(), "kept");
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
    }

    #[test]
    fn a_path_that_is_not_a_regular_file_is_refused() {
        let dir = directory("special");
        let mut refused = vec![dir.join("a-dir")];
        fs::create_dir(&refused[0]).unwrap();
        #[cfg(unix)]
        let _listener = {
            let socket = dir.join("a.sock");
            let pipe = dir.join("a.pipe");
            let link = dir.join("link.rs");
            assert!(std::process::Command::new("mkfifo").arg(&pipe).status().unwrap().success());
            std::os::unix::fs::symlink(&pipe, &link).unwrap();
            let listener = std::os::unix::net::UnixListener::bind(&socket).unwrap();
            refused.extend([socket, pipe, link]);
            listener
        };
        for path in &refused {
            let error = write_file(path, b"a\n", WriteMode::Replace).unwrap_err();
            assert!(matches!(error, FileError::Write { .. }), "{error:?}");
            assert!(error.to_string().contains("not a regular file"), "{error}");
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::FileTypeExt;
            assert!(fs::symlink_metadata(dir.join("a.sock")).unwrap().file_type().is_socket());
            assert!(fs::symlink_metadata(dir.join("a.pipe")).unwrap().file_type().is_fifo());
        }
        assert!(dir.join("a-dir").is_dir());
    }

    #[test]
    fn a_failed_write_restores_the_original() {
        let dir = directory("restore");
        let path = dir.join("a.rs");
        fs::write(&path, "fn original() {}\n").unwrap();
        let error = write_through(&path, b"fn replacement() {}\n", WriteMode::Replace, fails_after(4, || {})).unwrap_err();
        assert!(matches!(error, FileError::Write { .. }), "{error:?}");
        let message = error.to_string();
        assert!(message.contains(&path.display().to_string()) && message.contains("no space left") && message.contains("restored"), "{message}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn original() {}\n");
    }

    #[test]
    fn a_failed_create_removes_its_file() {
        let dir = directory("unmade");
        let path = dir.join("a.rs");
        let error = write_through(&path, b"fn a() {}\n", WriteMode::CreateNew, fails_after(4, || {})).unwrap_err();
        assert!(error.to_string().contains("removed"), "{error}");
        assert_eq!(entries(&dir), Vec::<String>::new());
    }

    #[test]
    #[cfg(unix)]
    fn a_failed_write_through_a_dangling_link_removes_its_target_and_keeps_the_link() {
        let dir = directory("dangling-failed");
        let link = dir.join("out.rs");
        std::os::unix::fs::symlink("generated.rs", &link).unwrap();
        let error = write_through(&link, b"fn a() {}\n", WriteMode::Replace, fails_after(4, || {})).unwrap_err();
        assert!(error.to_string().contains("removed"), "{error}");
        assert!(fs::symlink_metadata(&link).unwrap().file_type().is_symlink());
        assert_eq!(entries(&dir), ["out.rs"]);
    }

    #[test]
    #[cfg(unix)]
    fn a_failed_write_never_touches_a_file_that_replaced_it() {
        let dir = directory("raced");
        let path = dir.join("a.rs");
        fs::write(&path, "fn original() {}\n").unwrap();
        let (editor, at) = (dir.join("editor.rs"), path.clone());
        let error = write_through(&path, b"fn replacement() {}\n", WriteMode::Replace, fails_after(4, move || {
            fs::write(&editor, "fn editor() {}\n").unwrap();
            fs::rename(&editor, &at).unwrap();
        }))
        .unwrap_err();
        assert!(error.to_string().contains("restored"), "{error}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn editor() {}\n");
    }

    #[test]
    #[cfg(unix)]
    fn a_failed_write_through_a_retargeted_link_restores_the_file_it_opened() {
        let dir = directory("retarget");
        let (a, b, link) = (dir.join("a.rs"), dir.join("b.rs"), dir.join("link.rs"));
        fs::write(&a, "fn a() {}\n").unwrap();
        fs::write(&b, "fn b() {}\n").unwrap();
        std::os::unix::fs::symlink(&a, &link).unwrap();
        let (to, at) = (b.clone(), link.clone());
        write_through(&link, b"fn replacement() {}\n", WriteMode::Replace, fails_after(4, move || {
            fs::remove_file(&at).unwrap();
            std::os::unix::fs::symlink(&to, &at).unwrap();
        }))
        .unwrap_err();
        assert_eq!(fs::read_to_string(&a).unwrap(), "fn a() {}\n");
        assert_eq!(fs::read_to_string(&b).unwrap(), "fn b() {}\n");
    }

    #[test]
    #[cfg(unix)]
    fn a_failed_create_leaves_a_file_that_replaced_it() {
        let dir = directory("create-raced");
        let path = dir.join("a.rs");
        let (editor, at) = (dir.join("editor.rs"), path.clone());
        let error = write_through(&path, b"fn a() {}\n", WriteMode::CreateNew, fails_after(4, move || {
            fs::write(&editor, "fn editor() {}\n").unwrap();
            fs::rename(&editor, &at).unwrap();
        }))
        .unwrap_err();
        assert!(error.to_string().contains("replaced"), "{error}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn editor() {}\n");
    }

    /// A file whose identity this platform can't check, as on Windows.
    struct IdentityUnknown<F>(F);

    impl<F: Rewrite> Rewrite for IdentityUnknown<F> {
        fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()> {
            self.0.rewrite(bytes)
        }

        fn is_at(&self, _: &Path) -> io::Result<bool> {
            Err(io::Error::new(io::ErrorKind::Unsupported, "this platform can't tell whether the path still names it"))
        }
    }

    #[test]
    fn a_failed_create_whose_identity_is_unknown_leaves_its_file() {
        let dir = directory("identity");
        let path = dir.join("a.rs");
        let failing = fails_after(4, || {});
        let error = write_through(&path, b"fn a() {}\n", WriteMode::CreateNew, |file| IdentityUnknown(failing(file))).unwrap_err();
        assert!(error.to_string().contains("the file it created was left"), "{error}");
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
