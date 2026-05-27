/**
 * reconcile-naming — PR-A WIDE divergence probe.
 *
 * For every AssembledNonterminal in each grammar's NodeMap, assert each legacy
 * projected slot name equals the value the §2 PROJECTION computes from the slot's
 * `values` + `fieldName` (`projectSlotNaming`): storageName, name, configKey,
 * propertyName, paramName. The probe drives `collect-slots` until 0 — proving
 * PR-B's getter swap is byte-identical.
 *
 * Projections, not stored `_new` fields: `parseNames` is the live set of CST
 * kinds tree-sitter emits (per-value `parseKind.name`), so it can't go stale
 * across `mergeSlotsByName`'s value-union (the old stored `parseNamesNew` did).
 * No emitter reads the projection yet — this is the acceptance probe.
 *
 * ## Usage
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts            # all grammars
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts --grammar rust
 *   npx tsx packages/codegen/src/scripts/reconcile-naming.ts --first 20 # first-N per grammar
 */
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble } from '../compiler/assemble.ts';
import { allStructuralSlotsOf, projectSlotNaming, type AssembledNonterminal } from '../compiler/node-map.ts';

const requireFromHere = createRequire(import.meta.url);
const GRAMMARS = ['rust', 'typescript', 'python'] as const;
type Grammar = (typeof GRAMMARS)[number];

export interface Divergence {
	kind: string;
	slot: string; // the legacy slot.name (its current identity)
	projection: 'storageName' | 'name' | 'configKey' | 'propertyName' | 'paramName';
	legacy: string;
	recomputed: string;
}

/**
 * Intended §2 renames, accepted as count-gated improvements (not byte-identical
 * to legacy). Each entry pins the EXACT expected delta — kind, slot, projection,
 * AND both the legacy and recomputed values. A divergence is allowlisted only if
 * it matches an entry on all five fields, so a NEW mismatch on the same slot (a
 * different projection, or the same projection with different values) is still
 * UNEXPECTED and fails the gate. This keeps the "count-gated" promise: the
 * allowlist suppresses precisely the known rename, nothing adjacent.
 *
 * These are inferred UNNAMED slots with a GENUINELY single parse-kind that §2
 * projects to the kind name, where legacy hard-coded the generic `content`; the
 * kind name is the desired surface, and the PR-B cutover renames the field.
 *
 * NB: only TRULY single-kind slots belong here. `splat_pattern.content` looked
 * single-kind but holds `[identifier, "_"]` (a literal with no parseKind); its
 * `content` name is correct and is now produced by the projection's
 * `hasUnnamedValue` guard — NOT allowlisted.
 */
export const ALLOWLISTED_RENAMES: readonly Divergence[] = [
	// format_specifier.content: genuinely 1 value → format_expression.
	{ kind: 'format_specifier', slot: 'content', projection: 'storageName', legacy: 'content', recomputed: 'format_expression' },
	{ kind: 'format_specifier', slot: 'content', projection: 'name', legacy: 'content', recomputed: 'format_expression' },
	{ kind: 'format_specifier', slot: 'content', projection: 'configKey', legacy: 'content', recomputed: 'formatExpression' },
	{ kind: 'format_specifier', slot: 'content', projection: 'propertyName', legacy: 'contents', recomputed: 'formatExpressions' },
	{ kind: 'format_specifier', slot: 'content', projection: 'paramName', legacy: 'contents', recomputed: 'formatExpressions' },
	// _suite.block: the OPPOSITE-direction correction (kind name → `content`).
	// _suite's values have storage-kinds {_simple_statements, block, _newline}
	// (all `parseKind=block`). storageKind→storageName makes this MULTI-storage
	// → `content`; legacy was cross-wired to the parseName `block`. The
	// projection corrects it (Fix 4 / spec §2); the PR-B cutover renames the
	// field. The 5 derived projections all flip block→content.
	{ kind: '_suite', slot: 'block', projection: 'storageName', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'name', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'configKey', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'propertyName', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'paramName', legacy: 'block', recomputed: 'content' },
	// match_block.match_arm (rust): same multi-storage-kind pattern as _suite —
	// the arm slot holds {match_arm, last_match_arm} (2 distinct, non-aliased
	// storage kinds), so storageKind→storageName yields `content`. Legacy was
	// cross-wired to the kind name `match_arm`. (Whether last_match_arm SHOULD be
	// unified with match_arm so the slot reads `matchArms` is a separate spec
	// question for the PR-B cutover.)
	{ kind: 'match_block', slot: 'match_arm', projection: 'storageName', legacy: 'match_arm', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'name', legacy: 'match_arm', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'configKey', legacy: 'matchArm', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'propertyName', legacy: 'matchArms', recomputed: 'contents' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'paramName', legacy: 'matchArms', recomputed: 'contents' },
];

/** A divergence is allowlisted only if it matches an expected rename on ALL fields. */
function isAllowlisted(d: Divergence): boolean {
	return ALLOWLISTED_RENAMES.some(
		(e) =>
			e.kind === d.kind &&
			e.slot === d.slot &&
			e.projection === d.projection &&
			e.legacy === d.legacy &&
			e.recomputed === d.recomputed,
	);
}

/**
 * Compare one slot's legacy projected names against the values the §2 PROJECTION
 * computes from `values` + `fieldName`. Returns one Divergence per mismatched
 * projection (empty array = fully consistent).
 *
 * `parseNames` is deliberately NOT an axis here. Unlike storageName/name/etc.
 * (which compare against the slot's REAL legacy stored fields), there is no
 * stored legacy `parseNames` to compare against — only `parseNamesNew` (which IS
 * this projection). The only "legacy" stand-in would be `kindsOf`, a
 * reconstruction that returns un-normalized SOURCE names (`_X`) the real reader
 * never used (it resolves `alias($._X, $.X)` → `X` at runtime). The projection's
 * `parseNames` is the alias target `X` — what tree-sitter actually emits — and
 * it's validated where it counts: the read-render-parse / AST-match metrics in
 * `validate:native` (tree-sitter ground truth), not by diffing against invented
 * legacy code.
 */
export function diffSlotNames(slot: AssembledNonterminal, kind: string): Divergence[] {
	const out: Divergence[] = [];
	const proj = projectSlotNaming(slot);
	const push = (projection: Divergence['projection'], legacy: string, recomputed: string) => {
		if (legacy !== recomputed) out.push({ kind, slot: slot.name, projection, legacy, recomputed });
	};
	push('storageName', slot.storageName, proj.storageName);
	push('name', slot.name, proj.name);
	push('configKey', slot.configKey, proj.configKey);
	push('propertyName', slot.propertyName, proj.propertyName);
	push('paramName', slot.paramName, proj.paramName);
	return out;
}

function resolveEntryPath(grammar: Grammar, repoRoot: string): string {
	const overridesPath = resolve(repoRoot, `packages/${grammar}/overrides.ts`);
	if (existsSync(overridesPath)) return overridesPath;
	for (const c of [`tree-sitter-${grammar}/grammar.js`, `tree-sitter-${grammar}/common/define-grammar.js`]) {
		try {
			return requireFromHere.resolve(c);
		} catch {
			/* next */
		}
	}
	throw new Error(`reconcile-naming: could not resolve grammar entry for '${grammar}'`);
}

async function probeGrammar(grammar: Grammar, repoRoot: string): Promise<Divergence[]> {
	const raw = await evaluate(resolveEntryPath(grammar, repoRoot));
	const nodeMap = assemble(optimize(link(raw, undefined)));
	const divergences: Divergence[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		for (const slot of allStructuralSlotsOf(node)) {
			divergences.push(...diffSlotNames(slot, kind));
		}
	}
	return divergences;
}

export async function run(argv: string[]): Promise<number> {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string' },
			first: { type: 'string', default: '10' },
		},
	});
	const repoRoot = resolve(new URL('../../../..', import.meta.url).pathname);
	const first = Number.parseInt(values.first ?? '10', 10);
	const targets: Grammar[] = values.grammar ? [values.grammar as Grammar] : [...GRAMMARS];

	// Phase passes log via console.log/warn — route to stderr so stdout stays clean.
	const origLog = console.log;
	const origWarn = console.warn;
	console.log = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');
	console.warn = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');

	let totalUnexpected = 0;
	try {
		for (const grammar of targets) {
			const divergences = await probeGrammar(grammar, repoRoot);
			const unexpected = divergences.filter((d) => !isAllowlisted(d));
			const allowlisted = divergences.length - unexpected.length;
			totalUnexpected += unexpected.length;
			process.stdout.write(`${grammar}: ${unexpected.length} unexpected, ${allowlisted} allowlisted\n`);
			for (const d of unexpected.slice(0, first)) {
				process.stdout.write(
					`  ${d.kind}.${d.slot} [${d.projection}] legacy=${JSON.stringify(d.legacy)} recomputed=${JSON.stringify(d.recomputed)}\n`,
				);
			}
			if (unexpected.length > first) {
				process.stdout.write(`  … and ${unexpected.length - first} more\n`);
			}
		}
	} finally {
		console.log = origLog;
		console.warn = origWarn;
	}
	// Non-zero exit only when an UNEXPECTED divergence remains (allowlisted §2
	// renames are accepted) — lets CI/the gate fail on genuine regressions.
	return totalUnexpected === 0 ? 0 : 1;
}

// `process.argv[1]` is a filesystem path; convert it to a normalized file:// URL
// (handles absolute paths / escaping) rather than string-interpolating, so the
// `npx tsx reconcile-naming.ts` invocation is detected reliably.
const _isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e) => {
			process.stderr.write(`reconcile-naming: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
