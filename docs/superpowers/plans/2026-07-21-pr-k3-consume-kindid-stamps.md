# PR-K3 — consume the mint-time kind-id stamps

> Per-PR plan under the KindId-NodeRefs design
> (`docs/superpowers/specs/2026-07-20-kindid-noderefs-design.md` §2.3/§3.3).
> Depends on: PR-K1 (`3533bfedf`/`ed24673ce`), PR-K2 (`80a964976`) — both landed.

**Goal:** consumers READ the stamped `storageKindId`/`parseKindId`/`resolvedKindId`
facts instead of re-resolving ref names through the chain at emit time. Every
tranche is gated per-site on **byte-identical generated output** for all 3
grammars (`regen diff = manifest source_hash only`); any diff is a found bug of
the #129 class, triaged individually before proceeding (PR-K1's rule).

**Gate recipe per tranche (unchanged from K1/K2):**
1. `tsgo --noEmit -p packages/codegen` clean.
2. Targeted vitest for touched emitters.
3. Regen A/B: `pnpm run validate:native` **with `SITTIR_NATIVE_DEBUG` unset**
   (debug `.node` segfaults on this machine); assert floors 123/117/103/108 and
   manifest-only diff.
4. Full `pnpm test` — "Newly failing: none".
5. Pathspec commit (dirty tree carries unrelated `.infigraphignore`).

## Tranche order (least → most invasive)

### K3a — value-in-hand literal re-resolutions (retire class, smallest)

Sites where a `NodeOrTerminal` (or a struct derived from one) is already in
hand and the code re-resolves its text/kind through the chain to get `.id`:

- `render-module.ts:2885` and `:3107` — literal-arm id:
  `(findKindEntryForLiteral(kindEntries, literal.text) ?? findKindEntry(kindEntries, literal.kind))?.id`.
  Thread `resolvedKindId` onto the literal-arm struct at its construction from
  the value; read the stamp. The `?? findKindEntry(kind)` tail should be
  provably dead post-K2 (mint uses the same literal-first chain) — assert, then
  drop.
- `render-module.ts:4386` — same pattern.
- `types.ts:1205/:1210` — enum-member id from member text.
- `factories.ts:639/:648` — byText map guards (`findKindEntryForLiteral(text) !== undefined`);
  becomes `value.resolvedKindId !== undefined` when the value is in hand.
- `type-test.ts:79`, `types.ts:671`, `from.ts:1510` — verify whether the call
  site holds the value or only a projected kind NAME. Value in hand → read
  stamp. Name-only → K3b (map keyed lookups) or leave (owner-kind resolution is
  NOT a ref consumption — out of scope).

**Caution:** many of these sites receive *projected* strings (post
`kindsOf()`/`storageKindOfValue`), not the ref. Do NOT widen projections in
K3a; only convert sites that already receive the `NodeOrTerminal`. Projection
widening (carrying `{name, id}` pairs through `kindsOf`-style helpers) is K3e.

### K3b — `buildKindIdByKind` consumers (render-module)

`render-module.ts:1867` (`kidByKind`) and `:3029-3032` (node-arm id index) —
map keyed by ref-projected kind names. Where the keys originate from slot
values, read `storageKindId`/`parseKindId` off the values instead. The map
stays for owner-kind (non-ref) lookups; goal is to shrink its consumer set,
not delete it wholesale (spec keeps name-based owner-kind emission).

### K3c — `acceptedTransportKinds` dual-id supply (transport-common.ts:141-166)

Today: name-keyed redirects (`aliasedHiddenKinds` + per-slot `parseAliases`
target→source pairs) reconstruct the accepted-id set from names. Post-K2 a
slot value carries BOTH `storageKindId` and `parseKindId` — the accepted-id
set for a slot is directly the union of its values' id pairs. Rework the
callers (transport emit paths in render-module + wrap/factory-map/from
`parseAliases` consumers, node-map `aliasTargetToSourceMapOf` projection) to
consume id pairs from values. This is the tranche most likely to surface
triage diffs (it changed twice in Wave 2); keep it isolated in its own commit.

### K3d — codegen-side `kindIdFromName` baking

Generated TS currently emits runtime `kindIdFromName("<kind>")` calls where
codegen couldn't resolve an id (factories.ts:643 fallback, client-utils
surfaces). With stamps, codegen call sites bake the numeric id (emit the
`TSKindId.<Member>` reference) when the value's stamp is present. The runtime
`kindIdFromName` switch itself STAYS (public human-facing input surface —
spec §2.3 keep-list).

### K3e — simplify class (largest, may split into its own PR)

- `resolveParseKindCollisions` (node-map.ts): replace name+structural-signature
  keying with id equality where both values carry ids; keep the structural
  fallback for id-less values.
- The `isUnresolvedRef(v.node) ? v.node.name : v.node.kind` fork (~85 sites)
  and `kindsOf`/`slotKindNames`/`valueParseKindsOf`/`aliasTargetToSourceMapOf`
  projections: introduce id-carrying projections and migrate consumers
  incrementally. Candidate for PR-K3e as a follow-on PR if tranche size grows.
- `expandAndDedupeContentTypes` (from.ts:1032-1047) — dedupe by id when
  available.

### K3f — `hydrateSlotRefs` `_`-prefix retry (assemble.ts:1137-1143) — OPEN QUESTION

The retry maps a visible ref NAME to the `_`-hidden MODEL node. Stamps are
catalog ids, and id→model-node is non-injective (the twins), so a naive
id-keyed node index is unsound. Options to evaluate at implementation time:
(a) mint-time resolution of the MODEL-map target name (requires threading the
assembled-node key set into DeriveCtx — it already has `ctx.nodes` for the
parameterless cascade); (b) keep the retry but assert it agrees with the
stamped id when present (diagnostic first, retire second). Do NOT guess —
probe with the A/B gate. If (a) diverges, that divergence is Wave-2-class
information, not noise.

## Non-goals (unchanged from the spec)

- NodeMap keying / node-model.json5 identity stay name-based.
- Runtime `kindIdFromName` switch stays.
- Divergent-modelType group twins untouched (PR-K4).

## Status

- [ ] K3a — value-in-hand literal re-resolutions
- [ ] K3b — buildKindIdByKind consumer shrink
- [ ] K3c — acceptedTransportKinds dual-id supply
- [ ] K3d — kindIdFromName baking
- [ ] K3e — simplify-class projections (may split to own PR)
- [ ] K3f — hydrate retry (open question — diagnose before changing)
