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
import { isNonInlinableLeafShape } from './assemble.ts';
import type { LinkedGrammar } from './types.ts';

interface GrammarJsonFile {
	readonly inline?: unknown;
	readonly rules?: Record<string, GrammarJsonNode>;
}

function readGrammarJson(grammar: string): GrammarJsonFile | undefined {
	const grammarJsonPath = join(process.cwd(), 'packages', grammar, '.sittir', 'src', 'grammar.json');
	if (!existsSync(grammarJsonPath)) return undefined;
	try {
		return JSON.parse(readFileSync(grammarJsonPath, 'utf8')) as GrammarJsonFile;
	} catch (e) {
		// An ABSENT file is tolerated (early return above); an existing
		// file that fails to read or parse must surface — swallowing it
		// would let generation continue with empty inline/alias metadata.
		throw new Error(
			`readGrammarJson[${grammar}]: failed to read/parse ${grammarJsonPath}: ${e instanceof Error ? e.message : String(e)}`
		);
	}
}

export function loadGrammarJsonInlineList(grammar: string): readonly string[] | undefined {
	const parsed = readGrammarJson(grammar);
	if (parsed === undefined) return undefined;
	if (Array.isArray(parsed.inline) && parsed.inline.every((v) => typeof v === 'string')) {
		return parsed.inline as string[];
	}
	return undefined;
}

// tree-sitter's generate step warns about only the FIRST undefined inline
// name per run — later dangling entries hide behind it.
export function danglingInlineNames(parsed: GrammarJsonFile): string[] {
	if (!Array.isArray(parsed.inline)) return [];
	const rules = new Set(Object.keys(parsed.rules ?? {}));
	return parsed.inline.filter((n): n is string => typeof n === 'string' && !rules.has(n));
}

export function assertGrammarJsonInlineIntegrity(grammar: string): void {
	const parsed = readGrammarJson(grammar);
	if (parsed === undefined) return;
	const dangling = danglingInlineNames(parsed);
	if (dangling.length > 0) {
		throw new Error(
			`inline-integrity[${grammar}]: ${dangling.length} wired inline name(s) missing from the compiled ` +
				`rule bag (tree-sitter reports only the first per run): ${dangling.join(', ')}`
		);
	}
}

interface GrammarJsonNode {
	readonly type: string;
	readonly name?: string;
	readonly value?: unknown;
	readonly named?: boolean;
	readonly content?: GrammarJsonNode;
	readonly members?: readonly GrammarJsonNode[];
}

export function loadGrammarJsonAliasMap(grammar: string): ReadonlyMap<string, string> {
	const out = new Map<string, string>();
	const parsed = readGrammarJson(grammar);
	if (parsed === undefined) return out;
	const walk = (node: GrammarJsonNode | undefined): void => {
		if (!node) return;
		if (
			node.type === 'ALIAS' &&
			node.named === true &&
			typeof node.value === 'string' &&
			node.content?.type === 'SYMBOL' &&
			typeof node.content.name === 'string'
		) {
			const hiddenName = node.content.name;
			if (!out.has(hiddenName)) out.set(hiddenName, node.value);
		}
		walk(node.content);
		if (Array.isArray(node.members)) {
			for (const m of node.members) walk(m);
		}
	};
	for (const rule of Object.values(parsed.rules ?? {})) walk(rule);
	return out;
}

export function buildInlinableKinds(inlineKinds: ReadonlySet<string>, linked: LinkedGrammar): Set<string> {
	return new Set(
		[...inlineKinds].filter((k) => {
			const rule = linked.rules[k];
			if (!rule) return true; // un-classifiable (no IR rule) — leave inlinable
			return !isNonInlinableLeafShape(rule);
		})
	);
}

export function buildPolymorphsConfigSkip(
	polymorphsConfig: Readonly<Record<string, Readonly<Record<string, string>> | undefined>> | undefined
): Set<string> {
	const skip = new Set<string>();
	for (const [parentKind, armMap] of Object.entries(polymorphsConfig ?? {})) {
		if (!armMap) continue;
		skip.add(parentKind);
		for (const suffix of Object.values(armMap)) {
			const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
			skip.add(`_${visibleParent}_${suffix}`);
		}
	}
	return skip;
}
