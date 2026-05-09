//! Shared helpers for the parity-test integration tests. The actual
//! assertions live in `tests/parity.rs` — cargo's convention for
//! integration tests means each `tests/*.rs` is compiled as its own
//! binary. Helpers that multiple test files would share go here.
//!
//! Keeping `lib.rs` minimal so `cargo check -p sittir-parity-tests` on
//! its own compiles fast; the per-grammar test cases pull the heavy
//! dependencies (`sittir-{lang}`, `tree-sitter-{lang}`) only
//! when the integration-test binary builds.

use serde::Deserialize;
use sittir_core::types::NodeData;

/// One entry in a grammar's `test-fixtures.json`. Discriminated by the
/// `kind` tag (`"render"` / `"roundtrip"`) — matches the shape emitted
/// by `packages/codegen/src/emitters/parity-fixtures.ts`.
#[derive(Debug, Deserialize)]
#[serde(tag = "kind")]
pub enum ParityFixture {
    #[serde(rename = "render")]
    Render {
        grammar: String,
        input: NodeData,
        #[serde(rename = "expectedOutput")]
        expected_output: String,
    },

    #[serde(rename = "roundtrip")]
    RoundTrip {
        grammar: String,
        #[serde(rename = "sourceIn")]
        source_in: String,
        pattern: String,
        edits: Vec<serde_json::Value>,
        #[serde(rename = "expectedSourceOut")]
        expected_source_out: String,
        #[serde(rename = "expectedReparseTree")]
        expected_reparse_tree: String,
        /// Rendered fragment wrapped in a supertype/direct-kind reparse
        /// context so tree-sitter can parse it standalone. Produced by
        /// the TS validator's `wrapForReparse` at capture time. The
        /// parity harness parses THIS text, not the bare rendered
        /// fragment (bare fragments like `"pub"` alone fail parse).
        #[serde(rename = "wrappedText", default)]
        wrapped_text: String,
        /// Byte offset within `wrapped_text` where the rendered
        /// fragment was spliced. The harness locates the subtree at
        /// this offset to compare against `expected_reparse_tree`.
        #[serde(rename = "wrappedOffset", default)]
        wrapped_offset: u32,
    },
}

/// Load the fixture corpus for a grammar from disk. Path is relative
/// to the workspace root so `cargo test -p sittir-parity-tests` finds
/// it regardless of the caller's cwd.
pub fn load_fixtures(grammar: &str) -> Vec<ParityFixture> {
    let path = format!(
        "{}/../sittir-{}/test-fixtures.json",
        env!("CARGO_MANIFEST_DIR"),
        grammar,
    );
    let json = std::fs::read_to_string(&path).unwrap_or_else(|e| {
        panic!("failed to read {path}: {e}. Run `npx tsx packages/codegen/src/cli.ts --grammar {grammar} --all --output packages/{grammar}/src` to regenerate.")
    });
    serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("failed to parse fixtures for {grammar}: {e}"))
}
