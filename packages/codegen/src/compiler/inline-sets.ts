/**
 * compiler/inline-sets.ts — shared derivation of the normalize-pipeline's
 * inline-decision and diagnostic-skip sets.
 *
 * Extracted from generate.ts so `collectGrammarDiagnosticsForGrammar`
 * (diagnostics/grammar-diagnostics.ts) can build the SAME NormalizeCtx inputs
 * the real pipeline uses. generate.ts imports grammar-diagnostics.ts (for
 * formatCompilerDiagnostics), so the diagnostics module cannot import
 * generate.ts back — this neutral module breaks the cycle. Without shared
 * inputs the preflight's normalize ran ctx-less, `diagnoseSlotGrouping` never
 * saw `inlineKinds`, and every shape-①b `multi-slot-nested-seq` violation
 * (auto-group helper bodies like rust `_match_block_optional1`) was invisible
 * in the persisted grammar-diagnostics.json / validation report — console-only
 * during regen.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyNode } from './assemble.ts';
import type { LinkedGrammar } from './types.ts';

/**
 * Load the `inline` array from the compiled grammar.json (if present).
 *
 * `raw.inline` only contains what the overrides callback explicitly returns —
 * base-grammar string items in `previous` are silently dropped by evaluate's
 * normalize() pass (which only handles symbol-ref objects). Reading
 * grammar.json directly gives the full merged inline list that tree-sitter
 * itself used when compiling the parser.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns The `inline` string array from grammar.json, or `undefined`.
 */
export function loadGrammarJsonInlineList(grammar: string): readonly string[] | undefined {
	const grammarJsonPath = join(process.cwd(), 'packages', grammar, '.sittir', 'src', 'grammar.json');
	if (!existsSync(grammarJsonPath)) return undefined;
	try {
		const parsed = JSON.parse(readFileSync(grammarJsonPath, 'utf8')) as {
			inline?: unknown;
		};
		if (Array.isArray(parsed.inline) && parsed.inline.every((v) => typeof v === 'string')) {
			return parsed.inline as string[];
		}
		return undefined;
	} catch {
		return undefined;
	}
}

/**
 * Inline-DECISION set for the simplify pass: which grammar.inline kinds
 * inlineRefs should substitute. The gate is "in grammar.inline AND modelType
 * is NOT a supertype / keyword / token / pattern / enum". Supertypes are typed
 * unions referenced by name (inlining them explodes a clean union into its
 * alternatives at a seq position → non-canonical choice-at-seq); keyword /
 * token helpers are leaf lexemes that must stay as scalar slot refs. The
 * remaining inline kinds — auto-synthesized group-lift helpers (`branch`) and
 * the hidden structural helpers tree-sitter expands at parse time — ARE
 * inlined so sittir's derivation matches the flat parser output.
 *
 * NOTE: this is a SEPARATE set from the raw grammar.json inline list, which
 * the emitters use as the "skip emitting this inlined kind" list
 * (emitters/shared.ts). Filtering that list would un-skip supertypes/keywords
 * and emit phantom concrete kinds — so the decision set is kept distinct.
 */
const NON_INLINABLE_MODEL_TYPES = new Set(['supertype', 'keyword', 'token', 'pattern', 'enum']);

export function buildInlinableKinds(inlineKinds: ReadonlySet<string>, linked: LinkedGrammar): Set<string> {
	return new Set(
		[...inlineKinds].filter((k) => {
			const rule = linked.rules[k];
			if (!rule) return true; // un-classifiable (no IR rule) — leave inlinable
			return !NON_INLINABLE_MODEL_TYPES.has(classifyNode(k, rule, { parentAliasedKinds: linked.parentAliasedKinds }));
		})
	);
}

/**
 * Extra polymorph skip-set for the slot-grouping diagnostic.
 *
 * `polymorphsConfig` is the `polymorphs:` / `n:` declarative path-split config
 * from overrides.ts. Each entry `{ parent: { path: suffix } }` produces hidden
 * arm rules named `_${parent}_${suffix}` (via `polymorphHiddenName`). These
 * arms are already handled by the polymorph dispatch machinery; the diagnostic
 * must not flag their multi-slot seq bodies as violations. The parent kinds
 * themselves are included too, to silence the top-level polymorph rule if it
 * isn't classified as such in the simplified map (e.g. when all arms are
 * inlined, the structure gets flattened).
 */
export function buildPolymorphsConfigSkip(
	polymorphsConfig: Readonly<Record<string, Readonly<Record<string, string>> | undefined>> | undefined
): Set<string> {
	const skip = new Set<string>();
	for (const [parentKind, armMap] of Object.entries(polymorphsConfig ?? {})) {
		if (!armMap) continue;
		skip.add(parentKind);
		for (const suffix of Object.values(armMap)) {
			// `polymorphHiddenName` formula: `_${parentKind}_${suffix}` for non-hidden parents
			const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
			skip.add(`_${visibleParent}_${suffix}`);
		}
	}
	return skip;
}
