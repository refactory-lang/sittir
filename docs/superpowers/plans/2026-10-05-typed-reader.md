# Typed Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read a parsed node natively into its kind's generated transport, with routing and storage done by a cursor reader that a derive macro expands from codegen-stamped attributes. Prove the read equal to today's read, wrap and detach for every corpus node of the five grammars (PR 1a). The derive then replaces the napi object codec (PR 1b), and every consumer switches to the typed read (PR 1c). Relative coordinates follow as step 2 on the same feature branch, `feat/typed-reader`, in their own plan.

**Architecture:** Codegen keeps emitting today's transport structs and choice enums. It adds `#[derive(::sittir_core::Transport)]` and helper attributes for every read fact a type cannot state:

- route field, presence keyword and separators;
- layout tokens, inner gaps and minimum depth;
- interior, envelope, and a list's flank and separator kind;
- each choice variant's ids, and a choice's blank arm.

A new proc-macro crate expands each declaration into a `ReadTransport` impl that walks one `tree_sitter::TreeCursor`. `sittir_core::read` holds the runtime:

- depth;
- coordinates as tree and row;
- the trivia placement rule, until the parsed tree's gap table replaces it (`docs/superpowers/plans/2026-10-10-arena-tables.md`, 3a);
- refusal of a child no route takes.

In 1a the typed read runs beside today's read. Two transitional napi methods back the corpus harness: one reports the typed reader's refusal, and the other decodes today's detached data into the same transport types and compares the two.

**Tech Stack:** Rust 1.88 workspace (tree-sitter 0.26, napi-rs 3, regex 1); a new proc-macro crate on syn 2, quote and proc-macro2; TypeScript codegen in `packages/codegen`; vitest; the `sittir-parity-tests` integration crate.

**Spec:** `docs/superpowers/specs/2026-10-01-shared-arena-design.md`. This plan implements its first step (ruling 6.1) and draws on these sections:

- § The transport declaration
- § What the macro expands
- § Laziness
- § Projection facts as attributes
- § What is removed
- § Verification
- Rulings 1, 2, 6, 7, 10 and 11

## Scope and sequencing

`feat/typed-reader` carries the spec's steps 1 and 2. Step 1 lands as four PRs, which this plan writes in full, each detailed against the code the step before it left. Step 2, relative coordinates, is `docs/superpowers/plans/2026-10-06-relative-coordinates.md`. Step 3, the record wire, and both trivia tables (`docs/superpowers/specs/2026-10-09-trivia-table-design.md`) are a feature of their own, `feat/arena`: `docs/superpowers/plans/2026-10-10-arena-tables.md`.

1a is cut from master at or after `efbf817b9`, where enum members cross the transport as their kind ids and decode by id alone. Tasks 5, 8 and 9 build on what that brought: `enumMemberId` and the decoder `arms` in `renderEnumType`, `AssembledEnum`'s refusal of two members with one id, and the wrap's `_spelledMemberId` fold. Task 10's harness compares against today's read with those folds.

| PR | Lands | Gate |
| --- | --- | --- |
| **1a** | the typed reader beside today's read: field-id constants, the `sittir_core::read` runtime, the derive crate, codegen attributes with the unfielded-slot diagnostic, and the corpus parity harness | zero refusals and zero differences against today's read, wrap and detach for every corpus entry of the five grammars; rendered bytes and validation rows unchanged |
| **1b** | the derive's napi codec replaces `#[napi(object)]` and every hand-printed `FromNapiValue` and `ToNapiValue`; a corpus round trip proves the encoders; every choice payload over a byte ceiling is boxed | render-neutral (verification 15), measured against master as 1b starts, whose enum members decode by kind id; build time and binary size per crate; standalone `type-check:native` passes and is chained into `type-check`; every corpus read round-trips unchanged; the typed read's root stack cost in the dev profile at most today's read's; rendered bytes and validation rows unchanged |
| **1c-i** | one reader: handles name descendant indexes; `parse` and `read` cross the typed read, each transport naming its own node; every read goes through it and the wrap attaches members only; today's reader goes | rendered bytes and validation rows unchanged in every task; arena verifications 3–8 but identity; "two readers must not outlive step 1" |
| **1c-ii** | identity and the empty list: the index registry and edited-index set, the fold by range, query results through the registry; an empty list is `[]` in reads, factories and fixtures | relative-coordinates verifications 1–6; the fixture and factory moves of the empty-list form listed; rendered bytes and validation rows unchanged |

## Global Constraints

- Attribute ids are the parser's numeric ids, as generated constants: `kind::X` from `parser.c`'s symbol table (`render/kind_ids.rs`) and `field::Y` from its field table (`render/field_ids.rs`). The macro looks nothing up (ruling 10).
- A kind an attribute names is its grammar id unless the attribute marks it `display` (§ The transport declaration).
- An unfielded child has exactly one slot. In one kind, two slots that take untagged children and admit the same kind are a codegen diagnostic naming the kind, both slots and the shared kind.
- A child no route takes is refused with the node's kind, the child's kind and its row, and nothing is stored for the node (ruling 7). `ERROR` nodes and extras are trivia; a `MISSING` node routes as its kind.
- Depth: one level by default, `Infinity` reads everything, and a kind's `min_depth` deepens its own read. Past the depth, a child with structure is a coordinate made of its tree, row, span and kind; leaves and unit variants are inline at any depth (rulings 1, 2).
- `sittir-core` holds no grammar fact. Every grammar fact reaches native code through a generated attribute, and the expansion is a pure function of the declaration (verification 9).
- In 1a today's read stays the only read any consumer uses: no rendered byte and no validation row moves.
- Generated files are never hand-edited. Change `packages/codegen/src/**` and regenerate with `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src` for rust, typescript, python, scm and regex.
- `packages/codegen/src/` carries no explanatory comments: each new declaration there gets a `###` entry in `docs/glossary/emitters.md` (or the glossary of its directory). Rust in `sittir-core` and in the macro crate carries doc comments.
- No PR, issue, spec, ruling or task number in code, comments, glossary entries or doc comments.
- Every commit uses `git commit -F <msg> -- <paths>`, with `git add` first for new files.
- Gates for a task that touches generated output, unless the task says otherwise:
  - `pnpm run validate:native`, with rows compared to the recorded baseline;
  - `rtk cargo test --workspace --no-default-features`;
  - `pnpm exec vitest run`, as its own call;
  - `pnpm run type-check`;
  - oxlint on the changed TypeScript;
  - `bash scripts/comment-slop-check.sh --working`.
- Stop and report instead of committing when generated output, a fixture or a validation row moves under a change meant to be neutral, or when a gate fails in a way the task did not predict. Nothing is reverted to make a gate pass.

## Review Focus

The cases below are the ones most likely to bite and least covered by the spec's examples. Each one's test sits in the task that owns the code.

1. **`ERROR` and `MISSING` inside a node.** An `ERROR` child is placed as trivia like an extra. A `MISSING` child routes as its kind and, being zero-width, owns no trivia. Test: Task 3 (placement) and Task 4 (an `ERROR` in a block; parameters closed by a MISSING `)`).
2. **A child aliased at a site that is not an envelope** (grammar id ≠ display id, display not an envelope kind). It routes and stores by its grammar id first, then by its display id. Test: Task 5 (`__variant` order) and the parity harness (Task 10), which reports any refusal by name.
3. **Extras at the very start and end of a file.** The first owner takes the leading ones and the last owner the trailing ones. A file of comments only has no owner child, so its comments go to an inner gap or to the root's own sides. Test: Task 3 (rule 4 on a root) and Task 4 (a source that is only a comment).
4. **Zero-width nodes** (typescript's `automatic_semicolon`). They never own trivia, so a comment before one trails the owner before it. A text leaf with an empty span reads as its kind's fixed text, as today's decode does. Test: Task 3 (width 0 is never an owner), Task 4 (`text = ";"`) and Task 5 (a comment before an inserted terminator).
5. **Deep recursion at `Infinity`.** The reader recurses once per level on the native stack, as `read_untyped_node` does. A nesting depth today's read handles must not overflow the typed read. Test: Task 11 (a 1,000-deep parenthesized expression read at `Depth::All`).

## File structure (1a)

Create:

| File | Responsibility |
| --- | --- |
| `rust/crates/sittir-transport-macros/Cargo.toml` | proc-macro crate manifest |
| `rust/crates/sittir-transport-macros/src/lib.rs` | `#[derive(Transport)]` entry point |
| `rust/crates/sittir-transport-macros/src/attrs.rs` | the helper attributes' model and parsing |
| `rust/crates/sittir-transport-macros/src/expand.rs` | the struct, choice and member expansions |
| `rust/crates/sittir-core/src/read.rs` | the runtime: depth, context, survey, routes, placement, slot storage, refusal |
| `rust/crates/sittir-parity-tests/tests/typed_read.rs` | reader tests over the real rust and typescript parsers, with small hand-written declarations |
| `rust/crates/sittir-parity-tests/tests/typed_read_corpus.rs` | depth, row-read and recursion tests over generated transports |
| `packages/codegen/src/emitters/field-id-rust.ts` | `render/field_ids.rs` |
| `packages/codegen/src/emitters/__tests__/field-id-rust.test.ts` | its tests |
| `packages/tools/src/validate/typed-read-parity.ts` | the corpus parity harness |
| `packages/cli/src/commands/tool/typed-read-parity.ts` | `sittir tool typed-read-parity` |

Modify:

| File | Change |
| --- | --- |
| `rust/crates/sittir-core/Cargo.toml` | depend on the macro crate |
| `rust/crates/sittir-core/src/lib.rs` | `pub mod read;` and `pub use sittir_transport_macros::Transport;` |
| `rust/crates/sittir-core/src/types.rs` | `FieldId` |
| `rust/crates/sittir-core/src/slot.rs` | `PartialEq` for `SlotValue` |
| `rust/crates/sittir-core/src/layout.rs`, `trivia.rs` | derive `PartialEq` |
| `rust/crates/sittir-core/src/engine.rs` | `EngineGrammar::kind_name`, `ParsedTree::typed_read` |
| `rust/crates/sittir-core/src/napi_engine.rs` | transitional `typed_read_refusal`, `typed_read_parity`, `parity_report` |
| `packages/codegen/src/dsl/symbol-table.ts` | `generatedFieldIds` |
| `packages/codegen/src/emitters/kind-id-rust.ts` | `kindConstName` and `isScalarStorage`, shared with the attributes |
| `packages/codegen/src/emitters/transport-projection.ts` | the read facts and the attribute text |
| `packages/codegen/src/emitters/shared.ts`, `wrap.ts` | `aliasEnvelopesOf`, `fieldTaggedLiteralTexts` and `slotDropTexts`, shared by the wrap and the attributes |
| `packages/codegen/src/emitters/render-module.ts` | derives, attributes, transport.rs imports, `pub mod field_ids` |
| `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts` | the read facts and the printed attributes on real rust and typescript kinds |
| `packages/codegen/src/emitters/native-crate.ts` | `kind_name` in the generated `EngineGrammar` impl |
| `packages/codegen/src/compiler/generate.ts`, `packages/codegen/src/run-codegen.ts` | write `field_ids.rs` |
| `packages/common/src/engine.ts` | transitional `typedReadRefusal` and `typedReadParity` diagnostics |
| `packages/tools/src/index.ts`, `packages/cli/src/commands/tool/index.ts` | export and register the harness |
| `docs/glossary/emitters.md`, `docs/glossary/packages-tools-src-validate.md` | entries for new declarations |
| `docs/cli-command-glossary.md` | regenerated |

---

## Task 1: Field-id constants

Every slot attribute names a parser field (`field = field::NAME`), so the field ids become generated constants, emitted from `parser.c`'s field table the way kind constants are. `GeneratedIdTables.fieldIds` already carries that table (`compiler/generated-metadata.ts` reads `enum ts_field_identifiers`); nothing emits it yet.

**Files:**
- Create: `packages/codegen/src/emitters/field-id-rust.ts`
- Create: `packages/codegen/src/emitters/__tests__/field-id-rust.test.ts`
- Modify: `packages/codegen/src/dsl/symbol-table.ts` (export `generatedFieldIds` beside `collectGeneratedKindEntries`)
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts` (`kindConstName`)
- Modify: `packages/codegen/src/compiler/generate.ts` (`fieldIds` result, next to `kindIds`)
- Modify: `packages/codegen/src/run-codegen.ts` (write `field_ids.rs`, next to `kind_ids.rs`)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`libRsContents`: `pub mod field_ids;`)
- Modify: `rust/crates/sittir-core/src/types.rs` (`FieldId`)
- Generated: `rust/crates/sittir-<g>/src/render/field_ids.rs`, `render/mod.rs`

**Interfaces:**
- Produces: `kindConstName(entry: { member: string; kind: string }): string` (the name `kind_ids.rs` gives a kind); `fieldConstName(name: string): string`; `generatedFieldIds(tables): readonly { name: string; id: number }[]`; `emitFieldIdRust(grammar: string, tables: GeneratedIdTables): string`; Rust `sittir_core::types::FieldId(pub u16)` and `render::field_ids::<NAME>: FieldId`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/emitters/__tests__/field-id-rust.test.ts
import { describe, expect, it } from 'vitest';
import { emitFieldIdRust, fieldConstName } from '../field-id-rust.ts';

describe('emitFieldIdRust', () => {
	it('emits one FieldId constant per parser field, in id order', () => {
		const tables = {
			sourceArtifact: 'parser.c',
			fieldIds: new Map([
				['return_type', { id: 3 }],
				['name', { id: 1 }],
				['body', { id: 2 }]
			])
		};
		expect(emitFieldIdRust('rust', tables)).toBe(
			[
				'// @generated from packages/rust/.sittir/src/parser.c — do not hand-edit.',
				'',
				'use ::sittir_core::types::FieldId;',
				'',
				'pub const NAME: FieldId = FieldId(1);',
				'pub const BODY: FieldId = FieldId(2);',
				'pub const RETURN_TYPE: FieldId = FieldId(3);',
				''
			].join('\n')
		);
	});

	it('names a field constant by the field name in upper case', () => {
		expect(fieldConstName('type_parameters')).toBe('TYPE_PARAMETERS');
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/field-id-rust.test.ts`
Expected: FAIL, `Cannot find module '../field-id-rust.ts'`.

- [ ] **Step 3: Implement**

In `packages/codegen/src/dsl/symbol-table.ts`, beside `collectGeneratedKindEntries`:

```ts
export function generatedFieldIds(tables: GeneratedIdTables | undefined): readonly { readonly name: string; readonly id: number }[] {
	return toEntries(tables?.fieldIds)
		.filter((row): row is readonly [string, GeneratedIdEntry & { readonly id: number }] => row[1].id !== undefined)
		.map(([name, entry]) => ({ name, id: entry.id }))
		.sort((a, b) => a.id - b.id);
}
```

`packages/codegen/src/emitters/field-id-rust.ts`:

```ts
import { generatedFieldIds, type GeneratedIdTables } from '../dsl/symbol-table.ts';

export function fieldConstName(name: string): string {
	return name.toUpperCase();
}

export function emitFieldIdRust(grammar: string, tables: GeneratedIdTables): string {
	const lines = [
		`// @generated from packages/${grammar}/.sittir/src/parser.c — do not hand-edit.`,
		'',
		'use ::sittir_core::types::FieldId;',
		''
	];
	for (const { name, id } of generatedFieldIds(tables)) lines.push(`pub const ${fieldConstName(name)}: FieldId = FieldId(${id});`);
	lines.push('');
	return lines.join('\n');
}
```

In `kind-id-rust.ts`, name the constant once and use it at both sites (`for (const entry of entries)` and the `errorEntry` assertion):

```ts
export function kindConstName(entry: { readonly member: string; readonly kind: string }): string {
	return toScreamingSnakeCase(entry.member, entry.kind);
}
```

In `compiler/generate.ts`, add `fieldIds: string;` to the result interface, and next to `kindIds:`:

```ts
fieldIds: generatedIdTables ? emitFieldIdRust(cfg.grammar, generatedIdTables) : '',
```

In `run-codegen.ts`, after the `kind_ids.rs` write:

```ts
if (result.fieldIds) {
	const fieldIdsPath = `${renderModuleSrcDir(grammar)}/field_ids.rs`;
	await writeFile(fieldIdsPath, result.fieldIds);
	console.log(`    ${fieldIdsPath}`);
}
```

In `render-module.ts` `libRsContents`, add `pub mod field_ids;` after `pub mod hash;`. Do not re-export it as `kind_ids` is (`pub use kind_ids::*`): field and kind constants share names (`NAME` is both a field and, in some grammars, a kind), so fields stay under their module.

In `rust/crates/sittir-core/src/types.rs`, beside `KindId`:

```rust
/// A parser field id: the index of a field name in `parser.c`'s field table,
/// the value `TreeCursor::field_id` returns for a child tagged with it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct FieldId(pub u16);
```

Add glossary entries for `generatedFieldIds`, `fieldConstName`, `emitFieldIdRust` and `kindConstName` (`docs/glossary/dsl.md` for the first, `docs/glossary/emitters.md` for the rest).

- [ ] **Step 4: Run the test, then regenerate**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/field-id-rust.test.ts` (PASS). Then regenerate all five grammars. Then:

Run: `rtk cargo build --workspace --no-default-features`
Expected: builds. `git status --short rust/crates` shows only new `render/field_ids.rs` files and one added line in each `render/mod.rs`. Spot check: `awk '/pub const (NAME|BODY|RETURN_TYPE):/' rust/crates/sittir-rust/src/render/field_ids.rs` prints the ids `enum ts_field_identifiers` in `packages/rust/.sittir/src/parser.c` gives `field_name`, `field_body` and `field_return_type`.

- [ ] **Step 5: Gates and commit**

Gates: the global list. `kind_ids.rs` must not change: `kindConstName` is the same expression. (A grammar's alias symbols, which have a parser id and no kind row of their own, get constants through `kindConstants`; that is the one place `kind_ids.rs` grows.)

```bash
git add packages/codegen/src/emitters/field-id-rust.ts packages/codegen/src/emitters/__tests__/field-id-rust.test.ts rust/crates/sittir-*/src/render/field_ids.rs
git commit -F msg -- packages/codegen/src packages/codegen/src/dsl/symbol-table.ts rust/crates/sittir-core/src/types.rs rust/crates/sittir-*/src/render docs/glossary
```

Message: `feat(codegen): parser field ids as generated constants`.

---

## Task 2: The reader runtime

`sittir_core::read` is what every expansion calls: how far a read reaches, the per-child survey, the routes an expansion gives children, how each slot type stores what is routed to it, and the errors a read raises. The trivia placement rule is Task 3's; this task declares its types so the traits are complete.

**Files:**
- Create: `rust/crates/sittir-core/src/read.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs` (`pub mod read;`)
- Modify: `rust/crates/sittir-core/src/slot.rs` (`PartialEq` for `SlotValue`)
- Modify: `rust/crates/sittir-core/src/layout.rs` (`#[derive(Debug, Clone, PartialEq)]` on `TransportLayout`)
- Modify: `rust/crates/sittir-core/src/trivia.rs` (`PartialEq` on `TriviaEntry`, `TransportTrivia`, `TriviaText`)

**Interfaces:**
- Produces (all in `sittir_core::read`):
  - `Depth { Levels(NonZeroU32), All }`: `Depth::ONE`, `below()`, `at_least(u32)`.
  - `ReadCtx<'s> { source: &'s str, tree_id: u32 }`: `new`, `coordinate_of(&Child)`, `coordinate(&Node, row)`, `text(&Node)`.
  - `Child` (the survey's per-child facts), `survey(&mut TreeCursor) -> Vec<Child>`, `row_of(&TreeCursor) -> u32`, `tiles(&[Child], start: u32, end: u32) -> bool`, `spelled_id(&[Child]) -> Option<KindId>`.
  - `Route { Trivia, Slot { slot: u16, scalar: bool }, Separator { slot: u16, tagged: bool }, Layout }`.
  - `ReadError` (`Unrouted`, `Missing`, `Overfull`, `Unadmitted`, `Interior`, `Unspelled`), with `describe(&dyn Fn(KindId) -> &'static str) -> String`.
  - `SlotSite { kind, slot, row }`.
  - `Entry { coord, same_line, tokens_between }` and `Sides { owner, leading, trailing }`. Task 3 adds `Placement` and `place`.
  - traits `ReadTransport` (with `blank() -> Option<Self>`, `None` unless a choice has a blank arm), `ReadSlot`, `ReadRoot`, `HasLayout`;
  - `read_value`, `Interior`, `FromCapture`, `capture`;
  - `LEADING`, `TRAILING`, `delimiter(list: &Node, children: &[Child], routes: &[Route], items: u16, leading: Option<u16>, trailing: Option<u16>) -> u8`, `separator_kind(children: &[Child], routes: &[Route], candidates: &[KindId]) -> Option<u16>`.
- Consumes: `FieldId` (Task 1).

- [ ] **Step 1: Write the failing unit tests**

Append to `rust/crates/sittir-core/src/read.rs` (create the file with only this test module first, so the tests fail to compile against the missing items):

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_level_reads_the_node_and_leaves_its_children_as_coordinates() {
        assert_eq!(Depth::ONE.below(), None);
        assert_eq!(Depth::Levels(NonZeroU32::new(3).unwrap()).below(), Some(Depth::Levels(NonZeroU32::new(2).unwrap())));
        assert_eq!(Depth::All.below(), Some(Depth::All));
    }

    #[test]
    fn a_kinds_minimum_depth_deepens_a_shallower_read_only() {
        assert_eq!(Depth::ONE.at_least(2), Depth::Levels(NonZeroU32::new(2).unwrap()));
        assert_eq!(Depth::Levels(NonZeroU32::new(5).unwrap()).at_least(2), Depth::Levels(NonZeroU32::new(5).unwrap()));
        assert_eq!(Depth::All.at_least(2), Depth::All);
        assert_eq!(Depth::ONE.at_least(0), Depth::ONE);
    }

    #[test]
    fn a_refusal_names_the_kind_the_child_and_the_row() {
        let name = |k: KindId| if k.0 == 208 { "function_item" } else { "block" };
        let refusal = ReadError::Unrouted { kind: KindId(208), child: KindId(313), row: 451 };
        assert_eq!(
            refusal.describe(&name),
            "function_item (kind 208) has no route for its child block (kind 313) at row 451"
        );
    }

    fn site() -> SlotSite {
        SlotSite { kind: KindId(1), slot: "items", row: 0 }
    }

    /// A transport for the slot tests: kind 5, with a blank arm when `BLANK`.
    #[derive(Debug, Clone, PartialEq)]
    struct Probe<const BLANK: bool>;

    impl<const BLANK: bool> ReadTransport for Probe<BLANK> {
        fn admits(grammar: KindId, _: KindId) -> bool {
            grammar.0 == 5
        }
        fn takes_tagged(grammar: KindId, display: KindId, _: bool) -> bool {
            Self::admits(grammar, display)
        }
        fn blank() -> Option<Self> {
            BLANK.then_some(Probe)
        }
        fn read(_: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: Depth, _: Sides) -> Result<Self, ReadError> {
            Ok(Probe)
        }
        fn sides_of(_: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: u32) -> Result<Sides, ReadError> {
            Ok(Sides::default())
        }
    }

    type Plain = Probe<false>;

    fn token(start: u32, end: u32, trivia: bool) -> Child {
        Child { row: 0, grammar: KindId(9), display: KindId(9), field: None, named: false, trivia, start, end, start_row: 0, end_row: 0 }
    }

    #[test]
    fn children_tile_a_span_when_contiguous_and_free_of_trivia() {
        assert!(tiles(&[], 0, 3));
        assert!(tiles(&[token(0, 1, false), token(1, 3, false)], 0, 3));
        assert!(!tiles(&[token(0, 1, false), token(2, 3, false)], 0, 3));
        assert!(!tiles(&[token(0, 1, false)], 0, 3));
        assert!(!tiles(&[token(0, 1, false), token(1, 3, true)], 0, 3));
    }

    #[test]
    fn a_node_is_spelled_by_the_one_id_all_its_tokens_display() {
        let shown = |display: u16| Child { display: KindId(display), ..token(0, 1, false) };
        assert_eq!(spelled_id(&[shown(143), shown(143)]), Some(KindId(143)));
        assert_eq!(spelled_id(&[shown(143), token(1, 2, true), shown(143)]), Some(KindId(143)));
        assert_eq!(spelled_id(&[shown(61), shown(51)]), None);
        assert_eq!(spelled_id(&[Child { named: true, ..shown(143) }]), None);
        assert_eq!(spelled_id(&[Child { field: Some(FieldId(1)), ..shown(143) }]), None);
        assert_eq!(spelled_id(&[token(0, 1, true)]), None);
        assert_eq!(spelled_id(&[]), None);
    }

    #[test]
    fn an_elided_slot_keeps_one_position_per_separated_segment() {
        // `[a, , b,]`: a, sep, sep, b, sep → a | (hole) | b | (hole)
        let mut acc = Elided::<u8>::default();
        acc.push(1);
        acc.separator(true);
        acc.separator(true);
        acc.push(2);
        acc.separator(true);
        assert_eq!(acc.positions(), vec![Some(1), None, Some(2), None]);
    }

    #[test]
    fn an_elided_slot_without_separators_keeps_every_item() {
        let mut acc = Elided::<u8>::default();
        acc.push(1);
        acc.push(2);
        assert_eq!(acc.positions(), vec![Some(1), Some(2)]);
        assert_eq!(Elided::<u8>::default().positions(), Vec::<Option<u8>>::new());
    }

    #[test]
    fn an_untagged_separator_makes_no_hole() {
        let mut acc = Elided::<u8>::default();
        acc.push(1);
        acc.separator(false);
        acc.push(2);
        assert_eq!(acc.positions(), vec![Some(1), Some(2)]);
    }

    #[test]
    fn a_required_slot_with_no_child_is_missing() {
        assert_eq!(
            <SlotValue<Plain> as ReadSlot>::finish(None, site()),
            Err(ReadError::Missing { kind: KindId(1), slot: "items", row: 0 })
        );
    }

    #[test]
    fn an_optional_list_reads_as_present_when_empty() {
        assert_eq!(<Option<Vec<SlotValue<Plain>>> as ReadSlot>::finish(Vec::new(), site()), Ok(Some(Vec::new())));
    }

    #[test]
    fn an_absent_optional_slot_reads_as_its_blank_arm_or_absent() {
        assert_eq!(<Option<SlotValue<Probe<true>>> as ReadSlot>::finish(None, site()), Ok(Some(SlotValue::Transport(Probe))));
        assert_eq!(<Option<SlotValue<Plain>> as ReadSlot>::finish(None, site()), Ok(None));
    }

    #[test]
    fn a_presence_slot_reads_true_or_absent() {
        assert_eq!(<Option<bool> as ReadSlot>::finish(true, site()), Ok(Some(true)));
        assert_eq!(<Option<bool> as ReadSlot>::finish(false, site()), Ok(None));
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-core --no-default-features read::tests`
Expected: FAIL to compile (`Depth`, `ReadError`, `Elided`, `ReadSlot` not found).

- [ ] **Step 3: Implement `read.rs`**

```rust
//! The typed reader's runtime: what every `#[derive(Transport)]` expansion
//! calls. A read walks one `TreeCursor` created at the tree's root, so the
//! cursor's descendant index is a node's row in the whole tree. A node's
//! children are surveyed once, routed to slots, placed as trivia, and then
//! read in a second pass, each with the sides the placement gave it. A child
//! past the read's depth is a coordinate: its tree and row, its span and its
//! kind. A child no route takes refuses the read. No grammar fact lives here:
//! each one reaches the reader through a generated attribute.

use crate::engine::encode_handle;
use crate::layout::TransportLayout;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::{TransportTrivia, TriviaEntry};
use crate::types::{FieldId, KindId, Span};
use std::collections::BTreeMap;
use std::num::NonZeroU32;
use std::sync::OnceLock;
use tree_sitter::{Node, TreeCursor};

pub use regex::Captures;

/// How many levels a read expands below the node it starts at.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Depth {
    Levels(NonZeroU32),
    All,
}

impl Depth {
    /// One level: the node's own slots, each child with structure a coordinate.
    pub const ONE: Depth = Depth::Levels(NonZeroU32::MIN);

    /// The depth a child of a node read at `self` is read at, or `None` when
    /// the child is past the last level.
    pub fn below(self) -> Option<Depth> {
        match self {
            Depth::All => Some(Depth::All),
            Depth::Levels(levels) => NonZeroU32::new(levels.get() - 1).map(Depth::Levels),
        }
    }

    /// `self`, deepened to at least `levels`: a kind whose items arrive with it.
    pub fn at_least(self, levels: u32) -> Depth {
        match (self, NonZeroU32::new(levels)) {
            (Depth::Levels(own), Some(min)) if own < min => Depth::Levels(min),
            _ => self,
        }
    }
}

/// What every read of one tree shares: the source its spans index into and
/// the id its coordinates carry.
#[derive(Debug, Clone, Copy)]
pub struct ReadCtx<'s> {
    pub source: &'s str,
    pub tree_id: u32,
}

impl<'s> ReadCtx<'s> {
    pub fn new(source: &'s str, tree_id: u32) -> Self {
        Self { source, tree_id }
    }

    /// The coordinate of a surveyed child: its tree and row, its span and its
    /// grammar kind.
    pub fn coordinate_of(&self, child: &Child) -> NodeCoordinate {
        NodeCoordinate {
            kind: Some(child.grammar),
            ..NodeCoordinate::new(encode_handle(self.tree_id, child.row), Span { start: child.start, end: child.end })
        }
    }

    /// The coordinate of the node at `row`.
    pub fn coordinate(&self, node: &Node<'_>, row: u32) -> NodeCoordinate {
        let range = node.byte_range();
        NodeCoordinate {
            kind: Some(KindId(node.grammar_id())),
            ..NodeCoordinate::new(
                encode_handle(self.tree_id, row),
                Span { start: range.start as u32, end: range.end as u32 },
            )
        }
    }

    /// The source text a node spans.
    pub fn text(&self, node: &Node<'_>) -> &'s str {
        &self.source[node.byte_range()]
    }
}

/// The row of the node the cursor is on: its descendant index from the
/// tree's root, which `TreeCursor::goto_descendant` reaches again.
pub fn row_of(cursor: &TreeCursor<'_>) -> u32 {
    cursor.descendant_index() as u32
}

/// What the first pass learns about one child.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Child {
    pub row: u32,
    pub grammar: KindId,
    pub display: KindId,
    pub field: Option<FieldId>,
    pub named: bool,
    /// An extra, or an `ERROR` wherever the parser left it: placed as trivia.
    pub trivia: bool,
    pub start: u32,
    pub end: u32,
    /// The source row the child starts on.
    pub start_row: usize,
    /// The source row of the child's last byte: a span that ends with its
    /// line break ends on the row that break closes.
    pub end_row: usize,
}

impl Child {
    pub fn width(&self) -> u32 {
        self.end - self.start
    }
}

/// Whether a node's children tile its span `start..end`: none at all, or
/// non-trivia children each starting where the one before ends, from the
/// node's start to its end. A text leaf whose children tile it reads the text
/// it spans.
pub fn tiles(children: &[Child], start: u32, end: u32) -> bool {
    let mut at = start;
    for child in children {
        if child.trivia || child.start != at {
            return false;
        }
        at = child.end;
    }
    children.is_empty() || at == end
}

/// The one id every spelling token of a node displays: its children apart
/// from trivia, each an anonymous token with no field, when there is at
/// least one and all of them display the same id. A multi-token enum member
/// is an alias over its tokens, so each token displays the member's id, and
/// a node whose tokens display different ids spells none of them.
pub fn spelled_id(children: &[Child]) -> Option<KindId> {
    let mut tokens = children.iter().filter(|child| !child.trivia);
    let first = tokens.next()?;
    let spells = |child: &Child| !child.named && child.field.is_none() && child.display == first.display;
    (spells(first) && tokens.all(spells)).then_some(first.display)
}

/// Survey the children of the node the cursor is on. The cursor ends where
/// it started.
pub fn survey(cursor: &mut TreeCursor<'_>) -> Vec<Child> {
    let mut children = Vec::new();
    if cursor.goto_first_child() {
        loop {
            let node = cursor.node();
            let end = node.end_position();
            children.push(Child {
                row: row_of(cursor),
                grammar: KindId(node.grammar_id()),
                display: KindId(node.kind_id()),
                field: cursor.field_id().map(|field| FieldId(field.get())),
                named: node.is_named(),
                trivia: node.is_extra() || node.is_error(),
                start: node.start_byte() as u32,
                end: node.end_byte() as u32,
                start_row: node.start_position().row,
                end_row: if end.column == 0 && node.end_byte() > node.start_byte() { end.row - 1 } else { end.row },
            });
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
    children
}

/// Where an expansion sends a child.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Route {
    /// Placed as trivia by the placement rule.
    Trivia,
    /// Stored in slot `slot`. `scalar` when the slot stores it as a unit
    /// variant, so it owns no trivia.
    Slot { slot: u16, scalar: bool },
    /// A separator of slot `slot`, stored nowhere. `tagged` when it carries
    /// the slot's own field: only those mark an elided slot's holes.
    Separator { slot: u16, tagged: bool },
    /// A token the kind's own template writes: skipped.
    Layout,
}

/// Why a read failed. Each names the node's kind and its row.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadError {
    /// A child the kind's model has no route for: a model gap, not data.
    Unrouted { kind: KindId, child: KindId, row: u32 },
    /// A required slot no child filled.
    Missing { kind: KindId, slot: &'static str, row: u32 },
    /// A second child for a slot that holds one.
    Overfull { kind: KindId, slot: &'static str, row: u32 },
    /// A node whose kind no member of the type it was read into takes.
    Unadmitted { kind: KindId, row: u32 },
    /// A token whose text does not match its kind's interior.
    Interior { kind: KindId, row: u32 },
    /// An enum kind whose spelling tokens display none of its members' ids.
    Unspelled { kind: KindId, row: u32 },
}

impl ReadError {
    /// The error as a sentence, kinds named by `name`.
    pub fn describe(&self, name: &dyn Fn(KindId) -> &'static str) -> String {
        match *self {
            ReadError::Unrouted { kind, child, row } => format!(
                "{} (kind {}) has no route for its child {} (kind {}) at row {row}",
                name(kind),
                kind.0,
                name(child),
                child.0
            ),
            ReadError::Missing { kind, slot, row } => {
                format!("{} (kind {}) at row {row} has no child for its required slot `{slot}`", name(kind), kind.0)
            }
            ReadError::Overfull { kind, slot, row } => {
                format!("{} (kind {}) at row {row} has a second child for its slot `{slot}`", name(kind), kind.0)
            }
            ReadError::Unadmitted { kind, row } => {
                format!("{} (kind {}) at row {row} is no member of the type it was read into", name(kind), kind.0)
            }
            ReadError::Interior { kind, row } => {
                format!("{} (kind {}) at row {row} does not match its token interior", name(kind), kind.0)
            }
            ReadError::Unspelled { kind, row } => {
                format!("{} (kind {}) at row {row}: its tokens display none of its members' ids", name(kind), kind.0)
            }
        }
    }
}

/// Where a slot sits, for the errors its read raises.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SlotSite {
    pub kind: KindId,
    pub slot: &'static str,
    pub row: u32,
}

/// One extra the placement rule gave a node: its coordinate, whether it
/// shares a row with its owner, and on a same-row trailing entry the
/// anonymous tokens between the owner and it.
#[derive(Debug, Clone, PartialEq)]
pub struct Entry {
    pub coord: NodeCoordinate,
    pub same_line: bool,
    pub tokens_between: u16,
}

impl Entry {
    pub fn into_trivia<T>(self) -> TriviaEntry<T> {
        TriviaEntry {
            value: SlotValue::Coord(self.coord),
            same_line: self.same_line,
            tokens_between: self.tokens_between,
        }
    }
}

/// What a node's parent placed on it: whether it owns trivia at all (named,
/// not an extra, at least a byte wide, and not stored as a unit variant),
/// and the extras placed before and after it.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Sides {
    pub owner: bool,
    pub leading: Vec<Entry>,
    pub trailing: Vec<Entry>,
}

impl Sides {
    /// A tree's root: it owns trivia, and nothing outside it placed any.
    pub fn root() -> Sides {
        Sides { owner: true, ..Sides::default() }
    }
}

/// A transport a node is read into: a kind's struct, a choice over kinds, or
/// an enum kind's members.
pub trait ReadTransport: Sized {
    /// Whether a node with these ids reads into this transport.
    fn admits(grammar: KindId, display: KindId) -> bool;
    /// Whether a child tagged with a slot's field is this slot's: a struct
    /// takes any named child, a choice or an enum its members.
    fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool;
    /// Whether a node with these ids is stored as a unit variant.
    fn scalar(grammar: KindId, display: KindId) -> bool {
        let _ = (grammar, display);
        false
    }
    /// What an optional slot of this type holds when no child came: the
    /// blank arm of a choice that has one, as a parsed node keeps its blank.
    fn blank() -> Option<Self> {
        None
    }
    /// Read the node the cursor is on. The cursor was created at the tree's
    /// root and ends where it started.
    fn read(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides) -> Result<Self, ReadError>;
    /// The sides the placement rule gives the child at `row` among the
    /// children of the node the cursor is on.
    fn sides_of(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, row: u32) -> Result<Sides, ReadError>;
}

impl<T: ReadTransport> ReadTransport for Box<T> {
    fn admits(grammar: KindId, display: KindId) -> bool {
        T::admits(grammar, display)
    }
    fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool {
        T::takes_tagged(grammar, display, named)
    }
    fn scalar(grammar: KindId, display: KindId) -> bool {
        T::scalar(grammar, display)
    }
    fn blank() -> Option<Self> {
        T::blank().map(Box::new)
    }
    fn read(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides) -> Result<Self, ReadError> {
        T::read(cursor, ctx, depth, sides).map(Box::new)
    }
    fn sides_of(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, row: u32) -> Result<Sides, ReadError> {
        T::sides_of(cursor, ctx, row)
    }
}

/// A transport with a layout, from which an envelope takes the layout its
/// content was read with. `L` is the layout type the envelope declares.
pub trait HasLayout<L> {
    fn take_layout(&mut self) -> L;
}

impl<L, T: HasLayout<L>> HasLayout<L> for Box<T> {
    fn take_layout(&mut self) -> L {
        (**self).take_layout()
    }
}

/// The value of the child at the cursor in a slot: read into its transport
/// within the depth, or, past it, inline when the child has no named child
/// (a leaf, a unit variant), else its coordinate.
pub fn read_value<T: ReadTransport, const A: bool>(
    cursor: &mut TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    depth: Depth,
    sides: Sides,
) -> Result<SlotValue<T, A>, ReadError> {
    match depth.below() {
        Some(below) => Ok(SlotValue::Transport(T::read(cursor, ctx, below, sides)?)),
        None if cursor.node().named_child_count() == 0 => Ok(SlotValue::Transport(T::read(cursor, ctx, Depth::ONE, sides)?)),
        None => Ok(SlotValue::Coord(ctx.coordinate(&cursor.node(), row_of(cursor)))),
    }
}

/// How a slot's field stores the children routed to it. Presence and text
/// slots route by their attributes, so their `admits` and `takes_tagged`
/// are never asked.
pub trait ReadSlot: Sized {
    type Acc;
    fn start() -> Self::Acc;
    fn admits(grammar: KindId, display: KindId) -> bool;
    fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool;
    fn scalar(grammar: KindId, display: KindId) -> bool;
    fn take(
        acc: &mut Self::Acc,
        cursor: &mut TreeCursor<'_>,
        ctx: &ReadCtx<'_>,
        depth: Depth,
        sides: Sides,
        at: SlotSite,
    ) -> Result<(), ReadError>;
    /// A separator between the slot's children.
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        let _ = (acc, tagged);
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError>;
}

fn take_one<V>(acc: &mut Option<V>, at: SlotSite, value: impl FnOnce() -> Result<V, ReadError>) -> Result<(), ReadError> {
    if acc.is_some() {
        return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, row: at.row });
    }
    *acc = Some(value()?);
    Ok(())
}

fn missing(at: SlotSite) -> ReadError {
    ReadError::Missing { kind: at.kind, slot: at.slot, row: at.row }
}

macro_rules! slot_value_kinds {
    () => {
        fn admits(grammar: KindId, display: KindId) -> bool {
            T::admits(grammar, display)
        }
        fn takes_tagged(grammar: KindId, display: KindId, named: bool) -> bool {
            T::takes_tagged(grammar, display, named)
        }
        fn scalar(grammar: KindId, display: KindId) -> bool {
            T::scalar(grammar, display)
        }
    };
}

impl<T: ReadTransport, const A: bool> ReadSlot for SlotValue<T, A> {
    type Acc = Option<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        None
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, at: SlotSite) -> Result<(), ReadError> {
        take_one(acc, at, || read_value(cursor, ctx, depth, sides))
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        acc.ok_or_else(|| missing(at))
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Option<SlotValue<T, A>> {
    type Acc = Option<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        None
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, at: SlotSite) -> Result<(), ReadError> {
        take_one(acc, at, || read_value(cursor, ctx, depth, sides))
    }
    /// With no child, the type's blank arm if it has one, else absent.
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(acc.or_else(|| T::blank().map(SlotValue::Transport)))
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Vec<SlotValue<T, A>> {
    type Acc = Vec<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Vec::new()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        if acc.is_empty() { Err(missing(at)) } else { Ok(acc) }
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Option<Vec<SlotValue<T, A>>> {
    type Acc = Vec<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Vec::new()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    /// Present even when empty: today's wrap stores an empty list.
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(Some(acc))
    }
}

/// An elided slot's children, in arrival order with its tagged separators.
/// With no separator every item is its own position; with separators each
/// separated segment is one position, its first item or a hole.
#[derive(Debug)]
pub struct Elided<V> {
    items: Vec<Option<V>>,
}

impl<V> Default for Elided<V> {
    fn default() -> Self {
        Self { items: Vec::new() }
    }
}

impl<V> Elided<V> {
    pub fn push(&mut self, value: V) {
        self.items.push(Some(value));
    }
    pub fn separator(&mut self, tagged: bool) {
        if tagged {
            self.items.push(None);
        }
    }
    pub fn positions(self) -> Vec<Option<V>> {
        if self.items.iter().all(Option::is_some) {
            return self.items;
        }
        let mut positions = Vec::new();
        let mut segment: Option<V> = None;
        for item in self.items {
            match item {
                Some(value) => {
                    if segment.is_none() {
                        segment = Some(value);
                    }
                }
                None => positions.push(segment.take()),
            }
        }
        positions.push(segment);
        positions
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Vec<Option<SlotValue<T, A>>> {
    type Acc = Elided<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Elided::default()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        acc.separator(tagged);
    }
    fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
        let positions = acc.positions();
        if positions.is_empty() { Err(missing(at)) } else { Ok(positions) }
    }
}

impl<T: ReadTransport, const A: bool> ReadSlot for Option<Vec<Option<SlotValue<T, A>>>> {
    type Acc = Elided<SlotValue<T, A>>;
    fn start() -> Self::Acc {
        Elided::default()
    }
    slot_value_kinds!();
    fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth, sides: Sides, _at: SlotSite) -> Result<(), ReadError> {
        acc.push(read_value(cursor, ctx, depth, sides)?);
        Ok(())
    }
    fn separator(acc: &mut Self::Acc, tagged: bool) {
        acc.separator(tagged);
    }
    fn finish(acc: Self::Acc, _at: SlotSite) -> Result<Self, ReadError> {
        Ok(Some(acc.positions()))
    }
}

/// A presence slot: `true` when its keyword is among the children, absent
/// otherwise. The keyword stays an owner of trivia, as today's model rows
/// have no entry for presence slots.
impl ReadSlot for Option<bool> {
    type Acc = bool;
    fn start() -> bool {
        false
    }
    fn admits(_: KindId, _: KindId) -> bool {
        false
    }
    fn takes_tagged(_: KindId, _: KindId, _: bool) -> bool {
        false
    }
    fn scalar(_: KindId, _: KindId) -> bool {
        false
    }
    fn take(acc: &mut bool, _: &mut TreeCursor<'_>, _: &ReadCtx<'_>, _: Depth, _: Sides, at: SlotSite) -> Result<(), ReadError> {
        if *acc {
            return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, row: at.row });
        }
        *acc = true;
        Ok(())
    }
    fn finish(acc: bool, _: SlotSite) -> Result<Self, ReadError> {
        Ok(acc.then_some(true))
    }
}

macro_rules! text_slot {
    ($ty:ty, $finish:expr) => {
        impl ReadSlot for $ty {
            type Acc = Option<String>;
            fn start() -> Self::Acc {
                None
            }
            fn admits(_: KindId, _: KindId) -> bool {
                false
            }
            fn takes_tagged(_: KindId, _: KindId, _: bool) -> bool {
                false
            }
            fn scalar(_: KindId, _: KindId) -> bool {
                false
            }
            fn take(acc: &mut Self::Acc, cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, _: Depth, _: Sides, at: SlotSite) -> Result<(), ReadError> {
                take_one(acc, at, || Ok(ctx.text(&cursor.node()).to_owned()))
            }
            fn finish(acc: Self::Acc, at: SlotSite) -> Result<Self, ReadError> {
                let finish: fn(Option<String>, SlotSite) -> Result<$ty, ReadError> = $finish;
                finish(acc, at)
            }
        }
    };
}

text_slot!(String, |acc, at| acc.ok_or_else(|| missing(at)));
text_slot!(Option<String>, |acc, _| Ok(acc));

/// The root of a whole-tree read inside the slot carrier a render root uses.
pub trait ReadRoot: Sized {
    fn read_root(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Self, ReadError>;
}

impl<T: ReadTransport, const A: bool> ReadRoot for SlotValue<T, A> {
    fn read_root(cursor: &mut TreeCursor<'_>, ctx: &ReadCtx<'_>, depth: Depth) -> Result<Self, ReadError> {
        Ok(SlotValue::Transport(T::read(cursor, ctx, depth, Sides::root())?))
    }
}

/// A token interior's pattern, compiled once, on first use. The expansion
/// already compiled it, so a pattern that does not compile never reaches here.
pub struct Interior {
    pattern: &'static str,
    compiled: OnceLock<regex::Regex>,
}

impl Interior {
    pub const fn new(pattern: &'static str) -> Self {
        Self { pattern, compiled: OnceLock::new() }
    }
    pub fn captures<'t>(&self, text: &'t str) -> Option<Captures<'t>> {
        self.compiled
            .get_or_init(|| regex::Regex::new(self.pattern).expect("the expansion compiled this pattern"))
            .captures(text)
    }
}

/// How an interior slot's field stores its named capture.
pub trait FromCapture: Sized {
    fn from_capture(capture: Option<&str>, at: SlotSite) -> Result<Self, ReadError>;
}

impl FromCapture for String {
    fn from_capture(capture: Option<&str>, at: SlotSite) -> Result<Self, ReadError> {
        capture.map(str::to_owned).ok_or_else(|| missing(at))
    }
}

impl FromCapture for Option<String> {
    fn from_capture(capture: Option<&str>, _: SlotSite) -> Result<Self, ReadError> {
        Ok(capture.map(str::to_owned))
    }
}

/// A flag: present when its group matched.
impl FromCapture for Option<bool> {
    fn from_capture(capture: Option<&str>, _: SlotSite) -> Result<Self, ReadError> {
        Ok(capture.map(|_| true))
    }
}

/// A capture slot's value.
pub fn capture<F: FromCapture>(captures: &Captures<'_>, name: &str, at: SlotSite) -> Result<F, ReadError> {
    F::from_capture(captures.name(name).map(|m| m.as_str()), at)
}

/// A delimiter flag's bit for a leading flank.
pub const LEADING: u8 = 1;
/// A delimiter flag's bit for a trailing flank.
pub const TRAILING: u8 = 2;

/// A list's delimiter flags, as today's `_hasSeparatorFlank` computes them.
/// `leading` and `trailing` are `Some(mandatory)` for each flank the kind
/// leaves optional, with the mandatory flank tokens on the other side. A
/// flank is present when the list spans past its first (last) item. Where
/// that item is a unit variant, the flank is present when the list holds
/// more anonymous unfielded tokens than the separators between its items and
/// the mandatory flank tokens account for.
pub fn delimiter(list: &Node<'_>, children: &[Child], routes: &[Route], items: u16, leading: Option<u16>, trailing: Option<u16>) -> u8 {
    let item_children: Vec<(&Child, bool)> = children
        .iter()
        .zip(routes)
        .filter_map(|(child, route)| match *route {
            Route::Slot { slot, scalar } if slot == items => Some((child, scalar)),
            _ => None,
        })
        .collect();
    let others = children
        .iter()
        .zip(routes)
        .filter(|(child, route)| !child.named && child.field.is_none() && !matches!(route, Route::Trivia | Route::Slot { .. }))
        .count();
    let flank = |anchor: Option<&(&Child, bool)>, mandatory: u16, past: &dyn Fn(&Child) -> bool| match anchor {
        Some((child, false)) => past(child),
        _ => others > item_children.len().saturating_sub(1) + mandatory as usize,
    };
    let (start, end) = (list.start_byte() as u32, list.end_byte() as u32);
    let mut bits = 0;
    if leading.is_some_and(|mandatory| flank(item_children.first(), mandatory, &|child| start < child.start)) {
        bits |= LEADING;
    }
    if trailing.is_some_and(|mandatory| flank(item_children.last(), mandatory, &|child| end > child.end)) {
        bits |= TRAILING;
    }
    bits
}

/// A list's separator kind, as today's `_separatorKindOf` reads it: the first
/// anonymous unfielded child among `candidates`. A kind with a declared
/// default falls back to it at its call site.
pub fn separator_kind(children: &[Child], routes: &[Route], candidates: &[KindId]) -> Option<u16> {
    children
        .iter()
        .zip(routes)
        .find(|(child, route)| {
            !child.named && child.field.is_none() && !matches!(route, Route::Slot { .. }) && candidates.contains(&child.grammar)
        })
        .map(|(child, _)| child.grammar.0)
}
```

In `lib.rs` add `pub mod read;` to the module list.

`slot.rs`, after the `SlotValue` impl block:

```rust
/// Two slot values are equal when they hold equal transports, or
/// coordinates naming the same node: the same tree, span and kind. A
/// coordinate may address its node by any handle its tree answers.
impl<T: PartialEq, const ADJACENT: bool> PartialEq for SlotValue<T, ADJACENT> {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::Transport(a), Self::Transport(b)) => a == b,
            (Self::Coord(a), Self::Coord(b)) => a.tree_id() == b.tree_id() && a.span == b.span && a.kind == b.kind,
            _ => false,
        }
    }
}
```

`layout.rs`: `#[derive(Debug, Clone, PartialEq)]` on `TransportLayout<T>`. `trivia.rs`: `#[derive(Debug, Clone, PartialEq)]` on `TriviaEntry<T>`, `TransportTrivia<T>` and `TriviaText`.

- [ ] **Step 4: Run the tests**

Run: `rtk cargo test -p sittir-core --no-default-features read::tests`
Expected: PASS, all twelve.

- [ ] **Step 5: Gates and commit**

Run `rtk cargo test --workspace --no-default-features` and `rtk cargo clippy -p sittir-core --no-default-features -- -D warnings`. Nothing generated changes.

```bash
git add rust/crates/sittir-core/src/read.rs
git commit -F msg -- rust/crates/sittir-core/src
```

Message: `feat(core): the typed reader's runtime: depth, survey, routes, slot storage, refusal`.

---

## Task 3: The trivia placement rule

Every extra gets one owner, by the rule `read_untyped_node::node_trivia` applies today. The typed reader applies it in a node's own pass over its children, not per child from its siblings. An owner is a child that is named, not trivia, at least one byte wide, and not stored as a unit variant. Among a node's children:

1. An extra on the row a previous owner ends on is that owner's trailing entry: same line, after the non-owner children between them, each counted (today's `extras_run` counts a unit variant as one too).
2. Otherwise, with a next owner, it is that owner's leading entry, same line when it ends on the row the owner starts.
3. Otherwise, with a previous owner, it is that owner's trailing entry: not same line, no tokens.
4. With no owner child at all, an extra goes to the inner gap the kind names for the count of non-trivia children before it (`gap(n) = slot`). Failing that, if the node owns trivia, it goes to the node's own leading entries when no named child precedes it, else its own trailing ones, same line. Today keeps these after the entries the parent placed, and so does the reader.

**Files:**
- Modify: `rust/crates/sittir-core/src/read.rs` (add `Placement`, `place`)
- Test: `rust/crates/sittir-core/src/read.rs` (unit tests on surveyed children built by hand)
- Test: `rust/crates/sittir-parity-tests/tests/typed_read.rs` (placement against `read_untyped_node` over real sources; the crate already depends on `sittir-rust`, `sittir-typescript` and `tree-sitter`)

**Interfaces:**
- Produces: `Placement { sides: Vec<Sides>, own_leading: Vec<Entry>, own_trailing: Vec<Entry>, inner: BTreeMap<String, Vec<Entry>> }` with `take(&mut self, i: usize) -> Sides`, `take_row(&mut self, row: u32) -> Option<Sides>`, `into_layout<T>(self, sides: Sides) -> Option<TransportLayout<T>>`; `place(ctx: &ReadCtx, children: &[Child], routes: &[Route], owner_self: bool, gap: fn(u16) -> Option<&'static str>) -> Placement`.

- [ ] **Step 1: Write the failing unit tests**

Add to the `tests` module in `read.rs`:

```rust
    fn child(row: u32, named: bool, trivia: bool, (start_row, end_row): (usize, usize), (start, end): (u32, u32)) -> Child {
        Child { row, grammar: KindId(if trivia { 900 } else if named { 100 } else { 50 }), display: KindId(0), field: None, named, trivia, start, end, start_row, end_row }
    }
    fn owner_routes(children: &[Child]) -> Vec<Route> {
        children.iter().map(|c| if c.trivia { Route::Trivia } else if c.named { Route::Slot { slot: 0, scalar: false } } else { Route::Layout }).collect()
    }
    fn no_gap(_: u16) -> Option<&'static str> {
        None
    }
    fn spans(entries: &[Entry]) -> Vec<(u32, bool, u16)> {
        entries.iter().map(|e| (e.coord.span.start, e.same_line, e.tokens_between)).collect()
    }

    #[test]
    fn an_extra_on_an_owners_last_row_trails_it_past_the_tokens_between() {
        // `a, // c` then on the next row `b`
        let children = [
            child(1, true, false, (0, 0), (0, 1)),   // a
            child(2, false, false, (0, 0), (1, 2)),  // ,
            child(3, false, true, (0, 0), (3, 7)),   // // c
            child(4, true, false, (1, 1), (8, 9)),   // b
        ];
        let ctx = ReadCtx::new("", 0);
        let placement = place(&ctx, &children, &owner_routes(&children), true, no_gap);
        assert_eq!(spans(&placement.sides[0].trailing), vec![(3, true, 1)]);
        assert!(placement.sides[3].leading.is_empty());
    }

    #[test]
    fn an_extra_on_its_own_row_leads_the_next_owner() {
        // `a` / `// c` / `b`
        let children = [
            child(1, true, false, (0, 0), (0, 1)),
            child(2, false, true, (1, 1), (2, 6)),
            child(3, true, false, (2, 2), (7, 8)),
        ];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, no_gap);
        assert!(placement.sides[0].trailing.is_empty());
        assert_eq!(spans(&placement.sides[2].leading), vec![(2, false, 0)]);
    }

    #[test]
    fn an_extra_after_the_last_owner_trails_it() {
        let children = [child(1, true, false, (0, 0), (0, 1)), child(2, false, true, (1, 1), (2, 6))];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, no_gap);
        assert_eq!(spans(&placement.sides[0].trailing), vec![(2, false, 0)]);
    }

    #[test]
    fn a_unit_variant_a_token_and_a_zero_width_node_own_nothing() {
        // `x // c`: x stored as a unit variant, then a zero-width named node, then the extra
        let children = [
            child(1, true, false, (0, 0), (0, 1)),
            child(2, true, false, (0, 0), (1, 1)),
            child(3, false, true, (0, 0), (2, 6)),
        ];
        let routes = [Route::Slot { slot: 0, scalar: true }, Route::Slot { slot: 1, scalar: false }, Route::Trivia];
        let placement = place(&ReadCtx::new("", 0), &children, &routes, true, no_gap);
        assert!(!placement.sides[0].owner && !placement.sides[1].owner);
        // no owner child: rule 4, a named child precedes, so the node's own trailing
        assert_eq!(spans(&placement.own_trailing), vec![(2, true, 0)]);
    }

    #[test]
    fn with_no_owner_child_an_extra_takes_the_inner_gap_its_kind_names() {
        // `{ /* c */ }`: `{`, extra, `}`
        let children = [
            child(1, false, false, (0, 0), (0, 1)),
            child(2, false, true, (0, 0), (2, 9)),
            child(3, false, false, (0, 0), (10, 11)),
        ];
        fn gap(preceding: u16) -> Option<&'static str> {
            (preceding == 1).then_some("statements")
        }
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, gap);
        assert_eq!(spans(&placement.inner["statements"]), vec![(2, false, 0)]);
        assert!(placement.own_leading.is_empty() && placement.own_trailing.is_empty());
    }

    #[test]
    fn a_node_that_owns_nothing_keeps_no_extra_of_its_own() {
        let children = [child(1, false, true, (0, 0), (0, 4))];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), false, no_gap);
        assert!(placement.own_leading.is_empty() && placement.own_trailing.is_empty() && placement.inner.is_empty());
    }

    #[test]
    fn an_error_child_is_placed_as_trivia() {
        // an ERROR is surveyed with `trivia: true`; it leads the next owner like an extra
        let children = [child(1, true, true, (0, 0), (0, 3)), child(2, true, false, (1, 1), (4, 5))];
        let placement = place(&ReadCtx::new("", 0), &children, &owner_routes(&children), true, no_gap);
        assert_eq!(spans(&placement.sides[1].leading), vec![(0, false, 0)]);
    }

    #[test]
    fn the_parents_entries_come_before_the_nodes_own() {
        let children = [child(1, true, false, (0, 0), (0, 1)), child(2, false, true, (0, 0), (2, 6))];
        let routes = [Route::Slot { slot: 0, scalar: true }, Route::Trivia];
        let placement = place(&ReadCtx::new("", 0), &children, &routes, true, no_gap);
        let parent = Sides {
            owner: true,
            leading: vec![],
            trailing: vec![Entry { coord: NodeCoordinate::new(0, Span { start: 40, end: 44 }), same_line: true, tokens_between: 0 }],
        };
        let layout = placement.into_layout::<()>(parent).expect("entries");
        let trailing = layout.trivia.unwrap().trailing.unwrap();
        assert_eq!(trailing.iter().map(|e| e.value.coord().unwrap().span.start).collect::<Vec<_>>(), vec![40, 2]);
    }
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-core --no-default-features read::tests`
Expected: FAIL to compile (`place`, `Placement` not found).

- [ ] **Step 3: Implement**

Add to `read.rs`:

```rust
/// Where the placement rule puts the extras among one node's children: the
/// sides each child receives, and the node's own entries when no child owns
/// any.
#[derive(Debug, Default)]
pub struct Placement {
    pub sides: Vec<Sides>,
    pub own_leading: Vec<Entry>,
    pub own_trailing: Vec<Entry>,
    pub inner: BTreeMap<String, Vec<Entry>>,
    rows: Vec<u32>,
}

impl Placement {
    /// The sides of child `i`, taken out.
    pub fn take(&mut self, i: usize) -> Sides {
        std::mem::take(&mut self.sides[i])
    }

    /// The sides of the child at `row`, taken out.
    pub fn take_row(&mut self, row: u32) -> Option<Sides> {
        let i = self.rows.iter().position(|&r| r == row)?;
        Some(self.take(i))
    }

    /// The node's layout: what its parent placed, then its own entries.
    /// `None` when it holds no entry, as today's read stores no trivia then.
    pub fn into_layout<T>(self, sides: Sides) -> Option<TransportLayout<T>> {
        let leading: Vec<TriviaEntry<T>> = sides.leading.into_iter().chain(self.own_leading).map(Entry::into_trivia).collect();
        let trailing: Vec<TriviaEntry<T>> = sides.trailing.into_iter().chain(self.own_trailing).map(Entry::into_trivia).collect();
        let inner: BTreeMap<String, Vec<TriviaEntry<T>>> = self
            .inner
            .into_iter()
            .map(|(key, entries)| (key, entries.into_iter().map(Entry::into_trivia).collect()))
            .collect();
        if leading.is_empty() && trailing.is_empty() && inner.is_empty() {
            return None;
        }
        let some = |entries: Vec<TriviaEntry<T>>| (!entries.is_empty()).then_some(entries);
        Some(TransportLayout {
            trivia: Some(TransportTrivia { leading: some(leading), trailing: some(trailing), inner: (!inner.is_empty()).then_some(inner) }),
            edges: None,
            gap: None,
            flank: None,
        })
    }
}

/// Place every extra among a node's children (see the rule at
/// `read_untyped_node::node_trivia`, which this reproduces). `owner_self` is
/// whether the node itself owns trivia; `gap` names the inner gap at a count
/// of preceding non-trivia children.
pub fn place(ctx: &ReadCtx<'_>, children: &[Child], routes: &[Route], owner_self: bool, gap: fn(u16) -> Option<&'static str>) -> Placement {
    let owner = |i: usize| {
        let child = &children[i];
        child.named && !child.trivia && child.width() > 0 && !matches!(routes[i], Route::Slot { scalar: true, .. })
    };
    let entry = |child: &Child, same_line: bool, tokens_between: u16| Entry { coord: ctx.coordinate_of(child), same_line, tokens_between };
    let mut placement = Placement {
        sides: (0..children.len()).map(|i| Sides { owner: owner(i), ..Sides::default() }).collect(),
        rows: children.iter().map(|child| child.row).collect(),
        ..Placement::default()
    };
    let owners: Vec<usize> = (0..children.len()).filter(|&i| owner(i)).collect();
    if owners.is_empty() {
        let mut preceding: u16 = 0;
        let mut named_before = false;
        for child in children {
            if !child.trivia {
                preceding += 1;
                named_before |= child.named;
            } else if let Some(key) = gap(preceding) {
                placement.inner.entry(key.to_string()).or_default().push(entry(child, false, 0));
            } else if owner_self {
                let side = if named_before { &mut placement.own_trailing } else { &mut placement.own_leading };
                side.push(entry(child, true, 0));
            }
        }
        return placement;
    }
    for (k, &o) in owners.iter().enumerate() {
        let previous = k.checked_sub(1).map(|j| owners[j]);
        let next = owners.get(k + 1).copied();
        for child in &children[previous.map_or(0, |p| p + 1)..o] {
            let trails_previous = previous.is_some_and(|p| children[p].end_row == child.start_row);
            if child.trivia && !trails_previous {
                placement.sides[o].leading.push(entry(child, child.end_row == children[o].start_row, 0));
            }
        }
        let mut tokens: u16 = 0;
        for child in &children[o + 1..next.unwrap_or(children.len())] {
            if !child.trivia {
                tokens += 1;
            } else if children[o].end_row == child.start_row {
                placement.sides[o].trailing.push(entry(child, true, tokens));
            } else if next.is_none() {
                placement.sides[o].trailing.push(entry(child, false, 0));
            }
        }
    }
    placement
}
```

- [ ] **Step 4: Run the unit tests**

Run: `rtk cargo test -p sittir-core --no-default-features read::tests`
Expected: PASS.

- [ ] **Step 5: Check placement against today's read on real sources**

The rule is the risky part, so it is checked against `read_untyped_node` before any macro exists. A driver walks a whole tree with one cursor and places each node's extras. Owners are decided by today's model rows (`ReadModel::stores_scalar`, generated per grammar), and every placement is compared with `read_untyped_node`'s deep read, entry by entry. For each extra, its owner's span, its position (leading, trailing or inner key), `same_line` and `tokens_between` must match. Today widens the root's span to the whole source (`widen_to_whole_source`), so the driver records the root under `(0, source.len())` too.

```rust
// rust/crates/sittir-parity-tests/tests/typed_read.rs
use sittir_core::read::{place, survey, Child, Entry, ReadCtx, Route, Sides};
use sittir_core::read_untyped_node::{read_untyped_node, NoMint, ReadDepth, ReadModel};
use sittir_core::types::{FieldValue, KindId, UntypedNode};
use std::collections::BTreeSet;

/// One extra's placement: its owner's span, its position (`leading`,
/// `trailing` or `inner:<key>`), its own span, `same_line`, `tokens_between`.
type Placed = BTreeSet<(u32, u32, String, u32, u32, bool, u16)>;

fn parse(language: &tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// Every extra's placement in today's deep read.
fn today(source: &str, language: &tree_sitter::Language, model: &dyn ReadModel) -> Placed {
    let tree = parse(language, source);
    let root = read_untyped_node(&tree, source, None, None, ReadDepth::Deep, model, &mut NoMint);
    let mut placed = Placed::new();
    fn visit(node: &UntypedNode, placed: &mut Placed) {
        let span = node.span.expect("a read node has a span");
        if let Some(trivia) = &node.trivia_data {
            let mut add = |position: String, entries: &[UntypedNode]| {
                for e in entries {
                    let s = e.span.expect("an extra has a span");
                    placed.insert((span.start, span.end, position.clone(), s.start, s.end, e.same_line, e.tokens_between));
                }
            };
            add("leading".into(), trivia.leading.as_deref().unwrap_or_default());
            add("trailing".into(), trivia.trailing.as_deref().unwrap_or_default());
            for (key, entries) in trivia.inner.iter().flatten() {
                add(format!("inner:{key}"), entries);
            }
        }
        for value in node.fields.iter().flat_map(|fields| fields.values()) {
            match value {
                FieldValue::Single(child) => visit(child, placed),
                FieldValue::Multiple(children) => children.iter().flatten().for_each(|child| visit(child, placed)),
                FieldValue::Text(_) | FieldValue::Bool(_) => {}
            }
        }
        for child in node.children.iter().flatten() {
            visit(child, placed);
        }
    }
    visit(&root, &mut placed);
    placed
}

/// The same placements from `place`, owners decided by today's model rows.
fn typed(source: &str, language: &tree_sitter::Language, model: &dyn ReadModel, gap: fn(u16) -> Option<&'static str>) -> Placed {
    let tree = parse(language, source);
    let ctx = ReadCtx::new(source, 0);
    let mut placed = Placed::new();
    walk(&mut tree.walk(), &ctx, language, model, gap, (0, source.len() as u32), Sides::root(), &mut placed);
    placed
}

// `place` takes a plain `fn` for the inner gaps and `inner_gap_key` needs the
// node's kind, so the driver sets the kind here before each `place` call.
thread_local!(static KIND: std::cell::Cell<KindId> = const { std::cell::Cell::new(KindId(0)) });

fn rust_gap(preceding: u16) -> Option<&'static str> {
    KIND.with(|k| sittir_rust::render::kind_ids::inner_gap_key(k.get(), preceding))
}

fn typescript_gap(preceding: u16) -> Option<&'static str> {
    KIND.with(|k| sittir_typescript::render::kind_ids::inner_gap_key(k.get(), preceding))
}

/// Place the extras among the children of the node the cursor is on, record
/// them under `span`, and recurse into each non-trivia child with its sides.
#[allow(clippy::too_many_arguments)]
fn walk(
    cursor: &mut tree_sitter::TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    language: &tree_sitter::Language,
    model: &dyn ReadModel,
    gap: fn(u16) -> Option<&'static str>,
    span: (u32, u32),
    sides: Sides,
    placed: &mut Placed,
) {
    let kind = KindId(cursor.node().grammar_id());
    let children = survey(cursor);
    let routes: Vec<Route> = children
        .iter()
        .map(|c: &Child| {
            if c.trivia {
                Route::Trivia
            } else if c.named {
                let field = c.field.and_then(|f| language.field_name_for_id(f.0));
                Route::Slot { slot: 0, scalar: model.stores_scalar(kind, field, c.grammar) }
            } else {
                Route::Layout
            }
        })
        .collect();
    KIND.with(|k| k.set(kind));
    let mut placement = place(ctx, &children, &routes, sides.owner, gap);
    let mut record = |position: &str, entries: &[Entry]| {
        for e in entries {
            placed.insert((span.0, span.1, position.to_string(), e.coord.span.start, e.coord.span.end, e.same_line, e.tokens_between));
        }
    };
    record("leading", &sides.leading);
    record("trailing", &sides.trailing);
    record("leading", &placement.own_leading);
    record("trailing", &placement.own_trailing);
    for (key, entries) in &placement.inner {
        record(&format!("inner:{key}"), entries);
    }
    if cursor.goto_first_child() {
        let mut i = 0;
        loop {
            if !children[i].trivia {
                let child_span = (children[i].start, children[i].end);
                walk(cursor, ctx, language, model, gap, child_span, placement.take(i), placed);
            }
            i += 1;
            if !cursor.goto_next_sibling() {
                break;
            }
        }
        cursor.goto_parent();
    }
}

fn probe_input(name: &str) -> String {
    let path = format!(
        "{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}",
        env!("CARGO_MANIFEST_DIR")
    );
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

/// Every placement only one side made, all of them, with their counts.
fn assert_same_placement(typed: &Placed, today: &Placed, input: &str) {
    let only_typed: Vec<_> = typed.difference(today).collect();
    let only_today: Vec<_> = today.difference(typed).collect();
    assert!(
        only_typed.is_empty() && only_today.is_empty(),
        "{input}: {} placed only by the reader {only_typed:?}; {} only by today's read {only_today:?}",
        only_typed.len(),
        only_today.len()
    );
}

#[test]
fn placement_matches_todays_read_on_the_rust_probe_inputs() {
    let language = sittir_rust::language();
    let model = sittir_rust::RustGrammar;
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        assert_same_placement(&typed(&source, &language, &model, rust_gap), &today(&source, &language, &model), name);
    }
}

#[test]
fn placement_matches_todays_read_on_the_typescript_probe_input() {
    let language = sittir_typescript::language();
    let model = sittir_typescript::TypeScriptGrammar;
    let source = probe_input("create-engine.ts");
    assert_same_placement(&typed(&source, &language, &model, typescript_gap), &today(&source, &language, &model), "create-engine.ts");
}
```

`sittir_rust::RustGrammar` and `sittir_typescript::TypeScriptGrammar` implement `ReadModel` in their generated `lib.rs`, without the napi feature the parity crate leaves off. The probe inputs are real source files, commented throughout, and the typescript one holds zero-width `automatic_semicolon` nodes. The unit tests above pin each rule on its own; Task 10's corpus harness covers the rest of the five grammars.

- [ ] **Step 6: Run the placement test**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read placement_matches`
Expected: PASS. A difference is a defect in `place` or in the driver, never in today's read. If one survives a check of both, stop and report it with the entry, the extra's span and both placements.

- [ ] **Step 7: Gates and commit**

`rtk cargo test --workspace --no-default-features`; clippy on `sittir-core`.

```bash
git add rust/crates/sittir-parity-tests/tests/typed_read.rs
git commit -F msg -- rust/crates/sittir-core/src/read.rs rust/crates/sittir-parity-tests/tests/typed_read.rs
```

Message: `feat(core): the trivia placement rule in the reader's own pass`.

---

## Task 4: The derive crate and the routed struct

The derive reads only its declaration: the helper attributes and the field types. A struct with slots expands into a router (`__route`), which turns each surveyed child into a `Route`, and a `ReadTransport` impl, which surveys, routes, places, stores and refuses. This task covers routed structs and text leaves. Task 5 adds choices and enum kinds, Task 6 interiors and envelopes, and Task 7 a list's flank and separator fields.

A struct routes each child in this order:

1. Trivia (an extra, or an `ERROR`) is placed.
2. A child tagged with a field goes to the slot that names the field, if that slot takes it:
   - a presence slot takes its keyword;
   - a text slot takes any child that is not a layout token or one of its separators;
   - a node slot takes what its type takes: for a struct, any named child.
3. An untagged child goes to the one slot that takes untagged children and whose type admits it.
4. Otherwise, a child that is one of a slot's separators is that slot's separator. It is tagged when it carries the slot's own field, as the punctuation today's `dropWireDelimiters` strips does.
5. Otherwise, a layout token is skipped.
6. Otherwise the read is refused.

A presence keyword is routed before the layout check because a template can write the keyword it gates.

A text leaf reads the text it spans when its children tile that span (none, or contiguous non-trivia tokens from its start to its end), as today's `$text` and `_tiledSpelling` do. Otherwise, and when the span is empty, it reads its kind's fixed text (`text = "…"`), or the empty string, as today's leaf decode does. The spec names a leaf spelled by its tokens `spelled`; such a leaf reads the same text through this one mode, so codegen emits `text` for both.

**Files:**
- Create: `rust/crates/sittir-transport-macros/Cargo.toml`, `src/lib.rs`, `src/attrs.rs`, `src/expand.rs`
- Modify: `rust/crates/sittir-core/Cargo.toml`, `rust/crates/sittir-core/src/lib.rs`
- Test: `rust/crates/sittir-parity-tests/tests/typed_read.rs`

**Interfaces:**
- Consumes: Task 2's runtime (`ReadTransport`, `ReadSlot`, `HasLayout`, `survey`, `row_of`, `tiles`, `Route`, `ReadError`, `SlotSite`, `Sides`), Task 3's `place` and `Placement`, Task 1's `field_ids`.
- Produces: `#[derive(sittir_core::Transport)]` with these helper attributes.
  - On a struct or enum: `#[transport(kind = PATH [, display] [, min_depth = N] [, layout = [PATH, …]] [, gap(N) = slot]* [, text [= "fixed"]] [, interior = "regex"] [, envelope, content = field] [, list, item = field])]`; `#[transport(choice)]` on a choice; `#[transport(kind = PATH [, spelled])]` on an enum kind.
  - On a field: `#[slot]`, or `#[slot(field = PATH | field = [PATH, …] [, untagged] [, presence = PATH] [, separator = PATH | separator = [PATH, …]] [, capture = "name"] [, scalar])]`; `#[flank(leading = N, trailing = N)]`; `#[separator_kind(candidates = [PATH, …] [, default = PATH])]`.
  - On a variant: `#[kind(PATH, … [, display])]`, or `#[transport(blank)]`.
  - A field of type `Option<…TransportLayout…>` is the layout field. Any other field with no helper attribute reads as its `Default`.

- [ ] **Step 1: Write the failing tests**

The tests declare a small model of rust's `function_item` by hand, against the real parser and the generated constants. That proves the expansion before codegen emits a single attribute. The layout type takes `()` as its trivia type, because trivia entries are always coordinates. Task 3's code in the same file already imports `ReadCtx`, `Sides` and `KindId` and defines `parse`.

```rust
// append to rust/crates/sittir-parity-tests/tests/typed_read.rs
use sittir_core::read::{Depth, ReadError, ReadTransport};
use sittir_core::{SlotValue, Transport};
use sittir_rust::render::{field_ids as field, kind_ids as kind};
use sittir_typescript::render::kind_ids as ts;

type Layout = Option<sittir_core::layout::TransportLayout<()>>;

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::IDENTIFIER, text)]
struct Ident {
    layout: Layout,
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN])]
struct Params {
    layout: Layout,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::BLOCK, layout = [kind::LBRACE, kind::RBRACE], gap(1) = statements)]
struct Block {
    layout: Layout,
    #[slot(field = field::STATEMENTS)]
    statements: Option<Vec<SlotValue<Function>>>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD])]
struct Function {
    layout: Layout,
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

/// `Function` with no route for its body: every function is refused.
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD])]
struct FunctionWithoutBody {
    layout: Layout,
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::SOURCE_FILE, gap(0) = statements)]
struct File {
    layout: Layout,
    #[slot(field = field::STATEMENTS)]
    statements: Option<Vec<SlotValue<Function>>>,
}

/// A zero-width node read as a text leaf: its span is empty, so it reads as its fixed text.
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::_AUTOMATIC_SEMICOLON, text = ";")]
struct Inserted {
    layout: Layout,
    text: String,
}

fn parse_rust(source: &str) -> tree_sitter::Tree {
    parse(&sittir_rust::language(), source)
}

/// Read the tree's root into `T`, as tree 7.
fn read<T: ReadTransport>(tree: &tree_sitter::Tree, source: &str, depth: Depth) -> Result<T, ReadError> {
    T::read(&mut tree.walk(), &ReadCtx::new(source, 7), depth, Sides::root())
}

/// A cursor on the `nth` node of grammar kind `kind`, in pre-order.
fn find(tree: &tree_sitter::Tree, kind: KindId, nth: usize) -> tree_sitter::TreeCursor<'_> {
    let mut cursor = tree.walk();
    let mut seen = 0;
    for row in 0..tree.root_node().descendant_count() {
        cursor.goto_descendant(row);
        if cursor.node().grammar_id() == kind.0 {
            if seen == nth {
                return cursor;
            }
            seen += 1;
        }
    }
    panic!("no node {nth} of kind {kind:?}");
}

/// Read the `nth` node of kind `kind` into `T`, as tree 7, as an owner no parent placed trivia on.
fn read_nth<T: ReadTransport>(
    tree: &tree_sitter::Tree,
    source: &str,
    kind: KindId,
    nth: usize,
    depth: Depth,
) -> Result<T, ReadError> {
    T::read(&mut find(tree, kind, nth), &ReadCtx::new(source, 7), depth, Sides::root())
}

fn function(file: &File, i: usize) -> &Function {
    file.statements.as_ref().unwrap()[i].transport().expect("read within the depth")
}

/// One side's entries, or one inner gap's, as (start, end, same_line, tokens_between).
fn trivia_spans(layout: &Layout, side: &str) -> Vec<(u32, u32, bool, u16)> {
    let trivia = layout.as_ref().and_then(|l| l.trivia.as_ref());
    let entries = match side {
        "leading" => trivia.and_then(|t| t.leading.clone()),
        "trailing" => trivia.and_then(|t| t.trailing.clone()),
        key => trivia.and_then(|t| t.inner.as_ref()?.get(key).cloned()),
    };
    entries
        .unwrap_or_default()
        .iter()
        .map(|e| {
            let c = e.value.coord().expect("trivia is a coordinate");
            (c.span.start, c.span.end, e.same_line, e.tokens_between)
        })
        .collect()
}

#[test]
fn a_function_reads_into_its_slots_with_its_layout_tokens_skipped() {
    let source = "fn f() {}";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let f = function(&file, 0);
    assert_eq!(f.name.transport().unwrap().text, "f");
    assert_eq!(f.body.transport().unwrap().statements, Some(vec![]));
    assert_eq!((&f.layout, &file.layout), (&None, &None));
}

#[test]
fn a_child_no_route_takes_refuses_the_read_naming_kind_child_and_row() {
    let source = "fn f() {}";
    let tree = parse_rust(source);
    let refused = read_nth::<FunctionWithoutBody>(&tree, source, kind::FUNCTION_ITEM, 0, Depth::All).unwrap_err();
    let ReadError::Unrouted { kind: parent, child, row } = refused else { panic!("{refused:?}") };
    assert_eq!((parent, child), (kind::FUNCTION_ITEM, kind::BLOCK));
    let mut at = tree.walk();
    at.goto_descendant(row as usize);
    assert_eq!(at.node().grammar_id(), kind::BLOCK.0);
}

#[test]
fn past_the_depth_a_child_with_structure_is_its_coordinate() {
    let source = "fn f() { fn g() {} }";
    let tree = parse_rust(source);
    let shallow: File = read(&tree, source, Depth::ONE).unwrap();
    let coord = shallow.statements.as_ref().unwrap()[0].coord().expect("a coordinate at depth one");
    assert_eq!((coord.span.start, coord.span.end, coord.kind), (0, 20, Some(kind::FUNCTION_ITEM)));
    assert_eq!(coord.tree_id(), 7);
    let two: File = read(&tree, source, Depth::Levels(std::num::NonZeroU32::new(2).unwrap())).unwrap();
    let f = function(&two, 0);
    assert_eq!(f.name.transport().unwrap().text, "f", "a leaf is inline");
    assert!(f.body.coord().is_some(), "a block holding a function is past the depth");
}

#[test]
fn comments_take_their_owners_by_the_placement_rule() {
    // rust's line_comment ends before its newline: `// a` is 0..4, `// b` is 15..19
    let source = "// a\nfn f() {} // b\n";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let f = function(&file, 0);
    assert_eq!(trivia_spans(&f.layout, "leading"), vec![(0, 4, false, 0)]);
    assert_eq!(trivia_spans(&f.layout, "trailing"), vec![(15, 19, true, 0)]);
}

#[test]
fn a_comment_in_an_empty_block_takes_the_blocks_inner_gap() {
    let source = "fn f() { /* c */ }";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let block = function(&file, 0).body.transport().unwrap();
    assert_eq!(trivia_spans(&block.layout, "statements"), vec![(9, 16, false, 0)]);
}

#[test]
fn a_file_of_comments_keeps_them_in_its_own_gap() {
    let source = "// only\n";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    assert_eq!(file.statements, Some(vec![]));
    assert_eq!(trivia_spans(&file.layout, "statements"), vec![(0, 7, false, 0)]);
}

#[test]
fn an_error_inside_a_node_is_trivia() {
    let source = "fn f() { @ }";
    let file: File = read(&parse_rust(source), source, Depth::All).unwrap();
    let block = function(&file, 0).body.transport().unwrap();
    let inner = block.layout.as_ref().unwrap().trivia.as_ref().unwrap().inner.as_ref().unwrap();
    assert_eq!(inner["statements"][0].value.coord().unwrap().kind, Some(kind::ERROR));
}

#[test]
fn a_missing_token_routes_as_its_kind() {
    // the parser closes the parameters with a zero-width MISSING `)`, one of their layout tokens
    let source = "fn f( {}";
    let tree = parse_rust(source);
    assert!(find(&tree, kind::RPAREN, 0).node().is_missing());
    let file: File = read(&tree, source, Depth::All).unwrap();
    assert_eq!(function(&file, 0).parameters.transport().unwrap().layout, None);
}

#[test]
fn a_text_leaf_that_spans_nothing_reads_as_its_fixed_text() {
    let source = "let x = 1\n";
    let tree = parse(&sittir_typescript::language(), source);
    let inserted: Inserted = read_nth(&tree, source, ts::_AUTOMATIC_SEMICOLON, 0, Depth::ONE).unwrap();
    assert_eq!(inserted.text, ";");
}
```

Every source shape above was checked with the generated parsers (`packages/<g>/.sittir/parser.wasm`):

- `fn f() { @ }` puts one `ERROR` (an extra) inside the block.
- `fn f( {}` closes `parameters` with a MISSING `)`.
- `fn f() {` is a root `ERROR`, so it is not used.
- typescript's `let x = 1` ends in a named zero-width `automatic_semicolon`.

The inner gap keys come from `inner_gap_key`'s rows `(176, 0)` and `(313, 1)` in `render/kind_ids.rs`.

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: FAIL to compile (`Transport` is not a derive in `sittir_core`).

- [ ] **Step 3: Create the crate**

`rust/crates/sittir-transport-macros/Cargo.toml` (the workspace's `members = ["rust/crates/*"]` picks it up):

```toml
[package]
name = "sittir-transport-macros"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
repository.workspace = true
description = "The derive that expands a sittir transport declaration into its typed reader."

[lib]
proc-macro = true

[dependencies]
proc-macro2 = "1"
quote = "1"
regex = "1"
syn = { version = "2", features = ["full"] }
```

`src/lib.rs`:

```rust
//! `#[derive(Transport)]`: expands a sittir transport declaration (a kind's
//! struct, a choice over kinds, or an enum kind's members) into its typed
//! reader, `sittir_core::read::ReadTransport`. Every decision comes from the
//! helper attributes codegen stamps and from the field types; the expansion
//! looks nothing up.

mod attrs;
mod expand;

#[proc_macro_derive(Transport, attributes(transport, slot, kind, flank, separator_kind))]
pub fn derive_transport(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = syn::parse_macro_input!(input as syn::DeriveInput);
    expand::derive(&input).unwrap_or_else(syn::Error::into_compile_error).into()
}
```

`src/attrs.rs` (complete; later tasks only consume it):

```rust
//! The helper attributes, parsed into plain values.

use syn::ext::IdentExt;
use syn::parse::ParseStream;
use syn::punctuated::Punctuated;
use syn::{Attribute, Ident, LitInt, LitStr, Path, Token};

/// `#[transport(…)]` on a struct, an enum or a variant.
#[derive(Default)]
pub struct KindAttrs {
    pub kind: Option<Path>,
    pub display: bool,
    pub choice: bool,
    pub spelled: bool,
    pub blank: bool,
    pub min_depth: Option<u32>,
    pub layout: Vec<Path>,
    pub gaps: Vec<(u16, String)>,
    /// `text`, or `text = "…"`: a leaf read as its text, with the fixed text
    /// it reads as when its span is empty or its tokens do not tile it.
    pub text: Option<Option<LitStr>>,
    pub interior: Option<LitStr>,
    pub envelope: bool,
    pub content: Option<Ident>,
    pub list: bool,
    pub item: Option<Ident>,
}

/// `#[slot]` or `#[slot(…)]` on a field.
#[derive(Default)]
pub struct SlotAttrs {
    pub fields: Vec<Path>,
    pub untagged: bool,
    pub presence: Option<Path>,
    pub separators: Vec<Path>,
    pub capture: Option<LitStr>,
    pub scalar: bool,
}

/// `#[kind(…)]` on a variant: the ids it claims, display ids when marked.
pub struct VariantKinds {
    pub kinds: Vec<Path>,
    pub display: bool,
}

/// `#[flank(leading = N, trailing = N)]`: the flanks a list's delimiter
/// flags check, each with the mandatory flank tokens on the other side.
#[derive(Default)]
pub struct FlankAttrs {
    pub leading: Option<u16>,
    pub trailing: Option<u16>,
}

/// `#[separator_kind(candidates = […], default = …)]`.
pub struct SeparatorKindAttrs {
    pub candidates: Vec<Path>,
    pub default: Option<Path>,
}

fn key(path: &Path) -> String {
    path.get_ident().map(Ident::to_string).unwrap_or_default()
}

/// `[PATH, …]`, or one `PATH`.
fn paths(input: ParseStream) -> syn::Result<Vec<Path>> {
    if input.peek(syn::token::Bracket) {
        let content;
        syn::bracketed!(content in input);
        Ok(Punctuated::<Path, Token![,]>::parse_terminated(&content)?.into_iter().collect())
    } else {
        Ok(vec![input.parse()?])
    }
}

pub fn kind_attrs(attrs: &[Attribute]) -> syn::Result<KindAttrs> {
    let mut out = KindAttrs::default();
    for attr in attrs.iter().filter(|a| a.path().is_ident("transport")) {
        attr.parse_nested_meta(|meta| {
            match key(&meta.path).as_str() {
                "kind" => out.kind = Some(meta.value()?.parse()?),
                "display" => out.display = true,
                "choice" => out.choice = true,
                "spelled" => out.spelled = true,
                "blank" => out.blank = true,
                "min_depth" => out.min_depth = Some(meta.value()?.parse::<LitInt>()?.base10_parse()?),
                "layout" => out.layout = paths(meta.value()?)?,
                "gap" => {
                    let content;
                    syn::parenthesized!(content in meta.input);
                    let preceding: u16 = content.parse::<LitInt>()?.base10_parse()?;
                    let slot = meta.value()?.call(Ident::parse_any)?;
                    out.gaps.push((preceding, slot.unraw().to_string()));
                }
                "text" => out.text = Some(if meta.input.peek(Token![=]) { Some(meta.value()?.parse()?) } else { None }),
                "interior" => out.interior = Some(meta.value()?.parse()?),
                "envelope" => out.envelope = true,
                "content" => out.content = Some(meta.value()?.parse()?),
                "list" => out.list = true,
                "item" => out.item = Some(meta.value()?.parse()?),
                _ => return Err(meta.error("unknown `transport` attribute")),
            }
            Ok(())
        })?;
    }
    Ok(out)
}

pub fn slot_attrs(attrs: &[Attribute]) -> syn::Result<Option<SlotAttrs>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("slot")) else { return Ok(None) };
    let mut out = SlotAttrs::default();
    if matches!(attr.meta, syn::Meta::Path(_)) {
        return Ok(Some(out));
    }
    attr.parse_nested_meta(|meta| {
        match key(&meta.path).as_str() {
            "field" => out.fields.extend(paths(meta.value()?)?),
            "untagged" => out.untagged = true,
            "presence" => out.presence = Some(meta.value()?.parse()?),
            "separator" => out.separators.extend(paths(meta.value()?)?),
            "capture" => out.capture = Some(meta.value()?.parse()?),
            "scalar" => out.scalar = true,
            _ => return Err(meta.error("unknown `slot` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

pub fn variant_kinds(attrs: &[Attribute]) -> syn::Result<Option<VariantKinds>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("kind")) else { return Ok(None) };
    let mut out = VariantKinds { kinds: Vec::new(), display: false };
    for path in attr.parse_args_with(Punctuated::<Path, Token![,]>::parse_terminated)? {
        if path.is_ident("display") {
            out.display = true;
        } else {
            out.kinds.push(path);
        }
    }
    if out.kinds.is_empty() {
        return Err(syn::Error::new_spanned(attr, "`kind` names at least one kind"));
    }
    Ok(Some(out))
}

pub fn flank_attrs(attrs: &[Attribute]) -> syn::Result<Option<FlankAttrs>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("flank")) else { return Ok(None) };
    let mut out = FlankAttrs::default();
    attr.parse_nested_meta(|meta| {
        let mandatory: u16 = meta.value()?.parse::<LitInt>()?.base10_parse()?;
        match key(&meta.path).as_str() {
            "leading" => out.leading = Some(mandatory),
            "trailing" => out.trailing = Some(mandatory),
            _ => return Err(meta.error("unknown `flank` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

pub fn separator_kind_attrs(attrs: &[Attribute]) -> syn::Result<Option<SeparatorKindAttrs>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("separator_kind")) else { return Ok(None) };
    let mut out = SeparatorKindAttrs { candidates: Vec::new(), default: None };
    attr.parse_nested_meta(|meta| {
        match key(&meta.path).as_str() {
            "candidates" => out.candidates = paths(meta.value()?)?,
            "default" => out.default = Some(meta.value()?.parse()?),
            _ => return Err(meta.error("unknown `separator_kind` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}
```

`src/expand.rs`: the struct half. Task 5 adds `choice` and `members`, Task 6 the interior and envelope bodies, and Task 7 `list_inits`. Until Task 5, an enum is an expansion error.

```rust
//! The expansions. Each wraps its items in `const _: () = { … };` so the
//! helper items it defines never meet the transport's own names.

use crate::attrs::{self, FlankAttrs, KindAttrs, SeparatorKindAttrs, SlotAttrs};
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DataStruct, DeriveInput, Fields, GenericArgument, Ident, LitStr, Path, PathArguments, Type};

pub fn derive(input: &DeriveInput) -> syn::Result<TokenStream> {
    let attrs = attrs::kind_attrs(&input.attrs)?;
    match &input.data {
        Data::Struct(data) => structure(&input.ident, &attrs, data),
        Data::Enum(_) => Err(syn::Error::new_spanned(&input.ident, "a choice or an enum kind is not supported yet")),
        Data::Union(_) => Err(syn::Error::new_spanned(&input.ident, "a transport is a struct or an enum")),
    }
}

enum Role {
    Layout,
    Slot(SlotAttrs),
    Flank(FlankAttrs),
    SeparatorKind(SeparatorKindAttrs),
    Other,
}

struct Field<'a> {
    ident: &'a Ident,
    ty: &'a Type,
    role: Role,
}

fn fields_of<'a>(owner: &Ident, data: &'a DataStruct) -> syn::Result<Vec<Field<'a>>> {
    let Fields::Named(named) = &data.fields else {
        return Err(syn::Error::new_spanned(owner, "a transport struct has named fields"));
    };
    named
        .named
        .iter()
        .map(|field| {
            let ident = field.ident.as_ref().expect("a named field");
            let role = if let Some(slot) = attrs::slot_attrs(&field.attrs)? {
                Role::Slot(slot)
            } else if let Some(flank) = attrs::flank_attrs(&field.attrs)? {
                Role::Flank(flank)
            } else if let Some(separator) = attrs::separator_kind_attrs(&field.attrs)? {
                Role::SeparatorKind(separator)
            } else if is_layout(&field.ty) {
                Role::Layout
            } else {
                Role::Other
            };
            Ok(Field { ident, ty: &field.ty, role })
        })
        .collect()
}

fn last_segment(ty: &Type) -> Option<String> {
    match ty {
        Type::Path(path) => path.path.segments.last().map(|segment| segment.ident.to_string()),
        _ => None,
    }
}

/// The first type argument of `wrapper<…>`, when `ty` is one.
fn inner_of<'t>(ty: &'t Type, wrapper: &str) -> Option<&'t Type> {
    let Type::Path(path) = ty else { return None };
    let segment = path.path.segments.last()?;
    if segment.ident != wrapper {
        return None;
    }
    let PathArguments::AngleBracketed(args) = &segment.arguments else { return None };
    args.args.iter().find_map(|arg| match arg {
        GenericArgument::Type(ty) => Some(ty),
        _ => None,
    })
}

/// `Option<…TransportLayout…>`: the layout field, known by its type.
fn is_layout(ty: &Type) -> bool {
    inner_of(ty, "Option").and_then(last_segment).as_deref() == Some("TransportLayout")
}

fn is_text(ty: &Type) -> bool {
    last_segment(ty).as_deref() == Some("String") || inner_of(ty, "Option").and_then(last_segment).as_deref() == Some("String")
}

struct Body {
    items: TokenStream,
    read: TokenStream,
    sides_of: TokenStream,
}

fn structure(ident: &Ident, attrs: &KindAttrs, data: &DataStruct) -> syn::Result<TokenStream> {
    let kind = attrs
        .kind
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "`#[transport(kind = …)]` names the struct's kind"))?;
    let fields = fields_of(ident, data)?;
    let admits = if attrs.display { quote!(display == #kind) } else { quote!(grammar == #kind || display == #kind) };
    let layout = &attrs.layout;
    let gap_arms = attrs.gaps.iter().map(|(preceding, slot)| quote!(#preceding => ::core::option::Option::Some(#slot),));
    let Body { items, read, sides_of } = if let Some(fixed) = &attrs.text {
        text_body(ident, &fields, fixed.as_ref())?
    } else {
        routed_body(attrs, &fields)?
    };
    let has_layout = fields.iter().find(|f| matches!(f.role, Role::Layout)).map(|field| {
        let (name, ty) = (field.ident, field.ty);
        quote! {
            impl __rt::HasLayout<#ty> for #ident {
                fn take_layout(&mut self) -> #ty {
                    ::core::mem::take(&mut self.#name)
                }
            }
        }
    });
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            #[allow(dead_code)]
            const __KIND: __Kind = #kind;
            #[allow(dead_code)]
            const __LAYOUT: &[__Kind] = &[#(#layout),*];
            #[allow(dead_code)]
            fn __gap(preceding: u16) -> ::core::option::Option<&'static str> {
                match preceding {
                    #(#gap_arms)*
                    _ => ::core::option::Option::None,
                }
            }
            #items
            impl __rt::ReadTransport for #ident {
                fn admits(grammar: __Kind, display: __Kind) -> bool {
                    #admits
                }
                fn takes_tagged(grammar: __Kind, display: __Kind, named: bool) -> bool {
                    named || <Self as __rt::ReadTransport>::admits(grammar, display)
                }
                #[allow(unused_mut, unused_variables)]
                fn read(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    depth: __rt::Depth,
                    sides: __rt::Sides,
                ) -> ::core::result::Result<Self, __rt::ReadError> {
                    #read
                }
                #[allow(unused_variables)]
                fn sides_of(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    row: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    #sides_of
                }
            }
            #has_layout
        };
    })
}

/// The survey, routes and placement every node's own pass starts with.
fn pass(min_depth: u32) -> TokenStream {
    quote! {
        let depth = depth.at_least(#min_depth);
        let row = __rt::row_of(cursor);
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        let mut placement = __rt::place(ctx, &children, &routes, sides.owner, __gap);
    }
}

/// The sides the placement gives the child at `row`, the node's own pass run
/// up to its placement.
fn sides_of_body() -> TokenStream {
    quote! {
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        let mut placement = __rt::place(ctx, &children, &routes, false, __gap);
        ::core::result::Result::Ok(placement.take_row(row).unwrap_or_default())
    }
}

/// A router that places trivia and skips every other child: a node whose
/// children are its spelling.
fn spelling_router() -> TokenStream {
    quote! {
        fn __route(child: &__rt::Child) -> ::core::result::Result<__rt::Route, __rt::ReadError> {
            ::core::result::Result::Ok(if child.trivia { __rt::Route::Trivia } else { __rt::Route::Layout })
        }
    }
}

/// The fields every mode fills the same way: the layout from the placement,
/// and a field with no helper attribute from its `Default`.
fn common_inits(fields: &[Field<'_>], skip: &str) -> Vec<TokenStream> {
    fields
        .iter()
        .filter(|field| field.ident != skip)
        .filter_map(|field| {
            let name = field.ident;
            match field.role {
                Role::Layout => Some(quote!(#name: placement.into_layout(sides),)),
                Role::Other => Some(quote!(#name: ::core::default::Default::default(),)),
                _ => None,
            }
        })
        .collect()
}

fn text_body(ident: &Ident, fields: &[Field<'_>], fixed: Option<&LitStr>) -> syn::Result<Body> {
    if !fields.iter().any(|f| f.ident == "text" && is_text(f.ty) && matches!(f.role, Role::Other)) {
        return Err(syn::Error::new_spanned(ident, "a text leaf has a `text: String` field"));
    }
    let fixed = fixed.map_or_else(|| quote!(""), |text| quote!(#text));
    let inits = common_inits(fields, "text");
    let pass = pass(0);
    Ok(Body {
        items: spelling_router(),
        read: quote! {
            #pass
            let node = cursor.node();
            let spanned = if __rt::tiles(&children, node.start_byte() as u32, node.end_byte() as u32) {
                ctx.text(&node)
            } else {
                ""
            };
            let text = if spanned.is_empty() { #fixed } else { spanned };
            ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string(text), #(#inits)* })
        },
        sides_of: sides_of_body(),
    })
}

enum SlotKind<'a> {
    Presence(&'a Path),
    Text,
    Node,
}

fn slot_kind<'a>(field: &Field<'a>, slot: &'a SlotAttrs) -> SlotKind<'a> {
    match &slot.presence {
        Some(keyword) => SlotKind::Presence(keyword),
        None if is_text(field.ty) => SlotKind::Text,
        None => SlotKind::Node,
    }
}

fn routed_body(attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<Body> {
    let slots: Vec<(u16, &Field<'_>, &SlotAttrs)> = fields
        .iter()
        .filter_map(|field| match &field.role {
            Role::Slot(slot) => Some((field, slot)),
            _ => None,
        })
        .enumerate()
        .map(|(i, (field, slot))| (i as u16, field, slot))
        .collect();

    let mut tagged = Vec::new();
    let mut untagged = Vec::new();
    let mut separators = Vec::new();
    for &(i, field, slot) in &slots {
        let ty = field.ty;
        let kind = slot_kind(field, slot);
        let scalar = match kind {
            SlotKind::Presence(_) => quote!(false),
            SlotKind::Text => {
                let scalar = slot.scalar;
                quote!(#scalar)
            }
            SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::scalar(child.grammar, child.display)),
        };
        let own_separators = &slot.separators;
        let field_paths = &slot.fields;
        if !field_paths.is_empty() {
            let takes = match kind {
                SlotKind::Presence(keyword) => quote!(child.grammar == #keyword),
                SlotKind::Text => quote!(!__LAYOUT.contains(&child.grammar) && ![#(#own_separators),*].contains(&child.grammar)),
                SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::takes_tagged(child.grammar, child.display, child.named)),
            };
            tagged.push(quote! {
                ::core::option::Option::Some(__field) if #(__field == #field_paths)||* => {
                    if #takes {
                        return ::core::result::Result::Ok(__rt::Route::Slot { slot: #i, scalar: #scalar });
                    }
                }
            });
        }
        if field_paths.is_empty() || slot.untagged {
            let admits = match kind {
                SlotKind::Presence(keyword) => quote!(child.grammar == #keyword),
                SlotKind::Text => return Err(syn::Error::new_spanned(field.ident, "a text slot routes by its field")),
                SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::admits(child.grammar, child.display)),
            };
            untagged.push(quote! {
                if #admits {
                    return ::core::result::Result::Ok(__rt::Route::Slot { slot: #i, scalar: #scalar });
                }
            });
        }
        if !own_separators.is_empty() {
            let own_field = if field_paths.is_empty() {
                quote!(false)
            } else {
                quote!(child.field.is_some_and(|__field| #(__field == #field_paths)||*))
            };
            separators.push(quote! {
                if [#(#own_separators),*].contains(&child.grammar) {
                    return ::core::result::Result::Ok(__rt::Route::Separator { slot: #i, tagged: #own_field });
                }
            });
        }
    }

    let accs: Vec<Ident> = slots.iter().map(|(i, ..)| format_ident!("__acc{}", i)).collect();
    let tys: Vec<&Type> = slots.iter().map(|(_, field, _)| field.ty).collect();
    let idxs: Vec<u16> = slots.iter().map(|(i, ..)| *i).collect();
    let names: Vec<&Ident> = slots.iter().map(|(_, field, _)| field.ident).collect();
    let labels: Vec<LitStr> = names.iter().map(|name| LitStr::new(&name.to_string(), name.span())).collect();
    let mut inits = common_inits(fields, "");
    for (((name, ty), acc), label) in names.iter().zip(&tys).zip(&accs).zip(&labels) {
        inits.push(quote!(#name: <#ty as __rt::ReadSlot>::finish(#acc, __rt::SlotSite { kind: __KIND, slot: #label, row })?,));
    }
    inits.extend(list_inits(attrs, fields, &slots)?);
    let pass = pass(attrs.min_depth.unwrap_or(0));

    Ok(Body {
        items: quote! {
            fn __route(child: &__rt::Child) -> ::core::result::Result<__rt::Route, __rt::ReadError> {
                if child.trivia {
                    return ::core::result::Result::Ok(__rt::Route::Trivia);
                }
                match child.field {
                    #(#tagged)*
                    ::core::option::Option::None => { #(#untagged)* }
                    _ => {}
                }
                #(#separators)*
                if __LAYOUT.contains(&child.grammar) {
                    return ::core::result::Result::Ok(__rt::Route::Layout);
                }
                ::core::result::Result::Err(__rt::ReadError::Unrouted { kind: __KIND, child: child.grammar, row: child.row })
            }
        },
        read: quote! {
            #pass
            #(let mut #accs = <#tys as __rt::ReadSlot>::start();)*
            if cursor.goto_first_child() {
                let mut i = 0usize;
                loop {
                    match routes[i] {
                        #(__rt::Route::Slot { slot: #idxs, .. } => <#tys as __rt::ReadSlot>::take(
                            &mut #accs,
                            cursor,
                            ctx,
                            depth,
                            placement.take(i),
                            __rt::SlotSite { kind: __KIND, slot: #labels, row },
                        )?,)*
                        #(__rt::Route::Separator { slot: #idxs, tagged } => <#tys as __rt::ReadSlot>::separator(&mut #accs, tagged),)*
                        _ => {}
                    }
                    i += 1;
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: sides_of_body(),
    })
}

/// A list's flank and separator-kind fields. Neither is read yet, so a struct
/// with either is an expansion error.
fn list_inits(_attrs: &KindAttrs, fields: &[Field<'_>], _slots: &[(u16, &Field<'_>, &SlotAttrs)]) -> syn::Result<Vec<TokenStream>> {
    match fields.iter().find(|f| matches!(f.role, Role::Flank(_) | Role::SeparatorKind(_))) {
        Some(field) => Err(syn::Error::new_spanned(field.ident, "a list's flank and separator kind are not supported yet")),
        None => Ok(Vec::new()),
    }
}
```

`placement.into_layout(sides)`, the layout field's init, consumes `placement` and `sides`. It runs inside the struct literal, after every `placement.take(i)`, and a struct has at most one layout field, so the borrow checker accepts it. The `match routes[i]` arms repeat each slot index in two `#(…)*` groups over the same vectors, one for `Slot` and one for `Separator`. If a slot's read fails, the error returns with the cursor still on that child, and the caller discards the whole read.

`rust/crates/sittir-core/Cargo.toml`: under `[dependencies]`, add `sittir-transport-macros = { path = "../sittir-transport-macros" }`. `lib.rs`: add `pub use sittir_transport_macros::Transport;` beside the other re-exports. Grammar crates depend only on `sittir-core`, so they need no new dependency, and the derive's paths (`::sittir_core::…`, `::tree_sitter::…`) resolve in every crate that uses it. Every grammar crate already depends on `tree-sitter`.

- [ ] **Step 4: Run the tests**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: PASS, including Task 3's placement test. `cargo expand` is not installed here. When an expansion needs reading, the compile errors it produces point into the generated tokens; otherwise run `rustc -Zunpretty=expanded` on nightly.

- [ ] **Step 5: Gates and commit**

Run `rtk cargo test --workspace --no-default-features` and `rtk cargo clippy -p sittir-transport-macros -p sittir-core --no-default-features -- -D warnings`.

```bash
git add rust/crates/sittir-transport-macros
git commit -F msg -- rust/crates/sittir-transport-macros rust/crates/sittir-core/Cargo.toml rust/crates/sittir-core/src/lib.rs rust/crates/sittir-parity-tests/tests/typed_read.rs Cargo.lock
```

Message: `feat(core): #[derive(Transport)] reads a struct by its slots' fields and types`.

---

## Task 5: Choices and enum kinds

A choice lists its kinds once, on its variants. A unit variant is a fixed literal stored as its kind id, and a variant holding a transport is a node read into that transport. A variant with neither `#[kind]` nor `#[transport(blank)]` is never read: builders make `Verbatim` and `Text`, readers do not.

The blank variant (`#[transport(blank)]`) is the "none" arm of a blank option: an optional slot registered as a preference, which the model marks `hasBlankArm` (today the nine typescript `terminator` slots). When no child came, such a slot holds its blank: today's wrap stores the blank id for it (`blankFromRead`), and a parsed node keeps its blank. The reader does the same through `ReadTransport::blank`. Every other optional slot reads an absent child as `None`, never as a blank arm, and Task 9's codegen check keeps any other slot from holding a choice that has one. The spec lists the attribute with the others (§ The transport declaration).

A choice tries its variants in the order today's dispatch does:

1. Envelope variants (`display`) match the child's display id, since the wrap keys an alias envelope by its display kind.
2. Every other variant matches the grammar id, as today's decode dispatches on `$type`, the grammar id.
3. Last, every other variant matches the display id, which catches an alias today's decode cannot place.

Each variant's ids are the ids today's claim loop gives it, so no id belongs to two variants.

An enum kind (`PrimitiveTypeEnum`) has one unit variant per member, each with its token's kind id. A member token that arrives as the node itself is read by its id. An enum marked `spelled` also reads its own node (`primitive_type`, kind 341, which holds the token `u8`) as the member its spelling tokens display (Task 2's `spelled_id`). The node's children, apart from trivia, must be anonymous tokens with no field that all display one id, and that id must be a member's. That is the spec's "reads as the member its spelling tokens display". It is decided by kind ids alone, never by comparing text, and it is the rule today's wrap folds by (`_spelledMemberId`).

A multi-token member is an alias over its tokens, so every token displays the member's id. Typescript's `unique symbol` reads as `unique` (143) and `symbol` (grammar 42, displayed 143). Requiring every token to agree keeps a member from being read as another member its first token is: python's `is not` is not `is`. Codegen refuses an enum kind whose two members resolve to one id (`AssembledEnum`), so a fold has one answer.

**Files:**
- Modify: `rust/crates/sittir-transport-macros/src/expand.rs`
- Test: `rust/crates/sittir-parity-tests/tests/typed_read.rs`

**Interfaces:**
- Consumes: Task 4's `attrs::variant_kinds` and `attrs::kind_attrs`; Task 2's `ReadTransport::blank`, `survey` and `spelled_id`.
- Produces: `ReadTransport` for `#[transport(choice)]` enums and for `#[transport(kind = …[, spelled])]` enums of unit members.

- [ ] **Step 1: Write the failing tests**

```rust
use sittir_python::render::kind_ids as py;
use sittir_typescript::render::field_ids as ts_field;

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(kind = kind::_PRIMITIVE_TYPE, spelled)]
enum Primitive {
    #[kind(kind::U8_KEYWORD)]
    U8,
    #[kind(kind::BOOL_KEYWORD)]
    Bool,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(choice)]
enum Type {
    #[kind(kind::NEVER_TYPE)]
    Never,
    #[kind(kind::_PRIMITIVE_TYPE, kind::U8_KEYWORD, kind::BOOL_KEYWORD)]
    Primitive(Primitive),
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT])]
struct Typed {
    layout: Layout,
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[slot(field = field::RETURN_TYPE)]
    return_type: Option<SlotValue<Type>>,
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

fn typed_function(source: &str) -> Result<Typed, ReadError> {
    read_nth(&parse_rust(source), source, kind::FUNCTION_ITEM, 0, Depth::All)
}

#[test]
fn a_unit_variant_stores_its_kind_and_an_enum_kind_reads_the_member_its_token_is() {
    assert_eq!(typed_function("fn f() -> ! {}").unwrap().return_type, Some(SlotValue::Transport(Type::Never)));
    assert_eq!(typed_function("fn f() -> u8 {}").unwrap().return_type, Some(SlotValue::Transport(Type::Primitive(Primitive::U8))));
    assert_eq!(typed_function("fn f() -> bool {}").unwrap().return_type, Some(SlotValue::Transport(Type::Primitive(Primitive::Bool))));
}

#[test]
fn an_enum_kind_whose_token_is_none_of_its_members_is_refused() {
    let err = typed_function("fn f() -> u16 {}").unwrap_err();
    assert!(matches!(err, ReadError::Unspelled { kind: refused, .. } if refused == kind::_PRIMITIVE_TYPE), "{err:?}");
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(kind = ts::PREDEFINED_TYPE, spelled)]
enum Predefined {
    #[kind(ts::SYMBOL_KEYWORD)]
    Symbol,
    #[kind(ts::UNIQUE)]
    UniqueSymbol,
}

#[test]
fn a_member_spelled_by_two_tokens_reads_as_the_id_both_display() {
    for (source, member) in [("declare const x: unique symbol;", Predefined::UniqueSymbol), ("declare const x: symbol;", Predefined::Symbol)] {
        let tree = parse(&sittir_typescript::language(), source);
        assert_eq!(read_nth::<Predefined>(&tree, source, ts::PREDEFINED_TYPE, 0, Depth::All).unwrap(), member, "{source}");
    }
}

/// Members `is` and `not` but not `is not`, whose node holds one token of each.
#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(kind = py::_IS_NOT, spelled)]
enum IsOrNot {
    #[kind(py::IS_KEYWORD)]
    Is,
    #[kind(py::NOT_KEYWORD)]
    Not,
}

#[test]
fn a_node_whose_tokens_display_different_ids_is_none_of_its_members() {
    // read by its first token, `is not` would be `is`
    let source = "a is not b\n";
    let tree = parse(&sittir_python::language(), source);
    let err = read_nth::<IsOrNot>(&tree, source, py::_IS_NOT, 0, Depth::All).unwrap_err();
    assert!(matches!(err, ReadError::Unspelled { kind: refused, .. } if refused == py::_IS_NOT), "{err:?}");
}

#[test]
fn a_unit_variant_owns_no_trivia_so_a_comment_after_it_trails_the_owner_before() {
    // `!` is stored as a unit: the comment trails `()`, past the two children `->` and `!`
    let f = typed_function("fn f() -> ! /* c */ {}").unwrap();
    assert_eq!(trivia_spans(&f.parameters.transport().unwrap().layout, "trailing"), vec![(12, 19, true, 2)]);
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::IDENTIFIER, text)]
struct TsIdent {
    layout: Layout,
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::NUMBER_DECIMAL, text)]
struct TsNumber {
    layout: Layout,
    text: String,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::VARIABLE_DECLARATOR_PLAIN, layout = [ts::EQ])]
struct Declarator {
    layout: Layout,
    #[slot(field = ts_field::NAME)]
    name: SlotValue<TsIdent>,
    #[slot(field = ts_field::VALUE)]
    value: Option<SlotValue<TsNumber>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(choice)]
enum DeclarationKind {
    #[kind(ts::LET_KEYWORD)]
    Let,
    #[kind(ts::CONST_KEYWORD)]
    Const,
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(choice)]
enum Terminator {
    #[kind(ts::_AUTOMATIC_SEMICOLON)]
    Inserted,
    #[kind(ts::SEMI)]
    Semi,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::LEXICAL_DECLARATION)]
struct Declaration {
    layout: Layout,
    #[slot(field = ts_field::KIND)]
    kind: SlotValue<DeclarationKind>,
    #[slot(field = ts_field::DECLARATORS)]
    declarators: Vec<SlotValue<Declarator>>,
    #[slot(field = ts_field::TERMINATOR)]
    terminator: Option<SlotValue<Terminator>>,
}

#[test]
fn a_zero_width_terminator_is_a_unit_and_owns_nothing() {
    // the comment sits before the zero-width terminator, inside the declaration
    let source = "let x = 1 // c\nlet y = 2;";
    let tree = parse(&sittir_typescript::language(), source);
    let first: Declaration = read_nth(&tree, source, ts::LEXICAL_DECLARATION, 0, Depth::All).unwrap();
    let second: Declaration = read_nth(&tree, source, ts::LEXICAL_DECLARATION, 1, Depth::All).unwrap();
    assert_eq!(first.terminator, Some(SlotValue::Transport(Terminator::Inserted)));
    assert_eq!(second.terminator, Some(SlotValue::Transport(Terminator::Semi)));
    let declarator = first.declarators[0].transport().unwrap();
    assert_eq!(trivia_spans(&declarator.layout, "trailing"), vec![(10, 14, true, 0)]);
}

#[derive(Debug, Clone, Copy, PartialEq, Transport)]
#[transport(choice)]
enum BlockTerminator {
    #[kind(ts::_AUTOMATIC_SEMICOLON)]
    Inserted,
    #[transport(blank)]
    Blank,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = ts::STATEMENT_BLOCK, layout = [ts::LBRACE, ts::RBRACE])]
struct StatementBlock {
    layout: Layout,
    #[slot(field = ts_field::TERMINATOR)]
    terminator: Option<SlotValue<BlockTerminator>>,
}

#[test]
fn an_absent_slot_with_a_blank_arm_reads_as_its_blank() {
    // the parser inserts no terminator after the `if` block, and one after the `else` block
    let source = "if (a) { } else { }";
    let tree = parse(&sittir_typescript::language(), source);
    let consequence: StatementBlock = read_nth(&tree, source, ts::STATEMENT_BLOCK, 0, Depth::All).unwrap();
    let alternative: StatementBlock = read_nth(&tree, source, ts::STATEMENT_BLOCK, 1, Depth::All).unwrap();
    assert_eq!(consequence.terminator, Some(SlotValue::Transport(BlockTerminator::Blank)));
    assert_eq!(alternative.terminator, Some(SlotValue::Transport(BlockTerminator::Inserted)));
}
```

Facts checked with the generated parsers:

- `primitive_type` is grammar kind 341 (`kind::_PRIMITIVE_TYPE`) and holds its keyword token (`u8` is kind 58).
- In `declare const x: unique symbol;`, `predefined_type` (359, `ts::PREDEFINED_TYPE`) holds two anonymous tokens: `unique` (grammar 143, displayed 143) and `symbol` (grammar 42, displayed 143). The member `unique symbol` is 143 (`ts::UNIQUE`) and `symbol` is 42 (`ts::SYMBOL_KEYWORD`), as the generated `PredefinedTypeEnum` decoder maps them.
- Python's `is not` is its own anonymous kind 211 (`py::_IS_NOT`), holding `is` (61, `py::IS_KEYWORD`) and `not` (51, `py::NOT_KEYWORD`), each displayed as itself.
- `!` is a named `never_type` holding one anonymous `!`.
- In `let x = 1 // c`, the comment (10..14) and the zero-width `automatic_semicolon` (14..14) are both children of `lexical_declaration`.
- The `if` block of `if (a) { } else { }` has no `terminator` child; the `else` block's is an `automatic_semicolon`.

Today's `stores_scalar` has an arm `(208, "return_type")` for `!`, and `extras_run` counts every non-owner sibling as a token, so the comment after `!` is two tokens past `()`.

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: FAIL to compile: "a choice or an enum kind is not supported yet".

- [ ] **Step 3: Implement**

In `expand.rs`, add `DataEnum` to the `syn` imports, and replace the enum arm of `derive`:

```rust
        Data::Enum(data) if attrs.choice => choice(&input.ident, data),
        Data::Enum(data) => members(&input.ident, &attrs, data),
```

Add:

```rust
fn choice(ident: &Ident, data: &DataEnum) -> syn::Result<TokenStream> {
    let mut by_display = Vec::new();
    let mut by_grammar = Vec::new();
    let mut by_alias = Vec::new();
    let mut scalars = Vec::new();
    let mut reads = Vec::new();
    let mut sides = Vec::new();
    let mut blank = None;
    for (i, variant) in data.variants.iter().enumerate() {
        let name = &variant.ident;
        if attrs::kind_attrs(&variant.attrs)?.blank {
            if !matches!(variant.fields, Fields::Unit) {
                return Err(syn::Error::new_spanned(variant, "a blank variant is a unit"));
            }
            blank = Some(quote! {
                fn blank() -> ::core::option::Option<Self> {
                    ::core::option::Option::Some(Self::#name)
                }
            });
            continue;
        }
        let Some(kinds) = attrs::variant_kinds(&variant.attrs)? else { continue };
        let i = i as u16;
        let ids = &kinds.kinds;
        if kinds.display {
            by_display.push(quote!(if [#(#ids),*].contains(&display) { return ::core::option::Option::Some(#i); }));
        } else {
            by_grammar.push(quote!(if [#(#ids),*].contains(&grammar) { return ::core::option::Option::Some(#i); }));
            by_alias.push(quote!(if [#(#ids),*].contains(&display) { return ::core::option::Option::Some(#i); }));
        }
        match &variant.fields {
            Fields::Unit => {
                scalars.push(quote!(::core::option::Option::Some(#i) => true,));
                reads.push(quote!(::core::option::Option::Some(#i) => ::core::result::Result::Ok(Self::#name),));
            }
            Fields::Unnamed(payload) if payload.unnamed.len() == 1 => {
                let ty = &payload.unnamed[0].ty;
                scalars.push(quote!(::core::option::Option::Some(#i) => <#ty as __rt::ReadTransport>::scalar(grammar, display),));
                reads.push(quote! {
                    ::core::option::Option::Some(#i) => ::core::result::Result::Ok(Self::#name(
                        <#ty as __rt::ReadTransport>::read(cursor, ctx, depth, sides)?,
                    )),
                });
                sides.push(quote!(::core::option::Option::Some(#i) => <#ty as __rt::ReadTransport>::sides_of(cursor, ctx, row),));
            }
            _ => return Err(syn::Error::new_spanned(variant, "a choice's variant is a unit or holds one transport")),
        }
    }
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            fn __variant(grammar: __Kind, display: __Kind) -> ::core::option::Option<u16> {
                #(#by_display)*
                #(#by_grammar)*
                #(#by_alias)*
                ::core::option::Option::None
            }
            impl __rt::ReadTransport for #ident {
                fn admits(grammar: __Kind, display: __Kind) -> bool {
                    __variant(grammar, display).is_some()
                }
                fn takes_tagged(grammar: __Kind, display: __Kind, _named: bool) -> bool {
                    __variant(grammar, display).is_some()
                }
                fn scalar(grammar: __Kind, display: __Kind) -> bool {
                    match __variant(grammar, display) {
                        #(#scalars)*
                        _ => false,
                    }
                }
                #blank
                #[allow(unused_variables)]
                fn read(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    depth: __rt::Depth,
                    sides: __rt::Sides,
                ) -> ::core::result::Result<Self, __rt::ReadError> {
                    let node = cursor.node();
                    let (grammar, display) = (__Kind(node.grammar_id()), __Kind(node.kind_id()));
                    match __variant(grammar, display) {
                        #(#reads)*
                        _ => ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: grammar, row: __rt::row_of(cursor) }),
                    }
                }
                #[allow(unused_variables)]
                fn sides_of(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    row: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    let node = cursor.node();
                    match __variant(__Kind(node.grammar_id()), __Kind(node.kind_id())) {
                        #(#sides)*
                        _ => ::core::result::Result::Ok(__rt::Sides::default()),
                    }
                }
            }
        };
    })
}

fn members(ident: &Ident, attrs: &KindAttrs, data: &DataEnum) -> syn::Result<TokenStream> {
    let kind = attrs
        .kind
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "an enum kind names its kind: `#[transport(kind = …)]`"))?;
    let mut by_kind = Vec::new();
    for variant in &data.variants {
        if !matches!(variant.fields, Fields::Unit) {
            return Err(syn::Error::new_spanned(variant, "an enum kind's members are units"));
        }
        let kinds = attrs::variant_kinds(&variant.attrs)?
            .ok_or_else(|| syn::Error::new_spanned(variant, "an enum kind's member names its token: `#[kind(…)]`"))?;
        let (name, ids) = (&variant.ident, &kinds.kinds);
        by_kind.push(quote!(if [#(#ids),*].contains(&grammar) { return ::core::option::Option::Some(#ident::#name); }));
    }
    let spelled = attrs.spelled.then(|| {
        quote! {
            if let ::core::option::Option::Some(member) = __rt::spelled_id(&__rt::survey(cursor)).and_then(__member) {
                return ::core::result::Result::Ok(member);
            }
        }
    });
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            fn __member(grammar: __Kind) -> ::core::option::Option<#ident> {
                #(#by_kind)*
                ::core::option::Option::None
            }
            impl __rt::ReadTransport for #ident {
                fn admits(grammar: __Kind, display: __Kind) -> bool {
                    grammar == #kind || display == #kind || __member(grammar).is_some()
                }
                fn takes_tagged(grammar: __Kind, display: __Kind, _named: bool) -> bool {
                    <Self as __rt::ReadTransport>::admits(grammar, display)
                }
                fn scalar(grammar: __Kind, _display: __Kind) -> bool {
                    __member(grammar).is_some()
                }
                fn read(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    _ctx: &__rt::ReadCtx<'_>,
                    _depth: __rt::Depth,
                    _sides: __rt::Sides,
                ) -> ::core::result::Result<Self, __rt::ReadError> {
                    let node = cursor.node();
                    if let ::core::option::Option::Some(member) = __member(__Kind(node.grammar_id())) {
                        return ::core::result::Result::Ok(member);
                    }
                    #spelled
                    ::core::result::Result::Err(__rt::ReadError::Unspelled { kind: __Kind(node.grammar_id()), row: __rt::row_of(cursor) })
                }
                fn sides_of(
                    _cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    _ctx: &__rt::ReadCtx<'_>,
                    _row: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    ::core::result::Result::Ok(__rt::Sides::default())
                }
            }
        };
    })
}
```

An enum kind's own node owns trivia, because its id is not among its members' ids. Today agrees: `stores_scalar`'s rows list the member ids, not the enum kind's.

- [ ] **Step 4: Run the tests**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: PASS.

- [ ] **Step 5: Gates and commit**

Run `rtk cargo test --workspace --no-default-features` and `rtk cargo clippy -p sittir-transport-macros -p sittir-core --no-default-features -- -D warnings`, then `git commit -F msg -- rust/crates/sittir-transport-macros rust/crates/sittir-parity-tests/tests/typed_read.rs`.

Message: `feat(core): choices read their variants by kind, with a blank arm; enum kinds by the id their tokens display`.

---

## Task 6: Interiors and envelopes

A token interior reads its slots from its own text, by the named groups of its pattern (`TOKEN_INTERIORS`), and has no children to route. The derive compiles the pattern as it expands, with the `s` flag the JavaScript side compiles it with, so a pattern Rust's `regex` rejects fails the build and names the kind.

An alias envelope is read as its content's transport over the same node, then takes the layout that read placed, as today's `_aliasEnvelope` moves the aliased node's trivia to the envelope.

**Files:**
- Modify: `rust/crates/sittir-transport-macros/src/expand.rs`
- Test: `rust/crates/sittir-parity-tests/tests/typed_read.rs`

**Interfaces:**
- Consumes: Task 2's `Interior`, `capture`, `FromCapture`, `HasLayout`.
- Produces: the struct modes `interior = "…"`, with `#[slot(capture = "…")]` fields, and `envelope, content = field`.

- [ ] **Step 1: Write the failing tests**

```rust
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(
    kind = kind::INTEGER_LITERAL_DECIMAL,
    interior = "^(?<content>(?:[0-9][0-9_]*))(?<suffix>isize|usize|u128|i128|u16|i16|u32|i32|u64|i64|f32|f64|u8|i8)?$"
)]
struct Decimal {
    layout: Layout,
    #[slot(capture = "content")]
    content: String,
    #[slot(capture = "suffix")]
    suffix: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::_TYPE_IDENTIFIER, display, envelope, content = content)]
struct TypeIdent {
    layout: Layout,
    content: SlotValue<Ident>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(choice)]
enum NamedType {
    #[kind(kind::_TYPE_IDENTIFIER, display)]
    TypeIdentifier(TypeIdent),
    #[kind(kind::NEVER_TYPE)]
    Never,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT])]
struct Named {
    layout: Layout,
    #[slot(field = field::NAME)]
    name: SlotValue<Ident>,
    #[slot(field = field::PARAMETERS)]
    parameters: SlotValue<Params>,
    #[slot(field = field::RETURN_TYPE)]
    return_type: Option<SlotValue<NamedType>>,
    #[slot(field = field::BODY)]
    body: SlotValue<Box<Block>>,
}

#[test]
fn a_token_interior_reads_its_slots_from_its_text() {
    let source = "const X: u8 = 1_000u8;";
    let tree = parse_rust(source);
    let decimal: Decimal = read_nth(&tree, source, kind::INTEGER_LITERAL_DECIMAL, 0, Depth::ONE).unwrap();
    assert_eq!((decimal.content.as_str(), decimal.suffix.as_deref()), ("1_000", Some("u8")));
}

#[test]
fn an_envelope_holds_its_content_and_the_trivia_its_content_was_given() {
    let source = "fn f() -> T /* c */ {}";
    let tree = parse_rust(source);
    let f: Named = read_nth(&tree, source, kind::FUNCTION_ITEM, 0, Depth::All).unwrap();
    let Some(SlotValue::Transport(NamedType::TypeIdentifier(envelope))) = &f.return_type else { panic!("{:?}", f.return_type) };
    assert_eq!(envelope.content.transport().unwrap().text, "T");
    assert_eq!(envelope.content.transport().unwrap().layout, None);
    assert_eq!(trivia_spans(&envelope.layout, "trailing"), vec![(12, 19, true, 0)]);
}
```

The pattern is `TOKEN_INTERIORS.integer_literal_decimal.regex` in `packages/rust/src/consts.ts`. The parser shows `T` in that position as grammar kind 1 (`identifier`) with display kind 468 (`kind::_TYPE_IDENTIFIER`), and rust's `_ALIAS_ENVELOPES` is `{465, 467, 468}`.

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: FAIL. A `capture` slot routes by no field ("a text slot routes by its field"), and the envelope reads as a routed struct.

- [ ] **Step 3: Implement**

In `structure`, choose the mode in this order: text, interior, envelope, routed.

```rust
    let Body { items, read, sides_of } = if let Some(fixed) = &attrs.text {
        text_body(ident, &fields, fixed.as_ref())?
    } else if let Some(pattern) = &attrs.interior {
        interior_body(ident, &fields, pattern)?
    } else if attrs.envelope {
        envelope_body(ident, attrs, &fields)?
    } else {
        routed_body(attrs, &fields)?
    };
```

```rust
fn interior_body(ident: &Ident, fields: &[Field<'_>], pattern: &LitStr) -> syn::Result<Body> {
    let flagged = format!("(?s){}", pattern.value());
    regex::Regex::new(&flagged)
        .map_err(|e| syn::Error::new_spanned(pattern, format!("`{ident}`'s token interior does not compile as a Rust regex: {e}")))?;
    let flagged = LitStr::new(&flagged, pattern.span());
    let mut inits = common_inits(fields, "");
    for field in fields {
        if let Role::Slot(slot) = &field.role {
            let capture = slot
                .capture
                .as_ref()
                .ok_or_else(|| syn::Error::new_spanned(field.ident, "a token interior's slot names its capture"))?;
            let (name, ty) = (field.ident, field.ty);
            inits.push(quote!(#name: __rt::capture::<#ty>(&captures, #capture, __rt::SlotSite { kind: __KIND, slot: #capture, row })?,));
        }
    }
    let pass = pass(0);
    let router = spelling_router();
    Ok(Body {
        items: quote! {
            static __INTERIOR: __rt::Interior = __rt::Interior::new(#flagged);
            #router
        },
        read: quote! {
            #pass
            let captures = __INTERIOR
                .captures(ctx.text(&cursor.node()))
                .ok_or(__rt::ReadError::Interior { kind: __KIND, row })?;
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: sides_of_body(),
    })
}

fn envelope_body(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<Body> {
    let content = attrs
        .content
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "an envelope names its content field: `content = …`"))?;
    let field = fields
        .iter()
        .find(|f| f.ident == content)
        .ok_or_else(|| syn::Error::new_spanned(content, "`content` names one of the envelope's fields"))?;
    let inner = inner_of(field.ty, "SlotValue")
        .ok_or_else(|| syn::Error::new_spanned(field.ty, "an envelope's content is a `SlotValue<…>`"))?;
    let inits = fields.iter().map(|other| {
        let name = other.ident;
        match other.role {
            Role::Layout => quote!(#name: layout,),
            _ if other.ident == content => quote!(#name: ::sittir_core::SlotValue::Transport(content),),
            _ => quote!(#name: ::core::default::Default::default(),),
        }
    });
    Ok(Body {
        items: quote!(),
        read: quote! {
            let mut content = <#inner as __rt::ReadTransport>::read(cursor, ctx, depth, sides)?;
            let layout: #layout_ty = <#inner as __rt::HasLayout<#layout_ty>>::take_layout(&mut content).or_else(|| sides.into_layout());
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: quote!(<#inner as __rt::ReadTransport>::sides_of(cursor, ctx, row)),
    })
}
```

An envelope never calls its own `__gap`, `__LAYOUT` or `__KIND`; the `#[allow(dead_code)]` on each in `structure` covers that. `layout_ty` is the written type of the envelope's own layout field. Envelope content is a struct, a text leaf, or a choice or member enum: a struct implements `HasLayout` from its layout field, and a choice or member enum delegates to its payload, with a plain `Default` for a variant without one. Content with no layout of its own takes the layout the placement gave the node (`Sides::into_layout`).

- [ ] **Step 4: Run the tests**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: PASS.

- [ ] **Step 5: Gates and commit**

Run `rtk cargo test --workspace --no-default-features` and `rtk cargo clippy -p sittir-transport-macros -p sittir-core --no-default-features -- -D warnings`, then `git commit -F msg -- rust/crates/sittir-transport-macros rust/crates/sittir-parity-tests/tests/typed_read.rs`.

Message: `feat(core): token interiors read their captures; envelopes take their content's trivia`.

---

## Task 7: A list's flags, minimum depth, and reading at a row

A list kind's delimiter flags and separator kind are read from the source, as each list's wrap computes them today (`_hasSeparatorFlank`, `_separatorKindOf`). The spec's A.2 calls `delimiter` a render-option field that the render side stamps from its site. Prepare does fill it, but only when it is unset, and today's read sets it from the source. So the reader computes it here, keeping the gate at zero differences. Brainstorm ruled that step 1 keeps it computed. § Outline: after step 1 names the step where it becomes the render option A.2 lists.

A list owner's `min_depth` brings its items with it. Reading the node at a coordinate's row (`read_at`) gives that node the sides its parent's placement gives it, so a row read equals the same node inside a whole read, trivia included. The hydration step in 1c is built on that.

**Files:**
- Modify: `rust/crates/sittir-transport-macros/src/expand.rs` (`list_inits`)
- Modify: `rust/crates/sittir-core/src/read.rs` (`read_at`)
- Test: `rust/crates/sittir-parity-tests/tests/typed_read.rs`

**Interfaces:**
- Consumes: Task 2's `delimiter(list, children, routes, items, leading, trailing) -> u8` and `separator_kind(children, routes, candidates) -> Option<u16>`.
- Produces: `sittir_core::read::read_at<T: ReadTransport, P: ReadTransport>(cursor: &mut TreeCursor, ctx: &ReadCtx, row: u32, depth: Depth) -> Result<T, ReadError>`. `P` is the type that reads the parent's routes: a grammar's `AnyTransport` in 1c, the parent's own transport in these tests.

- [ ] **Step 1: Write the failing tests**

```rust
#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::_ATTRIBUTED_PARAMETER)]
struct Param {
    layout: Layout,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS_ELEMENTS, list, item = item)]
struct List {
    layout: Layout,
    #[slot(field = field::ITEM, separator = kind::COMMA)]
    item: Vec<SlotValue<Param>>,
    #[flank(trailing = 0)]
    delimiter: Option<u8>,
}

#[derive(Debug, Clone, PartialEq, Transport)]
#[transport(kind = kind::PARAMETERS, layout = [kind::LPAREN, kind::RPAREN], min_depth = 2, gap(1) = elements)]
struct Owner {
    layout: Layout,
    #[slot(field = field::ELEMENTS)]
    elements: Option<SlotValue<List>>,
}

fn owner(source: &str) -> Owner {
    read_nth(&parse_rust(source), source, kind::PARAMETERS, 0, Depth::ONE).unwrap()
}

#[test]
fn a_list_owner_brings_its_list_and_the_list_knows_its_trailing_separator() {
    let plain = owner("fn f(a: u8, b: u8) {}");
    let list = plain.elements.as_ref().unwrap().transport().expect("min_depth reads the list");
    assert_eq!(list.item.len(), 2);
    assert!(list.item.iter().all(|item| item.coord().is_some()), "the items have structure: past the depth");
    assert_eq!(list.delimiter, Some(0));
    let trailing = owner("fn f(a: u8, b: u8,) {}");
    assert_eq!(trailing.elements.unwrap().transport().unwrap().delimiter, Some(sittir_core::read::TRAILING));
}

#[test]
fn a_row_read_equals_the_same_node_in_a_whole_read_trivia_included() {
    let source = "// lead\nfn f() { fn g() {} } // trail\n";
    let tree = parse_rust(source);
    let ctx = ReadCtx::new(source, 7);
    let whole: File = read(&tree, source, Depth::All).unwrap();
    let shallow: File = read(&tree, source, Depth::ONE).unwrap();
    let row = sittir_core::decode_handle(shallow.statements.as_ref().unwrap()[0].coord().unwrap().handle).1;
    let outer: Function = sittir_core::read::read_at::<Function, File>(&mut tree.walk(), &ctx, row, Depth::All).unwrap();
    assert_eq!(&outer, function(&whole, 0));
    assert_eq!(trivia_spans(&outer.layout, "leading"), vec![(0, 7, false, 0)]);

    let inner_row = find(&tree, kind::FUNCTION_ITEM, 1).descendant_index() as u32;
    let inner: Function = sittir_core::read::read_at::<Function, Block>(&mut tree.walk(), &ctx, inner_row, Depth::All).unwrap();
    let body = function(&whole, 0).body.transport().unwrap();
    assert_eq!(&inner, body.statements.as_ref().unwrap()[0].transport().unwrap());
}
```

Facts checked with the parser: `parameters_elements` (kind 349) holds the items under the field `item`, with `,` between them unfielded. The trailing `,` of `(a: u8, b: u8,)` is inside it. An item is grammar kind 429 (`kind::_ATTRIBUTED_PARAMETER`, shown as `attributed_parameter`). The expected flags are today's: `wrapParametersElements` computes `_delimiter` from the same spans, and `Delimiter.Trailing` is 2.

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read`
Expected: FAIL: "a list's flank and separator kind are not supported yet", then `read_at` not found.

- [ ] **Step 3: Implement**

Replace `list_inits` in `expand.rs`:

```rust
fn list_inits(attrs: &KindAttrs, fields: &[Field<'_>], slots: &[(u16, &Field<'_>, &SlotAttrs)]) -> syn::Result<Vec<TokenStream>> {
    let mut inits = Vec::new();
    for field in fields {
        let name = field.ident;
        match &field.role {
            Role::Flank(flank) => {
                let item = attrs
                    .item
                    .as_ref()
                    .filter(|_| attrs.list)
                    .ok_or_else(|| syn::Error::new_spanned(name, "a list's flank needs `#[transport(list, item = …)]`"))?;
                let slot = slots
                    .iter()
                    .find(|(_, f, _)| f.ident == item)
                    .map(|(i, ..)| *i)
                    .ok_or_else(|| syn::Error::new_spanned(item, "`item` names one of the list's slots"))?;
                let (leading, trailing) = (option(flank.leading), option(flank.trailing));
                inits.push(quote! {
                    #name: ::core::option::Option::Some(__rt::delimiter(&cursor.node(), &children, &routes, #slot, #leading, #trailing)),
                });
            }
            Role::SeparatorKind(separator) => {
                let candidates = &separator.candidates;
                let read = quote!(__rt::separator_kind(&children, &routes, &[#(#candidates),*]));
                inits.push(match &separator.default {
                    Some(default) => quote!(#name: ::core::option::Option::Some(#read.unwrap_or(#default.0)),),
                    None => quote!(#name: #read,),
                });
            }
            _ => {}
        }
    }
    Ok(inits)
}

fn option(value: Option<u16>) -> TokenStream {
    match value {
        Some(value) => quote!(::core::option::Option::Some(#value)),
        None => quote!(::core::option::Option::None),
    }
}
```

In `read.rs`, after `separator_kind`:

```rust
/// Read the node at `row` into `T`, with the sides its parent's placement
/// gives it. `P` reads the parent's routes. The cursor was created at the
/// tree's root.
pub fn read_at<T: ReadTransport, P: ReadTransport>(
    cursor: &mut TreeCursor<'_>,
    ctx: &ReadCtx<'_>,
    row: u32,
    depth: Depth,
) -> Result<T, ReadError> {
    cursor.goto_descendant(row as usize);
    let sides = if cursor.goto_parent() {
        let sides = P::sides_of(cursor, ctx, row)?;
        cursor.goto_descendant(row as usize);
        sides
    } else {
        Sides::root()
    };
    T::read(cursor, ctx, depth, sides)
}
```

- [ ] **Step 4: Run the tests**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read && rtk cargo test -p sittir-core --no-default-features read::tests`
Expected: PASS.

- [ ] **Step 5: Gates and commit**

Run `rtk cargo test --workspace --no-default-features` and `rtk cargo clippy -p sittir-transport-macros -p sittir-core --no-default-features -- -D warnings`, then `git commit -F msg -- rust/crates/sittir-transport-macros rust/crates/sittir-core/src/read.rs rust/crates/sittir-parity-tests/tests/typed_read.rs`.

Message: `feat(core): a list's flags from its source, minimum depth, and row reads with their trivia`.

---

## Task 8: The read facts each transport declares

Codegen states every read fact a type cannot, and each fact comes from the derivation today's wrap or reader already uses. This task computes the attribute arguments in one module, as pure functions of the model, and tests them on real rust kinds. Task 9 prints them.

| fact | source today | attribute |
| --- | --- | --- |
| the kind | the struct's own kind entry (the `ownId` `renderTransportDataStruct` already computes) | `kind = kind::X` |
| an alias envelope | `aliasEnvelopesOf` and `AssembledAlias.aliasTypeId` (`_ALIAS_ENVELOPES`) | `kind = kind::X, display, envelope, content = content` |
| a text leaf | `isTextLeaf(node)` (`shared.ts`), the set today's wrap reads through `_spelledLeaf`, and its fixed text `kindIdText(node)` (the leaf decode's default) | `text` or `text = "…"` |
| a token interior | `interiorOf(node)` (`TOKEN_INTERIORS`) | `interior = "…"`, and `capture = "slot"` on each slot |
| layout tokens | the text nodes of the kind's template body, by `findKindEntryForLiteral` | `layout = […]` |
| inner gaps | `node.innerGaps` (`inner_gap_key`'s rows) | `gap(n) = slot` |
| minimum depth | `listViewOwners` (`_LIST_OWNER_KINDS`) | `min_depth = 2` |
| a separated list | `AssembledList`, `canonicalSeparatedListField` | `list, item = field` |
| routes | `queryRoutesOf` (`querySlots`, `wireRoutesOf`) | `field = …`, `untagged`, or a bare `#[slot]` |
| presence | `transportSlotShapeOf(slot).tag === 'presence'` and its keyword | `presence = kind::X` |
| separators | `slotSeparatorTexts` with `fieldTaggedLiteralTexts` (`separatorIdsExprOf`'s set) | `separator = …` |
| a text slot stored as a scalar | the storage `scalarChildRows` reads (`stores_scalar`) | `scalar` |
| delimiter flanks | `leadingDelimiter`, `trailingDelimiter` (`_hasSeparatorFlank`'s arguments) | `#[flank(leading = n, trailing = n)]` |
| separator kind | `separatorCandidateKindNames`, `resolvedSeparatorArm` (`_separatorKindOf`) | `#[separator_kind(candidates = […], default = …)]` |
| enum members | `renderEnumType`'s `arms`, the member ids its id decoder takes (`enumMemberId`) | `kind = kind::X, spelled`, and `#[kind(kind::TOKEN)]` per member from the same arms |

The words `words`/`word` (record offsets) and `group` (seats) in the spec's examples are not emitted in step 1. Offsets belong to the record step, and a group seat is used by `$with` only.

**Files:**
- Modify: `packages/codegen/src/emitters/transport-projection.ts` (the read facts, beside the projection they describe, as the spec places them)
- Modify: `packages/codegen/src/emitters/shared.ts` (receive `aliasEnvelopesOf`, `aliasEnvelopeIds` and `fieldTaggedLiteralTexts` from `wrap.ts`, exported; add `slotDropTexts`)
- Modify: `packages/codegen/src/emitters/wrap.ts` (import those; `separatorIdsExprOf` formats `slotDropTexts`)
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts` (export `isScalarStorage`, which `scalarChildRows` now calls)
- Modify: `packages/codegen/src/emitters/render-module.ts` (export `rustTransportStructName`, `transportSlotShapeOf` and `TransportSlotShape`)
- Test: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `kindConstName`, `fieldConstName`, `generatedFieldIds` (Task 1).
- Produces, in `transport-projection.ts`:
  - `readNames(kindEntries, fieldIds): ReadNames`, where `ReadNames` has `kind(id: number): string` (`kind::X`) and `field(name: string): string` (`field::X`). Both throw when the id or field has no constant.
  - `ReadFactsCtx { nodeMap, kindEntries, names, listOwners: ReadonlySet<string> }`.
  - `transportArgs(node, ownId, body, ctx): string`, the `#[transport(…)]` arguments of a struct.
  - `slotArgs(slot, owner, shape: TransportSlotShape, ctx): string` (the shape `render-module.ts` already computes for the field), the `#[slot(…)]` arguments; `''` means a bare `#[slot]`.
  - `captureArgs(slot): string`.
  - `flankArgs(list): string | undefined`.
  - `separatorKindArgs(list, ctx): string | undefined`.
  - `enumKindArgs(ownId, ctx): string`. An enum's members take their `#[kind]` from `variantKindArgs` over the ids `renderEnumType`'s decoder arms hold, so the reader and the decoder read one list.
  - `variantKindArgs(ids, display, ctx): string`.
  - `takesUntagged(slot, ctx): boolean`.
  - `assertOneUntaggedSlot(kind, slots: readonly { name: string; ids: readonly number[] }[], kindEntries): void`.
- Produces, in `shared.ts`: `aliasEnvelopesOf`, `aliasEnvelopeIds`, `fieldTaggedLiteralTexts`, and `slotDropTexts(slot, owner, elided): string[]`.

- [ ] **Step 1: Write the failing tests**

In `render-module-emit.test.ts`, split the model out of `getTransportRsForGrammar` so the facts tests share the cached pipeline. `modelFor(grammar)` runs the same steps and returns `{ raw, nodeMap, kindEntries, generatedIdTables, templates, renderRules }`, cached per grammar. `getTransportRsForGrammar` calls it and emits. Then add:

```ts
import { generatedFieldIds } from '../../dsl/symbol-table.ts';
import { listViewOwners } from '../factories.ts';
import { findKindEntry } from '../kind-discriminant.ts';
import { rustTransportStructName, transportSlotShapeOf } from '../render-module.ts';
import { isTextLeaf } from '../shared.ts';
import { AssembledList, type AssembledNode, type AssembledNonterminal } from '../../compiler/model/node-map.ts';
import {
	assertOneUntaggedSlot,
	enumKindArgs,
	flankArgs,
	readNames,
	slotArgs,
	transportArgs,
	type ReadFactsCtx
} from '../transport-projection.ts';

describe('transport read facts', () => {
	let model: Awaited<ReturnType<typeof modelFor>>;
	let ctx: ReadFactsCtx;
	beforeAll(async () => {
		model = await modelFor('rust');
		ctx = {
			nodeMap: model.nodeMap,
			kindEntries: model.kindEntries,
			names: readNames(model.kindEntries, generatedFieldIds(model.generatedIdTables)),
			listOwners: new Set(listViewOwners(model.nodeMap).map((node) => node.kind))
		};
	}, 120_000);

	const node = (struct: string): AssembledNode => {
		const found = [...model.nodeMap.nodes.values()].find((n) => rustTransportStructName(n) === struct);
		if (found === undefined) throw new Error(`no kind emits ${struct}`);
		return found;
	};
	const ownId = (n: AssembledNode): number => findKindEntry(model.kindEntries, n.kind)!.id;
	const args = (struct: string): string => {
		const n = node(struct);
		return transportArgs(n, ownId(n), model.templates.bodies.get(n.kind), ctx);
	};
	const slot = (struct: string, storageName: string) => node(struct).slots.find((s) => s.storageName === storageName)!;
	const shape = (s: AssembledNonterminal) => transportSlotShapeOf(s, model.nodeMap);

	it('lists the tokens a kind writes itself as its layout', () => {
		expect(args('FunctionItemTransport')).toBe('kind = kind::FUNCTION_ITEM, layout = [kind::FN_KEYWORD, kind::DASH_GT]');
	});

	it('gives a list owner its minimum depth, its tokens and its inner gap', () => {
		expect(args('ParametersTransport')).toBe(
			'kind = kind::PARAMETERS, min_depth = 2, layout = [kind::LPAREN, kind::RPAREN], gap(1) = elements'
		);
	});

	it('marks a separated list, its item slot, its separator and the flank it leaves optional', () => {
		const list = node('ParametersElementsTransport') as AssembledList;
		expect(args('ParametersElementsTransport')).toBe('kind = kind::PARAMETERS_ELEMENTS, list, item = item');
		expect(slotArgs(slot('ParametersElementsTransport', 'item'), list, shape(slot('ParametersElementsTransport', 'item')), ctx)).toBe('field = field::ITEM, separator = kind::COMMA');
		expect(flankArgs(list)).toBe('trailing = 0');
	});

	it('reads a token interior by its pattern and an envelope by its display id', () => {
		expect(args('IntegerLiteralDecimalTransport')).toBe(
			'kind = kind::INTEGER_LITERAL_DECIMAL, interior = "^(?<content>(?:[0-9][0-9_]*))(?<suffix>isize|usize|u128|i128|u16|i16|u32|i32|u64|i64|f32|f64|u8|i8)?$"'
		);
		expect(args('TypeIdentifierTransport')).toBe('kind = kind::_TYPE_IDENTIFIER, display, envelope, content = content');
	});

	it('reads a leaf as its text', () => {
		expect(args('IdentifierTransport')).toBe('kind = kind::IDENTIFIER, text');
	});

	it('reads as text exactly the kinds whose transport holds text', async () => {
		const src = await getRustTemplatesRs();
		const holdsText = new Map(
			[...src.matchAll(/^pub struct (\w+) \{\n([^}]*)^\}/gm)].map((m) => [m[1]!, /^    pub text: String,$/m.test(m[2]!)])
		);
		let structs = 0;
		for (const n of model.nodeMap.nodes.values()) {
			const holds = holdsText.get(rustTransportStructName(n));
			if (holds === undefined) continue;
			structs++;
			const reads = /^kind = [\w:]+, text\b/.test(transportArgs(n, ownId(n), model.templates.bodies.get(n.kind), ctx));
			expect(reads, n.kind).toBe(holds);
		}
		expect(structs).toBeGreaterThan(0);
	});

	it('reads a keyword the spelled-leaf set holds as its kind id, not as text', async () => {
		const src = await getRustTemplatesRs();
		const mutable = model.nodeMap.nodes.get('mutable_specifier')!;
		expect(isTextLeaf(mutable) && mutable.modelType === 'keyword').toBe(true);
		expect(src).not.toMatch(/^pub struct MutableSpecifierTransport \{/m);
		expect(src).toMatch(/^pub enum MutableSpecifierTransport \{\n    MutableSpecifier,\n\}/m);
	});

	it('routes a presence slot by its field and names its keyword', () => {
		expect(slotArgs(slot('LetDeclarationTransport', 'mutable'), node('LetDeclarationTransport'), shape(slot('LetDeclarationTransport', 'mutable')), ctx)).toBe(
			'field = field::MUTABLE, presence = kind::MUTABLE_SPECIFIER'
		);
	});

	it('reads an enum kind by its own id, and its own node by the member its tokens spell', () => {
		expect(enumKindArgs(ownId(node('PrimitiveTypeEnum')), ctx)).toBe('kind = kind::_PRIMITIVE_TYPE, spelled');
	});

	it('refuses two slots of one kind that take the same untagged kind', () => {
		expect(() =>
			assertOneUntaggedSlot('where_clause', [{ name: 'a', ids: [1, 7] }, { name: 'b', ids: [130, 1] }], model.kindEntries)
		).toThrow(/where_clause.*'a'.*'b'.*identifier \(kind 1\)/);
	});
});
```

The expected texts are the spec's Appendix A declarations, less the record offsets. Rust's constants were checked against `render/kind_ids.rs`:

- `FN_KEYWORD` 39, `DASH_GT` 131, `COMMA` 130;
- `MUTABLE_SPECIFIER` 57 (the parser tags it with the field `mutable`);
- `_TYPE_IDENTIFIER` 468, `_PRIMITIVE_TYPE` 341, `U8_KEYWORD` 58, `BOOL_KEYWORD` 72.

A text leaf is `isTextLeaf`, the set today's wrap reads through `_spelledLeaf`: patterns, enum kinds, and fixed-text leaves with a builder. Each of the three has its own transport, so each has its own read mode:
- a pattern's struct holds `text` and reads in text mode;
- an enum kind is `renderEnumType`'s choice and reads `spelled`;
- a fixed-text leaf (`mutable_specifier`, `crate`, `self`) is a one-variant choice read by its kind id.

So among kinds with a struct, `isTextLeaf` selects the patterns. Measured on the five grammars' generated transports, the 64 structs with a `text` field all belong to pattern kinds, apart from `VerbatimTransport`, which no reader produces. The agreement test checks that the read mode matches the struct's `text` field for every rust struct, so a struct and its mode cannot part unnoticed.

A kind with slots that today's read collapses into `$text`, such as `parameters` read from `()`, keeps its routed struct:
- the detach keeps that `$text` only on a node holding no slots;
- the struct has no field for it;
- the reader skips the two layout tokens.

A node with no named child reads, today, as its text with no slot keys, so a slot it holds nothing in is absent there. The typed read fills that slot with its empty value: `Some([])` for a list, the blank arm for an optional slot that has one. The corpus comparison names each such slot and lists it per grammar; every other difference fails it.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts -t "transport read facts"`
Expected: FAIL: `transport-projection.ts` exports none of `readNames`, `transportArgs`, `slotArgs`.

- [ ] **Step 3: Move the shared facts**

Move `aliasEnvelopesOf`, `aliasEnvelopeIds` and `fieldTaggedLiteralTexts` from `wrap.ts` to `shared.ts` unchanged, exported, and import them in `wrap.ts`. Use the LSP or `lspeasy` move, per the repo's practice for moves. Then split `separatorIdsExprOf`'s set into `shared.ts`:

```ts
export function slotDropTexts(slot: AssembledNonterminal, owner: AssembledNode | undefined, elided: boolean): string[] {
	const tagged = owner !== undefined && slot.fieldName !== undefined ? (fieldTaggedLiteralTexts(owner).get(slot.fieldName) ?? []) : [];
	return [...new Set([...slotSeparatorTexts(slot, elided), ...tagged])];
}
```

```ts
// wrap.ts
function separatorIdsExprOf(f: AssembledNonterminal, owner: AssembledNode | undefined, kindEntries: readonly KindEnumEntry[] | undefined, elided: boolean): string | undefined {
	if (!kindEntries) return undefined;
	const sepTexts = slotDropTexts(f, owner, elided);
	if (sepTexts.length === 0) return undefined;
	return `[${sepTexts.map((text) => kindDiscriminantExprForLiteral(text, kindEntries)).join(', ')}]`;
}
```

In `kind-id-rust.ts`, name the scalar-storage test once and use it in `scalarChildRows`:

```ts
export function isScalarStorage(slot: AssembledNonterminal): boolean {
	const info = slot.storageInfo;
	return info !== undefined && SCALAR_STORAGE.has(info.kind) && info.enumKindsById.size > 0;
}
```

In `render-module.ts`, export `rustTransportStructName`, `transportSlotShapeOf` and `TransportSlotShape`.

- [ ] **Step 4: Implement the read facts in `transport-projection.ts`**

Merge these imports into the file's own (it already imports `NodeMap`, the node types and `./shared.ts`), then append the code below them.

```ts
import {
	AbstractAssembledCompound,
	AssembledAlias,
	AssembledList,
	kindIdText
} from '../compiler/model/node-map.ts';
import { findKindEntry, findKindEntryForLiteral, type KindEnumEntry } from './kind-discriminant.ts';
import { isScalarStorage, kindConstName } from './kind-id-rust.ts';
import { fieldConstName } from './field-id-rust.ts';
import { queryRoutesOf } from './client-utils.ts';
import { canonicalSeparatedListField, isTextLeaf, slotDropTexts } from './shared.ts';
import { interiorOf } from './interior.ts';
import { rustStringLiteral, type Body } from './render-body.ts';
import { rustFieldIdent } from './transport-common.ts';
import type { TransportSlotShape } from './render-module.ts';

export interface ReadNames {
	kind(id: number): string;
	field(name: string): string;
}

export function readNames(kindEntries: readonly KindEnumEntry[], fieldIds: readonly { readonly name: string }[]): ReadNames {
	const kinds = new Map<number, string>();
	for (const { name, id } of kindConstants(kindEntries)) if (!kinds.has(id)) kinds.set(id, `kind::${name}`);
	const fields = new Set(fieldIds.map((field) => field.name));
	return {
		kind(id) {
			const name = kinds.get(id);
			if (name === undefined) throw new Error(`transport read facts: kind id ${id} has no constant in kind_ids.rs`);
			return name;
		},
		field(name) {
			if (!fields.has(name)) throw new Error(`transport read facts: '${name}' is not in parser.c's field table`);
			return `field::${fieldConstName(name)}`;
		}
	};
}

export interface ReadFactsCtx {
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly names: ReadNames;
	readonly listOwners: ReadonlySet<string>;
}

function oneOrList(paths: readonly string[]): string {
	return paths.length === 1 ? paths[0]! : `[${paths.join(', ')}]`;
}

function literalIds(texts: readonly string[], ctx: ReadFactsCtx, what: string): number[] {
	return texts.map((text) => {
		const id = findKindEntryForLiteral(ctx.kindEntries, text)?.id;
		if (id === undefined) throw new Error(`transport read facts: ${what} ${JSON.stringify(text)} has no parser symbol`);
		return id;
	});
}

export function layoutTokenIds(body: Body, ctx: ReadFactsCtx): number[] {
	const ids: number[] = [];
	const walk = (nodes: Body): void => {
		for (const node of nodes) {
			if (node.kind === 'text') {
				const id = findKindEntryForLiteral(ctx.kindEntries, node.text)?.id;
				if (id !== undefined && !ids.includes(id)) ids.push(id);
			} else if (node.kind === 'if') {
				for (const arm of node.arms) walk(arm.body);
				if (node.fallback !== undefined) walk(node.fallback);
			}
		}
	};
	walk(body);
	return ids;
}

export function listItemSlot(node: AssembledNode): AssembledNonterminal | undefined {
	if (!(node instanceof AssembledList)) return undefined;
	const flagged = flankArgs(node) !== undefined || node.separatorRule !== undefined;
	return flagged ? canonicalSeparatedListField(node) : undefined;
}

export function transportArgs(node: AssembledNode, ownId: number, body: Body | undefined, ctx: ReadFactsCtx): string {
	if (node instanceof AssembledAlias) return `kind = ${ctx.names.kind(node.aliasTypeId)}, display, envelope, content = content`;
	const kind = `kind = ${ctx.names.kind(ownId)}`;
	if (isTextLeaf(node)) {
		const fixed = kindIdText(node);
		return fixed === undefined ? `${kind}, text` : `${kind}, text = ${rustStringLiteral(fixed)}`;
	}
	const interior = interiorOf(node);
	if (interior !== undefined) return `${kind}, interior = ${rustStringLiteral(interior.regex)}`;
	const args = [kind];
	if (ctx.listOwners.has(node.kind)) args.push('min_depth = 2');
	const layout = body === undefined ? [] : layoutTokenIds(body, ctx);
	if (layout.length > 0) args.push(`layout = [${layout.map((id) => ctx.names.kind(id)).join(', ')}]`);
	if (node instanceof AbstractAssembledCompound) {
		for (const gap of node.innerGaps) args.push(`gap(${gap.precedingTokens}) = ${gap.key}`);
	}
	const item = listItemSlot(node);
	if (item !== undefined) args.push(`list, item = ${rustFieldIdent(item.storageName)}`);
	return args.join(', ');
}

export function takesUntagged(slot: AssembledNonterminal, ctx: ReadFactsCtx): boolean {
	const routes = queryRoutesOf(slot, ctx.nodeMap);
	return routes.fields.length === 0 || routes.kinds.length > 0;
}

export function slotArgs(slot: AssembledNonterminal, owner: AssembledNode, shape: TransportSlotShape, ctx: ReadFactsCtx): string {
	const args: string[] = [];
	const routes = queryRoutesOf(slot, ctx.nodeMap);
	if (routes.fields.length > 0) {
		args.push(`field = ${oneOrList(routes.fields.map((name) => ctx.names.field(name)))}`);
		if (routes.kinds.length > 0) args.push('untagged');
	}
	if (shape.tag === 'presence') {
		const keyword = shape.kind === undefined ? findKindEntryForLiteral(ctx.kindEntries, shape.text) : findKindEntry(ctx.kindEntries, shape.kind.kind);
		if (keyword === undefined) throw new Error(`transport read facts: ${owner.kind}.${slot.name}'s keyword has no parser symbol`);
		args.push(`presence = ${ctx.names.kind(keyword.id)}`);
	}
	const separators = literalIds(slotDropTexts(slot, owner, false), ctx, `${owner.kind}.${slot.name}'s separator`);
	if (separators.length > 0) args.push(`separator = ${oneOrList(separators.map((id) => ctx.names.kind(id)))}`);
	if (shape.tag === 'text' && isScalarStorage(slot)) args.push('scalar');
	return args.join(', ');
}

export function captureArgs(slot: AssembledNonterminal): string {
	return `capture = ${rustStringLiteral(slot.name)}`;
}

export function flankArgs(list: AssembledList): string | undefined {
	const args: string[] = [];
	if (list.leadingDelimiter === 'optional') args.push(`leading = ${list.trailingDelimiter === 'mandatory' ? 1 : 0}`);
	if (list.trailingDelimiter === 'optional') args.push(`trailing = ${list.leadingDelimiter === 'mandatory' ? 1 : 0}`);
	return args.length === 0 ? undefined : args.join(', ');
}

export function separatorKindArgs(list: AssembledList, ctx: ReadFactsCtx): string | undefined {
	if (list.separatorRule === undefined) return undefined;
	const candidates = list.separatorCandidateKindNames.flatMap((name) => {
		const entry = findKindEntry(ctx.kindEntries, name);
		return entry === undefined ? [] : [ctx.names.kind(entry.id)];
	});
	const declared = list.resolvedSeparatorArm === undefined ? undefined : findKindEntry(ctx.kindEntries, list.resolvedSeparatorArm);
	return `candidates = [${candidates.join(', ')}]${declared === undefined ? '' : `, default = ${ctx.names.kind(declared.id)}`}`;
}

export function enumKindArgs(ownId: number, ctx: ReadFactsCtx): string {
	return `kind = ${ctx.names.kind(ownId)}, spelled`;
}

export function variantKindArgs(ids: readonly number[], display: boolean, ctx: ReadFactsCtx): string {
	return [...ids.map((id) => ctx.names.kind(id)), ...(display ? ['display'] : [])].join(', ');
}

export function assertOneUntaggedSlot(
	kind: string,
	slots: readonly { readonly name: string; readonly ids: readonly number[] }[],
	kindEntries: readonly KindEnumEntry[]
): void {
	for (let i = 0; i < slots.length; i++) {
		for (let j = i + 1; j < slots.length; j++) {
			const shared = slots[i]!.ids.find((id) => slots[j]!.ids.includes(id));
			if (shared === undefined) continue;
			const name = kindEntries.find((entry) => entry.id === shared)?.kind ?? '?';
			throw new Error(
				`transport read facts: ${kind} has two slots, '${slots[i]!.name}' and '${slots[j]!.name}', that take an untagged ${name} (kind ${shared}); the reader could not choose between them`
			);
		}
	}
}
```

`TransportSlotShape` and `transportSlotShapeOf` stay in `render-module.ts`; export both, with `rustTransportStructName`. This module imports only the type, so the runtime dependency runs one way, from `render-module.ts` to here.

Write one glossary entry for each new or moved declaration in `docs/glossary/emitters.md`, and update the paths of the moved ones.

- [ ] **Step 5: Run the tests**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
Expected: PASS, the existing tests included. A fact test that fails on its expected text is a finding about the model or the spec's example, not about the expected text: stop and report the actual text.

- [ ] **Step 6: Gates and commit**

Nothing generated changes in this task: `separatorIdsExprOf`'s output is the same set. Regenerate the five grammars and run the global gates; `git status --short packages rust` must show no generated file changed.

```bash
git commit -F msg -- packages/codegen/src docs/glossary/emitters.md
```

Message: `feat(codegen): the read facts each transport declares, from the derivations the wrap uses`.

---

## Task 9: Attributes and derives on every transport, and the unfielded diagnostic

`transport.rs` gains, per type, `#[derive(…, PartialEq, ::sittir_core::Transport)]` and the attributes Task 8 computes. Each choice's variants carry the ids today's claim loop gives them. A struct whose slots could take one untagged kind twice fails codegen. Nothing reads through the derive yet, so rendered bytes and validation rows must not move.

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/emitters/native-crate.ts` (`kind_name` in the generated `EngineGrammar` impl, used by Task 10)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`EngineGrammar::kind_name`, and the test grammar's impl)
- Test: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
- Generated: `rust/crates/sittir-*/src/render/transport.rs`, `rust/crates/sittir-*/src/lib.rs`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: Task 8's functions; Task 4–7's derive.
- Produces: generated transports that implement `ReadTransport` (`AnyTransport` included, which is the spec's `read_any`) and `PartialEq`; `EngineGrammar::kind_name(self, KindId) -> &'static str`.

- [ ] **Step 1: Write the failing tests**

Add `AbstractAssembledCompound` to the file's `node-map.ts` import, and import `hasBlankArm` from `../../compiler/model/site-preferences.ts`. `getTypescriptTransportRs()` emits from `modelFor('typescript')`'s node map, and the emit registers preference slots on it, so the census test calls it first.

```ts
describe('transport attributes', () => {
	it('derives the reader and states the read facts on a struct', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toContain('use super::{field_ids as field, kind_ids as kind};');
		expect(src).toMatch(
			/#\[derive\(Debug, Clone, PartialEq, ::sittir_core::Transport\)\]\n#\[transport\(kind = kind::FUNCTION_ITEM, layout = \[kind::FN_KEYWORD, kind::DASH_GT\]\)\]\npub struct FunctionItemTransport \{/
		);
		expect(extractStructBody(src, 'FunctionItemTransport')).toMatch(/    #\[slot\(field = field::NAME\)\]\n    pub name: /);
		expect(extractStructBody(src, 'ParametersElementsTransport')).toMatch(/    #\[flank\(trailing = 0\)\]\n    pub delimiter: Option<u8>,/);
	});

	it("gives a choice's variants the ids today's decode claims for them", async () => {
		const src = await getRustTemplatesRs();
		const typeEnum = src.slice(src.indexOf('pub enum TypeTransport {'));
		expect(src).toMatch(/#\[transport\(choice\)\]\npub enum TypeTransport \{/);
		expect(typeEnum).toMatch(/    #\[kind\(kind::NEVER_TYPE[^\]]*\)\]\n    NeverType,/);
		expect(typeEnum).toMatch(/    #\[kind\(kind::_PRIMITIVE_TYPE[^\]]*kind::U8_KEYWORD[^\]]*\)\]\n    PrimitiveType\(PrimitiveTypeEnum\),/);
		expect(src).toMatch(/#\[transport\(kind = kind::_PRIMITIVE_TYPE, spelled\)\]\npub enum PrimitiveTypeEnum \{\n    #\[kind\(kind::U8_KEYWORD\)\]\n    U8,/);
	});

	it('marks the blank arm of a slot that has one', async () => {
		const src = await getTypescriptTransportRs();
		const terminator = src.slice(src.indexOf('pub enum StatementBlockTerminatorTransportSlot {'));
		expect(terminator).toMatch(/    #\[transport\(blank\)\]\n    Blank,/);
	});

	it('gives a blank arm only to the choices that blank options hold', async () => {
		const src = await getTypescriptTransportRs();
		const model = await modelFor('typescript');
		const blankOptions = [...model.nodeMap.nodes.values()]
			.flatMap((n) => (n instanceof AbstractAssembledCompound ? n.slots : []))
			.filter(hasBlankArm);
		const blankChoices = [...src.matchAll(/pub enum (\w+) \{[^}]*\n    #\[transport\(blank\)\]\n    Blank,/g)].map((m) => m[1]!);
		const heldByBlankChoices = [...src.matchAll(/pub \w+: Option<::sittir_core::SlotValue<(\w+)>>,/g)].filter((m) => blankChoices.includes(m[1]!));
		const blankIdArms = [...src.matchAll(/ 0 => (?:Ok|Some)\(Self::Blank\)/g)];
		expect(blankOptions).toHaveLength(9);
		expect(heldByBlankChoices).toHaveLength(blankOptions.length);
		expect(blankChoices).toHaveLength(4);
		expect(blankIdArms).toHaveLength(3 * blankChoices.length);
	});
});
```

The exact claim order inside a variant's `#[kind(…)]` is the claim loop's, so the tests pin only what the spec's example states. A field's read attribute sits directly above the field, after its `#[cfg_attr(… napi(js_name …))]` line.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts -t "transport attributes"`
Expected: FAIL (no `use super::{field_ids …}` line).

- [ ] **Step 3: Print the facts**

In `emitRenderModule`, after `'use super::options;'`, add `'use super::{field_ids as field, kind_ids as kind};'`. Thread a `ReadFactsCtx` and the template bodies (`new Map(structs.map((s) => [s.kind, s.body]))`) from `renderTransportSupport` into the printers below. The ctx is built once, with `readNames(kindEntries, generatedFieldIds(generatedIdTables))` and `listViewOwners(nodeMap)`. Record each printed type's admitted ids in one `admitted: Map<string, number[]>` (type name → ids) for the diagnostic.

Every printed type puts its attributes in this order: `#[cfg_attr(… napi(object))]` when it has one, then `#[derive(…)]`, then `#[transport(…)]`. A helper attribute above the derive that introduces it is an error in Rust.

1. **Structs** (`renderTransportDataStruct`): print `#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]` and `#[transport(${transportArgs(node, ownId, body, ctx)})]`.
   - Admitted ids: `[aliasTypeId]` for an envelope, else `[ownId]`.
   - Give `renderTransportField` a `readAttr` argument and print it between the napi line and the field. An alias envelope's content field has none (it is not a parser field; the derive names it by `content = …`). Otherwise it is `#[slot]` when `slotArgs(slot, node, transportSlotShapeOf(slot, nodeMap), ctx)` is empty and `#[slot(${args})]` otherwise, or `#[slot(${captureArgs(slot)})]` for each slot of an interior kind (`interiorOf(node) !== undefined`). A hoisted inner slot passes its helper node as the owner.
   - On a list's `delimiter` field, print `#[flank(${flankArgs(node)})]`, and on its `separator_kind` field `#[separator_kind(${separatorKindArgs(node, ctx)})]`, in the same position.
   - Spacing fields get no attribute: they read as their `Default`, as today's read leaves them unset.
2. **Enum kinds** (`renderEnumType`): build `arms` (each member's `enumMemberId`) before printing the enum, not after it. Print `#[derive(Debug, Clone, Copy, PartialEq, Eq, ::sittir_core::Transport)]`, then `#[transport(${enumKindArgs(ownId, ctx)})]`, and `#[kind(${variantKindArgs(arm.ids, false, ctx)})]` above each member, from the same `arms` `kindIdNapiImpls` decodes by. Admitted ids: the kind's own id and every member's.
3. **Fixed literals** (`renderFixedLiteralTransport`): print `#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]`, `#[transport(choice)]`, and `#[kind(…)]` on the one variant with the ids `fixedLiteralNapiImpls` accepts. Name that id list once (`fixedLiteralIds(fixed)`) and use it in both.
4. **Supertype choices** (`emitSupertypeTransportEnum`): run `buildKindIdArms` before printing the enum, and record in `claim` which ids each member takes (`claimedBy: Map<variant, number[]>`, first claim wins as now).
   - Print `#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]` and `#[transport(choice)]`.
   - Print `#[kind(${variantKindArgs(ids, false, ctx)})]` on each variant with claimed ids.
   - An envelope member (`subNode instanceof AssembledAlias`) prints `#[kind(${ctx.names.kind(subNode.aliasTypeId)}, display)]` alone. Any other id the claim loop gave it is not printed: it is checked against `ENVELOPE_EXTRA_IDS` in `envelope-claims.ts`, a ceiling per grammar and variant that only shrinks (typescript's three `*PropertyIdentifierTransportSlot` variants hold the keyword ids `7` and `30`–`50`; the other grammars none). A new id fails the build; a pinned id a variant no longer claims fails it too, until the pin is lowered.
   - A variant with no claimed id gets no `#[kind]` and is never read, as no arm decodes it today.
5. **Per-slot choices** (`emitPerSlotChildEnum`): compute `unitIds` and the node kinds' accepted ids before printing.
   - Group unit ids by `unit.variant`; node kinds claim as now, first claim wins.
   - A unit variant also lists the alternate ids `kindEnumAltIdPairs(slot, nodeMap)` folds into its id, for the slot the enum was built for (`nodeMap.nodes.get(entry.ownerKind)` and `entry.fieldName`, as the blank-arm check finds it). Today's wrap folds those ids before the wire (`projectKindEnumStorage`), so today's decode never meets them, but the reader reads the parser's own id.
   - Print the same derive and `#[transport(choice)]`.
   - Print `#[kind(…)]` per variant, with the envelope rule above.
   - Print `#[transport(blank)]` on `BLANK_VARIANT` when `blank`, which stays `hasBlankArm(modelSlot)`: the model's preference fact is the attribute's only source. Record the choice's name in `blankChoices: Set<string>`.
6. **`AnyTransport`** (`renderAnyTransportWithNapiFromValue`): print `#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]` and `#[transport(choice)]`.
   - Each payload variant gets `#[kind(…)]` with the id its decode arm claims (first claim wins), with the envelope rule.
   - Each fixed literal's unit variant gets its `ownId`.
   - `Verbatim` gets none.
7. **`TriviaTransport`, `VerbatimTransport`**, and any other type a transport field holds: add `PartialEq` to the derive. The compiler names any missing one.

Today's decode also has arms that try members in turn rather than claiming an id: a supertype's own id, its suppressed kinds, its self-alias ids, and a per-slot enum's alias-wrapper ids. A `#[kind]` list cannot express a trial, so these arms get no attribute. If one of them carries real corpus nodes, Task 10's harness reports a refusal (`Unadmitted`) or a difference at that node. The stop rule then applies: report the kind and the arm, and do not add a fallback.

After all types are printed, run the diagnostic. For each struct, call `assertOneUntaggedSlot(node.kind, slots, kindEntries)` with its slots that take untagged children (`takesUntagged`). Each slot's ids are `admitted.get(typeName)`, where `typeName` is the inner type `rustTransportSlotType` wraps. Factor `slotTransportTypeName(slot, nodeMap, choices, typeName)` out of `rustTransportSlotType` and use it in both. A presence slot's ids are its keyword's.

In the same pass, check the blank arms. For every struct slot, `blankChoices.has(slotTransportTypeName(…))` must equal `hasBlankArm(slot)`. A per-slot choice is named for the first slot that needs it and shared by every slot with the same name (typescript's `StatementBlockTerminatorTransportSlot` serves six), and its blank arm is decided by that first slot. So a shared choice whose slots disagree is a codegen error naming the choice, the slots registered as preferences and the slots that are not. The expected count is zero.

In `native-crate.ts`, add to the generated `impl EngineGrammar`:

```rust
    fn kind_name(self, kind: ::sittir_core::types::KindId) -> &'static str {
        render::kind_ids::kind_name_from_id(kind)
    }
```

and in `engine.rs`'s `EngineGrammar` trait:

```rust
    /// The name of a kind of this grammar, for messages that name one.
    fn kind_name(self, kind: KindId) -> &'static str;
```

The test grammar in `engine.rs`'s tests returns `"test"`.

Write glossary entries for `slotTransportTypeName`, `fixedLiteralIds` and the changed printers.

- [ ] **Step 4: Run the tests, regenerate, build**

Run the vitest file (PASS). Regenerate all five grammars, then run `rtk cargo build --workspace`. The build runs with the napi features, so the derive and `#[napi(object)]` meet on the same structs.

If `#[napi(object)]` rejects the helper attributes, or the derive and the napi codec conflict in some other way, stop and report the error. That is 1b's codec arriving early, and needs a ruling.

Then run `rtk cargo test --workspace --no-default-features`; every Task 2–7 test passes against the regenerated crates.

Record the compile time of `sittir-rust` before this task and after, measured with the same command on a quiet machine, in a copy outside any watched worktree. The spec's synthetic measure for 395 kinds is 8.4 s for the reader on napi objects, against 3.8 s for today's napi derive alone. Rust's real `transport.rs` will differ; the record is the before/after pair, not the spec's number.

- [ ] **Step 5: Gates and commit**

The global gates. Rendered bytes and every validation row must be unchanged, since no consumer reads through the derive yet. A moved row stops the task (rule 5b).

```bash
git commit -F msg -- packages/codegen/src rust/crates docs/glossary/emitters.md
```

Message: `feat(codegen): every transport declares its read facts and derives the typed reader`.

---

## Task 10: The corpus parity harness

The gate of 1a: for every corpus entry of the five grammars, the typed read of the whole tree equals what today's read and wrap give the render side, detached from the tree, and refuses nothing. Two transitional native methods answer it. One reads with the typed reader and reports a refusal. The other decodes today's detached data into the same transport types and compares. The harness drives both, and `sittir tool typed-read-parity` reports them.

Today's detached data carries two things the typed reader leaves to the render side, and the harness drops both before comparing: `$_layout.gap` and `$_layout.flank` (layout evidence), and an empty `$_layout`. It keeps the trivia entries, which arrive as coordinates (`$treeHandle`, `$span`, `$type`) and decode as `SlotValue::Coord`, the form the typed reader gives them. `SlotValue`'s equality compares a coordinate by its tree, span and kind, so the handle's form does not matter.

The two reads differ in one class by construction, and the comparison reports it instead of failing on it: a slot today's read leaves absent because its node has no named child, which the typed read fills with its empty value. The native comparison prints each as a `normalized: <Kind>.<slot>` line, and the harness holds the rows it accepts per grammar as (entry, kind, slot), a list that may only shrink. A row outside the list is a difference, and a listed row the corpus no longer shows fails the run as stale, so the list is exact.

The harness also reports the envelope pin (`ENVELOPE_EXTRA_IDS` in `envelope-claims.ts`): for each pinned id of each variant, how many corpus nodes the reader's display pass admits as that variant, and whether the id still shows as the variant's display id. A variant that claims an id outside its pin, or a pinned id that stops displaying as the variant's display id, fails the run. The pin is a ceiling; the report says whether the ids it holds are reached by the corpus.

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs` (`ParsedTree::typed_read`)
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`typed_read_refusal`, `typed_read_parity`, `parity_report`)
- Modify: `packages/common/src/engine.ts` (`NativeEngineLike`, `NativeEngineDiagnostics`, `createNativeEngine`)
- Create: `packages/tools/src/validate/typed-read-parity.ts`
- Modify: `packages/tools/src/index.ts` (export)
- Create: `packages/cli/src/commands/tool/typed-read-parity.ts`
- Modify: `packages/cli/src/commands/tool/index.ts`
- Modify: `docs/glossary/packages-tools-src-validate.md`, `docs/cli-command-glossary.md` (regenerated)

**Interfaces:**
- Consumes: Task 9's `ReadTransport` on `RenderRoot`, `PartialEq` on transports, `EngineGrammar::kind_name`.
- Produces:
  - `ParsedTree::typed_read<R: ReadRoot>(&self, depth: Depth) -> Result<R, ReadError>`;
  - napi `typedReadRefusal(treeId: number): string | null` and `typedReadParity(treeId: number, today: object): string | null`;
  - diagnostics `typedReadRefusal(treeId)` and `typedReadParity(treeId, today)`;
  - `computeTypedReadParity(grammar): Promise<TypedReadParityCensus>`, and `run(opts): Promise<number>` exported as `typedReadParity`.

- [ ] **Step 1: The native side**

`engine.rs`, on `ParsedTree`:

```rust
    /// The whole tree read into the grammar's typed transports, `depth`
    /// levels down, or the refusal that stopped the read.
    pub fn typed_read<R: crate::read::ReadRoot>(&self, depth: crate::read::Depth) -> Result<R, crate::read::ReadError> {
        let ctx = crate::read::ReadCtx::new(&self.source, self.tree_id);
        R::read_root(&mut self.tree.walk(), &ctx, depth)
    }
```

Use the field names `ParsedTree` declares (`engine.rs`, the struct at the top of the file). If the source is an `Arc<str>`, pass `&self.source` as is: `&Arc<str>` derefs to `&str`.

`napi_engine.rs`, inside `impl SittirEngine` in the macro, after `read_root`:

```rust
            /// Transitional, while today's read and the typed read both exist:
            /// the refusal the typed reader meets reading tree `treeId` whole,
            /// or `null` when it reads it.
            #[::napi_derive::napi]
            pub fn typed_read_refusal(&self, tree_id: f64) -> ::napi::Result<Option<String>> {
                self.with_typed_read(tree_id, |typed: ::std::result::Result<$render_root, $crate::read::ReadError>, name| {
                    Ok(typed.err().map(|refusal| refusal.describe(name)))
                })
            }

            /// Transitional, while today's read and the typed read both exist:
            /// compare the typed read of tree `treeId` with `today`, the detached
            /// root today's read and wrap give it. `null` when they agree;
            /// otherwise the refusal, or the first place the two differ.
            #[::napi_derive::napi(ts_args_type = "treeId: number, today: object")]
            pub fn typed_read_parity(&self, tree_id: f64, today: $render_root) -> ::napi::Result<Option<String>> {
                self.with_typed_read(tree_id, |typed: ::std::result::Result<$render_root, $crate::read::ReadError>, name| {
                    Ok(match typed {
                        Err(refusal) => Some(format!("refused: {}", refusal.describe(name))),
                        Ok(typed) if typed == today => None,
                        Ok(typed) => Some($crate::napi_engine::parity_report(&format!("{typed:#?}"), &format!("{today:#?}"))),
                    })
                })
            }
```

and in the non-napi `impl SittirEngine` block of the macro:

```rust
            fn with_typed_read<T>(
                &self,
                tree_id: f64,
                then: impl FnOnce(
                    ::std::result::Result<$render_root, $crate::read::ReadError>,
                    &dyn Fn($crate::types::KindId) -> &'static str,
                ) -> ::napi::Result<T>,
            ) -> ::napi::Result<T> {
                let tree_id = $crate::napi_engine::checked_index(tree_id, "treeId")?;
                let tree_id = u32::try_from(tree_id)
                    .map_err(|_| ::napi::Error::from_reason(format!("treeId {tree_id} names no tree")))?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    let typed = ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| {
                        parsed.typed_read::<$render_root>($crate::read::Depth::All)
                    }))
                    .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(payload, "typed_read panicked")))?;
                    let grammar = <$grammar as ::std::default::Default>::default();
                    then(typed, &|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))
                })
            }
```

and, beside `tree_not_live`:

```rust
/// Both reads' debug text from their first difference: twelve lines of each
/// around it. A coordinate's handle and text-only flag differ between the two
/// readers by construction, and `SlotValue`'s equality leaves them out, so the
/// report does too.
pub fn parity_report(typed: &str, today: &str) -> String {
    let kept = |dump: &str| -> Vec<String> {
        dump.lines()
            .filter(|line| {
                let line = line.trim_start();
                !(line.starts_with("handle: ") || line.starts_with("text_only: "))
            })
            .map(str::to_owned)
            .collect()
    };
    let (typed, today) = (kept(typed), kept(today));
    let first = typed.iter().zip(&today).position(|(a, b)| a != b).unwrap_or(typed.len().min(today.len()));
    let window = |lines: &[String]| lines[first.saturating_sub(12)..(first + 12).min(lines.len())].join("\n");
    format!("first difference at line {first}\n--- typed read\n{}\n--- today's read\n{}", window(&typed), window(&today))
}
```

Run `rtk cargo build --workspace` (with napi). Then regenerate the five grammars' `native/index.d.ts` the way the build does, and check that each declares both new methods:

```bash
for g in rust typescript python scm regex; do awk '/typedRead(Refusal|Parity)\(/{n++} END{print FILENAME": "n+0}' packages/$g/native/index.d.ts; done
```

Expected: `2` for each file. The standalone native type-check (`type-check:native`) is not a 1a gate, because it waits for the derive codec. Today's generated declarations fail it, and it passes only once 1b's codec replaces `#[napi(object)]`. 1b runs it and chains it into `type-check`.

- [ ] **Step 2: The JavaScript plumbing**

`packages/common/src/engine.ts`:

- `NativeEngineLike`: add `typedReadRefusal?(treeId: number): string | null;` and `typedReadParity?(treeId: number, today: TTransport): string | null;`. Both are optional because they are transitional.
- `NativeEngineDiagnostics`: add

```ts
	/** Transitional: the refusal the typed reader meets reading tree `treeId` whole, or `null`. */
	typedReadRefusal(treeId: number): string | null;
	/** Transitional: compare the typed read of tree `treeId` with `today`, detached render input for its root; `null` when they agree. */
	typedReadParity(treeId: number, today: unknown): string | null;
```

- in `createNativeEngine`'s `diagnostics`:

```ts
				typedReadRefusal(treeId: number): string | null {
					if (engine.typedReadRefusal === undefined) throw new Error('typedReadRefusal: this native binary has no typed reader');
					return engine.typedReadRefusal(treeId);
				},
				typedReadParity(treeId: number, today: unknown): string | null {
					if (engine.typedReadParity === undefined) throw new Error('typedReadParity: this native binary has no typed reader');
					return engine.typedReadParity(treeId, today as TTransport);
				}
```

`nativeLanguageEngine` builds the `diagnostics` a grammar's engine exposes (`parseAndRead`, `buildProfile`, `lineGapsOf`). Add both methods to the `NativeLanguageEngine` type and to the object it returns, as pass-throughs beside `lineGapsOf`. These are internals under `diagnostics`, not the public engine surface, so they take no JSDoc beyond the interface's one line each.

- [ ] **Step 3: The harness, failing first**

```ts
// packages/tools/src/validate/typed-read-parity.ts
import { assertGrammar, stableGrammars } from '@sittir/codegen/grammars';
import { STORED_TRIVIA, toDetachedTransportData, treeTokenOf } from '@sittir/common/utils';
import type { AnyUntypedNode } from '@sittir/types';
import { loadCorpusEntries, loadNativeEngine } from './common.ts';

export type TypedReadParityOutcome = 'refused' | 'differs' | 'today-failed';

export interface TypedReadParityRow {
	readonly entry: string;
	readonly outcome: TypedReadParityOutcome;
	readonly report: string;
}

export interface TypedReadParitySummary {
	readonly grammar: string;
	readonly entries: number;
	readonly agreed: number;
	readonly refused: number;
	readonly differs: number;
	readonly todayFailed: number;
}

export interface TypedReadParityCensus {
	readonly summary: TypedReadParitySummary;
	readonly rows: readonly TypedReadParityRow[];
}

function withoutLayoutEvidence(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(withoutLayoutEvidence);
	if (value === null || typeof value !== 'object') return value;
	const out: Record<string, unknown> = {};
	for (const [key, member] of Object.entries(value)) {
		if (key !== '$_layout') {
			out[key] = withoutLayoutEvidence(member);
			continue;
		}
		const { gap: _gap, flank: _flank, trivia, ...rest } = member as Record<string, unknown>;
		const entries = trivia === undefined ? [] : Object.values(trivia as Record<string, unknown>).filter((side) => side !== undefined);
		const layout = entries.length === 0 ? rest : { ...rest, trivia: withoutLayoutEvidence(trivia) };
		if (Object.keys(layout).length > 0) out[key] = layout;
	}
	return out;
}

export async function computeTypedReadParity(grammar: string): Promise<TypedReadParityCensus> {
	const engine = await loadNativeEngine(assertGrammar(grammar));
	const entries = loadCorpusEntries(grammar);
	const rows: TypedReadParityRow[] = [];
	let agreed = 0;
	for (const entry of entries) {
		const root = engine.parse(entry.source, { deep: true }) as object;
		const treeId = treeTokenOf(root)?.treeId;
		if (treeId === undefined) throw new Error(`typed-read-parity: ${entry.name}'s parsed root holds no tree`);
		const refusal = engine.diagnostics.typedReadRefusal(treeId);
		if (refusal !== null) {
			rows.push({ entry: entry.name, outcome: 'refused', report: refusal });
			continue;
		}
		let report: string | null;
		try {
			report = engine.diagnostics.typedReadParity(treeId, withoutLayoutEvidence(toDetachedTransportData(root as AnyUntypedNode, STORED_TRIVIA)));
		} catch (e) {
			rows.push({ entry: entry.name, outcome: 'today-failed', report: (e as Error).message });
			continue;
		}
		if (report === null) agreed++;
		else rows.push({ entry: entry.name, outcome: 'differs', report });
	}
	const count = (outcome: TypedReadParityOutcome): number => rows.filter((row) => row.outcome === outcome).length;
	return {
		rows,
		summary: { grammar, entries: entries.length, agreed, refused: count('refused'), differs: count('differs'), todayFailed: count('today-failed') }
	};
}

export interface TypedReadParityOptions {
	readonly grammar: string;
	readonly allGrammars: boolean;
	readonly json: boolean;
}

export async function run(opts: TypedReadParityOptions): Promise<number> {
	const grammars = opts.allGrammars ? stableGrammars() : [assertGrammar(opts.grammar)];
	const censuses: TypedReadParityCensus[] = [];
	for (const grammar of grammars) censuses.push(await computeTypedReadParity(grammar));
	if (opts.json) {
		console.log(JSON.stringify(opts.allGrammars ? censuses : censuses[0], null, 2));
	} else {
		for (const { summary, rows } of censuses) {
			for (const row of rows) console.log(`${row.entry}\t${row.outcome}\n${row.report}\n`);
			console.log(`# ${summary.grammar}: ${JSON.stringify(summary)}`);
		}
	}
	return censuses.some(({ summary }) => summary.refused + summary.differs + summary.todayFailed > 0) ? 1 : 0;
}
```

The harness reads every entry, parse errors included: `ERROR` and `MISSING` are part of what the gate covers. An entry whose detached data does not decode as today's render root is `today-failed`. That is today's pipeline failing, not the typed reader, so it keeps an outcome of its own. It still fails the gate, because an entry nobody compared proves nothing about parity. A refusal is checked before the comparison, so an entry today's pipeline cannot decode is still read by the typed reader.

`packages/tools/src/index.ts`: export `run as typedReadParity`, `computeTypedReadParity` and the types, as `trivia-placement` is exported. `packages/cli/src/commands/tool/typed-read-parity.ts`:

```ts
import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';

export const typedReadParity: CommandModule = {
	name: 'typed-read-parity',
	describe: "Compare the typed reader with today's read and wrap on every corpus entry; exits 1 on any refusal, difference or entry today's pipeline cannot decode",
	register: (program) => {
		withGrammar(defineCommand(program, typedReadParity))
			.option('--all-grammars', 'Run every stable grammar')
			.option('--json', 'Print rows and summary as JSON')
			.action(async (opts: { grammar?: string; allGrammars?: boolean; json?: boolean }) => {
				const { typedReadParity: runTypedReadParity } = await import('@sittir/tools');
				const code = await runTypedReadParity({
					grammar: opts.grammar ?? 'rust',
					allGrammars: opts.allGrammars ?? false,
					json: opts.json ?? false
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
```

Register it in `packages/cli/src/commands/tool/index.ts` beside `triviaPlacement`. Regenerate the CLI glossary: `pnpm exec tsx packages/cli/src/glossary.ts > docs/cli-command-glossary.md`. Add the glossary entries for the harness's declarations to `docs/glossary/packages-tools-src-validate.md`.

- [ ] **Step 4: Run it**

Build the release binaries the way `validate:native` does (`pnpm run regen:all`). Then:

Run: `pnpm exec tsx packages/cli/src/cli.ts tool typed-read-parity --all-grammars`
Expected: every grammar's summary has `refused: 0`, `differs: 0` and `todayFailed: 0`. Empty-slot sightings are counted in `emptySlots` and each lies within the listed rows.

Any refusal, difference or `today-failed` entry stops the task. Report each row (the entry, its outcome and its report) and keep the state intact (rule 5b). Each one is one of:

- a fact Tasks 8–9 print wrongly: the fix is in codegen;
- a reader rule that departs from today's: the fix is in Tasks 2–7's runtime or expansion;
- a trial arm Task 9 could not express: a ruling is needed;
- a difference in today's own data (for example, a value today's wrap computes that the reader cannot see): a ruling is needed;
- an entry today's pipeline cannot decode (`today-failed`): first check that the failure is in today's data, not in the harness; then it is a finding of its own, and the gate stays failed until it is fixed.

Brainstorm decides which, and the maintainer rules on anything that moves a byte.

- [ ] **Step 5: Gates and commit**

The global gates, and Step 1's declaration check on the regenerated `native/index.d.ts` files. Rendered bytes and validation rows are unchanged.

```bash
git add packages/tools/src/validate/typed-read-parity.ts packages/cli/src/commands/tool/typed-read-parity.ts
git commit -F msg -- rust/crates/sittir-core/src packages/common/src/engine.ts packages/tools/src packages/cli/src/commands/tool docs
```

Message: `feat(tools): typed-read-parity compares the typed reader with today's read on every corpus entry`.

---

## Task 11: Depth, row reads and recursion over generated transports

Tasks 4–7 proved depth, row reads and refusal on hand-written declarations. This task proves them on the generated ones, over real files, and adds the two checks the corpus harness cannot make:

- a nesting depth today's read handles must not overflow the typed read;
- no grammar fact may enter `sittir-core`.

**Files:**
- Create: `rust/crates/sittir-parity-tests/tests/typed_read_corpus.rs`

**Interfaces:**
- Consumes: Task 9's generated `ReadTransport` impls (`sittir_rust::render::{RenderRoot, AnyTransport}` and the per-kind transports), Task 7's `read_at`, Task 2's `Depth`.

- [ ] **Step 1: Write the tests**

```rust
// rust/crates/sittir-parity-tests/tests/typed_read_corpus.rs
use sittir_core::read::{read_at, Depth, ReadCtx, ReadRoot};
use sittir_core::read_untyped_node::{read_untyped_node, NoMint, ReadDepth};
use sittir_core::SlotValue;
use sittir_rust::render::transport::{AnyTransport, SourceFileTransport, StatementTransport};
use sittir_rust::render::RenderRoot;

fn parse(source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&sittir_rust::language()).unwrap();
    parser.parse(source, None).unwrap()
}

fn probe_input(name: &str) -> String {
    let path = format!(
        "{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}",
        env!("CARGO_MANIFEST_DIR")
    );
    std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
}

fn root(tree: &tree_sitter::Tree, source: &str, depth: Depth) -> SourceFileTransport {
    let ctx = ReadCtx::new(source, 1);
    match RenderRoot::read_root(&mut tree.walk(), &ctx, depth).unwrap() {
        SlotValue::Transport(AnyTransport::SourceFile(file)) => file,
        other => panic!("not a source file: {other:?}"),
    }
}

#[test]
fn one_level_leaves_every_statement_with_structure_a_coordinate() {
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        let file = root(&parse(&source), &source, Depth::ONE);
        let statements = file.statements.unwrap();
        assert!(!statements.is_empty());
        assert!(statements.iter().all(|s| s.coord().is_some()), "{name}: every statement is past one level");
    }
}

#[test]
fn every_statement_read_at_its_row_equals_the_statement_in_the_whole_read() {
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        let tree = parse(&source);
        let ctx = ReadCtx::new(&source, 1);
        let whole = root(&tree, &source, Depth::All).statements.unwrap();
        let shallow = root(&tree, &source, Depth::ONE).statements.unwrap();
        assert_eq!(whole.len(), shallow.len());
        for (i, (whole, shallow)) in whole.iter().zip(&shallow).enumerate() {
            let row = sittir_core::decode_handle(shallow.coord().unwrap().handle).1;
            let at: StatementTransport = read_at::<StatementTransport, AnyTransport>(&mut tree.walk(), &ctx, row, Depth::All).unwrap();
            assert_eq!(Some(&at), whole.transport(), "{name}: statement {i} at row {row}");
        }
    }
}

#[test]
fn a_list_owner_read_at_one_level_brings_its_list() {
    let source = "fn f(a: u8, b: u8) {}";
    let tree = parse(source);
    let ctx = ReadCtx::new(source, 1);
    let row = {
        let mut cursor = tree.walk();
        (0..tree.root_node().descendant_count())
            .find(|&r| {
                cursor.goto_descendant(r);
                cursor.node().grammar_id() == sittir_rust::render::kind_ids::PARAMETERS.0
            })
            .unwrap() as u32
    };
    let parameters: sittir_rust::render::transport::ParametersTransport =
        read_at::<_, AnyTransport>(&mut tree.walk(), &ctx, row, Depth::ONE).unwrap();
    let list = parameters.elements.unwrap();
    let list = list.transport().expect("min_depth reads the list");
    assert_eq!(list.item.len(), 2);
}

// rust/crates/sittir-parity-tests/tests/typed_read_nesting.rs (the nesting and stack tests)
#[test]
fn a_nesting_today_reads_does_not_overflow_the_typed_read() {
    let n = 250; // today's dev read overflows 2 MiB at 339 levels
    read_on_thread("today", n, TWO_MIB);
    read_on_thread("typed", n, TWO_MIB);
}

#[test]
fn the_typed_read_costs_no_more_stack_per_level_than_today_s() {
    // the least stack at 1, 10, 40 and 200 levels, per reader, found by running a child
    // test on smaller and larger threads; the per-level cost is the slope from 40 to 200
    assert!(typed_per_level <= today_per_level);
    assert!(typed_per_level <= per_level_ceiling); // per profile, measured and rounded up
    assert!(typed_root_kib <= root_ceiling); // per profile, 96 KiB release, 384 KiB dev
    if !cfg!(debug_assertions) {
        assert!(typed_levels_on_2_mib >= today_levels_on_2_mib);
    }
}

#[test]
fn sittir_core_holds_no_grammar_fact() {
    let dir = format!("{}/../sittir-core/src", env!("CARGO_MANIFEST_DIR"));
    let read = std::fs::read_to_string(format!("{dir}/read.rs")).unwrap();
    let macros = std::fs::read_to_string(format!("{}/../sittir-transport-macros/src/expand.rs", env!("CARGO_MANIFEST_DIR"))).unwrap();
    for (file, text) in [("read.rs", &read), ("expand.rs", &macros)] {
        assert!(!text.contains("kind_ids") && !text.contains("field_ids"), "{file} names a grammar's id tables");
        assert!(!text.contains("sittir_rust") && !text.contains("sittir_typescript") && !text.contains("sittir_python"), "{file} names a grammar crate");
    }
}
```

The statements of `engine.rs` and `spacing.rs` are top-level items, each with structure, so one level leaves them all coordinates. If a top-level item without a named child ever appears (a bare `;`), it is inline by the leaf rule, and the first test must allow it. Check the two files before running.

A thread that overflows its stack aborts the whole test binary, so the nesting test names its threads and the depth test measures each reader in a child process. The test states the guarantee that was measured, not a stronger one: per nesting level the typed read costs no more stack than today's in both profiles, and in release it reads at least as deep on 2 MiB; the per-level and root figures of both profiles are pinned as ceilings that only tighten. It does not hold everywhere: the typed read's fixed root cost is higher than today's (375 KiB against 39 KiB in the dev profile, from the `source_file` to item chain), so on a 2 MiB dev thread it reads about 15 levels fewer. A generated choice's `read` holds one temporary per arm, which in the dev profile reaches megabytes for the dispatch enums; the derive therefore expands a choice into one `#[inline(never)]` function per variant, dispatched through a table, and reads a boxed slot into its box through `ReadTransport::read_boxed`, whose box is built in a function that is not live while the child is read. The tests pin the result: the dev corpus read at `Depth::ONE` fits the default 2 MiB test thread, 250 nested parentheses fit it for both readers, and the typed read costs no more stack per level than today's, with its per-level and root cost pinned.

`sittir_core_holds_no_grammar_fact` is the mechanical half of verification 9. The other half, that the expansion is a pure function of the declaration, holds by construction: the derive reads only its input tokens.

- [ ] **Step 2: Run**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read_corpus`
Expected: PASS. A failure is reported, not adjusted, except for the nesting depth as described.

- [ ] **Step 3: The whole-branch gates and commit**

The global gates, plus:

- `pnpm exec tsx packages/cli/src/cli.ts tool typed-read-parity --all-grammars`, with zero refusals, zero differences and zero `today-failed` entries;
- the native builds and their regenerated `native/index.d.ts` files, each declaring `typedReadRefusal` and `typedReadParity` (Task 10's check). The standalone native type-check waits for the derive codec, so it is 1b's gate;
- `rtk cargo clippy --workspace --no-default-features -- -D warnings`;
- the blank-arm census, counted on the regenerated `transport.rs` files and the model:
  - the slots registered as blank options (`hasBlankArm`) are the 9 typescript `terminator` slots;
  - the slots whose type carries `#[transport(blank)]` are the same 9;
  - the `#[transport(blank)]` attributes are 4, one per choice those slots hold;
  - the native arms admitting id 0 are 12, three in each of those 4 choices (`from_kind_id` and the two napi decoder branches), and none elsewhere in any grammar.

  Task 9's census test pins the typescript numbers. The other four grammars have none of these: count them with the same patterns.

Rendered bytes and validation rows are unchanged from the base of the branch.

```bash
git add rust/crates/sittir-parity-tests/tests/typed_read_corpus.rs
git commit -F msg -- rust/crates/sittir-parity-tests/tests/typed_read_corpus.rs
```

Message: `test(core): depth, row reads and recursion on generated transports`.

Then open 1a's PR, its body starting with `Owner: sittir-engine-api`. It lists:

- each grammar's parity summary, all of whose `refused`, `differs` and `todayFailed` counts are zero;
- the `today-failed` entries fixed on the way, each with its cause;
- the nesting depth Task 11 used;
- the compile time before and after Task 9.

Ask brainstorm for the whole-branch review.

---

## 1b: the derive's napi codec

Detailed against master `992c9b4c6`, which holds 1a (`ea0e95e07`). The derive gains the spec's third expansion, the wire codec, in today's object form (ruling 6): every transport's `FromNapiValue` and `ToNapiValue` come from its declaration, and codegen stops printing `#[napi(object)]` and the hand-written decoders. With the transports no longer napi objects, each grammar's `native/index.d.ts` states the addon's API alone, and type-checks on its own. 1b also keeps every choice small, which brings the typed read's root stack cost in the dev profile within today's reader's.

Two probes, committed beside the spec's others, measured what this section rests on:

- `docs/superpowers/probes/2026-10-01-shared-arena/codec/codec-census.py` compares, for every derived enum of the five grammars, the ids each variant's hand-written decoder accepts with the ids its `#[kind]` claims. Of 5,602 claiming variants, 5,586 agree. The other 16 are the token ids and the envelope that rulings 2 and 3 settle. All 59 text leaves' fixed texts agree with their `text = "…"`. It also lists 59 decode trials.
- `docs/superpowers/probes/2026-10-01-shared-arena/stack/size-census.py` measures every transport type. A choice is as large as its largest variant: rust's `StatementTransport` is 4,256 bytes and typescript's 9,432. The choice payload types over 512 bytes number 90 in rust, 128 in typescript, 61 in python, 6 in scm and 16 in regex, so no short list of kinds shrinks the choices. A byte ceiling does (Task 15).

### Rulings

The maintainer's, through brainstorm, unless marked as design's.

1. **The codec decodes only the ids a variant declares.** A value decodes as the variant the reader would read its id as (the variant's `#[kind]` kinds, `display(…)` and `folded(…)` ids), or as an envelope variant that names the id in `decodes(…)` (ruling 3). Any other id is refused, naming the type and the id. Today's supertype decoders also try a polymorph's forms in turn when a value carries the polymorph's own id or a reserved supertype's: 59 such arms (rust 25, typescript 21, python 9, scm 4). No generated factory and no read stamps those ids, since factories stamp the form's id and today's read stamps the grammar id. They go with no replacement.
2. **One id list per variant serves both directions.** 15 variants claim one token id more than today's decoder accepts: rust 2, typescript 7, python 3, regex 3. These are alternate ids that today's wrap folds before the wire, and the reader reads them as the parser gives them. The wire accepts them too.
3. **An envelope's wire ids are stated** (design, from the census). One envelope variant decodes ids beyond its display id: typescript's `MemberExpressionPropertyTransportSlot::PropertyIdentifier` takes the keyword ids 7 and 30–50. A keyword aliased to `property_identifier` crosses with its grammar id, while the reader admits it by display. Codegen prints those ids in the variant's `#[kind(…, decodes(…))]`, from the claims it records for `ENVELOPE_EXTRA_IDS`. The reader ignores `decodes`. The pin's two other typescript entries name type-query enums that codegen no longer prints; the pin check skips them, so they print nothing.
4. **Codegen stamps every field's wire key**, `#[wire(key = "…")]`. The macro computes no key.
5. **Every key is static.** The codec reads and writes keys only through `sittir_core::boundary`, with `c"…"` keys; nothing reads a key through `Object::get(&str)`. The gap names of a node's inner trivia stay data, as today.
6. **`TriviaTransport` derives the codec in a codec-only mode**, `#[transport(choice, codec_only)]`, since nothing reads into it.
7. **The derive emits `ToNapiValue` as well, proven by a corpus round trip.** No transport crosses to JavaScript before 1c, which reads through the encoder; 1b's harness encodes and decodes every corpus read and compares.
8. **`debug-transport` goes** (design). Nothing builds with it, and its leaf decoder is the object branch of the release one.
9. **Choices stay under a payload ceiling** (design). This refines the route of boxing a short list of dominant kinds, which the census shows cannot shrink the choices. Every choice payload type over the ceiling is boxed, by a list pinned per grammar. Generated `const` assertions check every payload against the ceiling both ways, so a type that grows past it, or a pinned type that shrinks under it, fails the build and names the type.
10. **The stack gate.** On each target and in both profiles, the typed read needs no more stack than today's read at 200 nested levels, and costs no more per level. Its fixed root cost is accepted above today's (maintainer): a shallow source, the deepest corpus entry included, needs more stack than today's, and that cost is reported, not gated. The per-target rows pin the root and per-level costs as ceilings, re-pinned at 1b's measurement and never raised (design).
11. **ABI 19.** The JavaScript harness calls a new native method, as 1a's did.
12. **Scope.** 1b is cut from master. These stay out:
    - link stamping the layout token ids the read now resolves;
    - comparing two trees by structure;
    - the routing checks the typed reader still lacks: two slots on one field, a struct slot's admitted kinds, and `read_at`'s parent type;
    - the record wire.

### File structure (1b)

Create:

| File | Responsibility |
| --- | --- |
| `rust/crates/sittir-transport-macros/src/codec.rs` | the codec expansions: struct, text leaf, choice, enum kind, `Box<T>` |
| `rust/crates/sittir-core/src/verbatim.rs` | `VerbatimTransport`, which each generated crate prints today, with its codec |
| `packages/codegen/src/emitters/boxed-payloads.ts` | the payload ceiling and each grammar's pinned boxed payloads |
| `packages/codegen/src/emitters/__tests__/native-typings.test.ts` | each `native/index.d.ts` declares the addon's API alone |
| `packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts` | the round trip on small sources |

Modify:

| File | Change |
| --- | --- |
| `rust/crates/sittir-core/src/boundary.rs` | napi's field semantics behind static keys; object writes |
| `rust/crates/sittir-core/src/lib.rs` | `__napi`, `napi_codec!`, `verbatim` |
| `rust/crates/sittir-core/src/slot.rs`, `layout.rs`, `trivia.rs`, `types.rs`, `options.rs` | encoders; `Span`'s codec; `Edges` and `EdgeArm` lose `#[napi(object)]` |
| `rust/crates/sittir-core/src/napi_engine.rs` | `typed_read_round_trip`; `with_typed_read` takes a depth |
| `rust/crates/sittir-core/Cargo.toml` | `debug-transport` goes |
| `rust/crates/sittir-transport-macros/src/lib.rs`, `attrs.rs`, `expand.rs` | `wire`, `decodes`, `verbatim`, `text` variants, `codec_only`; the codec wired in |
| `rust/crates/sittir-parity-tests/tests/typed_read.rs` | every declared field gains its key |
| `rust/crates/sittir-parity-tests/tests/typed_read_nesting.rs` | the ceilings; 200 levels and per level at most today's; the deepest corpus entry reported |
| `packages/codegen/src/emitters/render-module.ts` | keys, variant facts, `TriviaTransport`'s derive, `boxedInEnum`, size assertions; the hand-written decoders, the decode trials and `VerbatimTransport` go |
| `packages/codegen/src/emitters/native-crate.ts` | `debug-transport` goes; ABI 19 |
| `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `native-transport-emit.test.ts`, `render-module-separated-list.test.ts` | the printed facts |
| `packages/types/src/engine-api.ts`, `packages/common/src/engine.ts`, `packages/common/src/create-engine.ts` | `typedReadRoundTrip` |
| `packages/tools/src/validate/typed-read-parity.ts`, `packages/cli/src/commands/tool/typed-read-parity.ts` | the round-trip outcome |
| `package.json` | `type-check` runs `type-check:native` |
| `docs/glossary/emitters.md`, `docs/glossary/packages-tools-src-validate.md` | entries |
| `docs/cli-command-glossary.md` | regenerated |

### Global Constraints (1b)

1a's hold, and:

- No rendered byte and no validation row moves. The wire keeps its shape: every key and value form today's decoders accept, the derive's accept, except where rulings 1–3 say otherwise.
- Every codec item sits inside `::sittir_core::napi_codec! { … }` and names napi as `::sittir_core::__napi`. The macro keeps its items only when `sittir-core` is built with `napi-bindings`, so a crate that derives `Transport` needs no napi dependency or feature of its own.
- The expansion stays a pure function of the declaration (verification 9): the macro computes no key, id or text.
- No decoder tries one form and then another.

### Review Focus (1b)

1. **A text leaf inside a choice.** Encoded as a bare string, it would decode as the choice's `Verbatim`, so a leaf always encodes as an object carrying its `$type`. Test: Task 14 (an identifier as an expression round-trips).
2. **`null` in an optional field.** napi reads only `undefined` as absent. `null` reaches the field type's own decoder, and `Option<T>`'s maps it to `None`, as for an elided list's hole. The codec calls napi's own field helpers, so the semantics stay napi's. Test: Task 13 (optional fields read through `boundary::optional`) and Task 14 (typescript's `[a, , b]` round-trips).
3. **Coordinates past the depth.** Encoded and decoded, a coordinate keeps its tree, span and kind, the three `SlotValue`'s equality compares. Test: Task 14 (every corpus entry read one level deep).
4. **A polymorph's own id on the wire** is refused, naming the type. Test: Task 13 (an unclaimed id is refused with `unknown kind id … in …`).
5. **A boxed payload** reads, decodes and encodes through `Box`. Test: Task 15 (the corpus round trip with the pinned boxes in place).

---

## Task 12: The core codec

`sittir-core` gains what every derived codec calls: napi's field semantics behind static keys, object writes, the gate macro, and an encoder for every core type a transport holds. `VerbatimTransport` moves here from the five generated crates, since it holds no grammar fact. No generated file changes, so no byte moves. These encoders run only under Node: Task 14's round trip is their test, and it fails on any form an encoder writes that its decoder does not read back.

**Files:**
- Modify: `rust/crates/sittir-core/src/boundary.rs`, `lib.rs`
- Create: `rust/crates/sittir-core/src/verbatim.rs`
- Modify: `rust/crates/sittir-core/src/slot.rs`, `layout.rs`, `trivia.rs`, `types.rs`, `options.rs`

**Interfaces:**
- Consumes: napi 3's `get_named_property_raw`, `set_named_property_raw`, `from_raw_required_field`, `from_raw_optional_field`, `create_object_with_properties` (all in `napi::bindgen_prelude`).
- Produces:
  - `boundary::required<V: FromNapiValue>(env, obj, key: &'static CStr, owner: &'static str) -> napi::Result<V>` and `boundary::optional<V: FromNapiValue>(…) -> napi::Result<Option<V>>`, with napi's object-derive semantics and messages; `boundary::object(env, value) -> napi::Result<napi_value>`; `boundary::object_with(env, fields: &[(&'static CStr, napi_value)]) -> napi::Result<napi_value>`; `boundary::set(env, obj, key: &'static CStr, value) -> napi::Result<()>`. `boundary::property` stays.
  - `::sittir_core::__napi` (napi itself) and `::sittir_core::napi_codec!`.
  - `sittir_core::VerbatimTransport { pub text: String }`, with `Render`, `Prepare`, `PartialEq` and its codec: in, a string or an object's `$text`; out, the string.
  - `ToNapiValue` for `SlotValue<T: ToNapiValue, A>`, `Span`, `SourceGap`, `SourceFlank`, `TransportLayout<T: ToNapiValue>`, `TransportTrivia<T: ToNapiValue>`, `TriviaEntry<T: ToNapiValue>` and `TriviaText`; `FromNapiValue` for `Span` and `TriviaText`.

- [ ] **Step 1: Field reads and object writes**

In `boundary.rs`, after `property`:

```rust
/// A required field, read as napi's object derive reads one: `undefined` is
/// napi's missing-field error, and a value the field's type refuses is that
/// type's error decorated with `owner` and the key.
///
/// # Safety
/// `obj` must be a live object in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn required<V: ::napi::bindgen_prelude::FromNapiValue>(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
    owner: &'static str,
) -> ::napi::Result<V> {
    let raw = unsafe { ::napi::bindgen_prelude::get_named_property_raw(env, obj, key.as_ptr())? };
    unsafe { ::napi::bindgen_prelude::from_raw_required_field(env, raw, owner, key_name(key)) }
}

/// An optional field, read as napi's object derive reads one: `undefined` is
/// absent, and every other value goes to the field's type, `null` included.
///
/// # Safety
/// `obj` must be a live object in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn optional<V: ::napi::bindgen_prelude::FromNapiValue>(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
    owner: &'static str,
) -> ::napi::Result<Option<V>> {
    let raw = unsafe { ::napi::bindgen_prelude::get_named_property_raw(env, obj, key.as_ptr())? };
    unsafe { ::napi::bindgen_prelude::from_raw_optional_field(env, raw, owner, key_name(key)) }
}

/// The object a struct decodes from, taken as napi's object derive takes it.
///
/// # Safety
/// `value` must be a live value in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn object(env: ::napi::sys::napi_env, value: ::napi::sys::napi_value) -> ::napi::Result<::napi::sys::napi_value> {
    let obj = unsafe { <::napi::bindgen_prelude::Object as ::napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, value)? };
    Ok(::napi::JsValue::raw(&obj))
}

/// A new object holding `fields`, defined in one call.
///
/// # Safety
/// Every value must be live in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn object_with(
    env: ::napi::sys::napi_env,
    fields: &[(&'static ::std::ffi::CStr, ::napi::sys::napi_value)],
) -> ::napi::Result<::napi::sys::napi_value> {
    use ::napi::bindgen_prelude::sys::{napi_property_descriptor, PropertyAttributes};
    let descriptors: Vec<napi_property_descriptor> = fields
        .iter()
        .map(|&(key, value)| napi_property_descriptor {
            utf8name: key.as_ptr(),
            name: ::std::ptr::null_mut(),
            method: None,
            getter: None,
            setter: None,
            value,
            attributes: PropertyAttributes::writable | PropertyAttributes::enumerable | PropertyAttributes::configurable,
            data: ::std::ptr::null_mut(),
        })
        .collect();
    unsafe { ::napi::bindgen_prelude::create_object_with_properties(env, &descriptors) }
}

/// Set `key` on the object `obj`.
///
/// # Safety
/// `obj` and `value` must be live in `env`.
#[cfg(feature = "napi-bindings")]
pub unsafe fn set(
    env: ::napi::sys::napi_env,
    obj: ::napi::sys::napi_value,
    key: &'static ::std::ffi::CStr,
    value: ::napi::sys::napi_value,
) -> ::napi::Result<()> {
    unsafe { ::napi::bindgen_prelude::set_named_property_raw(env, obj, key.as_ptr(), value) }
}

#[cfg(feature = "napi-bindings")]
fn key_name(key: &'static ::std::ffi::CStr) -> &'static str {
    key.to_str().unwrap_or("")
}
```

napi's derive reads a field the same way: `get_named_property_raw`, then `from_raw_required_field` or `from_raw_optional_field`, which give a missing field and a refused value their messages. Calling them keeps every message napi gives today.

- [ ] **Step 2: The gate macro and napi's path**

In `lib.rs`, after `pub use sittir_transport_macros::Transport;`:

```rust
#[cfg(feature = "napi-bindings")]
#[doc(hidden)]
pub use ::napi as __napi;

/// The items of a derived transport's wire codec, kept only when this crate
/// is built with napi bindings, so a crate that derives `Transport` needs no
/// napi dependency or feature of its own.
#[cfg(feature = "napi-bindings")]
#[doc(hidden)]
#[macro_export]
macro_rules! napi_codec {
    ($($item:item)*) => { $($item)* };
}

/// The items of a derived transport's wire codec, dropped: this crate is
/// built without napi bindings.
#[cfg(not(feature = "napi-bindings"))]
#[doc(hidden)]
#[macro_export]
macro_rules! napi_codec {
    ($($item:item)*) => {};
}

pub use verbatim::VerbatimTransport;
```

and `pub mod verbatim;` among the modules.

- [ ] **Step 3: `VerbatimTransport` in the core**

Create `verbatim.rs`:

```rust
//! Text that is a slot's content with no kind of its own: a bare string in a
//! slot whose members all render from their own text, where the variant tag
//! is render-invisible and picking one would be a guess.

use crate::render::{Render, RenderResult, RenderSink};

#[derive(Debug, Clone, PartialEq)]
pub struct VerbatimTransport {
    pub text: String,
}

impl Render for VerbatimTransport {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(&self.text)
    }
}

impl crate::prepare::Prepare for VerbatimTransport {
    fn prepare(&mut self, _ctx: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
        Ok(())
    }
}

/// A string, or an object carrying `$text` (the form an `ERROR` node crosses in).
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for VerbatimTransport {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use ::napi::bindgen_prelude::FromNapiValue;
        if unsafe { crate::slot::transport_value_type(env, napi_val)? } == ::napi::ValueType::String {
            return Ok(Self { text: unsafe { String::from_napi_value(env, napi_val)? } });
        }
        let text = unsafe { crate::boundary::property::<String>(env, napi_val, c"$text")? }
            .ok_or_else(|| ::napi::Error::from_reason("verbatim text arrives as a string, or as an object carrying $text"))?;
        Ok(Self { text })
    }
}

/// The string.
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for VerbatimTransport {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        unsafe { <String as ::napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, val.text) }
    }
}
```

The struct, `Render` and `Prepare` match what `renderVerbatimTransport` prints today; Task 13 deletes that printer and has `transport.rs` import this one.

- [ ] **Step 4: Encoders in `slot.rs`**

Replace `SlotValue`'s receive-only `ToNapiValue` and the `()` stubs of `SourceGap` and `SourceFlank`:

```rust
#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue, const ADJACENT: bool> ::napi::bindgen_prelude::ToNapiValue
    for SlotValue<T, ADJACENT>
{
    /// A transport writes itself; a coordinate writes the object the decoder
    /// reads back as one.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        match val {
            Self::Transport(transport) => unsafe { T::to_napi_value(env, transport) },
            Self::Coord(coord) => unsafe { coordinate_to_napi(env, coord) },
        }
    }
}

/// `{ $treeHandle, $span, $type?, $textOnly?, $_layout?: { gap } }`, the
/// object `SlotValue`'s decoder reads as a coordinate. Its edges are the
/// prepare walk's and never cross.
#[cfg(feature = "napi-bindings")]
unsafe fn coordinate_to_napi(env: ::napi::sys::napi_env, coord: NodeCoordinate) -> ::napi::Result<::napi::sys::napi_value> {
    use crate::boundary::{object_with, set};
    use ::napi::bindgen_prelude::ToNapiValue;
    let obj = unsafe {
        object_with(env, &[
            (c"$treeHandle", f64::to_napi_value(env, coord.handle as f64)?),
            (c"$span", Span::to_napi_value(env, coord.span)?),
        ])?
    };
    if let Some(kind) = coord.kind {
        unsafe { set(env, obj, c"$type", u32::to_napi_value(env, u32::from(kind.0))?)? };
    }
    if coord.text_only {
        unsafe { set(env, obj, c"$textOnly", bool::to_napi_value(env, true)?)? };
    }
    if let Some(gap) = coord.gap {
        let layout = unsafe { object_with(env, &[(c"gap", SourceGap::to_napi_value(env, gap)?)])? };
        unsafe { set(env, obj, c"$_layout", layout)? };
    }
    Ok(obj)
}
```

`SourceGap`'s encoder writes `{ $text }` for `Text` and `{ $treeHandle, $span }` for `Range`. `SourceFlank`'s writes `$text` (a `Text` source) or `$treeHandle` (a `Tree` source), then `$span`, then `$before` and `$after` only when true, since its decoder reads an absent flag as false:

```rust
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::object_with;
        use ::napi::bindgen_prelude::ToNapiValue;
        unsafe {
            match val {
                Self::Text(text) => object_with(env, &[(c"$text", String::to_napi_value(env, text)?)]),
                Self::Range { handle, span } => object_with(env, &[
                    (c"$treeHandle", f64::to_napi_value(env, handle as f64)?),
                    (c"$span", Span::to_napi_value(env, span)?),
                ]),
            }
        }
    }
```

```rust
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, set};
        use ::napi::bindgen_prelude::ToNapiValue;
        let source = unsafe {
            match val.source {
                FlankSource::Text(text) => (c"$text", String::to_napi_value(env, text)?),
                FlankSource::Tree(handle) => (c"$treeHandle", f64::to_napi_value(env, handle as f64)?),
            }
        };
        let obj = unsafe { object_with(env, &[source, (c"$span", Span::to_napi_value(env, val.span)?)])? };
        if val.before {
            unsafe { set(env, obj, c"$before", bool::to_napi_value(env, true)?)? };
        }
        if val.after {
            unsafe { set(env, obj, c"$after", bool::to_napi_value(env, true)?)? };
        }
        Ok(obj)
    }
```

A handle crosses as an `f64` today, from the read's JSON and back through `checked_index`, so every live handle is exact in one.

- [ ] **Step 5: Encoders in `layout.rs` and `trivia.rs`**

`TransportLayout<T>`'s `ToNapiValue` gains the bound `T: ToNapiValue` and writes `{ trivia?, gap?, flank? }`, each only when present. Its edges are the prepare walk's and never cross:

```rust
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, set};
        use ::napi::bindgen_prelude::ToNapiValue;
        let obj = unsafe { object_with(env, &[])? };
        if let Some(trivia) = val.trivia {
            unsafe { set(env, obj, c"trivia", TransportTrivia::to_napi_value(env, trivia)?)? };
        }
        if let Some(gap) = val.gap {
            unsafe { set(env, obj, c"gap", SourceGap::to_napi_value(env, gap)?)? };
        }
        if let Some(flank) = val.flank {
            unsafe { set(env, obj, c"flank", SourceFlank::to_napi_value(env, flank)?)? };
        }
        Ok(obj)
    }
```

In `trivia.rs`, `TransportTrivia<T>`'s `ToNapiValue` (bound `T: ToNapiValue`) writes `{ leading?, trailing?, inner? }`. An inner gap's name is data, so its key is too:

```rust
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, set};
        use ::napi::bindgen_prelude::ToNapiValue;
        let obj = unsafe { object_with(env, &[])? };
        if let Some(leading) = val.leading {
            unsafe { set(env, obj, c"leading", Vec::to_napi_value(env, leading)?)? };
        }
        if let Some(trailing) = val.trailing {
            unsafe { set(env, obj, c"trailing", Vec::to_napi_value(env, trailing)?)? };
        }
        if let Some(inner) = val.inner {
            let gaps = unsafe { object_with(env, &[])? };
            for (name, entries) in inner {
                let name = ::std::ffi::CString::new(name).map_err(|e| ::napi::Error::from_reason(e.to_string()))?;
                let entries = unsafe { Vec::to_napi_value(env, entries)? };
                unsafe { ::napi::bindgen_prelude::set_named_property_raw(env, gaps, name.as_ptr(), entries)? };
            }
            unsafe { set(env, obj, c"inner", gaps)? };
        }
        Ok(obj)
    }
```

`TriviaEntry<T>` gains a `ToNapiValue`, bound `T: ToNapiValue`. It writes its value's own form, and `$sameLine` and `$tokensBetween` on it when they are not their defaults. A value whose form is a string or a kind id carries them in `{ $text }` or `{ $type }`, the objects the decoder reads back:

```rust
#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for TriviaEntry<T> {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with, set};
        use ::napi::bindgen_prelude::ToNapiValue;
        let value = unsafe { SlotValue::to_napi_value(env, val.value)? };
        if !val.same_line && val.tokens_between == 0 {
            return Ok(value);
        }
        let obj = match unsafe { crate::slot::transport_value_type(env, value)? } {
            ::napi::ValueType::Object => value,
            ::napi::ValueType::String => unsafe { object_with(env, &[(c"$text", value)])? },
            _ => unsafe { object_with(env, &[(c"$type", value)])? },
        };
        if val.same_line {
            unsafe { set(env, obj, c"$sameLine", bool::to_napi_value(env, true)?)? };
        }
        if val.tokens_between != 0 {
            unsafe { set(env, obj, c"$tokensBetween", u32::to_napi_value(env, u32::from(val.tokens_between))?)? };
        }
        Ok(obj)
    }
}
```

`TriviaText` gains its codec. In: `{ $type, $text }`, both required. Out: the same:

```rust
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TriviaText {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let obj = unsafe { crate::boundary::object(env, napi_val)? };
        let kind: u16 = unsafe { crate::boundary::required(env, obj, c"$type", "TriviaText")? };
        Ok(Self { kind: KindId(kind), text: unsafe { crate::boundary::required(env, obj, c"$text", "TriviaText")? } })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TriviaText {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use ::napi::bindgen_prelude::ToNapiValue;
        unsafe {
            crate::boundary::object_with(env, &[
                (c"$type", u16::to_napi_value(env, val.kind.0)?),
                (c"$text", String::to_napi_value(env, val.text)?),
            ])
        }
    }
}
```

- [ ] **Step 6: `Span`, `Edges` and `EdgeArm`**

In `types.rs`, replace `Span`'s `#[cfg_attr(feature = "napi-bindings", napi(object))]` with a hand codec, `{ start, end }` both ways, read through `boundary::required(env, obj, c"start", "Span")` and `c"end"` after `boundary::object`, and written with `object_with`. Rewrite its doc comment to say what crosses: a byte range as `{ start, end }`, read and written by the codec below, which every coordinate and gap uses. Drop the `napi_derive::napi` import if nothing else in the file uses it; the compiler's unused-import warning says.

In `options.rs`, delete `#[cfg_attr(feature = "napi-bindings", napi(object))]` from `EdgeArm` and `Edges`. No codec reads either: `TransportLayout`'s decoder leaves the edges to the prepare walk. `EdgeArm`'s doc comment says its strength is optional "because napi cannot skip a field". Restate the live reason: a stamp without a strength writes at the strength its edge site gives the arm. Drop the import as above.

Both changes take the three types out of each grammar's `native/index.d.ts` when Task 13 rebuilds the natives.

- [ ] **Step 7: Build and check**

Run: `rtk cargo clippy -p sittir-core --features napi-bindings`
Expected: the six lints `sittir-core` has on master, no new one.

Run: `rtk cargo build --workspace`
Expected: PASS. The generated crates still print their own decoders beside the new encoders, and none of them names the moved `VerbatimTransport` yet.

Run: `rtk cargo test --workspace --no-default-features`
Expected: PASS.

- [ ] **Step 8: Gates and commit**

The global gates. The natives rebuild with `Span`'s codec in place of napi's, with the same keys and messages, so rendered bytes and validation rows are unchanged.

```bash
git add rust/crates/sittir-core/src/verbatim.rs
git commit -F msg -- rust/crates/sittir-core/src
```

Message: `feat(core): static-key field reads, object writes, and encoders for the core wire types`.

---

## Task 13: The derive's codec replaces the hand-written decoders

The derive expands every transport's codec from its declaration, and codegen prints the facts that codec needs: a key on every field, the verbatim and text variants, and an envelope's wire ids. It stops printing `#[napi(object)]`, every hand-written `FromNapiValue` and `ToNapiValue`, and the 59 decode trials. The derive and codegen change in one commit, since an expansion beside `#[napi(object)]` would implement the same traits twice.

Today's detached data now decodes through the derive. The parity harness's comparison of that data with the typed read therefore becomes this task's compatibility gate, beside rendered bytes and validation rows.

Wire forms. The decoders accept today's forms, except where rulings 1–3 say otherwise:

| type | decodes from | encodes as |
| --- | --- | --- |
| struct | an object, each field by its key: required, or optional when its written type is `Option<…>` | an object: `$type` (the struct's kind) and its fields, an optional one only when present |
| text leaf (`text`) | a string (its text); a number (its fixed text, or refused naming the type when it has none); an object (`$text`, else its fixed text, and its other fields by key) | as a struct |
| choice | a number: the variant that claims it; an object: the variant its `$type` names, the payload decoded from the same object; a string, or an `ERROR` object: the `verbatim` variant; an object that carries `$text` and whose `$type` a `text` variant claims: that variant; id 0: the blank variant | a unit variant: its first claimed id; the blank variant: 0; a payload variant: its payload |
| enum kind | a number: the member that claims it | the member's first claimed id |
| `Box<T>` | as `T` | as `T` |

A choice resolves an id the way its reader does: the reader's `__variant(KindId(id), KindId(id))`, then the `decodes(…)` ids, then the blank arm. Nothing tries one variant and then another.

**Files:**
- Modify: `rust/crates/sittir-transport-macros/src/lib.rs`, `attrs.rs`, `expand.rs`
- Create: `rust/crates/sittir-transport-macros/src/codec.rs`
- Modify: `rust/crates/sittir-parity-tests/tests/typed_read.rs`
- Modify: `packages/codegen/src/emitters/render-module.ts`, `native-crate.ts`
- Modify: `rust/crates/sittir-core/Cargo.toml`, `src/layout.rs`, `src/trivia.rs`
- Modify: `package.json`
- Test: `codec.rs`'s unit tests; `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `native-transport-emit.test.ts`, `render-module-separated-list.test.ts`
- Create: `packages/codegen/src/emitters/__tests__/native-typings.test.ts`
- Generated: `rust/crates/sittir-*/src/render/transport.rs`, `rust/crates/sittir-*/Cargo.toml`, `packages/*/native/index.d.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: Task 12's `boundary::{object, required, optional, object_with, set, property}`, `slot::transport_value_type`, `napi_codec!`, `__napi`, `VerbatimTransport` and `TriviaText`'s codec.
- Produces:
  - field attribute `#[wire(key = "…")]`, required on every field of a derived struct;
  - in `#[kind(…)]`: `decodes(PATH, …)`, ids the codec decodes as the variant and the reader ignores;
  - variant attributes `#[transport(verbatim)]` and `#[transport(text)]`; choice attribute `codec_only` (`#[transport(choice, codec_only)]`: the codec alone, no `ReadTransport`);
  - for every derived `T`: `FromNapiValue` and `ToNapiValue` for `T` and for `Box<T>`, inside `::sittir_core::napi_codec!`.

- [ ] **Step 1: Write the derive's failing tests**

Create `codec.rs` holding only its test module for now, and add `mod codec;` to `lib.rs`:

```rust
#[cfg(test)]
mod tests {
    use syn::parse_quote;

    fn expand(input: syn::DeriveInput) -> String {
        crate::expand::derive(&input).expect("expands").to_string().split_whitespace().collect()
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn a_struct_reads_and_writes_each_field_by_its_key() {
        let out = expand(parse_quote! {
            #[transport(kind = kind::LET_DECLARATION)]
            pub struct LetDeclarationTransport {
                #[wire(key = "$_layout")]
                pub layout: Option<TransportLayout>,
                #[wire(key = "_pattern")]
                #[slot(field = field::PATTERN)]
                pub pattern: SlotValue<PatternTransport>,
                #[wire(key = "_value")]
                #[slot(field = field::VALUE)]
                pub value: Option<SlotValue<ExpressionTransport>>,
            }
        });
        assert!(has(&out, "::sittir_core::napi_codec! {"));
        assert!(has(&out, "let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };"));
        assert!(has(&out, r#"pattern: unsafe { ::sittir_core::boundary::required(env, obj, c"_pattern", "LetDeclarationTransport")? },"#));
        assert!(has(&out, r#"value: unsafe { ::sittir_core::boundary::optional(env, obj, c"_value", "LetDeclarationTransport")? },"#));
        assert!(has(&out, r#"(c"$type", ::sittir_core::__napi::bindgen_prelude::ToNapiValue::to_napi_value(env, __KIND.0)?),"#));
        assert!(has(&out, r#"::sittir_core::boundary::set(env, obj, c"_value","#));
        assert!(has(&out, "impl ::sittir_core::__napi::bindgen_prelude::FromNapiValue for ::std::boxed::Box<LetDeclarationTransport>"));
    }

    #[test]
    fn a_text_leaf_decodes_its_text_a_bare_kind_id_or_an_object() {
        let out = expand(parse_quote! {
            #[transport(kind = kind::SELF, text = "self")]
            pub struct SelfTransport {
                #[wire(key = "$_layout")]
                pub layout: Option<TransportLayout>,
                #[wire(key = "$text")]
                pub text: String,
            }
        });
        assert!(has(&out, r#"::sittir_core::__napi::ValueType::Number => ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string("self"), layout: ::core::default::Default::default(), }),"#));
        assert!(has(&out, r#"::sittir_core::boundary::optional::<::std::string::String>(env, obj, c"$text", "SelfTransport")"#));
        assert!(has(&out, r#".unwrap_or_else(|| ::std::string::ToString::to_string("self"))"#));
    }

    #[test]
    fn a_text_leaf_with_no_fixed_text_refuses_a_bare_kind_id() {
        let out = expand(parse_quote! {
            #[transport(kind = kind::IDENTIFIER, text)]
            pub struct IdentifierTransport {
                #[wire(key = "$_layout")]
                pub layout: Option<TransportLayout>,
                #[wire(key = "$text")]
                pub text: String,
            }
        });
        assert!(has(
            &out,
            r#"::std::format!("kind id {id} ({:?}) has no fixed text: {} renders from a node, not a kind id", u16::try_from(id).map_or("<unknown>", |id| kind::kind_name_from_id(::sittir_core::types::KindId(id))), "IdentifierTransport")"#
        ));
    }

    #[test]
    fn a_text_leaf_whose_kind_names_no_module_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[transport(kind = IDENTIFIER, text)]
            pub struct IdentifierTransport {
                #[wire(key = "$_layout")]
                pub layout: Option<TransportLayout>,
                #[wire(key = "$text")]
                pub text: String,
            }
        };
        let error = crate::expand::derive(&input).expect_err("a kind with no module");
        assert!(error.to_string().contains("IdentifierTransport"));
        assert!(error.to_string().contains("kind_name_from_id"));
    }

    #[test]
    fn a_choice_decodes_the_ids_its_variants_claim_and_refuses_the_rest() {
        let out = expand(parse_quote! {
            #[transport(choice)]
            pub enum PropertyTransportSlot {
                #[kind(kind::_PROPERTY_IDENTIFIER, display, decodes(kind::GET_KEYWORD, kind::SET_KEYWORD))]
                PropertyIdentifier(PropertyIdentifierTransport),
                #[kind(kind::PRIVATE_PROPERTY_IDENTIFIER)]
                PrivatePropertyIdentifier(PrivatePropertyIdentifierTransport),
                #[transport(blank)]
                Blank,
            }
        });
        assert!(has(&out, "match __variant(__Kind(id), __Kind(id)) { ::core::option::Option::Some(0u16) => return"));
        assert!(has(&out, "if [kind::GET_KEYWORD, kind::SET_KEYWORD].contains(&__Kind(id))"));
        assert!(has(&out, "if id == 0 { return ::core::result::Result::Ok(PropertyTransportSlot::Blank); }"));
        assert!(has(&out, r#"::std::format!("unknown kind id {id} in {}", "PropertyTransportSlot")"#));
        assert!(!has(&out, "if let ::core::result::Result::Ok("));
    }

    #[test]
    fn a_unit_variant_writes_its_first_claimed_id_and_the_blank_arm_writes_zero() {
        let out = expand(parse_quote! {
            #[transport(choice)]
            pub enum StatementBlockTerminatorTransportSlot {
                #[kind(kind::_AUTOMATIC_SEMICOLON, kind::SEMI)]
                AutomaticSemicolon,
                #[transport(blank)]
                Blank,
            }
        });
        assert!(has(&out, "Self::AutomaticSemicolon => unsafe { <u16 as ::sittir_core::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, (kind::_AUTOMATIC_SEMICOLON).0) },"));
        assert!(has(&out, "Self::Blank => unsafe { <u16 as ::sittir_core::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, 0) },"));
    }

    #[test]
    fn verbatim_and_text_variants_take_their_wire_forms_and_a_codec_only_choice_has_no_reader() {
        let out = expand(parse_quote! {
            #[transport(choice, codec_only)]
            pub enum TriviaTransport {
                #[kind(kind::LINE_COMMENT)]
                LineComment(LineCommentTransport),
                #[transport(verbatim)]
                Verbatim(VerbatimTransport),
                #[transport(text)]
                #[kind(kind::LINE_COMMENT)]
                Text(::sittir_core::trivia::TriviaText),
            }
        });
        assert!(has(&out, "if id == ::sittir_core::types::KindId::ERROR.0 { return ::core::result::Result::Ok(TriviaTransport::Verbatim("));
        assert!(has(&out, "::sittir_core::__napi::ValueType::String => ::core::result::Result::Ok(TriviaTransport::Verbatim("));
        assert!(has(&out, r#"if [kind::LINE_COMMENT].contains(&__Kind(id)) && unsafe { ::sittir_core::boundary::property::<::std::string::String>(env, napi_val, c"$text")? }.is_some()"#));
        assert!(!has(&out, "::core::option::Option::Some(2u16)"));
        assert!(!out.contains("ReadTransport"));
    }

    #[test]
    fn an_enum_kind_decodes_a_member_id_and_writes_its_first() {
        let out = expand(parse_quote! {
            #[transport(kind = kind::_PRIMITIVE_TYPE, spelled)]
            pub enum PrimitiveTypeEnum {
                #[kind(kind::U8_KEYWORD)]
                U8,
                #[kind(kind::BOOL_KEYWORD)]
                Bool,
            }
        });
        assert!(has(&out, r#"__member(__Kind(id), __Kind(id)).ok_or_else(|| ::sittir_core::__napi::Error::from_reason(::std::format!("kind id {id} is not a kind {} takes", "PrimitiveTypeEnum")))"#));
        assert!(has(&out, "Self::U8 => (kind::U8_KEYWORD).0,"));
    }

    #[test]
    fn a_field_without_a_key_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[transport(kind = kind::X)]
            pub struct XTransport {
                #[slot(field = field::NAME)]
                pub name: SlotValue<IdentifierTransport>,
            }
        };
        let error = crate::expand::derive(&input).expect_err("a field without a key");
        assert!(error.to_string().contains("crosses the wire under a key"));
    }
}
```

`has` strips whitespace on both sides, so each expected string is written as Rust and compared as the expansion's tokens. The second assertion of the choice test pins the order: the reader's matcher first. The last assertion of the same test pins that no arm tries a decode.

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-transport-macros`
Expected: FAIL. The attributes `wire`, `decodes`, `verbatim`, `text` (on a variant) and `codec_only` are unknown, and no expansion prints a codec.

- [ ] **Step 3: The attributes**

In `attrs.rs`, `KindAttrs` gains `pub verbatim: bool` and `pub codec_only: bool`, and `kind_attrs` parses them: `"verbatim" => out.verbatim = true,` and `"codec_only" => out.codec_only = true,`. `#[transport(text)]` on a variant parses through the existing `text` key.

`VariantKinds` gains:

```rust
    /// Ids the codec also decodes as this variant, written `decodes(PATH, …)`;
    /// the reader ignores them.
    pub decodes: Vec<Path>,
```

`variant_kinds` initializes it empty and parses `decodes(…)`:

```rust
            Meta::List(list) if list.path.is_ident("decodes") => {
                out.decodes.extend(list.parse_args_with(Punctuated::<Path, Token![,]>::parse_terminated)?)
            }
```

Its error message becomes "`kind` takes kinds, `display`, `display(kind)`, `folded(kind)` or `decodes(kind, …)`".

Add:

```rust
/// `#[wire(key = "…")]` on a field: the key it crosses the wire under.
pub fn wire_key(attrs: &[Attribute]) -> syn::Result<Option<LitStr>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("wire")) else { return Ok(None) };
    let mut key = None;
    attr.parse_nested_meta(|meta| {
        if meta.path.is_ident("key") {
            key = Some(meta.value()?.parse::<LitStr>()?);
            Ok(())
        } else {
            Err(meta.error("`wire` takes `key = \"…\"`"))
        }
    })?;
    key.map(Some).ok_or_else(|| syn::Error::new_spanned(attr, "`wire` names its key: `#[wire(key = \"…\")]`"))
}
```

In `lib.rs`, add `wire` to the derive's helper attributes, `attributes(transport, slot, kind, flank, separator_kind, wire)`. The crate doc comment says the derive expands a declaration into its typed reader and its wire codec.

- [ ] **Step 4: The codec**

Above the test module in `codec.rs`:

```rust
//! The wire codec a transport declaration expands to, in today's napi object
//! form: `FromNapiValue` and `ToNapiValue` for the type and for `Box` of it.
//! Every item sits inside `::sittir_core::napi_codec!`, which keeps it only
//! when `sittir-core` is built with napi bindings, and names napi as
//! `::sittir_core::__napi`.

use proc_macro2::TokenStream;
use quote::quote;
use syn::{Ident, LitStr, Path, Type};

/// A struct field as the wire sees it.
pub struct WireField<'a> {
    pub ident: &'a Ident,
    pub ty: &'a Type,
    pub key: &'a LitStr,
}

/// A choice variant as the wire sees it.
pub struct WireVariant<'a> {
    pub name: &'a Ident,
    /// The written payload type; `None` for a unit variant.
    pub payload: Option<&'a Type>,
    /// The index the reader's `__variant` gives the variant, when it matches one.
    pub index: Option<u16>,
    /// The id a unit variant writes: the first it claims.
    pub first: Option<Path>,
    /// Ids the codec also decodes as this variant.
    pub decodes: Vec<Path>,
    pub blank: bool,
    pub verbatim: bool,
    /// For a `text` variant, the kinds whose objects carrying `$text` it takes.
    pub text: Option<Vec<Path>>,
}

fn napi() -> TokenStream {
    quote!(::sittir_core::__napi)
}

fn c_key(key: &LitStr) -> syn::Result<syn::LitCStr> {
    let value = ::std::ffi::CString::new(key.value()).map_err(|_| syn::Error::new_spanned(key, "a wire key holds no NUL byte"))?;
    Ok(syn::LitCStr::new(&value, key.span()))
}

fn is_option(ty: &Type) -> bool {
    crate::expand::last_segment(ty).as_deref() == Some("Option")
}

fn gated(items: TokenStream) -> TokenStream {
    quote!(::sittir_core::napi_codec! { #items })
}

fn boxed(ident: &Ident) -> TokenStream {
    let napi = napi();
    quote! {
        impl #napi::bindgen_prelude::FromNapiValue for ::std::boxed::Box<#ident> {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                unsafe { <#ident as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val) }.map(::std::boxed::Box::new)
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for ::std::boxed::Box<#ident> {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                unsafe { <#ident as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, *val) }
            }
        }
    }
}

/// The initializers that read `fields` from `obj`, each by its key.
fn field_reads(owner: &str, fields: &[&WireField<'_>]) -> syn::Result<Vec<TokenStream>> {
    fields
        .iter()
        .map(|field| {
            let (ident, key) = (field.ident, c_key(field.key)?);
            let read = if is_option(field.ty) { quote!(optional) } else { quote!(required) };
            Ok(quote!(#ident: unsafe { ::sittir_core::boundary::#read(env, obj, #key, #owner)? },))
        })
        .collect()
}

/// `{ $type, …fields }`: the required fields in one call, an optional one only when present.
fn struct_encode(ident: &Ident, fields: &[WireField<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let names = fields.iter().map(|field| field.ident);
    let (mut required, mut optional) = (Vec::new(), Vec::new());
    for field in fields {
        let (name, key) = (field.ident, c_key(field.key)?);
        if is_option(field.ty) {
            optional.push(quote! {
                if let ::core::option::Option::Some(value) = #name {
                    unsafe { ::sittir_core::boundary::set(env, obj, #key, #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, value)?)? };
                }
            });
        } else {
            required.push(quote!((#key, #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, #name)?),));
        }
    }
    Ok(quote! {
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                let Self { #(#names),* } = val;
                let obj = unsafe {
                    ::sittir_core::boundary::object_with(env, &[
                        (c"$type", #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, __KIND.0)?),
                        #(#required)*
                    ])?
                };
                #(#optional)*
                ::core::result::Result::Ok(obj)
            }
        }
    })
}

/// A struct: decoded from an object field by field, encoded as one.
pub fn structure(ident: &Ident, fields: &[WireField<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let reads = field_reads(&ident.to_string(), &fields.iter().collect::<Vec<_>>())?;
    let encode = struct_encode(ident, fields)?;
    let boxed = boxed(ident);
    Ok(gated(quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };
                ::core::result::Result::Ok(Self { #(#reads)* })
            }
        }
        #encode
        #boxed
    }))
}

/// The module a kind constant lives in: the declared `kind` path less its
/// last segment, where the grammar's `kind_name_from_id` sits beside it.
fn kind_module(ident: &Ident, kind: Option<&Path>) -> syn::Result<Path> {
    let mut module = kind.cloned().ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf declares its kind: `#[transport(kind = …)]`"))?;
    if module.segments.len() < 2 {
        return Err(syn::Error::new_spanned(
            &module,
            format!("{ident}'s kind names no module to find `kind_name_from_id` in: write it as `<kind_ids module>::<CONST>`"),
        ));
    }
    module.segments.pop();
    module.segments.pop_punct();
    Ok(module)
}

/// A text leaf: decoded from its text, from a bare kind id (its fixed text) or
/// from an object; encoded as a struct, so a leaf in a choice keeps its `$type`.
/// A leaf with no fixed text refuses a bare kind id, naming that id's kind
/// through `kind_name_from_id` in the module its `kind` constant lives in.
pub fn text_leaf(ident: &Ident, fields: &[WireField<'_>], fixed: Option<&LitStr>, kind: Option<&Path>) -> syn::Result<TokenStream> {
    let napi = napi();
    let owner = ident.to_string();
    let text_key = fields
        .iter()
        .find(|field| field.ident == "text")
        .map(|field| c_key(field.key))
        .transpose()?
        .ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf has a `text` field"))?;
    let others: Vec<&WireField<'_>> = fields.iter().filter(|field| field.ident != "text").collect();
    let defaults: Vec<TokenStream> = others
        .iter()
        .map(|field| {
            let name = field.ident;
            quote!(#name: ::core::default::Default::default(),)
        })
        .collect();
    let reads = field_reads(&owner, &others)?;
    let fixed_text = fixed.map_or_else(|| quote!(""), |text| quote!(#text));
    let number = match fixed {
        Some(text) => quote! {
            #napi::ValueType::Number => ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string(#text), #(#defaults)* }),
        },
        None => {
            let names = kind_module(ident, kind)?;
            quote! {
                #napi::ValueType::Number => {
                    let id = unsafe { <u32 as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                    ::core::result::Result::Err(#napi::Error::from_reason(::std::format!(
                        "kind id {id} ({:?}) has no fixed text: {} renders from a node, not a kind id",
                        u16::try_from(id).map_or("<unknown>", |id| #names::kind_name_from_id(::sittir_core::types::KindId(id))),
                        #owner
                    )))
                }
            }
        }
    };
    let encode = struct_encode(ident, fields)?;
    let boxed = boxed(ident);
    Ok(gated(quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                match unsafe { ::sittir_core::slot::transport_value_type(env, napi_val)? } {
                    #napi::ValueType::String => ::core::result::Result::Ok(Self {
                        text: unsafe { <::std::string::String as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? },
                        #(#defaults)*
                    }),
                    #number
                    _ => {
                        let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };
                        ::core::result::Result::Ok(Self {
                            text: unsafe { ::sittir_core::boundary::optional::<::std::string::String>(env, obj, #text_key, #owner)? }
                                .unwrap_or_else(|| ::std::string::ToString::to_string(#fixed_text)),
                            #(#reads)*
                        })
                    }
                }
            }
        }
        #encode
        #boxed
    }))
}

/// A choice: an id resolves through the reader's `__variant`, then the
/// `decodes` ids, then the blank arm; any other id is refused.
pub fn choice(ident: &Ident, variants: &[WireVariant<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let owner = ident.to_string();
    let decoded = |name: &Ident, ty: &Type| {
        quote!(#ident::#name(unsafe { <#ty as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? }))
    };
    let (mut by_index, mut by_decodes, mut encodes) = (Vec::new(), Vec::new(), Vec::new());
    let (mut blank, mut error_arm, mut string_arm, mut text_arm) = (quote!(), quote!(), quote!(), quote!());
    for variant in variants {
        let name = variant.name;
        let value = match variant.payload {
            Some(ty) => decoded(name, ty),
            None => quote!(#ident::#name),
        };
        if let Some(i) = variant.index {
            by_index.push(quote!(::core::option::Option::Some(#i) => return ::core::result::Result::Ok(#value),));
        }
        if !variant.decodes.is_empty() {
            let ids = &variant.decodes;
            by_decodes.push(quote!(if [#(#ids),*].contains(&__Kind(id)) { return ::core::result::Result::Ok(#value); }));
        }
        if variant.blank {
            blank = quote!(if id == 0 { return ::core::result::Result::Ok(#ident::#name); });
        }
        if variant.verbatim {
            let ty = variant.payload.ok_or_else(|| syn::Error::new_spanned(name, "a verbatim variant holds its text"))?;
            let value = decoded(name, ty);
            error_arm = quote!(if id == ::sittir_core::types::KindId::ERROR.0 { return ::core::result::Result::Ok(#value); });
            string_arm = quote!(#napi::ValueType::String => ::core::result::Result::Ok(#value),);
        }
        if let Some(ids) = &variant.text {
            let ty = variant.payload.ok_or_else(|| syn::Error::new_spanned(name, "a text variant holds its text"))?;
            let value = decoded(name, ty);
            text_arm = quote! {
                if [#(#ids),*].contains(&__Kind(id))
                    && unsafe { ::sittir_core::boundary::property::<::std::string::String>(env, napi_val, c"$text")? }.is_some()
                {
                    return ::core::result::Result::Ok(#value);
                }
            };
        }
        encodes.push(match (variant.payload, variant.blank, &variant.first) {
            (Some(ty), _, _) => quote!(Self::#name(payload) => unsafe { <#ty as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, payload) },),
            (None, true, _) => quote!(Self::#name => unsafe { <u16 as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, 0) },),
            (None, false, Some(first)) => quote!(Self::#name => unsafe { <u16 as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, (#first).0) },),
            (None, false, None) => return Err(syn::Error::new_spanned(name, "a unit variant names the kind it writes: `#[kind(…)]`")),
        });
    }
    let expected = if string_arm.is_empty() {
        format!("{owner}: expected u16 kind_id or object with $type")
    } else {
        format!("{owner}: expected u16 kind_id, string, or object with $type")
    };
    let missing = format!("$type property missing in {owner}");
    let boxed = boxed(ident);
    Ok(gated(quote! {
        unsafe fn __decode_id(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value, id: u16) -> #napi::Result<#ident> {
            match __variant(__Kind(id), __Kind(id)) {
                #(#by_index)*
                _ => {}
            }
            #(#by_decodes)*
            #blank
            ::core::result::Result::Err(#napi::Error::from_reason(::std::format!("unknown kind id {id} in {}", #owner)))
        }
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                match unsafe { ::sittir_core::slot::transport_value_type(env, napi_val)? } {
                    #napi::ValueType::Number => {
                        let id = unsafe { <u16 as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                        unsafe { __decode_id(env, napi_val, id) }
                    }
                    #napi::ValueType::Object => {
                        let id: u16 = unsafe { ::sittir_core::boundary::property(env, napi_val, c"$type")? }
                            .ok_or_else(|| #napi::Error::from_reason(#missing))?;
                        #error_arm
                        #text_arm
                        unsafe { __decode_id(env, napi_val, id) }
                    }
                    #string_arm
                    _ => ::core::result::Result::Err(#napi::Error::from_reason(#expected)),
                }
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                match val {
                    #(#encodes)*
                }
            }
        }
        #boxed
    }))
}

/// An enum kind: a member decodes from an id it claims and writes its first.
pub fn members(ident: &Ident, firsts: &[(&Ident, Path)]) -> TokenStream {
    let napi = napi();
    let owner = ident.to_string();
    let encodes = firsts.iter().map(|(name, first)| quote!(Self::#name => (#first).0,));
    let boxed = boxed(ident);
    gated(quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                let id = unsafe { <u16 as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                __member(__Kind(id), __Kind(id)).ok_or_else(|| #napi::Error::from_reason(::std::format!("kind id {id} is not a kind {} takes", #owner)))
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                let id: u16 = match val {
                    #(#encodes)*
                };
                unsafe { <u16 as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, id) }
            }
        }
        #boxed
    })
}
```

The messages are today's: "unknown kind id … in …", "$type property missing in …", "… expected u16 kind_id …" and "kind id … is not a kind … takes". The one new message is the bare-kind-id refusal of a leaf with no fixed text, which names the type but no longer the kind, since the macro looks no kind name up.

- [ ] **Step 5: Wire the codec in**

In `expand.rs`:

- `last_segment` becomes `pub(crate)`.
- `Field` gains `key: Option<LitStr>`, and `fields_of` fills it with `attrs::wire_key(&field.attrs)?`.
- `derive` passes the choice's attributes: `Data::Enum(data) if attrs.choice => choice(&input.ident, &attrs, data),`.
- `structure`, after `has_layout`, builds the codec and places `#codec` after `#has_layout` inside the `const _` block:

```rust
    let wire = fields
        .iter()
        .map(|field| match &field.key {
            Some(key) => Ok(codec::WireField { ident: field.ident, ty: field.ty, key }),
            None => Err(syn::Error::new_spanned(field.ident, "a transport field crosses the wire under a key: `#[wire(key = \"…\")]`")),
        })
        .collect::<syn::Result<Vec<_>>>()?;
    let codec = match &attrs.text {
        Some(fixed) => codec::text_leaf(ident, &wire, fixed.as_ref(), attrs.kind.as_ref())?,
        None => codec::structure(ident, &wire)?,
    };
```

- `choice(ident: &Ident, attrs: &KindAttrs, data: &DataEnum)` builds `wire: Vec<codec::WireVariant>` in its loop. Take each variant's `payload` (the one unnamed field's type, else `None`) and its `form = attrs::kind_attrs(&variant.attrs)?` once.
  - A blank variant pushes `WireVariant { blank: true, .. }` with no payload and no index before it continues.
  - A `form.verbatim` variant pushes `verbatim: true` with its payload, and continues before the read tables.
  - A `form.text` variant takes its `#[kind]` (an error naming the variant when it has none), pushes `text: Some(kinds.kinds)`, and continues before the read tables: its ids are taken only from an object carrying `$text`.
  - A variant with no `#[kind]` pushes a `WireVariant` with no index (it is never decoded; its payload still encodes) and continues as now.
  - Every other variant pushes `index: Some(at as u16)`, `first: kinds.kinds.first().or(kinds.shown.first()).or(kinds.folded.first()).cloned()` and `decodes: kinds.decodes.clone()`, then builds its read-table entries as now.
  - After the loop, `let codec = codec::choice(ident, &wire)?;` goes inside the `const _` block after `#has_layout`.
  - With `attrs.codec_only`, the block holds only the `__Kind` import, `__variant` (with `#[allow(dead_code)]`, since without napi bindings nothing calls it) and `#codec`: no read functions, no `ReadTransport` impl, no `HasLayout`.
- `members` collects `firsts: Vec<(&Ident, Path)>` in its loop, each member's first claimed id taken the same way. It places `codec::members(ident, &firsts)` inside its `const _` block.

- [ ] **Step 6: Run the derive's tests**

Run: `rtk cargo test -p sittir-transport-macros`
Expected: PASS, 9 tests.

- [ ] **Step 7: Write codegen's failing tests**

In `render-module-emit.test.ts`:

```ts
describe('the wire codec facts', () => {
	it('keys every field and prints no napi codec of its own', async () => {
		const src = await getRustTemplatesRs();
		for (const gone of ['napi(object)', 'FromNapiValue', 'ToNapiValue', 'debug-transport', 'decodes as none of its members', 'pub struct VerbatimTransport']) {
			expect(src).not.toContain(gone);
		}
		expect(src).toContain('use ::sittir_core::VerbatimTransport;');
		const item = extractStructBody(src, 'FunctionItemTransport');
		expect(item).toMatch(/    #\[wire\(key = "\$_layout"\)\]\n    pub layout: Option<TransportLayout>,/);
		expect(item).toMatch(/    #\[wire\(key = "_name"\)\]\n    #\[slot\(field = field::NAME\)\]\n    pub name: /);
		expect(extractStructBody(src, 'IdentifierTransport')).toMatch(/    #\[wire\(key = "\$text"\)\]\n    pub text: String,/);
	});

	it('marks the verbatim arm of a choice that takes bare text, and only there', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toMatch(/    #\[transport\(verbatim\)\]\n    Verbatim\(VerbatimTransport\),/);
		const any = src.slice(src.indexOf('pub enum AnyTransport {'));
		const anyBody = any.slice(0, any.indexOf('\n}'));
		expect(anyBody).toMatch(/\n    Verbatim\(VerbatimTransport\),/);
		expect(anyBody).not.toContain('#[transport(verbatim)]');
	});

	it("states an envelope's wire ids", async () => {
		const src = await getTypescriptTransportRs();
		const member = src.slice(src.indexOf('pub enum MemberExpressionPropertyTransportSlot {'));
		expect(member).toMatch(/    #\[kind\(kind::_PROPERTY_IDENTIFIER, display, decodes\(kind::\w+(?:, kind::\w+){21}\)\)\]\n    PropertyIdentifier\(/);
	});

	it('derives the codec alone for trivia', async () => {
		const src = await getRustTemplatesRs();
		expect(src).toMatch(/#\[derive\(Debug, Clone, PartialEq, ::sittir_core::Transport\)\]\n#\[transport\(choice, codec_only\)\]\npub enum TriviaTransport \{/);
		expect(src).toMatch(/    #\[transport\(text\)\]\n    #\[kind\([^\n]*\)\]\n    Text\(::sittir_core::trivia::TriviaText\),/);
		expect(src).toMatch(/    #\[transport\(verbatim\)\]\n    Verbatim\(VerbatimTransport\),\n    #\[transport\(text\)\]/);
	});
});
```

Create `native-typings.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const ADDON_API = ['EngineOptions', 'SittirEngine', 'disposeTree', 'liveTreeCount'];

describe("each grammar's native typings", () => {
	it.each(GRAMMARS)('%s declares the addon API alone', (grammar) => {
		const dts = readFileSync(new URL(`../../../../${grammar}/native/index.d.ts`, import.meta.url), 'utf8');
		const declared = [...dts.matchAll(/^export (?:declare )?(?:class|function|interface|type|const|enum) (\w+)/gm)].map((m) => m[1]).sort();
		expect(declared).toEqual(ADDON_API);
	});
});
```

The typings test holds the surface shut: `type-check:native` catches a type the file names but does not declare, and this test catches one it declares beyond the API.

- [ ] **Step 8: Run to verify failure**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts -t "the wire codec facts"` and `pnpm exec vitest run packages/codegen/src/emitters/__tests__/native-typings.test.ts`
Expected: FAIL (`napi(object)` is printed; each `index.d.ts` declares the transports).

- [ ] **Step 9: Print the codec's facts**

In `render-module.ts`:

- Add `wireKeyAttr(key: string): string`, which returns `` `    #[wire(key = ${JSON.stringify(key)})]` ``. Every field key below prints through it.
- `renderTransportField` prints `wireKeyAttr(`_${field.storageName}`)` in place of its `cfg_attr(… napi(js_name …))` line.
- `LAYOUT_FIELD.jsName` becomes `wireKey`. `renderLayoutField` prints `wireKeyAttr(LAYOUT_FIELD.wireKey)` above the field. `renderLeafTransportPlainFields` prints `wireKeyAttr(LAYOUT_FIELD.wireKey)` above `layout` and `wireKeyAttr('$text')` above `text`.
- In `renderTransportDataStruct`, the list's `_delimiter` and `_separator` fields and each spacing site's field print `wireKeyAttr(…)` with the key they print today. Drop the `napi(object)` line.
- In `emitSupertypeTransportEnum` and `emitPerSlotChildEnum`, print `    #[transport(verbatim)]` above `    Verbatim(VerbatimTransport),` when the choice admits verbatim text: `supertypeAdmitsVerbatim(supertypeNode, nodeMap)` for a supertype, and `validKinds.some(({ node }) => node.modelType === 'pattern')` for a per-slot choice. These are the facts today's decoders read in the `admitsVerbatim` they already compute. `AnyTransport`'s `Verbatim` stays unmarked, since today's `AnyTransport` decodes no verbatim text.
- `variantKindLines`'s envelope branch appends the extras it records for the pin: `#[kind(${variantKindArgs([variant.aliasTypeId], true, read.ctx)}${extras.length === 0 ? '' : `, decodes(${extras.map((id) => read.ctx.names.kind(id)).join(', ')})`})]`, where `extras` is the list it sets in `read.envelopeExtras`.
- `renderTriviaTransportSupport` takes `read: ReadPrint` from its caller and prints `TRANSPORT_DERIVE` and `#[transport(choice, codec_only)]` above `pub enum TriviaTransport`.
  - Each extras variant with a kind id gets `    #[kind(${variantKindArgs([id], false, read.ctx)})]`.
  - `Verbatim` gets `    #[transport(verbatim)]`.
  - `Text` gets `    #[transport(text)]` and `    #[kind(${variantKindArgs(textIds, false, read.ctx)})]`, where `textIds` are the ids today's text arms take: the extras nodes that are `AbstractAssembledCompound` and have a kind id.
- Delete `renderVerbatimTransport` and its call. `emitRenderModule` adds `'use ::sittir_core::VerbatimTransport;'` beside `'use super::{field_ids as field, kind_ids as kind};'`, so every `VerbatimTransport` the module names is the core's.

- [ ] **Step 10: Delete the hand-written codec**

- `emitTransportEnumFromNapiValueBody` and the `FromNapiValue`/`ToNapiValue` impls its three callers print around it (`emitSupertypeTransportEnum`, `emitPerSlotChildEnum`, `renderTriviaTransportSupport`).
- `renderBoxedEnumNapiImpls` and its four calls; `kindIdNapiImpls`, `KindIdArm` and `fixedLiteralNapiImpls`, with their calls in `renderEnumType` and `renderFixedLiteralTransport`; `renderLeafTransportNapiImpls`; `unitDecodeArm`; `wirePropertyRead`.
- In `renderAnyTransportWithNapiFromValue`, the three impls. It keeps `emittedNodeIds` and `claimedBy` and its printing, and becomes `renderAnyTransport`.
- In `emitSupertypeTransportEnum`, `buildKindIdArms` keeps its claim bookkeeping and stops building arm text; it becomes `claimSupertypeIds`, returning `claimedBy`. Its `emittedIds` stays seeded with the supertype's own id, its suppressed kinds' ids and its self-alias ids before the members claim, so every variant's `#[kind]` prints exactly as today and the codec refuses those ids (ruling 1). Delete `emitDecodeTrials`, `selfAliasLeafTrials`, `emitAliasUnwrapRecurseArm`, `AliasLeafTrial` and `aliasLeafTrialOrder`.
- `emitPerSlotChildEnum` does the same: its claim bookkeeping stays, seeded with its alias-wrapper ids as today, and its arm text goes.
- Every function or type this leaves without a caller goes too: check each with `find_all_references` (expected: `nodeTransportHasRequiredField`, `isLeafLikeNode`).
- `native-crate.ts`: the generated `Cargo.toml` loses `debug-transport = ["sittir-core/debug-transport"]`. `sittir-core/Cargo.toml` loses `debug-transport = []` and its comment.
- `layout.rs` and `trivia.rs`: delete the `TypeName` and `ValidateNapiValue` impls of `TransportLayout` and `TransportTrivia`; napi's object derive was their only user. If the workspace does not build without them, keep them and report which use needs them.
- Glossary: delete the entries of every deleted declaration. Add `wireKeyAttr`, `claimSupertypeIds` and `renderAnyTransport`. Update the entries of the printers above. `boxedInEnum`'s entry keeps its body until Task 15.

- [ ] **Step 11: The tests that pinned a decoder**

Each test that pinned printed decoder text now pins the facts the derive decodes from. None pins a decoder.
- `native-transport-emit.test.ts`, lines 452, 471, 502, 522, 545, 679 and 697: `#[cfg_attr(feature = "napi-bindings", napi(js_name = "_x"))]` becomes `#[wire(key = "_x")]`, with the same key.
- `render-module-separated-list.test.ts`, lines 139–140: `wire(key = "_delimiter")` and `wire(key = "_separator")`.
- `render-module-emit.test.ts`:
  - lines 314–320 (a leaf's typeof dispatch) become the leaf's `#[wire(key = "$text")]` line;
  - lines 335–338 (`PlusTransport`'s `u16` decoder) become its `#[transport(choice)]` and the variant's `#[kind(kind::PLUS)]`;
  - lines 372–374, 415 and 459 change `napi(js_name = …)` to `wire(key = …)` with the same keys and the same assertions;
  - the `ExpressionTransport` decoder test from line 482 becomes the variant's `#[kind(…)]` lines it already reaches, plus `#[transport(verbatim)]` where the decoder took a string;
  - "gives a blank arm only to the choices that blank options hold" (line 753) counted three arms admitting id 0 in each blank choice: `from_kind_id`'s, which render option defaults still call, and the two napi decoder branches. The decoders are gone, so `blankIdArms` is now `blankChoices.length`, one per choice.
- `native-transport-emit.test.ts`, lines 597–598: the decoder arms `410 => Ok(Self::WrappedItem(` and `411 => Ok(Self::Integer(` become the variants' claims, matched as `/    #\[kind\([^\n]*\)\]\n    WrappedItem\(/` and `/    #\[kind\([^\n]*\)\]\n    Integer\(/`.
- `typed_read.rs`: every field of every declared transport gains the key codegen would print for it: `$_layout` on the layout field, `$text` on a text leaf's `text`, and `_<name>` on every other field.

- [ ] **Step 12: Regenerate, build, test**

Run the vitest files (PASS, apart from `native-typings` until the natives are rebuilt). Run `pnpm run regen:all`, which regenerates the five grammars and builds their release natives; only the native build rewrites `native/index.d.ts`. Then run:

- `rtk cargo build --workspace`: PASS. A generated crate that fails to compile points at the derive or at a printed fact; fix it there.
- `rtk cargo test -p sittir-parity-tests --features sittir-core/napi-bindings`: PASS. This compiles every declaration's codec, generated and hand-written.
- `rtk cargo test --workspace --no-default-features`: PASS.
- `pnpm exec vitest run packages/codegen/src/emitters/__tests__/native-typings.test.ts`: PASS. Each rebuilt `index.d.ts` declares `SittirEngine`, `EngineOptions`, `disposeTree` and `liveTreeCount` alone.

Then `pnpm run type-check:native`: 0 errors, against 2,732 on master. Chain it into `type-check` in `package.json`: `… && pnpm run type-check:examples && pnpm run type-check:native`.

- [ ] **Step 13: Gates and commit**

The global gates:

- `pnpm run validate:native`: rows unchanged. Two of its checks now go through the derive's decoder:
  - the `built-render-parse` rows render factory-built nodes through it;
  - its `typed-read-parity` run decodes today's detached data through it, and must report `refused: 0`, `differs: 0` and `todayFailed: 0` on all five grammars.

  A today-failed entry is data today's decoder took and the derive refuses. Report it with its kind and id (stop rule), since ruling 1 predicts none.
- Rendered bytes unchanged.
- Record each `transport.rs`'s line count before and after (master: rust 69,118, typescript 75,079, python 44,338, scm 7,481, regex 9,787).

```bash
git add rust/crates/sittir-transport-macros/src/codec.rs packages/codegen/src/emitters/__tests__/native-typings.test.ts
git commit -F msg -- rust/crates packages/codegen/src packages/*/native package.json docs/glossary/emitters.md
```

Message: `feat(transport): the derive expands every transport's napi codec; codegen prints its facts and no codec of its own`.

---

## Task 14: The corpus round trip

The derive's encoders have no caller before 1c, which sends the typed read to JavaScript through them (ruling 7). This task gives them one. The engine gains a transitional `typedReadRoundTrip(treeId)`. It reads a tree one level deep and then whole, encodes each read to JavaScript, decodes it back through the same codec and compares the two. The comparison is the debug text, line for line. `SlotValue`'s equality compares a coordinate's tree, span and kind only, and leaves out its row, its text-only flag and its gap. Both sides come from one read, so every line must match. The parity harness runs the round trip on every corpus entry, so `validate:native` gates it.

The one-level read is the half that matters for coordinates. Past the depth, every child with structure is a coordinate, so each one is encoded and decoded.

**Files:**
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`with_typed_read`, `typed_read_refusal`, `typed_read_parity`, `parity_report`, its tests)
- Modify: `packages/codegen/src/emitters/native-crate.ts:3`
- Modify: `packages/types/src/engine-api.ts:170-204`
- Modify: `packages/common/src/engine.ts:69-90,313-320,410-411`, `packages/common/src/create-engine.ts:165-166`
- Modify: `packages/tools/src/validate/typed-read-parity.ts`, `packages/cli/src/commands/tool/typed-read-parity.ts`
- Create: `packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts`
- Generated: `packages/*/src/backend.ts`, `rust/crates/sittir-*/src/lib.rs`, `packages/*/native/index.d.ts`, `docs/cli-command-glossary.md`
- Modify: `docs/glossary/emitters.md`, `docs/glossary/packages-tools-src-validate.md`

**Interfaces:**
- Consumes: Task 13's `FromNapiValue` and `ToNapiValue` for every transport, and Task 12's encoders for `SlotValue`, `SourceGap`, `SourceFlank`, `TransportLayout`, `TransportTrivia` and `Span`.
- Produces:
  - napi `typedReadRoundTrip(treeId: number): string | null`;
  - diagnostics `typedReadRoundTrip(treeId: number): string | null`;
  - the harness outcome `'round-trip'` and the summary field `roundTrip: number`;
  - `with_typed_read(tree_id, depth, then)`;
  - `sittir_core::napi_engine::round_trip_report(encoded: &str, decoded: &str) -> Option<String>`.

- [ ] **Step 1: Write the report's failing tests**

In `napi_engine.rs`'s test module, import `round_trip_report` beside `parity_report` and add:

```rust
    #[test]
    fn a_round_trip_compares_every_line_handles_included() {
        assert_eq!(round_trip_report(ABSENT, ABSENT), None);
        let report = round_trip_report("A {\n    handle: 1,\n}", "A {\n    handle: 2,\n}").unwrap();
        assert!(report.starts_with("first difference at line 1\n--- encoded\n"), "{report}");
        assert!(report.contains("\n--- decoded\n"), "{report}");
    }

    #[test]
    fn a_decoded_read_that_ends_early_is_a_difference() {
        let report = round_trip_report(EMPTY, "Block {").unwrap();
        assert!(report.starts_with("first difference at line 1"), "{report}");
    }
```

The first test is the line `parity_report` drops on purpose: a coordinate's handle.

- [ ] **Step 2: Run to verify failure**

Run: `rtk cargo test -p sittir-core --features napi-bindings napi_engine::tests`
Expected: FAIL to compile: `round_trip_report` is not defined.

- [ ] **Step 3: The report**

Both reports print their first difference the same way. Move the window out of `parity_report` into a helper both call:

```rust
/// Twelve lines of each dump around the first place they part, headed by the
/// line number and each dump's name.
fn first_difference(at: usize, first: (&str, &[String], usize), second: (&str, &[String], usize)) -> String {
    let window = |lines: &[String], at: usize| lines[at.saturating_sub(12)..(at + 12).min(lines.len())].join("\n");
    format!("first difference at line {at}\n--- {}\n{}\n--- {}\n{}", first.0, window(first.1, first.2), second.0, window(second.1, second.2))
}
```

`parity_report`'s tail becomes:

```rust
    if i < typed.len() || j < today.len() {
        report.push(first_difference(i, ("typed read", &typed, i), ("today's read", &today, j)));
    }
```

Its output is unchanged, and its five tests pin that. Then add:

```rust
/// How a read decoded from its own encoding differs from the read, from their
/// debug text. Every line counts, a coordinate's handle and text-only flag
/// included, since both sides come from one read. `None` when they agree.
pub fn round_trip_report(encoded: &str, decoded: &str) -> Option<String> {
    let lines = |dump: &str| dump.lines().map(str::to_owned).collect::<Vec<_>>();
    let (encoded, decoded) = (lines(encoded), lines(decoded));
    let at = encoded.iter().zip(&decoded).take_while(|(a, b)| a == b).count();
    (at < encoded.len().max(decoded.len())).then(|| first_difference(at, ("encoded", &encoded, at), ("decoded", &decoded, at)))
}
```

- [ ] **Step 4: The engine call**

`with_typed_read` takes the depth it reads at:

```rust
            fn with_typed_read<T>(
                &self,
                tree_id: f64,
                depth: $crate::read::Depth,
                then: impl FnOnce(
                    ::std::result::Result<$render_root, $crate::read::ReadError>,
                    &dyn Fn($crate::types::KindId) -> &'static str,
                ) -> ::napi::Result<T>,
            ) -> ::napi::Result<T> {
```

Its read becomes `parsed.typed_read::<$render_root>(depth)`. `typed_read_refusal` and `typed_read_parity` pass `$crate::read::Depth::All`, as they read today. After `typed_read_parity`, add:

```rust
            /// Transitional, while today's read and the typed read both exist:
            /// encode the typed read of tree `treeId` to JavaScript and decode it
            /// back, read one level deep and then whole. `null` when both come
            /// back unchanged; otherwise the depth, and the refusal, the encoder's
            /// or decoder's error, or the first place the decoded read differs.
            #[::napi_derive::napi]
            pub fn typed_read_round_trip(&self, env: ::napi::Env, tree_id: f64) -> ::napi::Result<Option<String>> {
                for (depth, label) in [($crate::read::Depth::ONE, "one level"), ($crate::read::Depth::All, "whole")] {
                    let typed = self.with_typed_read(tree_id, depth, |typed: ::std::result::Result<$render_root, $crate::read::ReadError>, name| {
                        Ok(typed.map_err(|refusal| refusal.describe(name)))
                    })?;
                    let typed = match typed {
                        Ok(typed) => typed,
                        Err(refusal) => return Ok(Some(format!("read {label}: refused: {refusal}"))),
                    };
                    let encoded = format!("{typed:#?}");
                    let value = match unsafe { <$render_root as ::napi::bindgen_prelude::ToNapiValue>::to_napi_value(env.raw(), typed) } {
                        Ok(value) => value,
                        Err(error) => return Ok(Some(format!("read {label}: encoding failed: {error}"))),
                    };
                    let decoded = match unsafe { <$render_root as ::napi::bindgen_prelude::FromNapiValue>::from_napi_value(env.raw(), value) } {
                        Ok(decoded) => decoded,
                        Err(error) => return Ok(Some(format!("read {label}: decoding failed: {error}"))),
                    };
                    if let Some(report) = $crate::napi_engine::round_trip_report(&encoded, &format!("{decoded:#?}")) {
                        return Ok(Some(format!("read {label}: {report}")));
                    }
                }
                Ok(None)
            }
```

The read ends inside `with_typed_read`, and the encoding and decoding run after it returns, so no JavaScript value is made while the tree table is borrowed. An error in either direction is reported as the entry's round trip, not thrown, so one bad entry does not end the corpus run.

- [ ] **Step 5: Run the report's tests**

Run: `rtk cargo test -p sittir-core --features napi-bindings napi_engine::tests`
Expected: PASS, 7 tests.

- [ ] **Step 6: Write the JavaScript test**

Create `packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { treeTokenOf } from '@sittir/common/utils';
import { loadNativeEngine } from '../common.ts';

async function roundTrip(grammar: string, source: string): Promise<string | null> {
	const engine = await loadNativeEngine(grammar);
	const treeId = treeTokenOf(engine.parse(source, { deep: true }) as object)?.treeId;
	if (treeId === undefined) throw new Error(`${grammar}: the parsed root holds no tree`);
	return engine.diagnostics.typedReadRoundTrip(treeId);
}

describe('a typed read crosses to JavaScript and back unchanged', () => {
	it.each([
		['rust', 'fn f() {\n    // note\n    a;\n}\n', 'a comment owned as trivia'],
		['rust', 'fn f() { let v = [1, 2, 3]; }', 'a separated list'],
		['rust', 'fn f() { x }', 'a text leaf held by a choice'],
		['typescript', 'const xs = [a, , b];', "an elided element's hole"],
		['typescript', 'a.get;', 'a keyword read as a property name'],
		['python', 'def f():\n    return x  # note\n', 'a trailing comment']
	])('%s: %s (%s)', async (grammar, source) => {
		expect(await roundTrip(grammar, source)).toBeNull();
	});
});
```

Each source reaches one of the review focus's cases. The text leaf in a choice must encode as an object carrying its `$type`: encoded as a bare string, it would come back as the choice's `Verbatim`. The hole is `null` in a list. The keyword under a property name is a leaf in an envelope variant. Every case runs at both depths, so each one's coordinates cross too.

Run: `pnpm exec vitest run packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts`
Expected: FAIL: `typedReadRoundTrip` is not a function of the engine's diagnostics.

- [ ] **Step 7: The JavaScript side**

- `native-crate.ts`: `NATIVE_RENDER_TRANSPORT_ABI` becomes 19, since `backend.ts` must refuse a native build without the new call.
- `NativeEngineLike`: add `typedReadRoundTrip?(treeId: number): string | null;` after `typedReadParity`.
- `EngineDiagnostics`, after `typedReadParity`:

```ts
	/** Transitional: encode the typed read of tree `treeId` to JavaScript and decode it back, read one level deep and then whole; `null` when both come back unchanged, else the depth and the refusal, the codec's error or the first difference. */
	typedReadRoundTrip(treeId: number): string | null;
```

- `NativeLanguageEngine`: add `typedReadRoundTrip: EngineDiagnostics['typedReadRoundTrip'];`.
- `packages/common/src/engine.ts`, the diagnostics after `typedReadParity`:

```ts
					typedReadRoundTrip(treeId: number): string | null {
						if (engine.typedReadRoundTrip === undefined) throw new Error('typedReadRoundTrip: this native binary has no typed reader');
						return engine.typedReadRoundTrip(treeId);
					},
```

  and `nativeLanguageEngine` forwards it: `typedReadRoundTrip: (treeId) => engine.diagnostics.typedReadRoundTrip(treeId),`.
- `packages/common/src/create-engine.ts`: `typedReadRoundTrip: (treeId) => native.typedReadRoundTrip(treeId)` after `typedReadParity`.

Run `pnpm run regen:all`, which regenerates the five grammars with the new ABI and builds their release natives. Each `native/index.d.ts` gains `typedReadRoundTrip(treeId: number): string | null` on `SittirEngine`.

- [ ] **Step 8: Run the test**

Run: `pnpm exec vitest run packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts`
Expected: PASS, 6 tests. A failure names an encoder that does not invert its decoder. Fix it where the pair is declared, in `codec.rs` or Task 12's core encoders, and pin the fix with a unit test there (the derive's expansion test, or the core type's encoder test). The commit message lists each such fix.

- [ ] **Step 9: The harness runs it on the corpus**

In `typed-read-parity.ts`:

- `TypedReadParityOutcome` becomes `'refused' | 'differs' | 'round-trip' | 'today-failed' | 'stale-listed'`.
- `TypedReadParitySummary` gains `readonly roundTrip: number;` after `differs`.
- In `computeTypedReadParity`, after the refusal check:

```ts
		const roundTrip = engine.diagnostics.typedReadRoundTrip(treeId);
		if (roundTrip !== null) rows.push({ entry: entry.name, outcome: 'round-trip', report: roundTrip });
```

  An entry agrees only when its round trip does too. The tail of the loop becomes:

```ts
		if (difference === '' && unlisted.length === 0) {
			if (roundTrip === null) agreed++;
		} else {
			const notes = unlisted.map(({ kind, slot }) => `empty slot not in the listed rows: ${kind}.${slot}`);
			rows.push({ entry: entry.name, outcome: 'differs', report: [...notes, difference].filter((part) => part !== '').join('\n') });
		}
```

- The summary gains `roundTrip: count('round-trip')`, and `run`'s exit status counts it: `summary.refused + summary.differs + summary.roundTrip + summary.todayFailed + summary.staleListed > 0`.

In `packages/cli/src/commands/tool/typed-read-parity.ts`, `describe` becomes "Compare the typed reader with today's read and wrap on every corpus entry, and send each typed read to JavaScript and back; exits 1 on any refusal, difference, failed round trip, stale listed row or entry today's pipeline cannot decode". Regenerate the CLI glossary: `pnpm exec tsx packages/cli/src/glossary.ts > docs/cli-command-glossary.md`.

- [ ] **Step 10: Run it on the corpus**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool typed-read-parity --all-grammars`
Expected: each grammar's summary has `roundTrip: 0`, with `refused`, `differs`, `todayFailed` and `staleListed` still 0. A round-trip row is fixed as in Step 8.

- [ ] **Step 11: Glossary**

- `docs/glossary/emitters.md`, `NATIVE_RENDER_TRANSPORT_ABI`: the read calls' list gains "and the typed-read round-trip call takes a tree id".
- `docs/glossary/packages-tools-src-validate.md`: the module entry says the harness also sends each entry's typed read to JavaScript and back, read one level deep and whole, and that an entry whose read does not come back unchanged is `round-trip`, which fails the gate. Update `computeTypedReadParity`'s and `run`'s entries to match.

- [ ] **Step 12: Gates and commit**

The global gates. Rendered bytes and validation rows are unchanged, and the only generated change is the ABI constant and the new method in each `index.d.ts`.

```bash
git add packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts
git commit -F msg -- rust/crates/sittir-core/src/napi_engine.rs packages/codegen/src/emitters/native-crate.ts packages/types/src packages/common/src packages/tools/src packages/cli/src rust/crates packages/*/src/backend.ts packages/*/native/index.d.ts docs/glossary docs/cli-command-glossary.md
```

Message: `feat(engine): every corpus read crosses to JavaScript and back unchanged`.

---

## Task 15: The payload ceiling

A choice is as large as its largest payload. In the dev profile, every frame that holds a choice by value pays that size once per temporary. The typed read's root therefore costs 375 KiB of stack in the dev profile against today's 39 KiB on macOS arm64, and 391 against 63 KiB on linux x86_64. The size census (`docs/superpowers/probes/2026-10-01-shared-arena/stack/size-census.py`) finds the largest choices at 4,256 bytes (rust's `StatementTransport`) and 9,432 (typescript). No short list of kinds shrinks them: 90 payload types are over 512 bytes in rust, 128 in typescript, 61 in python, 6 in scm and 16 in regex.

A byte ceiling does (ruling 9). Every payload type over the ceiling is boxed in every choice the reader reads, by a list pinned per grammar. Generated `const` assertions check every such payload against the ceiling both ways. A payload that grows past the ceiling fails the build asking to be pinned. A pinned payload that shrinks under it fails asking to be unpinned. The ceiling is the largest of 512, 256 and 128 bytes that passes the stack gate (ruling 10) in both profiles: at 200 levels and per level, the typed read needs no more stack than today's. A tie at 200 levels does not decide between ceilings; the next one down is measured. If none passes, stop and report the measurements.

A payload's size depends only on the types it holds by value, and those never hold it back: a cycle through a choice is already boxed at the field that closes it. So pinning settles from the leaves up, and the pin list converges in a few rounds.

`TriviaTransport` is outside the rule. It is codec-only, and its values live in the trivia's vectors, never in a reader's frame.

**Files:**
- Create: `packages/codegen/src/emitters/boxed-payloads.ts`
- Modify: `packages/codegen/src/emitters/render-module.ts` (`RenderOptionsInputs`, `ReadPrint`, `readPrintOf`, `boxedInEnum`, `emitSupertypeTransportEnum`, `emitSupertypeRenderHelper`, `emitPerSlotChildEnum`, `renderAnyTransport`, `renderTypedDispatch`, `renderTransportSupport`), `emit.ts`
- Modify: `rust/crates/sittir-parity-tests/tests/typed_read_nesting.rs`
- Test: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
- Generated: `rust/crates/sittir-*/src/render/transport.rs`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: Task 13's codec impls for `Box<T>` of every derived `T`; `impl<T: ReadTransport> ReadTransport for Box<T>` in `sittir_core::read`.
- Produces:
  - `PAYLOAD_CEILING_BYTES: number` and `BOXED_PAYLOADS: Readonly<Record<string, readonly string[]>>`, keyed by grammar name and holding transport type names;
  - `RenderOptionsInputs.boxedPayloads?: readonly string[]`, the pins an emission is given, and `grammarRenderInputs(grammar: GrammarName, inputs: RenderOptionsInputs): RenderOptionsInputs`, the one read of `BOXED_PAYLOADS`, which `emit.ts` and the render-module test's real-model helper both call (a fixture emission passes no pins, so it boxes and refuses nothing);
  - `boxedInEnum(node: AssembledNode, boxedPayloads: readonly string[]): boolean`;
  - `choicePayloadType(node: AssembledNode, read: ReadPrint): string`, which records the payload and returns `Box<T>` or `T`;
  - `payloadCeilingAssertions(pinned: readonly string[], payloads: ReadonlySet<string>): string[]`;
  - `ReadPrint.choicePayloads: Set<string>` and `ReadPrint.boxedPayloads: readonly string[]`.

- [ ] **Step 1: Write the failing tests**

In `render-module-emit.test.ts`, import `BOXED_PAYLOADS` and `PAYLOAD_CEILING_BYTES` from `../boxed-payloads.ts` and `payloadCeilingAssertions` from `../render-module.ts`, and add:

```ts
describe('the payload ceiling', () => {
	it('boxes each pinned payload in every choice the reader reads, and nowhere unboxed', async () => {
		const src = await getRustTemplatesRs();
		expect(BOXED_PAYLOADS.rust!.length).toBeGreaterThan(0);
		for (const name of BOXED_PAYLOADS.rust!) {
			expect(src).toMatch(new RegExp(`\\n    \\w+\\(Box<${name}>\\),`));
			expect(src.replace(/\npub enum TriviaTransport \{[^}]*\}/, '')).not.toMatch(new RegExp(`\\n    \\w+\\(${name}\\),`));
		}
	});

	it('asserts every payload against the ceiling, each one way', async () => {
		const src = await getRustTemplatesRs();
		const assertions = [...src.matchAll(/^const _: \(\) = assert!\(::core::mem::size_of::<(\w+)>\(\) (<=|>) (\d+), "/gm)];
		const over = assertions.filter((m) => m[2] === '>').map((m) => m[1]).sort();
		expect(over).toEqual([...BOXED_PAYLOADS.rust!].sort());
		expect(assertions.every((m) => Number(m[3]) === PAYLOAD_CEILING_BYTES)).toBe(true);
		expect(new Set(assertions.map((m) => m[1])).size).toBe(assertions.length);
	});

	it('refuses a pin no choice holds', () => {
		const [stale] = BOXED_PAYLOADS.rust!;
		expect(() => payloadCeilingAssertions(BOXED_PAYLOADS.rust!, new Set())).toThrow(`${stale} is pinned in boxed-payloads.ts but no choice holds it`);
	});
});
```

A pinned type may still be a struct field, whose shape is `pub name: T,`. The negative pattern matches only a variant's shape, `    Name(T),`, and leaves out `TriviaTransport`, which is outside the rule. The test's real-model helper emits through `grammarRenderInputs(grammar, { renderRules, visibleExternals, options })`, as `emit.ts` does.

In `native-transport-emit.test.ts`, a fixture emission given pins covers the boxing path on a toy model:

```ts
	it('boxes a pinned payload, asserts it over the ceiling, and refuses a pin no choice holds', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeMinimalNodeMap, MINIMAL_TOKENS);
		const templates = emittedTemplates({ call_expression: slot('callee') });
		const emitted = emitRenderModule('rust', templates, nodeMap, generatedIdTables, { boxedPayloads: ['CallExpressionTransport'] }).transportRs.contents;
		expect(emitted).toContain('    CallExpression(Box<CallExpressionTransport>),');
		expect(emitted).toMatch(new RegExp(`^const _: \\(\\) = assert!\\(::core::mem::size_of::<CallExpressionTransport>\\(\\) > ${PAYLOAD_CEILING_BYTES}, "`, 'm'));
		expect(() => emitRenderModule('rust', templates, nodeMap, generatedIdTables, { boxedPayloads: ['UnheldTransport'] })).toThrow(
			'UnheldTransport is pinned in boxed-payloads.ts but no choice holds it'
		);
	});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts -t "the payload ceiling"`
Expected: FAIL: `../boxed-payloads.ts` does not exist.

- [ ] **Step 3: The pins**

Run the census on the tree as Task 14 leaves it, with nothing boxed:

```bash
python3 docs/superpowers/probes/2026-10-01-shared-arena/stack/size-census.py --pins 512
```

It prints, per grammar, a line `   <grammar>: ['…', …],`: every payload type over 512 bytes of a choice the reader reads, boxed or not. Create `packages/codegen/src/emitters/boxed-payloads.ts` from those five lines:

```ts
export const PAYLOAD_CEILING_BYTES = 512;

export const BOXED_PAYLOADS: Readonly<Record<string, readonly string[]>> = {
	rust: [/* the census's rust line */],
	typescript: [/* its typescript line */],
	python: [/* its python line */],
	scm: [/* its scm line */],
	regex: [/* its regex line */]
};
```

The lists are measured, not chosen, so they come from the command. The census keeps them right in Step 6.

- [ ] **Step 4: The printers box what the pins name**

In `render-module.ts`:

- `RenderOptionsInputs` gains `readonly boxedPayloads?: readonly string[];`, and the real pipeline reads the table once:

```ts
export function grammarRenderInputs(grammar: GrammarName, inputs: RenderOptionsInputs): RenderOptionsInputs {
	return { ...inputs, boxedPayloads: BOXED_PAYLOADS[grammar] ?? [] };
}
```

  `emit.ts` builds the `RenderModuleEmitter` config through it; `RenderModuleEmitter` and `synthesizeRenderModuleBundle` pass `boxedPayloads` on, and `emitRenderModule` hands `inputs.boxedPayloads ?? []` to `renderTransportSupport`.
- `ReadPrint` gains `readonly choicePayloads: Set<string>;`, started empty, and `readonly boxedPayloads: readonly string[];`, from the inputs.
- `boxedInEnum` becomes the lookup:

```ts
function boxedInEnum(node: AssembledNode, boxedPayloads: readonly string[]): boolean {
	return boxedPayloads.includes(rustTransportStructName(node));
}
```

- A variant's payload type is written by one helper, which also records the payload for the assertions:

```ts
function choicePayloadType(node: AssembledNode, read: ReadPrint): string {
	const name = rustTransportStructName(node);
	read.choicePayloads.add(name);
	return boxedInEnum(node, read.boxedPayloads) ? `Box<${name}>` : name;
}
```

- `emitSupertypeTransportEnum`:
  - Its `isBoxed` becomes `(subNode: AssembledNode): boolean => boxedInEnum(subNode, read.boxedPayloads)`.
  - The variant line takes `choicePayloadType(subNode, read)` in place of `variantType`.
  - In the bridge to `AnyTransport`, a payload that is not a supertype passes as it is, `AnyTransport::${anyVariant}(inner)`, since `AnyTransport` boxes the same types. A boxed supertype payload is still unboxed to call its own bridge, `${subBridgeFn}(*inner)`.
- `emitSupertypeRenderHelper` takes `boxedPayloads: readonly string[]`, and its arm reads `boxedInEnum(subNode, boxedPayloads) ? 'inner.as_ref()' : 'inner'`. Its caller, `renderTypedDispatch`, takes the pins too, and `renderTransportSupport` passes `read.boxedPayloads`.
- `emitPerSlotChildEnum`: its `isBoxed` becomes `(variantNode: AssembledNode): boolean => boxedInEnum(variantNode, read.boxedPayloads)`. The variant line takes `choicePayloadType(node, read)`. Its render arm keeps `inner.as_ref()` for a boxed payload.
- `renderAnyTransport`: the variant line becomes `` `    ${variant}(${choicePayloadType(node, read)}),` ``. Its render and prepare arms call methods on the payload, which reach through a box unchanged.
- Add the assertions:

```ts
export function payloadCeilingAssertions(pinned: readonly string[], payloads: ReadonlySet<string>): string[] {
	const stale = pinned.find((name) => !payloads.has(name));
	if (stale !== undefined) throw new Error(`${stale} is pinned in boxed-payloads.ts but no choice holds it: unpin it`);
	const n = PAYLOAD_CEILING_BYTES;
	return [...payloads].sort().map((name) =>
		pinned.includes(name)
			? `const _: () = assert!(::core::mem::size_of::<${name}>() > ${n}, "${name} is within the ${n}-byte payload ceiling: unpin it in boxed-payloads.ts");`
			: `const _: () = assert!(::core::mem::size_of::<${name}>() <= ${n}, "${name} is over the ${n}-byte payload ceiling: pin it in boxed-payloads.ts");`
	);
}
```

  `renderTransportSupport` appends `'', ...payloadCeilingAssertions(read.boxedPayloads, read.choicePayloads)` to the lines it returns, after every choice has been printed. Each assertion is its own item, so one build reports every payload on the wrong side of the ceiling, not just the first.

- [ ] **Step 5: Run the tests**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts -t "the payload ceiling"`
Expected: PASS, 3 tests.

- [ ] **Step 6: Settle the pins**

Regenerate each grammar without building its native, `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src --no-build-native`, then run `rtk cargo check --workspace --no-default-features`.

- A failing assertion names its type and the edit: pin it, or unpin it.
- Make every edit the check lists, regenerate, and check again.
- The rounds end when the check passes. Then the census, `size-census.py --pins 512`, prints exactly the lists the file holds.
- More than five rounds means the premise above is false: stop and report the types that keep moving.

- [ ] **Step 7: Measure the stack**

Run: `rtk cargo test -p sittir-parity-tests --test typed_read_nesting the_typed_read_costs -- --nocapture`

Run it in both profiles (the second with `--release`). It prints the least stack at 1, 10, 40 and 200 levels for both readers, the bytes per level, and the least stack reading the deepest corpus entry. The gate, in both profiles, is the typed read at 200 levels and per level at most today's. Measure 512, 256 and 128 bytes, each with its lists from `size-census.py --pins <ceiling>` and Steps 6 and 7, and keep the largest that passes strictly. If none passes, stop and report each round's ceiling, pin counts and least stacks.

- [ ] **Step 8: The nesting test states the new guarantee**

In `typed_read_nesting.rs`:

- After the per-level assertion, the typed read at 200 levels must not exceed today's, in both profiles, and the deepest corpus entry's least stack is printed for both readers. That entry is saved as a probe input (`stack/inputs/rust-deepest.txt`, written by `corpus-depth.ts --write`), and a stack probe reads either nested parentheses or that input:

```rust
    let deepest = |reader: &str| least_stack_kib(reader, Probe::Input(DEEPEST));
    let (typed_deepest, today_deepest) = (deepest("typed"), deepest("today"));
    eprintln!("least stack KiB reading the deepest corpus entry: typed {typed_deepest}, today {today_deepest}");
    assert!(typed[3] <= today[3], "typed {} KiB at {} levels exceeds today's {} KiB", typed[3], levels[3], today[3]);
```

- Re-pin the macOS rows from Step 7's run and from a release run (`… --release -- --nocapture`), rounded up to the search's granularity (8 KiB for a root, the printed value for a level). A release value above its current row (1536 B per level, 96 KiB root) is a regression: stop and report it, and do not raise the row.
- The linux row is re-pinned from the CI log of the pushed branch, in a commit of its own.
- The test's doc comment states the measured guarantee. In both profiles, per level and at 200 levels, the typed read costs no more stack than today's. In release it reads at least as deep on 2 MiB. Its fixed root cost is higher than today's, so a shallow source needs more stack; that is printed, not gated. Both profiles' per-level and root figures are pinned as ceilings that only tighten.

Run: `rtk cargo test -p sittir-parity-tests --test typed_read_nesting` and the same with `--release`.
Expected: PASS.

- [ ] **Step 9: Glossary**

In `docs/glossary/emitters.md`:

- `boxedInEnum`: replace the entry's body, which says every choice variant is inline, with the rule. A choice payload is boxed when its transport type is pinned for the grammar. The pins hold the payload types over the ceiling, and the generated assertions keep them exact.
- `emitSupertypeTransportEnum`: its "SCC-driven Box rule" body gives way to the same rule. The bridge to `AnyTransport` passes a box through, since both choices box the same types.
- Add entries for `choicePayloadType`, `payloadCeilingAssertions`, `PAYLOAD_CEILING_BYTES` and `BOXED_PAYLOADS`, and the `choicePayloads` member in `ReadPrint`'s entry. The `BOXED_PAYLOADS` entry says the lists are measured with `size-census.py --pins`, that the build refuses a list that is wrong either way, and that the ceiling is the largest that keeps the typed read within today's at 200 levels and per level in both profiles.

- [ ] **Step 10: Gates and commit**

Run `pnpm run regen:all`, then the global gates, plus:

- `pnpm exec tsx packages/cli/src/cli.ts tool typed-read-parity --all-grammars`, all zeros. Its round trip covers every boxed payload: each decodes, reads and encodes through `Box`.
- `rtk cargo build --workspace`, whose generated assertions all hold.
- The census, run once more: each grammar's largest choice, recorded with the pin counts in the commit message.

Rendered bytes and validation rows are unchanged.

```bash
git add packages/codegen/src/emitters/boxed-payloads.ts
git commit -F msg -- packages/codegen/src rust/crates docs/glossary/emitters.md
```

Message: `perf(transport): box every choice payload over a byte ceiling, by pins the build checks`. The body gives the ceiling, the pin counts, the largest choice per grammar, and the least stacks before and after.

---

## Task 16: Measurements and the whole-branch gates

This task takes the spec's verification 12, 13 and 15 for 1b. Each is measured like for like: the same commands, inputs and populations at the branch's base (master as 1b was cut) and at its head, one script running unchanged at both.

- Render-neutrality (15) and type-check time (13) are gates within noise. A result outside noise stops the work for review (stop rule). Nothing is reverted to pass it.
- The build figures (12) are recorded, not asserted.

Timings run on copies outside every watched tree. A worktree's index watcher re-indexes while a build writes into it and takes half the cores, which spoils both sides of the comparison.

**Files:** none in the code. The figures go in the PR body.

- [ ] **Step 1: Two copies, natives built**

```bash
BASE=$(git merge-base HEAD master)
git worktree add --detach scratchpad/wt-1b-base "$BASE"
(cd scratchpad/wt-1b-base && pnpm install --frozen-lockfile && pnpm run regen:all)
M=<a directory outside every watched tree, such as the session scratchpad>/m1b
rsync -a --exclude target --exclude .infigraph scratchpad/wt-1b-base/ "$M/base/"
rsync -a --exclude target --exclude .infigraph ./ "$M/head/"
```

Run the second `rsync` from the head's checkout, after Task 15's `regen:all`, so both copies hold release natives. `git worktree remove scratchpad/wt-1b-base` once the copy is made.

Gate each timed run on instantaneous idle: at least 75 % idle in `top -l 2 -s 1 -n 0`, and no `infigraph ps` process indexing either copy. Record user plus system time beside wall time.

- [ ] **Step 2: Render-neutral (verification 15)**

```bash
T=docs/superpowers/probes/2026-10-01-shared-arena/transport
REBUILT=1 $T/layout-rounds.sh 6 "$M/out" base="$M/base" head="$M/head" && python3 $T/layout-report.py "$M/out"
```

Six rounds, the order rotating each round. Each round runs `measure-rebuilt.mts` at both copies, for rust, typescript and python: rebuilt renders over the parity render fixtures, per slot value, with the projection and the native call measured apart.

The gate: for each grammar, the head's median native-call cost per slot value lies within the base's range across its six rounds, and so does its projection. The native call is the one the codec changes. If either median falls outside, stop and report both copies' six rounds.

- [ ] **Step 3: Build (verification 12)**

For each grammar `<g>` and each profile, in each copy, with that copy's own target directory:

```bash
cd "$M/<side>/rust" && export CARGO_TARGET_DIR="$M/<side>-target"
cargo build -p sittir-<g> [--release]                        # warm: dependencies built
touch crates/sittir-<g>/src/render/transport.rs
/usr/bin/time -l cargo build -p sittir-<g> [--release]       # timed: the grammar crate alone
```

Repeat the timed build three times and record the medians:

- wall time, and user plus system time;
- peak memory (`maximum resident set size`);
- the release `.node` size, `stat -f %z packages/<g>/native/*.node`;
- the lines of `rust/crates/sittir-<g>/src/render/transport.rs`.

Also record `python3 $T/transport-census.py` for each `transport.rs`. Its share of lines in napi impls is zero at the head.

- [ ] **Step 4: Type-check time (verification 13)**

Time the base's `type-check` command at both copies, three runs each:

```bash
pnpm -r --no-bail run type-check && pnpm run type-check:cross-language && pnpm run type-check:tests && pnpm run type-check:examples
```

The gate: the head's median is within the base's range. Record `pnpm run type-check:native` at the head on its own. At the base it fails with 2,732 errors, which is why it was not chained until Task 13.

- [ ] **Step 5: The whole-branch gates**

The global gates, plus:

- `pnpm exec tsx packages/cli/src/cli.ts tool typed-read-parity --all-grammars`: every summary's `refused`, `differs`, `roundTrip`, `todayFailed` and `staleListed` are 0;
- `pnpm run type-check`, now holding `type-check:native`, and `native-typings.test.ts`;
- `rtk cargo build --workspace`, whose payload assertions all hold, and `rtk cargo clippy --workspace --no-default-features -- -D warnings`;
- `rtk cargo test -p sittir-parity-tests --test typed_read_nesting`, in both profiles;
- the `built-render-parse` rows, which render factory-built nodes through the derive's decoder, unchanged with the rest of the validation rows;
- rendered bytes unchanged from the base.

- [ ] **Step 6: The PR**

Open 1b's PR. Its body starts with `Owner: <the session opening it>`, and it lists:

- each grammar's parity summary, every count zero;
- each encoder fix Task 14 made, with its cause;
- the payload ceiling, each grammar's pin count and largest choice, and the least stacks before and after (dev and release on macOS arm64; linux x86_64 from CI);
- the tables of Steps 2–4, base and head side by side.

File an issue for each follow-up the work leaves, and link it from the body. Ask brainstorm for the whole-branch review. The linux row of the nesting test is re-pinned from the PR's CI log, in a commit of its own.

---

## 1c-i: one reader

Detailed against master `a3626c9dc`, which holds 1b (#693). Every read goes through the typed reader, and the wrap attaches members only. "Two readers must not outlive step 1": 1c-i switches every consumer and removes today's reader in one PR. Identity (the index registry, the edited-index set, the fold by range) and the single form of an empty list follow in 1c-ii, outlined below.

The design is the shared-arena spec's step 1 and `docs/superpowers/specs/2026-10-06-relative-coordinates-design.md` (§ Coordinates, § The index). Where they meet the code 1b left:

### Rulings (1c-i)

The maintainer's, 2026-10-06, unless marked as design's.

1. **Two PRs.** 1c-i is one reader (Tasks 17, 18, 20, 22); 1c-ii is identity and the empty list (Tasks 19, 21, 23). 1c-i keeps master's identity mechanisms: accessors write the child they hydrate back into the parent's slot, `adoptChild` and `detachAncestors` invalidate ancestors, and the fold walk stays. A `$trivia` write on a node reached through a query is still refused.
2. **A coordinate's position is the tree's descendant index**, named `index`. A handle packs the tree id and that index (`encode_handle`), for both readers, from Task 17 on. Task 22 gives the coordinate its final fields.
3. **A read transport's own coordinate is `TransportLayout::at`**, crossing as `$_layout.at`, beside `gap` and `flank`. The reader writes it for every transport it reads; a built node has none. JavaScript folds an untouched parsed node to it and drops it from an edited node's data; the native decoder takes it and renders nothing from it.
4. **Today's reader computes indexes as it reads** (design). A child's index is its parent's, plus one, plus the descendant counts of the children before it (`Node::descendant_count`, constant time), so today's reader hands out index handles at no walk, and the node table goes in Task 17. The rule is held to tree-sitter by `descendant_index.rs` (Task 17, Step 1), the relative-coordinates plan's Task 2.
5. **One native read call.** `read(treeId, index, depth)` reads the node at `index` of a live tree into its transport; the root is index 0. `parse(source)` parses and returns the tree's id, its format and its error regions, and reads nothing.
6. **ABI 20.**

### File structure (1c-i)

Create:

| File | Responsibility |
| --- | --- |
| `rust/crates/sittir-parity-tests/tests/descendant_index.rs` | the offset and child-index rules, held to tree-sitter |
| `packages/common/src/read.ts` | the typed read's JavaScript side: `readNode(tree, index, depth)`, coordinates and hydration |

Modify:

| File | Change |
| --- | --- |
| `rust/crates/sittir-core/src/engine.rs` | no node table: handles name descendant indexes; `node_at_index`, `child_index_of`; `ParsedTree::read` |
| `rust/crates/sittir-core/src/read_untyped_node.rs` | `HandleMint::mint` takes the child's index; `read_slots` counts it (Task 17); the file goes (Task 22) |
| `rust/crates/sittir-core/src/read.rs` | `ReadCtx::coordinate` names `index`; `Placement::into_layout` and `Sides::into_layout` write `at` |
| `rust/crates/sittir-core/src/layout.rs` | `TransportLayout::at` and its codec |
| `rust/crates/sittir-core/src/slot.rs` | `NodeCoordinate`'s final fields (Task 22) |
| `rust/crates/sittir-core/src/napi_engine.rs` | `parse`, `read`; the JSON reads and the transitional methods go |
| `rust/crates/sittir-transport-macros/src/expand.rs` | the layout init passes the node's coordinate |
| `packages/codegen/src/emitters/native-crate.ts` | `napi_engine!` takes `AnyTransport`; ABI 20 |
| `packages/codegen/src/emitters/wrap.ts` | the wrap attaches members only |
| `packages/common/src/engine.ts`, `create-engine.ts`, `transport-data.ts`, `utils.ts` | the parse and hydration paths read through `read`; the fold reads `$_layout.at` |
| `packages/types/src/engine-api.ts`, `core-types.ts` | `ParseOptions.depth`; the wire coordinate |
| `packages/tools/src/validate/*` | validators read through the typed read |

### Global Constraints (1c-i)

1a's and 1b's hold, and:

- No rendered byte and no validation row moves, in any task.
- Each task ends with the gates green; no task leaves two coordinate forms in the tree.
- `$_layout` in this section is always the wire key of a transport's `TransportLayout`, never the grammar's `_layout` supertype (`LAYOUT_SUPERTYPE`).
- `index` is the only name for the descendant index in new code, docs and glossary entries. 1a's `row` names are renamed where a task touches them and are gone by Task 22.

### Review Focus (1c-i)

1. **A node whose children include hidden rules.** `node.child(i)` returns visible children only, and `descendant_count` counts visible descendants, so the child-index rule must hold through hidden wrappers. Test: Task 17 (`descendant_index.rs` checks `child_index_of` against the root cursor for every child of every node).
2. **A handle from a released tree, or past a tree's last node.** Both are refused naming the handle, never answered from another tree or clamped. Test: Task 17 (`a_handle_past_the_last_node_is_refused`; a released tree is refused by `tree_not_live`, as today).
3. **A query started at a node deep in the tree.** Its stubs' parents are indexes from the root, not from the start. Test: Task 17 (`a_walk_from_a_deep_start_hands_out_root_indexes`).
4. **A parsed node edited in place, then rendered.** It crosses as data, never as its `at`. Test: Task 20 (a `$trivia` write on a read node renders the new comment).
5. **A text leaf inside a choice, read within the depth.** It keeps `$type` Identifier, crosses plain (no members; a builder admits it by its tree token), and folds to its `at`. Test: Task 20 (an identifier as an expression is the plain identifier transport, and its parent renders its bytes).

---

## Task 17: Handles name descendant indexes

Today's reader and the typed reader stop disagreeing about what a handle's index means: in both it is the node's descendant index. The node table, `NodeCoord`, `TreeMint`'s table and `resolve_handle` go; a handle resolves by `goto_descendant`. JavaScript is unchanged: handles stay opaque numbers to it.

**Files:**
- Create: `rust/crates/sittir-parity-tests/tests/descendant_index.rs`
- Modify: `rust/crates/sittir-core/src/engine.rs` (`NodeCoord`, `TreeMint`, `ParsedTree`, `push_coord`, `resolve_handle`, `read_root`, `node_at`, `index_of`, `mint`, `descendants`, `advance`, `mint_frame`, `read_at`, `line_gaps_at`, the `SourceTable` impl's `kind_of` and `for_each_kind_ending_with`)
- Modify: `rust/crates/sittir-core/src/read_untyped_node.rs` (`HandleMint`, `NoMint`, `read_slots`)
- Modify: `rust/crates/sittir-core/src/read.rs` (`Child::row` → `Child::index`, `row_of` → `index_of`, `read_at`'s `row` parameter → `index`; doc comments)

**Interfaces:**
- Produces: `sittir_core::engine::node_at_index(tree: &tree_sitter::Tree, index: u32) -> Option<tree_sitter::Node<'_>>`; `sittir_core::engine::child_index_of(node: tree_sitter::Node<'_>, index: u32, position: u32) -> u32`; `HandleMint::mint(&mut self, parent: u64, index: u32) -> Option<u64>`.

- [ ] **Step 1: The tree-sitter rules, held**

Create `rust/crates/sittir-parity-tests/tests/descendant_index.rs` as the relative-coordinates plan's Task 2 writes it (`docs/superpowers/plans/2026-10-06-relative-coordinates.md`), and add a second check to its `check` function, after the inner loop:

```rust
        let mut at = index + 1;
        for position in 0..node.child_count() as u32 {
            let child = node.child(position).unwrap();
            let (expected, _) = nodes.iter().find(|(_, n)| *n == child).unwrap();
            assert_eq!(at, *expected, "child {position} of {index}");
            at += child.descendant_count();
        }
```

Run: `rtk cargo test -p sittir-parity-tests --test descendant_index`
Expected: 3 passed. A failure is a finding: stop and report it, since every handle in this task rests on it.

- [ ] **Step 2: Failing tests in `engine.rs`**

In `engine.rs`'s `mod tests`, beside `parsed`, `kind_id` and `walk`:

```rust
    /// The descendant index of every node of `tree`, by its id.
    fn indexes(tree: &tree_sitter::Tree) -> std::collections::HashMap<usize, u32> {
        let mut out = std::collections::HashMap::new();
        let mut cursor = tree.walk();
        loop {
            out.insert(cursor.node().id(), cursor.descendant_index() as u32);
            if cursor.goto_first_child() {
                continue;
            }
            loop {
                if cursor.goto_next_sibling() {
                    break;
                }
                if !cursor.goto_parent() {
                    return out;
                }
            }
        }
    }

    #[test]
    fn a_stub_hydrates_with_its_own_descendant_index() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        for stub in walk(&tree, root, &[], None, u32::MAX) {
            let Some(crate::types::NodeHandle::Parent(parent)) = stub.handle else { panic!("a stub names its parent") };
            let parent_node = node_at_index(&tree.tree, decode_handle(parent).1).expect("the parent names a node");
            assert_eq!(Some(&decode_handle(parent).1), expected.get(&parent_node.id()));
            let json = tree.read_at(parent, stub.child_index.expect("a stub names its index"), ReadDepth::SHALLOW).expect("hydrate");
            let read: serde_json::Value = serde_json::from_str(&json).expect("read json");
            let own = read["$handle"].as_u64().expect("a hydrated node has its own handle");
            let node = node_at_index(&tree.tree, decode_handle(own).1).expect("the handle names a node");
            assert_eq!(read["$span"]["start"], serde_json::json!(node.start_byte()));
            assert_eq!(Some(&decode_handle(own).1), expected.get(&node.id()));
        }
    }

    #[test]
    fn a_handle_past_the_last_node_is_refused() {
        let (tree, _) = parsed(FNS);
        let past = encode_handle(1, tree.tree.root_node().descendant_count() as u32);
        assert!(tree.read_at(past, 0, ReadDepth::SHALLOW).unwrap_err().contains("names no node"));
    }

    #[test]
    fn a_walk_from_a_deep_start_hands_out_root_indexes() {
        let (tree, root) = parsed(FNS);
        let expected = indexes(&tree.tree);
        let module = tree.descendants(Address::Own { handle: root }, &[kind_id("mod_item")], None, None, 1, None).expect("walk");
        let Some(crate::types::NodeHandle::Parent(parent)) = module.stubs[0].handle else { panic!("a stub names its parent") };
        let start = Address::Child { parent, index: u32::from(module.stubs[0].child_index.expect("a stub names its index")) };
        let inner = tree.descendants(start, &[kind_id("function_item")], None, None, 16, None).expect("walk");
        assert_eq!(inner.stubs.len(), 2, "fn b and fn _c");
        for stub in &inner.stubs {
            let Some(crate::types::NodeHandle::Parent(parent)) = stub.handle else { panic!("a stub names its parent") };
            let node = node_at_index(&tree.tree, decode_handle(parent).1).expect("the parent names a node");
            assert_eq!(Some(&decode_handle(parent).1), expected.get(&node.id()));
            let child = node.child(u32::from(stub.child_index.expect("a stub names its index"))).expect("the stub's child");
            assert_eq!(Some(child.start_byte() as u32), stub.span.map(|span| span.start));
        }
    }
```

`walk` takes `&ParsedTree` once Step 3 makes `descendants` take `&self`; change its signature and its callers in the module.

Run: `rtk cargo test -p sittir-core --no-default-features engine::tests`
Expected: compile errors (`node_at_index` not found).

- [ ] **Step 3: Resolution by index**

In `engine.rs`, delete `NodeCoord` and its impl, the `nodes` field and its doc, `push_coord`, `resolve_handle`, `mint` and `mint_frame`. Replace the `ParsedTree` doc's `# Design` paragraph with one sentence: a handle names a node by its tree's id and its descendant index, and resolves through a cursor (`node_at_index`). Add:

```rust
/// The node at descendant `index` of `tree`, or `None` past its last node.
pub fn node_at_index(tree: &tree_sitter::Tree, index: u32) -> Option<tree_sitter::Node<'_>> {
    if index as usize >= tree.root_node().descendant_count() {
        return None;
    }
    let mut cursor = tree.walk();
    cursor.goto_descendant(index as usize);
    Some(cursor.node())
}

/// The descendant index of child `position` of the node at `index`: its own
/// index, one for the node, and every earlier child's descendant count.
pub fn child_index_of(node: tree_sitter::Node<'_>, index: u32, position: u32) -> u32 {
    (0..position).fold(index + 1, |at, i| at + node.child(i).map_or(0, |child| child.descendant_count() as u32))
}
```

`TreeMint` keeps only the tree id:

```rust
/// Mints the handle a bounded read gives a child it expands: the child's
/// descendant index in this tree. A parent from another tree mints nothing.
struct TreeMint {
    tree_id: u32,
}

impl HandleMint for TreeMint {
    fn mint(&mut self, parent: u64, index: u32) -> Option<u64> {
        (decode_handle(parent).0 == self.tree_id).then(|| encode_handle(self.tree_id, index))
    }
}
```

In `read_untyped_node.rs`, `HandleMint::mint(&mut self, parent: u64, child_index: u16)` becomes `mint(&mut self, parent: u64, index: u32)`, with the doc saying `index` is the child's descendant index; `NoMint` follows. In `read_slots`, count each child's index beside the loop, before any `continue`:

```rust
    let mut next_index = node_handle.map(|handle| crate::engine::decode_handle(handle).1 + 1);
    let child_count = node.child_count() as u32;
    for i in 0..child_count {
        let child = match node.child(i) {
            Some(c) => c,
            None => continue,
        };
        let child_index = next_index;
        next_index = next_index.map(|at| at + child.descendant_count() as u32);
        if is_trivia(&child) {
            continue;
        }
```

and the mint call becomes `node_handle.zip(child_index).and_then(|(parent, index)| mint.mint(parent, index))`.

In `ParsedTree`:
- `read_root` mints no table entry: its handle is `encode_handle(self.tree_id, 0)`, and its mint is `TreeMint { tree_id: self.tree_id }`. It takes `&self`.
- `node_at`: `Address::Own { handle }` is `node_at_index(&self.tree, self.local_index(handle)?)`; `Address::Child { parent, index }` is `node_at_index(&self.tree, self.local_index(parent)?).and_then(|node| node.child(index))`.
- `index_of` takes `&self` and returns the index of the node `address` names: `Own` is `local_index`; `Child` resolves the parent, checks the child exists, and is `child_index_of(parent_node, parent_index, index)`; `Span` collects the child positions from the node up to the root, as today, then folds down from index 0 with `child_index_of`, descending one child at a time.
- `read_at(&self, handle, child_index, depth)`: resolve the parent with `node_at_index`, refusing `"handle {handle} names no node of tree {tree_id}"`; take the child as today; its handle is `encode_handle(self.tree_id, child_index_of(parent_node, index, child_index as u32))`; read it with `TreeMint { tree_id: self.tree_id }`.
- `line_gaps_at` and the `SourceTable` impl's `kind_of` and `for_each_kind_ending_with` resolve with `node_at_index(&tree.tree, index)`.
- `descendants`: `frames: Vec<Option<u32>>` becomes `indexes: Vec<u32>`, the index of the node at each depth below the start, `indexes[0]` the start's own. The cursor numbers from the start, so each entry is the start's index plus `cursor.descendant_index()`, recorded wherever `advance` and the resume loop move the cursor. A stub's parent is `encode_handle(self.tree_id, indexes[depth - 1])`. `advance` takes the start's index in place of `frames`.

`ParsedTree::read_root`, `read_at`, `index_of` and `descendants` no longer mutate; where a caller in `napi_engine.rs` borrowed `trees` mutably only for them, it borrows immutably.

- [ ] **Step 4: The typed reader's names**

In `read.rs`: `Child::row` → `Child::index`; `row_of` → `index_of`, documented as tree-sitter's descendant index from the tree's root; `read_at`'s `row` parameter → `index`; `ReadError`'s `row` fields → `index`; every doc comment that says "row" for a descendant index says "index". Update `rust/crates/sittir-parity-tests/tests/typed_read*.rs` and the derive's expansion (`expand.rs`) for the renamed items, and the glossary and plan text that names them.

- [ ] **Step 5: Run the tests**

Run: `rtk cargo test --workspace --no-default-features`
Expected: PASS, the three new tests included.

- [ ] **Step 6: Gates and commit**

The full gates. Rendered bytes and validation rows unchanged; typed-read parity, refusal and round trip report 0 on all five grammars: today's read and the typed read now hand out the same handle for a node.

Commit: `refactor(core): a handle names its node's descendant index, and the node table goes`.

---

## Task 18: The typed read crosses to JavaScript

The native side of the switch: `parse` and `read`, and every read transport carrying its own coordinate in `$_layout.at`. Nothing in JavaScript calls them yet beyond their tests.

**Files:**
- Modify: `rust/crates/sittir-core/src/layout.rs` (`TransportLayout::at`, its codec)
- Modify: `rust/crates/sittir-core/src/read.rs` (`ReadCtx::coordinate`, `Placement::into_layout`, `Sides::into_layout`)
- Modify: `rust/crates/sittir-transport-macros/src/expand.rs` (`common_inits`' layout init; `envelope_body`; slot arm guards; a struct's kind check; `from_kind_id`)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`fromKindIdImpl` goes)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`ParsedTree::read`)
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`parse`, `read`; the macro takes `$any:ty`)
- Modify: `packages/codegen/src/emitters/native-crate.ts` (`AnyTransport` passed to `napi_engine!`; `NATIVE_RENDER_TRANSPORT_ABI` 20)
- Modify: `packages/common/src/engine.ts` (`NativeEngineLike` declares `parse` and `read`)
- Test: `rust/crates/sittir-parity-tests/tests/typed_read_corpus.rs`; `packages/tools/src/validate/__tests__/typed-read-round-trip.test.ts`

**Interfaces:**
- Consumes: `node_at_index`, `index_of` (Task 17).
- Produces:
  - `TransportLayout<T> { pub at: Option<NodeCoordinate>, .. }`, encoded as `at` inside `$_layout`;
  - `ParsedTree::read<T: ReadTransport>(&self, index: u32, depth: Depth) -> Result<T, ReadError>`;
  - napi `parse(source: string): string`, the JSON `{ treeId, format, errors }`, retaining the tree;
  - napi `read(treeId: number, index: number, depth?: number): object`, the node's transport; a refusal throws `ReadError::describe`'s text.

- [ ] **Step 1: Failing tests**

In `typed_read_corpus.rs`:

```rust
#[test]
fn every_read_transport_names_its_own_node() {
    for name in ["engine.rs", "spacing.rs"] {
        let source = probe_input(name);
        let tree = parse(&source);
        let ctx = ReadCtx::new(&source, 1);
        let file = root(&tree, &source, Depth::ONE);
        let at = file.layout.as_ref().and_then(|layout| layout.at.as_ref()).expect("the root names itself");
        assert_eq!((at.tree_id(), at.index(), at.span.start, at.span.end), (1, 0, 0, source.len() as u32));
        let functions = file.statements.unwrap().into_iter().filter_map(|s| s.coord().cloned()).filter(|c| c.kind == Some(kind::FUNCTION_ITEM));
        for coord in functions {
            let read: FunctionItemTransport = read_at::<FunctionItemTransport, AnyTransport>(&mut tree.walk(), &ctx, coord.index(), Depth::ONE).unwrap();
            let at = read.layout.as_ref().and_then(|layout| layout.at.as_ref()).expect("a read function names itself");
            assert_eq!((at.tree_id(), at.index(), at.span, at.kind), (coord.tree_id(), coord.index(), coord.span, coord.kind), "{name}");
        }
    }
}
```

with `kind` and `FunctionItemTransport` imported from `sittir_rust::render`. `NodeCoordinate::index()` is added in Step 3 beside `tree_id()`.

In `typed-read-round-trip.test.ts`, add a case that reads a rust function one level deep through the native `read`, and checks `$_layout.at` is `{ $treeHandle, $span, $type }` with `$span` equal to the function's bytes.

Run: `rtk cargo test -p sittir-parity-tests --test typed_read_corpus` — expected: compile error (`at` not a field).

- [ ] **Step 2: `at` in the layout**

`layout.rs`:

```rust
pub struct TransportLayout<T> {
    pub trivia: Option<TransportTrivia<T>>,
    pub edges: Option<Edges>,
    pub gap: Option<SourceGap>,
    pub flank: Option<SourceFlank>,
    /// Where a read node came from: its own coordinate. The reader writes it
    /// for every transport it reads; a built node has none. Nothing renders
    /// from it: JavaScript crosses an untouched node as this coordinate, and an
    /// edited one without it.
    pub at: Option<NodeCoordinate>,
}
```

Its `FromNapiValue` reads `at` through `boundary::optional` as a coordinate object (`{ $treeHandle, $span, $type }`, decoded by the same function `SlotValue`'s decoder uses for a coordinate, factored out of it as `coordinate_from_napi`); its `ToNapiValue` writes it with `coordinate_to_napi`. Every literal `TransportLayout { .. }` in the workspace gains `at: None`, or `at` where Step 3 says.

- [ ] **Step 3: The reader writes `at`**

`slot.rs`: `NodeCoordinate::index(&self) -> u32`, `decode_handle(self.handle).1`, beside `tree_id`.

`read.rs`:
- `ReadCtx` gains `pub at: bool`, true from `ReadCtx::new`, and `ReadCtx::without_at(self) -> Self`, which clears it. The transitional parity, refusal and round-trip methods read with `without_at()`, so they still compare like with like against today's read, which has no `at`, until Task 22 removes them and the flag together.
- `ReadCtx::at_of(&self, cursor: &TreeCursor<'_>) -> Option<NodeCoordinate>`: the coordinate of the node the cursor is on (`self.coordinate(&cursor.node(), index_of(cursor))`) when `self.at`, else `None`.
- `Placement::into_layout(self, sides: Sides, at: Option<NodeCoordinate>) -> Option<TransportLayout<T>>` returns `None` only when it holds no entry and `at` is `None`; its layout's `at` is `at`.
- `Sides::into_layout(self, at: Option<NodeCoordinate>)` likewise.

`expand.rs`: `common_inits`' `Role::Layout` init becomes `placement.into_layout(sides, ctx.at_of(cursor))`, taken while the cursor is on the node, before its children are read; `envelope_body`'s `sides.into_layout()` passes the same. Update the derive's expansion tests for the new init text.

- [ ] **Step 4: `parse` and `read`**

`engine.rs`:

```rust
    /// The node at `index` read into `T`, `depth` levels down, with the sides
    /// its parent's placement gives it; index 0 is the root.
    pub fn read<T: crate::read::ReadTransport>(&self, index: u32, depth: crate::read::Depth) -> Result<T, crate::read::ReadError> {
        let ctx = crate::read::ReadCtx::new(&self.source, self.tree_id);
        crate::read::read_at::<T, T>(&mut self.tree.walk(), &ctx, index, depth)
    }
```

`read_at`'s second parameter is the parent's type; passing the grammar's any-transport for both reads any parent's routes.

`napi_engine.rs`: the macro gains `$any:ty` after `$render_root`. Add, beside `parse_and_read`:

```rust
            /// Parse `source` and keep its tree. As JSON `{ treeId, format,
            /// errors }`: the id `read` and `disposeTree` take, the format the
            /// parse detected, and its error regions.
            #[::napi_derive::napi]
            pub fn parse(&mut self, env: ::napi::Env, source: String) -> ::napi::Result<String> {
                let tree_id = self.claim_tree_id(&env)?;
                let parsed = self.engine.parse(source, tree_id).map_err(::napi::Error::from_reason)?;
                let json = ::serde_json::json!({
                    "treeId": tree_id,
                    "format": parsed.format(),
                    "errors": parsed.error_regions(),
                })
                .to_string();
                LIVE_TREES.with(|trees| trees.borrow_mut().insert(tree_id, parsed));
                self.last_tree_id = Some(tree_id);
                Ok(json)
            }

            /// The node at `index` of tree `treeId` read into its transport,
            /// `depth` levels down (one when absent, `Infinity` for all); index 0
            /// is the root. Refuses a tree that is not live, an index past its
            /// last node, and a node the model has no route for, naming the
            /// kind, the child and the index.
            #[::napi_derive::napi(ts_return_type = "object")]
            pub fn read(&self, tree_id: f64, index: f64, depth: Option<f64>) -> ::napi::Result<$any> {
                let tree_id = u32::try_from($crate::napi_engine::checked_index(tree_id, "treeId")?)
                    .map_err(|_| ::napi::Error::from_reason(format!("treeId {tree_id} names no tree")))?;
                let index = u32::try_from($crate::napi_engine::checked_index(index, "index")?)
                    .map_err(|_| ::napi::Error::from_reason(format!("index {index} names no node")))?;
                let depth = $crate::napi_engine::typed_depth_from_wire(depth)?;
                LIVE_TREES.with(|trees| {
                    let trees = trees.borrow();
                    let parsed = trees.get(&tree_id).ok_or_else(|| $crate::napi_engine::tree_not_live(tree_id))?;
                    if $crate::engine::node_at_index(parsed.tree(), index).is_none() {
                        return Err(::napi::Error::from_reason(format!("index {index} names no node of tree {tree_id}")));
                    }
                    let grammar = <$grammar as ::std::default::Default>::default();
                    ::std::panic::catch_unwind(::std::panic::AssertUnwindSafe(|| parsed.read::<$any>(index, depth)))
                        .map_err(|payload| ::napi::Error::from_reason($crate::panic_msg(payload, "read panicked")))?
                        .map_err(|refusal| ::napi::Error::from_reason(refusal.describe(&|kind| $crate::engine::EngineGrammar::kind_name(grammar, kind))))
                })
            }
```

`ParsedTree::tree(&self) -> &tree_sitter::Tree` is added if absent. `typed_depth_from_wire` maps absent to `Depth::ONE`, `Infinity` to `Depth::All` and a positive integer `n` to `Depth::Levels(n)`, refusing anything else with today's `depth_from_wire` message; it replaces `depth_from_wire` in Task 22.

`native-crate.ts` passes `AnyTransport` after `RenderRoot` and sets the ABI to 20. `NativeEngineLike` in `packages/common/src/engine.ts` declares `parse(source: string): string` and `read(treeId: number, index: number, depth?: number): object`, each with its JSDoc.

- [ ] **Step 5: The routing checks hydration needs**

`read` is the first caller of `read_at` outside tests, so the checks 1a deferred land here, each with a unit test in the derive's or `read.rs`'s tests:
- `read_at` refuses a parent type that does not admit the parent node's kind (`ReadError::Unadmitted` naming the parent's kind and index), instead of placing its sides by the wrong routes.
- Two slots of one struct on one field: the derive puts each slot's `takes` test in its arm's guard, so a child the first slot does not take is tried on the second before it is refused as unrouted.
- A struct's `read` refuses a node whose kind it does not admit (`ReadError::Unadmitted`), so a field-tagged child of an unexpected named kind is never read into the slot's struct, and a text leaf never reads another kind's text.
- `from_kind_id` for a choice whose variants are all unit or blank is expanded by the derive from the `#[kind(…)]` claims it already reads; `fromKindIdImpl` in `render-module.ts` stops printing it, keeping its "an arm no kind id can build" error as the derive's compile error.

- [ ] **Step 6: Regenerate, test, gate, commit**

`pnpm run regen:all`. The round trip (`typed-read-parity`'s `round-trip` outcome) still compares encode and decode, now with `at` on every layout. The full gates; rendered bytes and validation rows unchanged, since no consumer calls the new methods.

Commit: `feat(engine): parse and read cross the typed read, each transport naming its own node`.

---

## Task 20: Every read goes through the typed read, and the wrap attaches members

The switch. The engine parses with `parse`, reads the root with `read(treeId, 0, depth)` and hydrates a coordinate with `read(treeId, index, depth)`. A wrap function takes the transport object as it crossed and attaches its members; it projects nothing. The render side folds an untouched node to its `$_layout.at`. Today's reader is still compiled, and called by nothing but the transitional parity methods, which Task 22 removes with it.

**Files:**
- Create: `packages/common/src/read.ts`
- Modify: `packages/types/src/engine-api.ts` (`ParseOptions.depth`), `packages/types/src/core-types.ts` (`TransportCoordinate`)
- Modify: `packages/common/src/engine.ts` (`parseAndRead`, `readUntypedNode` → `readNode`), `packages/common/src/create-engine.ts`
- Modify: `packages/common/src/transport-data.ts` (`canFold`, `foldToCoordinate`, `markEdited`, `sourceGapOf`, `sourceFlankOf`, `HANDLE_KEYS`, `COORDINATE_KEYS`)
- Modify: `packages/common/src/utils.ts` (`hydrateSlot`, `hydrateSlots`, `storeExpanded` goes)
- Modify: `packages/codegen/src/emitters/wrap.ts` (`emitFieldCarryingWrap`, `emitSeparatedListWrap`, `emitFieldStorageLines`, `resolveSlotHydrateExprs`, `WrapEmitter.finalize`; `emitTransparentSupertypeWrap` goes)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`descendants` returns coordinates), `packages/common/src/query.ts`
- Delete: `packages/common/src/readUntypedNode.ts` (the JavaScript walker), with every tools lane that read through it
- Modify: `packages/tools/src/validate/common.ts` and each validator that reads through `readUntypedNode` or `walkNativeForKind`
- Modify: `docs/glossary/emitters.md`, `packages-common-src.md`, `packages-types-src.md`, `packages-tools-src-validate.md`
- Test: `packages/common/tests/read.test.ts` (new); `packages/{rust,typescript,python}/tests/parsed-surface.test-d.ts`

**Interfaces:**
- Consumes: napi `parse`, `read` (Task 18).
- Produces:
  - `ParseOptions.depth?: number` (default 1, `Infinity` for all), replacing `deep`;
  - `TransportCoordinate = { readonly $treeHandle: number; readonly $span: Span; readonly $type: number }`;
  - `readNode(tree: TreeHandle, coordinate: TransportCoordinate, depth?: number): object`, in `packages/common/src/read.ts`;
  - `isCoordinate(value: unknown): value is TransportCoordinate`;
  - `hydrate(value, tree, depth?)`, exported by each grammar's wrap module in place of `readNode` and `hydrateChild`: a coordinate read and wrapped, anything else as it is. The engine's `hooks.hydrate` calls it.

- [ ] **Step 1: The JavaScript read, tested**

`packages/common/src/read.ts`:

```ts
import type { TransportCoordinate, TreeHandle } from '@sittir/types';

const INDEX_RANGE = 2 ** 32;

/** The descendant index a handle packs: the inverse of the native `encode_handle`, which puts the tree id above 32 bits of index, inside a double's exact range. */
export function decodeIndex(handle: number): number {
	return handle % INDEX_RANGE;
}

/** The tree id a handle packs, as `decodeIndex` reads its index. */
export function decodeTree(handle: number): number {
	return Math.floor(handle / INDEX_RANGE);
}

/** Whether `value` is a coordinate: a node past the read's depth, named by its tree and index. A transport never carries `$treeHandle` itself; its own coordinate is nested in `$_layout.at`. */
export function isCoordinate(value: unknown): value is TransportCoordinate {
	return value !== null && typeof value === 'object' && '$treeHandle' in value && '$span' in value;
}

/** The node a coordinate names, read `depth` levels down (one when absent). */
export function readNode(tree: TreeHandle, coordinate: TransportCoordinate, depth?: number): object {
	return tree.read(decodeIndex(coordinate.$treeHandle), depth);
}
```

`TreeHandle.read` becomes `read(index: number, depth?: number): object`, calling the native `read(treeId, index, depth)`.

`packages/common/tests/read.test.ts` parses `fn f(a: u8) {}` with the rust engine at depth 1, checks the root's `_items` holds coordinates (`isCoordinate`), reads the first through `readNode`, and checks the result's `$_layout.at.$span` equals the coordinate's `$span` and its `$type` is `function_item`'s id.

- [ ] **Step 2: The engine parses and hydrates through `read`**

`engine.ts`'s `parseAndRead(source, parseOptions)` calls `engine.parse(source)`, keeps the tree token, claims and registers it exactly as it does today, then `engine.read(treeId, 0, depthOf(parseOptions))` for the root. `depthOf` reads `parseOptions.depth`, default 1; `deep: true` no longer exists, and every caller passing it passes `depth: Infinity`. The root's error regions stamp `$errors` as today. `readUntypedNode` is replaced by `TreeHandle.read`, and its callers in `@sittir/common` by `readNode`. The `roots` map keyed by depth stays.

- [ ] **Step 3: The fold reads `at`**

In `transport-data.ts`:
- `foldToCoordinate(record)` returns `record.$_layout.at`, with the format stamp it carries today;
- `canFold(record, trivia)` requires `record.$_layout?.at`, no trivia outside it, and today's proof (`holdsParse(record) || isUntouchedBelow(record)`), where `isUntouchedBelow` tests `$_layout.at` in place of `$span`;
- `markEdited(data)` drops `$_layout.at` (copying the layout without it) in place of the coordinate keys, and `COORDINATE_KEYS` and `HANDLE_KEYS` go;
- `sourceGapOf` and `sourceFlankOf` read an item's span and tree from its `$_layout.at` (or from the item itself when it is a coordinate);
- `toTransportValue` crosses a coordinate as it is.

The fold's tests in `packages/common/tests/transport-data.test.ts` build their parsed fixtures with `$_layout.at` in place of `$treeHandle` and `$span`.

- [ ] **Step 4: The wrap attaches members only**

`emitters/wrap.ts`. A wrap function's body becomes:

```ts
export function wrapFunctionItem(data: T.FunctionItem, tree: TreeHandle): T.FunctionItem.Parsed {
	const handle = currentHandle();
	const node = {
		...data,
		$type: TSKindId.FunctionItem as const,
		// the members, written in the literal as today: each accessor, `$with`, `$trivia`, `$render`, `$query`, `$engine`
	};
	return node as T.FunctionItem.Parsed;
}
```

- `emitFieldStorageLines` emits no storage line: the slots come in `data` as the reader stored them, under their `_slot` keys.
- Each accessor reads its slot through `hydrateSlot(node, '_slot', tree)` (one value) or `hydrateSlots(node, '_slot', tree)` (a list). In `utils.ts` both hydrate a coordinate through `readNode`, wrap it, write it back into the slot and `adoptChild` it, as today's do with a stub; a value that is not a coordinate (a transport read within the depth, a kind id, a boolean, text) is wrapped on first access when it is a transport object, and returned as it is otherwise. `storeExpanded` goes: a child read within the depth gets its members when an accessor first reaches it (ruling 11).
- `$trivia`'s getters read `data.$_layout?.trivia`, and its entries hydrate like slot values.
- Removed from every wrap, with their helpers and tables in `@sittir/common` and the emitter: `modelSlots`; `normalizeSingularWrapSlot`, `normalizeRepeatedWrapSlot` and the other `normalize…` helpers; `coerceBooleanKeywordStorage`, `coerceBitflagStorage` and the other `coerce…` helpers; `projectKindEnumStorage`, `projectMixedEnumStorage` and `kindEnumTextIdPairs`; `readTerminalFromOther`; `_aliasEnvelope`, `_ALIAS_ENVELOPES`, `_HIDDEN_KINDS`; the `_spelled…` helpers and `_isReadTextLeaf`; `_projectLexed`, `projectInterior`, `TOKEN_INTERIORS`; `_wrapTrivia`, `mapTriviaEntries`; `dropWireDelimiters`; `_hasSeparatorFlank`, `_separatorKindOf`; `hydrateSelf`, `hydrateChild`, `hydrateChildren`; the `_ROUTES_<Kind>` tables and `_LIST_OWNER_KINDS`; `_filterWrapChildrenByKind`, `_firstKindKeyedWrapChild`, `SUPERTYPE_MEMBERS`.
- `wrapNode` dispatches on `data.$type` as today, and returns data with no table row as it is. A read text leaf crosses as `{ $type, $_layout, $text }` and stays plain: no wrap, no members; a builder admits it by its tree token. A unit variant stays the kind id the accessor returns.
- Supertype wraps and their table rows go, with `emitTransparentSupertypeWrap`. The typed read never stamps a supertype id: it stamps the member, and a polymorph its variant. Reading every corpus document at depth `Infinity` in rust, typescript and python found 0 supertype stamps in about 5,500 documents.

Write each removal's glossary entry out of its glossary in the same commit, and give the changed emitter functions their new entries.

- [ ] **Step 5: The validators read through the typed read**

In `packages/tools/src/validate/common.ts`, `buildReadHandle`'s native path, `walkNativeForKind`, `findNativeNodeId`, `readUntypedNodeAt` and `hydrateChildOf` read through `TreeHandle.read` and `readNode`; a match is named by its coordinate (`$treeHandle`, `$span`) in place of a parent handle and child index. Each validator that walked `UntypedNode` fields walks the transport's `_slot` keys.

- [ ] **Step 6: The queries return coordinates**

`ParsedTree::descendants` returns, for each match, the coordinate `ReadCtx::coordinate` gives it from the walk's index, and `DescendantBatch.stubs` becomes `coordinates`. The query facet in `@sittir/common` hydrates each through `readNode`. A JavaScript node's query and line-gap address is `{ handle: at.$treeHandle }`. `Address::Span` stays in Rust, unsent, until Task 22. Test in `packages/rust/tests/deep-query.test.ts`: a query from a deep node hydrates its matches, each rendering byte-identical to the node its accessor reaches, and no `$parentHandle`/`$childIndex` stub reaches JavaScript.

- [ ] **Step 7: No trivia on a node whose read keeps none**

An enum kind whose grammar id is none of its member ids (typescript `predefined_type`) is given trivia by the placement rule and its read drops it; today's read lost it too, so parity never saw it, and with the typed read the only read it is a real loss. The placement rule and the read model agree instead: a node its transport stores as a unit variant or an enum member is never an owner, so an extra beside it goes by the rule's next case (the owner after it, the owner before it, or the parent's gap). Test in `packages/typescript/tests/`: `let x: number /* c */ = 1;` read and rendered from its data keeps `/* c */`.

- [ ] **Step 8: Review Focus tests**

In `packages/rust/tests/` (a new `typed-read-switch.test.ts`):
- a `$trivia` write on a read `function_item` renders the new comment, the written node crosses as data, and the untouched sibling's tokens render in order (Review Focus 4). The sibling's source spacing is not asserted: an untouched node that carries outside trivia does not fold yet, and making it fold is follow-up work;
- `let x = a;` read at depth 1: `value()` of the `let_declaration` is the identifier transport (`$type` Identifier, `$text`, `$_layout.at`, a tree token, no members), and the `let_declaration`'s `$render()` is `let x = a;` (Review Focus 5).

- [ ] **Step 9: Regenerate and gate**

`pnpm run regen:all`, then the full gates. Rendered bytes and validation rows unchanged. Report the type-check time against master, as the global constraints ask for the wrap's size.

Commit: `feat(engine): every read goes through the typed read, and the wrap attaches members`.

---

## Task 22: Today's reader goes, and the coordinate takes its final form

**Files:**
- Delete: `rust/crates/sittir-core/src/read_untyped_node.rs`; `packages/tools/src/validate/typed-read-parity.ts` and `packages/cli/src/commands/tool/typed-read-parity.ts` with their tests
- Modify: `rust/crates/sittir-core/src/types.rs` (`UntypedNode`, `FieldValue`, `NodeHandle` and their serde go)
- Modify: `rust/crates/sittir-core/src/engine.rs` (`read_root`, `read_at`, `TreeMint`, `Address::Span`)
- Modify: `rust/crates/sittir-core/src/napi_engine.rs` (`parse_and_read`, `read_root`, `read_untyped_node`, `typed_read_refusal`, `typed_read_parity`, `typed_read_round_trip`, `with_typed_read`, `parity_report`, `round_trip_report`, `depth_from_wire` go)
- Modify: `rust/crates/sittir-core/src/slot.rs` (`NodeCoordinate`: `tree: u32`, `index: u32`; `text_only` goes)
- Modify: `packages/codegen/src/emitters/kind-id-rust.ts` (`stores_scalar`, `inner_gap_key`, the `ReadModel` impl go)
- Modify: `packages/types/src/engine-api.ts`, `packages/common/src/engine.ts`, `create-engine.ts` (the transitional diagnostics go)

- [ ] **Step 1: Delete today's reader**

Delete `read_untyped_node.rs` and its `pub mod`, `UntypedNode`, `FieldValue`, `NodeHandle`, `ReadDepth`, `HandleMint`, `NoMint`, `ReadModel` and the `ReadModel` impls `kind-id-rust.ts` prints, with `stores_scalar` and `inner_gap_key`. Task 3's placement driver goes. `EngineGrammar` drops its `ReadModel` bound. `error_regions`, `line_gaps`, `node_at_span` and `last_list_child`, which the render side and `parse` still call, move to `engine.rs` unchanged.

- [ ] **Step 2: `Address::Span` goes**

The queries already return coordinates (Task 20). `Address` keeps `Own { handle }` and `Child { parent, index }`; `Span` goes, since every node a read hands out names its index.

- [ ] **Step 3: The coordinate's final fields**

`NodeCoordinate { tree: u32, index: u32, span: Span, kind: Option<KindId>, edges: Option<CoordinateEdges>, gap: Option<SourceGap> }`; `text_only` goes, since every coordinate now names a node. On the wire it stays `{ $treeHandle, $span, $type }`, with `$treeHandle` packing the two (`encode_handle`) as today: 1c-ii's registry splits it with `decodeIndex` and `decodeTree`. `SourceGap::Range` and `FlankSource::Tree` carry the tree id.

Then check whether `SourceFlank`'s `ToNapiValue` and the coordinate encoder's gap entry (`$_layout: { gap }`) run on any native→JS path, or exist only to satisfy a trait bound: a flank and a coordinate's gap belong to the prepare walk, and no corpus read writes either. Delete whichever no path calls; if a bound forces one to exist, name the bound in the commit.

- [ ] **Step 4: The transitional methods go**

Remove `typed_read_refusal`, `typed_read_parity`, `typed_read_round_trip` and their reports from `napi_engine.rs`; `typedReadRefusal`, `typedReadParity` and `typedReadRoundTrip` from `EngineDiagnostics`, `NativeLanguageEngine` and `NativeEngineLike`; the `typed-read-parity` tool and validator, and its row in `validate:native`. Its envelope-pin counts go with it: `assertEnvelopeExtrasPinned` in codegen is what enforces that ceiling. The round trip's encode and decode keep their coverage through every validator that reads a corpus file and renders it.

- [ ] **Step 5: Gates, the PR**

The full gates, then:
- `validate:native` rows unchanged against master as 1c-i started;
- verifications 3–8 of the arena spec as the 1c outline listed them, but identity (6), which is 1c-ii's;
- the heap of an untouched whole-tree read (`measure-heap.mts`), against master, like for like;
- `rust/crates/sittir-core/src/` holds no `UntypedNode`, `HandleMint`, `ReadModel` or `row` naming a descendant index.

Open the PR with `Owner: sittir-engine-api` first in its body, the follow-up issues linked, and ask brainstorm for the whole-branch review.

---

## 1c-ii: identity and the empty list

Detailed against master `12644d5df`, which holds 1c-i. A parsed node has one wrapper per surface, whichever route reaches it; a write marks its index edited, on the inside or the outside of its span, and nothing else; a node folds to its bytes when no edit lies inside its range, and its outside trivia renders around the folded bytes; a built node's accessor hydrates the coordinate it stores through the same registry; and an empty list is `[]` everywhere. The design is `docs/superpowers/specs/2026-10-06-relative-coordinates-design.md` (§ Identity: the index registry, § Edits and folding, § Verification 1–6), with the shared-arena spec's ruling 6.

Execution order: **Task 19 → Task 25 → Task 24 → Task 21 → Task 23.** Task 25 is the outline's Task 19 second half (the edited set and the fold by range), split out because a reviewer can reject it while approving the registry.

### Rulings (1c-ii)

Brainstorm's, 2026-10-09, unless marked otherwise.

1. **No hydration without identity.** Task 19 (the registry) lands before Task 24 (built-node hydration), so a built holder never mints a second wrapper for a node a parsed holder already wrapped.
2. **Unit variants are out of the registry.** A coordinate whose read is a kind id (a unit variant: python `pass_statement`, a fixed-text leaf), and a match stored as a scalar (a kind id or an enum member id), are plain data: nothing is wrapped, so nothing is registered. Two reads of one are `===` because numbers are.
3. **`canFold` is `foldedCoordinate`** (renamed in 1c-i). Task 25 rewrites its body; the name stays.
4. **The empty list (maintainer, 2026-10-06).** An empty list slot is `[]`, never absent, for `repeat` and `optional(repeat1)` alike: reads, factories, fixtures and TS types (no `?` on a list storage key). The transport field is `Vec<T>`; an absent key is refused by the codec; a `repeat1` slot's empty read is refused as today (its type is `NonEmptyVec<T>`, Ruling 11, in place of the `#[slot(min = 1)]` attribute first proposed). A hole in an elided list (`[a, , b]`) stays an `undefined` item: a position, not the slot.
5. **One surface per tree handle (design).** The spec keys the registry per tree and per surface. Today a `TreeHandle` object is bound to exactly one `EngineHandle` (`bindTree`, once per parse), so the registry is keyed by the `TreeHandle` object. Attach, when the binding generator lands it, binds the attached surface through its own `TreeHandle` view, and with it its own registry; no second key layer is built before then.
6. **The registry's seat is `hydrateWith` (design).** Every generated accessor (`hydrateSlot`, `hydrateSlots`, `hydrate`), the parse root and the query hydrate through it, so one function looks up and registers. The query's own `hooks.wrap(readNode(…))` path goes.
7. **`end` crosses as `$end` on the object wire (design).** The reader fills `NodeCoordinate::end` (`index + descendant_count()`); the coordinate encoder writes `$end` and the decoder reads it. The record step retires the object codec (shared-arena spec, ruling 6.3) and its record carries `end` from the same field; only the encoder and decoder lines are temporary.
8. **A built holder resolves a stored coordinate's tree by its token** (Q1, ruled (a)). The builder accessor applies render's guard (`assertHoldsTree`); no id table is added.
9. **The registry key is the index and a role, `node` or `aliasContent`** (Q2, ruled (i)). The role never depends on registry state. A content takes `aliasContent` only when it shares its envelope's index, decided in one common helper by comparing the two values' stamped `at`; a content that is its own parser node registers as `node` from every route; the query passes no role (it yields each parser node once, as its envelope at a shared index).
10. **`markEditedNode` is the only hook for an in-place write.** The trivia writer marks through it, and any future in-place verb (the node-query `$edit` verbs) marks through it too, so the fold stays correct when they land. Each call names the side it edits (Ruling 12). `$with` mints a draft and marks nothing.
11. **A `repeat1` list is `NonEmptyVec<T>` in Rust (design, on brainstorm's question).** The type states the fact TS states with `NonEmptyArray`: no `min` attribute, no `finish` parameter the other impls ignore, and the decoder refuses an empty one.
12. **A write to a node's outside trivia edits what surrounds its span, not the span** (brainstorm, 2026-10-09, on a defect that reproduces on master). Leading and trailing entries lie outside the span, so the node still folds its span to bytes and its outside trivia renders around the folded bytes, from data. Only an edit inside the span stops the span folding: a write under any descendant index, or to the node's own inner trivia. An ancestor still sees an outside write as an edit inside its range, because the comment changes the ancestor's bytes. The edited set therefore keeps two sorted index lists per tree, `inside` and `outside`, and a node at `[index, end)` is edited when an `inside` index lies in `[index, end)` or an `outside` index lies in `(index, end)`. A write through an alias content that shares its envelope's index (role `aliasContent`) marks `inside`: the content's outside is inside the envelope's span. Master's defect, which this ruling fixes:

    ```ts
    const block = (await createEngine(python)).parse('if a:\n  b\n    # four\n  c\n').statements()[0].consequence().block();
    block.$trivia.leading('# lead');
    block.$render(); // master: "# lead\nb\nc", "# four" lost
    ```

    The leading write stops the block folding (`hasOutsideTrivia`), so it renders from storage; its children are bare coordinates, each folding to its own span, and `# four` (`c`'s leading as the reader places it) lies between those spans with nothing to print it. The native render cannot frame a coordinate with trivia today (`SlotValue::Coord` renders `write_between_edges` alone, and `coordinate_from_napi` reads only `$_layout.gap`), so Task 25 adds it.
13. **Withdrawn: the render does not consult the registry** (maintainer, 2026-10-09). The identity registry is a cache: nothing correct depends on it, and the render never consults it, or it would cross the native/client boundary. A write through a node a query reached therefore stays refused (the `heldBySlot` guard, Task 25 Step 6) until a replacement lands: the write itself as data keyed by tree and index, which the render reads, so no object identity is involved. Where that data lives (native per-tree storage or client) awaits a maintainer ruling.

### Brainstorm's rulings on the plan questions (2026-10-09)

**Q1 — how a built holder resolves a stored coordinate's tree: (a), the token.** Native tree ids come from one process-wide counter (`NEXT_TREE_ID`, `engine.rs:353`), never reused in a process; render's fold refuses a coordinate that holds no token (`assertHoldsTree`, `transport-data.ts:501` and `:507`); a coordinate in parsed data holds its token (`holdReadTree` stamps every parsed object), and `from()` stores that object, so `treeOf(coordinate)` resolves it, as `hydrateListStorage` already does for owner lists. The builder accessor applies the same guard render applies; a cloned coordinate is refused.

**Q2 — one index, two wrappers: (i), a role in the key.** An alias envelope and its content name one parser node and share its index. A kind cannot separate them: a coordinate's `$type` is the node's grammar id (`ReadCtx::coordinate` stamps `node.grammar_id()`), while a transport's `$type` is its storage kind, which differs for a variant arm and for an envelope. The key is the index and the route's role. Two facts are established before the registry is written (Task 19, Step 1):
- whether `$query()` can yield an alias's content, or yields each parser node once, as the envelope;
- whether a tree, an index and a role always hold one storage kind. If so, `hydrateWith` has no kind check on either branch (a coordinate's grammar id never equals an arm's or an envelope's storage kind, so a kind check would miss every coordinate access to an arm and pay a native read each time). If not, the only kind check compares a coordinate's `$type` with the registered wrapper's own coordinate `$type`, the same fact space.

The findings (`registry-facts.mts` at `218b9df3c`, every corpus entry, read at full depth; brainstorm's ruling on them, 2026-10-09):
- **F1 — a query yields envelopes only.** At every envelope site the yield is the envelope: rust 381/381, typescript 599/599, python 13/13. Content placement is fixed per envelope kind: rust 465, 467, 468, typescript 460, 462, 463, 464, 467 and python 336, 337 share the envelope's index; python 335 (`as_pattern_target`) holds its content as its own parser node (6/6), which the query yields as itself.
- **F2 — one storage kind per tree, index and role.** 0 counterexamples across the nested read, the standalone read at the index and the query yield (rust 4,643 standalone reads and 4,495 yields; typescript 3,406 and 3,291; python 5,597 and 5,481), with `aliasContent` meaning a content that shares its envelope's index. `hydrateWith` therefore has no kind check, and F2 is what justifies the registry's one `known as T`.
- The 11 typescript 462 contents that hold no index stay unregistered; their identity is the envelope slot's write-back.

### File structure (1c-ii)

Create:

| File | Responsibility |
| --- | --- |
| `packages/common/src/identity.ts` | per tree: the index registry (`registered`, `register`, `Role`) and the edited set (`markIndexEdited`, `editedWithin`) |
| `rust/crates/sittir-core/src/non_empty.rs` | `NonEmptyVec<T>`: a list the type says holds at least one item |
| `docs/superpowers/probes/2026-10-09-relative-coordinates/registry-facts.mts` | Task 19's two findings: what a query yields at an alias, and storage kinds per index and role |
| `packages/common/tests/identity.test.ts` | the registry and the edited set as units |
| `packages/rust/tests/identity.test.ts` | identity across routes, the fold by range, built-node hydration (rust corpus) |
| `docs/superpowers/probes/2026-10-09-relative-coordinates/` | Task 23's probes and README |

Modify:

| File | Change |
| --- | --- |
| `rust/crates/sittir-core/src/slot.rs` | `NodeCoordinate::end`; `$end` encoded and decoded |
| `rust/crates/sittir-core/src/read.rs` | `ReadCtx::coordinate`, `coordinate_of` fill `end`; `Child::descendants`; `ReadSlot for Vec<…>` accepts an empty list; `ReadSlot for NonEmptyVec<…>` refuses one; the `Option<Vec<…>>` impls go |
| `rust/crates/sittir-core/src/query.rs` | `QueryCoordinate::end` (`$end`) |
| `packages/codegen/src/emitters/render-module.ts` | an optional multiple slot is `Vec<…>`; a required one `NonEmptyVec<…>` |
| `packages/codegen/src/emitters/types.ts` | no `?` on a list storage key |
| `packages/codegen/src/emitters/node-members.ts` | a builder accessor over stored storage hydrates through `hydrateStored` |
| `packages/codegen/src/emitters/factories.ts` | `hydrateListStorage` → `hydrateStored` |
| `packages/types/src/core-types.ts` | `TransportCoordinate.$end` |
| `packages/common/src/utils.ts` | `hydrateWith` through the registry; the trivia writer marks edits; `adoptChild`, `parents`, `detachAncestors`, `refuseUnheld` go |
| `packages/common/src/transport-data.ts` | `foldedCoordinate` by range; `isUntouchedBelow` goes; `plainCoordinate` copies `$end` |
| `packages/common/src/query.ts` | `entryOfCoordinate` through `hydrateWith`; `sameOccurrence` goes |
| `packages/common/src/create-engine.ts` | the parse root through `hydrateWith` |
| `packages/common/src/engine-scope.ts` | `hydrateListStorage` → `hydrateStored`, refusing instead of returning the raw coordinate |
| `packages/rust/tests/fold-in-place-trivia.test.ts` | the query-reached write renders instead of refusing |
| `docs/glossary/packages-common-src.md`, `docs/glossary/emitters.md`, the core crate's glossary | entries for every new, renamed and removed declaration |
| Generated: `packages/{rust,python,typescript}/src/*`, `rust/crates/sittir-*/src/*`, `rust/crates/sittir-*/test-fixtures.json` | regenerated, never hand-edited |

### Global Constraints (1c-ii)

1a's, 1b's and 1c-i's hold, and:

- No rendered byte and no validation row moves, in any task, except the bytes Ruling 12 restores to an edited tree (master drops a comment there). A moved row stops the work for review (no revert). Python's shallow AST match row is the hosts branch's to report (115 once Task 25 lands); on this branch it does not move either.
- The stack pins (`typed_read_nesting.rs`, per level, linux and macos) do not rise. If `end: u32` pushes a choice payload past the 512-byte ceiling, the build asks for it to be pinned: pin it (the list moves, the ceiling never does).
- `index` names the descendant index; `end` names `index + descendant_count()`; the half-open range `[index, end)` is a node's subtree. No other names for either in new code, docs or glossary.
- The registry holds wrappers weakly: nothing it holds keeps a wrapper, a token or a tree alive.
- No `!`, no cast as a fix, no runtime guard standing in for a type fact.

### Review Focus (1c-ii)

1. **A node reached first through a query, then through its parent's accessors** (the reverse of the spec's order). The accessor returns the query's object, and a `$trivia` write through either renders the same. Test: Task 19, Step 1 (`query first, accessor second`).
2. **A wrapper collected between two reads.** The registry entry goes with it; the next read wraps afresh and registers that, and no stale `WeakRef` answers `undefined` as a hit. Test: Task 19, Step 1 (`a collected wrapper is wrapped again`, run with `--expose-gc`).
3. **Two trivia writes on nested nodes, then a write on a sibling's subtree.** Every ancestor of each written node renders from data, and an untouched cousin still renders as source bytes. Test: Task 25, Step 1 (`nested writes fold only untouched ranges`).
4. **A built node holding a parsed child whose subtree was edited.** The built node renders from data, the parsed child from data, and the child's untouched siblings inside it from bytes. Test: Task 25, Step 1 (`a built holder of an edited parsed child`).
5. **A variant arm reached by coordinate.** Its coordinate's `$type` is the grammar id, its wrapper's the arm's storage kind; the second access through any route is a registry hit with no native read. Test: Task 19, Step 2 (the read count over `RangeExpressionBinary`).
6. **A tokenless copy of a coordinate (JSON round trip) stored in a built node.** Its accessor refuses with `assertHoldsTree`'s message; it never returns the raw `{ $treeHandle, $span, $type, $end }`. Test: Task 24, Step 1.
7. **An outside trivia write on a node whose children are bare coordinates, with a comment the reader placed between two children** (Ruling 12). The node folds to its bytes, so the comment between its children survives, and the written entry renders before (leading) or after (trailing) those bytes. Test: Task 25, Step 1 (`an outside write keeps the span's bytes`, both sides, python).

---

## Task 19: The registry

One weak map per tree from an index and a role to the wrapper. `hydrateWith` looks there first for a coordinate (skipping the native read) and for a transport (skipping the wrap); `wrapRegistered` is the one function that wraps and registers, and the parse root goes through it too. The query hydrates through `hydrateWith`. `sameOccurrence` goes: identity is `===`.

**Files:**
- Create: `packages/common/src/identity.ts`, `packages/common/tests/identity.test.ts`, `packages/rust/tests/identity.test.ts`, `docs/superpowers/probes/2026-10-09-relative-coordinates/registry-facts.mts`
- Modify: `packages/common/src/utils.ts` (`hydrateWith`, `hydrateSlotWith`, `wrapRegistered`), `packages/common/src/transport-data.ts` (`indexOf`), `packages/common/src/query.ts` (`entryOfCoordinate`, `includes`, `sameOccurrence`), `packages/common/src/create-engine.ts` (`parse`)
- Modify: `packages/codegen/src/emitters/wrap.ts` (the envelope's content accessor passes `aliasContent`)
- Modify: `docs/glossary/packages-common-src.md`, `docs/glossary/emitters.md`
- Generated: `packages/{rust,python,typescript}/src/wrap.ts`

**Interfaces:**
- Consumes: `decodeIndex(handle: number): number`, `decodeTree(handle: number): number`, `isCoordinate`, `readNode` (`read.ts`); `treeHandleOf(node: object): number | undefined` (`transport-data.ts`).
- Produces:
  - `type Role = 'node' | 'aliasContent'`, `registered(tree: TreeHandle, index: number, role: Role): object | undefined` and `register(tree: TreeHandle, index: number, role: Role, wrapper: object): void` in `identity.ts`, which imports only `read.ts`'s `TreeHandle` type;
  - `indexOf(node: object): number | undefined` in `transport-data.ts`, beside `treeHandleOf`;
  - `wrapRegistered<T>(value: object, tree: TreeHandle, wrap: (value: object, tree: TreeHandle) => T, role?: Role): T` in `utils.ts`: the registered wrapper at the value's index and role, or `wrap(value, tree)` registered there;
  - `hydrateWith(value, tree, wrap, depth?, role?)` and `hydrateSlotWith(node, key, tree, wrap, role?)`: `role` defaults to `'node'`.

- [ ] **Step 1: The two registry facts**

`docs/superpowers/probes/2026-10-09-relative-coordinates/registry-facts.mts` parses every corpus file of rust, typescript and python at `depth: Infinity` and walks the read data (not the wrappers), and reports:

1. **What a query yields at an alias.** For every alias envelope in the read (a transport whose wrap-table kind is an envelope; the generated `node-model.json5` marks envelope kinds), the kinds `root.$query().$descendants` yields at that envelope's index: the envelope's kind only, or also its content's.
2. **Storage kinds per index and role.** For every index, the set of storage `$type`s of the transports at that index whose role is `node` (every transport not reached as an envelope's content) and of those whose role is `aliasContent`. A set with more than one member is a counterexample, printed with its kinds and source position.

Run: `pnpm exec tsx docs/superpowers/probes/2026-10-09-relative-coordinates/registry-facts.mts`. Record both findings in Step 6's text and in the probe's README, then:
- Finding 1, envelope only → content has one route (its envelope's accessor); `entryOfCoordinate` passes no role. Finding 1, content too → `entryOfCoordinate` passes `aliasContent` when the match's `$type` is the content's kind.
- Finding 2 holds → `hydrateWith` has no kind check. Finding 2 fails → stop and report the counterexamples to brainstorm before Step 4: the only admissible check then compares a coordinate's `$type` with the registered wrapper's own coordinate `$type`.

- [ ] **Step 2: Write the failing tests**

Call `mcp__infigraph__generate_test_context` for `hydrateWith` and `queryFacet` first. `packages/rust/tests/identity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { treeOf } from '../../common/src/tree-token.ts';
import rust from '../src/index.ts';

const engine = await createEngine(rust);
const SOURCE = 'fn a() {}\nfn b() { let x = 1; }\n';

function viaAccessors(root: ReturnType<typeof engine.parse>) {
	const second = root.statements()[1]!;
	if (!engine.is.functionItem(second)) throw new Error('expected a function');
	const statement = second.body().statements()[0];
	if (statement === undefined || !engine.is.letDeclaration(statement)) throw new Error('expected a let declaration');
	return statement;
}

function viaQuery(root: ReturnType<typeof engine.parse>) {
	const found = Array.from(root.$query().$descendants).find((node) => engine.is.letDeclaration(node));
	if (found === undefined || !engine.is.letDeclaration(found)) throw new Error('expected a let declaration');
	return found;
}

function countingReads(root: object): number[] {
	const tree = treeOf(root);
	if (tree?.read === undefined) throw new Error('expected a live tree');
	const native = tree.read.bind(tree);
	const reads: number[] = [];
	tree.read = (index, depth) => (reads.push(index), native(index, depth));
	return reads;
}

describe.each([
	['a shallow read', 1],
	['a deep read', Infinity]
])('one wrapper per node, on %s', (_, depth) => {
	it('a query returns the object the accessors return', () => {
		const root = engine.parse(SOURCE, { depth });
		expect(viaQuery(root)).toBe(viaAccessors(root));
	});

	it('query first, accessor second', () => {
		const root = engine.parse(SOURCE, { depth });
		const queried = viaQuery(root);
		expect(viaAccessors(root)).toBe(queried);
	});

	it('the same object across two queries', () => {
		const root = engine.parse(SOURCE, { depth });
		expect(viaQuery(root)).toBe(viaQuery(root));
	});

	it('includes is identity', () => {
		const root = engine.parse(SOURCE, { depth });
		expect(root.$query().$descendants.includes(viaAccessors(root))).toBe(true);
	});
});

describe.each([
	['a let declaration', 'fn b() { let x = 1; let y = 2; }\n', () => engine.kinds.LetDeclaration],
	['a variant arm', 'fn b() { let r = 0..1; let s = 2..3; }\n', () => engine.kinds.RangeExpressionBinary]
])('a descendants query over %s', (_, source, kind) => {
	it('reads only the matches not already registered, and no ancestor', () => {
		const root = engine.parse(source, { depth: 1 });
		const reads = countingReads(root);
		const first = Array.from(root.$query().$descendants.ofType(kind()));
		expect(first.length).toBe(2);
		expect(reads.length).toBe(first.length);
		reads.length = 0;
		const again = Array.from(root.$query().$descendants.ofType(kind()));
		expect(again).toEqual(first);
		expect(reads).toEqual([]);
	});
});

describe('a collected wrapper', () => {
	it('is wrapped again, and the new wrapper is the one every route returns', async () => {
		const gc = (globalThis as { gc?: () => void }).gc;
		if (gc === undefined) throw new Error('run with --expose-gc');
		const root = engine.parse(SOURCE, { depth: 1 });
		const ref = new WeakRef(viaQuery(root));
		await new Promise((resolve) => setTimeout(resolve, 0));
		gc();
		const again = viaQuery(root);
		expect(viaAccessors(root)).toBe(again);
		expect(ref.deref() === undefined || ref.deref() === again).toBe(true);
	});
});
```

`engine.kinds.LetDeclaration` and `engine.kinds.RangeExpressionBinary` are the kind ids under the engine's `kinds` (`TSKindId`); `ofType` takes the arm's kind id, as the query's `kinds` push-down compares a node's kind. If `ofType` at the base takes the grammar kind for an arm, use `engine.kinds.RangeExpression` and keep the assertion on reads.

`packages/common/tests/identity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { register, registered } from '../src/identity.ts';
import type { TreeHandle } from '../src/read.ts';

describe('the registry', () => {
	it('answers what was registered, per tree, index and role', () => {
		const a: TreeHandle = { id: 1 };
		const b: TreeHandle = { id: 2 };
		const envelope = {};
		const content = {};
		register(a, 7, 'node', envelope);
		register(a, 7, 'aliasContent', content);
		expect(registered(a, 7, 'node')).toBe(envelope);
		expect(registered(a, 7, 'aliasContent')).toBe(content);
		expect(registered(b, 7, 'node')).toBeUndefined();
		expect(registered(a, 8, 'node')).toBeUndefined();
	});
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm exec vitest run packages/common/tests/identity.test.ts` — Expected: FAIL, `identity.ts` not found.
Run: `node --expose-gc node_modules/vitest/vitest.mjs run packages/rust/tests/identity.test.ts` — Expected: FAIL on `a query returns the object the accessors return`, `query first, accessor second`, `the same object across two queries`, and both read-count cases (`reads` is not empty on the second query); `includes is identity` passes today through `sameOccurrence`.

- [ ] **Step 4: The registry**

`packages/common/src/identity.ts`:

```ts
import type { TreeHandle } from './read.ts';

export type Role = 'node' | 'aliasContent';

type Wrappers = Map<number, WeakRef<object>>;

const registries = new WeakMap<TreeHandle, Wrappers>();
const collected = new FinalizationRegistry<{ readonly wrappers: Wrappers; readonly key: number; readonly ref: WeakRef<object> }>(
	({ wrappers, key, ref }) => {
		if (wrappers.get(key) === ref) wrappers.delete(key);
	}
);

function keyOf(index: number, role: Role): number {
	return index * 2 + (role === 'aliasContent' ? 1 : 0);
}

export function registered(tree: TreeHandle, index: number, role: Role): object | undefined {
	return registries.get(tree)?.get(keyOf(index, role))?.deref();
}

export function register(tree: TreeHandle, index: number, role: Role, wrapper: object): void {
	let wrappers = registries.get(tree);
	if (wrappers === undefined) registries.set(tree, (wrappers = new Map()));
	const key = keyOf(index, role);
	const ref = new WeakRef(wrapper);
	wrappers.set(key, ref);
	collected.register(wrapper, { wrappers, key, ref });
}
```

(`index < 2 ** 32`, so `index * 2 + 1` stays inside a double's exact range.) In `transport-data.ts`, beside `treeHandleOf`:

```ts
export function indexOf(node: object): number | undefined {
	const handle = treeHandleOf(node);
	return handle === undefined ? undefined : decodeIndex(handle);
}
```

- [ ] **Step 5: One seat for wrapping and registering**

In `packages/common/src/utils.ts`, beside `hydrateWith`:

```ts
export function wrapRegistered<T>(value: object, tree: TreeHandle, wrap: (value: object, tree: TreeHandle) => T, role: Role = 'node'): T {
	const index = indexOf(value);
	if (index === undefined) return wrap(value, tree);
	const known = registered(tree, index, role);
	if (known !== undefined) return known as T;
	const wrapper = wrap(value, tree);
	if (wrapper !== null && typeof wrapper === 'object') register(tree, index, role, wrapper);
	return wrapper;
}
```

`known as T` is the registry's one cast: what is registered at an index and role is what `wrap` returned for it (Step 1's finding 2), and the registry stores it as `object` because one registry serves every kind. Then `hydrateWith`:

```ts
export function hydrateWith(value: unknown, tree: TreeHandle, wrap: WrapTransport, depth?: number, role: Role = 'node'): unknown {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
	if (isCoordinate(value)) {
		const known = decodeTree(value.$treeHandle) === tree.id ? registered(tree, decodeIndex(value.$treeHandle), role) : undefined;
		return known ?? hydrateWith(readNode(tree, value, depth), tree, wrap, undefined, role);
	}
	if (isTypedNode(value) || typeof (value as { readonly $type?: unknown }).$type !== 'number') return value;
	return wrapRegistered(value, tree, wrap, role);
}
```

`hydrateSlotWith` takes the same `role` and passes it to `hydrateWith`. The tree check keeps a coordinate of another tree away from this tree's registry; `readNode` then refuses it as today.

The query hydrates through `hydrateWith`, in `query.ts`, with the role Step 1's finding 1 decides (no role when the query yields envelopes only):

```ts
function entryOfCoordinate(coordinate: TransportCoordinate, tree: TreeHandle, hooks: QueryHooks): Entry {
	return {
		kind: coordinate.$type,
		address: { handle: coordinate.$treeHandle },
		hydrate: () => inTreeEngine(tree, () => hydrateWith(coordinate, tree, hooks.wrap))
	};
}
```

`includes` compares by identity; delete `sameOccurrence`:

```ts
		includes: (node) => findIndex(items(), (candidate) => candidate === node) >= 0,
```

The parse root, in `create-engine.ts`'s `parse`, wraps through the same seat; the root is never registered before this call, so this registers it:

```ts
				return wrapRegistered(root, tree, hooks.wrap);
```

`wrapRegistered`'s `T` is inferred from `hooks.wrap`'s return, `API['root']`, so no cast is needed at the call.

- [ ] **Step 6: The envelope's content accessor takes its role from placement**

Step 1 established F1: a query yields each parser node once, as its envelope at a shared index, so `entryOfCoordinate` passes no role. In `utils.ts`, one helper decides the content's role from the two stamped indexes:

```ts
export function contentRole(envelope: object, content: unknown): Role {
	if (content === null || typeof content !== 'object') return 'node';
	const own = indexOf(envelope);
	return own !== undefined && own === indexOf(content) ? 'aliasContent' : 'node';
}
```

In `packages/codegen/src/emitters/wrap.ts`, the envelope branch's content accessor emits `hydrateSlot<…>(this, '<content key>', tree, contentRole(this, this['<content key>']))`; the generated `hydrateSlot` wrapper takes and passes the role. A content with no index (typescript 462's 11) is a plain value or an unregistered transport; its identity is the slot's write-back. Add the test to `packages/rust/tests/identity.test.ts` on a source holding an alias (at `12644d5df` rust `field_identifier` under `field_expression`): the envelope's content accessor returns one object twice; it is not `===` the envelope; and, if a query yields the content, a query matching the content's kind returns that same object. Regenerate.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm exec vitest run packages/common/tests/identity.test.ts` — Expected: PASS.
Run: `node --expose-gc node_modules/vitest/vitest.mjs run packages/rust/tests/identity.test.ts` — Expected: PASS.
Run: `pnpm exec vitest run packages/rust/tests packages/python/tests packages/typescript/tests packages/common/tests` (its own Bash call) — Expected: PASS, apart from `fold-in-place-trivia.test.ts`'s refusal case, which still refuses (Task 25 lifts it).

- [ ] **Step 8: Glossary, gates, commit**

Glossary entries in `docs/glossary/packages-common-src.md`: `identity.ts::Role`, `keyOf`, `registered`, `register`; `transport-data.ts::indexOf`; `utils.ts::wrapRegistered`, `contentRole`; `hydrateWith` and `hydrateSlotWith` updated (the lookup, the tree check, the role); `query.ts::sameOccurrence` removed; `entryOfCoordinate` updated. In `docs/glossary/emitters.md`, the envelope content accessor's role. Then `pnpm run validate:native` and `sittir validate history` against the base: rows unchanged.

```bash
git checkout -- .cursor/rules/infigraph.mdc .github/copilot-instructions.md GEMINI.md AGENTS.md
git commit -F "$MSG" -- packages/common/src/identity.ts packages/common/src/utils.ts packages/common/src/transport-data.ts packages/common/src/query.ts packages/common/src/create-engine.ts packages/codegen/src/emitters/wrap.ts packages/common/tests/identity.test.ts packages/rust/tests/identity.test.ts docs/superpowers/probes/2026-10-09-relative-coordinates docs/glossary/packages-common-src.md docs/glossary/emitters.md
```

plus the regenerated `wrap.ts` files `git status` names. Message: `feat(identity): one wrapper per parsed node and role, shared by accessors, queries and the parse root`.

---

## Task 25: The edited set and the fold by range

A write marks its node's index edited, on the side it edits (Ruling 12): an outside trivia write (leading, trailing) marks `outside`, an inner trivia write marks `inside`. A node folds to its coordinate when no `inside` index lies in `[index, end)` and no `outside` index lies in `(index, end)`; a folded node with outside trivia crosses as its coordinate carrying that trivia, and the native render frames the coordinate's bytes with it. The node keeps its coordinate and its tree: no ancestor is detached, so `adoptChild`, the parent links, `detachAncestors` and the projection walk (`isUntouchedBelow`) go, and the refusal of a write on a node a query reached stays, decided by a guard (`heldBySlot`) until the write-as-data replacement lands (Ruling 13).

**Files:**
- Modify: `rust/crates/sittir-core/src/slot.rs` (`NodeCoordinate::end`, `new`, `coordinate_to_napi`, `coordinate_from_napi`, their tests; `SlotValue::Coord` carries outside trivia), `rust/crates/sittir-core/src/layout.rs` (the trivia framing `TransportLayout::render` and a framed coordinate share), `rust/crates/sittir-core/src/{prepare,trivia,view,read}.rs` (the `SlotValue::Coord` match sites), `rust/crates/sittir-core/src/read.rs` (`ReadCtx::coordinate`, `coordinate_of`, `Child`), `rust/crates/sittir-core/src/query.rs` (`QueryCoordinate`), `rust/crates/sittir-core/tests/prepare.rs` (the `new` calls)
- Modify: `packages/types/src/core-types.ts` (`TransportCoordinate.$end`)
- Modify: `packages/common/src/identity.ts` (`markIndexEdited`, `editedWithin`), `packages/common/src/utils.ts` (the trivia writer; `adoptChild`, `parents`, `detachAncestors` go; `hydrateSlotWith`, `hydrateSlotsWith` stop adopting), `packages/common/src/transport-data.ts` (`foldedCoordinate`; `isUntouchedBelow` goes; `plainCoordinate`)
- Modify: `packages/rust/tests/fold-in-place-trivia.test.ts`, `packages/rust/tests/identity.test.ts`, `packages/common/tests/identity.test.ts`
- Create: `packages/python/tests/fold-outside-trivia.test.ts`
- Modify: the glossaries

**Interfaces:**
- Consumes: Task 19's `indexOf` (`transport-data.ts`).
- Produces: `markEditedNode(node: object, side: EditSide): void` in `utils.ts`, the one hook every in-place write calls; `EditSide = 'inside' | 'outside'` in `identity.ts`.
- Produces:
  - `TransportCoordinate.$end: number` — `index + descendant_count()` of the node it names;
  - `markIndexEdited(tree: TreeHandle, index: number, side: EditSide): void` and `editedWithin(tree: TreeHandle, index: number, end: number): boolean` in `identity.ts`;
  - native `SlotValue::Coord(NodeCoordinate, Option<Box<TransportTrivia<T>>>)`: a coordinate and the outside trivia it renders between;
  - native `NodeCoordinate { tree, index, end, span, kind, edges, gap }` and `NodeCoordinate::new(tree: u32, index: u32, end: u32, span: Span)`.

- [ ] **Step 1: Write the failing tests**

In `packages/rust/tests/fold-in-place-trivia.test.ts`, the third case keeps its refusal until Ruling 13's replacement lands; when it does, it becomes:

```ts
	it('renders a comment written on a node a query reached, as written through the accessors', () => {
		const root = engine.parse(SOURCE, { depth });
		const viewed = Array.from(root.$query().$descendants).find((node) => engine.is.letDeclaration(node));
		if (viewed === undefined || !engine.is.letDeclaration(viewed)) throw new Error('expected a let declaration');
		viewed.$trivia.leading(engine.build.lineComment(' before'));
		expect(root.$render()).toBe('fn a() {}\nfn b() {\n    // before\n    let x = 1;\n}\n');
	});
```

Append to `packages/rust/tests/identity.test.ts` (it imports `readNode`'s module only for the read count):

```ts
const NESTED = 'fn a() { let p = 1; }\nfn b() { let q = 2; let r = 3; }\nfn c() { let s = 4; }\n';

describe('the fold by range', () => {
	it('a deep write unfolds its ancestors and leaves siblings and cousins as bytes', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [, b] = root.statements();
		if (b === undefined || !engine.is.functionItem(b)) throw new Error('expected a function');
		const q = b.body().statements()[0];
		if (q === undefined) throw new Error('expected a statement');
		q.$trivia.leading(engine.build.lineComment(' q'));
		expect(root.$render()).toBe('fn a() { let p = 1; }\nfn b() {\n    // q\n    let q = 2; let r = 3;\n}\nfn c() { let s = 4; }\n');
	});

	it('nested writes fold only untouched ranges', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [a, b] = root.statements();
		if (a === undefined || b === undefined || !engine.is.functionItem(a) || !engine.is.functionItem(b)) throw new Error('expected functions');
		const p = a.body().statements()[0];
		const r = b.body().statements()[1];
		if (p === undefined || r === undefined) throw new Error('expected statements');
		p.$trivia.leading(engine.build.lineComment(' p'));
		r.$trivia.trailing(engine.build.lineComment(' r'));
		const out = root.$render();
		expect(out).toContain('// p\n');
		expect(out).toContain('let r = 3;\n    // r\n');
		expect(out.endsWith('fn c() { let s = 4; }\n')).toBe(true);
	});

	it('a built holder of an edited parsed child', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [, b] = root.statements();
		if (b === undefined || !engine.is.functionItem(b)) throw new Error('expected a function');
		const q = b.body().statements()[0];
		if (q === undefined) throw new Error('expected a statement');
		q.$trivia.leading(engine.build.lineComment(' q'));
		const built = engine.build.sourceFile({ statements: [b] });
		expect(built.$render()).toBe('fn b() {\n    // q\n    let q = 2; let r = 3;\n}\n');
	});

	it('an untouched node folds after a write elsewhere', () => {
		const root = engine.parse(NESTED, { depth: 1 });
		const [a, , c] = root.statements();
		if (a === undefined || c === undefined || !engine.is.functionItem(a)) throw new Error('expected functions');
		a.body().statements()[0]?.$trivia.leading(engine.build.lineComment(' p'));
		expect(c.$render()).toBe('fn c() { let s = 4; }');
	});
});
```

The two-statement expectations keep the source gap between untouched neighbours (`let q = 2; let r = 3;`), and a written trailing entry goes where the trivia writer places it (its own line). If `engine.build.sourceFile`'s factory spelling differs at the base, take it from `packages/rust/src/factories/raw.ts`'s `buildSourceFile` (`sourceFile(...statements)`).

Append to `packages/common/tests/identity.test.ts`:

```ts
import { editedWithin, markIndexEdited } from '../src/identity.ts';

describe('the edited set', () => {
	it('answers whether an inside edit lies in a half-open range', () => {
		const tree: TreeHandle = { id: 3 };
		markIndexEdited(tree, 10, 'inside');
		markIndexEdited(tree, 4, 'inside');
		markIndexEdited(tree, 10, 'inside');
		expect(editedWithin(tree, 0, 4)).toBe(false);
		expect(editedWithin(tree, 0, 5)).toBe(true);
		expect(editedWithin(tree, 5, 10)).toBe(false);
		expect(editedWithin(tree, 10, 11)).toBe(true);
		expect(editedWithin({ id: 4 }, 0, 100)).toBe(false);
	});

	it('an outside edit edits the ranges that strictly contain its index, not its own', () => {
		const tree: TreeHandle = { id: 5 };
		markIndexEdited(tree, 7, 'outside');
		expect(editedWithin(tree, 7, 9)).toBe(false);
		expect(editedWithin(tree, 6, 9)).toBe(true);
		expect(editedWithin(tree, 8, 9)).toBe(false);
	});
});
```

Create `packages/python/tests/fold-outside-trivia.test.ts` (master's defect, Ruling 12):

```ts
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const engine = await createEngine(python);
const SOURCE = 'if a:\n  b\n    # four\n  c\n';

function blockOf(root: ReturnType<typeof engine.parse>) {
	const statement = root.statements()[0];
	if (statement === undefined || !engine.is.ifStatement(statement)) throw new Error('expected an if statement');
	return statement.consequence().block();
}

describe('an outside write keeps the span\'s bytes', () => {
	it('leading', () => {
		const block = blockOf(engine.parse(SOURCE));
		block.$trivia.leading('# lead');
		expect(block.$render()).toBe('# lead\nb\n    # four\n  c');
	});

	it('trailing', () => {
		const block = blockOf(engine.parse(SOURCE));
		block.$trivia.trailing('# tail');
		const out = block.$render();
		expect(out.startsWith('b\n    # four\n  c')).toBe(true);
		expect(out.trimEnd().endsWith('# tail')).toBe(true);
	});

	it('the whole tree renders the written entry and the reader\'s comment', () => {
		const root = engine.parse(SOURCE);
		blockOf(root).$trivia.leading('# lead');
		expect(root.$render()).toContain('    # four\n  c');
		expect(root.$render()).toContain('# lead');
	});
});
```

The trailing case pins the comment's survival and its side, not the join (the trailing entry's line placement is the trivia writer's, unchanged here); Step 8 pins the exact string the run prints.

The write-retention test (write through a query, drop every reference, collect, re-query) and the query-reached write case wait for Ruling 13's replacement.

In `slot.rs`'s tests, add a framed coordinate:

```rust
#[test]
fn a_coordinate_renders_between_its_outside_trivia() {
    // A coordinate holding leading and trailing entries writes them around
    // its sliced bytes, through the same framing a transport's layout uses.
    // Build the entries as `TriviaText` values (the detached form), render
    // with `rendered_with`, and assert "// a\nword // b".
}
```

with the body written against the test module's `Sources` and `rendered_with` helpers.

In `slot.rs`'s tests, the encode test asserts `$end`; add to `read.rs`'s tests:

```rust
#[test]
fn a_coordinate_ends_past_its_last_descendant() {
    let source = "fn a() { let x = 1; }";
    let tree = parse_rust(source);
    let ctx = ReadCtx::new(source, 1);
    let mut cursor = tree.walk();
    for index in 0..tree.root_node().descendant_count() {
        cursor.goto_descendant(index);
        let coordinate = ctx.at_of(&cursor);
        assert_eq!(coordinate.index as usize, index);
        assert_eq!(coordinate.end as usize, index + cursor.node().descendant_count());
    }
}
```

(`parse_rust` is the helper `read.rs`'s tests already use; if its name differs at the base, use that one.)

- [ ] **Step 2: Run them to verify they fail**

Run: `cargo test -p sittir-core a_coordinate_ends_past_its_last_descendant` — Expected: FAIL to compile, no field `end`.
Run: `pnpm exec vitest run packages/common/tests/identity.test.ts` — Expected: FAIL, `markIndexEdited` not exported.
Run: `pnpm exec vitest run packages/rust/tests/fold-in-place-trivia.test.ts packages/rust/tests/identity.test.ts` — Expected: FAIL on the query-reached write (refused: "reached outside its parent's accessors").
Run: `pnpm exec vitest run packages/python/tests/fold-outside-trivia.test.ts` — Expected: FAIL, `"# lead\nb\nc"` (master's defect).

- [ ] **Step 3: `end` on the native coordinate**

`slot.rs`:

```rust
pub struct NodeCoordinate {
    pub tree: u32,
    pub index: u32,
    /// `index + descendant_count()`: the subtree is `[index, end)`.
    pub end: u32,
    pub span: Span,
    // kind, edges, gap unchanged
}

impl NodeCoordinate {
    pub fn new(tree: u32, index: u32, end: u32, span: Span) -> Self {
        Self { tree, index, end, span, kind: None, edges: None, gap: None }
    }
}
```

`coordinate_to_napi` adds `present(env, c"$end", Some(coord.end))?` after `$treeHandle`; `coordinate_from_napi` reads it as required, like `$span`:

```rust
    let end: u32 = unsafe { property(env, napi_val, c"$end")? }
        .ok_or_else(|| ::napi::Error::from_reason(format!("coordinate with $treeHandle {handle} carries no $end")))?;
```

and builds `NodeCoordinate::new(tree, index, end, span)`. These two lines go with the object codec at the record step.

`read.rs`: `ReadCtx::coordinate` takes the node it already holds:

```rust
        NodeCoordinate {
            kind: Some(KindId(node.grammar_id())),
            ..NodeCoordinate::new(self.tree_id, index, index + node.descendant_count() as u32, span)
        }
```

`Child` gains `pub descendants: u32`, set where the survey builds a `Child` from its node (`node.descendant_count() as u32`), and `coordinate_of` passes `child.index + child.descendants`.

`query.rs`: `QueryCoordinate` gains `#[serde(rename = "$end")] pub end: u32`, filled from `coord.end`.

Every `NodeCoordinate::new` call in tests passes an `end` (`index + 1` where the test names a leaf; the tests name no subtree). Then the `const` payload assertions: build; if one asks for a pin, pin it.

- [ ] **Step 4: `$end` on the JavaScript coordinate**

`core-types.ts`:

```ts
export interface TransportCoordinate {
	readonly $treeHandle: number;
	/** The index past the node's last descendant: its subtree is the indexes from its own up to this one, exclusive. */
	readonly $end: number;
	readonly $span: ByteSpan;
	readonly $type: number;
}
```

`transport-data.ts`'s `plainCoordinate` copies `$end: coordinate.$end`. `isCoordinate` is unchanged (`$treeHandle` and `$span` decide it).

- [ ] **Step 5: The edited set**

`identity.ts`:

```ts
export type EditSide = 'inside' | 'outside';

const edited = new WeakMap<TreeHandle, Record<EditSide, number[]>>();

function lowerBound(sorted: readonly number[], value: number): number {
	let low = 0;
	let high = sorted.length;
	while (low < high) {
		const middle = (low + high) >>> 1;
		if (sorted[middle]! < value) low = middle + 1;
		else high = middle;
	}
	return low;
}

function anyWithin(sorted: readonly number[], from: number, end: number): boolean {
	const at = lowerBound(sorted, from);
	return at < sorted.length && sorted[at]! < end;
}

export function markIndexEdited(tree: TreeHandle, index: number, side: EditSide): void {
	let sides = edited.get(tree);
	if (sides === undefined) edited.set(tree, (sides = { inside: [], outside: [] }));
	const indexes = sides[side];
	const at = lowerBound(indexes, index);
	if (indexes[at] !== index) indexes.splice(at, 0, index);
}

export function editedWithin(tree: TreeHandle, index: number, end: number): boolean {
	const sides = edited.get(tree);
	return sides !== undefined && (anyWithin(sides.inside, index, end) || anyWithin(sides.outside, index + 1, end));
}
```

`sorted[middle]!` is an index inside `[0, length)`; if the lint forbids the `!`, read through `.at(middle) ?? Infinity`.

`transport-data.ts`'s `markEdited` is a different fact (a `$with` draft's data, stripped of `at` and the token: a draft is a new node) and keeps its name; the edited set's verb is `markIndexEdited`.

- [ ] **Step 6: The trivia writer marks the edit**

In `utils.ts`'s `triviaWriter`: `refuseUnheld` stays, its test reading a `heldBySlot` WeakSet that `hydrateSlotWith` and `hydrateSlotsWith` fill in place of the parent links (a guard only: it decides refusal, never output); `store` becomes

```ts
	const store = (trivia: NodeTrivia, side: TriviaSideName): AnyUntypedNode => {
		markWritten(node, side);
		setTriviaData(node, trivia);
		markEditedNode(node, 'outside');
		return node;
	};
```

and `writeInner` drops `detachCoordinate(node)` and marks `markEditedNode(node, 'inside')`. `markEditedNode` (in `utils.ts`):

```ts
function markEditedNode(node: object, side: EditSide): void {
	const tree = treeOf(node);
	const index = indexOf(node);
	if (tree !== undefined && index !== undefined) markIndexEdited(tree, index, sharesEnvelopeIndex(node) ? 'inside' : side);
}
```

`sharesEnvelopeIndex(node)` is the registry's role fact for the node (Ruling 9: a content that shares its envelope's index registered as `aliasContent`); take it from where `contentRole` stamped it, never from a kind test.

A built node has no tree and no index: it renders from data already, so nothing is marked. `markEditedNode` is the only hook for an in-place write (Ruling 10): any future in-place verb, such as the node-query `$edit` verbs, marks through it, and its glossary entry says so; `$with` mints a draft and marks nothing. Delete `parents`, `adoptChild` and `detachAncestors`; `hydrateSlotWith` and `hydrateSlotsWith` add each child to `heldBySlot` instead.

- [ ] **Step 7: The fold by range**

`transport-data.ts`:

```ts
function foldedCoordinate(record: Record<string, unknown>): TransportCoordinate | undefined {
	const coordinate = coordinateOf(record);
	if (coordinate === undefined) return undefined;
	const tree = treeOf(record);
	if (tree === undefined) return undefined;
	return editedWithin(tree, decodeIndex(coordinate.$treeHandle), coordinate.$end) ? undefined : coordinate;
}
```

`toTransportValue` passes the node's crossing trivia to `foldToCoordinate`, which sets `$_layout.trivia` on the crossing coordinate to the trivia's `leading` and `trailing` sides when either is present (inner entries lie inside the span, so the bytes carry them). `hasOutsideTrivia` stays as that test. Delete `isUntouchedBelow`. A record with a coordinate but no tree (a copy that lost its token) does not fold, and its slots cross as data; `assertHoldsTree` still refuses a bare tokenless coordinate in a slot.

- [ ] **Step 7b: The native render frames a coordinate with its outside trivia**

`slot.rs`: `SlotValue::Coord(NodeCoordinate, Option<Box<TransportTrivia<T>>>)`. Its decoder reads `$_layout.trivia` beside `$_layout.gap` when the object is a coordinate; its encoder writes none (a read never attaches trivia to a bare coordinate, and nothing crosses back). `Render` and `transport_or_write` write a coordinate through the framing below with `write_between_edges` as the body; `PartialEq` compares the trivia too. The reader's two constructions pass `None`; every other match site binds `Coord(coord, ..)`.

`layout.rs`: the body of `TransportLayout::render` becomes one function over `(trivia: Option<&TransportTrivia<T>>, edges, kind, role, w, body)`; `TransportLayout::render` calls it with its own trivia and edges, and a framed coordinate with its trivia, `Edges::NONE`, no kind (its kind's edges are `write_between_edges`'s) and `TriviaRole::Owner`.

`prepare.rs`: the `Coord` arm prepares its trivia (`TransportTrivia::prepare`), so a coordinate entry inside it takes its kind's edges.

`SlotValue<T>` grows by one pointer only where the `Coord` arm is its widest; if a payload assertion asks for a pin, pin it (Global Constraints).

- [ ] **Step 8: Run the tests to verify they pass**

Run: `cargo test -p sittir-core` and the workspace (`cargo test --workspace`) — Expected: PASS; the stack pins unmoved.
Run: `pnpm run validate:native` (regenerates) — Expected: rows unchanged.
Run: `pnpm exec vitest run packages/common/tests/identity.test.ts packages/rust/tests/fold-in-place-trivia.test.ts packages/rust/tests/identity.test.ts packages/python/tests/fold-outside-trivia.test.ts` — Expected: PASS. Replace the trailing case's two assertions with the exact string the run prints, once read and judged right.
Run: the full unit suite (its own Bash call) — Expected: PASS; any failure isolated by stash-and-rerun before it is called pre-existing.

- [ ] **Step 9: Glossary, commit**

Entries: `identity.ts::EditSide`, `markIndexEdited`, `editedWithin`, `lowerBound`, `anyWithin`; `utils.ts::markEditedNode` (the only in-place-write hook; future in-place verbs mark through it, naming the side); `transport-data.ts::foldedCoordinate` updated; removed: `adoptChild`, `detachAncestors`, `isUntouchedBelow`, the refusal. Core glossary: `NodeCoordinate::end`, `ReadCtx::coordinate`, `Child::descendants`, `QueryCoordinate::end`, `SlotValue::Coord`'s trivia, the shared trivia framing in `layout.rs`.

Commit message: `feat(identity): an edit marks its index; a node folds when its range holds no edit`. Pathspec: every file in this task's Files list plus the regenerated outputs `git status` names.

---

## Task 24: A built node hydrates the coordinates it stores

A built node's accessor over a stored coordinate returns the raw `{ $treeHandle, $span, $type, $end }` today, on both routes that put one there: `from()` of parsed data, and a slot that copies storage straight (`_content`). The builder accessor is the one `node-members.ts:43` emits (`name: () => read`). After this task it hydrates through `hydrateWith`, and so through Task 19's registry: one coordinate yields one object whether a built holder, a parsed holder or a query reaches it.

**Files:**
- Modify: `packages/common/src/engine-scope.ts` (`hydrateListStorage` → `hydrateStored`)
- Modify: `packages/common/src/utils.ts` (`hydrateTriviaEntry`'s call; the re-export)
- Modify: `packages/codegen/src/emitters/node-members.ts` (the builder accessor), `packages/codegen/src/emitters/factories.ts:1543` (the owner-list call)
- Modify: `packages/rust/tests/identity.test.ts`
- Modify: the glossaries
- Generated: `packages/{rust,python,typescript}/src/*`

**Interfaces:**
- Consumes: Task 19's `hydrateWith` (registry-backed).
- Produces: `hydrateStored(value: unknown): unknown` — a coordinate hydrated through its tree's engine and the registry, or refused; any other value unchanged.

- [ ] **Step 1: Write the failing tests**

Append to `packages/rust/tests/identity.test.ts`:

```ts
import { isCoordinate } from '../../common/src/read.ts';

describe('a built node over parsed storage', () => {
	it('hydrates the coordinate it stores into the parsed holder's object', () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const built = engine.build.sourceFile.from(parsed);
		expect(built.statements()[0]).toBe(parsed.statements()[0]);
		expect(built.$render()).toBe(SOURCE);
	});

	it('refuses a coordinate that lost its tree, and never returns it raw', () => {
		const parsed = engine.parse(SOURCE, { depth: 1 });
		const held = (parsed as unknown as { readonly _statements: readonly unknown[] })._statements[0];
		expect(isCoordinate(held)).toBe(true);
		const stored = JSON.parse(JSON.stringify(held));
		const built = engine.build.sourceFile.from({ ...parsed, _statements: [stored] } as typeof parsed);
		expect(() => built.statements()[0]).toThrow(/does not hold that tree/);
	});

	it('refuses after its engine is disposed, naming the tree', async () => {
		const scoped = await createEngine(rust);
		const parsed = scoped.parse(SOURCE, { depth: 1 });
		const built = scoped.build.sourceFile.from(parsed);
		scoped.dispose();
		expect(() => built.statements()[0]).toThrow(/tree \d+/);
	});
});
```

Use the `from()` spelling the rust package exports at the base (`engine.build.sourceFile.from` or `engine.from.sourceFile`; `packages/rust/src/from.ts` names it). If the engine's disposal verb differs (`[Symbol.dispose]`), use that.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec vitest run packages/rust/tests/identity.test.ts` — Expected: FAIL; the first case gets the raw coordinate (not `toBe` the wrapper), the second gets the raw copy, the third gets the raw coordinate.

- [ ] **Step 3: `hydrateStored`**

`engine-scope.ts`:

```ts
export function hydrateStored(value: unknown): unknown {
	if (!isCoordinate(value)) return value;
	assertHoldsTree(value);
	const tree = treeOf(value);
	const handle = tree === undefined ? undefined : treeHandles.get(tree);
	if (tree === undefined || handle === undefined || !isLive(handle.current)) {
		throw new Error(`this coordinate names tree ${decodeTree(value.$treeHandle)}, which is no longer live: its engine was disposed or its tree released`);
	}
	const caller = currentHandle();
	if (caller !== undefined && !sameLanguage(caller.current, handle.current)) {
		throw new Error(`a ${handle.current.language.name} node read through a ${caller.current.language.name} engine`);
	}
	return handle.hydrate?.(value, tree) ?? value;
}
```

`handle.hydrate` is the generated `hydrate`, which calls `hydrateWith` (registry-backed), so a built holder, a parsed holder and a query reach one object. Delete `hydrateListStorage`; its callers (`utils.ts:155` `hydrateTriviaEntry`, the factories emitter's owner-list storage at `factories.ts:1543`) call `hydrateStored`. The trivia entry's hydration now refuses where it returned the raw coordinate; if a validation row moves because a trivia entry crossed engines on purpose, stop and report it (Global Constraints).

- [ ] **Step 4: The builder accessor hydrates**

`node-members.ts:43` emits, for a builder accessor whose storage can hold a coordinate (a slot whose read can be past depth: every node-valued slot), `${accessor.name}: () => hydrateStored(${accessor.read}),` for a single slot, and `() => storedItems(${accessor.read})` for a list slot, where `storedItems` (in `utils.ts`) hydrates each item through `hydrateStored` and freezes the array once, writing it back as `hydrateSlotsWith` does. Scalar slots (text, presence, kind-id storage) keep `() => read`: the slot's storage class (`slot.storageInfo.kind`) decides it, never the value's shape. Regenerate.

- [ ] **Step 5: Run the tests**

Run: `pnpm run validate:native` — Expected: rows unchanged.
Run: `pnpm exec vitest run packages/rust/tests/identity.test.ts` — Expected: PASS.
Run: the full unit suite (its own Bash call) — Expected: PASS.

- [ ] **Step 6: Glossary, commit**

Entries: `engine-scope.ts::hydrateStored` (replacing `hydrateListStorage`), `utils.ts::storedItems`, the `node-members.ts` accessor emission. Commit message: `feat(identity): a built node hydrates the coordinates it stores, through the registry`.

---

## Task 21: An empty list is `[]`

The census at `12644d5df`: 62 list slots whose storage is optional (`Option<Vec<…>>` in `transport.rs`, `_x?:` in `types.ts`): python 8, rust 31, typescript 23 (regex 1 and scm 8 more in `transport.rs`). No producer leaves one absent today: the reader writes `Some(vec![])` (`ReadSlot for Option<Vec<…>>::finish`, `read.rs:519`), factories store `config.x ?? []` or a rest parameter's array, and every `test-fixtures.json` holds each one present (python 791 with items and 18 empty; rust 803 and 996; typescript 818 and 978). So no fixture or factory output moves: the task makes the single representation the contract. A possibly-empty list is `Vec<T>`, a `repeat1` list `NonEmptyVec<T>` (Ruling 11); the TS storage key is never optional; a missing key is refused at the codec, and so is an empty `repeat1` list.

**Files:**
- Create: `rust/crates/sittir-core/src/non_empty.rs`, `docs/superpowers/probes/2026-10-09-relative-coordinates/list-census.py`
- Modify: `rust/crates/sittir-core/src/lib.rs` (`pub mod non_empty; pub use non_empty::NonEmptyVec;`), `rust/crates/sittir-core/src/read.rs` (`ReadSlot`), `rust/crates/sittir-core/src/prepare.rs` (`Prepare`, `EdgeItems`)
- Modify: `packages/codegen/src/emitters/render-module.ts` (`wrap` in the slot type printer, `render-module.ts:3480-3486`; the `as_deref()`/`as_mut()` reads of optional lists)
- Modify: `packages/codegen/src/emitters/types.ts:980` and `:1000` (`opt` for a multiple slot)
- Modify: `packages/common/src/utils.ts` (`hydrateSlotsWith`'s `stored == null` arm, if Step 1 shows no caller needs it)
- Modify: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, the types emitter's test file
- Generated: `rust/crates/sittir-*/src/render/transport.rs`, `packages/*/src/types.ts`

**Interfaces:**
- Produces: `sittir_core::NonEmptyVec<T>`: `Deref<Target = [T]>` and `DerefMut`, `ReadSlot` for `NonEmptyVec<SlotValue<T, A>>` and `NonEmptyVec<Option<SlotValue<T, A>>>` (an empty read refused naming the slot), `Prepare`, `EdgeItems`, and the napi codec (an empty array refused); every list storage key typed `readonly (T)[]` or `NonEmptyArray<T>`, never optional.

- [ ] **Step 1: The census as a probe**

`docs/superpowers/probes/2026-10-09-relative-coordinates/list-census.py`, run from the checkout root as `python3 $P/list-census.py <python|rust|typescript>`:

```python
"""Census of list storage keys a type marks optional, and how a grammar's fixtures hold them."""
import collections, json, os, re, sys

lang = sys.argv[1]
types = open(f'packages/{lang}/src/types.ts').read()
interfaces = re.findall(r'export interface (\w+) \{\n\s+readonly \$type: TSKindId\.(\w+);([\s\S]*?)\n\}', types)
optional = {kind: keys for _, kind, body in interfaces
            if (keys := re.findall(r'readonly (_\w+)\?: (?:readonly|NonEmptyArray)', body))}
ids = {}
for name in os.listdir(f'packages/{lang}/src'):
    if name.endswith('.ts'):
        for kind, value in re.findall(r'\b(\w+) = (\d+)', open(f'packages/{lang}/src/{name}').read()):
            ids.setdefault(kind, int(value))
wanted = {ids[kind]: keys for kind, keys in optional.items() if kind in ids}
unresolved = [kind for kind in optional if kind not in ids]
counts = collections.Counter()

def walk(value):
    if isinstance(value, dict):
        for key in wanted.get(value.get('$type'), []):
            counts['absent' if key not in value else 'empty' if value[key] == [] else 'items'] += 1
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)

walk(json.load(open(f'rust/crates/sittir-{lang}/test-fixtures.json')))
print(lang, 'optional list keys:', sum(map(len, optional.values())), 'unresolved kinds:', unresolved, dict(counts))
```

At `12644d5df` it prints `python … 8 … {'items': 791, 'empty': 18}`, `rust … 31 … {'items': 803, 'empty': 996}`, `typescript … 23 … {'items': 818, 'empty': 978}`. Extend it with the corpus: a small `list-census-corpus.mts` beside it reads every corpus file through `engine.parse(source, { depth: Infinity })` and counts list storage keys absent on read nodes. Expected: 0 absent in fixtures and in reads. A non-zero count is the work list: every absent site moves to `[]` in this task.

Two more checks, recorded in the README:
- every required multiple slot in `transport.rs` (today's non-`Option` `Vec<…>`, whose read refuses an empty list) is a slot the types emitter marks `NonEmptyArray` (`isNonEmpty`), and the reverse. A disagreement is two derivations of one fact: stop and report it.
- `hydrateSlotsWith`'s callers: if every call names a list storage key, its `stored == null ? NO_CHILDREN` arm goes in Step 4; if a collapsed-multiplicity slot reaches it with a scalar, the arm stays and the commit says which slot.

- [ ] **Step 2: Write the failing tests**

In `render-module-emit.test.ts`, on the real python model (the test's existing real-model helper):

```ts
it('prints a possibly-empty list as a Vec and a repeat1 list as a NonEmptyVec', () => {
	const rust = emitPythonTransport();
	expect(rust).toContain('pub except_clauses: Vec<::sittir_core::SlotValue<ExceptClauseTransport>>');
	expect(rust).not.toMatch(/Option<Vec</);
	expect(rust).toMatch(/pub alternative: ::sittir_core::NonEmptyVec<::sittir_core::SlotValue<CaseClauseTransport>>/);
});
```

(`MatchBlockBlock.alternative` is the python `repeat1` list; confirm against `node-model.json5` that its slot is required; if not, pick any required multiple python slot.)

In the types emitter's test:

```ts
it('types a list storage key as an array, never optional', () => {
	const types = emitPythonTypes();
	expect(types).toContain('readonly _except_clauses: readonly ExceptClause[];');
	expect(types).not.toMatch(/readonly _\w+\?: (readonly|NonEmptyArray)/);
});
```

In `non_empty.rs`'s tests:

```rust
#[test]
fn an_empty_list_is_not_a_non_empty_vec() {
    assert!(NonEmptyVec::<u8>::try_from(Vec::new()).is_err());
    let one = NonEmptyVec::try_from(vec![1u8]).unwrap();
    assert_eq!(&*one, &[1u8]);
}
```

In `read.rs`'s tests:

```rust
#[test]
fn an_empty_list_reads_as_an_empty_vec() {
    // python `try:\n  pass\nfinally:\n  pass\n`: no except clause
    let read = read_python_root("try:\n  pass\nfinally:\n  pass\n");
    assert_eq!(read.try_statement().except_clauses, Vec::new());
}
```

(Use the read helper and accessor path `read.rs`'s python tests use at the base; the assertion is that the field is an empty `Vec`, not `None`.)

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts` — Expected: FAIL, `Option<Vec<` present.
Run: `cargo test -p sittir-core an_empty_list` — Expected: FAIL to compile (`NonEmptyVec` missing; `Option<Vec<…>>` against `Vec`).

- [ ] **Step 4: Implement**

`non_empty.rs`:

```rust
use std::ops::{Deref, DerefMut};

/// A list that holds at least one item: a `repeat1` slot's storage.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NonEmptyVec<T>(Vec<T>);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EmptyList;

impl<T> TryFrom<Vec<T>> for NonEmptyVec<T> {
    type Error = EmptyList;
    fn try_from(items: Vec<T>) -> Result<Self, EmptyList> {
        if items.is_empty() { Err(EmptyList) } else { Ok(Self(items)) }
    }
}

impl<T> NonEmptyVec<T> {
    pub fn into_vec(self) -> Vec<T> {
        self.0
    }
}

impl<T> Deref for NonEmptyVec<T> {
    type Target = [T];
    fn deref(&self) -> &[T] {
        &self.0
    }
}

impl<T> DerefMut for NonEmptyVec<T> {
    fn deref_mut(&mut self) -> &mut [T] {
        &mut self.0
    }
}
```

The napi codec, under `#[cfg(feature = "napi-bindings")]`, delegates to `Vec<T>`'s and refuses an empty array on decode (`::napi::Error::from_reason("a repeat1 list holds no item")`); it goes with the object codec at the record step. `prepare.rs`: `impl<T: Prepare> Prepare for NonEmptyVec<T>` and `impl<X: EdgeItems> EdgeItems for NonEmptyVec<X>`, each delegating to the slice the way the `Vec` impls do (move the `Vec` impls' bodies onto `[T]`/`[X]` helpers both call, so the body exists once).

`read.rs`: `ReadSlot for Vec<SlotValue<T, A>>::finish` returns `Ok(acc)` (an empty list is `[]`); `ReadSlot for NonEmptyVec<SlotValue<T, A>>` has `Vec`'s accumulator and `finish` refusing an empty one with `missing(at)` (today's `Vec` behavior, moved). The same pair for the elided lists (`Vec<Option<…>>`, `NonEmptyVec<Option<…>>`). Delete `ReadSlot for Option<Vec<SlotValue<T, A>>>` and `for Option<Vec<Option<SlotValue<T, A>>>>`.

`render-module.ts`'s `wrap`:

```ts
		if (multiple) {
			const element = slotCarrier(inner, adjacent);
			const items = optionalElement ? `Option<${element}>` : element;
			return required ? `::sittir_core::NonEmptyVec<${items}>` : `Vec<${items}>`;
		}
```

and the emitter's reads of an optional list (`node.<slot>.as_deref().unwrap_or(&[])`, `if let Some(gap_items) = self.<slot>.as_mut()`) become the plain slice reads the required lists use (`&node.<slot>`, `self.<slot>.iter_mut()`).

`types.ts:980` and `:1000`:

```ts
			const opt = isRequired(f) || (isMultiple(f) && !storageInfo.collapsesMultiplicity) ? '' : '?';
```

(`storageInfo` is computed one line above; move the `opt` line below it.)

Regenerate (`pnpm run validate:native`).

- [ ] **Step 5: Run the tests**

Run: the tests above — Expected: PASS.
Run: `cargo test --workspace` — Expected: PASS; stack pins unmoved (`Vec` and `NonEmptyVec` are the size of `Option<Vec>`).
Run: `pnpm run validate:native`, then `sittir validate history` — Expected: rows unchanged.
Run: the workspace type-check (`tsc --noEmit`) — Expected: no new errors.
Run: the full unit suite (its own Bash call) — Expected: PASS.

- [ ] **Step 6: Glossary, commit**

Entries: `non_empty.rs::NonEmptyVec`, `EmptyList`; the `render-module.ts` slot type printer (no optional list; `NonEmptyVec` for `repeat1`); `types.ts` storage optionality; the `ReadSlot` impls moved; the probe's README rows. Commit message: `feat(read): an empty list is [] in the transport, the types and the codec`.

---

## Task 23: Measurements and the 1c-ii gates

The relative-coordinates spec's verifications 1–6, recorded in `docs/superpowers/probes/2026-10-09-relative-coordinates/README.md` with the commands, the base (`12644d5df`) and head commits, the machine and the numbers.

**Files:**
- Create: `docs/superpowers/probes/2026-10-09-relative-coordinates/README.md`, `query-reads.mts`, `fold-timing.mts`, `registry-heap.mts`

- [ ] **Step 1: Verification 2 is a test**

Task 19's `a descendants query over …` cases (a let declaration and a variant arm) pin it: the first query reads exactly its matches, the second reads nothing. The README names them.

- [ ] **Step 2: Verifications 1, 3 and 4 are already tests**

1: Task 19's identity tests and Task 25's query-reached write. 3: `rust/crates/sittir-parity-tests/tests/descendant_index.rs` (1c-i). 4: Task 25's fold tests. The README lists each with its test name.

- [ ] **Step 3: Verification 5: the fold's timing**

`fold-timing.mts`: for each of `docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{engine.rs,spacing.rs,create-engine.ts}`, parse once at `depth: Infinity`, then time `root.$render()` of the untouched root (median of 31 after 5 warm-ups), and the same after one leading comment on the deepest statement. Run it at the base and the head on the same inputs, alternating, in a copy outside any watched tree (`rsync` the checkout to the session scratchpad, gate on load average under 4). Like for like: same inputs, same counts, same script at both commits. Expected: the head no slower than the base beyond noise; the base's projection walk (`isUntouchedBelow`) shows in its numbers and not in the head's.

- [ ] **Step 4: Verification 6: the registry's heap**

`registry-heap.mts`: `measure-heap.mts`'s two populations, the untouched whole-tree read and "walked with every wrapped node kept", plus a query-heavy one: every `$descendants` match of every kind, held. Per wrapper: (heap with the population held − heap with the root alone) ÷ wrappers, at the base and the head, median of five after a warm-up, double gc, `--expose-gc`. The head's delta per wrapper is the registry's cost (a `Map` entry, a `WeakRef`, a finalization-registry cell). Record it; no gate. The spec asks for the number, and the record step is where it is weighed.

- [ ] **Step 5: The whole-branch gates, the PR**

- `cargo test --workspace`; the stack pins unmoved;
- `pnpm run validate:native`; `sittir validate history` against `12644d5df`, rows compared by number;
- the full unit suite, with any new failure isolated by stash-and-rerun;
- the workspace type-check (`tsc --noEmit`);
- `packages/common/src` holds no `adoptChild`, `detachAncestors`, `isUntouchedBelow`, `sameOccurrence` or `hydrateListStorage`; `rust/crates/sittir-*/src/render/transport.rs` holds no `Option<Vec<`. The refusal of a write through a query stays: 1c-ii lands with it, and the arena-tables plan's 3a removes it.

Commit the probes and README (`docs(probes): relative-coordinates verifications 1–6 for 1c-ii`). Open the PR with `Owner: sittir-engine-api` first in its body and the Q1/Q2 rulings quoted, and ask brainstorm for the whole-branch review.

---

## Outline: after step 1

- **`delimiter` becomes the render option spec A.2 lists.** Step 1 reads a list's flank from the source, because today's read sets it and prepare fills it only when it is unset. The read stops computing it once nothing needs the read value:
  - an untouched parsed list renders from its source bytes (the fold), flank included;
  - a ruling says whether an edited parsed list keeps its source flank or takes the option's.

  At that step the render side stamps `delimiter` from its site with the spacing fields at prepare, and the reader's `delimiter` and the `#[flank]` attribute go. The gate is rendered bytes unchanged on the corpus. Until that step, the reader and today's read compute it the same way, so it cannot drift from the read it replaces.
- **Stamped layout ids.** Link stamps the public-symbol id on every STRING site, duplicates and wrapped strings included, with the compile phase byte-identical. `layoutTokenIds` then reads stamps only, and 1a's listed text-resolved sites and the text lookup go.
- **Relative coordinates** (ruling 6.2), step 2 on this feature branch, re-planned against rows in `docs/superpowers/plans/2026-10-06-relative-coordinates.md`: relative points for detached data, coordinate facts derived instead of stamped, `$detach()`, and `$cst()` fetched by row. The trivia table supersedes that design's trivia step (ownership by token side, the closing gap, joins resolved at prepare, the `$sameLine` and `$tokensBetween` stamps), and it lands after step 2, in step 3. So the snapshot step keeps the trivia step 1 leaves: a snapshot carries the reader's placed trivia with its stamps, as a parity fixture does today, and the arena-tables plan's 3a later gives snapshots their range's gaps.
- **Step 3, the record wire, and both trivia tables** are a feature of their own: `docs/superpowers/plans/2026-10-10-arena-tables.md`.
