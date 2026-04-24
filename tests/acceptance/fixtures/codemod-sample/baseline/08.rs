struct Counter {
    n: u32,
}

impl Counter {
    #[inline]
    fn new() -> Self {
        Counter { n: 0 }
    }

    #[inline]
    fn incr(&mut self) {
        self.n += 1;
    }

    #[inline]
    fn get(&self) -> u32 {
        self.n
    }
}
