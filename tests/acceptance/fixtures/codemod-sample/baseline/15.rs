#[inline]
pub fn id<T>(x: T) -> T {
    x
}

#[inline]
pub fn pair<A, B>(a: A, b: B) -> (A, B) {
    (a, b)
}
