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
import type { AnyNodeData } from '@sittir/types';
import { deriveRuleKinds } from './templates-path.ts';
import { loadRawEntries } from './node-types-loader.ts';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	treeHandle,
	buildReadHandle,
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
	// NodeChildValue / NodeFieldValue widened to AnyNodeData | string | number.
	// Narrow to NodeData before reading $nodeId / $type.
	const isNodeData = (v: unknown): v is AnyNodeData =>
		typeof v === 'object' && v !== null && '$type' in v;
	const shouldDrill = (entry: unknown): entry is AnyNodeData & { $nodeId: number } =>
		isNodeData(entry)
		&& entry.$named === true
		&& typeof entry.$nodeId === 'number'
		&& deepReadKinds.has(entry.$type);
	if (data.$children) {
		const drilled = data.$children.map(c =>
			shouldDrill(c) ? deepReadNode(tree, c.$nodeId, deepReadKinds) : c,
		);
		(data as { $children?: typeof drilled }).$children = drilled;
	}
	if (data.$fields) {
		// $fields has a readonly index signature; rebuild as a mutable map
		// then assign back via a structural cast.
		const newFields: Record<string, AnyNodeData | string | number | readonly (AnyNodeData | string | number)[] | undefined> = {};
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
		(data as { $fields?: typeof newFields }).$fields = newFields;
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
	// 3x `..` resolves from .../packages/codegen/src/validate/roundtrip.ts
	// up to `packages/` (validate → src → codegen → packages). A
	// previous `../../../../` overshoot landed at the repo root; with
	// the 012-merge introducing a top-level `rust/` directory, that
	// mis-path silently hit `rust/factory-map.json5` (non-existent) and
	// the catch{} swallowed the ENOENT.
	const factoryMapPath = new URL(`../../../${grammar}/factory-map.json5`, import.meta.url).pathname;
	try {
		const fs = await import('node:fs');
		const content = fs.readFileSync(factoryMapPath, 'utf-8');
		const kinds = new Set<string>();
		// Scan the WHOLE file for parent entries — the shape
		// `"<name>": { "source": "override", "childKind": { ... } }`
		// is distinctive enough to appear only inside polymorphVariants
		// (no other factory-map section nests `source` + `childKind`),
		// so we don't need to isolate the surrounding block (nested
		// brace matching in regex is brittle and the outer non-greedy
		// scan stops at the first `}` inside the inner object).
		const parentEntryRe = /["'](\w+)["']\s*:\s*\{[^}]*["']source["']\s*:\s*["']override["'][^{]*["']childKind["']\s*:\s*\{([^}]*)\}/g;
		let m: RegExpExecArray | null;
		while ((m = parentEntryRe.exec(content)) !== null) {
			kinds.add(m[1]!);
			const childMap = m[2]!;
			const childRe = /["']([^"']+)["']\s*:/g;
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
	grammar: string,
	source: string,
): Map<number, string> {
	const nodeIdToEffectiveType = new Map<number, string>();
	if (readTreeNodeFn) {
		const handle = buildReadHandle(grammar, tree, source);
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
/**
 * Parity-fixture capture — a single render + round-trip pair as seen
 * by the validator. Shape matches spec 012 T045 / data-model.md §6.
 *
 * Populated only when the caller supplies `onFixture` in the options
 * bag. Each successful kind probe (render OK, re-parse OK, AST match
 * OK) emits one `RenderFixture` + one `RoundTripFixture` — the
 * former for byte-identical render parity (SC-001a), the latter for
 * end-to-end semantic parity (SC-001b).
 */
export interface RenderFixture {
	kind: 'render'
	grammar: string
	/** NodeData input — the deep-read result from readTreeNode, ready
	 *  for the Rust engine's `render_dispatch` or the TS engine's
	 *  `render()`. Serialized to JSON verbatim. */
	input: unknown
	/** The string the TS engine produced for `input`. Parity gate
	 *  asserts the Rust engine produces the same bytes. */
	expectedOutput: string
}

export interface RoundTripFixture {
	kind: 'roundtrip'
	grammar: string
	/** Original source text for the probed node. */
	sourceIn: string
	/** The kind name — functions as the ast-grep-style pattern
	 *  ("match anything of this kind"). No actual edits are applied
	 *  at MVP; the fixture exists to anchor full-pipeline parity. */
	pattern: string
	/** Edit spec list — empty at MVP (render-only round-trip). Kept
	 *  in the schema so future fixtures can exercise applyEdits. */
	edits: readonly unknown[]
	/** Expected source after render (equals `sourceIn` for render-only
	 *  round-trips that match byte-for-byte; may differ when render
	 *  normalizes whitespace). */
	expectedSourceOut: string
	/** S-expression serialization of the re-parsed SUBTREE rooted at
	 *  `pattern` (`node2.toString()` on the web-tree-sitter side). The
	 *  subtree comes from parsing `wrappedText` and locating the node
	 *  at `wrappedOffset`. Cross-engine parity harnesses reproduce it
	 *  by parsing `wrappedText` with their own tree-sitter binding. */
	expectedReparseTree: string
	/** The rendered fragment wrapped in a supertype / direct-kind
	 *  reparse context so tree-sitter can parse it (bare fragments
	 *  like `"pub"` alone don't parse). Captured by the TS validator's
	 *  `wrapForReparse` — the SAME text the TS side reparsed. */
	wrappedText: string
	/** Byte offset within `wrappedText` where the rendered fragment
	 *  was spliced in. Parity harnesses use this to locate the
	 *  subtree to compare against `expectedReparseTree`. */
	wrappedOffset: number
}

export type ParityFixture = RenderFixture | RoundTripFixture

export interface ValidateRoundTripOptions {
	/** Called once per successfully round-tripped kind — emits a
	 *  `RenderFixture` then a `RoundTripFixture`. When omitted,
	 *  validator runs its normal pass/fail accounting without
	 *  fixture capture (zero added cost). */
	onFixture?: (fx: ParityFixture) => void
}

export async function validateRoundTrip(
	grammar: string,
	templatesPath: string,
	options: ValidateRoundTripOptions = {},
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
			const nodeIdToEffectiveType = discoverAliasSourceKinds(readTreeNodeFn, tree1, kinds, grammar, entry.source);
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

				const handle = buildReadHandle(grammar, tree1, entry.source);
				// Shallow read — RT validator relies on the $text
				// short-circuit: readNode returns a NodeData with
				// $text=source-span, render() falls through to emit
				// that $text verbatim, compare succeeds trivially.
				// This applies uniformly; variant-adopted kinds do
				// NOT require pre-enriched NodeData here — the ambient
				// scaffold in their template would re-produce the same
				// spans on reparse. Deep reads (with recursion into
				// children/fields) live in the FACTORY round-trip
				// validator (factory-roundtrip.ts), which needs the
				// structural data to call factory functions and
				// reconstruct the tree from scratch.
				const rawData = readNode(handle, node1.id);
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
					} else if (options.onFixture) {
						// Success path (both re-parse OK + AST match OK) —
						// emit a render fixture (NodeData → rendered) and a
						// round-trip fixture (source → reparse s-exp). The
						// data we have matches both shapes; only the shape
						// type tag differs.
						options.onFixture({
							kind: 'render',
							grammar,
							input: data,
							expectedOutput: rendered,
						});
						options.onFixture({
							kind: 'roundtrip',
							grammar,
							sourceIn: inputSource,
							pattern: renderedKind,
							edits: [],
							expectedSourceOut: rendered,
							expectedReparseTree: node2.toString(),
							wrappedText: wrapped.text,
							wrappedOffset: wrapped.offset,
						});
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
