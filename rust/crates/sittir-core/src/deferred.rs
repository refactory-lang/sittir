//! A decode or an encode that crosses napi calls napi at every node, so it
//! cannot continue on a grown segment (`stack::low`). Where the stack runs
//! low it defers the rest of a subtree instead, and the outermost decode or
//! encode finishes each deferred subtree from the top of the stack, where
//! that subtree may defer again. A tree that never reaches the red zone
//! defers nothing and pays one flag read per slot or struct.
//!
//! A decode defers a slot: it leaves a placeholder coordinate in the slot,
//! and once every deferred slot is decoded the outermost decode fills them
//! in (`Fill`). An encode defers a struct: it returns an empty object, which
//! the outermost encode defines the struct's fields on.

use std::any::Any;
use std::cell::RefCell;
use std::ffi::CStr;

use ::napi::sys::{napi_env, napi_value};

use crate::slot::NodeCoordinate;
use crate::types::{NodeIndex, Span, TreeId};

/// The tree a deferred slot's placeholder names: past `MAX_TREE_ID`, so no
/// live tree has it.
const DEFERRED_TREE: TreeId = TreeId(u32::MAX);

/// Decodes a deferred slot's value into the slot.
pub type DecodeLater = unsafe fn(napi_env, napi_value) -> ::napi::Result<Box<dyn Any>>;

type EncodeLater = Box<dyn FnOnce(napi_env, napi_value) -> ::napi::Result<()>>;

/// A struct's fields as `boundary::object_with_present` defines them.
pub type Fields<const N: usize> = [Option<(&'static CStr, napi_value)>; N];

#[derive(Default)]
struct Pending {
    decoding: bool,
    decodes: Vec<(napi_value, DecodeLater)>,
    encoding: bool,
    encodes: Vec<(napi_value, EncodeLater)>,
}

thread_local! {
    static PENDING: RefCell<Pending> = RefCell::new(Pending::default());
}

/// The outermost decode or encode on this thread, while it runs: the work
/// it left is dropped with it, so a refusal leaves none for the next one.
struct Outermost {
    decode: bool,
}

impl Outermost {
    fn begin(decode: bool) -> Self {
        PENDING.with(|pending| {
            let mut pending = pending.borrow_mut();
            if decode {
                pending.decoding = true;
            } else {
                pending.encoding = true;
            }
        });
        Self { decode }
    }
}

impl Drop for Outermost {
    fn drop(&mut self) {
        let left = PENDING.with(|pending| {
            let mut pending = pending.borrow_mut();
            if self.decode {
                pending.decoding = false;
                pending.decodes.clear();
                Vec::new()
            } else {
                pending.encoding = false;
                std::mem::take(&mut pending.encodes)
            }
        });
        drop(left);
    }
}

/// The values the deferred slots of one outermost decode took, by the
/// index each placeholder names.
pub struct Filled(Vec<Option<Box<dyn Any>>>);

impl Filled {
    /// The value the deferred slot `at` decoded to, taken.
    ///
    /// # Errors
    /// When no value of type `S` waits at `at`.
    pub fn take<S: 'static>(&mut self, at: usize) -> ::napi::Result<S> {
        self.0
            .get_mut(at)
            .and_then(Option::take)
            .and_then(|value| value.downcast::<S>().ok())
            .map(|value| *value)
            .ok_or_else(|| ::napi::Error::from_reason(format!("deferred slot {at} has no decoded value of its type")))
    }
}

/// Node data a decode may have left deferred slots in: each fills its
/// slots' placeholders from `filled`, then its slots' nodes fill theirs.
pub trait Fill {
    /// # Errors
    /// When a placeholder's value is missing, which a decode never leaves.
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()>;
}

/// The deferred slot a placeholder coordinate stands for.
#[must_use]
pub fn deferred_at(coord: &NodeCoordinate) -> Option<usize> {
    (coord.tree == DEFERRED_TREE).then_some(coord.index.0 as usize)
}

fn placeholder(at: usize) -> ::napi::Result<NodeCoordinate> {
    let index = u32::try_from(at).map(NodeIndex).map_err(|_| ::napi::Error::from_reason("a decode deferred more slots than a placeholder can count"))?;
    Ok(NodeCoordinate::new(DEFERRED_TREE, index, index, Span { start: 0, end: 0 }))
}

/// A slot decoded by `decode`. Inside an outermost decode, with the stack
/// low, the slot is deferred: `later` decodes it once the outermost decode
/// gets back to it, and the placeholder coordinate returned stands for it
/// until then.
///
/// # Safety
/// `value` must be live in `env`, and the call must come from napi on the
/// thread's own stack.
pub unsafe fn decode_slot<S: Fill + 'static>(
    env: napi_env,
    value: napi_value,
    decode: unsafe fn(napi_env, napi_value) -> ::napi::Result<S>,
    later: DecodeLater,
    deferred: impl FnOnce(NodeCoordinate) -> S,
) -> ::napi::Result<S> {
    if PENDING.with(|pending| pending.borrow().decoding) {
        if !crate::stack::low() {
            // SAFETY: this fn requires `value` to be live in `env`.
            return unsafe { decode(env, value) };
        }
        let at = PENDING.with(|pending| {
            let mut pending = pending.borrow_mut();
            pending.decodes.push((value, later));
            pending.decodes.len() - 1
        });
        return Ok(deferred(placeholder(at)?));
    }
    let _outermost = Outermost::begin(true);
    // SAFETY: this fn requires `value` to be live in `env`.
    let mut slot = unsafe { decode(env, value)? };
    let mut done = Vec::new();
    while let Some((value, later)) = PENDING.with(|pending| pending.borrow().decodes.get(done.len()).copied()) {
        // SAFETY: a deferred value was live in `env` when it was deferred, within this same call.
        done.push(Some(unsafe { later(env, value)? }));
    }
    if !done.is_empty() {
        slot.fill(&mut Filled(done))?;
    }
    Ok(slot)
}

/// A struct encoded as the object its `fields` define. Inside an outermost
/// encode, with the stack low, the struct is deferred: the empty object
/// returned takes its fields once the outermost encode gets back to it.
///
/// # Safety
/// `env` must be live, and the call must come from napi on the thread's own
/// stack.
pub unsafe fn encode_struct<S: 'static, const N: usize>(
    env: napi_env,
    value: S,
    fields: unsafe fn(napi_env, S) -> ::napi::Result<Fields<N>>,
) -> ::napi::Result<napi_value> {
    if PENDING.with(|pending| pending.borrow().encoding) {
        if !crate::stack::low() {
            // SAFETY: this fn requires `env` to be live.
            return unsafe { crate::boundary::object_with_present(env, &fields(env, value)?) };
        }
        // SAFETY: this fn requires `env` to be live.
        let object = unsafe { crate::boundary::object_with(env, &[])? };
        let later: EncodeLater = Box::new(move |env, object| {
            // SAFETY: the outermost encode calls this in the same call, with `env` live and `object` created in it.
            unsafe { crate::boundary::define_present(env, object, &fields(env, value)?) }
        });
        PENDING.with(|pending| pending.borrow_mut().encodes.push((object, later)));
        return Ok(object);
    }
    let _outermost = Outermost::begin(false);
    // SAFETY: this fn requires `env` to be live.
    let object = unsafe { crate::boundary::object_with_present(env, &fields(env, value)?)? };
    while let Some((object, later)) = PENDING.with(|pending| pending.borrow_mut().encodes.pop()) {
        later(env, object)?;
    }
    Ok(object)
}

impl<T: Fill + ?Sized> Fill for Box<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        (**self).fill(filled)
    }
}

impl<T: Fill> Fill for Option<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        self.as_mut().map_or(Ok(()), |value| value.fill(filled))
    }
}

impl<T: Fill> Fill for Vec<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        self.iter_mut().try_for_each(|item| item.fill(filled))
    }
}

impl<T: Fill> Fill for crate::NonEmptyVec<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        self.iter_mut().try_for_each(|item| item.fill(filled))
    }
}

impl<T: Fill + 'static> Fill for crate::layout::NodeLayout<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        self.trivia.fill(filled)?;
        self.units.iter_mut().try_for_each(|unit| unit.trivia.fill(filled))
    }
}

impl<T: Fill + 'static> Fill for crate::trivia::NodeTrivia<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        self.leading.fill(filled)?;
        self.trailing.fill(filled)?;
        self.inner.fill(filled)
    }
}

impl<T: Fill + 'static> Fill for crate::trivia::TriviaEntry<T> {
    fn fill(&mut self, filled: &mut Filled) -> ::napi::Result<()> {
        self.value.fill(filled)
    }
}

/// Node data that holds no slot.
macro_rules! holds_no_slot {
    ($($ty:ty),* $(,)?) => {
        $(impl Fill for $ty {
            fn fill(&mut self, _: &mut Filled) -> ::napi::Result<()> {
                Ok(())
            }
        })*
    };
}

holds_no_slot!(crate::trivia::TriviaText, crate::verbatim::VerbatimNode);
