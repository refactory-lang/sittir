# Rust Slot Surface Contract — Architectural Design

**Status:** Draft, 2026-05-13
**Branch:** `023-native-read-parity`
**Related:** `docs/superpowers/specs/2026-05-12-slot-debt-cleanup-design.md`, ADR-0018 (NodeData surface), spec 012 (Rust core port), spec 023 (native read parity)

This design narrows the slot-arity contract for the Rust path only. It does not redesign the raw native payload. Instead, it makes the target shape of each actual surface explicit so implementation can stop conflating typed storage, wrap, validator reconstruction, native read transport, native render transport, template input, factory config, and widened `from()` input.

## 1. Scope

In scope:

- Rust-only slot arity rules across the actual surfaces that exist today.
- The target contract for named and unnamed slots under the same matrix.
- Which layers normalize from grammar metadata and which remain raw transport.
- The changes required to move current Rust behavior to the target state.

Out of scope:

- JS/Nunjucks surfaces.
- Redesigning the raw native read payload into a schema-carrying format.
- Adding storage-side or transport-side coercion beyond grammar-agnostic behavior already allowed there.
- Runtime value validation beyond the agreed singular-slot mismatch throw in wrap / validator reconstruction.

## 2. Problem

The current Rust path uses more than one slot surface:

1. grammar-shaped generated storage types
2. partly normalized wrap output
3. raw native read transport
4. generated native render transport
5. Askama-facing template views
6. user-facing config / widened input surfaces

Those surfaces currently disagree in important ways, especially for singular unnamed children and repeated slots that realize as one value in transport. The result is drift: some layers preserve realized shape, some preserve grammar shape, and some partially normalize only in accessors.

The implementation needs a target contract that says, for each surface, what `0-1`, `1`, `0-many`, and `1-many` mean and whether that surface is supposed to be grammar-shaped or raw transport.

## 3. Design principles

1. **Treat named and unnamed slots uniformly.** Surface contracts are about slot arity, not slot naming.
2. **Normalize from grammar metadata only in interpretation layers.** Wrap and validator reconstruction are schema-aware; raw transport is not.
3. **Do not add storage/transport coercion unless it is grammar-agnostic.** Grammar-specific normalization belongs after transport.
4. **Keep config/input ergonomics distinct from storage.** A user-facing config surface may stay looser than the storage surface it resolves into.
5. **Keep render transport/template surfaces explicit.** They are not the same as raw `NodeData` or typed storage.

## 4. Approaches considered

### 1. Wrap + validator normalization

Keep native read payload raw, and make wrap / validator reconstruction the grammar-aware normalization layers.

Pros:

- preserves the existing native payload boundary
- fixes the places that actually need schema information
- aligns with the current layering

Cons:

- leaves several surfaces to document and keep in sync

### 2. Transport redesign

Change native read transport to carry explicit slot schema.

Pros:

- payload itself becomes self-describing

Cons:

- invasive
- duplicates grammar metadata into the transport
- unnecessary if wrap / validator already know the grammar

### Recommendation

Use **wrap + validator normalization** and explicitly document the target contract for every Rust surface.

## 5. Target surface matrix

**Legend for change tags**

- **no** — no material surface-shape change required
- **partial** — only part of the current surface differs
- **yes** — a real surface-shape change is required

| Surface | Source of truth | `0-1` | `1` | `0-many` | `1-many` | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **Typed storage** | generated `packages/rust/src/types.ts` | optional single **(partial)** | required single **(partial)** | required array, empty allowed **(yes)** | required non-empty array **(no)** | Applies uniformly to named slots (`_<name>`) and unnamed children (`$children`). The current partial mismatch is mainly singular unnamed children still typed through tuple/list-like shapes instead of the final slot contract. |
| **Wrap** | generated `packages/rust/src/wrap.ts` | optional single **(partial)** | required single **(partial)** | required array, empty allowed **(yes)** | required non-empty array **(yes)** | Wrap is grammar-aware. It must normalize from grammar metadata for both named and unnamed slots. If a singular slot arrives with multiple realized values, wrap throws. No storage/transport coercion beyond this normalization. |
| **Validator `nodeToConfig`** | generated validator metadata + `packages/codegen/src/validate/common.ts` | optional single config value **(yes)** | required single config value **(yes)** | required array config value, empty allowed **(yes)** | required non-empty array config value **(yes)** | Validator reconstruction must use generated slot metadata rather than payload shape (`Array.isArray(...)`, hardcoded unnamed-children-many, etc.). Singular mismatch throws. |
| **Native read payload / boundary** | `sittir-core` `NodeData` boundary | raw transport, not schema-shaped **(no)** | raw transport, not schema-shaped **(no)** | raw transport, not schema-shaped **(no)** | raw transport, not schema-shaped **(no)** | This surface remains runtime transport only. It does not normalize from grammar metadata. Realized shape may differ from storage/config shape. Downstream wrap/validator perform grammar-aware normalization. Grammar-agnostic coercion remains allowed here if needed. |
| **Native render transport** | generated `rust/crates/sittir-rust/src/render/transport.rs` | `Option<TTransport>` **(partial)** | `TTransport` **(partial)** | `Vec<TTransport>` **(yes)** | `Vec<TTransport>` **(yes)** | Repeated render transport becomes uniformly list-shaped; `OneOrMany` goes away for repeated slots. Singular cells are partial today because singular children still collapse through list-like transport in some places. Grammar-agnostic hoisting/coercion for literals, booleans, etc. is still allowed here. |
| **Native template input** | generated Askama template structs + `sittir-core` view types | `OptionalNonterminalView` **(partial)** | `SingleNonterminalView` **(partial)** | `ListNonterminalView` **(no)** | `ListNonterminalView` **(no)** | This is the final render-facing arity surface. `0-many` and `1-many` intentionally share the same list view; any non-empty invariant for `1-many` is enforced earlier. Grammar-agnostic hoisting/coercion for literals, booleans, etc. is still allowed here. |
| **Factory config** | generated `Config` types | optional single **(no)** | required single **(no)** | optional array, default `[]` **(no)** | required non-empty array **(no)** | This remains the user-facing config contract. `SlotClass` rules still exist to support rest-parameter ergonomics and avoid config-type nesting. |
| **From/Loose input** | generated widened input types | optional single ergonomic input **(no)** | required single ergonomic input **(no)** | optional single-or-array ergonomic input **(no)** | single-or-non-empty-array ergonomic input **(no)** | This surface remains intentionally wider than storage/config. Resolution uses grammar metadata and flows into the stricter downstream contracts. |

## 6. Surface-specific clarifications

### 6.1 Typed storage

Typed storage is the grammar-shaped source of truth for generated node interfaces. It is the contract wrap should materialize, not the contract the raw native payload needs to satisfy directly.

### 6.2 Wrap

Wrap is the first grammar-aware normalization layer. It must:

- normalize singular slots to single values
- normalize repeated slots to arrays
- treat named and unnamed slots the same way
- throw on singular mismatch

The current bug class is exactly that wrap sometimes preserves realized payload shape instead of materializing the typed-storage contract.

### 6.3 Validator reconstruction

`nodeToConfig` should be the config-surface analogue of wrap:

- grammar-aware
- slot-metadata-driven
- not based on realized payload shape

This is the second place where arity must be reconstructed from schema rather than inferred from transport.

### 6.4 Native read payload

The raw native payload remains a transport boundary, not a grammar contract.

That means:

- named fields may arrive scalar or array-shaped depending on realized multiplicity
- `$children` may remain array-shaped whenever present
- the payload alone is not enough to recover declared slot arity

This is acceptable because downstream layers own the schema-aware normalization.

### 6.5 Native render transport and template input

These two surfaces are separate from the raw read payload.

- render transport is a generated typed bridge into native rendering
- template input is the final Askama view layer

Both may still apply grammar-agnostic hoisting or coercion for literals, booleans, and similar cases. That does not change the rule that grammar-specific arity normalization belongs in wrap / validator rather than the raw payload.

### 6.6 Factory config and widened input

Config remains the explicit user-facing construction contract. `from()` / Loose input remains ergonomic and wider. The distinction is intentional:

- config is what factories expect
- Loose input is what convenience resolution accepts
- both eventually resolve into the stricter storage/wrap/config contracts

## 7. Required implementation consequences

1. **Wrap emitter**
   - remove hardcoded unnamed-child `many` assumptions
   - normalize repeated slots to arrays and singular slots to single values from grammar metadata
   - preserve `1-many` non-empty semantics

2. **Validator metadata + reconstruction**
   - carry enough slot metadata to reconstruct named and unnamed slots uniformly
   - remove payload-shape inference as the source of arity

3. **Native render transport**
   - replace repeated-slot `OneOrMany` transport with list-shaped transport
   - keep singular transport explicit

4. **Native template input**
   - preserve the final view split: optional / single / list
   - rely on earlier layers for any `1-many` non-empty enforcement

5. **No raw payload redesign**
   - do not turn native read payload into a schema-carrying contract as part of this work

## 8. Validation strategy

- Focus on Rust first.
- Add regression cases that distinguish singular-vs-repeated behavior for both named and unnamed slots.
- Verify that wrap storage, validator reconstruction, render transport, and template input all match the target matrix.
- Keep native read payload tests separate so the raw boundary contract stays explicit and does not silently drift toward schema-shaping.

## 9. Expected outcome

- A single Rust-only target contract that says what each surface means.
- Wrap and validator stop leaking realized transport shape into grammar-shaped surfaces.
- Native render transport becomes simpler for repeated slots.
- Future arity work can discuss a surface precisely instead of saying “NodeData” and meaning three different things.
