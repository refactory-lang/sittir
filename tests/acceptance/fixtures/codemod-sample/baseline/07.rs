#[inline]
pub fn is_even(n: i32) -> bool {
    n % 2 == 0
}

#[inline]
pub fn is_odd(n: i32) -> bool {
    n % 2 != 0
}

#[inline]
pub fn parity(n: i32) -> &'static str {
    if is_even(n) { "even" } else { "odd" }
}
