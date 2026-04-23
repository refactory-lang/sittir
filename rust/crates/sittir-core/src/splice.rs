//! Byte-level `apply_edits` on a source string. Spec 012 T024.
//!
//! Sorts edits by `start_pos` descending, applies each as a raw byte
//! splice on a `String`. Descending order guarantees earlier edits
//! aren't shifted by later ones, so consumers can produce edits in any
//! order and let us canonicalize.
//!
//! # Overlap handling
//!
//! Overlap detection is **explicitly** the consumer's responsibility —
//! see contracts/napi-api.md `applyEdits` contract. This function does
//! NOT validate that edits are disjoint; overlapping edits fall through
//! to last-wins behavior (after sort-descending, the edit with the
//! greatest `start_pos` applies first, and subsequent edits whose
//! ranges still reference valid offsets within the intermediate string
//! apply afterward).
//!
//! # Validation
//!
//! Per-edit validation: `start_pos <= end_pos <= source.len()` (bytes).
//! Violations return `Err` rather than panic so the napi wrapper can
//! surface a typed error to JS. UTF-8 boundary correctness is also
//! checked on the splice (via `String::replace_range`) — non-char-
//! boundary ranges produce a `Result::Err` instead of panicking.

use crate::types::Edit;

/// Error returned from [`apply_edits`] when an edit is invalid.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SpliceError {
    /// `end_pos < start_pos` — the edit range is reversed.
    InvalidRange { start: u32, end: u32 },
    /// `end_pos > source.len()` — edit reaches past end of source.
    OutOfBounds { end: u32, source_len: usize },
    /// `start_pos` or `end_pos` isn't a UTF-8 char boundary.
    NonCharBoundary { start: u32, end: u32 },
}

impl std::fmt::Display for SpliceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SpliceError::InvalidRange { start, end } => {
                write!(f, "invalid edit range: start={start}, end={end}")
            }
            SpliceError::OutOfBounds { end, source_len } => write!(
                f,
                "edit out of bounds: end={end} > source length={source_len}"
            ),
            SpliceError::NonCharBoundary { start, end } => write!(
                f,
                "edit range not at UTF-8 char boundary: start={start}, end={end}"
            ),
        }
    }
}

impl std::error::Error for SpliceError {}

/// Apply a batch of edits to a source string, returning the modified
/// source. See module docs for the sort-descending strategy and the
/// consumer-owned overlap contract.
///
/// # Errors
///
/// - [`SpliceError::InvalidRange`] if any edit has `end_pos < start_pos`.
/// - [`SpliceError::OutOfBounds`] if any edit's `end_pos` exceeds
///   `source.len()` (bytes).
/// - [`SpliceError::NonCharBoundary`] if any edit's start or end is
///   not a UTF-8 character boundary of the source.
pub fn apply_edits(source: &str, mut edits: Vec<Edit>) -> Result<String, SpliceError> {
    // Pre-validate every edit up-front so we fail atomically (no
    // partial application).
    let source_len = source.len();
    for e in &edits {
        if e.end_pos < e.start_pos {
            return Err(SpliceError::InvalidRange {
                start: e.start_pos,
                end: e.end_pos,
            });
        }
        if (e.end_pos as usize) > source_len {
            return Err(SpliceError::OutOfBounds {
                end: e.end_pos,
                source_len,
            });
        }
        if !source.is_char_boundary(e.start_pos as usize)
            || !source.is_char_boundary(e.end_pos as usize)
        {
            return Err(SpliceError::NonCharBoundary {
                start: e.start_pos,
                end: e.end_pos,
            });
        }
    }

    // Sort descending by start_pos. Ties broken by end_pos descending —
    // with identical start positions, the longer replacement applies
    // first so the shorter doesn't overwrite its tail. (Tie-breaking is
    // documented consumer-visible behavior; overlap detection is still
    // theirs.)
    edits.sort_by(|a, b| {
        b.start_pos
            .cmp(&a.start_pos)
            .then_with(|| b.end_pos.cmp(&a.end_pos))
    });

    let mut buf = String::from(source);
    for e in edits {
        let start = e.start_pos as usize;
        let end = e.end_pos as usize;
        buf.replace_range(start..end, &e.inserted_text);
    }
    Ok(buf)
}
