//! The heap bytes a value holds, beyond its own size: what a parsed tree
//! reports to V8 as its native memory (`ParsedTree::native_bytes`).
//!
//! A vector, string or hash map counts its capacity, and each element its
//! own heap. A hash map is counted only as a `CountedMap`, whose allocation
//! is the one `hashbrown` makes for its capacity: the buckets' entries, then
//! a control byte per bucket and one group more. A B-tree's node count
//! depends on the order its keys were inserted in and is not observable, so
//! a `BTreeMap` counts each entry's key and value and their heap, and its
//! node slack is left out.

use std::borrow::Borrow;
use std::collections::{BTreeMap, HashMap};
use std::hash::Hash;
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
/// `capacity`: none for an empty table. Exact only while no entry has been
/// removed (`CountedMap`).
const fn table_bytes<T>(capacity: usize) -> usize {
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

/// The bytes a `Vec`'s allocation takes, without what its items hold on the
/// heap.
#[must_use]
pub fn vec_allocation<T>(items: &Vec<T>) -> usize {
    items.capacity() * size_of::<T>()
}

/// The bytes a `BTreeMap`'s entries take, without what they hold on the
/// heap.
#[must_use]
pub fn btree_allocation<K, V>(map: &BTreeMap<K, V>) -> usize {
    map.len() * size_of::<(K, V)>()
}

impl<T: HeapBytes> HeapBytes for Vec<T> {
    fn heap_bytes(&self) -> usize {
        vec_allocation(self) + self.iter().map(HeapBytes::heap_bytes).sum::<usize>()
    }
}

/// A hash map counted by its capacity (`table_bytes`): the one hash map a
/// count reads. It offers no removal, since removing an entry can leave a
/// tombstone that lowers the capacity and not the allocation. A map that
/// drops entries is rebuilt from the ones it keeps (`kept`), and the
/// rebuilt map's capacity is its allocation's again.
#[derive(Debug, Clone)]
pub struct CountedMap<K, V = ()>(HashMap<K, V>);

impl<K, V> Default for CountedMap<K, V> {
    fn default() -> Self {
        Self(HashMap::new())
    }
}

impl<K: Eq + Hash, V> CountedMap<K, V> {
    /// The value the map holds for `key`, or `None` when it holds none.
    #[must_use]
    pub fn get<Q: Eq + Hash + ?Sized>(&self, key: &Q) -> Option<&V>
    where
        K: Borrow<Q>,
    {
        self.0.get(key)
    }

    /// Whether the map holds a value for `key`.
    #[must_use]
    pub fn contains_key<Q: Eq + Hash + ?Sized>(&self, key: &Q) -> bool
    where
        K: Borrow<Q>,
    {
        self.0.contains_key(key)
    }

    /// Holds `value` for `key`, answering the value it replaced.
    pub fn insert(&mut self, key: K, value: V) -> Option<V> {
        self.0.insert(key, value)
    }

    /// The value the map holds for `key`, holding `value` first when it
    /// holds none.
    pub fn get_or_insert(&mut self, key: K, value: V) -> &mut V {
        self.0.entry(key).or_insert(value)
    }

    /// The entries the map holds.
    #[must_use]
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Whether the map holds no entry.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Each entry, in no order.
    #[must_use]
    pub fn iter(&self) -> std::collections::hash_map::Iter<'_, K, V> {
        self.0.iter()
    }

    /// Each value, in no order.
    #[must_use]
    pub fn values(&self) -> std::collections::hash_map::Values<'_, K, V> {
        self.0.values()
    }

    /// The map rebuilt from the entries `keep` keeps.
    #[must_use]
    pub fn kept(self, mut keep: impl FnMut(&K, &V) -> bool) -> Self {
        self.0.into_iter().filter(|(key, value)| keep(key, value)).collect()
    }

    /// The bytes the map's allocation takes, without what its entries hold
    /// on the heap.
    #[must_use]
    pub fn allocation(&self) -> usize {
        table_bytes::<(K, V)>(self.0.capacity())
    }
}

impl<K: Eq + Hash, V: PartialEq> PartialEq for CountedMap<K, V> {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}

impl<K: Eq + Hash, V: Eq> Eq for CountedMap<K, V> {}

impl<'m, K, V> IntoIterator for &'m CountedMap<K, V> {
    type Item = (&'m K, &'m V);
    type IntoIter = std::collections::hash_map::Iter<'m, K, V>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl<K: Eq + Hash, V> Extend<(K, V)> for CountedMap<K, V> {
    fn extend<I: IntoIterator<Item = (K, V)>>(&mut self, entries: I) {
        self.0.extend(entries);
    }
}

impl<K: Eq + Hash, V> FromIterator<(K, V)> for CountedMap<K, V> {
    fn from_iter<I: IntoIterator<Item = (K, V)>>(entries: I) -> Self {
        Self(entries.into_iter().collect())
    }
}

impl<K: Eq + Hash + HeapBytes, V: HeapBytes> HeapBytes for CountedMap<K, V> {
    fn heap_bytes(&self) -> usize {
        self.allocation() + self.iter().map(|(key, value)| key.heap_bytes() + value.heap_bytes()).sum::<usize>()
    }
}

impl<K: HeapBytes, V: HeapBytes> HeapBytes for BTreeMap<K, V> {
    fn heap_bytes(&self) -> usize {
        btree_allocation(self) + self.iter().map(|(key, value)| key.heap_bytes() + value.heap_bytes()).sum::<usize>()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_table_counts_the_buckets_its_capacity_takes() {
        assert_eq!(table_bytes::<u64>(0), 0);
        let map: CountedMap<u32, u32> = (0..3).map(|n| (n, n)).collect();
        assert_eq!(map.0.capacity(), 3);
        assert_eq!(map.heap_bytes(), table_bytes::<(u32, u32)>(3));
        assert_eq!(table_bytes::<(u32, u32)>(3), (8 * 4usize).next_multiple_of(GROUP_WIDTH) + 4 + GROUP_WIDTH);
        assert_eq!(table_bytes::<(u32, u32)>(14), 8 * 16 + 16 + GROUP_WIDTH);
    }

    /// Whether `capacity` is what a table of some bucket count holds with no
    /// slot lost to a removal, so `table_bytes` names its allocation.
    fn whole(capacity: usize) -> bool {
        matches!(capacity, 0 | 3 | 7) || (capacity >= 14 && capacity.is_multiple_of(7) && (capacity / 7).is_power_of_two())
    }

    #[test]
    fn a_map_rebuilt_from_what_it_keeps_is_counted_at_its_allocation() {
        let full: CountedMap<u32, u32> = (0..28).map(|n| (n, n)).collect();
        assert_eq!(full.0.capacity(), 28, "a full table of 32 buckets");
        let kept = full.kept(|&key, _| key < 8);
        assert_eq!(kept.len(), 8);
        assert!(whole(kept.0.capacity()), "the rebuilt map holds {}", kept.0.capacity());
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
