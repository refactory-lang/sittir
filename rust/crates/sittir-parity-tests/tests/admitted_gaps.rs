//! The gap kinds each grammar admits, as its whitespace table stamps them
//! from its extras: a writer spells no other kind (`WhitespaceTable::admit`),
//! so a kind leaving a grammar's table changes what its renders may write.

use sittir_core::engine::EngineGrammar;
use sittir_core::layout_kinds::LayoutKinds;
use sittir_core::options::ResolvedOptions;
use sittir_parity_tests::each_grammar;

fn admitted<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> LayoutKinds {
    let _ = (name, options);
    grammar.whitespace().0.admitted_gaps()
}

#[test]
fn each_grammar_admits_the_gap_kinds_its_extras_accept() {
    let regex = LayoutKinds::from_bits(LayoutKinds::TIGHT.0 | LayoutKinds::BREAKING.0);
    assert_eq!(
        each_grammar!(admitted),
        [("python", LayoutKinds::ALL), ("regex", regex), ("rust", LayoutKinds::ALL), ("scm", LayoutKinds::ALL), ("typescript", LayoutKinds::ALL)]
    );
}
