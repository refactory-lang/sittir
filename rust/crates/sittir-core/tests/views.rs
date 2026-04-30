//! Tests for the Renderable-backed `FieldView` and `ListView` shapes
//! introduced in Task 2 of the renderable-native-views plan.
//!
//! These tests mirror the ones appended to `filters.rs` in the plan; they
//! live in a separate file because `tests/filters.rs` currently fails to
//! compile (the pre-existing `joinWithTrailing` / `joinWithLeading` /
//! `joinWithFlanks` tests call those Askama macro-generated types as plain
//! functions — a known issue that Task 3 resolves). Once Task 3 lands and
//! `filters.rs` compiles cleanly, these tests can be merged back.

#[test]
fn listview_holds_renderables() {
    use sittir_core::filters::{ListView, Renderable};
    let items = [Renderable::Text("foo"), Renderable::Text("bar")];
    let view = ListView { items: &items, separator: ", ", leading: false, trailing: false };
    assert_eq!(view.to_string(), "foo, bar");
}

#[test]
fn fieldview_one_holds_renderable() {
    use sittir_core::filters::{FieldView, Renderable};
    let view = FieldView::One(Renderable::Text("hello"));
    assert_eq!(view.to_string(), "hello");
}

#[test]
fn fieldview_missing_renders_empty() {
    use sittir_core::filters::FieldView;
    let view: FieldView<'_> = FieldView::Missing;
    assert_eq!(view.to_string(), "");
}
