use sittir_core::layout_kinds::{Flanks, LayoutKinds};

#[test]
fn a_flanks_word_holds_one_gap_kind_per_side() {
    let flanks = Flanks { before: LayoutKinds::SPACE, after: LayoutKinds::NEWLINE };
    assert_eq!(Flanks::of_word(flanks.word()), Some(flanks));
    assert_eq!(Flanks::of_word(0), Some(Flanks { before: LayoutKinds::NONE, after: LayoutKinds::NONE }));
}

#[test]
fn a_flanks_word_refuses_a_byte_past_the_gap_kinds() {
    assert_eq!(Flanks::of_word(1 << 6), None);
    assert_eq!(Flanks::of_word((1 << 6) << 8), None);
    assert_eq!(Flanks::of_word(u32::from(LayoutKinds::SPACE.0 | LayoutKinds::TAB.0)), None);
}
