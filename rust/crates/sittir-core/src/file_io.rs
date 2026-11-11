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
/// A write that fails partway puts the file back as it was: an existing
/// file gets its original bytes again, through the descriptor it was
/// written with (`write_or_restore`), and a new file never appears. A new
/// file is written beside its target and then linked in (`create_file`).
/// On a filesystem without hard links, such as exFAT or FAT32, a new file
/// is created in place instead (`create_in_place`), and only there can a
/// failed create leave a partly written file; its error says so. A process
/// killed mid-write can still leave an existing file partly written.
/// Nothing is synced to disk.
pub fn write_file(path: &Path, bytes: &[u8], mode: WriteMode) -> Result<bool, FileError> {
    write_through(path, bytes, mode, |file| file, |scratch, target| fs::hard_link(scratch, target))
}

/// `write_file`, writing through what `wrap` makes of each opened file and
/// linking a new file in with `link`, so a test can make a write fail
/// partway or a filesystem lack hard links.
fn write_through<F: Rewrite>(
    path: &Path,
    bytes: &[u8],
    mode: WriteMode,
    mut wrap: impl FnMut(fs::File) -> F,
    link: impl FnOnce(&Path, &Path) -> io::Result<()>,
) -> Result<bool, FileError> {
    let refused = |cause| FileError::Write { path: path.to_owned(), cause };
    let not_regular = || refused(io::Error::other("it is not a regular file"));
    match mode {
        WriteMode::Replace => match fs::metadata(path) {
            Ok(meta) if !meta.is_file() => Err(not_regular()),
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
                write_or_restore(path, wrap(file), bytes, &original)
            }
            Err(cause) if cause.kind() == io::ErrorKind::NotFound => create_file(path, &referent(path).map_err(refused)?, bytes, mode, wrap, link),
            Err(cause) => Err(refused(cause)),
        },
        WriteMode::CreateNew => match fs::symlink_metadata(path) {
            Ok(_) => Err(FileError::Exists { path: path.to_owned() }),
            Err(cause) if cause.kind() == io::ErrorKind::NotFound => create_file(path, path, bytes, mode, wrap, link),
            Err(cause) => Err(refused(cause)),
        },
    }
}

/// Creates `target`, which `path` names, holding `bytes`, answering `true`.
/// The bytes go to a scratch file beside the target, named for it, the
/// process and the thread, which is then hard-linked to the target. The
/// link fails when a file has appeared at the target meanwhile, so nothing
/// is clobbered, and a write that fails partway leaves nothing at the
/// target. The scratch file is removed either way. On a filesystem without
/// hard links the target is created in place instead (`create_in_place`).
fn create_file<F: Rewrite>(
    path: &Path,
    target: &Path,
    bytes: &[u8],
    mode: WriteMode,
    mut wrap: impl FnMut(fs::File) -> F,
    link: impl FnOnce(&Path, &Path) -> io::Result<()>,
) -> Result<bool, FileError> {
    let refused = |cause| FileError::Write { path: path.to_owned(), cause };
    let scratch = scratch_name(target);
    let file = fs::OpenOptions::new().write(true).create_new(true).open(&scratch).map_err(refused)?;
    let written = wrap(file).rewrite(bytes);
    let linked = written.map(|()| link(&scratch, target));
    let removed = fs::remove_file(&scratch);
    let cause = match linked {
        Ok(Ok(())) => return Ok(true),
        Ok(Err(cause)) if has_no_hard_links(&cause) => return create_in_place(path, target, bytes, mode, wrap),
        Ok(Err(cause)) | Err(cause) => cause,
    };
    if found_a_file(mode, &cause) {
        return Err(FileError::Exists { path: path.to_owned() });
    }
    let outcome = match removed {
        Ok(()) => "nothing was created".to_owned(),
        Err(failed) => format!("nothing was created, but removing its scratch file {} failed: {failed}", scratch.display()),
    };
    Err(refused(io::Error::new(cause.kind(), format!("{cause}; {outcome}"))))
}

/// Creates `target`, which `path` names, holding `bytes` written in place,
/// answering `true`, for a filesystem without hard links. Opening it new
/// refuses a file that has appeared at the target, so nothing is clobbered.
/// A write that fails partway leaves the new file partly written, since
/// removing it by path could remove a file another process has put there
/// since, and the error says so.
fn create_in_place<F: Rewrite>(path: &Path, target: &Path, bytes: &[u8], mode: WriteMode, mut wrap: impl FnMut(fs::File) -> F) -> Result<bool, FileError> {
    let refused = |cause| FileError::Write { path: path.to_owned(), cause };
    let file = match fs::OpenOptions::new().write(true).create_new(true).open(target) {
        Ok(file) => file,
        Err(cause) if found_a_file(mode, &cause) => return Err(FileError::Exists { path: path.to_owned() }),
        Err(cause) => return Err(refused(cause)),
    };
    let Err(cause) = wrap(file).rewrite(bytes) else {
        return Ok(true);
    };
    let outcome = "the filesystem has no hard links, so the file was created in place and is left partly written";
    Err(refused(io::Error::new(cause.kind(), format!("{cause}; {outcome}"))))
}

/// Whether a create met a file at its path, which `CreateNew` reports as
/// [`FileError::Exists`].
fn found_a_file(mode: WriteMode, cause: &io::Error) -> bool {
    mode == WriteMode::CreateNew && cause.kind() == io::ErrorKind::AlreadyExists
}

/// Whether a link failed because the filesystem has no hard links.
fn has_no_hard_links(cause: &io::Error) -> bool {
    cause.kind() == io::ErrorKind::Unsupported || cause.raw_os_error().is_some_and(|code| NO_HARD_LINKS.contains(&code))
}

/// The OS error codes, beside [`io::ErrorKind::Unsupported`], a link
/// answers with on a filesystem without hard links: `ENOTSUP` on macOS
/// (exFAT and FAT32), `EPERM` on Linux (any filesystem without them), and
/// `ERROR_INVALID_FUNCTION` and `ERROR_NOT_SUPPORTED` on Windows.
#[cfg(unix)]
const NO_HARD_LINKS: [i32; 2] = [libc::ENOTSUP, libc::EPERM];
#[cfg(windows)]
const NO_HARD_LINKS: [i32; 2] = [1, 50];
#[cfg(not(any(unix, windows)))]
const NO_HARD_LINKS: [i32; 0] = [];

/// The scratch path beside `target`, named for it, the process and the
/// thread, so no two writers in flight share one.
fn scratch_name(target: &Path) -> PathBuf {
    let name = target.file_name().map_or_else(String::new, |name| name.to_string_lossy().into_owned());
    let thread: String = format!("{:?}", std::thread::current().id()).chars().filter(char::is_ascii_digit).collect();
    target.with_file_name(format!(".{name}.{}-{thread}.sittir-tmp", std::process::id()))
}

/// An opened file a write goes through. Writing it and putting it back
/// both go through the descriptor the write opened, so a file another
/// process renames over the path meanwhile is never touched.
trait Rewrite {
    /// Empties the file and writes `bytes` to it.
    fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()>;
}

impl Rewrite for fs::File {
    fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()> {
        self.set_len(0)?;
        self.seek(io::SeekFrom::Start(0))?;
        self.write_all(bytes)?;
        self.flush()
    }
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

/// Writes `bytes` through `file`, the existing file `path` opened,
/// answering `true`. When the write fails partway, the file gets its
/// `original` bytes back through the same descriptor, so a file another
/// process renamed over the path meanwhile is never touched. The error
/// names the path and the failure, and says whether the file went back.
fn write_or_restore<F: Rewrite>(path: &Path, mut file: F, bytes: &[u8], original: &[u8]) -> Result<bool, FileError> {
    let Err(cause) = file.rewrite(bytes) else {
        return Ok(true);
    };
    let outcome = match file.rewrite(original) {
        Ok(()) => "its original bytes were restored".to_owned(),
        Err(failed) => format!("restoring its original bytes failed too: {failed}"),
    };
    drop(file);
    Err(FileError::Write { path: path.to_owned(), cause: io::Error::new(cause.kind(), format!("{cause}; {outcome}")) })
}

#[cfg(test)]
mod tests {
    use super::{read_source, write_file, write_through, FileError, Rewrite, WriteMode, NO_HARD_LINKS};
    use std::fs;
    use std::io;
    use std::path::{Path, PathBuf};

    fn linked(scratch: &Path, target: &Path) -> io::Result<()> {
        fs::hard_link(scratch, target)
    }

    /// Each error a filesystem without hard links answers a link with.
    fn no_hard_links() -> Vec<io::Error> {
        NO_HARD_LINKS.iter().map(|&code| io::Error::from_raw_os_error(code)).chain([io::ErrorKind::Unsupported.into()]).collect()
    }

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

    /// Wraps the first file opened in a [`FailsAfter`], and any later one
    /// in one whose writes all go through.
    fn fails_after(left: usize, meanwhile: impl FnOnce() + 'static) -> impl FnMut(fs::File) -> FailsAfter<fs::File> {
        let mut meanwhile: Option<Box<dyn FnOnce()>> = Some(Box::new(meanwhile));
        move |inner| FailsAfter { inner, left, meanwhile: meanwhile.take() }
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
        let error = write_through(&path, b"fn replacement() {}\n", WriteMode::Replace, fails_after(4, || {}), linked).unwrap_err();
        assert!(matches!(error, FileError::Write { .. }), "{error:?}");
        let message = error.to_string();
        assert!(message.contains(&path.display().to_string()) && message.contains("no space left") && message.contains("restored"), "{message}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn original() {}\n");
    }

    #[test]
    fn a_failed_create_leaves_nothing_at_the_target_or_beside_it() {
        let dir = directory("unmade");
        let path = dir.join("a.rs");
        let error = write_through(&path, b"fn a() {}\n", WriteMode::CreateNew, fails_after(4, || {}), linked).unwrap_err();
        assert!(error.to_string().contains("nothing was created"), "{error}");
        assert_eq!(entries(&dir), Vec::<String>::new());
    }

    #[test]
    #[cfg(unix)]
    fn a_failed_write_through_a_dangling_link_keeps_the_link_and_creates_nothing() {
        let dir = directory("dangling-failed");
        let link = dir.join("out.rs");
        std::os::unix::fs::symlink("generated.rs", &link).unwrap();
        let error = write_through(&link, b"fn a() {}\n", WriteMode::Replace, fails_after(4, || {}), linked).unwrap_err();
        assert!(error.to_string().contains("nothing was created"), "{error}");
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
        }), linked)
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
        }), linked)
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
        }), linked)
        .unwrap_err();
        assert!(error.to_string().contains("nothing was created"), "{error}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn editor() {}\n");
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    /// A file whose first write runs `meanwhile` (another process at work
    /// on the path) and then goes through.
    struct Meanwhile<F> {
        inner: F,
        meanwhile: Option<Box<dyn FnOnce()>>,
    }

    impl<F: Rewrite> Rewrite for Meanwhile<F> {
        fn rewrite(&mut self, bytes: &[u8]) -> io::Result<()> {
            if let Some(meanwhile) = self.meanwhile.take() {
                meanwhile();
            }
            self.inner.rewrite(bytes)
        }
    }

    #[test]
    fn a_create_never_clobbers_a_file_that_appeared_meanwhile() {
        let dir = directory("appeared");
        for mode in [WriteMode::CreateNew, WriteMode::Replace] {
            let path = dir.join(format!("{mode:?}.rs"));
            let at = path.clone();
            let mut meanwhile: Option<Box<dyn FnOnce()>> = Some(Box::new(move || fs::write(&at, "fn theirs() {}\n").unwrap()));
            let error = write_through(&path, b"fn ours() {}\n", mode, |inner| Meanwhile { inner, meanwhile: meanwhile.take() }, linked).unwrap_err();
            assert!(matches!((mode, &error), (WriteMode::CreateNew, FileError::Exists { .. }) | (WriteMode::Replace, FileError::Write { .. })), "{error:?}");
            assert_eq!(fs::read_to_string(&path).unwrap(), "fn theirs() {}\n");
        }
        assert_eq!(entries(&dir), ["CreateNew.rs", "Replace.rs"]);
    }

    #[test]
    fn a_create_without_hard_links_writes_the_file_in_place() {
        let dir = directory("no-links");
        let mut made = Vec::new();
        for mode in [WriteMode::Replace, WriteMode::CreateNew] {
            for (index, failure) in no_hard_links().into_iter().enumerate() {
                let name = format!("{mode:?}-{index}.rs");
                assert!(write_through(&dir.join(&name), b"fn a() {}\n", mode, |file| file, move |_, _| Err(failure)).unwrap());
                assert_eq!(fs::read_to_string(dir.join(&name)).unwrap(), "fn a() {}\n");
                made.push(name);
            }
        }
        made.sort();
        assert_eq!(entries(&dir), made);
    }

    #[test]
    fn a_failed_create_without_hard_links_is_left_partly_written_and_says_so() {
        let dir = directory("no-links-failed");
        let path = dir.join("a.rs");
        let failure = no_hard_links().remove(0);
        let mut opened = 0;
        let second_fails = |inner: fs::File| {
            opened += 1;
            FailsAfter { inner, left: 4, meanwhile: (opened == 2).then(|| Box::new(|| {}) as Box<dyn FnOnce()>) }
        };
        let error = write_through(&path, b"fn a() {}\n", WriteMode::CreateNew, second_fails, move |_, _| Err(failure)).unwrap_err();
        assert!(matches!(error, FileError::Write { .. }), "{error:?}");
        let message = error.to_string();
        assert!(message.contains(&path.display().to_string()) && message.contains("no space left") && message.contains("partly written"), "{message}");
        assert_eq!(fs::read_to_string(&path).unwrap(), "fn a");
        assert_eq!(entries(&dir), ["a.rs"]);
    }

    #[test]
    fn a_create_without_hard_links_never_clobbers_a_file_that_appeared_meanwhile() {
        let dir = directory("no-links-appeared");
        for mode in [WriteMode::CreateNew, WriteMode::Replace] {
            let path = dir.join(format!("{mode:?}.rs"));
            let failure = no_hard_links().remove(0);
            let error = write_through(&path, b"fn ours() {}\n", mode, |file| file, move |_, target| {
                fs::write(target, "fn theirs() {}\n")?;
                Err(failure)
            })
            .unwrap_err();
            assert!(matches!((mode, &error), (WriteMode::CreateNew, FileError::Exists { .. }) | (WriteMode::Replace, FileError::Write { .. })), "{error:?}");
            assert_eq!(fs::read_to_string(&path).unwrap(), "fn theirs() {}\n");
        }
        assert_eq!(entries(&dir), ["CreateNew.rs", "Replace.rs"]);
    }

    #[test]
    fn a_link_that_fails_otherwise_creates_nothing() {
        let dir = directory("link-failed");
        let path = dir.join("a.rs");
        let error = write_through(&path, b"fn a() {}\n", WriteMode::CreateNew, |file| file, |_, _| Err(io::ErrorKind::StorageFull.into())).unwrap_err();
        assert!(error.to_string().contains("nothing was created"), "{error}");
        assert_eq!(entries(&dir), Vec::<String>::new());
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
