//! The whitespace a writer writes of its own holds no carriage return, so
//! its output spells every break `\n` before the render's newline replaces
//! them (`line_endings::spell`): each grammar's default indentation unit and
//! the unit each round-trip fixture source infers hold no line break at all,
//! and each grammar's gap texts spell theirs `\n`. A line's indentation is
//! then that many copies of its unit, which a recording render tallies by
//! count (`SpacingWriter::with_indent`).

use sittir_core::engine::EngineGrammar;
use sittir_core::options::ResolvedOptions;
use sittir_core::spacing::{SpacingWriter, WordMatcher};
use sittir_parity_tests::{each_grammar, fixture_sources, parsed};

/// The default unit of `name` and every unit its fixture sources infer,
/// each taken by a writer and checked: their count.
fn units_hold_no_line_break<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let inferred = fixture_sources(name).iter().filter_map(|source| parsed(grammar, options(), source).inferred().indent.clone()).collect::<Vec<_>>();
    let units = [vec![options().indent], inferred].concat();
    for unit in &units {
        let _ = SpacingWriter::new(&mut String::new(), WordMatcher::default_ident()).with_indent(unit);
        assert!(!unit.contains(['\n', '\r']), "{name}: the indentation unit {unit:?} holds a line break");
    }
    units.len()
}

#[test]
fn every_grammar_s_default_and_inferred_indentation_units_hold_no_line_break() {
    let counts = each_grammar!(units_hold_no_line_break);
    eprintln!("units checked: {counts:?}");
    assert!(counts.iter().all(|(_, count)| *count > 0), "{counts:?}");
}

/// Every gap kind of `name`'s whitespace table, its text checked: their
/// count.
fn gap_texts_spell_breaks_lf<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let _ = options;
    let (table, _) = grammar.whitespace();
    for &(gap, _) in table.gaps {
        let text = table.text_of_gap(sittir_core::layout_kinds::LayoutKinds(gap));
        assert!(!text.contains('\r'), "{name}: gap {gap} is spelled {text:?}");
    }
    table.gaps.len()
}

#[test]
fn every_grammar_s_gap_texts_spell_their_breaks_lf() {
    let counts = each_grammar!(gap_texts_spell_breaks_lf);
    eprintln!("gaps checked: {counts:?}");
    assert!(counts.iter().all(|(_, count)| *count > 0), "{counts:?}");
}
