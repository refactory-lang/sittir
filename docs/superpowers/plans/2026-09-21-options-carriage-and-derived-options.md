# Options Carriage and Derived Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-node spacing on the Rust side shrinks to base edges plus the list facts a node really carries, every other site is read from the resolved vector, and the TypeScript `Options` type is derived from the node interfaces plus one template type per kind.

**Architecture:** The render sink owns the resolved options, so a site with no per-node carrier is written as `w.site(SITE)` and a stamped one as `w.site_with(arm, strength)`; that removes the adapter the per-node fields existed for. Every transport gets two base fields, `before` and `after`, filled by the same `edge_arms` lookup coordinates already use; seated element gaps fill the element's own `after` through a generated per-slot table from kind id to site, replacing the per-list match blocks. `options.rs` keeps its site tables and resolves a nested options object by walking a static address trie, so the per-address structs go. `options.ts` becomes one template type per kind and a generic `Options` in `packages/types`.

**Tech Stack:** Rust (sittir-core, generated render crates, napi-rs), TypeScript codegen emitters (`render-module.ts`, `render-body.ts`, `render-options-rs.ts`, `options.ts`), vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-09-preference-address-design.md`, section "Amendments (2026-09-21)".

## Global Constraints

- Kind edges are two fields in every transport's shared base (spec: "Kind edges live in the transport base").
- A seated sibling gap fills the preceding element's own base `after`; the element carrier gains nothing; seat resolution is a generated per-slot table from element kind id to site index, not a match over element kinds (spec: "A sibling gap is the preceding element's own `after` edge").
- A token seam and a list flank have no per-node carrier; render reads the resolved vector at the site (spec: "A token seam has no per-node carrier"). Flank *addresses* stay in this plan; retiring them as addresses is the spec's "What this retires" table and is not done here.
- The list transport keeps its two separator gap fields and its `separator_kind` and `delimiter` fields: the classifier stamps them and they are list facts.
- `options.rs` reads through the dense vector; the per-address `Option<u16>` structs go (spec: "Reading").
- `Options` in TypeScript is derived from the node interfaces plus a per-kind template type; no `AddressRoot`/`AddressBranch`/`AddressLeaf` tables (spec: "The TypeScript `Options` type is derived, not tabulated").
- Every regenerated grammar renders byte-identical: the dogfood render-bytes fixtures, `validate:native` rows and the corpus round-trip are the gate for each Rust task; a diff is a stop-and-report, never a re-pin.
- No source comments in `packages/codegen/src/`; new and changed functions get glossary entries under `docs/glossary/`.
- Generated outputs are never hand-edited; every codegen edit is followed by regenerating all three grammars and committing the manifests with the source. Never `--no-verify`.
- Pathspec commits only. This checkout is shared with the peer session and switches branches; do the work in a git worktree off `origin/feat/bindings-vocabulary` with the main tree's `node_modules` symlinked in so the pre-commit ratchet runs.
- Gates before push: `pnpm run type-check`, `pnpm run lint` (the `.specify/extensions/security-review` errors are pre-existing), `cargo test -p sittir-core`, the targeted vitest files, `pnpm run validate:native` then `pnpm run validate:history` compared row by row, `pnpm run gen:examples` with the render-bytes test, and the generated node suites. Run vitest as its own Bash call.

---

## File Structure

| file | responsibility |
| --- | --- |
| `rust/crates/sittir-core/src/options.rs` (modify) | `ResolvedOptions.sites` (default arm and strength per site) and `site_arm(site)`; `Edges` and the `Edged` trait. |
| `rust/crates/sittir-core/src/render.rs` (modify) | `RenderSink::site(site)`; the writer holds `&ResolvedOptions`. |
| `rust/crates/sittir-core/src/spacing.rs` (modify) | `SpacingWriter` takes the options and implements `site`. |
| `rust/crates/sittir-core/src/prepare.rs` (modify) | `Prepare` for the base edges through `edge_arms`. |
| `packages/codegen/src/emitters/render-module.ts` (modify) | Base fields on every transport, `Edged` impls, edge and seat fills, no seam fields, no `Seamed` wrapper. |
| `packages/codegen/src/emitters/render-body.ts` (modify) | Seams print as `w.site(SITE)`; edges as `w.edge(...)`. |
| `packages/codegen/src/emitters/render-options-rs.ts` (modify) | `SITE_SPECS`, `SEATS_*` tables, the address trie and the generic resolver; no per-address structs. |
| `packages/codegen/src/emitters/options.ts` (modify) | Emits `Tok`/`Repeat`/`Sep` template types per kind and the `Options` alias over the generic. |
| `packages/types/src/options.ts` (create) | The generic `Options` derivation: `Sites`, `TokSites`, `RepeatSites`, `ElementSites`. |
| `docs/glossary/emitters.md`, `docs/glossary/packages-types.md` (modify) | Entries. |

---

### Task 1: The sink owns the options; every transport has edges

**Files:**
- Modify: `rust/crates/sittir-core/src/options.rs` (`ResolvedOptions` at the `pub struct` block; `edge_arms`)
- Modify: `rust/crates/sittir-core/src/render.rs` (`RenderSink` trait)
- Modify: `rust/crates/sittir-core/src/spacing.rs` (`SpacingWriter` constructor and the `RenderSink` impl)
- Modify: `rust/crates/sittir-core/src/prepare.rs`
- Modify: `rust/crates/sittir-core/src/engine.rs` (where the writer is constructed per render)
- Test: `rust/crates/sittir-core/tests/prepare.rs`, `rust/crates/sittir-core/tests/view.rs`

**Interfaces:**
- Consumes: `ResolvedOptions { spacing, delimiter, indent, edges }`, `EdgeSite`, `SeamArm`, `CoordinateEdges`, `SEAM_DECLARED` (all in core today).
- Produces:
  ```rust
  /// Per site, in vector order: the default arm and the strength a default carries.
  pub struct SiteSpec { pub default_arm: u16, pub strength: u8 }
  // ResolvedOptions gains:
  pub sites: &'static [SiteSpec],
  pub fn site_arm(&self, site: usize) -> SeamArm   // arm = spacing[site]; strength = if arm == default { spec.strength } else { SEAM_DECLARED }
  /// The two edges every transport carries in its base, arms only; strength comes from the edge row at write time.
  #[derive(Debug, Clone, Copy, Default)]
  pub struct Edges { pub before: Option<u16>, pub after: Option<u16> }
  pub trait Edged { fn kind_id(&self) -> KindId; fn edges(&self) -> &Edges; fn edges_mut(&mut self) -> &mut Edges; }
  // RenderSink gains:
  fn site(&mut self, site: usize);                    // = site_with(options.site_arm(site))
  fn edge(&mut self, kind: KindId, side: Side, arm: Option<u16>);  // stamped arm or the edge row's arm, with the row's strength
  pub enum Side { Before, After }
  ```

- [ ] **Step 1: Write the failing tests**

In `rust/crates/sittir-core/tests/prepare.rs` add, using the existing test helpers in that file for a `ResolvedOptions` and a sink:

```rust
#[test]
fn site_arm_uses_the_spec_strength_for_the_default_and_declared_otherwise() {
    let opts = ResolvedOptions {
        spacing: vec![7, 9],
        delimiter: vec![],
        indent: "  ".into(),
        edges: &[],
        sites: &[SiteSpec { default_arm: 7, strength: 2 }, SiteSpec { default_arm: 7, strength: 2 }],
    };
    assert_eq!(opts.site_arm(0), SeamArm { arm: 7, strength: 2 });
    assert_eq!(opts.site_arm(1), SeamArm { arm: 9, strength: SEAM_DECLARED });
}

#[test]
fn a_sink_writes_a_site_from_the_options_it_holds() {
    let opts = /* as above */;
    let mut w = SpacingWriter::new(&opts, /* whitespace table the file already builds */);
    w.text("a").unwrap();
    w.site(1);
    w.text("b").unwrap();
    assert_eq!(w.finish(), "a b"); // arm 9 is the space arm in the table this test builds
}

#[test]
fn an_edged_transport_prepares_its_edges_from_the_edge_row() {
    struct Leaf { edges: Edges }
    impl Edged for Leaf { /* kind_id = KindId(3); edges / edges_mut return the field */ }
    let opts = ResolvedOptions { spacing: vec![5, 6], edges: &[EdgeSite { kind: 3, before: EdgeSlot { site: 0, default_arm: 5, strength: 2 }, after: EdgeSlot { site: 1, default_arm: 6, strength: 2 } }], sites: &[/* two specs */], ..Default::default() };
    let mut leaf = Leaf { edges: Edges::default() };
    prepare_edges(&mut leaf, &RenderContext { options: &opts, sources: &NoSources });
    assert_eq!(leaf.edges, Edges { before: Some(5), after: Some(6) });
}
```

Read `EdgeSlot`'s actual field names in `options.rs` before writing the third test and use them.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cargo test -p sittir-core --test prepare`
Expected: compile errors, `SiteSpec`, `site_arm`, `Edges`, `Edged`, `prepare_edges`, `RenderSink::site` do not exist.

- [ ] **Step 3: Implement in core**

`options.rs`:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiteSpec { pub default_arm: u16, pub strength: u8 }

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Edges { pub before: Option<u16>, pub after: Option<u16> }

pub trait Edged {
    fn kind_id(&self) -> crate::types::KindId;
    fn edges(&self) -> &Edges;
    fn edges_mut(&mut self) -> &mut Edges;
}

impl ResolvedOptions {
    pub fn site_arm(&self, site: usize) -> crate::slot::SeamArm {
        let arm = self.spacing[site];
        let spec = &self.sites[site];
        let strength = if arm == spec.default_arm { spec.strength } else { crate::spacing::SEAM_DECLARED };
        crate::slot::SeamArm { arm, strength }
    }
    /// The arm and strength a kind's edge writes: the stamped arm when one is set, else the edge row's resolved arm.
    pub fn edge_arm(&self, kind: crate::types::KindId, side: Side, stamped: Option<u16>) -> Option<crate::slot::SeamArm> {
        let row = self.edges.binary_search_by_key(&kind.0, |e| e.kind).ok().map(|i| &self.edges[i])?;
        let slot = match side { Side::Before => &row.before, Side::After => &row.after };
        if slot.site == u16::MAX { return None; }
        let arm = stamped.unwrap_or(self.spacing[slot.site as usize]);
        let strength = if arm == slot.default_arm { slot.strength } else { crate::spacing::SEAM_DECLARED };
        Some(crate::slot::SeamArm { arm, strength })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side { Before, After }
```

`edge_arms` (the coordinate path) is rewritten to call `edge_arm(kind, Side::Before, None)` and `edge_arm(kind, Side::After, None)` so there is one derivation.

`prepare.rs`:

```rust
pub fn prepare_edges<T: Edged>(t: &mut T, ctx: &RenderContext<'_>) {
    let kind = t.kind_id();
    let edges = t.edges_mut();
    if edges.before.is_none() { edges.before = ctx.options.edge_arm(kind, Side::Before, None).map(|a| a.arm); }
    if edges.after.is_none() { edges.after = ctx.options.edge_arm(kind, Side::After, None).map(|a| a.arm); }
}
```

`render.rs`: add to `RenderSink`:

```rust
fn site(&mut self, site: usize);
fn edge(&mut self, kind: crate::types::KindId, side: Side, stamped: Option<u16>);
```

`spacing.rs`: `SpacingWriter` gains `options: &'a ResolvedOptions` in its constructor, and:

```rust
fn site(&mut self, site: usize) {
    let SeamArm { arm, strength } = self.options.site_arm(site);
    self.site_with(arm, strength);
}
fn edge(&mut self, kind: KindId, side: Side, stamped: Option<u16>) {
    if let Some(SeamArm { arm, strength }) = self.options.edge_arm(kind, side, stamped) { self.site_with(arm, strength); }
}
```

`engine.rs`: pass the engine's resolved options where the writer is constructed. `NodeCoordinate::write_between_edges` keeps its shape; `CoordinateEdges` stays for coordinates.

- [ ] **Step 4: Run the core tests**

Run: `cargo test -p sittir-core`
Expected: PASS. The generated crates do not compile yet (no `sites` field in their `ResolvedOptions` constructor); that is Task 2's first step.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): the sink owns the resolved options; transports carry base edges filled from the edge rows" -- rust/crates/sittir-core
```

---

### Task 2: Every transport carries base edges; kind-edge fields go

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (`TRANSPORT_METADATA_FIELDS`; `prepareStructImpl` at lines 2848–2875; the struct field emission near lines 2975–3005; the `KindOf` impl emission)
- Modify: `packages/codegen/src/emitters/render-body.ts` (the seam printer near line 5688)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`renderOptionsRs`: emit `SITE_SPECS`, and `sites: SITE_SPECS` into the `ResolvedOptions` constructor)
- Test: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`, `render-options-rs.test.ts`

**Interfaces:**
- Consumes: Task 1's `Edges`, `Edged`, `prepare_edges`, `RenderSink::edge`, `Side`, `SiteSpec`.
- Produces: every transport struct has `pub edges: ::sittir_core::options::Edges` with napi names `$_before`/`$_after` through a manual `FromNapiValue`/`ToNapiValue` pair on `Edges` in core (both optional numbers); `impl Edged for XTransport`; kind-edge fields (`<kind>_before`, `<kind>_after`) are no longer emitted; the body prints `w.edge(KindId(N), Side::Before, node.edges.before)` where it printed `w.site_with(node.<kind>_before...)`.

- [ ] **Step 1: Write the failing tests**

In `render-module-emit.test.ts`, with the fixture node map that file already builds for a compound kind:

```ts
it('every transport carries base edges and no kind-edge fields', () => {
	const rs = emitRenderModule(fixture).transportRs;
	expect(rs).toContain('pub edges: ::sittir_core::options::Edges,');
	expect(rs).not.toMatch(/pub \w+_before: Option<u16>,\n/);
	expect(rs).toContain('impl ::sittir_core::options::Edged for CallExpressionTransport');
	expect(rs).toContain('::sittir_core::prepare::prepare_edges(self, ctx);');
	expect(rs).toContain('w.edge(::sittir_core::types::KindId(');
	expect(rs).not.toContain('call_expression_before');
});
```

In `render-options-rs.test.ts`:

```ts
it('emits a SiteSpec per spacing site in vector order and wires it into the resolved options', () => {
	const rs = renderOptionsRs(plan, addresses, kindEntries);
	expect(rs).toContain('pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[');
	expect(rs).toContain('sites: SITE_SPECS,');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts packages/codegen/src/emitters/__tests__/render-options-rs.test.ts`
Expected: FAIL on every new assertion.

- [ ] **Step 3: Emit the base field, the `Edged` impl, and the edge fill**

`render-module.ts`:

```ts
const TRANSPORT_METADATA_FIELDS: readonly TransportMetadataField[] = [
	{ jsName: '$_trivia', rustName: 'transport_trivia_data', rustType: 'Option<TransportTrivia>' },
	{ jsName: '$_edges', rustName: 'edges', rustType: '::sittir_core::options::Edges' }
];
```

`Edges` implements `FromNapiValue` in core by reading `$_before`/`$_after` off the enclosing object is not possible through `napi(object)`; instead `Edges` is its own napi object `{ before?: number, after?: number }` under the single key `$_edges`, and `Default` when absent. Give `Edges` `#[cfg_attr(feature = "napi-bindings", napi(object))]` in core with `pub before: Option<u16>, pub after: Option<u16>`; that is the two fields the base carries.

Beside the `KindOf` impl each transport already gets, emit:

```rust
impl ::sittir_core::options::Edged for XTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(N) }
    fn edges(&self) -> &::sittir_core::options::Edges { &self.edges }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { &mut self.edges }
}
```

For a slot enum (`XSlotTransportSlot`) emit the same trait delegating to the active variant, so a seated element can be reached uniformly (Task 4 relies on it).

In `prepareStructImpl`, the first body line for a compound is `::sittir_core::prepare::prepare_edges(self, ctx);` and the two kind-edge `get_or_insert` lines are no longer generated: filter `synthesizedSpacingSites(plan, node)` with `site.side === 'seam' && parseSeamLabel(site.address)?.token === publicKindName(node.kind)` out of both the field emission and the fill emission (that predicate is `edgeSitesOf`'s own test in `render-options-rs.ts`; export it as `isKindEdge(site)` from there and use it in both files).

`render-body.ts`, where the seam printer meets a field that `isKindEdge` classifies as the kind's edge:

```ts
lines.push(`${pad}w.edge(::sittir_core::types::KindId(${kindId}), ::sittir_core::options::Side::${side === 'before' ? 'Before' : 'After'}, node.edges.${side});`);
```

`render-options-rs.ts`, in `renderOptionsRs`:

```ts
L.push('pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[');
for (const site of plan.spacingSites) L.push(`    ::sittir_core::options::SiteSpec { default_arm: ${site.defaultId}, strength: ${site.strength} },`);
L.push('];');
```

and `sites: SITE_SPECS,` wherever the `ResolvedOptions` literal is built (`edges: EDGE_SITES,` is beside it).

- [ ] **Step 4: Run the emitter tests, regenerate typescript, build, and gate**

Run: `pnpm exec vitest run packages/codegen/src/emitters`
Expected: PASS after updating any test that pinned a `<kind>_before` field.

Run: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src` then `cargo build --release` for the napi crate per `DEVELOPMENT.md`.
Expected: builds. Then `pnpm run gen:examples` and, as its own call, `pnpm exec vitest run packages/tools/tests/emit/ packages/typescript/tests/nodes.test.ts`.
Expected: PASS, render-bytes fixtures byte-identical.

- [ ] **Step 5: Regenerate rust and python, validate, commit**

Regenerate both, rebuild, `pnpm run validate:native`, `pnpm run validate:history | tail -4`: every row identical to the previous run.

```bash
git commit -m "feat(render): every transport carries base edges; kind-edge fields and their fills go" -- packages/codegen/src rust/crates packages/typescript packages/rust packages/python examples
```

---

### Task 3: Token seams and flanks have no per-node carrier

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (field emission lines 2995–3000; fills in `prepareStructImpl`; `armSeamSupport` at lines 1205–1262 and `literalSeamFill`/`literalSeamedArm` near 2085–2100)
- Modify: `packages/codegen/src/emitters/render-body.ts` (seam printer near line 5688)
- Test: `render-module-emit.test.ts`, `render-module-separated-list.test.ts`

**Interfaces:**
- Consumes: `RenderSink::site(site)` from Task 1.
- Produces: no `Option<u16>` field for a `seam` site whose token is not the kind, nor for a `start`/`end` flank; the body prints `w.site(options::SITE_X)`; `Seamed<T>` is gone and a literal arm prints `w.site(before)`, the literal, `w.site(after)`; `ListView.head`/`tail` take the flank arms from `ctx`-free sink calls: the list view's `render_into` receives them as `Option<usize>` site indices and calls `w.site`.

- [ ] **Step 1: Write the failing tests**

```ts
it('a token seam and a flank have no transport field and print as a sink site', () => {
	const rs = emitRenderModule(fixture).transportRs;
	expect(rs).not.toContain('pub lparen_after: Option<u16>,');
	expect(rs).not.toContain('_start: Option<u16>,');
	expect(rs).not.toContain('get_or_insert(ctx.options.spacing[options::SITE_ARGUMENTS_LPAREN_AFTER])');
	expect(rs).toContain('w.site(options::SITE_ARGUMENTS_LPAREN_AFTER);');
	expect(rs).not.toContain('pub struct Seamed<T>');
});
```

Use the kind names the fixture actually has; `arguments` is illustrative.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Stop emitting the carriers**

In the field emission loop, keep a spacing site's field only when `site.role === 'separator'` or the site is one of the list's two separator gap sites (`site.address` ends with `_separator_space_before`/`_after`); emit nothing for `site.side === 'seam'` and for `start`/`end`. Apply the same predicate in `prepareStructImpl` so the fills disappear with the fields. Name the predicate once, `carriesPerNodeValue(site)`, in `render-options-rs.ts` beside `isKindEdge`, and use it in both places.

In `render-body.ts`, a seam node whose site has no carrier prints:

```ts
lines.push(`${pad}w.site(${printer.site(node.field)});`);
```

Delete `armSeamSupport`, `literalSeamFill`, `literalSeamedArm`'s `seams` parameter and the `Seamed<T>` wrapping of literal-arm enums; a literal arm renders as:

```rust
Enum::Variant => { w.site(options::SITE_BEFORE); w.text("+")?; w.site(options::SITE_AFTER); Ok(()) }
```

with each `w.site` line present only when that side has a site.

`ListView` (in core `view.rs`): `head`/`tail` become `Option<usize>` site indices; `render_into` calls `w.site(head)` before the first item and `w.site(tail)` after the last when set. The generated list construction passes `Some(options::SITE_X_START)` instead of `node.x_start.unwrap_or(0)`.

- [ ] **Step 4: Emitter tests, regenerate all three, build, full gates**

Same commands as Task 2 Step 4 and 5. Expected: byte-identical fixtures, identical validation rows; `transport.rs` for typescript loses roughly 435 fields, 435 fills and 435 napi attributes.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(render): token seams and flanks read the resolved vector; no per-node carrier, no Seamed wrapper" -- packages/codegen/src rust/crates packages/typescript packages/rust packages/python examples
```

---

### Task 4: Seated gaps fill through a table

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts` (`seatLoops`, delete `seatVariantArms`)
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (emit `SEATS_<KIND>_<SLOT>` tables)
- Modify: `rust/crates/sittir-core/src/prepare.rs` (`seat_site`)
- Test: `render-module-emit.test.ts`, `rust/crates/sittir-core/tests/prepare.rs`

**Interfaces:**
- Consumes: `Edged` on transports and slot enums (Task 2), `Edges` base.
- Produces:
  ```rust
  // options.rs, per list slot with seats, sorted by kind id:
  pub static SEATS_ARGUMENTS_ARGUMENTS: &[(u16, usize)] = &[(12, SITE_ARGUMENTS_ARGUMENTS_AS_EXPRESSION_AFTER), ...];
  // core prepare.rs:
  pub fn seat_site(table: &[(u16, usize)], kind: KindId) -> Option<usize>;
  pub fn fill_seated_gaps<T: Edged>(items: &mut [Option<SlotValue<T>>], table: &[(u16, usize)], ctx: &RenderContext<'_>);
  ```
  `fill_seated_gaps` skips the last item, skips coordinates, and for each transport element with `seat_site(table, item.kind_id())` sets `edges_mut().after.get_or_insert(ctx.options.spacing[site])`.

- [ ] **Step 1: Write the failing tests**

Core:

```rust
#[test]
fn seated_gaps_fill_the_preceding_elements_after_edge_and_never_the_last() {
    let table: &[(u16, usize)] = &[(3, 0), (4, 1)];
    let opts = ResolvedOptions { spacing: vec![70, 80], ..minimal() };
    let mut items = vec![Some(SlotValue::Transport(Leaf::kind(3))), Some(SlotValue::Transport(Leaf::kind(4))), Some(SlotValue::Transport(Leaf::kind(3)))];
    fill_seated_gaps(&mut items, table, &ctx(&opts));
    assert_eq!(edges_of(&items[0]).after, Some(70));
    assert_eq!(edges_of(&items[1]).after, Some(80));
    assert_eq!(edges_of(&items[2]).after, None);
}
```

Emitter:

```ts
it('a list slot with seats gets a kind-to-site table and one fill call, no match block', () => {
	const out = emitRenderModule(fixture);
	expect(out.optionsRs).toContain('pub static SEATS_ARGUMENTS_ARGUMENTS: &[(u16, usize)] = &[');
	expect(out.transportRs).toContain('::sittir_core::prepare::fill_seated_gaps(seated_items, options::SEATS_ARGUMENTS_ARGUMENTS, ctx);');
	expect(out.transportRs).not.toContain('ArgumentsArgumentsTransportSlot::AsExpression(t) =>');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cargo test -p sittir-core --test prepare` and the vitest file. Expected: FAIL.

- [ ] **Step 3: Implement**

Core:

```rust
pub fn seat_site(table: &[(u16, usize)], kind: KindId) -> Option<usize> {
    table.binary_search_by_key(&kind.0, |(k, _)| *k).ok().map(|i| table[i].1)
}
pub fn fill_seated_gaps<T: Edged>(items: &mut [Option<SlotValue<T>>], table: &[(u16, usize)], ctx: &RenderContext<'_>) {
    let last = items.len().saturating_sub(1);
    for (at, item) in items.iter_mut().enumerate() {
        if at == last { break; }
        let Some(SlotValue::Transport(t)) = item.as_mut() else { continue };
        if let Some(site) = seat_site(table, t.kind_id()) { t.edges_mut().after.get_or_insert(ctx.options.spacing[site]); }
    }
}
```

The polymorph descent today's match performs (a `parenthesized_expression` element seated by its inner form) is the `Edged` delegation Task 2 emitted on slot enums and on polymorph wrapper transports: `kind_id()` and `edges_mut()` of a wrapper delegate to its content, so the table is keyed by the inner form's kind id and no descent is generated per list. Emit that delegation for every transport whose kind is a polymorph wrapper (the same kinds `seatVariantArms` descended into: `AssembledPolymorph` with one slot).

Emitter `seatLoops` becomes:

```ts
const table = `options::SEATS_${screaming(kind)}_${screaming(field.name)}`;
lines.push(isRequired(field)
	? `        ::sittir_core::prepare::fill_seated_gaps(&mut self.${ident}, ${table}, ctx);`
	: `        if let Some(seated_items) = self.${ident}.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items, ${table}, ctx); }`);
```

with the table emitted in `render-options-rs.ts` from `seatedSitesOf(plan, kind, field)` rows as `(kindId, siteIndex)` sorted by kind id. A list whose elements are required (no `Option` around them) uses a second helper `fill_seated_gaps_required` over `&mut [SlotValue<T>]`, or the generated code wraps; keep one core function by having both list shapes call through `iter_mut().map(Option::as_mut)`; pick whichever the existing element type forces and note it in the glossary entry.

- [ ] **Step 4: Tests, regenerate, gates, commit**

Core and emitter tests pass; regenerate three grammars; byte-identical fixtures and validation rows.

```bash
git commit -m "feat(render): seated sibling gaps fill through a per-slot kind table; the per-list match blocks go" -- packages/codegen/src rust/crates packages/typescript packages/rust packages/python examples
```

---

### Task 5: `options.rs` resolves through an address trie

**Files:**
- Modify: `packages/codegen/src/emitters/render-options-rs.ts` (`emitOptionsStructs`, `resolverBody`, `fieldsOf`, `chainOf`, `literalOf`)
- Modify: `rust/crates/sittir-core/src/options.rs` (`resolve_object`, `AddressNode`)
- Test: `render-options-rs.test.ts`, `rust/crates/sittir-core/tests/` (new `options_trie.rs`)

**Interfaces:**
- Consumes: `plan.sitePaths` (sorted paths with site kind and index), `addresses` (roots, branches, leaves), `reject_unknown_keys`, `set_spacing`.
- Produces:
  ```rust
  // core
  pub enum AddressNode { Branch { key: &'static str, children: &'static [AddressNode] }, Spacing { key: &'static str, site: usize, path: &'static str }, Delimiter { key: &'static str, site: usize, path: &'static str } }
  pub unsafe fn resolve_object(env, obj: Object, nodes: &'static [AddressNode], base: &ResolvedOptions, allowed_of: fn(usize) -> &'static [u16]) -> napi::Result<ResolvedOptions>
  // generated options.rs
  pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[ ... ];   // roots, nested
  pub fn resolve(env, obj) -> ... { ::sittir_core::options::resolve_object(env, obj, ADDRESSES, &BASE, allowed) }
  ```
  No `XOptions` struct is generated; the napi entry that took `Options` takes a JS object and calls `resolve`.

- [ ] **Step 1: Write the failing tests**

Emitter:

```ts
it('emits a static address trie and no per-address structs', () => {
	const rs = renderOptionsRs(plan, addresses, kindEntries);
	expect(rs).toContain('pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[');
	expect(rs).toContain('AddressNode::Branch { key: "arguments", children: &[');
	expect(rs).toContain('AddressNode::Spacing { key: "after", site: SITE_ARGUMENTS_LPAREN_AFTER, path: "(arguments)/\\"(\\"/after" }');
	expect(rs).not.toContain('pub struct ArgumentsLparenOptions');
	expect(rs).not.toContain('impl ::napi::bindgen_prelude::FromNapiValue for Options');
});
```

Core (`tests/options_trie.rs`, napi feature gated the way `boundary_roundtrip.rs` is): a trie of two levels, an object `{ a: { x: 9 } }` resolves site 0 to 9; `{ a: { y: 1 } }` errors naming `a/y`; `{ a: { x: 4 } }` where 4 is not allowed errors with the path string.

- [ ] **Step 2: Run to verify they fail**

Run: the vitest file and `cargo test -p sittir-core --features napi-bindings --test options_trie`. Expected: FAIL.

- [ ] **Step 3: Implement**

Core `resolve_object` walks the object recursively: for each key present in the node's children, a `Branch` recurses, a `Spacing` reads `u16` and calls `set_spacing(&mut table, site, allowed_of(site), value, path)`, a `Delimiter` reads `u8` and sets `table.delimiter[site]`; unknown keys go through `reject_unknown_keys(&obj, &children_keys, at)` exactly as the generated structs do today; `indent` is read at the root.

Emitter: `emitOptionsStructs` and `resolverBody` are replaced by `emitAddressTrie(addresses, siteIndex, kindEntries)`, which prints `ADDRESSES` from `addresses.roots`/`branches`/`leaves` with the same `nestedKey` spelling the TypeScript side uses (so a key in the trie is the key the derived `Options` type admits), and the `path` string from `formatPreferencePath(leaf.canonical[0])`. The napi engine entry that accepted `Options` accepts `::napi::bindgen_prelude::Object` and calls `resolve`. `resolveTests` (the generated resolve tests in `options.rs`) are regenerated to call `resolve` with a JSON object literal built through napi's test env, or dropped in favour of the core trie test plus one generated smoke test per grammar; do the latter and say so in the glossary.

- [ ] **Step 4: Tests, regenerate, gates, commit**

`options.rs` for typescript drops from ~37k lines to the site tables, `SITE_SPECS`, `SEATS_*`, `EDGE_SITES`, `DEPTH_SITES`, `ADDRESSES` and `resolve`. Byte-identical fixtures and validation rows.

```bash
git commit -m "feat(render): options resolve through a static address trie; per-address structs go" -- packages/codegen/src rust/crates packages/typescript packages/rust packages/python examples
```

---

### Task 6: `Options` is derived from `__optionsHint__` on the node interfaces

**Files:**
- Create: `packages/types/src/options.ts`
- Modify: `packages/types/src/index.ts` (export)
- Modify: `packages/codegen/src/emitters/options.ts` (`renderOptionsModule`, `addressLines`)
- Modify: `packages/codegen/src/emitters/types.ts` (emit `__optionsHint__` on each interface, beside `__inputHints__`)
- Test: `packages/codegen/src/emitters/__tests__/emitter-options.test.ts`, a type test `packages/typescript/tests/options.test-d.ts`

**Interfaces:**
- Consumes: the address tables' `segments` per leaf (token names, slots, element kinds, sides, separator arms), the same `deriveAddressTables` output `render-options-rs.ts` builds the trie from; the arm aliases `WhitespaceArm`/`SpacingArm` already printed by `options.ts`.
- Produces, in `packages/types/src/options.ts`:
  ```ts
  type DeepPartial<T> = T extends object ? { readonly [K in keyof T]?: DeepPartial<T[K]> } : T;
  export type OptionsHintOf<N> = N extends { readonly __optionsHint__?: infer H } ? H : never;
  export type DerivedOptions<NodeMap> = {
  	readonly [K in keyof NodeMap]?: DeepPartial<OptionsHintOf<NodeMap[K]>>;
  } & { readonly indent?: string };
  /** The slot-bearing sites of a kind's hint: the projection a factory's trailing preferences argument is typed from. */
  export type PreferenceBagOf<N, Keys extends keyof OptionsHintOf<N>> = DeepPartial<Pick<OptionsHintOf<N>, Keys>>;
  ```
  and in each grammar's generated `options.ts`:
  ```ts
  export type Options = DerivedOptions<T.NodeMap> & { readonly [L in VirtualKind]?: Sides<WhitespaceArm> };
  ```
  with `T.NodeMap` the kind-name to interface map `types.ts` gains if it does not already export one, and the virtual kinds (labels) listed from `declared.bindings`.
- On each generated interface, one member:
  ```ts
  readonly __optionsHint__?: { readonly lparen: { readonly after?: WhitespaceArm }; readonly arguments: { readonly separator: { readonly comma: { readonly before?: SpacingArm; readonly after?: SpacingArm } }; readonly spreadElement: { readonly after?: WhitespaceArm } } };
  ```
  nested exactly as the address trie is nested and camel-cased on every key (`spreadElement`, `asExpression`, `automaticSemicolon`), as the config keys and `__inputHints__` are, so a seated element site is `arguments.arguments.asExpression.after`. The rust addresses keep snake case; both emitters read the same table and case their own keys. A kind with no sites emits no member.

- [ ] **Step 1: Write the failing tests**

`emitter-options.test.ts`:

```ts
it('emits an options hint per kind and derives Options from it; no address tables', () => {
	const types = emitTypes(typesConfig);
	expect(types).toContain("readonly __optionsHint__?: { readonly lparen: { readonly after?: WhitespaceArm }");
	expect(types).toContain('readonly spreadElement: { readonly after?: WhitespaceArm }');
	expect(types).not.toContain('spread_element');
	const text = emitOptions(config);
	expect(text).toContain('export type Options = DerivedOptions<T.NodeMap>');
	expect(text).not.toContain('AddressBranch');
	expect(text).not.toContain('AddressLeaf');
});
```

`packages/typescript/tests/options.test-d.ts`:

```ts
import { expectTypeOf } from 'vitest';
import type { Options } from '../src/options.ts';
import { TSKindId } from '../src/types.ts';
const ok: Options = { arguments: { lparen: { after: TSKindId.Space }, arguments: { separator: { comma: { after: TSKindId.Tight } }, spreadElement: { after: TSKindId.Newline } } }, body: { before: TSKindId.Indent } };
expectTypeOf(ok).toMatchTypeOf<Options>();
// @ts-expect-error a token the kind does not have
const bad: Options = { arguments: { lbrace: { after: TSKindId.Space } } };
```

- [ ] **Step 2: Run to verify they fail**

Run: the emitter test file; `pnpm exec vitest --typecheck run packages/typescript/tests/options.test-d.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

`packages/types/src/options.ts` as in Interfaces. In `emitters/types.ts`, where `__inputHints__` is written for a kind, also write `__optionsHint__` from that kind's subtree of the address tables: a literal segment becomes a token key with its sides; a field segment whose slot repeats becomes the slot key holding `separator` with one key per separator arm carrying its sides (`separator.comma.after`, as the trie spells it) and one key per element kind with its seated sides; sides are typed by the arm alias the site admits. In `emitters/options.ts`, `renderOptionsModule` prints the two arm aliases, `T.NodeMap` if needed, the virtual-kind intersection for labels, and `export type Options = …`; `AddressRoot`/`AddressBranch`/`AddressLeaf`/`AddressNodeN` are no longer printed; `deriveAddressTables` stays, since `render-options-rs.ts` builds the trie from it, and the hint emitter reads the same output, so the two surfaces cannot drift.

- [ ] **Step 4: Tests, regenerate, measure, gates, commit**

Run the emitter suite, regenerate all three, `pnpm run type-check`, and `pnpm exec tsc -p packages/typescript/tsconfig.json --extendedDiagnostics | tail -12`; instantiations at or below the template spike's 3,058,924 (recorded in the spec). The generated `options.ts` is under 300 lines per grammar.

```bash
git commit -m "feat(options): Options is derived from an options hint on each node interface" -- packages/types/src packages/codegen/src packages/typescript packages/rust packages/python
```

---

### Task 7: Glossary, spec status, PR

- [ ] **Step 1: Glossary entries** in `docs/glossary/emitters.md` for `isKindEdge`, `carriesPerNodeValue`, the changed `seatLoops`, `emitAddressTrie`, the changed `renderOptionsModule`; in a new `docs/glossary/packages-types.md` for `DerivedOptions` and its helpers; core doc comments in `sittir-core` stay in source (Rust docs are not covered by the glossary rule).
- [ ] **Step 2: Spec status.** In the amendment section add one line: "Implemented 2026-…; the render context is the sink, which holds the resolved options."
- [ ] **Step 3: Full gates and PR** against `feat/bindings-vocabulary`: type-check, lint, `cargo test -p sittir-core`, full vitest, validation rows for three grammars, render-bytes fixtures. Never `--delete-branch`.

---

## Self-review

- **Spec coverage.** Base edges: Tasks 1–2. Sibling gap on the element's `after` through a table: Task 4. Carrier-less token seams and flanks: Task 3. Accessor reading over the vector and no per-address structs: Task 5 (the trie plus `w.site(SITE)` replace the nested structs; the spec's slice newtype is subsumed by `SITE_*` constants already used in generated bodies). Derived `Options`: Task 6. Render context: Task 1's sink-owned options.
- **Placeholders.** Every step has code; where a runtime helper's exact name may differ (`EdgeSlot` fields, the writer constructor, the kind-to-interface map name) the step says what to read and what must hold.
- **Type consistency.** `Edges`, `Edged`, `SiteSpec`, `site_arm`, `edge_arm`, `Side`, `RenderSink::site/edge`, `fill_seated_gaps`, `seat_site`, `AddressNode`, `resolve_object` are used with the same names across Tasks 1–5; `Tok`/`Repeat`/`Sep`/`DerivedOptions` across Task 6 and the spec.
