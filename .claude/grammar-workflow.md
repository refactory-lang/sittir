# Grammar and rendering workflow

Use [Development](../DEVELOPMENT.md#regeneration) for generation commands and [architecture](../docs/architecture.md) for the dual execution model.

## Diagnose at the owning layer

Use `tool probe-kind` for parse → typed read → render → reparse inspection before creating another probe. Use `tool probe-stages` to inspect rule structure. A parser error, a storage/read mismatch, and a render mismatch are different failures; establish which boundary loses the fact.

For a construction or round-trip gap, inspect in this order:

1. An incorrect existing override.
2. The earliest compiler phase that still has the required information.
3. A missing fact in the rule/model type.
4. A structural override when the grammar genuinely needs one.

Prefer explicit grammar structure to downstream guesses. Keep a concrete source witness and distinguish source-preserving rendering from rebuilding the same construct without source identity.

## Authoring rules

- `grammar.sittir.ts` executes in tree-sitter and Sittir. Structure needed by the parser must be present before parser generation; a compile-only mutation cannot create a parser-issued symbol.
- Enrichment runs before the active grammar implementation. The authored wire layer and enriched grammar must agree in both executions. Verify the compiled shape in `.sittir/src/grammar.json` and a CST probe.
- Preserve upstream conflicts when extending them. Use the conflict tooling and the parser's concrete conflict report; do not compensate for a wrong rule with unrelated precedence noise.
- Make distinct forms explicit when their literals, delimiters, separators, or shape differ. Use the existing DSL primitives rather than adding a second naming or variant mechanism.
- Fixed required syntax belongs in the rule and is emitted as literal text. An optional token may need a field so its presence can be represented.
- Preserve a hidden semicolon's field when the parser can omit it. For promoted keyword fields, the synthesized hidden keyword rule may need to be inlined to retain LR behavior.
- Do not assume aliasing a multi-step sequence preserves one grouped parser node when its rule is also inlined. Inspect the actual CST and node types.
- Positional transform paths descend transparently through single-content wrappers; sequence/choice positions consume indices. Verify a path with `probe-stages` rather than copying a superficially similar override.
- Match grouped bodies against their current structure, including field names. A group is not a string-based synonym for a similar rule elsewhere.

Long grammar-specific rationale belongs in the [authoring glossaries](../docs/README.md#reference). Keep source comments brief and focused on live constraints.

## Rendering and identity

The active renderer is generated Rust. There are no Jinja/Askama templates to patch. A render gap is corrected in the rule, canonical model, or emitter that owns it, then regenerated.

Use physical grammar identities for storage and transport. A parser display/alias symbol is a separate fact; do not substitute it because its name looks more convenient. [Clippy policy](../docs/clippy-policy.md#kind-ids) describes the native boundary.

Parser-affecting changes require the full parser/generation/native chain. A TypeScript-only fast pass cannot prove that the emitted shape has a parser identity.

## Reporting

For a corpus-affecting iteration, report per-grammar from/coverage pass totals, round-trip and AST matches, factory/IR storage counts, and built-render-parse counts against the same baseline. Name changes in the admitted kind or fixture universe. Never hide them in an aggregate percentage.
