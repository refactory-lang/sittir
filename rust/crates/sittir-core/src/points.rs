//! Points: a row and a byte column, as tree-sitter counts them. A snapshot
//! measures each of its points from the start of the transport whose bytes
//! contain it; composition follows tree-sitter's `length_add`, so a column is
//! relative only on its base's own row. A tree-backed node holds bytes, and
//! the line table turns them into points.

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
    pub fn then(self, offset: Point) -> Point {
        if offset.row == 0 {
            Point { row: self.row, column: self.column + offset.column }
        } else {
            Point { row: self.row + offset.row, column: offset.column }
        }
    }

    /// The offset of `self` from `base`, which must not lie after `self`;
    /// `base.then(self.offset_from(base)) == self`.
    pub fn offset_from(self, base: Point) -> Point {
        if self.row == base.row {
            Point { row: 0, column: self.column - base.column }
        } else {
            Point { row: self.row - base.row, column: self.column }
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

impl PointSpan {
    /// The row of the span's last byte: a span that ends with its line break
    /// ends on the row that break closes.
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
        use crate::boundary::{object, required};
        unsafe {
            let obj = object(env, napi_val)?;
            Ok(Point { row: required(env, obj, c"row", "a span point")?, column: required(env, obj, c"column", "a span point")? })
        }
    }
}

/// `{ row, column }`.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Point {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe { crate::boundary::object_with(env, &[(c"row", u32::to_napi_value(env, val.row)?), (c"column", u32::to_napi_value(env, val.column)?)]) }
    }
}

/// `{ start, end }`, both required points.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PointSpan {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use crate::boundary::{object, required};
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
        unsafe { crate::boundary::object_with(env, &[(c"start", Point::to_napi_value(env, val.start)?), (c"end", Point::to_napi_value(env, val.end)?)]) }
    }
}

/// The byte offset at which each row of one source starts, built once and
/// shared by every render of that source.
#[derive(Debug, Clone)]
pub struct LineTable {
    starts: Vec<usize>,
    len: usize,
}

impl LineTable {
    pub fn new(source: &str) -> Self {
        let mut starts = vec![0];
        starts.extend(source.bytes().enumerate().filter(|&(_, b)| b == b'\n').map(|(i, _)| i + 1));
        Self { starts, len: source.len() }
    }

    /// The point of byte offset `byte`, or `None` past the source's end.
    pub fn point(&self, byte: usize) -> Option<Point> {
        if byte > self.len {
            return None;
        }
        let row = self.starts.partition_point(|&start| start <= byte) - 1;
        Some(Point { row: row as u32, column: (byte - self.starts[row]) as u32 })
    }

    /// The byte offset of `point`, or `None` when its row does not exist or
    /// its column runs past the row's end. A row's last column is its `\n`,
    /// or the source's end on the last row, as `point` returns for that byte.
    pub fn byte(&self, point: Point) -> Option<usize> {
        let row = point.row as usize;
        let start = *self.starts.get(row)?;
        let row_end = self.starts.get(row + 1).map_or(self.len, |next| *next - 1);
        let byte = start + point.column as usize;
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
            assert_eq!(base.then(abs.offset_from(base)), abs);
        }
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
    fn point_and_byte_invert_each_other_over_a_source() {
        let src = "fn f() {\n    x\n}\n";
        let lines = LineTable::new(src);
        for byte in 0..=src.len() {
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
