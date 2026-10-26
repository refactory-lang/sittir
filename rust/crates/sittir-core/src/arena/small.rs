use std::collections::HashMap;
use std::hash::Hash;

/// Small per-call fact sets avoid hashing and allocation; larger sets spill to a map.
#[derive(Debug, Clone)]
pub(super) struct SmallMap<K, V> {
    inline: [Option<(K, V)>; 4],
    overflow: Option<HashMap<K, V>>,
}

impl<K: Eq + Hash, V> SmallMap<K, V> {
    pub(super) fn new() -> Self {
        Self {
            inline: std::array::from_fn(|_| None),
            overflow: None,
        }
    }

    pub(super) fn get(&self, key: &K) -> Option<&V> {
        if let Some(overflow) = &self.overflow {
            return overflow.get(key);
        }
        self.inline
            .iter()
            .flatten()
            .find(|(entry, _)| entry == key)
            .map(|(_, value)| value)
    }

    pub(super) fn entry(&mut self, key: K) -> SmallEntry<'_, K, V> {
        SmallEntry { map: self, key }
    }

    fn get_or_insert_with(&mut self, key: K, value: impl FnOnce() -> V) -> &mut V {
        if self.overflow.is_none() {
            let index = self
                .inline
                .iter()
                .position(|entry| entry.as_ref().is_some_and(|(entry, _)| entry == &key))
                .or_else(|| self.inline.iter().position(Option::is_none));
            if let Some(index) = index {
                return &mut self.inline[index].get_or_insert_with(|| (key, value())).1;
            }
            let mut overflow = HashMap::with_capacity(self.inline.len() + 1);
            for entry in &mut self.inline {
                let (key, value) = entry.take().expect("full inline map");
                overflow.insert(key, value);
            }
            self.overflow = Some(overflow);
        }
        self.overflow
            .as_mut()
            .expect("spilled map")
            .entry(key)
            .or_insert_with(value)
    }
}

pub(super) struct SmallEntry<'a, K, V> {
    map: &'a mut SmallMap<K, V>,
    key: K,
}

impl<'a, K: Eq + Hash, V> SmallEntry<'a, K, V> {
    pub(super) fn or_insert_with(self, value: impl FnOnce() -> V) -> &'a mut V {
        self.map.get_or_insert_with(self.key, value)
    }

    pub(super) fn or_insert(self, value: V) -> &'a mut V {
        self.or_insert_with(|| value)
    }

    pub(super) fn or_default(self) -> &'a mut V
    where
        V: Default,
    {
        self.or_insert_with(V::default)
    }
}

pub(super) struct SmallStack<T> {
    inline: [Option<T>; 4],
    len: usize,
    overflow: Vec<T>,
}

impl<T> SmallStack<T> {
    pub(super) fn new() -> Self {
        Self {
            inline: std::array::from_fn(|_| None),
            len: 0,
            overflow: Vec::new(),
        }
    }

    pub(super) fn push(&mut self, value: T) {
        if self.len < self.inline.len() {
            self.inline[self.len] = Some(value);
            self.len += 1;
        } else {
            self.overflow.push(value);
        }
    }

    pub(super) fn pop(&mut self) -> Option<T> {
        if let Some(value) = self.overflow.pop() {
            return Some(value);
        }
        self.len = self.len.checked_sub(1)?;
        self.inline[self.len].take()
    }
}

#[cfg(test)]
mod tests {
    use super::SmallStack;

    #[test]
    fn a_small_stack_keeps_last_in_first_out_order_through_growth_and_shrinkage() {
        let mut stack = SmallStack::new();
        let mut expected = Vec::new();
        for index in 0..127 {
            stack.push(index);
            expected.push(index);
        }
        for _ in 0..63 {
            assert_eq!(stack.pop(), expected.pop());
        }
        for index in 127..158 {
            stack.push(index);
            expected.push(index);
        }
        while let Some(value) = expected.pop() {
            assert_eq!(stack.pop(), Some(value));
        }
        assert_eq!(stack.pop(), None);
        stack.push(9);
        assert_eq!(stack.pop(), Some(9));
    }
}
