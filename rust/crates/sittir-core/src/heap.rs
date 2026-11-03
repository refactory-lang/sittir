//! The heap bytes a value holds, beyond its own size: what a parsed tree
//! reports to V8 as its native memory (`ParsedTree::native_bytes`).
//!
//! A vector, string or hash table counts its capacity, and each element its
//! own heap. A hash table's allocation is the one `hashbrown` makes for its
//! capacity: the buckets' entries, then a control byte per bucket and one
//! group more. A B-tree's node count depends on the order its keys were
//! inserted in and is not observable, so a `BTreeMap` counts each entry's
//! key and value and their heap, and its node slack is left out.

use std::collections::{BTreeMap, HashMap, HashSet};
use std::mem::{align_of, size_of};
use std::sync::Arc;

/// The bytes a value holds on the heap, beyond its own size. A type with no
/// heap answers 0. A struct counts each of its fields by name, so a field
/// added to it fails to compile until it is counted.
pub trait HeapBytes {
    fn heap_bytes(&self) -> usize;
}

#[cfg(all(any(target_arch = "x86", target_arch = "x86_64"), target_feature = "sse2"))]
const GROUP_WIDTH: usize = 16;
#[cfg(not(all(any(target_arch = "x86", target_arch = "x86_64"), target_feature = "sse2")))]
const GROUP_WIDTH: usize = 8;

/// The bytes `hashbrown` allocates for a table of entries `T` holding
/// `capacity`: none for an empty table.
#[must_use]
pub const fn table_bytes<T>(capacity: usize) -> usize {
    let buckets = match capacity {
        0 => return 0,
        c if c < 8 => c + 1,
        c => c / 7 * 8,
    };
    let align = if align_of::<T>() > GROUP_WIDTH { align_of::<T>() } else { GROUP_WIDTH };
    (size_of::<T>() * buckets).next_multiple_of(align) + buckets + GROUP_WIDTH
}

/// The bytes an `Arc`'s allocation takes beyond its value: its two counts.
pub const ARC_COUNTS: usize = 2 * size_of::<usize>();

macro_rules! no_heap {
    ($($t:ty),* $(,)?) => {
        $(impl HeapBytes for $t {
            fn heap_bytes(&self) -> usize {
                0
            }
        })*
    };
}

no_heap!(bool, u8, u16, u32, u64, usize, i32, i64, f64, char, ());

impl HeapBytes for String {
    fn heap_bytes(&self) -> usize {
        self.capacity()
    }
}

impl HeapBytes for Box<str> {
    fn heap_bytes(&self) -> usize {
        self.len()
    }
}

impl HeapBytes for Arc<str> {
    fn heap_bytes(&self) -> usize {
        ARC_COUNTS + self.len()
    }
}

impl<T: HeapBytes> HeapBytes for Box<T> {
    fn heap_bytes(&self) -> usize {
        size_of::<T>() + (**self).heap_bytes()
    }
}

impl<T: HeapBytes> HeapBytes for Arc<T> {
    fn heap_bytes(&self) -> usize {
        ARC_COUNTS + size_of::<T>() + (**self).heap_bytes()
    }
}

impl<T: HeapBytes> HeapBytes for Option<T> {
    fn heap_bytes(&self) -> usize {
        self.as_ref().map_or(0, HeapBytes::heap_bytes)
    }
}

impl<T: HeapBytes, E: HeapBytes> HeapBytes for Result<T, E> {
    fn heap_bytes(&self) -> usize {
        match self {
            Ok(value) => value.heap_bytes(),
            Err(error) => error.heap_bytes(),
        }
    }
}

impl HeapBytes for &'static str {
    fn heap_bytes(&self) -> usize {
        0
    }
}

impl<T> HeapBytes for &'static [T] {
    fn heap_bytes(&self) -> usize {
        0
    }
}

impl<A: HeapBytes, B: HeapBytes> HeapBytes for (A, B) {
    fn heap_bytes(&self) -> usize {
        self.0.heap_bytes() + self.1.heap_bytes()
    }
}

impl<A: HeapBytes, B: HeapBytes, C: HeapBytes> HeapBytes for (A, B, C) {
    fn heap_bytes(&self) -> usize {
        self.0.heap_bytes() + self.1.heap_bytes() + self.2.heap_bytes()
    }
}

impl<T: HeapBytes> HeapBytes for Vec<T> {
    fn heap_bytes(&self) -> usize {
        self.capacity() * size_of::<T>() + self.iter().map(HeapBytes::heap_bytes).sum::<usize>()
    }
}

impl<K: HeapBytes, V: HeapBytes, S> HeapBytes for HashMap<K, V, S> {
    fn heap_bytes(&self) -> usize {
        table_bytes::<(K, V)>(self.capacity()) + self.iter().map(|(key, value)| key.heap_bytes() + value.heap_bytes()).sum::<usize>()
    }
}

impl<K: HeapBytes, S> HeapBytes for HashSet<K, S> {
    fn heap_bytes(&self) -> usize {
        table_bytes::<K>(self.capacity()) + self.iter().map(HeapBytes::heap_bytes).sum::<usize>()
    }
}

impl<K: HeapBytes, V: HeapBytes> HeapBytes for BTreeMap<K, V> {
    fn heap_bytes(&self) -> usize {
        self.iter().map(|(key, value)| size_of::<(K, V)>() + key.heap_bytes() + value.heap_bytes()).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_table_counts_the_buckets_its_capacity_takes() {
        assert_eq!(table_bytes::<u64>(0), 0);
        let map: HashMap<u32, u32> = (0..3).map(|n| (n, n)).collect();
        assert_eq!(map.capacity(), 3);
        assert_eq!(map.heap_bytes(), table_bytes::<(u32, u32)>(3));
        assert_eq!(table_bytes::<(u32, u32)>(3), (8 * 4usize).next_multiple_of(GROUP_WIDTH) + 4 + GROUP_WIDTH);
        assert_eq!(table_bytes::<(u32, u32)>(14), 8 * 16 + 16 + GROUP_WIDTH);
    }

    #[test]
    fn nested_heap_is_counted_with_its_holder() {
        let words = vec![String::from("ab"), String::with_capacity(5)];
        assert_eq!(words.heap_bytes(), 2 * size_of::<String>() + 2 + 5);
        let shared: Arc<str> = Arc::from("abc");
        assert_eq!(shared.heap_bytes(), ARC_COUNTS + 3);
        let held: Option<Box<String>> = Some(Box::new(String::with_capacity(4)));
        assert_eq!(held.heap_bytes(), size_of::<String>() + 4);
    }
}
