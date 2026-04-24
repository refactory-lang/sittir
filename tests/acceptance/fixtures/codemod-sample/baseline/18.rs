fn build_buffer(size: usize) -> Vec<u8> {
    let mut buf = Vec::with_capacity(size);
    for i in 0..size {
        buf.push((i & 0xff) as u8);
    }
    buf
}

#[inline]
fn checksum(buf: &[u8]) -> u32 {
    buf.iter().map(|b| *b as u32).sum()
}
