fn greet(name: &str) -> String {
    format!("hello, {}", name)
}

fn shout(name: &str) -> String {
    format!("HELLO, {}!", name.to_uppercase())
}
