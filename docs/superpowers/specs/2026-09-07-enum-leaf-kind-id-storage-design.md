# Enum leaves are kind-id-stored

> **Status:** Design (2026-09-07). Supersedes the "through supertypes" walk
> in the strict-rebuild design; that design's emitter still depends on it.

## Problem

An enum-of-literals kind — `token_tree_punctuation` (`+ | - | , | …`),
`_primitive_type` (`u8 | … | char`), `boolean_literal` (`true | false`),
typescript's `predefined_type` and `_reserved_identifier`, every
`_<kind>_operator` — is a set of literal tokens. Its type is a union of the
tokens' kind ids and nothing else. The model does not say so: `KindStorage`
is `'kindId'` only for `AssembledKeyword` and `AssembledToken`, and an
`AssembledEnum` is `'node'`. Everything downstream follows that stamp, so an
enum leaf is a node with a `Terminal<…>` type, a text factory
(`buildTokenTreePunctuation(',')`), a coercer, and a `$text`-carrying wire
shape; a slot that holds one directly is special-cased in the storage
classifier to store ids anyway, and a slot that reaches one through a
supertype (`_delim_tokens` → `_non_special_token`) stores the node.

Two attempts to fix the supertype case in the classifier alone moved the
gates, because four consumers each derive "what does this slot hold" on
their own: the storage classifier, the wrap's text→id projection, the
types' storage union (`fieldTypeComponents` over direct values), and the
transport's accepted ids. The special case in the classifier is the second
derivation of a fact the model should stamp once.

## Decision

`AssembledEnum.storage` is `'kindId'`. An enum leaf's value set is its
members' kind ids, and every consumer reads the stamp:

- **Model.** `isKindIdStored` covers enums. `classifyValueStorage` stamps a
  reference to an enum as `{ via: 'kindId', kind, members: [{ kind, kindId,
  text }] }` — the same `via` a keyword gets, with the member set instead of
  one id and text. `storageTargetOf` is unchanged. `fixedTextOfKind` is
  `undefined` for an enum (no single text).
- **Types.** `export type TokenTreePunctuation = TSKindId.Plus | … |
  TSKindId.Comma;` — the member discriminant union, no `Terminal` wrapper.
  A slot union that includes the enum's type inlines it. `__inputHints__`
  offers the members' texts as a `KindEnum` exactly as a direct enum arm
  does today.
- **Factories, coercers, `ir`.** None for an enum leaf. A slot takes
  `TSKindId.<Member>` (or the member's text on the loose surface, coerced
  by the existing kind-enum text map). `classifyFactoryEmission` /
  `classifyFromEmission` answer skip for enums; the ir leaf loops emit
  patterns and keywords only.
- **Storage classifier.** `enumArmsOf` seats every arm whose storage
  target is kind-id-stored — a keyword, a token, or an enum's members —
  whether the arm is direct or reached through a transparent supertype,
  recursively; an arm aliased into another kind (the supertype's
  `subtypeParseNames` names a different public kind) is a node arm; any
  other arm is a node arm. The `AssembledEnum` special case in the
  classifier disappears: an enum arm is a kind-id arm like any other.
- **Wrap.** A read enum-leaf node becomes its member id: by `$type` when
  the parser symbol is the member's (`PrimitiveType`, discriminated by
  member today), by `$text` when the enum has its own parser symbol
  (`token_tree_punctuation` reads as `{ $type: 352, $text: ',' }`). The
  text→id table for a slot comes from `enumArmsOf`; `projectMixedEnumStorage`
  gains the `$text` branch `projectKindEnumStorage` already has, guarded to
  entries whose `$type` is an enum's own symbol so an identifier spelled
  `type` is never mistaken for a keyword.
- **Transport.** A bare member id routes to the enum's variant through
  every supertype above it (`resolveAcceptedTransportIds` gathers member
  ids transitively — landed). The leaf's Rust enum type and its
  `FromNapiValue` number branch stay; render prints the member's text.
- **Storage union.** `fieldTypeComponents` yields one `literal` component
  per member for a kind-id arm with members, so the emitted storage union
  (`mixedEnumStorageTypeExpr`) and the transport's per-slot enum agree
  with the classifier.

The walk through supertypes is then a consequence of the stamp, not a rule
about supertypes: `boolean_literal` in an expression slot, `predefined_type`
in a type slot and `,` in a token tree are all the same case.

## Blast radius

- Every slot holding an enum leaf directly or through a supertype changes
  its storage union and wire shape: rust's `_expression` (`boolean_literal`),
  `_type` (`_primitive_type`), token trees; typescript's `_type`
  (`predefined_type`), expressions (`_reserved_identifier`, whose parser
  symbol is its own `reserved_identifier`); every `operator` slot already
  stores ids and is unchanged. The census is the generated types diff and
  the fixture counts, both recorded in the generated commit.
- Keyword arms reached through a supertype (`this`, `self`, `!`, `_`)
  seat as ids for the first time in those slots; their types already are
  ids. The measured failure of the second attempt (rust read-render-parse
  134 → 101, fixtures 1486 → 939) is the wrap and types disagreeing, and
  is the first thing the plan diagnoses, before any regen is trusted.
- **Transport arm precedence (diagnosed).** tree-sitter-rust aliases the
  primitive tokens onto `identifier` in `_path`, `_pattern` and
  `_expression_except_range`, so the alias wire-id map legitimately lists
  the ids of `u8`…`char` (and `default`/`union`/`gen`) under `identifier`.
  The map is keyed by kind, not by occurrence, so the `_type` supertype
  transport's `Identifier` variant claims those ids too, and its arms are
  emitted before `PrimitiveType`'s: a bare member id in a type slot
  decodes as an empty identifier (`fn f(a: u8)` renders `a:`; the
  `let x: u8`, `Vec<u8>` failures share the cause). The per-slot transport
  enum already orders enum variants first; the supertype enum must apply
  the same rule, from one shared ordering: arms of kind-id-stored
  subtypes precede alias wire-id arms of pattern subtypes.
- The enum leaf factories, coercers and `Terminal` types leave the
  packages; `docs/factory-surface-issues.md` gains nothing, since a slot
  spelled `TSKindId.Comma` is the surface.

## Verification

- Unit: `classifyValueStorage` on an enum ref yields `via: 'kindId'` with
  the member set; `enumArmsOf` seats a direct enum, a supertype-reached
  enum, a keyword, and refuses an aliased-into-another-kind arm;
  `fieldTypeComponents` yields per-member literals; the wrap projection
  maps `{ $type: <own symbol>, $text: ',' }` to the member id and leaves
  `{ $type: Identifier, $text: 'type' }` alone.
- Regen all three grammars; byte gate identical; every validation floor
  identical (rust 149/149 · 207/207 · 134/137 · 1517/1517; typescript
  145/145 · 193/193 · 112/114 · 1202/1202; python 126/126 · 142/142 ·
  115/116 · 1390/1390); fixture counts unchanged (rust 1486 render).
- `examples/17-dogfood-rust-strict.ts` spells its token trees with
  `TSKindId.Comma` and type-checks.
