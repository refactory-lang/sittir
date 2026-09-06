//! Resolved render options and the fill walk that applies them.
//!
//! A transport arrives from JavaScript with its spacing and flank fields
//! unset unless the wire carried a value. `FillOptions` walks the tree
//! once before rendering and writes the resolved option into every unset
//! field, so a wire value always wins and the render functions read
//! fields only. The site indices are generated per grammar.

use crate::slot::SlotValue;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedOptions {
    /// Whitespace kind id per spacing site, in generated site order.
    pub spacing: Vec<u16>,
    /// `Delimiter` bitflag per flank site, in generated site order; 0 leaves the field unset.
    pub delimiter: Vec<u8>,
    /// The indentation unit the writer repeats once per depth after a newline.
    pub indent: String,
}

impl Default for ResolvedOptions {
    fn default() -> Self {
        Self {
            spacing: Vec::new(),
            delimiter: Vec::new(),
            indent: crate::spacing::DEFAULT_INDENT.to_string(),
        }
    }
}

pub trait FillOptions {
    fn fill_options(&mut self, table: &ResolvedOptions);
}

impl<T: FillOptions, const ADJACENT: bool> FillOptions for SlotValue<T, ADJACENT> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        if let SlotValue::Node(node) = self {
            node.fill_options(table);
        }
    }
}

impl<T: FillOptions> FillOptions for Vec<T> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        for item in self {
            item.fill_options(table);
        }
    }
}

impl<T: FillOptions> FillOptions for Option<T> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        if let Some(item) = self {
            item.fill_options(table);
        }
    }
}

impl<T: FillOptions + ?Sized> FillOptions for Box<T> {
    fn fill_options(&mut self, table: &ResolvedOptions) {
        (**self).fill_options(table);
    }
}

impl FillOptions for String {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}

impl FillOptions for bool {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}

impl FillOptions for u8 {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}

impl FillOptions for u16 {
    fn fill_options(&mut self, _: &ResolvedOptions) {}
}
