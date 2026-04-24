fn rotate_left(x: u32, n: u32) -> u32 {
    x.rotate_left(n)
}

fn rotate_right(x: u32, n: u32) -> u32 {
    x.rotate_right(n)
}

fn swap_halves(x: u32) -> u32 {
    rotate_left(x, 16)
}

fn high_byte(x: u32) -> u8 {
    ((x >> 24) & 0xff) as u8
}
