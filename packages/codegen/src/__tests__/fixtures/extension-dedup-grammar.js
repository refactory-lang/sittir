// Fixture for spec 006 Phase 6 — extension-point dedupe.
//
// Deliberately lists `_indent` twice in externals via a hand-written
// spread-with-duplicate. evaluate.ts's appendDedup helper should
// collapse to a single entry. Without dedupe, tree-sitter's parser
// generator would error.

module.exports = grammar({
    name: 'dedup_test',

    externals: ($) => [
        $._indent,
        $._dedent,
        $._indent, // intentional duplicate
    ],

    extras: ($) => [
        /\s/,
        /\s/, // intentional duplicate
    ],

    rules: {
        source_file: ($) => $._statement,
        _statement: ($) => $.identifier,
        identifier: ($) => /[a-z]+/,
        _indent: ($) => 'INDENT',
        _dedent: ($) => 'DEDENT',
    },
})
