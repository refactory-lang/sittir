//! Points: a row and a byte column, as tree-sitter counts them. A snapshot
//! measures each of its points from the start of the node whose bytes
//! contain it; composition follows tree-sitter's `length_add`, so a column is
//! relative only on its base's own row. A tree-backed node holds bytes, and
//! the line table turns them into points.

use crate::heap::HeapBytes;
use serde::{Deserialize, Serialize};

/// A row and a byte column within it. Rows are counted by `\n` only.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Serialize, Deserialize)]
pub struct Point {
    pub row: u32,
    pub column: u32,
}

impl Point {
    pub const ZERO: Point = Point { row: 0, column: 0 };

    /// The point `offset` names from `self`: on `self`'s row the columns add;
    /// on a later row the offset's column stands alone.
    #[must_use]
    pub fn then(self, offset: Point) -> Point {
        if offset.row == 0 {
            Point { row: self.row, column: self.column + offset.column }
        } else {
            Point { row: self.row + offset.row, column: offset.column }
        }
    }

    /// The offset of `self` from `base`, so that
    /// `base.then(self.offset_from(base)?) == self`; `None` when `base` lies
    /// after `self`, which no offset names.
    #[must_use]
    pub fn offset_from(self, base: Point) -> Option<Point> {
        if self.row == base.row {
            Some(Point { row: 0, column: self.column.checked_sub(base.column)? })
        } else {
            Some(Point { row: self.row.checked_sub(base.row)?, column: self.column })
        }
    }
}

/// Two points: a snapshot node's start and end, measured from its holder's
/// start.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct PointSpan {
    pub start: Point,
    pub end: Point,
}

impl HeapBytes for PointSpan {
    fn heap_bytes(&self) -> usize {
        let Self { start: _, end: _ } = self;
        0
    }
}

impl PointSpan {
    /// The empty span at `point`.
    #[must_use]
    pub const fn at(point: Point) -> Self {
        PointSpan { start: point, end: point }
    }

    /// The row of the span's last byte: a span that ends with its line break
    /// ends on the row that break closes.
    #[must_use]
    pub fn last_row(&self) -> u32 {
        if self.end.column == 0 && self.end.row > self.start.row {
            self.end.row - 1
        } else {
            self.end.row
        }
    }
}

/// `{ row, column }`, both required.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Point {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use crate::boundary::{object, required_whole};
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        unsafe {
            let obj = object(env, napi_val)?;
            Ok(Point { row: required_whole(env, obj, c"row", "a span point")?, column: required_whole(env, obj, c"column", "a span point")? })
        }
    }
}

/// `{ row, column }`.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Point {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe { crate::boundary::object_with(env, &[(c"row", u32::to_napi_value(env, val.row)?), (c"column", u32::to_napi_value(env, val.column)?)]) }
    }
}

/// `{ start, end }`, both required points.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PointSpan {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use crate::boundary::{object, required};
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        unsafe {
            let obj = object(env, napi_val)?;
            Ok(PointSpan { start: required(env, obj, c"start", "a span")?, end: required(env, obj, c"end", "a span")? })
        }
    }
}

/// `{ start, end }`.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PointSpan {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe { crate::boundary::object_with(env, &[(c"start", Point::to_napi_value(env, val.start)?), (c"end", Point::to_napi_value(env, val.end)?)]) }
    }
}

/// Whether `byte` may sit between the two line breaks of a blank line: a
/// space, tab, carriage return or form feed.
#[must_use]
pub const fn blank(byte: u8) -> bool {
    matches!(byte, b' ' | b'\t' | b'\r' | b'\x0c')
}

/// The byte offset at which each row of one source starts, built once and
/// shared by every render of that source, with the source's blank rows
/// where its holder keeps them for as long as it lives (`with_blank_rows`).
#[derive(Debug, Clone)]
pub struct LineTable {
    starts: Vec<u32>,
    len: u32,
    blank: Option<BlankRows>,
}

impl HeapBytes for LineTable {
    fn heap_bytes(&self) -> usize {
        let Self { starts, len, blank } = self;
        starts.heap_bytes() + len.heap_bytes() + blank.as_ref().map_or(0, |BlankRows(rows)| rows.heap_bytes())
    }
}

/// The rows of one source that are blank lines, in order. A blank line is a
/// row after a line break that holds only `blank` bytes before the next one.
/// `list_slots::sets_apart` sets no item apart in a holder whose bytes hold
/// none, since the two breaks it counts are such a pair, the first being an
/// extra's last byte where the extra ends its row.
#[derive(Debug, Clone)]
struct BlankRows(Vec<u32>);

thread_local! {
    static BLANK_ROW_SCANS: std::cell::Cell<u64> = const { std::cell::Cell::new(0) };
}

/// The scans of a source for its blank rows this thread has made: a
/// diagnostic, so a test counts the scans a call makes, never times them.
#[must_use]
pub fn blank_row_scans() -> u64 {
    BLANK_ROW_SCANS.with(std::cell::Cell::get)
}

impl BlankRows {
    /// The blank rows of `source`, found in one scan of it, which this
    /// thread counts (`blank_row_scans`).
    fn of(source: &str) -> Self {
        BLANK_ROW_SCANS.with(|scans| scans.set(scans.get() + 1));
        let (mut rows, mut row, mut blank_so_far) = (Vec::new(), 0u32, false);
        for byte in source.bytes() {
            if byte == b'\n' {
                if blank_so_far {
                    rows.push(row);
                }
                row += 1;
                blank_so_far = true;
            } else if !blank(byte) {
                blank_so_far = false;
            }
        }
        Self(rows)
    }
}

impl LineTable {
    /// The row starts of `source`.
    #[must_use]
    pub fn new(source: &str) -> Self {
        let mut starts = vec![0];
        starts.extend((1u32..).zip(source.bytes()).filter(|&(_, byte)| byte == b'\n').map(|(past, _)| past));
        Self { starts, len: crate::types::Span::whole(source).end, blank: None }
    }

    /// The row starts of `source` and its blank rows, kept with them.
    #[must_use]
    pub fn with_blank_rows(source: &str) -> Self {
        Self { blank: Some(BlankRows::of(source)), ..Self::new(source) }
    }

    /// Whether the bytes `span` covers hold both line breaks of a blank line:
    /// of the blank lines whose first break lies in it, the earliest ends
    /// first. `None` for a table that keeps no blank rows (`with_blank_rows`).
    #[must_use]
    pub fn holds_blank_line(&self, span: crate::types::Span) -> Option<bool> {
        let BlankRows(rows) = self.blank.as_ref()?;
        let breaks = |row: u32| (self.starts[row as usize] - 1, self.starts[row as usize + 1] - 1);
        let first = rows.partition_point(|&row| breaks(row).0 < span.start);
        Some(rows.get(first).is_some_and(|&row| breaks(row).1 < span.end))
    }

    /// The point of byte offset `byte`, or `None` past the source's end.
    #[must_use]
    pub fn point(&self, byte: u32) -> Option<Point> {
        if byte > self.len {
            return None;
        }
        let row = self.starts.partition_point(|&start| start <= byte) - 1;
        Some(Point { row: crate::types::narrow(row), column: byte - self.starts[row] })
    }

    /// The byte offset of `point`, or `None` when its row does not exist or
    /// its column runs past the row's end. A row's last column is its `\n`,
    /// or the source's end on the last row, as `point` returns for that byte.
    #[must_use]
    pub fn byte(&self, point: Point) -> Option<u32> {
        let row = point.row as usize;
        let start = *self.starts.get(row)?;
        let row_end = self.starts.get(row + 1).map_or(self.len, |next| *next - 1);
        let byte = start.checked_add(point.column)?;
        (byte <= row_end).then_some(byte)
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    const fn p(row: u32, column: u32) -> Point {
        Point { row, column }
    }

    #[test]
    fn a_same_row_offset_adds_columns_and_a_later_row_stands_alone() {
        assert_eq!(p(3, 4).then(p(0, 2)), p(3, 6));
        assert_eq!(p(3, 4).then(p(2, 7)), p(5, 7));
    }

    #[test]
    fn offset_from_inverts_then() {
        for (base, abs) in [(p(3, 4), p(3, 9)), (p(3, 4), p(6, 1)), (p(0, 0), p(0, 0)), (p(2, 0), p(2, 0))] {
            assert_eq!(abs.offset_from(base).map(|offset| base.then(offset)), Some(abs));
        }
    }

    #[test]
    fn no_offset_names_a_point_before_its_base() {
        assert_eq!(p(2, 9).offset_from(p(3, 0)), None);
        assert_eq!(p(3, 1).offset_from(p(3, 4)), None);
    }

    #[test]
    fn line_table_counts_rows_by_line_feed_only() {
        let src = "é = 1;\nfoo\r\nbar";
        let lines = LineTable::new(src);
        assert_eq!(lines.point(0), Some(p(0, 0)));
        assert_eq!(lines.point(2), Some(p(0, 2))); // after the two-byte 'é'
        assert_eq!(lines.point(8), Some(p(1, 0)));
        assert_eq!(lines.point(11), Some(p(1, 3))); // the '\r' stays on row 1
        assert_eq!(lines.point(13), Some(p(2, 0)));
        assert_eq!(lines.byte(p(1, 0)), Some(8));
        assert_eq!(lines.byte(p(2, 0)), Some(13));
        assert_eq!(&src[8..13], "foo\r\n");
    }

    #[test]
    fn the_source_end_is_a_point_and_past_it_is_not() {
        let src = "ab\ncd";
        let lines = LineTable::new(src);
        assert_eq!(lines.point(5), Some(p(1, 2)));
        assert_eq!(lines.point(6), None);
        assert_eq!(lines.byte(p(1, 2)), Some(5));
        assert_eq!(lines.byte(p(1, 3)), None);
        assert_eq!(lines.byte(p(2, 0)), None);
        let trailing = LineTable::new("ab\n");
        assert_eq!(trailing.point(3), Some(p(1, 0)));
        assert_eq!(trailing.byte(p(1, 0)), Some(3));
    }

    #[test]
    fn a_span_holds_a_blank_line_only_where_two_breaks_meet_inside_it_with_only_blanks_between() {
        let span = |start, end| crate::types::Span { start, end };
        let holds = |source: &str, span: crate::types::Span| LineTable::with_blank_rows(source).holds_blank_line(span) == Some(true);
        for source in ["a\n\nb", "a\n \t\r\n b", "a # t\n\nb", "a(); /* m\n\nn */\nb();", "\n\n"] {
            assert!(holds(source, crate::types::Span::whole(source)), "{source:?}");
        }
        for source in ["a\nb\nc", "a\n// c\nb", "a, b", "\n", "  \nb"] {
            assert!(!holds(source, crate::types::Span::whole(source)), "{source:?}");
        }
        assert!(!holds("a\n\nb c", span(3, 6)), "a blank line before the span is not the holder's");
        assert!(!holds("a\n\nb c", span(0, 2)), "a span that holds the first break alone holds no blank line");
        assert!(holds("a\n\nb c", span(1, 3)));
        assert!(holds("a\n\n\nb\n\nc", span(2, 4)), "the second and third breaks of a run meet as a blank line of their own");
        assert!(holds("a\n\n\nb\n\nc", span(5, 8)));
        assert!(!holds("a\n\n\nb\n\nc", span(4, 6)), "a span that ends on the second break does not hold it");
    }

    #[test]
    fn a_column_past_the_offset_width_names_no_byte() {
        let lines = LineTable::new("\na");
        assert_eq!(lines.byte(p(1, u32::MAX)), None);
    }

    #[test]
    fn point_and_byte_invert_each_other_over_a_source() {
        let src = "fn f() {\n    x\n}\n";
        let lines = LineTable::new(src);
        for byte in 0..=crate::types::Span::whole(src).end {
            let point = lines.point(byte).unwrap();
            assert_eq!(lines.byte(point), Some(byte), "byte {byte}");
        }
    }

    #[test]
    fn a_span_that_ends_with_its_line_break_ends_on_the_row_it_closes() {
        assert_eq!(PointSpan { start: p(0, 0), end: p(1, 0) }.last_row(), 0);
        assert_eq!(PointSpan { start: p(0, 0), end: p(0, 3) }.last_row(), 0);
        assert_eq!(PointSpan { start: p(1, 0), end: p(1, 0) }.last_row(), 1);
    }
}
