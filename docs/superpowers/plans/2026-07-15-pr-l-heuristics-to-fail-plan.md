# PR-L: Heuristics-to-Fail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip three currently-non-blocking grammar diagnostics (`storagename-collision`, `content-collision`, `parsekind-noninjective`) to build-blocking (`canProceed: false`), after fixing the two silent-collapse bugs that currently mask real `storagename-collision` instances and burning down every diagnostic that flip would newly block.

**Architecture:** All three diagnostics already exist and already flow through the same preflight pipeline (`collectGrammarDiagnostics` → `runGrammarDiagnosticsPreflight`, which blocks purely on `canProceed === false`, independent of `severity`). No new diagnostic and no new gate is being built. `storagename-collision` (in `buildSlotsRecord`, `packages/codegen/src/compiler/model/node-map.ts`) is currently masked by two separate silent-collapse bugs — `mergeByName`/`mergeChoiceArms` (`packages/codegen/src/compiler/collect-slots.ts`) silently union same-name unnamed slots before the collision check runs, and `buildSlotsRecord`'s own collision-detection loop iterates the already-name-collapsed Record instead of the pre-collapse slot list. Both must be fixed before `storagename-collision` can ever see a real collision. `content-collision` (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts`) and `parsekind-noninjective` (shared producer `packages/codegen/src/types/parsekind-collisions.ts`, consumed at two independent call sites) need no mechanism changes — only a burn-down of their live instances, then a precisely-scoped `canProceed` override at their consumption site (never at a shared producer/mapper also used by other, still-non-blocking codes).

**Tech Stack:** TypeScript codegen compiler (`packages/codegen/src/compiler`, `packages/codegen/src/dsl`), vitest, tree-sitter grammar regen (`packages/{rust,typescript,python}`), Rust native bindings (napi).

**Investigation record (for the implementer's context, not to be re-derived):**
- A prior design assumption — that `emitFieldCarryingWrap`'s `children`/`$other` path in `wrap.ts` was the reusable mechanism for an "unslotted-child" check — is FALSE. Both its callers (`wrap.branch`, `wrap.group`) hardcode `children: []` always; that path is dead code. The real, already-computed hazard is `storagename-collision`.
- A 2026-05-03 report (`specs/022-binding-simplify-assemble/dupe-unnamed-children-report.md`, "14 kinds") measures a DIFFERENT, unrelated, softer concept (a kind having >1 unnamed slot with *distinct* names — an API-cleanliness goal for a separate, not-yet-scheduled FR-T05 migration) and is now stale (most of its 14 kinds were already resolved by the since-landed kind-named-slots refactor). Do not use it as a source of scope or expected kind names for this plan.
- A fresh, empirical instrumentation pass (this session) found the REAL currently-masked `storagename-collision` hazard is small: 5 distinct slot names across `mergeByName`/`mergeChoiceArms`'s two call sites across all 3 grammars — `let_condition` (rust, `mergeByName`), `expression`/`let_chain`/`let_condition` (rust, `mergeChoiceArms`), `content` (typescript, `mergeChoiceArms`), `import_list` (python, `mergeChoiceArms`). These were not attributed to owning kinds (the merge helpers don't take a `kindForName` parameter) — Task 3 below discovers the real owning kinds by running the actual regen after Tasks 1-2 land, rather than assuming this list in advance.

## Global Constraints

- DRY is the #1 rule: each fact has one source and one derivation. Never hand-edit generated artifacts (`packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/*`, `packages/{rust,python,typescript}/overrides.suggested.ts`) — fix codegen or `packages/<lang>/overrides.ts` and regenerate.
- No casts (`as unknown`, `as any`) to clear type errors — fix the real type.
- Every codegen-source-touching task must regenerate all 3 grammars (`pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src`) and stage the regenerated manifest/fixtures before committing.
- `validate:native` output changes land in dedicated `chore(validator)` commits, separate from feature/source commits.
- Rust-touching tasks must run `cargo check --workspace --features napi-bindings` cleanly.
- Every codegen-source-touching or regen-touching task must run the FULL `validate:native` sweep (never a targeted subset) and treat any unexplained regression as stop-and-investigate, not a byte-diff to wave through.
- Known-good baseline to reconfirm fresh at Task 1's start: `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` currently holds exactly rust=123/136, typescript=76/111, python=108/115 read-render-parse AST-match pass (post PR #156 merge). Reconfirm this exact baseline before any change; treat any pre-existing failures (found via git-stash A/B baseline comparison) as pre-existing, not something to fix as part of this plan.
- A diagnostic's `canProceed` must only ever be overridden at its own precise mapping/construction call site — never at a shared producer or mapper function also used by other codes that must remain non-blocking (`fromAssembleWarning` is shared by `storagename-collision` and `typename-collision`; `seq-with-nested-seq` is a separate `DeriveShapeDiagnostic` mapped by `fromDeriveShape`, unaffected either way; `diagnoseParseKindCollisions`/`fromParseKindCollision` are shared by the assemble-time path and enrich's own non-blocking audit-trail path). Getting this wrong silently re-blocks an already-accepted diagnostic elsewhere in the pipeline.

---

### Task 1: Stop `mergeByName`/`mergeChoiceArms` from silently unioning unnamed same-name slots

**Files:**
- Modify: `packages/codegen/src/compiler/collect-slots.ts:203-223` (`mergeByName`), `packages/codegen/src/compiler/collect-slots.ts:231-256` (`mergeChoiceArms`)
- Test: `packages/codegen/src/compiler/__tests__/collect-slots.test.ts`

**Interfaces:**
- Consumes: `AssembledNonterminal` (from `packages/codegen/src/compiler/model/node-map.ts`), specifically its `.name`, `.isUnnamed` (`fieldName === undefined`), `.values`, `.hasTrailing`, `.hasLeading`, `.sourceRuleIds`, and `.with(...)` (immutable-update helper already used by both functions).
- Produces: `mergeByName(slots: AssembledNonterminal[]): AssembledNonterminal[]` and `mergeChoiceArms(arms: AssembledNonterminal[][]): AssembledNonterminal[]` — same signatures as today. Callers (`collectSlots`'s structural-`CHOICE` branch, `packages/codegen/src/compiler/collect-slots.ts:513-527`) are unchanged. Task 2 consumes these functions' new behavior (unnamed same-name slots now appear as separate array entries instead of one unioned entry).

Current behavior (read via infigraph this session, both functions confirmed unchanged from what's quoted below): both functions key a `Map<string, AssembledNonterminal>` purely by `.name` and always merge (union `.values`, OR the trailing/leading flags) whenever two slots share a name — regardless of whether either slot is a real named grammar field (`fieldName` present) or an unnamed/kind-derived positional slot. For genuinely-named fields shared across choice arms (e.g. `variable_declarator = choice(seq(field('name'), field('value')?), seq(...))`), this merge is correct and necessary — the same field name across arms IS the same semantic slot. But when two UNNAMED slots happen to derive the same kind-based name (e.g. two distinct positional references to the same grammar kind, with no `field()` wrapper), merging them silently discards the fact that they are two structurally distinct positions — their values get unioned into one slot's `.values` array, and no diagnostic ever sees this as 2 slots to begin with.

- [ ] **Step 1: Write the failing tests**

Add to `packages/codegen/src/compiler/__tests__/collect-slots.test.ts` (append inside the existing `describe('collectSlots — nonterminal-node enumeration', ...)` block, after the last test at line 154-155; note this file imports `collectSlots` from `'../collect-slots.ts'` — `mergeByName`/`mergeChoiceArms` are not separately exported, so these are exercised indirectly through `collectSlots` on structural-choice shapes, matching the file's existing convention of testing through the public `collectSlots` entry point):

```ts
	it('structural choice, same arm: two unnamed same-kind members stay distinct (no silent merge)', () => {
		// choice( seq(field('op'), sym('identifier'), sym('identifier')) ) — a single
		// structural arm containing two unnamed references to `identifier`. Before
		// the fix, mergeByName (invoked once per arm) would union these into ONE
		// 'identifier' slot with 2 values. After the fix, they must remain 2 separate
		// slot entries (both named 'identifier') so a downstream storageName-collision
		// check can see there were really two structurally distinct positions.
		const rule: Rule<'link'> = {
			type: CHOICE,
			members: [
				{
					type: SEQ,
					members: [{ type: FIELD, name: 'op', content: str('+') }, sym('identifier'), sym('identifier')]
				}
			]
		};
		const out = collectSlots(deleteWrapper(rule) as Rule);
		const identifierSlots = out.filter((s) => s.name === 'identifier');
		expect(identifierSlots).toHaveLength(2);
		expect(identifierSlots[0]!.values).toHaveLength(1);
		expect(identifierSlots[1]!.values).toHaveLength(1);
	});

	it('structural choice, same arm: two NAMED same-field slots still merge (unchanged legitimate case)', () => {
		// Two field('label', ...) occurrences within one arm ARE the same semantic
		// slot (e.g. a repeated-reference pattern) — merging must still happen when
		// both sides carry a real fieldName.
		const rule: Rule<'link'> = {
			type: CHOICE,
			members: [
				{
					type: SEQ,
					members: [
						{ type: FIELD, name: 'label', content: sym('a') },
						{ type: FIELD, name: 'op', content: str('+') },
						{ type: FIELD, name: 'label', content: sym('b') }
					]
				}
			]
		};
		const out = collectSlots(deleteWrapper(rule) as Rule);
		const labelSlots = out.filter((s) => s.name === 'label');
		expect(labelSlots).toHaveLength(1);
		expect(labelSlots[0]!.values).toHaveLength(2);
	});

	it('structural choice, across arms: two unnamed same-kind slots in different arms stay distinct (no silent merge)', () => {
		// arm 1: seq(field('op'), sym('identifier')) ; arm 2: seq(field('op'), sym('identifier'), sym('identifier'))
		// mergeChoiceArms must not collapse the unnamed 'identifier' slots from
		// different arms into one presence-counted/relaxed-to-optional slot.
		const rule: Rule<'link'> = {
			type: CHOICE,
			members: [
				{ type: SEQ, members: [{ type: FIELD, name: 'op', content: str('+') }, sym('identifier')] },
				{
					type: SEQ,
					members: [{ type: FIELD, name: 'op', content: str('-') }, sym('identifier'), sym('identifier')]
				}
			]
		};
		const out = collectSlots(deleteWrapper(rule) as Rule);
		const identifierSlots = out.filter((s) => s.name === 'identifier');
		expect(identifierSlots.length).toBeGreaterThanOrEqual(2);
	});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/collect-slots.test.ts`
Expected: the first and third new tests FAIL — `identifierSlots` has length 1 (silently merged), not 2. The second new test (both named) PASSES already (documents the case that must NOT change).

- [ ] **Step 3: Fix `mergeByName`**

Replace the full function body at `packages/codegen/src/compiler/collect-slots.ts:203-223`:

```ts
function mergeByName(slots: AssembledNonterminal[]): AssembledNonterminal[] {
	if (slots.length <= 1) return slots;
	const out: AssembledNonterminal[] = [];
	const namedIndexByName = new Map<string, number>();
	for (const s of slots) {
		if (s.isUnnamed) {
			// Positional/kind-derived name: never silently merge with anything else
			// sharing that name, even another unnamed slot — that IS a genuine
			// storageName collision (two structurally distinct positions), and
			// downstream diagnostics (buildSlotsRecord's storagename-collision
			// check) must see both entries to catch it. Merging here would union
			// their values and erase the fact they were ever distinct.
			out.push(s);
			continue;
		}
		const idx = namedIndexByName.get(s.name);
		if (idx === undefined) {
			namedIndexByName.set(s.name, out.length);
			out.push(s);
			continue;
		}
		const prev = out[idx]!;
		out[idx] = prev.with({
			values: dedupeValues([...prev.values, ...s.values]),
			hasTrailing: prev.hasTrailing || s.hasTrailing,
			hasLeading: prev.hasLeading || s.hasLeading,
			sourceRuleIds: mergeSourceRuleIds(prev.sourceRuleIds, s.sourceRuleIds)
		});
	}
	return out;
}
```

- [ ] **Step 4: Fix `mergeChoiceArms`**

Replace the full function body at `packages/codegen/src/compiler/collect-slots.ts:231-256`:

```ts
function mergeChoiceArms(arms: AssembledNonterminal[][]): AssembledNonterminal[] {
	const merged = new Map<string, AssembledNonterminal>();
	const presence = new Map<string, number>();
	const unnamed: AssembledNonterminal[] = [];
	for (const arm of arms) {
		for (const slot of arm) {
			if (slot.isUnnamed) {
				// Positional/kind-derived name: arms are structurally distinct
				// contexts, so a same-named unnamed slot in two arms is NOT the
				// same field. Pass through untouched — do not merge (which would
				// silently discard the arm-specific structural distinction) and do
				// not presence-count/relax-to-optional (that model applies to one
				// coherent cross-arm field identity, which unnamed slots don't have).
				unnamed.push(slot);
				continue;
			}
			presence.set(slot.name, (presence.get(slot.name) ?? 0) + 1);
			const prev = merged.get(slot.name);
			if (!prev) {
				merged.set(slot.name, slot);
				continue;
			}
			merged.set(
				slot.name,
				prev.with({
					values: dedupeValues([...prev.values, ...slot.values]),
					hasTrailing: prev.hasTrailing || slot.hasTrailing,
					hasLeading: prev.hasLeading || slot.hasLeading,
					sourceRuleIds: mergeSourceRuleIds(prev.sourceRuleIds, slot.sourceRuleIds)
				})
			);
		}
	}
	const namedOut = [...merged.values()].map((slot) =>
		(presence.get(slot.name) ?? 0) < arms.length ? relaxToOptional(slot) : slot
	);
	return [...namedOut, ...unnamed];
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/collect-slots.test.ts`
Expected: all tests PASS, including the 3 new ones and every pre-existing test in the file (156 lines' worth, unchanged shapes must still hold — e.g. `'comparison_operator inner seq: operators choice NOT folded into operand slot'` and `'seq distributes — two symbol members → two slots'`).

- [ ] **Step 6: Run the full dsl/compiler suite**

Run: `pnpm exec vitest run packages/codegen/src/compiler packages/codegen/src/dsl`
Expected: no new failures versus the pre-change baseline (run the same command on a clean checkout first if unsure what the pre-existing failure count is).

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/compiler/collect-slots.ts packages/codegen/src/compiler/__tests__/collect-slots.test.ts
git commit -m "fix(codegen): stop mergeByName/mergeChoiceArms from silently unioning unnamed same-name slots"
```

Do NOT regenerate grammars in this task — `buildSlotsRecord`'s own collision-detection loop (Task 2) still can't see these now-preserved-separate slots yet (it currently iterates the already-collapsed Record, not the pre-collapse list), so this change alone has no visible effect on any grammar's generated output or diagnostics. Regen happens in Task 3, after Task 2 lands.

---

### Task 2: Fix `buildSlotsRecord`'s collision check to run before Record-collapse

**Files:**
- Modify: `packages/codegen/src/compiler/model/node-map.ts:2257-2295` (the `byStorageName` collision-detection block inside `buildSlotsRecord`)
- Test: `packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts` (existing file; confirmed this session it already builds a full `NodeMap` via `link → normalizeGrammar → assemble` from a raw rules object and extracts a specific `AssembledBranch` — reuse its exact helpers below, do not add a new construction path)

**Interfaces:**
- Consumes: Task 1's fixed `mergeByName`/`mergeChoiceArms` (unnamed same-name slots now survive as separate `AssembledNonterminal` entries all the way into `buildSlotsRecord`'s `resolvedSlots` array). Consumes `recordAssembleWarning` (`packages/codegen/src/compiler/model/node-map.ts:171-176`, existing, unchanged) and the existing `AssembleWarning` code `'storagename-collision'`.
- Produces: no signature change — `buildSlotsRecord`'s external behavior (return type, the `out` Record it returns) is unchanged. Only the diagnostic-emission behavior changes: `recordAssembleWarning({code: 'storagename-collision', ...})` now fires whenever `resolvedSlots` has 2+ entries sharing a `storageName`, instead of (today) only when 2+ entries survive with the same `storageName` AFTER the `out[slot.name] = slot` Record-construction loop has already silently dropped any entries sharing an exact `.name` — a condition that (given `storageName`'s derivation from the same `projectSlotNaming` call as `.name`) essentially never survives to be checked today.

Current code (confirmed this session, `packages/codegen/src/compiler/model/node-map.ts:2244-2295`):

```ts
	const out: Record<string, AssembledNonterminal> = {};
	for (const slot of resolvedSlots) {
		// Strict design (FR-T05): inferred slots remap to 'child'/'children'
		// keys and at most one unnamed slot per branch is permitted. Empirical
		// check confirms 14 kinds across 3 grammars currently have >1 unnamed
		// positional slot. Enforcement requires either (a) collapse of choice-
		// of-distinct-kinds into one slot with multi-value `values[]`, or (b)
		// grammar overrides to explicitly name the positions ("Owner A"
		// migration). Until then: keep the kind-derived name as the Record
		// key, no collision throw, no >1-unnamed throw.
		out[slot.name] = slot;
	}

	// storageName collision check. Multiple slots sharing the same NodeData
	// storage key means the emitters can't distinguish them — the override
	// layer must name N-1 children to eliminate the collision.
	// Warn (not throw) because assemble runs on base grammars in tests
	// before overrides apply. The generate() pipeline enforces zero
	// collisions via the override layer; this warning surfaces any that
	// slip through during development.
	const byStorageName = new Map<string, AssembledNonterminal[]>();
	for (const slot of Object.values(out)) {
		const list = byStorageName.get(slot.storageName) ?? [];
		list.push(slot);
		byStorageName.set(slot.storageName, list);
	}
	for (const [storageName, slots] of byStorageName) {
		if (slots.length > 1) {
			const details = slots.map((s) => {
				const kinds = s.values.map((v) =>
					isTerminalValue(v)
						? `"${v.value}"`
						: isNodeRef(v) && isUnresolvedRef(v.node)
							? v.node.name
							: isNodeRef(v)
								? (v.node as AssembledNode).kind
								: '?'
				);
				const mult = s.values.length > 0 ? s.values[0]!.multiplicity : 'single';
				const named = s.isUnnamed ? 'positional' : 'named';
				return `    ${s.name} (${named}, multiplicity: ${mult}, values: [${kinds.join(', ')}])`;
			});
			recordAssembleWarning({
				code: 'storagename-collision',
				message:
					`[assemble] storageName collision: kind '${kind}' has ${slots.length} slots ` +
					`with storageName '${storageName}':\n${details.join('\n')}`,
				ownerKind: kind,
				details: { storageName, slotCount: slots.length }
			});
		}
	}

	return Object.freeze(out);
```

- [ ] **Step 1: Write the failing test**

Add to `packages/codegen/src/compiler/__tests__/slot-structural-signals.test.ts`, reusing its existing `buildNodeMap` helper (raw rules object → `link` → `normalizeGrammar` → `assemble`, confirmed present at the top of the file) and `nodeMap.assembleWarnings` (the same field `collectGrammarDiagnosticsForGrammar` reads, confirmed this session):

```ts
	it('two unnamed same-kind slots in one branch fire storagename-collision (not silently collapsed)', () => {
		const nodeMap = buildNodeMap({
			host: {
				type: 'CHOICE',
				members: [
					{
						type: 'SEQ',
						members: [
							{ type: 'SYMBOL', name: 'op', fieldName: 'op' },
							{ type: 'SYMBOL', name: 'identifier' },
							{ type: 'SYMBOL', name: 'identifier' }
						]
					}
				]
			},
			op: { type: 'STRING', value: '+' },
			identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
		});
		const collisionWarnings = nodeMap.assembleWarnings.filter((w) => w.code === 'storagename-collision');
		expect(collisionWarnings).toHaveLength(1);
		expect(collisionWarnings[0]!.details).toMatchObject({ storageName: 'identifier', slotCount: 2 });
	});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run <the file chosen in Step 1> -t "storagename-collision"`
Expected: FAIL — `collisionWarnings` has length 0 (the Record-collapse loop already dropped one of the two `identifier` slots before the check ran, even with Task 1's fix in place).

- [ ] **Step 3: Fix the collision-detection loop**

In `packages/codegen/src/compiler/model/node-map.ts`, change only the `byStorageName` construction loop — do NOT change the `out[slot.name] = slot` Record-construction loop above it (that loop's last-write-wins behavior for the actual emitted Record is the pre-existing, separately-tracked FR-T05 concern from the dupe-unnamed-children report; this task only fixes the diagnostic's blind spot, not the Record's own storage semantics):

```ts
	const byStorageName = new Map<string, AssembledNonterminal[]>();
	for (const slot of resolvedSlots) {
		const list = byStorageName.get(slot.storageName) ?? [];
		list.push(slot);
		byStorageName.set(slot.storageName, list);
	}
```

(The only change: `for (const slot of Object.values(out))` → `for (const slot of resolvedSlots)`. `resolvedSlots` is already in scope at this point in the function — no new variable needed.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run <the file chosen in Step 1> -t "storagename-collision"`
Expected: PASS.

- [ ] **Step 5: Run the full compiler test suite**

Run: `pnpm exec vitest run packages/codegen/src/compiler`
Expected: no new failures versus baseline. Pay particular attention to any existing test asserting exact `Object.keys(branch.fields)` counts or exact Record contents for a kind that might now ALSO emit a `storagename-collision` warning it didn't before — a warning alone does not change the returned Record, so no such test should need updating, but confirm this empirically rather than assuming it.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/compiler/model/node-map.ts <test file from Step 1>
git commit -m "fix(codegen): buildSlotsRecord's storagename-collision check now inspects pre-Record-collapse slots"
```

---

### Task 3: Regenerate all 3 grammars; burn down any real `storagename-collision` instances that surface

**Files:**
- Modify (as needed, depending on what Step 1's regen surfaces): `packages/rust/overrides.ts`, `packages/typescript/overrides.ts`, `packages/python/overrides.ts`
- Regenerate: `packages/rust/src/*`, `packages/typescript/src/*`, `packages/python/src/*`, and each grammar's `.sittir/*` manifest/diagnostics/fixtures

**Interfaces:**
- Consumes: Tasks 1+2's fixed collision detection. Consumes the existing `field()`/`alias()` override DSL primitives already used by `content-collision`'s prior fix (this session's earlier work; same pattern — see `docs/superpowers/specs/2026-07-14-pr-l-heuristics-to-fail-design.md` if present, or the git history for the commit(s) that resolved `_object_type_group1`/`public_field_definition`'s content-collision instances, for the exact override authoring style this project uses).
- Produces: an updated, real inventory of `storagename-collision` instances (owning kind, colliding slot name, and the two-or-more grammar positions involved) written into each grammar's `packages/<lang>/.sittir/grammar-diagnostics.json` — this inventory is the concrete input to this task's own remediation steps below, and is NOT knowable in advance (this plan intentionally does not hardcode expected kind names — see the Investigation record at the top of this document for why the previously-suspected 5-name list must not be assumed correct or complete).

- [ ] **Step 1: Regenerate all 3 grammars and inspect the new diagnostics**

```bash
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar "$g" --all --output "packages/$g/src"
done
```

Then inspect each grammar's diagnostics for the new code:

```bash
for g in rust typescript python; do
  python3 -c "
import json
d = json.load(open('packages/$g/.sittir/grammar-diagnostics.json'))
items = d if isinstance(d, list) else d.get('diagnostics', d)
sc = [i for i in items if isinstance(i, dict) and i.get('code') == 'storagename-collision']
print('$g', len(sc))
for i in sc: print('  ', i.get('ownerKind'), i.get('details'))
"
done
```

Expected: some non-negative count per grammar (do not assume zero — this is exactly what Tasks 1-2 were built to reveal). Record the exact owning-kind + colliding-storageName list this prints; it is the worklist for Step 2.

- [ ] **Step 2: For each surfaced collision, disambiguate via a grammar override**

For each `(ownerKind, storageName)` pair from Step 1's output, open the corresponding `packages/<lang>/overrides.ts` and add a `field()` override that gives at least one of the colliding positions its own distinct field name — matching the exact override-authoring convention already used for `content-collision`'s 2 prior instances (`_object_type_group1`, `public_field_definition` in `packages/typescript/overrides.ts`); read that file's existing override entries for those two kinds first and follow the same shape (do not invent a new override style). If a colliding pair turns out to be a case where merging really was semantically correct (e.g. a true union-of-kinds-at-one-position that Task 1/2 now correctly refuses to auto-merge because neither side is field-named, but which the grammar author actually intends as one combined slot), the fix there is instead a `field()`-name added to BOTH positions under the SAME name in overrides.ts (making them legitimately named and thus still eligible for Task 1's preserved "both named → merge" path) — use judgment per-kind based on what the grammar rule actually means; do not mechanically field-name every instance without reading its rule shape first.

- [ ] **Step 3: Regenerate again and confirm zero `storagename-collision` instances remain**

Re-run Step 1's regen + inspection commands. Expected: 0 `storagename-collision` entries across all 3 grammars.

- [ ] **Step 4: Full validate:native sweep**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: rust/typescript/python read-render-parse AST-match counts match the Task 1 pre-change baseline exactly (123/136, 76/111, 108/115) — this task's overrides are disambiguation-only (giving distinct field names to positions that were already structurally distinct), so byte-for-byte parse/render output must not change. Any regression here is stop-and-investigate, not a byte-diff to wave through.

- [ ] **Step 5: `cargo check`**

```bash
cargo check --workspace --features napi-bindings
```

Expected: clean, exit 0.

- [ ] **Step 6: Commit**

Stage the overrides.ts changes and the regenerated source/manifest/fixtures together (regen output must travel with the override that produced it, per this project's convention); if `validate:native`'s own output files changed independent of the override diff, split those into a separate `chore(validator)` commit per Global Constraints:

```bash
git add packages/rust/overrides.ts packages/typescript/overrides.ts packages/python/overrides.ts \
        packages/rust/src packages/typescript/src packages/python/src \
        packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
git commit -m "fix(codegen): disambiguate real storagename collisions surfaced by the fixed collision check"
```

---

### Task 4: Burn down `content-collision`'s 2 live instances

**Files:**
- Modify: `packages/typescript/overrides.ts`
- Regenerate: `packages/typescript/src/*`, `packages/typescript/.sittir/*`

**Interfaces:**
- Consumes: the existing `content-collision` diagnostic (`packages/codegen/src/compiler/diagnostics/slot-grouping.ts`, construction site confirmed this session):

```ts
	if (!isAllTextShape(rule)) {
		const contentCount = countContentSlots(rule);
		if (contentCount > 1) {
			records.push({
				code: 'content-collision',
				severity: 'warning',
				message: `Kind '${ownerKind}' has ${contentCount} anonymous 'content' slots that would share the '_content' storage key.`,
				canProceed: true,
				ownerKind,
				slotCount: contentCount,
				proposal: `Kind '${ownerKind}' has ${contentCount} anonymous 'content' slots that would share the '_content' storage key (an unemittable ambiguity). field()-name at least one in overrides.ts.`
			});
		}
	}
```
- Produces: 0 live `content-collision` instances in `packages/typescript/.sittir/grammar-diagnostics.json` (currently 2, confirmed this session: `_object_type_group1`, `public_field_definition`, both `canProceed: true`/`severity: 'warning'`).

- [ ] **Step 1: Confirm the 2 live instances and their exact rule shapes**

```bash
python3 -c "
import json
d = json.load(open('packages/typescript/.sittir/grammar-diagnostics.json'))
items = d if isinstance(d, list) else d.get('diagnostics', d)
for i in items:
    if i.get('code') == 'content-collision': print(i)
"
```

Expected: 2 entries, `ownerKind` = `_object_type_group1` and `public_field_definition`. Note each one's `slotCount` from the output.

- [ ] **Step 2: Add `field()` overrides for both kinds**

In `packages/typescript/overrides.ts`, following this diagnostic's own `proposal` message ("field()-name at least one in overrides.ts") and this project's existing override-authoring conventions (read the file's current entries for neighboring `object_type`/`class_body`-family kinds before writing new ones — do not invent a different shape), add a `field()` override for `_object_type_group1` and `public_field_definition` that names at least `contentCount - 1` of each kind's anonymous content positions.

- [ ] **Step 3: Regenerate typescript and confirm zero remain**

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src
python3 -c "
import json
d = json.load(open('packages/typescript/.sittir/grammar-diagnostics.json'))
items = d if isinstance(d, list) else d.get('diagnostics', d)
print([i for i in items if i.get('code') == 'content-collision'])
"
```

Expected: `[]`.

- [ ] **Step 4: Full validate:native sweep**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: typescript's count matches the pre-Task-4 baseline exactly (post-Task-3, whatever that settled at — disambiguation-only change, no parse/render byte differences expected). rust/python untouched by this task, must be unchanged from Task 3's final numbers.

- [ ] **Step 5: Commit**

```bash
git add packages/typescript/overrides.ts packages/typescript/src packages/typescript/.sittir
git commit -m "fix(codegen): disambiguate content-collision's 2 live typescript instances"
```

---

### Task 5: Flip all three diagnostics to blocking severity

**Files:**
- Modify: `packages/codegen/src/compiler/diagnostics/slot-grouping.ts` (content-collision's `canProceed`)
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts` (the two per-code overrides for `storagename-collision` and `parsekind-noninjective`, both inside `collectGrammarDiagnostics`)
- Test: `packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts` (existing file; confirmed this session it already tests `collectGrammarDiagnosticsForGrammar`/`collectGrammarDiagnostics` end-to-end via a `buildRawGrammar` helper + `buildRuleCatalog`/`alias`/`choice` from `../evaluate.ts`, including an existing `'emits parsekind-noninjective records from compiler-produced collisions'` test whose fixture is reusable directly — see Step 1)

**Interfaces:**
- Consumes: Tasks 3+4's zero-live-instance state for all three diagnostics (this task must be LAST — flipping `canProceed` before burn-down would immediately break every regen in this repo).
- Produces: `content-collision`, `storagename-collision`, and `parsekind-noninjective` all report `canProceed: false` when they fire, while `typename-collision` (still sharing `fromAssembleWarning` with `storagename-collision`), `seq-with-nested-seq` (a separate `DeriveShapeDiagnostic` code, untouched by any edit in this task), and enrich's own info-severity `parsekind-noninjective` audit-trail diagnostics (which reach the preflight via a SEPARATE merge in `packages/codegen/src/run-codegen.ts`'s `getEnrichUnaliasDiagnostics`, never through `collectGrammarDiagnostics`'s `parseKindMapped` line) remain exactly as non-blocking as they are today.

Current code confirmed this session:

`packages/codegen/src/compiler/diagnostics/slot-grouping.ts` (content-collision construction, quoted in full in Task 4).

`packages/codegen/src/types/parsekind-collisions.ts:60-77` (`diagnoseParseKindCollisions`, the SHARED producer — do not modify; hardcodes `canProceed: true` for every fired diagnostic, consumed both by the assemble-time path this task targets AND by enrich's own non-blocking audit-trail path, which must stay unaffected):

```ts
		diagnostics.push({
			code: 'parsekind-noninjective',
			severity: 'error',
			message:
				`Slot '${input.slotName}' of kind '${input.ownerKind}' ` +
				`collapses [${storageKinds.join(', ')}] onto parse kind '${parseKind}'.`,
			canProceed: true,
			ownerKind: input.ownerKind,
			slotName: input.slotName,
			shape: 'propose-distinct-alias',
			parseKind,
			storageKinds,
			proposal: /* ... */
		});
```

`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:26-44` (`fromParseKindCollision` — forwards `canProceed` verbatim from its input; do not modify, shared with enrich's own separate consumption path):

```ts
export function fromParseKindCollision(grammar: string, diagnostic: ParseKindCollisionDiagnostic): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: diagnostic.code,
		severity: diagnostic.severity,
		grammar,
		ownerKind: diagnostic.ownerKind,
		slotName: diagnostic.slotName,
		message: diagnostic.message,
		proposal: diagnostic.proposal,
		canProceed: diagnostic.canProceed,
		details: { parseKind: diagnostic.parseKind, storageKinds: diagnostic.storageKinds }
	};
}
```

`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:63-79` (`fromAssembleWarning` — the SHARED mapper for `storagename-collision` AND `typename-collision`; do not modify its own `canProceed: true` line, since that would incorrectly re-block `typename-collision`'s still-live, still-intentionally-non-blocking instances):

```ts
export function fromAssembleWarning(grammar: string, warning: AssembleWarning): GrammarDiagnostic {
	const severity = warning.code === 'typename-collision' ? 'info' : 'warning';
	return {
		scope: 'grammar',
		code: warning.code,
		severity,
		grammar,
		ownerKind: warning.ownerKind,
		message: warning.message,
		canProceed: true,
		details: warning.details
	};
}
```

`packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts:95-113` (`collectGrammarDiagnostics` — the exact call site both per-code overrides land in; find the two mapping lines, `parseKindMapped` and the `assembleWarnings`-mapping line, inside this function before editing, since exact surrounding line numbers may have shifted since this session's reads):

- [ ] **Step 1: Write the failing tests**

Add to `packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`, inside the existing `describe('grammar diagnostics preflight', ...)` block, reusing the file's existing `buildRawGrammar` helper and `alias`/`choice`/`buildRuleCatalog` imports from `../evaluate.ts`:

```ts
	it('parsekind-noninjective now blocks (canProceed: false)', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: choice(
					alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
					{ type: 'SYMBOL', name: 'shared' },
					alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
				),
				left: { type: 'PATTERN', value: '[a-z]+' },
				shared: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'identifier', fieldName: 'body' },
						{ type: 'SYMBOL', name: 'identifier2', fieldName: 'tail' }
					]
				},
				right: { type: 'PATTERN', value: '[0-9]+' },
				identifier: { type: 'PATTERN', value: '[a-z_]\\w*' },
				identifier2: { type: 'PATTERN', value: '[A-Z_]\\w*' }
			})
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({ code: 'parsekind-noninjective', ownerKind: 'host', canProceed: false })
		]);
	});

	it('content-collision now blocks (canProceed: false)', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				// unnamed seq of two unnamed multi-kind choices — both resolve to the
				// generic `content` storage name (same shape as content-collision.test.ts's
				// '_class_body_member shape' fixture).
				host: {
					type: 'SEQ',
					members: [
						choice({ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }),
						choice({ type: 'SYMBOL', name: 'c' }, { type: 'SYMBOL', name: 'd' })
					]
				},
				a: { type: 'PATTERN', value: 'a' },
				b: { type: 'PATTERN', value: 'b' },
				c: { type: 'PATTERN', value: 'c' },
				d: { type: 'PATTERN', value: 'd' }
			})
		});
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([expect.objectContaining({ code: 'content-collision', ownerKind: 'host', canProceed: false })])
		);
	});

	it('storagename-collision now blocks (canProceed: false)', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: {
					type: 'CHOICE',
					members: [
						{
							type: 'SEQ',
							members: [
								{ type: 'SYMBOL', name: 'op', fieldName: 'op' },
								{ type: 'SYMBOL', name: 'identifier' },
								{ type: 'SYMBOL', name: 'identifier' }
							]
						}
					]
				},
				op: { type: 'STRING', value: '+' },
				identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
			})
		});
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([expect.objectContaining({ code: 'storagename-collision', ownerKind: 'host', canProceed: false })])
		);
	});

	it('typename-collision stays non-blocking (regression guard on the shared fromAssembleWarning mapper)', () => {
		// typename-collision is the ONLY other code sharing fromAssembleWarning
		// with storagename-collision (confirmed this session: fromAssembleWarning's
		// own severity branch names it explicitly). seq-with-nested-seq is a
		// DeriveShapeDiagnostic mapped by the separate fromDeriveShape function
		// (see the 'includes derive-shape diagnostics in the shared batch' test
		// above, which already pins its canProceed: true unchanged) — untouched by
		// Step 4's edit, so it needs no separate guard here.
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [],
			assembleWarnings: [
				{ code: 'typename-collision', ownerKind: 'host', message: 'auto-resolved rename', details: {} }
			]
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({ code: 'typename-collision', ownerKind: 'host', severity: 'info', canProceed: true })
		]);
	});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`
Expected: `'parsekind-noninjective now blocks'`, `'content-collision now blocks'`, and `'storagename-collision now blocks'` all FAIL (still `canProceed: true` today). `'typename-collision stays non-blocking'` PASSES already (it documents behavior this task must not change).

- [ ] **Step 3: Flip `content-collision`**

In `packages/codegen/src/compiler/diagnostics/slot-grouping.ts`, change the `content-collision` record's `canProceed: true` to `canProceed: false` (single-field edit, no other change to that record).

- [ ] **Step 4: Flip `storagename-collision` via a per-code override, not the shared mapper**

In `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`, locate `collectGrammarDiagnostics`'s mapping of `input.assembleWarnings` through `fromAssembleWarning` and wrap it with a per-code override:

```ts
	const assembleMapped = input.assembleWarnings.map((warning) => {
		const mapped = fromAssembleWarning(input.grammar, warning);
		// storagename-collision is the ONLY assemble-warning code PR-L blocks on.
		// typename-collision (the only other code sharing fromAssembleWarning)
		// stays exactly as fromAssembleWarning already maps it (still has live,
		// accepted, non-blocking instances) — do not touch fromAssembleWarning
		// itself, which would flip it as a side effect.
		return warning.code === 'storagename-collision' ? { ...mapped, canProceed: false } : mapped;
	});
```

(Match this to the exact current variable name/shape at the real call site — this session confirmed the line exists as `input.assembleWarnings.map(...)` feeding `collectGrammarDiagnostics`'s combined output, per the earlier-read `collectGrammarDiagnosticsForGrammar`/`collectGrammarDiagnostics` wiring, but confirm the precise current variable name before editing.)

- [ ] **Step 5: Flip `parsekind-noninjective` via a per-code override at its own call site, not the shared producer**

In the SAME function, locate the `parseKindMapped = input.parseKindCollisions.map((diagnostic) => fromParseKindCollision(input.grammar, diagnostic))` line (confirmed this session) and change it to:

```ts
	const parseKindMapped = input.parseKindCollisions.map((diagnostic) => ({
		...fromParseKindCollision(input.grammar, diagnostic),
		// Assemble-time parsekind-noninjective means enrich did NOT resolve this
		// collision (an enrich-resolved one would already be gone from the
		// grammar by assemble time) — always genuinely blocking. Enrich's own
		// info-severity audit-trail diagnostics never reach this line (they merge
		// in separately, in run-codegen.ts's getEnrichUnaliasDiagnostics path),
		// so this override cannot affect them.
		canProceed: false
	}));
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/grammar-diagnostics.test.ts`
Expected: all 4 tests from Step 1 PASS.

- [ ] **Step 7: Run the full compiler/diagnostics + dsl suites**

Run: `pnpm exec vitest run packages/codegen/src/compiler packages/codegen/src/dsl`
Expected: no new failures versus baseline.

- [ ] **Step 8: Regenerate all 3 grammars and confirm the preflight gate now blocks correctly on a synthetic regression, then confirm it's clean today**

First confirm today's real state is clean (all 3 diagnostics at 0 live instances, per Tasks 3-4):

```bash
for g in rust typescript python; do
  pnpm exec tsx packages/cli/src/cli.ts gen --grammar "$g" --all --output "packages/$g/src"
done
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
```

Expected: exact same rust/typescript/python counts as Task 4's final state (this task changes only `canProceed` values on already-zero-instance diagnostics; no parse/render output should change at all). `cargo check --workspace --features napi-bindings` clean.

Then confirm the gate is a real gate (not just inert): temporarily reintroduce one of the burned-down collisions (e.g. revert Task 4's override for one kind locally, without committing) and re-run the regen — confirm `runGrammarDiagnosticsPreflight` now throws/blocks instead of silently warning. Revert this temporary change afterward (`git checkout -- packages/typescript/overrides.ts` or equivalent) and re-regenerate to restore the clean state before continuing.

- [ ] **Step 9: Update `docs/KNOWN_ISSUES.md` if needed**

If Task 3's burn-down left any accepted, documented exception (unlikely, since Task 3's own Step 3 requires zero remaining instances before proceeding — but if Task 3 was forced to accept a floor for some structurally-unresolvable case), confirm it is already documented there from Task 3; otherwise no change needed here.

- [ ] **Step 10: Commit**

```bash
git add packages/codegen/src/compiler/diagnostics/slot-grouping.ts \
        packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts \
        <test file from Step 1>
git commit -m "feat(codegen): flip content-collision, storagename-collision, and parsekind-noninjective to blocking severity"
```

- [ ] **Step 11: Final whole-plan validation**

```bash
SITTIR_NATIVE_DEBUG=0 pnpm run validate:native
cargo check --workspace --features napi-bindings
pnpm exec vitest run packages/codegen
```

Expected: all clean, matching the running baseline established across Tasks 1-4. This is the plan's final gate before requesting review / finishing the branch.
