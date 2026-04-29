#[inline]
pub fn first<T: Copy>(xs: &[T]) -> Option<T> {
    xs.first().copied()
}

#[inline]
pub fn last<T: Copy>(xs: &[T]) -> Option<T> {
    xs.last().copied()
}
