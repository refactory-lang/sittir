/**
 * Emits overrides.suggested.ts — a runnable TypeScript module that
 * exports every derivation Link produced as real data and (more
 * importantly) as copy-pasteable grammar-extension snippets.
 *
 * Two tiers of content:
 *   1. `export const` data arrays (`promotedRules`, `inferredFields`,
 *      `repeatedShapes`) for programmatic consumption.
 *   2. A `suggestedRules` object literal whose entries match the
 *      shape of `overrides.ts` — each entry is a real
 *      `transform(original, { ... })` / `choice(...)` expression
 *      ready to drop into your `grammar(base, { rules })` map.
 *
 * The file is syntactically valid TypeScript. Nothing is commented
 * out: the suggested rules sit alongside the data exports so a
 * curator can import either, or pull specific entries out by hand.
 */

import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, SUPERTYPE, SYMBOL, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { NodeMap, DerivationLog, InferredFieldEntry, PromotedRuleEntry } from '../compiler/types.ts';
import { AssembledSupertype } from '../compiler/model/node-map.ts';
import type { Rule } from '../types/rule.ts';
import { isAsciiIdentifier } from '../util/identifier-shape.ts';

/**
 * Derive a short, readable base label for a single choice arm.
 *
 * Priority: explicit `variant()` label (from `tagVariants`) → named
 * symbol / supertype target → leading named member of a seq (symbol,
 * supertype, or identifier-shaped string literal) → `form${index}`
 * fallback.
 *
 * @param node - The rule for this choice arm.
 * @param index - Zero-based position within the parent CHOICE.
 * @returns A suggested name string (not yet deduplicated — use
 *   {@link deduplicateArmNames} to collide-resolve a full arm list).
 * @remarks Used when suggesting `variant(...)` for bare choices that
 *   lack explicit variant() markers. The name is a suggestion the
 *   grammar author can refine; the important property is that distinct
 *   arms produce distinct base names where possible.
 *
 *   Previously duplicated as an inline ladder inside `armNamesFor`.
 *   Both paths now share this base-name function.
 */
function deriveArmNameFromRule(node: Rule<'link'>, index: number): string {
	if (node.type === VARIANT) return node.name;
	if (node.type === SYMBOL || node.type === SUPERTYPE) return node.name;
	if (node.type === SEQ && node.members.length > 0) {
		// Lead with the first named member (symbol/supertype) or a
		// leading identifier-shaped string literal ('(' → 'paren', etc.
		// the caller can rename).
		for (const m of node.members) {
			if (m.type === 'symbol' || m.type === 'supertype') return m.name;
			if (m.type === 'string') {
				const s = m.value;
				if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) return s;
			}
		}
	}
	return `form${index}`;
}

/**
 * Assign collision-free names to all arms of a CHOICE node.
 *
 * @param members - The choice's arm rules, in order.
 * @param nameFn - Per-arm name derivation function (receives rule + index).
 *   Defaults to {@link deriveArmNameFromRule}.
 * @returns An array of unique strings, one per arm. Duplicate base names
 *   get a numeric suffix (2, 3, …) so `registerPolymorphVariant`'s
 *   uniqueness guard accepts the full set.
 */
function deduplicateArmNames(
	members: readonly Rule<'link'>[],
	nameFn: (m: Rule<'link'>, i: number) => string = deriveArmNameFromRule
): string[] {
	const counts = new Map<string, number>();
	return members.map((m, i) => {
		const base = nameFn(m, i);
		const seen = counts.get(base) ?? 0;
		counts.set(base, seen + 1);
		return seen === 0 ? base : `${base}${seen + 1}`;
	});
}

/**
 * Locate the first CHOICE reachable from the rule root through the
 * transparent composition wrappers that `variant()` can target — seq
 * members + single-content wrappers. Returns the path to that choice
 * (joinable with `/`) plus a suggested variant name per alternative.
 * Names come from `tagVariants` when present (`variant.name` — "semi",
 * "form_1", ...); fall back to `form_N` for untagged choices.
 *
 * Returns null if no choice is reachable — the rule isn't a polymorph
 * candidate despite Link's suggestion (rare but possible when multiple
 * passes run; defensive).
 */
function _locateTopLevelChoice(rule: Rule<'link'>): { choicePath: string; arms: string[] } | null {
	function walk(node: Rule<'link'>, path: string): { choicePath: string; arms: string[] } | null {
		if (node.type === CHOICE) {
			const arms = deduplicateArmNames(node.members, deriveArmNameFromRule);
			return { choicePath: path, arms };
		}
		if (node.type === SEQ) {
			for (let i = 0; i < node.members.length; i++) {
				const m = node.members[i]!;
				const sub = walk(m, path === '' ? `${i}` : `${path}/${i}`);
				if (sub) return sub;
			}
			return null;
		}
		if (node.type === FIELD) {
			// Field wrappers around choices — the common pattern the
			// promotePolymorph pass used to miss (e.g. python's
			// `field('wildcard_import', choice(...))`). Descend; the
			// emitted `variant()` overrides will replace the choice arms
			// and the author can optionally drop the outer field wrapper.
			return walk(node.content, path === '' ? '0' : `${path}/0`);
		}
		if (node.type === OPTIONAL || node.type === VARIANT || node.type === GROUP) {
			return walk(node.content, path === '' ? '0' : `${path}/0`);
		}
		return null;
	}
	return walk(rule, '');
}

/**
 * Find the position index of `targetSymbol` within a top-level SEQ rule.
 * Matches both the bare symbol (held inference — pipeline didn't rewrite)
 * and the already-wrapped `field(fieldName, symbol(targetSymbol))` shape
 * (applied inference). Returns null when the rule is not a SEQ at the
 * top level or the target can't be located as a direct member.
 */
function findSymbolPosition(rule: Rule<'link'>, targetSymbol: string, fieldName: string): number | null {
	if (rule.type !== SEQ) return null;
	const unwrap = (r: Rule<'link'>): Rule<'link'> => {
		switch (r.type) {
			case OPTIONAL:
			case VARIANT:
			case GROUP:
				return unwrap(r.content);
			default:
				return r;
		}
	};
	for (let i = 0; i < rule.members.length; i++) {
		const m = unwrap(rule.members[i]!);
		if (m.type === SYMBOL && m.name === targetSymbol) return i;
		if (
			m.type === FIELD &&
			m.name === fieldName &&
			unwrap(m.content).type === SYMBOL &&
			(unwrap(m.content) as { name: string }).name === targetSymbol
		) {
			return i;
		}
	}
	return null;
}

/**
 * Round-trip diagnostic captured by corpus validation. One entry per
 * corpus case that failed parse → readNode → render → reparse: we
 * surface the offending rule kind plus an input/output diff so the
 * user can spot the drop (typically a missing `joinBy` separator, a
 * `transform()` patch that would wrap a repeated slot, or a render
 * template gap). Emitted as a dedicated section at the top of
 * overrides.suggested.ts.
 */
export interface RoundTripDiagnostic {
	/** Corpus entry name (e.g., "Async / await used as identifiers"). */
	readonly entry: string;
	/** Rule<'link'> kind the validator was testing. */
	readonly kind: string;
	/**
	 * Which validator raised the diagnostic:
	 *  - 'render' — `parse → readNode → render → reparse`
	 *    (template / routing / joinBy issues)
	 *  - 'factory' — `parse → readNode → factory() → render → reparse`
	 *    (factory API surface gaps: missing fields, wrong defaults)
	 */
	readonly source: 'render' | 'factory';
	/** What broke — 'parse-error' (rendered text unparseable) or 'ast-mismatch' (structural drift). */
	readonly category: 'parse-error' | 'ast-mismatch';
	/** Input source text. */
	readonly input?: string;
	/** Rendered text (what the renderer emitted). Absent when parse-error occurs before render. */
	readonly rendered?: string;
	/** Human-readable message from the validator. */
	readonly message: string;
}

export interface EmitSuggestedConfig {
	grammar: string;
	nodeMap: NodeMap;
	/** Corpus round-trip diagnostics, collected by CLI --roundtrip. */
	roundTripFailures?: readonly RoundTripDiagnostic[];
}

export function emitSuggested(config: EmitSuggestedConfig): string {
	// DISABLED FOR NOW (cleanup-slot-naming-source): the suggested-overrides
	// emitter reads the slot `source`/naming model, which is being reworked
	// (link field-inference deleted; group-lift→hiddenness; source→metadata).
	// Returning a stub insulates the codegen run from those changes. Re-enable
	// once the slot-naming/source refactor settles. The body below is retained
	// (unreachable) so re-enabling is a one-line revert.
	return (
		`// Auto-generated by @sittir/codegen — DO NOT EDIT\n` +
		`// overrides.suggested.ts emission is temporarily DISABLED while the\n` +
		`// slot-naming / source model is being reworked. See emitSuggested().\n`
	);

	const { grammar, nodeMap, roundTripFailures = [] } = config;
	const log: DerivationLog = nodeMap.derivations;
	const lines: string[] = [];

	lines.push('// Auto-generated by @sittir/codegen — DO NOT EDIT');
	lines.push('//');
	lines.push(`// Derivation log for grammar '${grammar}' — copy-pasteable`);
	lines.push('// grammar extension snippets plus the raw data arrays they');
	lines.push('// came from. Every `suggestedRules` entry is a real');
	lines.push('// `transform(...)` or `choice(...)` expression; paste the');
	lines.push('// ones you want into your own overrides.ts.');
	lines.push('');
	lines.push('// @ts-nocheck — the DSL globals (grammar, transform, field,');
	lines.push("// choice, $) are injected by @sittir/codegen's evaluator at");
	lines.push('// runtime. This file is documentation / copy-paste source,');
	lines.push("// not a standalone module; it isn't imported at build time.");
	lines.push('');

	// ---------------------------------------------------------------
	// Summary
	// ---------------------------------------------------------------
	const inferredApplied = log.inferredFields.filter((e) => e.applied).length;
	const inferredHeld = log.inferredFields.length - inferredApplied;
	const promotedApplied = log.promotedRules.filter((e) => e.applied).length;
	const promotedHeld = log.promotedRules.length - promotedApplied;

	lines.push('// ---------------------------------------------------------------');
	lines.push('// Summary');
	lines.push('// ---------------------------------------------------------------');
	lines.push(`// Field inferences:  ${log.inferredFields.length}  (${inferredApplied} applied, ${inferredHeld} held)`);
	lines.push(`// Rule<'link'> promotions:   ${log.promotedRules.length}  (${promotedApplied} applied, ${promotedHeld} held)`);
	lines.push(`// Repeated shapes:   ${log.repeatedShapes.length}  (advisory — suggested supertypes/groups)`);
	if (roundTripFailures.length > 0) {
		const parseErrors = roundTripFailures.filter((f) => f.category === 'parse-error').length;
		const astMismatches = roundTripFailures.filter((f) => f.category === 'ast-mismatch').length;
		const renderFails = roundTripFailures.filter((f) => f.source === 'render').length;
		const factoryFails = roundTripFailures.filter((f) => f.source === 'factory').length;
		lines.push(
			`// Round-trip fails: ${roundTripFailures.length}  (${parseErrors} parse errors, ${astMismatches} AST mismatches; ${renderFails} render, ${factoryFails} factory)`
		);
	}
	lines.push('');

	// ---------------------------------------------------------------
	// Round-trip failures (corpus diagnostics)
	// ---------------------------------------------------------------
	if (roundTripFailures.length > 0) {
		lines.push('// ---------------------------------------------------------------');
		lines.push("// Round-trip failures — corpus cases that didn't survive");
		lines.push('// parse → readNode → render → reparse. Each entry shows the');
		lines.push('// input and rendered text so you can spot what the renderer');
		lines.push('// dropped. Common causes:');
		lines.push('//   - Repeated slot missing a `joinBy` separator (renders only');
		lines.push('//     the first occurrence of a multi-valued field)');
		lines.push('//   - Missing `transform()` patch wrapping an anonymous token');
		lines.push('//     that should be a named field');
		lines.push('//   - Template gap — rule content has no renderable slot for');
		lines.push('//     some structural position');
		lines.push('// ---------------------------------------------------------------');
		// Group by rule kind so related failures cluster.
		const byKind = new Map<string, RoundTripDiagnostic[]>();
		for (const f of roundTripFailures) {
			const arr = byKind.get(f.kind) ?? [];
			arr.push(f);
			byKind.set(f.kind, arr);
		}
		lines.push('export const roundTripFailures: Array<{');
		lines.push('  readonly entry: string;');
		lines.push('  readonly kind: string;');
		lines.push('  readonly source: "render" | "factory";');
		lines.push('  readonly category: "parse-error" | "ast-mismatch";');
		lines.push('  readonly input?: string;');
		lines.push('  readonly rendered?: string;');
		lines.push('  readonly message: string;');
		lines.push('}> = [');
		for (const [kind, failures] of byKind) {
			lines.push(`  // --- ${kind} (${failures.length}) ---`);
			for (const f of failures) {
				lines.push(`  {`);
				lines.push(`    entry: ${JSON.stringify(f.entry)},`);
				lines.push(`    kind: ${JSON.stringify(kind)},`);
				lines.push(`    source: ${JSON.stringify(f.source)},`);
				lines.push(`    category: ${JSON.stringify(f.category)},`);
				if (f.input !== undefined) lines.push(`    input:    ${JSON.stringify(f.input)},`);
				if (f.rendered !== undefined) lines.push(`    rendered: ${JSON.stringify(f.rendered)},`);
				lines.push(`    message: ${JSON.stringify(f.message)},`);
				lines.push(`  },`);
			}
		}
		lines.push('];');
		lines.push('');
	}

	// ---------------------------------------------------------------
	// Copy-paste ready transforms block (ADR-0008)
	// ---------------------------------------------------------------
	// Inferred fields + polymorph candidates produce patch maps that
	// belong in the `transforms:` block of overrides.ts — each value
	// is a plain object (or array of objects for multiple patch sets)
	// that `transform()` unpacks at rule-evaluation time. Keeping them
	// separate from `suggestedRules` matches the two-block shape the
	// grammars now author by hand (see rust/overrides.ts for the
	// template).
	lines.push('// ---------------------------------------------------------------');
	lines.push('// suggestedTransforms — drop entries into your overrides.ts');
	lines.push('// `transforms:` block. Each value is a patch map (or an');
	lines.push('// array of patch maps when both field and polymorph');
	lines.push('// candidates target the same kind).');
	lines.push('// ---------------------------------------------------------------');
	lines.push('export const suggestedTransforms = {');

	const { emittedKinds: transformKinds, emit: emitTransform, quoteKey } = createDeduplicatingEmitter();

	const inferredByKind = groupInferencesByKind(log.inferredFields);
	const polymorphHolds = log.promotedRules.filter((e) => e.classification === 'polymorph' && !e.applied);
	const polymorphByKind = new Map(polymorphHolds.map((e) => [e.kind, e] as const));
	const allTransformKinds = [...new Set([...inferredByKind.keys(), ...polymorphByKind.keys()])].sort();

	for (const kind of allTransformKinds) {
		const inferred = inferredByKind.get(kind);
		const polymorph = polymorphByKind.get(kind);
		const parentRule = nodeMap.rules?.[kind];

		const fieldPatches: Array<{
			pos: number;
			fieldName: string;
			targetSymbol: string;
			applied: boolean;
			pct: number;
			samples: number;
		}> = [];
		const nonPositional: InferredFieldEntry[] = [];
		if (inferred !== undefined) {
			// `inferred` is captured by the `emitTransform(kind, () => …)`
			// closure later in this loop body; tsgo's control-flow narrowing
			// doesn't carry the `!== undefined` guard through to reads here once
			// a later closure in the same scope also references the variable
			// (verified in isolation — the guard is genuinely sound at runtime).
			// Non-null assertion matches the file's existing idiom for
			// checker-can't-see-it cases (e.g. `node.members[i]!` above).
			const resolved = inferred!.map((e) => ({
				e,
				pos: parentRule ? findSymbolPosition(parentRule, e.targetSymbol, e.fieldName) : null
			}));
			const seen = new Set<string>();
			for (const { e, pos } of resolved) {
				if (pos === null) {
					nonPositional.push(e);
					continue;
				}
				const dkey = `${e.fieldName}::${e.targetSymbol}`;
				if (seen.has(dkey)) continue;
				seen.add(dkey);
				fieldPatches.push({
					// tsgo does not narrow the destructured `pos` through the
					// `pos === null` continue above (verified: removing the assertion
					// fails TS2322) — same checker gap as the `inferred!` case.
					pos: pos!,
					fieldName: e.fieldName,
					targetSymbol: e.targetSymbol,
					applied: e.applied,
					pct: e.agreement * 100,
					samples: e.sampleSize
				});
			}
		}

		const polymorphCandidates = polymorph?.polymorphCandidates ?? [];
		const hasVariantPatch = polymorphCandidates.length > 0;
		const hasFieldPatch = fieldPatches.length > 0;

		emitTransform(kind, () => {
			if (inferred) lines.push(`  // ${kind}: ${inferred.length} inferred field(s)`);
			for (const e of nonPositional) {
				const tag = e.applied ? 'applied' : 'held';
				const pct = (e.agreement * 100).toFixed(0);
				lines.push(
					`  // [${tag}] ${quoteKey(kind)} field '${e.fieldName}' on $.${e.targetSymbol}` +
						` — ${pct}% agreement, ${e.sampleSize} parents. Parent rule is not a top-level` +
						` SEQ so transform() can't target a position; inference is applied inside Link's` +
						` applyInferredFields pass (tree rewrite) rather than via overrides.ts.`
				);
			}
			if (!hasFieldPatch && !hasVariantPatch) {
				lines.push('');
				return;
			}

			if (polymorph && hasVariantPatch) {
				const total = polymorphCandidates.reduce((s, c) => s + c.choiceArmCount, 0);
				lines.push(`  // [held] polymorph — ${polymorphCandidates.length} choice position(s), ${total} arm(s) total`);
				if (polymorphCandidates.some((c) => c.fieldWrapperName)) {
					const wrapped = polymorphCandidates
						.filter((c) => c.fieldWrapperName)
						.map((c) => c.fieldWrapperName)
						.join(', ');
					lines.push(`  // note: choice(s) sit inside field() wrapper(s) — variant() will supersede: ${wrapped}`);
				}
			}

			// Emit the value — patch map for single patch set, array for multiple.
			// Polymorph candidates each want their own patch set (tryHoistSiblingVariants
			// requires all variant patches in one set to target the same choice position).
			const patchSets: string[][] = [];
			if (hasFieldPatch) {
				const block = ['{'];
				for (const p of fieldPatches) {
					const tag = p.applied ? 'applied' : 'held';
					block.push(`  // [${tag}] ${p.pct.toFixed(0)}% agreement, ${p.samples} parents`);
					block.push(`  ${p.pos}: field(${JSON.stringify(p.fieldName)}),  // $.${p.targetSymbol}`);
				}
				block.push('}');
				patchSets.push(block);
			}
			for (const cand of polymorphCandidates) {
				const block = ['{'];
				cand.armNames.forEach((armName, i) => {
					const key = cand.path === '' ? `${i}` : `${cand.path}/${i}`;
					block.push(`  ${JSON.stringify(key)}: variant(${JSON.stringify(armName)}),`);
				});
				block.push('}');
				patchSets.push(block);
			}
			const useArray = patchSets.length > 1;
			if (!useArray) {
				const [block] = patchSets;
				if (block) {
					lines.push(`  ${quoteKey(kind)}: ${block[0]}`);
					for (let i = 1; i < block.length - 1; i++) lines.push(`    ${block[i]}`);
					lines.push(`  ${block[block.length - 1]},`);
				}
			} else {
				lines.push(`  ${quoteKey(kind)}: [`);
				patchSets.forEach((block, si) => {
					const isLast = si === patchSets.length - 1;
					lines.push(`    ${block[0]}`);
					for (let i = 1; i < block.length - 1; i++) lines.push(`      ${block[i]}`);
					lines.push(`    ${block[block.length - 1]}${isLast ? '' : ','}`);
				});
				lines.push('  ],');
			}
			lines.push('');
		});
	}
	// Polymorph holds with no candidates — comment-only entries.
	for (const entry of polymorphHolds) {
		if (transformKinds.has(entry.kind)) continue;
		if ((entry.polymorphCandidates ?? []).length === 0) {
			emitTransform(entry.kind, () => {
				lines.push(`  // [held] polymorph — no candidates captured at Link time for '${entry.kind}'`);
				lines.push('');
			});
		}
	}

	lines.push('};');
	lines.push('');

	// ---------------------------------------------------------------
	// Copy-paste ready rules block — supertype & repeated-shape definitions
	// ---------------------------------------------------------------
	// These are NEW rule definitions (not transforms of existing ones)
	// so they stay in `suggestedRules` with the `$ => ...` callback
	// shape used by overrides.ts's `rules:` block.
	lines.push('// ---------------------------------------------------------------');
	lines.push('// suggestedRules — drop entries into your overrides.ts');
	lines.push('// `rules:` block. Each value defines a NEW rule (supertype');
	lines.push('// union or repeated-shape group) authored as a `$ => ...`');
	lines.push('// callback.');
	lines.push('// ---------------------------------------------------------------');
	lines.push('export const suggestedRules = {');

	const { emit } = createDeduplicatingEmitter();

	// Promoted supertypes become `_name: $ => choice($.a, $.b, ...)`
	// rules and get a reminder to list them in the grammar's
	// `supertypes:` array.
	const promotedSupertypes = log.promotedRules
		.filter((e) => e.classification === 'supertype')
		.sort((a, b) => a.kind.localeCompare(b.kind));
	if (promotedSupertypes.length > 0) {
		lines.push('  // --- Promoted supertypes (add matching names to grammar.supertypes) ---');
	}
	for (const entry of promotedSupertypes) {
		const node = nodeMap.nodes.get(entry.kind);
		// `node instanceof AssembledSupertype` is the established discriminator
		// for reaching `.subtypes` (see emitters/shared.ts:264/287) — a bare
		// `modelType === 'supertype'` string comparison doesn't narrow the
		// `AssembledNode` union to the concrete class. tsgo's control-flow
		// narrowing doesn't carry through to the ternary's true-branch member
		// access here (verified in isolation), so the `.subtypes` read needs an
		// explicit non-null + cast past the checker gap.
		const subs = node instanceof AssembledSupertype ? (node as AssembledSupertype).subtypes : [];
		emit(entry.kind, () => {
			const tag = entry.applied ? 'applied' : 'held';
			lines.push(`  // [${tag}] promoted supertype`);
			if (subs.length > 0) {
				const choices = subs.map((s) => `$.${s}`).join(', ');
				lines.push(`  ${quoteKey(entry.kind)}: $ => choice(${choices}),`);
			} else {
				lines.push(`  ${quoteKey(entry.kind)}: $ => choice(/* no subtypes recorded */),`);
			}
			lines.push('');
		});
	}

	// Repeated-shape candidates — emit the proposed supertype rule
	// verbatim so the author can adopt it by pasting one line plus
	// the supertypes-array entry.
	if (log.repeatedShapes.length > 0) {
		lines.push('  // --- Repeated-shape candidates (reused across ≥2 parents) ---');
	}
	const sortedShapes = [...log.repeatedShapes].sort((a, b) => {
		if (b.parents.length !== a.parents.length) return b.parents.length - a.parents.length;
		return a.kinds.length - b.kinds.length;
	});
	for (const shape of sortedShapes) {
		emit(shape.suggestedName, () => {
			lines.push(`  // parents: ${shape.parents.join(', ')}`);
			const choices = shape.kinds.map((k) => `$.${k}`).join(', ');
			lines.push(`  ${quoteKey(shape.suggestedName)}: $ => choice(${choices}),`);
			lines.push('');
		});
	}

	lines.push('};');
	lines.push('');

	// ---------------------------------------------------------------
	// suggestedGroups — nested-seq candidates for group synthesis
	// ---------------------------------------------------------------
	// Use linkedRules (post-Link, pre-Optimize) so the detector sees
	// the natural grammar shape with nested seqs intact. Fall back to
	// post-Optimize rules when linkedRules is absent.
	const groupRules = nodeMap.linkedRules ?? nodeMap.rules ?? {};
	const groupCandidates = detectGroupCandidates(groupRules);
	lines.push(emitSuggestedGroupsBlock(groupCandidates));

	// ---------------------------------------------------------------
	// Raw data exports — typed arrays for programmatic consumption
	// ---------------------------------------------------------------
	lines.push('// ---------------------------------------------------------------');
	lines.push('// Raw derivation data — typed arrays for tooling');
	lines.push('// ---------------------------------------------------------------');
	lines.push('export interface PromotedRule {');
	lines.push('  readonly kind: string;');
	lines.push("  readonly classification: 'enum' | 'supertype' | 'terminal' | 'polymorph';");
	lines.push('  readonly applied: boolean;');
	lines.push('}');
	lines.push('export const promotedRules: readonly PromotedRule[] = [');
	for (const entry of sortedPromotions(log.promotedRules)) {
		lines.push(
			`  { kind: ${JSON.stringify(entry.kind)}, classification: ${JSON.stringify(entry.classification)}, applied: ${entry.applied} },`
		);
	}
	lines.push('];');
	lines.push('');

	lines.push('export interface InferredField {');
	lines.push('  readonly kind: string;');
	lines.push('  readonly fieldName: string;');
	lines.push('  readonly targetSymbol: string;');
	lines.push("  readonly confidence: 'high' | 'medium' | 'low';");
	lines.push('  readonly agreement: number;');
	lines.push('  readonly sampleSize: number;');
	lines.push('  readonly applied: boolean;');
	lines.push('}');
	lines.push('export const inferredFields: readonly InferredField[] = [');
	for (const entry of sortedInferences(log.inferredFields)) {
		lines.push(
			'  { ' +
				`kind: ${JSON.stringify(entry.kind)}, ` +
				`fieldName: ${JSON.stringify(entry.fieldName)}, ` +
				`targetSymbol: ${JSON.stringify(entry.targetSymbol)}, ` +
				`confidence: ${JSON.stringify(entry.confidence)}, ` +
				`agreement: ${entry.agreement.toFixed(3)}, ` +
				`sampleSize: ${entry.sampleSize}, ` +
				`applied: ${entry.applied}` +
				' },'
		);
	}
	lines.push('];');
	lines.push('');

	lines.push('export interface RepeatedShape {');
	lines.push('  readonly suggestedName: string;');
	lines.push('  readonly kinds: readonly string[];');
	lines.push('  readonly parents: readonly string[];');
	lines.push("  readonly shape: 'supertype' | 'group';");
	lines.push('}');
	lines.push('export const repeatedShapes: readonly RepeatedShape[] = [');
	for (const entry of sortedShapes) {
		lines.push(
			'  { ' +
				`suggestedName: ${JSON.stringify(entry.suggestedName)}, ` +
				`kinds: ${JSON.stringify(entry.kinds)}, ` +
				`parents: ${JSON.stringify(entry.parents)}, ` +
				`shape: ${JSON.stringify(entry.shape)}` +
				' },'
		);
	}
	lines.push('];');
	lines.push('');

	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Sort helpers — stable, skim-friendly ordering per section
// ---------------------------------------------------------------------------

function sortedPromotions(entries: readonly PromotedRuleEntry[]): PromotedRuleEntry[] {
	const order: Record<PromotedRuleEntry['classification'], number> = {
		supertype: 0,
		enum: 1,
		terminal: 2,
		polymorph: 3
	};
	return [...entries].sort((a, b) => {
		if (order[a.classification] !== order[b.classification]) {
			return order[a.classification] - order[b.classification];
		}
		return a.kind.localeCompare(b.kind);
	});
}

function sortedInferences(entries: readonly InferredFieldEntry[]): InferredFieldEntry[] {
	return [...entries].sort((a, b) => {
		const aScore = a.agreement * a.sampleSize;
		const bScore = b.agreement * b.sampleSize;
		if (aScore !== bScore) return bScore - aScore;
		return a.kind.localeCompare(b.kind);
	});
}

/**
 * Build the rule-block emitter: a closure over a seen-set that dedups
 * repeated kinds, plus a `quoteKey` helper so callers can render the
 * same kind as either a bare identifier or a JSON-quoted property key.
 *
 * @returns `{ emittedKinds, emit, quoteKey }` — shared state + emit closure
 * @remarks
 *   Every call to `emit(kind, fn)` is a no-op after the first for a given
 *   `kind`, so repeated entries in the source log collapse to one block.
 */
function createDeduplicatingEmitter(): {
	emittedKinds: Set<string>;
	emit: (kind: string, fn: () => void) => void;
	quoteKey: (k: string) => string;
} {
	const emittedKinds = new Set<string>();
	const emit = (kind: string, fn: () => void): void => {
		if (emittedKinds.has(kind)) return;
		emittedKinds.add(kind);
		fn();
	};
	const quoteKey = (k: string): string => (/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
	return { emittedKinds, emit, quoteKey };
}

/**
 * Group inferred-field entries by their parent kind.
 *
 * @param entries - Inferred-field entries from the derivation log.
 * @returns Map from kind string to the entries that inferred fields on it.
 */
function groupInferencesByKind(entries: readonly InferredFieldEntry[]): Map<string, InferredFieldEntry[]> {
	const byKind = new Map<string, InferredFieldEntry[]>();
	for (const e of entries) {
		const bucket = byKind.get(e.kind);
		if (bucket) bucket.push(e);
		else byKind.set(e.kind, [e]);
	}
	return byKind;
}

// ---------------------------------------------------------------------------
// Group candidate detection — suggestedGroups block
// ---------------------------------------------------------------------------

export interface GroupCandidate {
	/** Parent rule kind whose body contains the nested seq. */
	kind: string;
	/** Slash-separated positional path to the seq within the rule body. */
	path: string;
	/** Heuristic discriminator guess — first structural member's name, or position-based fallback. */
	discriminatorGuess: string;
}

/**
 * Walk rule bodies looking for nested seqs that could benefit from
 * group synthesis. Candidates:
 *   - Live inside a wrapper (not at the top level of the rule body).
 *   - Have ≥1 structural member (field / symbol / supertype).
 */
export function detectGroupCandidates(rules: Record<string, Rule<'link'>>): GroupCandidate[] {
	const out: GroupCandidate[] = [];
	for (const [kind, body] of Object.entries(rules)) {
		walkBodyForGroups(body, [], { kind, isTopLevel: true }, out);
	}
	return out;
}

function walkBodyForGroups(
	rule: Rule<'link'>,
	path: readonly number[],
	ctx: { kind: string; isTopLevel: boolean },
	out: GroupCandidate[]
): void {
	// (debt PR-P1) The former `source === 'group-lift'` skip-guard here was
	// PROVABLY DEAD: a bare SYMBOL rule never matches case 1 (OPTIONAL/REPEAT/
	// REPEAT1) or case 2 (SEQ) below, and the dispatch switch at the bottom of
	// this function has no SYMBOL case either — so a SYMBOL rule always
	// no-ops through this function regardless of any guard. Deleting it is a
	// pure no-op, not a provenance-to-structural conversion (there is no
	// structural fact to convert to; the check never did anything).

	// Case 1: A cardinality wrapper (optional/repeat/repeat1) whose content is a
	// structural seq — suggest the wrapper's path. This way the user's groups
	// entry points to the optional/repeat, and applyGroupOverrides's liftRule
	// preserves the wrapper (lifts only the inner seq body) as designed.
	if (
		(rule.type === OPTIONAL || rule.type === REPEAT || rule.type === REPEAT1) &&
		!ctx.isTopLevel
	) {
		const inner = (rule as { content: Rule<'link'> }).content;
		if (inner.type === SEQ && hasGroupableStructure(inner)) {
			out.push({
				kind: ctx.kind,
				path: path.join('/'),
				discriminatorGuess: guessGroupDiscriminator(inner, path)
			});
			// Don't descend further — the inner seq is captured by this entry.
			return;
		}
	}

	// Case 2: A non-top-level seq with structural members directly nested
	// inside a choice, seq, or field (no cardinality wrapper) — suggest the
	// seq's path directly.
	if (rule.type === SEQ && !ctx.isTopLevel && hasGroupableStructure(rule)) {
		out.push({
			kind: ctx.kind,
			path: path.join('/'),
			discriminatorGuess: guessGroupDiscriminator(rule, path)
		});
		// Don't descend into it — nested-seq-inside-seq candidates would be
		// sub-candidates of this one, and nested group lifts are unsupported.
		return;
	}

	const childCtx = { ...ctx, isTopLevel: false };
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			for (let i = 0; i < rule.members.length; i++) {
				walkBodyForGroups(rule.members[i]!, [...path, i], childCtx, out);
			}
			break;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case TOKEN:
		case ALIAS:
		case VARIANT:
			// For non-cardinality-with-structural-seq cases, descend normally.
			walkBodyForGroups((rule as { content: Rule<'link'> }).content, [...path, 0], childCtx, out);
			break;
		case GROUP:
			// A top-level `group` rule wraps the rule body transparently — treat
			// the group's content as still top-level so the body seq isn't
			// incorrectly flagged as a nested-seq candidate. At non-top-level a
			// group wrapper is meaningful (it signals grouping) so use childCtx.
			walkBodyForGroups(
				(rule as { content: Rule<'link'> }).content,
				[...path, 0],
				ctx.isTopLevel ? ctx : childCtx,
				out
			);
			break;
		// string / blank / pattern / supertype / symbol — no children to walk
	}
}

function hasGroupableStructure(rule: Rule<'link'>): boolean {
	switch (rule.type) {
		case FIELD:
		case SYMBOL:
		case SUPERTYPE:
			return true;
		case SEQ:
		case CHOICE:
			return rule.members.some(hasGroupableStructure);
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case TOKEN:
		case ALIAS:
		case VARIANT:
		case GROUP:
			return hasGroupableStructure((rule as { content: Rule<'link'> }).content);
		default:
			return false;
	}
}

function guessGroupDiscriminator(rule: Rule<'link'>, path: readonly number[]): string {
	const peel = (r: Rule<'link'>): string | null => {
		switch (r.type) {
			case SYMBOL:
			case SUPERTYPE:
				return r.name.replace(/^_+/, '').replace(/^\$\./, '');
			case FIELD:
				return r.name;
			case SEQ:
			case CHOICE:
				for (const m of r.members) {
					const n = peel(m);
					if (n) return n;
				}
				return null;
			case OPTIONAL:
			case REPEAT:
			case REPEAT1:
			case TOKEN:
			case ALIAS:
			case VARIANT:
			case GROUP:
				return peel((r as { content: Rule<'link'> }).content);
			default:
				return null;
		}
	};
	const guess = peel(rule);
	if (guess && isAsciiIdentifier(guess)) return guess;
	// Position-based fallback: 'g' + underscore-joined path (e.g. g1_1)
	return 'g' + path.join('_');
}

/**
 * Format the `suggestedGroups` export block. All entries are held —
 * the author copies them into the overrides.ts `groups:` block to activate.
 */
export function emitSuggestedGroupsBlock(candidates: readonly GroupCandidate[]): string {
	const out: string[] = [];
	out.push('// ---------------------------------------------------------------');
	out.push('// suggestedGroups — drop entries into your overrides.ts');
	out.push('// `groups:` block. Each entry lifts a nested sub-rule into');
	out.push('// a hidden synthesized kind materialized as AssembledGroup.');
	out.push('// All entries are held — none are auto-applied.');
	out.push('//');
	out.push('// CAVEAT: paths here are from the POST-LINK rule map. The synthesis');
	out.push('// pass runs on POST-EVALUATE rules (before polymorph alias rewrites).');
	out.push('// If a kind has been polymorph-aliased, the original-kind path may');
	out.push('// differ from what is shown here. Pick the kind that exists at');
	out.push('// synthesis time (often the polymorph-variant kind such as');
	out.push('// `_visibility_modifier_pub`) and adjust the path accordingly.');
	out.push('// validateGroupsConfig E2 will catch unresolvable paths with an');
	out.push('// actionable error.');
	out.push('// ---------------------------------------------------------------');
	out.push('export const suggestedGroups = {');

	if (candidates.length === 0) {
		out.push('};');
		out.push('');
		return out.join('\n');
	}

	// Group candidates by parent kind for readability.
	const byKind: Record<string, GroupCandidate[]> = {};
	for (const c of candidates) {
		(byKind[c.kind] ??= []).push(c);
	}

	const quoteKey = (k: string): string => (/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

	for (const [kind, list] of Object.entries(byKind)) {
		out.push(`  // [held] ${list.length} candidate(s)`);
		out.push(`  ${quoteKey(kind)}: {`);
		for (const c of list) {
			out.push(`    '${c.path}': '${c.discriminatorGuess}',`);
		}
		out.push('  },');
		out.push('');
	}

	out.push('};');
	out.push('');
	return out.join('\n');
}
