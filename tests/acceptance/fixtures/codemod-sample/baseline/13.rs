#[inline]
fn greet(name: &str) -> String {
    format!("hello, {}", name)
}

#[inline]
fn shout(name: &str) -> String {
    format!("HELLO, {}!", name.to_uppercase())
}
