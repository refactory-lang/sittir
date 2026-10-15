# Known limits and defect tracking

[GitHub issues](https://github.com/refactory-lang/sittir/issues) track concrete defects and their disposition. This document describes how to interpret the current guarantees; it is not a second backlog of historical compiler investigations.

## Syntax and semantic validity

Builder types encode grammar-derived construction shapes, and lexical guards validate admitted terminal text. They do not perform target-language type checking, name resolution, or every context-sensitive validity check. A structurally constructible node can still require a surrounding context or a nonempty body to form a valid program.

## Coverage and exclusions

Use `packages/tools/baselines/native.json` for per-grammar validator floors and failing kinds, and `packages/tools/sclass-ceilings.json` with `packages/tools/validation-report.json` for classified round-trip debt. Counts belong to the measured revision and its fixture universe; this page does not duplicate them.

A source-preserving render of an untouched parsed node and a fresh construction/render/reparse are different checks. Report both where the change affects both. See [Development](../DEVELOPMENT.md#validation).

## Parse errors and lifecycle

A default parse can return a root containing errors; inspect `$errors` or request `errors: 'throw'`. Query views require parsed structure and a live engine. An immutable update does not mutate its ancestors or immediately create a newly parsed query tree.

## Planned surfaces

Internal types and design proposals can precede runtime implementation. Use the [usage guide](use-cases-and-examples.md) and executable examples for the current API, and the [documentation index](README.md#planned-work) for the distinction between current usage and planned work.

## Reporting a defect

Include the revision, grammar, smallest source or construction input, expected result, and actual parse/read/render behavior. Use the existing probe tools to identify the boundary before proposing a generator or grammar fix.
