/**
 * Round-trip validation (Checks 6 & 7) — parse → readNode → render → parse.
 *
 * Uses tree-sitter test corpus files (downloaded from grammar repos) as
 * source fixtures. Each corpus entry is parsed, readNode'd, rendered, and
 * re-parsed. Structural match is checked.
 *
 * Requires web-tree-sitter + language WASM files.
 */

import { createRequire } from 'node:module';
import { parse as parseYaml } from 'yaml';
import { readNode, createRenderer } from '@sittir/core';
import type { RulesConfig } from '@sittir/types';
import { loadRawEntries } from './validators/node-types.ts';
import { loadRouting } from './validators/load-routing.ts';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	treeHandle,
	findFirst,
	collectKinds,
	buildKindToSupertypes,
	wrapForReparse,
	type TSNode,
	type TSTree,
} from './validators/common.ts';

/**
 * Find the first node of `kind` whose `startIndex` equals `offset`.
 * Used to locate the rendered fragment inside a reparse wrapper —
 * e.g. rust's `fn _f() { let _ = ${r}; }` wraps the rendered block
 * inside an outer `fn_item`'s block, so plain `findFirst(tree, 'block')`
 * returns the wrapper's body rather than the rendered one.
 */
function findNodeAt(node: TSNode, kind: string, offset: number): TSNode | null {
	if (node.type === kind && node.startIndex === offset) return node
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i)
		if (!c) continue
		// Quick prune: the rendered fragment must be inside this child's range.
		if (offset < c.startIndex || offset >= c.endIndex) continue
		const hit = findNodeAt(c, kind, offset)
		if (hit) return hit
	}
	// Fallback: any node of the right kind whose range starts at offset.
	if (node.type === kind && node.startIndex === offset) return node
	return null
}

/**
 * Strict AST structural equality check between the original parse
 * and the reparsed-after-render parse. Anonymous tokens (delimiters,
 * keywords, operators) must match byte-exactly — that's how we catch
 * silently dropped content like `;` statement terminators, since
 * the renderer sometimes omits anonymous children that aren't
 * promoted into a named field. Named children recurse.
 *
 * Returns `null` if the subtrees match, otherwise a short human-
 * readable diff path explaining the first mismatch.
 */
function astStructuralDiff(a: TSNode, b: TSNode, path: string = ''): string | null {
	if (a.type !== b.type) {
		return `${path || 'root'}: type ${a.type} ≠ ${b.type}`;
	}
	if (a.childCount !== b.childCount) {
		const aChildren = Array.from({ length: a.childCount }, (_, i) => {
			const c = a.child(i);
			return c ? (c.isNamed ? c.type : JSON.stringify(c.text)) : '?';
		}).join(',');
		const bChildren = Array.from({ length: b.childCount }, (_, i) => {
			const c = b.child(i);
			return c ? (c.isNamed ? c.type : JSON.stringify(c.text)) : '?';
		}).join(',');
		return `${path || a.type}: childCount ${a.childCount} ≠ ${b.childCount} [${aChildren}] vs [${bChildren}]`;
	}
	for (let i = 0; i < a.childCount; i++) {
		const ac = a.child(i);
		const bc = b.child(i);
		if (!ac || !bc) {
			return `${path || a.type}[${i}]: missing child`;
		}
		if (ac.isNamed !== bc.isNamed) {
			return `${path || a.type}[${i}]: named flag ${ac.isNamed} ≠ ${bc.isNamed}`;
		}
		if (!ac.isNamed) {
			// Anonymous token — compare text directly. This is how we
			// catch dropped `;` / `,` / operator tokens that the
			// renderer silently omitted.
			if (ac.text !== bc.text) {
				return `${path || a.type}[${i}]: anon ${JSON.stringify(ac.text)} ≠ ${JSON.stringify(bc.text)}`;
			}
			continue;
		}
		// Named child — recurse.
		const sub = astStructuralDiff(ac, bc, `${path || a.type}[${i}].${ac.type}`);
		if (sub) return sub;
	}
	return null;
}

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface RoundTripResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	/**
	 * Strict-structural pass count — entries where every tested kind
	 * round-tripped AND the reparsed AST matches the original parse
	 * byte-exactly on anonymous tokens. This is a subset of `pass`
	 * (kind-found is the weaker invariant). Used to catch silently
	 * dropped content like `;` terminators that the renderer omits
	 * because the token isn't routed to a named field.
	 */
	astMatchPass: number;
	errors: { name: string; message: string }[];
	/** Structural mismatches — distinct from render / reparse errors. */
	astMismatches: { name: string; message: string }[];
}

/**
 * Run round-trip validation for a grammar using corpus fixtures.
 */
export async function validateRoundTrip(
	grammar: string,
	templatesYaml: string,
): Promise<RoundTripResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const config = parseYaml(templatesYaml) as RulesConfig;
	const rawEntries = loadRawEntries(grammar);
	const routing = await loadRouting(grammar);
	const { render } = createRenderer(config);
	const ruleKinds = new Set(Object.keys(config.rules));
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

	const entries = loadCorpusEntries(grammar);
	const errors: { name: string; message: string }[] = [];
	const astMismatches: { name: string; message: string }[] = [];
	let pass = 0;
	let astMatchPass = 0;
	let skip = 0;
	let total = 0;

	for (const entry of entries) {
		total++;
		try {
			// Parse original
			const tree1 = parser.parse(entry.source) as TSTree;
			if (tree1.rootNode.hasError) {
				skip++;
				continue; // Corpus entries with parse errors (intentional error tests)
			}

			// Find all node kinds that have render rules
			const kinds = collectKinds(tree1.rootNode);
			const testableKinds = [...kinds].filter(k => ruleKinds.has(k));

			if (testableKinds.length === 0) {
				skip++;
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = true;
			let entryAstMatch = true;
			for (const kind of testableKinds) {
				const node1 = findFirst(tree1.rootNode, kind);
				if (!node1) continue;

				const handle = treeHandle(tree1);
				const data = readNode(handle, node1.id, routing);

				try {
					const rendered = render(data);

					// Wrap for reparse using supertype context
					const wrapped = wrapForReparse(rendered, kind, grammar, kindToSupertypes);
					if (wrapped === null) continue; // no supertype → skip reparse

					// Re-parse
					const tree2 = parser.parse(wrapped.text) as TSTree;
					if (tree2.rootNode.hasError) {
						errors.push({ name: `${entry.name} [${kind}]`, message: `re-parse error: "${rendered.slice(0, 80)}"` });
						entryOk = false;
						entryAstMatch = false;
						break;
					}

					// Find the reparsed node at the exact byte offset
					// where the rendered fragment was spliced into the
					// wrapper. Without this, `findFirst(tree2, kind)`
					// matches the wrapper's own outer block / let /
					// whatever (e.g. rust's `fn _f() { let _ = ${r}; }`
					// wraps an expression in an outer `block`, making
					// the first `block` found the wrapper's body rather
					// than the rendered one).
					const node2 = findNodeAt(tree2.rootNode, kind, wrapped.offset);
					if (!node2) {
						errors.push({ name: `${entry.name} [${kind}]`, message: `kind not found at rendered offset ${wrapped.offset}` });
						entryOk = false;
						entryAstMatch = false;
						break;
					}

					// Strict AST structural check — anonymous tokens
					// included. This catches silently dropped `;` / `,`
					// / operator tokens that the renderer omits because
					// they weren't routed to a named field. Recorded
					// separately from `pass` so the existing kind-found
					// assertion stays stable while we tighten the fidelity
					// invariant.
					const diff = astStructuralDiff(node1, node2);
					if (diff) {
						astMismatches.push({
							name: `${entry.name} [${kind}]`,
							message: diff.slice(0, 160),
						});
						entryAstMatch = false;
					}
				} catch (e) {
					errors.push({ name: `${entry.name} [${kind}]`, message: `render: ${(e as Error).message.slice(0, 100)}` });
					entryOk = false;
					entryAstMatch = false;
					break;
				}
			}

			if (entryOk) pass++;
			if (entryAstMatch) astMatchPass++;
		} catch (e) {
			errors.push({ name: entry.name, message: `${(e as Error).message.slice(0, 100)}` });
		}
	}

	// Check 7 (anonymous-token override round-trip) removed. It was a
	// legacy check that iterated `overrides.json` anonymous-token fields
	// and verified they survived render→reparse. Overrides now flow
	// through grammar extensions and anonymous tokens are real rule-tree
	// fields already tested by Check 6 (the end-to-end corpus loop).
	// Duplicate work checking a stale invariant.

	return {
		grammar,
		total,
		pass,
		fail: total - pass - skip,
		skip,
		astMatchPass,
		errors,
		astMismatches,
	};
}

export function formatRoundTripReport(result: RoundTripResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(`  ${icon} ${result.pass}/${result.total} round-trip (${result.skip} skipped, ${result.errors.length} errors)`);
	lines.push(`    ast-match ${result.astMatchPass}/${result.total} (${result.astMismatches.length} structural mismatches)`);
	if (result.errors.length > 0) {
		for (const e of result.errors) {
			lines.push(`    x ${e.name}: ${e.message}`);
		}
	}
	if (result.astMismatches.length > 0) {
		for (const e of result.astMismatches.slice(0, 20)) {
			lines.push(`    ~ ${e.name}: ${e.message}`);
		}
		if (result.astMismatches.length > 20) {
			lines.push(`    … and ${result.astMismatches.length - 20} more`);
		}
	}
	return lines.join('\n');
}
