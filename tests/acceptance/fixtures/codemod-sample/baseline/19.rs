#[inline]
pub fn truthy(x: i32) -> bool {
    x != 0
}

#[inline]
pub fn falsy(x: i32) -> bool {
    !truthy(x)
}

#[inline]
pub fn xor(a: bool, b: bool) -> bool {
    a != b
}
