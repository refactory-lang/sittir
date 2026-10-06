# Typed Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read a parsed node natively into its kind's generated transport, with routing, storage and trivia placement done by a cursor reader that a derive macro expands from codegen-stamped attributes. Prove the read equal to today's read, wrap and detach for every corpus node of the five grammars (PR 1a). The derive then replaces the napi object codec (PR 1b), and every consumer switches to the typed read (PR 1c).

**Architecture:** Codegen keeps emitting today's transport structs and choice enums. It adds `#[derive(::sittir_core::Transport)]` and helper attributes for every read fact a type cannot state:

- route field, presence keyword and separators;
- layout tokens, inner gaps and minimum depth;
- interior, envelope, and a list's flank and separator kind;
- each choice variant's ids, and a choice's blank arm.

A new proc-macro crate expands each declaration into a `ReadTransport` impl that walks one `tree_sitter::TreeCursor`. `sittir_core::read` holds the runtime:

- depth;
- coordinates as tree and row;
- the trivia placement rule;
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

Brainstorm split step 1 of the spec into three PRs. This plan writes 1a in full and outlines 1b and 1c; their tasks are detailed after 1a lands, against the code 1a leaves.

1a is cut from master at or after `efbf817b9`, where enum members cross the transport as their kind ids and decode by id alone. Tasks 5, 8 and 9 build on what that brought: `enumMemberId` and the decoder `arms` in `renderEnumType`, `AssembledEnum`'s refusal of two members with one id, and the wrap's `_spelledMemberId` fold. Task 10's harness compares against today's read with those folds.

| PR | Lands | Gate |
| --- | --- | --- |
| **1a** | the typed reader beside today's read: field-id constants, the `sittir_core::read` runtime, the derive crate, codegen attributes with the unfielded-slot diagnostic, and the corpus parity harness | zero refusals and zero differences against today's read, wrap and detach for every corpus entry of the five grammars; rendered bytes and validation rows unchanged |
| **1b** | the derive's napi codec replaces `#[napi(object)]` and the hand-printed `FromNapiValue` impls | render-neutral (verification 15), measured against master as 1b starts, whose enum members decode by kind id; build time and binary size per crate; standalone `type-check:native` passes and is chained into `type-check`; the typed read's root stack cost in the dev profile at most today's read's |
| **1c** | every read goes through the typed reader; the wrap keeps members only; today's reader and its tables are removed; an empty list is `[]` in reads, factories and fixtures | rendered bytes and validation rows unchanged; the fixture and factory moves of the empty-list form listed; verification 3–8; "two readers must not outlive step 1" |

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

Gates: the global list. `kind_ids.rs` must not change: `kindConstName` is the same expression. (A grammar's alias symbols, which have a parser id and no kind row of their own, get constants in Task 9 through `kindConstants`; that is the one place `kind_ids.rs` grows.)

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

## Outline: 1b, the derive's napi codec

Detailed against the code 1a leaves. The derive gains the wire codec the spec lists as its third expansion, in today's object form (ruling 6). The work:

1. `#[derive(Transport)]` expands `FromNapiValue` and `ToNapiValue` for every transport type from the same declaration: struct fields by their wire keys, choices by kind id, enum kinds and fixed literals by id, text leaves from their string or object forms, and blank arms by the blank id.
   - Codegen stops printing `#[napi(object)]` and the hand-printed impls: `renderLeafTransportNapiImpls`, `emitTransportEnumFromNapiValueBody` and its callers, `fixedLiteralNapiImpls`, `renderBoxedEnumNapiImpls`, and the enum decoders in `renderEnumType`.
   - The trial arms Task 9 left unexpressed are settled first, as rulings from Task 10's report.
2. The decode Task 10 compares against is then the derive's own. The parity harness keeps running against today's wrap output until 1c removes it.
3. **Gates:**
   - Render-neutral (verification 15): rebuilt render's cost per slot value with `measure-rebuilt.mts`, back to back on this branch and on its base, master as 1b starts, per grammar, the native call and the projection measured separately. The same script, inputs and population at both commits. The base decodes enum members by kind id and the phase 0 merge does not, so the phase 0 merge is not a like-for-like base.
   - Build time, peak memory and binary size per grammar crate, before and after, with the same commands, outside watched worktrees (verification 12).
   - The standalone native type-check, which waits for the derive codec, passes: `pnpm run type-check:native` on its own, then chained into `pnpm run type-check`.
   - Stack: the typed read's root cost in the dev profile is at most today's read's, measured as Task 11's depth test measures it. 1a leaves it at 375 KiB against 39 KiB, from the `source_file` to item chain. The expected route is boxing the dominant variants, `FunctionItem` and the statement choices, by a pinned list of kinds that generated `const` size assertions check; 1b changes the transport types anyway.
   - Rendered bytes and validation rows unchanged.

## Outline: 1c, one reader

Every read goes through the typed reader, and the wrap attaches members only. "Two readers must not outlive step 1": 1c removes today's reader in the same PR that switches the last consumer. The work:

1. **Engine API:**
   - `ParseOptions.depth: number` replaces `deep` (ruling 2): default 1, `Infinity` for everything, a kind's `min_depth` applied by the reader.
   - `parse` returns the root's wrapped node.
   - Hydrating a coordinate is one native call: `read_at::<AnyTransport, AnyTransport>` at the coordinate's row, one level or the kind's `min_depth`.
   - A refusal fails the parse or the hydration that meets it, naming the kind, the child and the row, through `EngineGrammar::kind_name` (ruling 7).
2. **Coordinates:** the tree and the row (ruling 1). The node table, `HandleMint`, and the `$handle`, `$parentHandle`, `$treeHandle` and `$childIndex` forms go. The render side's `SlotValue::Coord` takes the row in place of the handle.
3. **Members and parent links build on accessor identity and in-place trivia**, which master has had on today's wire since `f4a78b7fb`. There, an accessor writes the child it hydrates back into the parent's slot, which is ruling 11's "the parent keeps the wrapper". `adoptChild` records each child's parent in a weak map, and when a trivia writer changes a parsed node, `detachAncestors` follows those links so no ancestor folds to its pre-edit bytes (`canFold`); the maintainer ruled that ancestors are mutated, for parsed nodes only. 1c keeps all of it and reimplements none of it. Every path that hands out a node calls `adoptChild`:
   - an accessor's hydration, including a row read (`read_at`) of a coordinate;
   - a query result, through the path walk below;
   - the parsed root's own children.

   A query result is the node its parent's slot holds, not a second wrapper. The typed reader's cursor walk gives each match its child-index path from the facet node: at each step, the slot that holds the next node and the node's index in that slot. JS follows the path down through the slots with `hydrateSlot` (`hydrateSlots` for a list), and both adopt every node they hand out. No arena is needed: from 1c on, query views hand out the nodes their parents' slots hold.

   A match that its slot stores as a scalar is the stored value the accessor returns: a fixed-text leaf is its kind id, and an enum member is its member id. These are plain data, so 1c stops wrapping a fresh node for them, and `engine.query` on such a leaf gives an empty facet.

   Every query result now has a recorded parent, so 1c lifts the refusal of a `$trivia` write on a node reached through a query. That refusal is the "reached outside its parent's accessors" error in `packages/common/src/utils.ts`. 1c's test:
   - reaches one node through a query and through its parent's accessors, and checks that both return the same object;
   - reaches rust `self` in `self.x`, which `field_expression`'s `value` slot stores as its kind id (`ExpressionTransport::Self_`), through a query and through the accessor, and checks that both give the same kind id;
   - writes the same `$trivia` through each path, in two parses of one source;
   - checks that the two renders are byte-identical.

   1c's tasks are detailed against master at or after `f4a78b7fb`, where these names live.
4. **The wrap** attaches members only (§ What the JavaScript wrap keeps), and a child within the depth gets its members on first access. Removed from every wrap:
   - `modelSlots`, the `normalize…` and `coerce…` helpers and the enum projections, with their text-to-id tables (`kindEnumTextIdPairs`): the reader folds every member by kind id, so no member is folded by its text any more;
   - `readTerminalFromOther`, `_aliasEnvelope`, the spelling helpers and the text-leaf return they feed (`_isReadTextLeaf`), `_projectLexed` and `_wrapTrivia`;
   - `dropWireDelimiters`, `_hasSeparatorFlank`, `_separatorKindOf`;
   - stub hydration (`hydrateSelf`, `hydrateChild`), the `_ROUTES_<Kind>` tables and `_LIST_OWNER_KINDS`.
5. **One form for an empty list.** The maintainer ruled that an empty list slot is `[]`, never absent and never `undefined`, for `repeat` and `optional(repeat1)` alike, in reads, factories and fixtures. 1a keeps today's split so that its parity holds: an empty `optional(repeat1)` reads as absent (`min = 1`). 1c ends the split:
   - 1c starts with a census of the list slots whose value can be absent today: every stored list key the generated types mark `?`, by grammar, kind and slot. Item 8's gate checks each fixture and factory move against it.
   - The reader reads every empty list as `[]`. `min = 1` stays only on a list that must not be empty (`repeat1`), whose empty read is a missing child.
   - An optional list's transport field becomes `Vec<T>`, the arity § The transport declaration states, so the codec refuses a list that crosses absent.
   - A factory's input may omit a list, and the factory stores `[]`, so a built node has the one form too.
   - No list slot is optional: its stored key and its accessor have no `?` and no `| undefined` on the list itself. Today the key has it (`ClassDeclaration`'s `_decorator?:`) and the accessor does not (`decorators(): readonly Decorator[]`). The item type may still admit `undefined`, for a hole in an elided list (typescript's `[a, , b]`): a hole is a position in the list, not an absent slot.
   - The parity harness goes with today's reader (item 6), and with it its normalization rows: the text leaves today's read returns without slots. The typed reader is then the only read. Such a node's empty list is `[]`, and its absent blank option is its blank arm, as the blank-option rule already reads it (typescript's `{}` and its `terminator`).
6. **Removed from native code:**
   - `read_untyped_node.rs` (`UntypedNode` reading, `ReadDepth`, `HandleMint`, `ReadModel`, the stub and leaf readers, the per-node trivia read);
   - `UntypedNode`, `FieldValue` and `NodeHandle`;
   - the JSON returns of `parse_and_read`, `read_root` and `read_untyped_node`;
   - `read_slots`;
   - `stores_scalar` and `inner_gap_key` in each `kind_ids.rs`, and the `ReadModel` impls;
   - the transitional `typed_read_refusal` and `typed_read_parity`;
   - Task 3's placement driver.
7. **Removed from `@sittir/common` and `@sittir/types`:** `modelSlots`, the storage coercions, the stub machinery (`isStub`, `hydrateStub`), and the transitional `typedReadRefusal` and `typedReadParity` on the engine diagnostics (`EngineDiagnostics`, `NativeLanguageEngine`, `NativeEngineLike`).
8. **Gates:**
   - rendered bytes and validation rows unchanged. The detached render of a node today's read holds as text, `{}` among them, keeps its text now that its typed transport carries an empty list;
   - item 5's fixture and factory moves, each at a slot on item 5's census, from nothing to `[]`. A move at any other slot, or of any other shape, stops the work;
   - read parity (verification 3) by the validators that today read through the wrap, now reading through the typed reader with members attached;
   - depth (4), identity (6), unrouted children (7) and trivia ownership (8, `sittir tool trivia-placement`);
   - members on first access (5), with two `measure-heap.mts` populations:
     - the untouched whole-tree read;
     - a query-heavy one, a whole-file `$descendants` over the corpus, which the probe gains.

     Each is reported against master as 1c starts, like for like, so the ancestors the path walk hydrates are measured rather than assumed;
   - query results: item 3's test, the same object through a query and through accessors, and byte-identical renders of the same `$trivia` write;
   - type-check time (13), and the full suite.

## Outline: after step 1

- **`delimiter` becomes the render option spec A.2 lists.** Step 1 reads a list's flank from the source, because today's read sets it and prepare fills it only when it is unset. The read stops computing it once nothing needs the read value:
  - an untouched parsed list renders from its source bytes (the fold), flank included;
  - a ruling says whether an edited parsed list keeps its source flank or takes the option's.

  At that step the render side stamps `delimiter` from its site with the spacing fields at prepare, and the reader's `delimiter` and the `#[flank]` attribute go. The gate is rendered bytes unchanged on the corpus. Until that step, the reader and today's read compute it the same way, so it cannot drift from the read it replaces.
- **Relative coordinates** (ruling 6.2), re-planned against rows: relative points for detached data, coordinate facts derived instead of stamped, `$detach()`, and `$cst()` fetched by row.
- **The record wire** (ruling 6.3). Its plan lands only past the gate on the record step: records must match or beat napi objects on read time, both one node per call and every match in one call, and on retained heap per node, as well as beating them on render decode. The object wire's numbers are re-taken in the engine beside the records'. The first thing the step attacks is the view's overhead: the `$with` and `$trivia` closures a view makes over its record, about 1.9 KB a node in the like-for-like re-take. At that step `#[napi(object)]` and the derive's object codec give way to records, and a parsed node's literal holds a reference to its record (ruling 4).
