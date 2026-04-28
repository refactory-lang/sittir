fn greet(name: &str) -> String {
	format!("Hello, {}!", name)
}

fn add(a: i32, b: i32) -> i32 {
	a + b
}

struct Config {
	timeout: u32,
	retries: u32,
}

impl Config {
	fn new(timeout: u32, retries: u32) -> Self {
		Config { timeout, retries }
	}

	fn reset(&mut self) {
		self.timeout = 30;
		self.retries = 3;
	}
}
