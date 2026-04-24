#[inline]
fn already_inline(x: u8) -> u8 {
    x.wrapping_add(1)
}

#[inline]
fn untouched(x: u8) -> u8 {
    x.wrapping_sub(1)
}
