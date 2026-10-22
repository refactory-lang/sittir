use std::alloc::{GlobalAlloc, Layout, System};
use std::ffi::c_void;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, LazyLock};
use std::time::Instant;

use napi::bindgen_prelude::FromNapiValue;
use napi::{Env, Error, JsValue, Result, Status, Unknown};
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

fn typed_slices<'a, T: Element>(env: &Env, values: &'a [Unknown<'_>]) -> Result<Vec<&'a [T]>> {
    let mut spans = Vec::with_capacity(values.len());
    for value in values {
        if !value.is_typedarray()? {
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
        // SAFETY: all handles belong to this live synchronous call. These
        // inspection APIs run no JavaScript and do not expose a Rust borrow.
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
        let mut ordinary = false;
        // SAFETY: buffer is the live backing-store handle returned above.
        napi::check_status!(unsafe {
            napi::sys::napi_is_arraybuffer(env.raw(), buffer, &mut ordinary)
        })?;
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
        spans.push((data as *const T, len));
    }
    Ok(spans
        .into_iter()
        .map(|(data, len)| {
            if len == 0 {
                &[][..]
            } else {
                // SAFETY: Element pairs the Rust type with the checked Node-API
                // type. Handles retain the ordinary buffers for this call, no
                // shared backing store is accepted, and rendering runs no JS.
                unsafe { std::slice::from_raw_parts(data, len) }
            }
        })
        .collect())
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
        let at = Address(word_argument(address)?);
        if at == Address::NONE {
            return Err(Error::from_reason("a built root must name a record"));
        }
        admit(&arena, at, AnyNode::shape).map_err(|e| Error::from_reason(e.to_string()))?;
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
            &arena,
            &TriviaStore::new(),
            &RenderContext {
                options: &OPTIONS,
                sources: &NoSources,
            },
        )
        .map_err(|e| Error::from_reason(e.to_string()))
    })
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
