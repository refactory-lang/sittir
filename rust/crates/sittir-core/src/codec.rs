//! A node tree's wire codec and its drop, each one loop over a stack.
//!
//! A tree decodes from JavaScript and encodes to it frame by frame: a frame is
//! a node struct partly done, and the loop runs the top frame until it
//! finishes or waits on a child it pushed. Every napi call a tree makes runs
//! in that loop, at the entry's stack depth whatever the tree's. A tree is
//! dropped the same way (`release`): each node is taken apart one level and
//! its child nodes pushed, so no drop recurses.
//!
//! The values a node holds (`Box`, `Option`, `Vec`, a choice, `SlotValue`)
//! decode and encode in the frame of the struct that holds them: their
//! nesting is their type's, not the tree's. Only a struct with a child slot
//! has a frame. Codegen lists a grammar's nodes once (`grammar_nodes!`),
//! which gives each its arm of the grammar's frame and whole types, so a node
//! missing from the list fails to compile.

use crate::non_empty::NonEmptyVec;
use crate::slot::SlotValue;

/// A grammar's node set, which `grammar_nodes!` states once on the
/// grammar's trivia type.
pub trait Nodes: Sized + 'static {
    /// Any node of the grammar, whole.
    type Whole: Whole<Self>;
}

/// Any node of grammar `W`, whole.
pub trait Whole<W: Nodes> {
    /// Moves the nodes this node holds into `out` and drops the rest.
    fn take_apart(self, out: &mut Vec<W::Whole>);
}

/// A node of grammar `W` as the list states it: its arm of `W::Whole`.
/// `grammar_nodes!` implements it, and nothing else does.
pub trait Listed<W: Nodes>: Sized {
    fn whole(self) -> W::Whole;
    /// The node `whole` holds. A frame is only handed the node it waits on,
    /// so another node is a bug in the driver.
    fn of(whole: W::Whole) -> Self;
}

/// A node's own parts.
pub trait Parts<W: Nodes> {
    /// Moves the nodes this node's fields hold into `out` and drops the rest.
    fn parts(self, out: &mut Vec<W::Whole>);
}

/// A value that may hold nodes of grammar `W`.
pub trait Dismantle<W: Nodes> {
    /// Moves the nodes this value holds into `out` and drops the rest.
    fn dismantle(self, out: &mut Vec<W::Whole>);
}

/// Drops `value` a level at a time, its nodes on a stack.
pub fn release<W: Nodes, T: Dismantle<W>>(value: T) {
    let mut out = Vec::new();
    value.dismantle(&mut out);
    while let Some(whole) = out.pop() {
        whole.take_apart(&mut out);
    }
}

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for Box<T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        (*self).dismantle(out);
    }
}

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for Option<T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        if let Some(value) = self {
            value.dismantle(out);
        }
    }
}

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for Vec<T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        for item in self {
            item.dismantle(out);
        }
    }
}

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for NonEmptyVec<T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        Vec::from(self).dismantle(out);
    }
}

impl<W: Nodes, T: Dismantle<W>, const ADJACENT: bool> Dismantle<W> for SlotValue<T, ADJACENT> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        if let SlotValue::Node(node) = self {
            node.dismantle(out);
        }
    }
}

impl<W: Nodes> Dismantle<W> for () {
    fn dismantle(self, _: &mut Vec<W::Whole>) {}
}

impl<W: Nodes> Dismantle<W> for core::convert::Infallible {
    fn dismantle(self, _: &mut Vec<W::Whole>) {
        match self {}
    }
}

impl<W: Nodes, A: Dismantle<W>, B: Dismantle<W>> Dismantle<W> for (A, B) {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        self.0.dismantle(out);
        self.1.dismantle(out);
    }
}

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for std::vec::IntoIter<T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        for item in self {
            item.dismantle(out);
        }
    }
}

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for std::vec::Drain<'_, T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        for item in self {
            item.dismantle(out);
        }
    }
}

/// The most of a spare stack's capacity a pool keeps, in bytes.
pub const KEPT_STACK_BYTES: usize = 64 * 1024;

/// The frame stack a loop keeps on a thread between its runs, so a run
/// allocates only when it outgrows the spare or runs inside another run.
pub struct StackPool<F> {
    spare: core::cell::Cell<Vec<F>>,
}

impl<F> StackPool<F> {
    #[must_use]
    pub const fn new() -> Self {
        Self { spare: core::cell::Cell::new(Vec::new()) }
    }

    /// The spare stack, empty: a new one while another run holds it.
    pub fn take(&self) -> Vec<F> {
        self.spare.take()
    }

    /// Keeps `stack`, emptied and cut back to `KEPT_STACK_BYTES`, as the
    /// spare, unless the spare it holds already is larger.
    pub fn give(&self, mut stack: Vec<F>) {
        stack.clear();
        stack.shrink_to(KEPT_STACK_BYTES / core::mem::size_of::<F>().max(1));
        let spare = self.spare.take();
        self.spare.set(if spare.capacity() > stack.capacity() { spare } else { stack });
    }
}

impl<F> Default for StackPool<F> {
    fn default() -> Self {
        Self::new()
    }
}

/// A list whose items may each be absent, encoded as a JavaScript array
/// whose absent items are `undefined` (`boundary::holes`); it decodes as the
/// `Vec` it wraps.
pub struct Holes<T>(pub Vec<Option<T>>);

impl<W: Nodes, T: Dismantle<W>> Dismantle<W> for Holes<T> {
    fn dismantle(self, out: &mut Vec<W::Whole>) {
        self.0.dismantle(out);
    }
}

/// A value that holds no node: its codec is its napi one, and it drops in
/// place.
#[doc(hidden)]
#[macro_export]
macro_rules! nodeless_codec {
    ($($ty:ty),* $(,)?) => {
        $(
            impl<W: $crate::codec::Nodes> $crate::codec::Dismantle<W> for $ty {
                fn dismantle(self, _: &mut ::std::vec::Vec<W::Whole>) {}
            }
            impl<W: $crate::codec::Nodes> $crate::codec::Parts<W> for $ty {
                fn parts(self, _: &mut ::std::vec::Vec<W::Whole>) {}
            }
            $crate::napi_codec! {
                impl<W: $crate::codec::Frames> $crate::codec::Codec<W> for $ty {
                    type DecodeWait = ::core::convert::Infallible;
                    type EncodeWait = ::core::convert::Infallible;
                    unsafe fn decode(env: $crate::__napi::sys::napi_env, value: $crate::__napi::sys::napi_value, _: &mut ::core::option::Option<W::DecodeFrame>) -> $crate::__napi::Result<$crate::codec::Begun<Self, Self::DecodeWait>> {
                        // SAFETY: this fn requires `value` to be live in `env`.
                        unsafe { <Self as $crate::__napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, value) }.map($crate::codec::Begun::Whole)
                    }
                    unsafe fn decoded(_: $crate::__napi::sys::napi_env, wait: Self::DecodeWait, _: W::Whole, _: &mut ::core::option::Option<W::DecodeFrame>) -> $crate::__napi::Result<$crate::codec::Begun<Self, Self::DecodeWait>> {
                        match wait {}
                    }
                    unsafe fn encode(self, env: $crate::__napi::sys::napi_env, _: &mut ::core::option::Option<W::EncodeFrame>) -> $crate::__napi::Result<$crate::codec::Begun<$crate::__napi::sys::napi_value, Self::EncodeWait>> {
                        // SAFETY: this fn requires a live `env`.
                        unsafe { <Self as $crate::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, self) }.map($crate::codec::Begun::Whole)
                    }
                    unsafe fn encoded(_: $crate::__napi::sys::napi_env, wait: Self::EncodeWait, _: $crate::__napi::sys::napi_value, _: &mut ::core::option::Option<W::EncodeFrame>) -> $crate::__napi::Result<$crate::codec::Begun<$crate::__napi::sys::napi_value, Self::EncodeWait>> {
                        match wait {}
                    }
                }
            }
        )*
    };
}

nodeless_codec!(crate::verbatim::VerbatimNode, crate::trivia::TriviaText);

/// The steps of a node with no frame: one with no child slot, decoded and
/// encoded whole where it is held.
#[doc(hidden)]
#[macro_export]
macro_rules! nodeless_steps {
    ($node:ty; $grammar:ty) => {
        impl $crate::codec::Steps<$grammar> for $node {
            type Decoding = ::core::convert::Infallible;
            type Encoding = ::core::convert::Infallible;
            unsafe fn decode_step(
                frame: &mut Self::Decoding,
                _: $crate::__napi::sys::napi_env,
                _: ::core::option::Option<<$grammar as $crate::codec::Nodes>::Whole>,
                _: &mut ::core::option::Option<<$grammar as $crate::codec::Frames>::DecodeFrame>,
            ) -> $crate::__napi::Result<$crate::codec::Begun<<$grammar as $crate::codec::Nodes>::Whole, ()>> {
                match *frame {}
            }
            fn decode_refusal(frame: &Self::Decoding, _: $crate::__napi::Error) -> $crate::__napi::Error {
                match *frame {}
            }
            unsafe fn encode_step(
                frame: &mut Self::Encoding,
                _: $crate::__napi::sys::napi_env,
                _: ::core::option::Option<$crate::__napi::sys::napi_value>,
                _: &mut ::core::option::Option<<$grammar as $crate::codec::Frames>::EncodeFrame>,
            ) -> $crate::__napi::Result<$crate::codec::Begun<$crate::__napi::sys::napi_value, ()>> {
                match *frame {}
            }
        }
    };
}

/// States a grammar's node set once: each listed node's trivia type
/// (`HasTrivia`), and its arm of the grammar's whole type and, with the napi
/// bindings, of its frame types. The derive reaches a node's grammar
/// through its trivia type, so a node the list leaves out fails to compile.
#[macro_export]
macro_rules! grammar_nodes {
    ($trivia:ident; $($node:ident),* $(,)?) => {
        $(impl $crate::trivia::HasTrivia for $node {
            type Trivia = $trivia;
        })*

        #[doc(hidden)]
        #[allow(clippy::large_enum_variant, reason = "a node is held whole only while the driver hands it down or takes it apart")]
        #[allow(private_interfaces, reason = "a test grammar's nodes are private to its module")]
        pub enum __Whole {
            $($node($node),)*
        }

        impl $crate::codec::Nodes for $trivia {
            type Whole = __Whole;
        }

        impl $crate::codec::Whole<$trivia> for __Whole {
            fn take_apart(self, out: &mut ::std::vec::Vec<__Whole>) {
                match self {
                    $(Self::$node(node) => $crate::codec::Parts::<$trivia>::parts(node, out),)*
                }
            }
        }

        $(impl $crate::codec::Listed<$trivia> for $node {
            fn whole(self) -> __Whole {
                __Whole::$node(self)
            }
            #[allow(unreachable_patterns, reason = "a grammar of one node has no other arm")]
            fn of(whole: __Whole) -> Self {
                match whole {
                    __Whole::$node(node) => node,
                    _ => ::core::unreachable!(concat!("a frame waiting on ", stringify!($node), " was handed another node")),
                }
            }
        })*

        $crate::napi_codec! {
            #[doc(hidden)]
            #[allow(private_interfaces, reason = "a test grammar's nodes are private to its module")]
            pub enum __DecodeFrame {
                $($node(<$node as $crate::codec::Steps<$trivia>>::Decoding),)*
            }

            #[doc(hidden)]
            #[allow(private_interfaces, reason = "a test grammar's nodes are private to its module")]
            pub enum __EncodeFrame {
                $($node(<$node as $crate::codec::Steps<$trivia>>::Encoding),)*
            }

            impl $crate::codec::Frames for $trivia {
                type DecodeFrame = __DecodeFrame;
                type EncodeFrame = __EncodeFrame;
                fn pools() -> &'static ::std::thread::LocalKey<$crate::codec::Pools<Self>> {
                    ::std::thread_local! {
                        static POOLS: $crate::codec::Pools<$trivia> = const { $crate::codec::Pools::new() };
                    }
                    &POOLS
                }
            }

            impl $crate::codec::DecodeStep<$trivia> for __DecodeFrame {
                unsafe fn step(
                    &mut self,
                    env: $crate::__napi::sys::napi_env,
                    child: ::core::option::Option<__Whole>,
                    above: &mut ::core::option::Option<Self>,
                ) -> $crate::__napi::Result<$crate::codec::Begun<__Whole, ()>> {
                    match self {
                        // SAFETY: this fn's caller passes a live `env`.
                        $(Self::$node(frame) => unsafe { <$node as $crate::codec::Steps<$trivia>>::decode_step(frame, env, child, above) },)*
                    }
                }
                fn refusal(&self, err: $crate::__napi::Error) -> $crate::__napi::Error {
                    match self {
                        $(Self::$node(frame) => <$node as $crate::codec::Steps<$trivia>>::decode_refusal(frame, err),)*
                    }
                }
            }

            impl $crate::codec::EncodeStep<$trivia> for __EncodeFrame {
                unsafe fn step(
                    &mut self,
                    env: $crate::__napi::sys::napi_env,
                    child: ::core::option::Option<$crate::__napi::sys::napi_value>,
                    above: &mut ::core::option::Option<Self>,
                ) -> $crate::__napi::Result<$crate::codec::Begun<$crate::__napi::sys::napi_value, ()>> {
                    match self {
                        // SAFETY: this fn's caller passes a live `env`.
                        $(Self::$node(frame) => unsafe { <$node as $crate::codec::Steps<$trivia>>::encode_step(frame, env, child, above) },)*
                    }
                }
            }

            impl $crate::codec::Dismantle<$trivia> for __DecodeFrame {
                fn dismantle(self, out: &mut ::std::vec::Vec<__Whole>) {
                    match self {
                        $(Self::$node(frame) => $crate::codec::Dismantle::<$trivia>::dismantle(frame, out),)*
                    }
                }
            }

            impl $crate::codec::Dismantle<$trivia> for __EncodeFrame {
                fn dismantle(self, out: &mut ::std::vec::Vec<__Whole>) {
                    match self {
                        $(Self::$node(frame) => $crate::codec::Dismantle::<$trivia>::dismantle(frame, out),)*
                    }
                }
            }

            $(impl $crate::codec::Framed<$trivia> for $node {
                fn decoding(frame: <Self as $crate::codec::Steps<$trivia>>::Decoding) -> __DecodeFrame {
                    __DecodeFrame::$node(frame)
                }
                fn encoding(frame: <Self as $crate::codec::Steps<$trivia>>::Encoding) -> __EncodeFrame {
                    __EncodeFrame::$node(frame)
                }
            })*
        }
    };
}

#[cfg(feature = "napi-bindings")]
pub use wire::*;

#[cfg(feature = "napi-bindings")]
mod wire {
    use super::{release, Dismantle, Holes, Nodes, StackPool};
    use crate::non_empty::NonEmptyVec;
    use crate::slot::SlotValue;
    use ::napi::sys::{napi_env, napi_value};
    use ::napi::{Error, Result};

    /// A grammar's frames.
    pub trait Frames: Nodes {
        /// Any node struct of the grammar, partly decoded.
        type DecodeFrame: DecodeStep<Self> + Dismantle<Self>;
        /// Any node struct of the grammar, partly encoded.
        type EncodeFrame: EncodeStep<Self> + Dismantle<Self>;
        /// The grammar's frame stacks on this thread.
        fn pools() -> &'static ::std::thread::LocalKey<Pools<Self>>;
    }

    /// A grammar's frame stacks on one thread: one pool for each loop.
    pub struct Pools<W: Frames> {
        decode: StackPool<W::DecodeFrame>,
        encode: StackPool<W::EncodeFrame>,
    }

    impl<W: Frames> Pools<W> {
        #[must_use]
        pub const fn new() -> Self {
            Self { decode: StackPool::new(), encode: StackPool::new() }
        }

        fn decoding(&self) -> &StackPool<W::DecodeFrame> {
            &self.decode
        }

        fn encoding(&self) -> &StackPool<W::EncodeFrame> {
            &self.encode
        }
    }

    impl<W: Frames> Default for Pools<W> {
        fn default() -> Self {
            Self::new()
        }
    }

    /// A frame stack its grammar's pool lends one run, given back however
    /// the run ends, with any frame left on it released first.
    struct Lent<W: Frames, F: Dismantle<W> + 'static> {
        stack: Vec<F>,
        pool: fn(&Pools<W>) -> &StackPool<F>,
    }

    impl<W: Frames, F: Dismantle<W> + 'static> Lent<W, F> {
        fn from(pool: fn(&Pools<W>) -> &StackPool<F>) -> Self {
            Self { stack: W::pools().try_with(|pools| pool(pools).take()).unwrap_or_default(), pool }
        }
    }

    impl<W: Frames, F: Dismantle<W> + 'static> Drop for Lent<W, F> {
        fn drop(&mut self) {
            release::<W, _>(self.stack.drain(..));
            let stack = ::std::mem::take(&mut self.stack);
            let pool = self.pool;
            // A thread that is ending has dropped its pools: the stack is freed with the lease.
            let _ = W::pools().try_with(|pools| pool(pools).give(stack));
        }
    }

    impl<W: Frames, F: Dismantle<W> + 'static> ::std::ops::Deref for Lent<W, F> {
        type Target = Vec<F>;
        fn deref(&self) -> &Vec<F> {
            &self.stack
        }
    }

    impl<W: Frames, F: Dismantle<W> + 'static> ::std::ops::DerefMut for Lent<W, F> {
        fn deref_mut(&mut self) -> &mut Vec<F> {
            &mut self.stack
        }
    }

    /// A value done, or what it keeps while it waits on the frame it wrote
    /// above the one it is read or written in.
    pub enum Begun<T, P> {
        Whole(T),
        Waits(P),
    }

    impl<T, P> Begun<T, P> {
        fn map<U>(self, whole: impl FnOnce(T) -> U) -> Begun<U, P> {
            match self {
                Self::Whole(value) => Begun::Whole(whole(value)),
                Self::Waits(wait) => Begun::Waits(wait),
            }
        }
    }

    /// Any node struct of grammar `W`, partly decoded.
    pub trait DecodeStep<W: Frames>: Sized {
        /// Reads on from where the frame stopped, with `child`, the node of
        /// the frame above it once that frame is done. `Waits` when the frame
        /// wrote the frame of a child to `above`; `Whole`, its node, when it
        /// is done.
        ///
        /// # Safety
        /// `env` must be live, and every value the frame holds live in it.
        unsafe fn step(&mut self, env: napi_env, child: Option<W::Whole>, above: &mut Option<Self>) -> Result<Begun<W::Whole, ()>>;
        /// `err`, raised in the child this frame waits on, as the field that
        /// holds the child decorates it.
        fn refusal(&self, err: Error) -> Error;
    }

    /// Any node struct of grammar `W`, partly encoded.
    pub trait EncodeStep<W: Frames>: Sized {
        /// Writes on from where the frame stopped, with `child`, the value
        /// the frame above it wrote once that frame is done (`DecodeStep::step`).
        ///
        /// # Safety
        /// `env` must be live, and every value the frame holds live in it.
        unsafe fn step(&mut self, env: napi_env, child: Option<napi_value>, above: &mut Option<Self>) -> Result<Begun<napi_value, ()>>;
    }

    /// A node's frames: the struct partly decoded and partly encoded, each
    /// stepped by the loop. A node with no child slot has none
    /// (`Infallible`).
    pub trait Steps<W: Frames> {
        type Decoding: Dismantle<W>;
        type Encoding: Dismantle<W>;
        /// # Safety
        /// As `DecodeStep::step`.
        unsafe fn decode_step(frame: &mut Self::Decoding, env: napi_env, child: Option<W::Whole>, above: &mut Option<W::DecodeFrame>) -> Result<Begun<W::Whole, ()>>;
        fn decode_refusal(frame: &Self::Decoding, err: Error) -> Error;
        /// # Safety
        /// As `EncodeStep::step`.
        unsafe fn encode_step(frame: &mut Self::Encoding, env: napi_env, child: Option<napi_value>, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, ()>>;
    }

    /// A node's frames as the list states them: their arms of the grammar's
    /// frame types. `grammar_nodes!` implements it, and nothing else does.
    pub trait Framed<W: Frames>: Steps<W> {
        fn decoding(frame: Self::Decoding) -> W::DecodeFrame;
        fn encoding(frame: Self::Encoding) -> W::EncodeFrame;
    }

    /// A value of the grammar its trivia type names, decoded and encoded by
    /// that grammar's loop.
    pub trait WireNode: crate::trivia::HasTrivia + Codec<<Self as crate::trivia::HasTrivia>::Trivia> {}

    impl<T: crate::trivia::HasTrivia + Codec<T::Trivia>> WireNode for T {}

    /// A value the loop decodes and encodes.
    /// A value refused or left unwritten partway is released a level at a
    /// time with what it had read or had left to write, as the driver
    /// releases its frames.
    pub trait Codec<W: Frames>: Sized + Dismantle<W> {
        /// What a value partly decoded keeps while it waits.
        type DecodeWait: Dismantle<W>;
        /// What a value partly encoded keeps while it waits.
        type EncodeWait: Dismantle<W>;
        /// Decodes `value`, or starts to: `Waits` when it wrote the frame of
        /// a node it holds to `above`.
        ///
        /// # Safety
        /// `value` must be live in `env`.
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>>;
        /// Decodes on from `wait` with `child`, the node it waited on.
        ///
        /// # Safety
        /// `env` must be live, and every value `wait` holds live in it.
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>>;
        /// Encodes the value, or starts to (`decode`).
        ///
        /// # Safety
        /// `env` must be live.
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>>;
        /// Encodes on from `wait` with `child`, the value the node it waited
        /// on encoded to.
        ///
        /// # Safety
        /// `env` must be live, and every value `wait` holds live in it.
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>>;
    }

    fn written<F>(above: &mut Option<F>) -> F {
        above.take().expect("a value that waits wrote the frame it waits on")
    }

    /// Decodes `value` as `T`, frame by frame.
    ///
    /// # Safety
    /// `value` must be live in `env`.
    pub unsafe fn decode<W: Frames, T: Codec<W>>(env: napi_env, value: napi_value) -> Result<T> {
        crate::stack::assert_central("the wire decode");
        let mut above = None;
        let mut stack = None;
        // SAFETY: this fn requires `value` to be live in `env`.
        let mut begun = unsafe { T::decode(env, value, &mut above)? };
        loop {
            let wait = match begun {
                Begun::Whole(value) => return Ok(value),
                Begun::Waits(wait) => wait,
            };
            let stack = stack.get_or_insert_with(|| Lent::<W, _>::from(Pools::decoding));
            stack.push(written(&mut above));
            // SAFETY: `env` is live, and the frame was read from a value live in it.
            let child = match unsafe { run_decode::<W>(env, stack) } {
                Ok(child) => child,
                Err(err) => {
                    release::<W, _>(wait);
                    return Err(err);
                }
            };
            // SAFETY: as above.
            begun = unsafe { T::decoded(env, wait, child, &mut above)? };
        }
    }

    /// Runs the frames on `stack` until the bottom one is done; a refusal
    /// is decorated by each frame below the one that raised it.
    unsafe fn run_decode<W: Frames>(env: napi_env, stack: &mut Vec<W::DecodeFrame>) -> Result<W::Whole> {
        let mut child = None;
        let mut above = None;
        loop {
            crate::stack::assert_central("a wire decode step");
            let top = stack.last_mut().expect("the loop runs while a frame is left");
            // SAFETY: this fn's caller passes a live `env`, and each frame was read from a value live in it.
            match unsafe { top.step(env, child.take(), &mut above) } {
                Ok(Begun::Waits(())) => stack.push(written(&mut above)),
                Ok(Begun::Whole(whole)) => {
                    stack.pop();
                    if stack.is_empty() {
                        return Ok(whole);
                    }
                    child = Some(whole);
                }
                Err(err) => {
                    let below = stack.len() - 1;
                    let err = stack[..below].iter().rev().fold(err, |err, frame| frame.refusal(err));
                    release::<W, _>((stack.drain(..), above));
                    return Err(err);
                }
            }
        }
    }

    /// Encodes `value`, frame by frame.
    ///
    /// # Safety
    /// `env` must be live.
    pub unsafe fn encode<W: Frames, T: Codec<W>>(env: napi_env, value: T) -> Result<napi_value> {
        crate::stack::assert_central("the wire encode");
        let mut above = None;
        let mut stack = None;
        // SAFETY: this fn requires a live `env`.
        let mut begun = unsafe { value.encode(env, &mut above)? };
        loop {
            let wait = match begun {
                Begun::Whole(value) => return Ok(value),
                Begun::Waits(wait) => wait,
            };
            let stack = stack.get_or_insert_with(|| Lent::<W, _>::from(Pools::encoding));
            stack.push(written(&mut above));
            // SAFETY: `env` is live, and every value the frame holds was created in it.
            let child = match unsafe { run_encode::<W>(env, stack) } {
                Ok(child) => child,
                Err(err) => {
                    release::<W, _>(wait);
                    return Err(err);
                }
            };
            // SAFETY: as above.
            begun = unsafe { T::encoded(env, wait, child, &mut above)? };
        }
    }

    unsafe fn run_encode<W: Frames>(env: napi_env, stack: &mut Vec<W::EncodeFrame>) -> Result<napi_value> {
        let mut child = None;
        let mut above = None;
        loop {
            crate::stack::assert_central("a wire encode step");
            let top = stack.last_mut().expect("the loop runs while a frame is left");
            // SAFETY: this fn's caller passes a live `env`, and every value each frame holds was created in it.
            match unsafe { top.step(env, child.take(), &mut above) } {
                Ok(Begun::Waits(())) => stack.push(written(&mut above)),
                Ok(Begun::Whole(value)) => {
                    stack.pop();
                    if stack.is_empty() {
                        return Ok(value);
                    }
                    child = Some(value);
                }
                Err(err) => {
                    release::<W, _>((stack.drain(..), above));
                    return Err(err);
                }
            }
        }
    }

    impl<W: Frames, T: Codec<W>> Codec<W> for Box<T> {
        type DecodeWait = T::DecodeWait;
        type EncodeWait = T::EncodeWait;
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn requires `value` to be live in `env`.
            Ok(unsafe { T::decode(env, value, above)? }.map(Box::new))
        }
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            Ok(unsafe { T::decoded(env, wait, child, above)? }.map(Box::new))
        }
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            // SAFETY: this fn requires a live `env`.
            unsafe { (*self).encode(env, above) }
        }
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            unsafe { T::encoded(env, wait, child, above) }
        }
    }

    /// napi's `Option`: `undefined` and `null` decode as `None`, which
    /// encodes as `null`.
    impl<W: Frames, T: Codec<W>> Codec<W> for Option<T> {
        type DecodeWait = T::DecodeWait;
        type EncodeWait = T::EncodeWait;
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            let mut value_type = 0;
            ::napi::check_status!(
                // SAFETY: this fn requires `value` to be live in `env`.
                unsafe { ::napi::sys::napi_typeof(env, value, &raw mut value_type) },
                "Failed to convert napi value into rust type `Option<T>`",
            )?;
            if value_type == ::napi::sys::ValueType::napi_undefined || value_type == ::napi::sys::ValueType::napi_null {
                return Ok(Begun::Whole(None));
            }
            // SAFETY: as above.
            Ok(unsafe { T::decode(env, value, above)? }.map(Some))
        }
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            Ok(unsafe { T::decoded(env, wait, child, above)? }.map(Some))
        }
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            if let Some(value) = self {
                // SAFETY: this fn requires a live `env`.
                unsafe { value.encode(env, above) }
            } else {
                let mut null = ::std::ptr::null_mut();
                ::napi::check_status!(
                    // SAFETY: this fn requires a live `env`.
                    unsafe { ::napi::sys::napi_get_null(env, &raw mut null) },
                    "Failed to convert rust type `Option<T>` into napi value",
                )?;
                Ok(Begun::Whole(null))
            }
        }
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            unsafe { T::encoded(env, wait, child, above) }
        }
    }

    /// A value of type `T` decoded, or what it keeps while it waits.
    type Decoded<W, T> = Begun<T, <T as Codec<W>>::DecodeWait>;

    /// A list partly decoded: the array, the items read and what the next
    /// one keeps while it waits.
    pub struct ListDecoding<T, P> {
        array: napi_value,
        len: u32,
        items: Vec<T>,
        wait: P,
    }

    /// A list partly encoded: the array, the items left and what the item
    /// being written keeps while it waits.
    pub struct ListEncoding<T, P> {
        array: napi_value,
        rest: ::std::vec::IntoIter<T>,
        index: u32,
        wait: P,
    }

    impl<W: Nodes, T: Dismantle<W>, P: Dismantle<W>> Dismantle<W> for ListDecoding<T, P> {
        fn dismantle(self, out: &mut Vec<W::Whole>) {
            self.items.dismantle(out);
            self.wait.dismantle(out);
        }
    }

    impl<W: Nodes, T: Dismantle<W>, P: Dismantle<W>> Dismantle<W> for ListEncoding<T, P> {
        fn dismantle(self, out: &mut Vec<W::Whole>) {
            self.rest.dismantle(out);
            self.wait.dismantle(out);
        }
    }

    /// `result`, releasing `held` when it is a refusal.
    fn or_release<W: Nodes, T, H: Dismantle<W>>(result: Result<T>, held: H) -> Result<(T, H)> {
        match result {
            Ok(value) => Ok((value, held)),
            Err(err) => {
                release::<W, _>(held);
                Err(err)
            }
        }
    }

    /// The items of `array` from `items.len()` on, read as napi's `Vec` reads
    /// them.
    unsafe fn read_items<W: Frames, T: Codec<W>>(
        env: napi_env,
        array: napi_value,
        len: u32,
        mut items: Vec<T>,
        above: &mut Option<W::DecodeFrame>,
    ) -> Result<Decoded<W, Vec<T>>> {
        let start;
        (start, items) = or_release::<W, _, _>(u32::try_from(items.len()).map_err(|_| Error::from_reason("a list longer than an array holds")), items)?;
        for index in start..len {
            let begun;
            // SAFETY: this fn's caller passes `array` live in `env`.
            (begun, items) = or_release::<W, _, _>(unsafe { read_item::<W, T>(env, array, index, above) }, items)?;
            match begun {
                Begun::Whole(item) => items.push(item),
                Begun::Waits(wait) => return Ok(Begun::Waits(ListDecoding { array, len, items, wait })),
            }
        }
        Ok(Begun::Whole(items))
    }

    /// The item of `array` at `index`, read as napi's `Vec` reads it.
    unsafe fn read_item<W: Frames, T: Codec<W>>(env: napi_env, array: napi_value, index: u32, above: &mut Option<W::DecodeFrame>) -> Result<Decoded<W, T>> {
        let mut item = ::std::ptr::null_mut();
        ::napi::check_status!(
            // SAFETY: this fn's caller passes `array` live in `env`.
            unsafe { ::napi::sys::napi_get_element(env, array, index, &raw mut item) },
            "Failed to get element with index `{}`",
            index,
        )?;
        // SAFETY: `item` was just read from `array`, so it is live in `env`.
        unsafe { T::decode(env, item, above) }
    }

    /// A new array of `len` items, or napi's refusal as `message`.
    unsafe fn new_array(env: napi_env, len: usize, message: &str) -> Result<napi_value> {
        let mut array = ::std::ptr::null_mut();
        ::napi::check_status!(
            // SAFETY: this fn's caller passes a live `env`.
            unsafe { ::napi::sys::napi_create_array_with_length(env, len, &raw mut array) },
            "{}",
            message,
        )?;
        Ok(array)
    }

    /// The items of `rest` written to `array` from `index` on, as napi's
    /// `Vec` writes them.
    unsafe fn write_items<W: Frames, T: Codec<W>>(
        env: napi_env,
        array: napi_value,
        mut rest: ::std::vec::IntoIter<T>,
        mut index: u32,
        above: &mut Option<W::EncodeFrame>,
    ) -> Result<Begun<napi_value, ListEncoding<T, T::EncodeWait>>> {
        while let Some(item) = rest.next() {
            let begun;
            // SAFETY: this fn's caller passes a live `env`.
            (begun, rest) = or_release::<W, _, _>(unsafe { item.encode(env, above) }, rest)?;
            match begun {
                Begun::Whole(value) => {
                    // SAFETY: `array` and `value` were created in `env`.
                    ((), rest) = or_release::<W, _, _>(unsafe { set_item(env, array, index, value) }, rest)?;
                    index += 1;
                }
                Begun::Waits(wait) => return Ok(Begun::Waits(ListEncoding { array, rest, index, wait })),
            }
        }
        Ok(Begun::Whole(array))
    }

    unsafe fn set_item(env: napi_env, array: napi_value, index: u32, value: napi_value) -> Result<()> {
        ::napi::check_status!(
            // SAFETY: this fn's caller passes `array` and `value` live in `env`.
            unsafe { ::napi::sys::napi_set_element(env, array, index, value) },
            "Failed to set element with index `{}`",
            index,
        )
    }

    /// napi's `Vec`: an array, its items in order.
    impl<W: Frames, T: Codec<W>> Codec<W> for Vec<T> {
        type DecodeWait = ListDecoding<T, T::DecodeWait>;
        type EncodeWait = ListEncoding<T, T::EncodeWait>;
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn requires `value` to be live in `env`.
            let len = unsafe { <::napi::bindgen_prelude::Array as ::napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, value)? }.len();
            // SAFETY: as above.
            unsafe { read_items(env, value, len, Vec::with_capacity(len as usize), above) }
        }
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            let ListDecoding { array, len, items, wait } = wait;
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            let (begun, mut items) = or_release::<W, _, _>(unsafe { T::decoded(env, wait, child, above) }, items)?;
            match begun {
                Begun::Whole(item) => items.push(item),
                Begun::Waits(wait) => return Ok(Begun::Waits(ListDecoding { array, len, items, wait })),
            }
            // SAFETY: as above.
            unsafe { read_items(env, array, len, items, above) }
        }
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            let len = self.len();
            // SAFETY: this fn requires a live `env`.
            let (array, items) = or_release::<W, _, _>(unsafe { new_array(env, len, "Failed to create napi Array") }, self)?;
            // SAFETY: `array` was just created in `env`.
            unsafe { write_items(env, array, items.into_iter(), 0, above) }
        }
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            let ListEncoding { array, rest, index, wait } = wait;
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            let (begun, rest) = or_release::<W, _, _>(unsafe { T::encoded(env, wait, child, above) }, rest)?;
            match begun {
                Begun::Whole(value) => {
                    // SAFETY: `array` and `value` were created in `env`.
                    let ((), rest) = or_release::<W, _, _>(unsafe { set_item(env, array, index, value) }, rest)?;
                    // SAFETY: as above.
                    unsafe { write_items(env, array, rest, index + 1, above) }
                }
                Begun::Waits(wait) => Ok(Begun::Waits(ListEncoding { array, rest, index, wait })),
            }
        }
    }

    fn non_empty<T>(items: Vec<T>) -> Result<NonEmptyVec<T>> {
        NonEmptyVec::try_from(items).map_err(|empty| Error::from_reason(empty.to_string()))
    }

    /// `Vec`'s codec, refusing an empty array.
    impl<W: Frames, T: Codec<W>> Codec<W> for NonEmptyVec<T> {
        type DecodeWait = ListDecoding<T, T::DecodeWait>;
        type EncodeWait = ListEncoding<T, T::EncodeWait>;
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn requires `value` to be live in `env`.
            match unsafe { Vec::<T>::decode(env, value, above)? } {
                Begun::Whole(items) => non_empty(items).map(Begun::Whole),
                Begun::Waits(wait) => Ok(Begun::Waits(wait)),
            }
        }
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            match unsafe { Vec::<T>::decoded(env, wait, child, above)? } {
                Begun::Whole(items) => non_empty(items).map(Begun::Whole),
                Begun::Waits(wait) => Ok(Begun::Waits(wait)),
            }
        }
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            // SAFETY: this fn requires a live `env`.
            unsafe { Vec::from(self).encode(env, above) }
        }
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            unsafe { Vec::<T>::encoded(env, wait, child, above) }
        }
    }

    /// A slot's value: an object carrying `$treeHandle` is a coordinate (its
    /// `$span` required), anything else the slot's node, which decides for
    /// itself what it takes. A node writes itself; a coordinate writes the
    /// object the decode reads back as one.
    impl<W: Frames, T: Codec<W>, const ADJACENT: bool> Codec<W> for SlotValue<T, ADJACENT> {
        type DecodeWait = T::DecodeWait;
        type EncodeWait = T::EncodeWait;
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn requires `value` to be live in `env`.
            if unsafe { crate::slot::node_value_type(env, value)? } == ::napi::ValueType::Object {
                // SAFETY: as above.
                if let Some(coord) = unsafe { crate::slot::coordinate_from_napi(env, value)? } {
                    return Ok(Begun::Whole(Self::Coord(coord)));
                }
            }
            // SAFETY: as above.
            Ok(unsafe { T::decode(env, value, above)? }.map(Self::Node))
        }
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            Ok(unsafe { T::decoded(env, wait, child, above)? }.map(Self::Node))
        }
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            match self {
                // SAFETY: this fn requires a live `env`.
                Self::Node(node) => unsafe { node.encode(env, above) },
                // SAFETY: as above.
                Self::Coord(coord) => unsafe { crate::slot::coordinate_to_napi(env, &coord) }.map(Begun::Whole),
            }
        }
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            unsafe { T::encoded(env, wait, child, above) }
        }
    }

    impl<W: Frames, T: Codec<W>> Codec<W> for Holes<T> {
        type DecodeWait = ListDecoding<Option<T>, T::DecodeWait>;
        type EncodeWait = HoleEncoding<T, T::EncodeWait>;
        unsafe fn decode(env: napi_env, value: napi_value, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn requires `value` to be live in `env`.
            Ok(unsafe { Vec::<Option<T>>::decode(env, value, above)? }.map(Holes))
        }
        unsafe fn decoded(env: napi_env, wait: Self::DecodeWait, child: W::Whole, above: &mut Option<W::DecodeFrame>) -> Result<Begun<Self, Self::DecodeWait>> {
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            Ok(unsafe { Vec::<Option<T>>::decoded(env, wait, child, above)? }.map(Holes))
        }
        unsafe fn encode(self, env: napi_env, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            let len = self.0.len();
            // SAFETY: this fn requires a live `env`.
            let (array, items) = or_release::<W, _, _>(unsafe { new_array(env, len, "failed to create a list") }, self.0)?;
            // SAFETY: `array` was just created in `env`.
            unsafe { write_holes(env, array, items.into_iter(), 0, above) }
        }
        unsafe fn encoded(env: napi_env, wait: Self::EncodeWait, child: napi_value, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, Self::EncodeWait>> {
            let HoleEncoding { array, rest, index, wait } = wait;
            // SAFETY: this fn's caller keeps `wait` live in `env`.
            let (begun, rest) = or_release::<W, _, _>(unsafe { T::encoded(env, wait, child, above) }, rest)?;
            match begun {
                Begun::Whole(value) => {
                    // SAFETY: `array` and `value` were created in `env`.
                    let ((), rest) = or_release::<W, _, _>(unsafe { set_hole(env, array, index, value) }, rest)?;
                    // SAFETY: as above.
                    unsafe { write_holes(env, array, rest, index + 1, above) }
                }
                Begun::Waits(wait) => Ok(Begun::Waits(HoleEncoding { array, rest, index, wait })),
            }
        }
    }

    /// A list with absent items partly encoded (`ListEncoding`).
    pub struct HoleEncoding<T, P> {
        array: napi_value,
        rest: ::std::vec::IntoIter<Option<T>>,
        index: u32,
        wait: P,
    }

    impl<W: Nodes, T: Dismantle<W>, P: Dismantle<W>> Dismantle<W> for HoleEncoding<T, P> {
        fn dismantle(self, out: &mut Vec<W::Whole>) {
            self.rest.dismantle(out);
            self.wait.dismantle(out);
        }
    }

    /// The items of `rest` written to `array` from `index` on, as
    /// `boundary::holes` writes them.
    unsafe fn write_holes<W: Frames, T: Codec<W>>(
        env: napi_env,
        array: napi_value,
        mut rest: ::std::vec::IntoIter<Option<T>>,
        mut index: u32,
        above: &mut Option<W::EncodeFrame>,
    ) -> Result<Begun<napi_value, HoleEncoding<T, T::EncodeWait>>> {
        while let Some(item) = rest.next() {
            let begun;
            // SAFETY: this fn's caller passes a live `env`.
            (begun, rest) = or_release::<W, _, _>(unsafe { hole(env, item, above) }, rest)?;
            let value = match begun {
                Begun::Whole(value) => value,
                Begun::Waits(wait) => return Ok(Begun::Waits(HoleEncoding { array, rest, index, wait })),
            };
            // SAFETY: `array` and `value` were created in `env`.
            ((), rest) = or_release::<W, _, _>(unsafe { set_hole(env, array, index, value) }, rest)?;
            index += 1;
        }
        Ok(Begun::Whole(array))
    }

    /// `item` encoded, or `undefined` when it is absent.
    unsafe fn hole<W: Frames, T: Codec<W>>(env: napi_env, item: Option<T>, above: &mut Option<W::EncodeFrame>) -> Result<Begun<napi_value, T::EncodeWait>> {
        let Some(item) = item else {
            let mut undefined = ::std::ptr::null_mut();
            ::napi::check_status!(
                // SAFETY: this fn's caller passes a live `env`.
                unsafe { ::napi::sys::napi_get_undefined(env, &raw mut undefined) },
                "failed to get undefined"
            )?;
            return Ok(Begun::Whole(undefined));
        };
        // SAFETY: as above.
        unsafe { item.encode(env, above) }
    }

    unsafe fn set_hole(env: napi_env, array: napi_value, index: u32, value: napi_value) -> Result<()> {
        ::napi::check_status!(
            // SAFETY: this fn's caller passes `array` and `value` live in `env`.
            unsafe { ::napi::sys::napi_set_element(env, array, index, value) },
            "failed to set a list item"
        )
    }
}

#[cfg(test)]
mod tests {
    use super::{StackPool, KEPT_STACK_BYTES};

    #[test]
    fn a_stack_given_back_is_lent_again_empty_with_its_capacity() {
        let pool = StackPool::<u64>::new();
        let mut stack = pool.take();
        stack.extend(0..100);
        let capacity = stack.capacity();
        pool.give(stack);
        let again = pool.take();
        assert_eq!(again, [0u64; 0]);
        assert_eq!(again.capacity(), capacity);
    }

    #[test]
    fn a_stack_that_grew_past_the_bound_is_cut_back_to_it() {
        let pool = StackPool::<[u8; 1000]>::new();
        let mut stack = pool.take();
        stack.resize(10_000, [0; 1000]);
        pool.give(stack);
        assert_eq!(pool.take().capacity(), KEPT_STACK_BYTES / 1000);
    }

    #[test]
    fn a_run_inside_another_gets_its_own_stack_and_the_pool_keeps_the_larger() {
        let pool = StackPool::<u64>::new();
        pool.give(Vec::with_capacity(64));
        let outer = pool.take();
        let kept = outer.capacity();
        let mut inner = pool.take();
        assert_eq!(inner.capacity(), 0);
        inner.reserve(8);
        assert!(inner.capacity() < kept);
        pool.give(inner);
        pool.give(outer);
        assert_eq!(pool.take().capacity(), kept);
    }
}
