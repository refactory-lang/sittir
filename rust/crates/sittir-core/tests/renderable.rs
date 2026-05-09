use askama::FastWritable;
use sittir_core::filters::{Joined, Renderable};

#[test]
fn text_renderable_displays_str() {
    assert_eq!(Renderable::Text("hello").to_string(), "hello");
}

#[test]
fn joined_renderable_streams_separator() {
    let items = [
        Renderable::Text("a"),
        Renderable::Text("b"),
        Renderable::Text("c"),
    ];
    let joined = Joined::new(&items, ", ", false, false);
    assert_eq!(joined.to_string(), "a, b, c");
}

#[test]
fn joined_renderable_writes_via_fast_writable() {
    let items = [Renderable::Text("x"), Renderable::Text("y")];
    let joined = Joined::new(&items, "+", false, false);
    let mut out = String::new();
    joined
        .write_into(&mut out, &askama::NO_VALUES)
        .expect("FastWritable");
    assert_eq!(out, "x+y");
}

#[test]
fn joined_renderable_supports_leading_and_trailing_flanks() {
    let items = [Renderable::Text("a")];
    let joined = Joined::new(&items, ";", true, true);
    assert_eq!(joined.to_string(), ";a;");
}

#[test]
fn joined_renderable_empty_input_renders_empty() {
    let items: Vec<Renderable<'_>> = Vec::new();
    let joined = Joined::new(&items, ",", true, true);
    assert_eq!(joined.to_string(), "");
}
