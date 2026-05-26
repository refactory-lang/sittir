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
 * to legacy). Keyed by `${kind}.${slot}`. These are inferred UNNAMED slots with
 * a GENUINELY single parse-kind that §2 projects to the kind name, where legacy
 * hard-coded the generic `content`; the kind name is the desired surface. The
 * PR-B cutover renames these fields (`content` → the kind name). Any divergence
 * OUTSIDE this set is UNEXPECTED and fails the gate.
 *
 * NB: only TRULY single-kind slots belong here. `splat_pattern.content` looked
 * single-kind but holds `[identifier, "_"]` (a literal with no parseKind); its
 * `content` name is correct and is now produced by the projection's
 * `hasUnnamedValue` guard — NOT allowlisted.
 */
export const ALLOWLISTED_RENAMES: ReadonlySet<string> = new Set([
	'format_specifier.content', // genuinely 1 value → format_expression / formatExpressions
]);

/**
 * Compare one slot's legacy projected names against the values the §2 PROJECTION
 * computes from `values` + `fieldName`. Returns one Divergence per mismatched
 * projection (empty array = fully consistent). `parseNames` has no legacy stored
 * field to diverge from — it's a pure projection of `values` (the CST kinds);
 * the storageName check validates the single-parse-kind case.
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
			const unexpected = divergences.filter((d) => !ALLOWLISTED_RENAMES.has(`${d.kind}.${d.slot}`));
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

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e) => {
			process.stderr.write(`reconcile-naming: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
