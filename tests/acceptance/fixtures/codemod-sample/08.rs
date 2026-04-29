struct Counter {
    n: u32,
}

impl Counter {
    fn new() -> Self {
        Counter { n: 0 }
    }

    fn incr(&mut self) {
        self.n += 1;
    }

    fn get(&self) -> u32 {
        self.n
    }
}
