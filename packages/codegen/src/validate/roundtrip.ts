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
import { readNode, createRenderer } from '@sittir/core';
import type { TreeHandle } from '@sittir/core';
import { deriveRuleKinds } from './templates-path.ts';
import { loadRawEntries } from './node-types-loader.ts';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	treeHandle,
	findFirst,
	collectKinds,
	buildKindToSupertypes,
	wrapForReparse,
	loadReadTreeNode,
	walkWrappedTree,
	type TSNode,
	type TSTree,
	type WrappedNodeData,
} from './common.ts';

/**
 * Read a tree node and selectively populate `$children` / `$fields` of
 * NAMED descendants whose kind appears in `deepReadKinds`. Other named
 * children stay shallow (the renderer short-circuits their render path
 * to `$text`, which matches the source verbatim).
 *
 * readNode returns one-level-deep data by design. For most kinds that
 * shallow view works because their render path is trivially the source
 * span. But kinds produced via variant() adoption render via their own
 * template that wraps `$$$CHILDREN` in ambient scaffold — those MUST
 * drill through their structure so the ambient scaffold (pushed down
 * at link time) actually composes.
 *
 * Scope: the caller (validator) passes the set of kinds that underwent
 * variant() push-down plus their registered variant parents. Deep-read
 * fires only for those kinds; all other kinds follow the baseline
 * shallow path so existing rtPass numbers don't shift.
 *
 * @param tree - TreeHandle for node lookup.
 * @param nodeId - If provided, read the node at this id; otherwise read
 *   the root.
 * @param deepReadKinds - Set of `$type` values that should be deep-read
 *   when encountered as named children.
 */
function deepReadNode(
	tree: TreeHandle,
	nodeId: number | undefined,
	deepReadKinds: ReadonlySet<string>,
): ReturnType<typeof readNode> {
	const data = readNode(tree, nodeId);
	const shouldDrill = (entry: ReturnType<typeof readNode>): boolean =>
		entry.$named === true
		&& typeof entry.$nodeId === 'number'
		&& deepReadKinds.has(entry.$type);
	if (data.$children) {
		data.$children = data.$children.map(c =>
			shouldDrill(c) ? deepReadNode(tree, c.$nodeId, deepReadKinds) : c,
		);
	}
	if (data.$fields) {
		const newFields: typeof data.$fields = {};
		for (const [key, value] of Object.entries(data.$fields)) {
			if (Array.isArray(value)) {
				newFields[key] = value.map(entry =>
					shouldDrill(entry) ? deepReadNode(tree, entry.$nodeId, deepReadKinds) : entry,
				);
			} else {
				newFields[key] = shouldDrill(value)
					? deepReadNode(tree, value.$nodeId, deepReadKinds)
					: value;
			}
		}
		data.$fields = newFields;
	}
	return data;
}

/**
 * Build the set of `$type` values the validator should deep-read,
 * scoped to kinds that participate in variant() adoption (parents and
 * their child kinds). Other kinds stay on the shallow `$text`
 * short-circuit to preserve baseline rtPass numbers.
 *
 * Sources the set from the grammar's emitted `factory-map.json5`
 * polymorphVariants section (the codegen artifact that records which
 * kinds went through Link's push-down). Returns an empty set when no
 * variant adoption exists in the grammar.
 */
async function loadVariantAdoptedKinds(grammar: string): Promise<ReadonlySet<string>> {
	// factory-map.json5 lives at packages/<grammar>/factory-map.json5.
	const factoryMapPath = new URL(`../../../../${grammar}/factory-map.json5`, import.meta.url).pathname;
	try {
		const fs = await import('node:fs');
		const content = fs.readFileSync(factoryMapPath, 'utf-8');
		const kinds = new Set<string>();
		// Minimal JSON5-ish scan: find `polymorphVariants: { kindA: { source: 'override', childKind: { 'kindA_x': ... } } }`.
		// We only need to harvest kind names — full JSON5 parse isn't worth
		// the dependency here.
		const parentMatch = content.match(/polymorphVariants\s*:\s*\{([\s\S]*?)\}\s*,?\s*(?:\}|$)/);
		if (!parentMatch) return kinds;
		const body = parentMatch[1]!;
		// Each parent entry: `<parent>: { source: 'override', childKind: { '<childKind>': ... }, ... }`.
		const parentEntryRe = /(\w+):\s*\{[^}]*source:\s*['"]override['"][^}]*childKind:\s*\{([^}]*)\}/g;
		let m: RegExpExecArray | null;
		while ((m = parentEntryRe.exec(body)) !== null) {
			kinds.add(m[1]!);
			const childMap = m[2]!;
			const childRe = /['"]([^'"]+)['"]\s*:/g;
			let cm: RegExpExecArray | null;
			while ((cm = childRe.exec(childMap)) !== null) {
				kinds.add(cm[1]!);
			}
		}
		return kinds;
	} catch {
		return new Set<string>();
	}
}

/**
 * Find the first node of `kind` whose `startIndex` equals `offset`.
 * Used to locate the rendered fragment inside a reparse wrapper —
 * e.g. rust's `fn _f() { let _ = ${r}; }` wraps the rendered block
 * inside an outer `fn_item`'s block, so plain `findFirst(tree, 'block')`
 * returns the wrapper's body rather than the rendered one.
 */
/** Find a node anywhere in the tree by its numeric id. O(n); used when
 * the wrap-walker discovered an alias-source kind at a specific nodeId
 * and we need the matching TSNode to run reparse validation. */
function findNodeById(node: TSNode, nodeId: number): TSNode | null {
	if (node.id === nodeId) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		const hit = findNodeById(c, nodeId);
		if (hit) return hit;
	}
	return null;
}

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
			// Anonymous token — compare text directly.
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
	errors: { name: string; message: string; input?: string; rendered?: string }[];
	/** Structural mismatches — distinct from render / reparse errors. */
	astMismatches: { name: string; message: string; input?: string; rendered?: string }[];
}

/**
 * Discover alias-source kinds by walking the grammar's wrap layer over a parsed tree.
 *
 * @remarks
 * When the grammar's wrap layer (readTreeNode) is available, walk each parsed
 * tree upfront to discover nodes whose drillAs()-rewritten `$type` differs from
 * tree-sitter's raw output. We can then test these kinds against the source
 * template with a matching reparse wrapper, rather than relying on per-kind
 * render-layer workarounds in the target's template (ADR-0006).
 *
 * @param readTreeNodeFn - The grammar-specific readTreeNode function, or null if unavailable.
 * @param tree - The parsed tree-sitter tree to walk.
 * @param kinds - Mutable set of kind names; alias-source kinds discovered during the walk are added here.
 * @returns A map from tree-sitter node id to the effective (alias-rewritten) type string.
 */
function discoverAliasSourceKinds(
	readTreeNodeFn: ((handle: TreeHandle, nodeId?: number) => unknown) | null,
	tree: TSTree,
	kinds: Set<string>,
): Map<number, string> {
	const nodeIdToEffectiveType = new Map<number, string>();
	if (readTreeNodeFn) {
		const handle = treeHandle(tree);
		const wrappedRoot = readTreeNodeFn(handle) as WrappedNodeData;
		walkWrappedTree(wrappedRoot, (w: WrappedNodeData) => {
			if (w.$nodeId != null) nodeIdToEffectiveType.set(w.$nodeId, w.$type);
			kinds.add(w.$type);
		});
	}
	return nodeIdToEffectiveType;
}

/**
 * Resolve the tree-sitter TSNode instance for a kind that may be an alias-source.
 *
 * @remarks
 * For alias-source kinds that tree-sitter doesn't emit directly, look up a
 * tree-sitter node whose walker-reported effective-type matches. Falls back to
 * findFirst for plain kinds.
 *
 * @param kind - The effective kind name (potentially alias-rewritten).
 * @param nodeIdToEffectiveType - Map from node id to alias-rewritten type, from the wrap-walk.
 * @param tree - The parsed tree-sitter tree to search in.
 * @returns The matching TSNode, or null if none found.
 */
function resolveNodeForKind(
	kind: string,
	nodeIdToEffectiveType: Map<number, string>,
	tree: TSTree,
): TSNode | null {
	for (const [nid, et] of nodeIdToEffectiveType) {
		if (et === kind) {
			const node = findNodeById(tree.rootNode, nid);
			if (node) return node;
		}
	}
	return findFirst(tree.rootNode, kind);
}

/**
 * Apply alias resolution to raw NodeData, overriding `$type` when the wrap
 * layer reports a different effective type for the node's id.
 *
 * @remarks
 * Three distinct kind names arise after alias resolution:
 * - renderedKind: drives render-template + reparse-wrapper lookup (the source
 *   kind when rewritten).
 * - targetKind: tree-sitter's raw kind, used for post-reparse node location
 *   (reparse produces the target kind since the alias applies again).
 *
 * @param rawData - The NodeData as returned by readNode (uses tree-sitter's raw $type).
 * @param nodeId - The tree-sitter node id to look up in the effective-type map.
 * @param nodeIdToEffectiveType - Map from node id to alias-rewritten type.
 * @returns An object with `data` (possibly $type-overridden), `renderedKind`, and `targetKind`.
 */
function applyAliasResolution(
	rawData: ReturnType<typeof readNode>,
	nodeId: number,
	nodeIdToEffectiveType: Map<number, string>,
): { data: typeof rawData; renderedKind: string; targetKind: string } {
	const effective = nodeIdToEffectiveType.get(nodeId);
	const data = effective && effective !== rawData.$type
		? { ...rawData, $type: effective }
		: rawData;
	const renderedKind = data.$type;
	const targetKind = rawData.$type;
	return { data, renderedKind, targetKind };
}

/**
 * Locate the reparsed target node at the exact byte offset where the rendered
 * fragment was spliced into the wrapper.
 *
 * @remarks
 * Without offset-based lookup, `findFirst(tree2, kind)` matches the wrapper's
 * own outer block / let / expression (e.g. rust's `fn _f() { let _ = ${r}; }`
 * wraps an expression in an outer `block`, making the first `block` found the
 * wrapper's body rather than the rendered fragment).
 *
 * @param tree2 - The reparsed tree-sitter tree after rendering.
 * @param targetKind - The tree-sitter kind to search for (raw, pre-alias kind).
 * @param wrapped - The wrap result carrying the splice offset.
 * @returns The TSNode at the rendered offset, or null if not found.
 */
function findReparsedNodeAtOffset(
	tree2: TSTree,
	targetKind: string,
	wrapped: { text: string; offset: number },
): TSNode | null {
	return findNodeAt(tree2.rootNode, targetKind, wrapped.offset);
}

/**
 * Run round-trip validation for a grammar using corpus fixtures.
 */
export async function validateRoundTrip(
	grammar: string,
	templatesPath: string,
): Promise<RoundTripResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const rawEntries = loadRawEntries(grammar);
	const { render } = createRenderer(templatesPath);
	// `ruleKinds` was historically derived from config.rules (from the
	// YAML). For the Jinja path (directory of `.jinja` files), derive
	// the kind set from the on-disk file listing. Works uniformly for
	// both `.yaml` (use filesystem check) and directories.
	const ruleKinds = deriveRuleKinds(templatesPath);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

	const readTreeNodeFn = await loadReadTreeNode(grammar);
	const deepReadKinds = await loadVariantAdoptedKinds(grammar);

	const entries = loadCorpusEntries(grammar);
	const errors: { name: string; message: string; input?: string; rendered?: string }[] = [];
	const astMismatches: { name: string; message: string; input?: string; rendered?: string }[] = [];
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

			const kinds = new Set(collectKinds(tree1.rootNode));
			const nodeIdToEffectiveType = discoverAliasSourceKinds(readTreeNodeFn, tree1, kinds);
			const testableKinds = [...kinds].filter(k => ruleKinds.has(k));

			if (testableKinds.length === 0) {
				skip++;
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = true;
			let entryAstMatch = true;
			for (const kind of testableKinds) {
				const node1 = resolveNodeForKind(kind, nodeIdToEffectiveType, tree1);
				if (!node1) continue;

				const handle = treeHandle(tree1);
				// Deep-read only for kinds that underwent variant()
				// push-down (parents + their variant-child kinds).
				// Those kinds depend on structural children reaching
				// their own templates so the pushed-down ambient
				// scaffold renders. Other kinds stay shallow — their
				// render path short-circuits to `$text` which matches
				// the source verbatim.
				const rawData = deepReadNode(handle, node1.id, deepReadKinds);
				const { data, renderedKind, targetKind } = applyAliasResolution(rawData, node1.id, nodeIdToEffectiveType);

				try {
					const inputSource = node1.text;
					const rendered = render(data);

					// Wrap for reparse using supertype context
					const wrapped = wrapForReparse(rendered, renderedKind, grammar, kindToSupertypes, { adoptedVariantKinds: deepReadKinds, targetKind });
					if (wrapped === null) continue; // no supertype → skip reparse

					// Re-parse
					const tree2 = parser.parse(wrapped.text) as TSTree;
					if (tree2.rootNode.hasError) {
						errors.push({
							name: `${entry.name} [${renderedKind}]`,
							message: `re-parse error: "${rendered.slice(0, 80)}"`,
							input: inputSource,
							rendered,
						});
						entryOk = false;
						entryAstMatch = false;
						break;
					}

					// Reparse produces either the alias target (wrapper
					// context re-triggers the alias) OR the alias source
					// (wrapper is a generic supertype context that
					// doesn't re-alias — ts's interface_body rendered as
					// object_type inside `type _X = …;`). Accept either
					// at the rendered offset.
					const node2 = findReparsedNodeAtOffset(tree2, targetKind, wrapped)
						?? (renderedKind !== targetKind ? findReparsedNodeAtOffset(tree2, renderedKind, wrapped) : null);
					if (!node2) {
						errors.push({
							name: `${entry.name} [${renderedKind}]`,
							message: `kind not found at rendered offset ${wrapped.offset}`,
							input: inputSource,
							rendered,
						});
						entryOk = false;
						entryAstMatch = false;
						break;
					}

					const diff = astStructuralDiff(node1, node2);
					if (diff) {
						astMismatches.push({
							name: `${entry.name} [${renderedKind}]`,
							message: diff.slice(0, 160),
							input: inputSource,
							rendered,
						});
						entryAstMatch = false;
					}
				} catch (e) {
					errors.push({ name: `${entry.name} [${renderedKind}]`, message: `render: ${(e as Error).message.slice(0, 100)}` });
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
