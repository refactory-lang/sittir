use sittir_core::options::{FillOptions, ResolvedOptions};
use sittir_core::SlotValue;

struct Leaf;
impl FillOptions for Leaf {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}

struct List {
    space_after: Option<u16>,
    delimiter: Option<u8>,
    items: Vec<SlotValue<Leaf>>,
}
impl FillOptions for List {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        self.space_after.get_or_insert(table.spacing[0]);
        if self.delimiter.is_none() && table.delimiter[0] != 0 {
            self.delimiter = Some(table.delimiter[0]);
        }
        self.items.fill_options(table);
    }
}

#[test]
fn an_unset_field_takes_the_table_value_and_a_set_field_keeps_its_own() {
    let table = ResolvedOptions { spacing: vec![168], delimiter: vec![2], ..ResolvedOptions::default() };
    let mut unset = List {
        space_after: None,
        delimiter: None,
        items: vec![SlotValue::Node(Leaf), SlotValue::Verbatim("x".into())],
    };
    unset.fill_options(&table);
    assert_eq!(unset.space_after, Some(168));
    assert_eq!(unset.delimiter, Some(2));
    let mut set = List { space_after: Some(167), delimiter: Some(0), items: vec![] };
    set.fill_options(&table);
    assert_eq!(set.space_after, Some(167));
    assert_eq!(set.delimiter, Some(0));
}

#[test]
fn a_zero_delimiter_default_leaves_the_field_unset() {
    let table = ResolvedOptions { spacing: vec![168], delimiter: vec![0], ..ResolvedOptions::default() };
    let mut list = List { space_after: None, delimiter: None, items: vec![] };
    list.fill_options(&table);
    assert_eq!(list.delimiter, None);
}
