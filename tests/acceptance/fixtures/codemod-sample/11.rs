pub fn first<T: Copy>(xs: &[T]) -> Option<T> {
    xs.first().copied()
}

pub fn last<T: Copy>(xs: &[T]) -> Option<T> {
    xs.last().copied()
}
