use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::{OnceCell, RefCell};
use std::collections::HashMap;
use std::ffi::c_void;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, LazyLock};
use std::time::Instant;

use napi::bindgen_prelude::{FromNapiValue, ObjectFinalize};
use napi::{Env, Error, JsValue, Result, Status, Unknown, UnknownRef};
use napi_derive::napi;
use sittir_core::arena::{
    admit, Address, ArenaRead, BorrowedArena, Cell, CellAt, HeldArenas, RecordCells, StringRef,
};
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::render::SourceTable;
use sittir_core::trivia_store::TriviaStore;
use sittir_core::types::{KindId, TreeId};
use sittir_rust::render::node::{self, AnyNode, RenderRoot};

static ALLOCS: AtomicU64 = AtomicU64::new(0);
static ALLOCATED: AtomicU64 = AtomicU64::new(0);
static FREES: AtomicU64 = AtomicU64::new(0);
static FREED: AtomicU64 = AtomicU64::new(0);
static HELD_REFS: AtomicU64 = AtomicU64::new(0);
static REGISTRATIONS: AtomicU64 = AtomicU64::new(0);
static CHUNK_READS: AtomicU64 = AtomicU64::new(0);

struct Counted;

// SAFETY: every allocation is forwarded unchanged to the system allocator;
// counters neither retain pointers nor change ownership or synchronization.
unsafe impl GlobalAlloc for Counted {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        // SAFETY: the caller supplies GlobalAlloc's valid layout.
        let ptr = unsafe { System.alloc(layout) };
        if !ptr.is_null() {
            ALLOCS.fetch_add(1, Ordering::Relaxed);
            ALLOCATED.fetch_add(layout.size() as u64, Ordering::Relaxed);
        }
        ptr
    }

    unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
        // SAFETY: the caller supplies GlobalAlloc's valid layout.
        let ptr = unsafe { System.alloc_zeroed(layout) };
        if !ptr.is_null() {
            ALLOCS.fetch_add(1, Ordering::Relaxed);
            ALLOCATED.fetch_add(layout.size() as u64, Ordering::Relaxed);
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        FREES.fetch_add(1, Ordering::Relaxed);
        FREED.fetch_add(layout.size() as u64, Ordering::Relaxed);
        // SAFETY: the pointer and layout are exactly the caller's allocation.
        unsafe { System.dealloc(ptr, layout) };
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, size: usize) -> *mut u8 {
        // SAFETY: the caller supplies GlobalAlloc's valid pointer and layouts.
        let next = unsafe { System.realloc(ptr, layout, size) };
        if !next.is_null() {
            ALLOCS.fetch_add(1, Ordering::Relaxed);
            ALLOCATED.fetch_add(size as u64, Ordering::Relaxed);
            FREES.fetch_add(1, Ordering::Relaxed);
            FREED.fetch_add(layout.size() as u64, Ordering::Relaxed);
        }
        next
    }
}

#[global_allocator]
static ALLOCATOR: Counted = Counted;
static OPTIONS: LazyLock<ResolvedOptions> = LazyLock::new(sittir_rust::render::options::defaults);

struct NoSources;

impl SourceTable for NoSources {
    fn source_of(&self, _tree: TreeId) -> Option<&Arc<str>> {
        None
    }
}

#[napi(object)]
pub struct RenderSample {
    pub text: String,
    pub native_ns: f64,
    pub allocation_calls: f64,
    pub allocated_bytes: f64,
    pub deallocation_calls: f64,
    pub deallocated_bytes: f64,
}

#[napi(object)]
pub struct AllocationTotals {
    pub calls: f64,
    pub bytes: f64,
    pub frees: f64,
    pub freed_bytes: f64,
}

#[napi]
pub fn allocator_totals() -> AllocationTotals {
    AllocationTotals {
        calls: ALLOCS.load(Ordering::Relaxed) as f64,
        bytes: ALLOCATED.load(Ordering::Relaxed) as f64,
        frees: FREES.load(Ordering::Relaxed) as f64,
        freed_bytes: FREED.load(Ordering::Relaxed) as f64,
    }
}

fn measured(run: impl FnOnce() -> Result<String>) -> Result<RenderSample> {
    LazyLock::force(&OPTIONS);
    let before = [
        ALLOCS.load(Ordering::Relaxed),
        ALLOCATED.load(Ordering::Relaxed),
        FREES.load(Ordering::Relaxed),
        FREED.load(Ordering::Relaxed),
    ];
    let start = Instant::now();
    let text = run()?;
    let native_ns = start.elapsed().as_nanos() as f64;
    let after = [
        ALLOCS.load(Ordering::Relaxed),
        ALLOCATED.load(Ordering::Relaxed),
        FREES.load(Ordering::Relaxed),
        FREED.load(Ordering::Relaxed),
    ];
    Ok(RenderSample {
        text,
        native_ns,
        allocation_calls: (after[0] - before[0]) as f64,
        allocated_bytes: (after[1] - before[1]) as f64,
        deallocation_calls: (after[2] - before[2]) as f64,
        deallocated_bytes: (after[3] - before[3]) as f64,
    })
}

trait Element {
    const TYPE: napi::sys::napi_typedarray_type;
}

impl Element for u32 {
    const TYPE: napi::sys::napi_typedarray_type = napi::sys::TypedarrayType::uint32_array;
}

impl Element for u8 {
    const TYPE: napi::sys::napi_typedarray_type = napi::sys::TypedarrayType::uint8_array;
}

fn typed_slices<'a, T: Element>(env: &'a Env, values: &[Unknown<'a>]) -> Result<Vec<&'a [T]>> {
    read_slices::<T>(env, values.iter().copied().map(Ok), false)
}

fn read_slices<'a, T: Element>(
    env: &'a Env,
    values: impl ExactSizeIterator<Item = Result<Unknown<'a>>>,
    registered: bool,
) -> Result<Vec<&'a [T]>> {
    values
        .map(|value| read_slice::<T>(env, value?, registered))
        .collect()
}

fn read_slice<'a, T: Element>(
    env: &'a Env,
    value: Unknown<'a>,
    registered: bool,
) -> Result<&'a [T]> {
    // Registration retains exact typed arrays; only their live spans may change.
    if registered {
        CHUNK_READS.fetch_add(1, Ordering::Relaxed);
    } else if !value.is_typedarray()? {
        return Err(Error::new(
            Status::InvalidArg,
            "arena chunks must be typed arrays",
        ));
    }
    let mut kind = 0;
    let mut len = 0;
    let mut data: *mut c_void = std::ptr::null_mut();
    let mut buffer = std::ptr::null_mut();
    let mut offset = 0;
    // SAFETY: these inspection APIs run no JavaScript and cannot resize,
    // detach or mutate an ordinary buffer while earlier slices are live.
    napi::check_status!(unsafe {
        napi::sys::napi_get_typedarray_info(
            env.raw(),
            value.raw(),
            &mut kind,
            &mut len,
            &mut data,
            &mut buffer,
            &mut offset,
        )
    })?;
    let mut ordinary = registered;
    if !registered {
        // SAFETY: buffer is the live backing-store handle returned above.
        napi::check_status!(unsafe {
            napi::sys::napi_is_arraybuffer(env.raw(), buffer, &mut ordinary)
        })?;
    }
    if !ordinary || kind != T::TYPE {
        return Err(Error::new(
            Status::InvalidArg,
            "arena chunks require the expected typed array over an ordinary ArrayBuffer",
        ));
    }
    let bytes = len
        .checked_mul(std::mem::size_of::<T>())
        .filter(|&bytes| bytes <= isize::MAX as usize)
        .ok_or_else(|| Error::from_reason("arena chunk is too long"))?;
    if bytes != 0 && (data.is_null() || !(data as *const T).is_aligned()) {
        return Err(Error::from_reason("arena chunk has invalid alignment"));
    }
    if len == 0 {
        Ok(&[])
    } else {
        // SAFETY: Element pairs the Rust type with the checked Node-API type.
        // Live handles retain ordinary buffers, shared storage is rejected,
        // and rendering and buffer inspection cannot invoke JavaScript.
        Ok(unsafe { std::slice::from_raw_parts(data as *const T, len) })
    }
}

#[napi]
pub fn render_built(
    env: Env,
    chunks: Vec<Unknown<'_>>,
    strings: Vec<Unknown<'_>>,
    address: f64,
    text_offset: Option<f64>,
    text_len: Option<f64>,
) -> Result<RenderSample> {
    measured(|| {
        let words = typed_slices::<u32>(&env, &chunks)?;
        let bytes = typed_slices::<u8>(&env, &strings)?;
        let arena =
            BorrowedArena::new(&words, &bytes).map_err(|e| Error::from_reason(e.to_string()))?;
        render_arena(&arena, address, text_offset, text_len)
    })
}

fn render_arena(
    arena: &dyn ArenaRead,
    address: f64,
    text_offset: Option<f64>,
    text_len: Option<f64>,
) -> Result<String> {
    let at = Address(word_argument(address)?);
    if at == Address::NONE {
        return Err(Error::from_reason("a built root must name a record"));
    }
    admit(arena, at, AnyNode::shape).map_err(|e| Error::from_reason(e.to_string()))?;
    let kind = KindId(
        u16::try_from(
            arena
                .word(at)
                .map_err(|e| Error::from_reason(e.to_string()))?,
        )
        .map_err(|_| Error::from_reason("record kind exceeds u16"))?,
    );
    let cell = match (text_offset, text_len) {
        (None, None) => Cell::Child {
            kind,
            at,
            link: None,
            changed: Default::default(),
        },
        (Some(offset), Some(len)) => Cell::BuiltLeaf {
            kind,
            text: StringRef::from_offset(word_argument(offset)?, word_argument(len)?),
            record: at,
        },
        _ => {
            return Err(Error::from_reason(
                "a leaf needs both text offset and length",
            ))
        }
    };
    let root = CellAt {
        cell,
        tree: None,
        site: None,
    };
    node::render_record(
        root,
        &mut HeldArenas::of([]),
        arena,
        &TriviaStore::new(),
        &RenderContext {
            options: &OPTIONS,
            sources: &NoSources,
        },
    )
    .map_err(|e| Error::from_reason(e.to_string()))
}

// Only JavaScript references persist here; pointers and Rust slices are per-call.
struct ChunkRefs<T> {
    values: Vec<UnknownRef>,
    element: std::marker::PhantomData<T>,
}

impl<T: Element> ChunkRefs<T> {
    fn new(env: &Env, values: &[Unknown<'_>]) -> Result<Self> {
        let mut held = Self {
            values: Vec::with_capacity(values.len()),
            element: std::marker::PhantomData,
        };
        for value in values {
            match value.create_ref() {
                Ok(reference) => {
                    HELD_REFS.fetch_add(1, Ordering::Relaxed);
                    held.values.push(reference);
                }
                Err(error) => return held.release(env).and(Err(error)),
            }
        }
        Ok(held)
    }

    fn release(&mut self, env: &Env) -> Result<()> {
        let mut failure = None;
        for value in self.values.drain(..) {
            match value.unref(env) {
                Ok(()) => {
                    HELD_REFS.fetch_sub(1, Ordering::Relaxed);
                }
                Err(error) => {
                    failure.get_or_insert(error);
                }
            }
        }
        failure.map_or(Ok(()), Err)
    }
}

#[napi(custom_finalize)]
pub struct RegisteredArena {
    chunks: Option<(ChunkRefs<u32>, ChunkRefs<u8>)>,
    word_open: Option<usize>,
    string_open: Option<usize>,
}

fn open_chunk(value: Option<f64>, count: usize) -> Result<Option<usize>> {
    value
        .map(|value| {
            let index = word_argument(value)? as usize;
            if index >= count {
                return Err(Error::from_reason(
                    "open chunk is outside the registered table",
                ));
            }
            Ok(index)
        })
        .transpose()
}

fn written_length(open: Option<usize>, len: Option<f64>) -> Result<Option<usize>> {
    match (open, len) {
        (Some(_), Some(len)) => Ok(Some(word_argument(len)? as usize)),
        (None, None | Some(0.0)) => Ok(None),
        _ => Err(Error::from_reason(
            "an open chunk requires its written length",
        )),
    }
}

type ChunkSpans<'a, T> = HashMap<u32, Option<&'a [T]>>;

struct CachedChunks<'a, T> {
    env: &'a Env,
    refs: &'a ChunkRefs<T>,
    open: Option<usize>,
    written: Option<usize>,
    first: OnceCell<(u32, Option<&'a [T]>)>,
    more: RefCell<Option<ChunkSpans<'a, T>>>,
    error: OnceCell<Error>,
}

impl<'a, T: Element> CachedChunks<'a, T> {
    fn new(
        env: &'a Env,
        refs: &'a ChunkRefs<T>,
        open: Option<usize>,
        len: Option<f64>,
    ) -> Result<Self> {
        Ok(Self {
            env,
            refs,
            open,
            written: written_length(open, len)?,
            first: OnceCell::new(),
            more: RefCell::new(None),
            error: OnceCell::new(),
        })
    }

    fn get(&self, index: u32) -> Option<&[T]> {
        let Some(&(first, slice)) = self.first.get() else {
            return self.first.get_or_init(|| (index, self.read(index))).1;
        };
        if first == index {
            return slice;
        }
        if let Some(slice) = self
            .more
            .borrow()
            .as_ref()
            .and_then(|map| map.get(&index))
            .copied()
        {
            return slice;
        }
        let slice = self.read(index);
        self.more
            .borrow_mut()
            .get_or_insert_with(HashMap::new)
            .insert(index, slice);
        slice
    }

    fn read(&self, index: u32) -> Option<&'a [T]> {
        let value = self.refs.values.get(index as usize)?;
        let slice = value
            .get_value(self.env)
            .and_then(|value| read_slice::<T>(self.env, value, true))
            .and_then(|slice| {
                if self.open == Some(index as usize) {
                    slice
                        .get(..self.written.expect("open chunk has a written length"))
                        .ok_or_else(|| {
                            Error::from_reason("written prefix exceeds the registered chunk")
                        })
                } else {
                    Ok(slice)
                }
            });
        match slice {
            Ok(slice) => Some(slice),
            Err(error) => {
                self.error.get_or_init(|| error);
                None
            }
        }
    }
}

struct RegisteredRead<'a> {
    words: CachedChunks<'a, u32>,
    strings: CachedChunks<'a, u8>,
}

impl ArenaRead for RegisteredRead<'_> {
    fn chunk(&self, index: u32) -> Option<&[u32]> {
        self.words.get(index)
    }
    fn string_chunk(&self, index: u32) -> Option<&[u8]> {
        self.strings.get(index)
    }
}

#[napi]
impl RegisteredArena {
    #[napi]
    pub fn render_record(
        &self,
        env: Env,
        address: f64,
        word_len: f64,
        string_len: f64,
    ) -> Result<RenderSample> {
        self.render(env, address, None, None, Some(word_len), Some(string_len))
    }

    #[napi]
    pub fn render(
        &self,
        env: Env,
        address: f64,
        text_offset: Option<f64>,
        text_len: Option<f64>,
        word_len: Option<f64>,
        string_len: Option<f64>,
    ) -> Result<RenderSample> {
        measured(|| {
            let (words, bytes) = self
                .chunks
                .as_ref()
                .ok_or_else(|| Error::from_reason("arena registration was released"))?;
            let arena = RegisteredRead {
                words: CachedChunks::new(&env, words, self.word_open, word_len)?,
                strings: CachedChunks::new(&env, bytes, self.string_open, string_len)?,
            };
            let rendered = render_arena(&arena, address, text_offset, text_len);
            arena
                .words
                .error
                .into_inner()
                .or_else(|| arena.strings.error.into_inner())
                .map_or(rendered, Err)
        })
    }

    #[napi]
    pub fn dispose(&mut self, env: Env) -> Result<()> {
        let Some((mut words, mut bytes)) = self.chunks.take() else {
            return Ok(());
        };
        let words_result = words.release(&env);
        let bytes_result = bytes.release(&env);
        words_result.and(bytes_result)
    }
}

impl ObjectFinalize for RegisteredArena {
    fn finalize(mut self, env: Env) -> Result<()> {
        self.dispose(env)
    }
}

#[napi]
pub fn register_arena(
    env: Env,
    chunks: Vec<Unknown<'_>>,
    strings: Vec<Unknown<'_>>,
    word_open: Option<f64>,
    string_open: Option<f64>,
) -> Result<RegisteredArena> {
    let word_open = open_chunk(word_open, chunks.len())?;
    let string_open = open_chunk(string_open, strings.len())?;
    let words = typed_slices::<u32>(&env, &chunks)?;
    let bytes = typed_slices::<u8>(&env, &strings)?;
    BorrowedArena::new(&words, &bytes).map_err(|error| Error::from_reason(error.to_string()))?;
    drop((words, bytes));
    let mut words = ChunkRefs::new(&env, &chunks)?;
    let bytes = match ChunkRefs::new(&env, &strings) {
        Ok(bytes) => bytes,
        Err(error) => return words.release(&env).and(Err(error)),
    };
    REGISTRATIONS.fetch_add(1, Ordering::Relaxed);
    Ok(RegisteredArena {
        chunks: Some((words, bytes)),
        word_open,
        string_open,
    })
}

#[napi]
pub fn held_arena_references() -> f64 {
    HELD_REFS.load(Ordering::Relaxed) as f64
}

#[napi]
pub fn arena_registration_count() -> f64 {
    REGISTRATIONS.load(Ordering::Relaxed) as f64
}

#[napi]
pub fn arena_chunk_read_count() -> f64 {
    CHUNK_READS.load(Ordering::Relaxed) as f64
}

fn word_argument(value: f64) -> Result<u32> {
    if !value.is_finite() || !(0.0..=f64::from(u32::MAX)).contains(&value) || value.fract() != 0.0 {
        return Err(Error::new(
            Status::InvalidArg,
            "an arena word must be an exact u32",
        ));
    }
    Ok(value as u32)
}

#[napi]
pub fn render_object(root: Unknown<'_>) -> Result<RenderSample> {
    measured(|| {
        let node = RenderRoot::from_unknown(root)?;
        node::render_node_parts(
            node,
            &RenderContext {
                options: &OPTIONS,
                sources: &NoSources,
            },
            None,
        )
        .map(|(_, text)| text)
        .map_err(|e| Error::from_reason(e.to_string()))
    })
}
