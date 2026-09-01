/**
 * from() correctness validation — structural comparison of from() vs factory output.
 *
 * Tests that from() resolvers produce correct NodeData by comparing
 * from(readNodeData) against factory(readNodeFields). Detects:
 * - undefined nodes (from() resolver failed to resolve a child)
 * - structural divergence (different fields or children)
 *
 * No tree-sitter re-parsing needed — pure structural comparison.
 */

import type { AnyNodeData } from '@sittir/types';
import type { FactoryShape, FactorySlotMeta } from '../codegen-surface.ts';
import {
	loadStorageKindNameFromId,
	separatedListFactoryOptions,
	loadCorpusEntries,
	loadLanguageForGrammar,
	loadKindIdFromName,
	loadKindNameFromId,
	loadKindLiteralText,
	buildReadHandle,
	findFirst,
	findNativeNodeId,
	readNodeAt,
	adaptNode,
	collectKinds,
	emitValidatorMetrics,
	getChildFactoryArgs,
	nodeToConfig,
	loadNodeModel,
	type TSTree
} from './common.ts';

const FROM_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/factories/coerce.ts',
	typescript: '../../../typescript/src/factories/coerce.ts',
	python: '../../../python/src/factories/coerce.ts'
};

const FACTORY_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/factories/raw.ts',
	typescript: '../../../typescript/src/factories/raw.ts',
	python: '../../../python/src/factories/raw.ts'
};

const WRAP_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/wrap.ts',
	typescript: '../../../typescript/src/wrap.ts',
	python: '../../../python/src/wrap.ts'
};

// ---------------------------------------------------------------------------
// Structural analysis
// ---------------------------------------------------------------------------

/** Find paths to malformed nodes (missing $type) in a NodeData tree.
 * Historically this checked `node.$type === 'undefined'`, which was a
 * footgun in typescript — the grammar has a kind literally named
 * `undefined` (the `undefined` keyword), and every valid Undefined
 * node tripped the check. Narrow to the actual intent: a node whose
 * `$type` is the JS undefined value (malformed construction). */
function findUndefined(node: AnyNodeData, path = ''): string[] {
	const results: string[] = [];
	if (node.$type === undefined) results.push(path || 'root');

	const rec = node as unknown as Record<string, unknown>;
	const namedSlotEntries: [string, unknown][] = [];
	for (const key of Object.keys(rec)) {
		if (key.startsWith('_')) {
			namedSlotEntries.push([key.slice(1), rec[key]]);
		}
	}
	for (const [key, value] of namedSlotEntries) {
		if (Array.isArray(value)) {
			value.forEach((v, i) => {
				if (typeof v === 'object' && v !== null && '$type' in v) {
					results.push(...findUndefined(v as AnyNodeData, `${path}.${key}[${i}]`));
				}
			});
		} else if (typeof value === 'object' && value !== null && '$type' in value) {
			results.push(...findUndefined(value as AnyNodeData, `${path}.${key}`));
		}
	}

	if (node.$other) {
		const children = Array.isArray(node.$other) ? node.$other : [node.$other];
		children.forEach((c, i) => {
			if (typeof c === 'object' && c !== null) {
				results.push(...findUndefined(c, `${path}.children[${i}]`));
			}
		});
	}

	return results;
}

/**
 * Shallow structural diff: compare type, factory-declared field keys,
 * named children count.
 *
 * The factory output `b` is the ground truth for "what fields this kind
 * declares." Any field in `from()` output `a` that isn't in `b` is
 * acceptable runtime metadata (promoted anonymous keywords like `fn`,
 * `{`, `;` from `readNode.promoteAnonymousKeyword`, tree-sitter
 * punctuation, etc.) — those don't count as divergence. Only mismatches
 * on keys the factory actually declared are real bugs.
 *
 * Undefined-valued entries are dropped before comparison — property
 * access can't distinguish `{a: undefined}` from `{}`, so the structural
 * comparison shouldn't either.
 */
function structuralDiff(
	a: AnyNodeData,
	b: AnyNodeData,
	kindNameFromId?: ((id: number) => string | undefined) | undefined
): string[] {
	const diffs: string[] = [];
	if (a.$type !== b.$type) diffs.push(`$type: ${a.$type} vs ${b.$type}`);

	const extractSlotKeys = (node: AnyNodeData): string[] => {
		const rec = node as unknown as Record<string, unknown>;
		return Object.keys(rec)
			.filter((k) => k.startsWith('_') && rec[k] !== undefined)
			.map((k) => k.slice(1));
	};

	const bKeys = new Set(extractSlotKeys(b));
	const aKeysMatchingB = extractSlotKeys(a).filter((k) => bKeys.has(k));

	// One-way check: fields factory declared that from() didn't fill in.
	const missingInA = [...bKeys].filter((k) => !aKeysMatchingB.includes(k)).sort();
	if (missingInA.length) diffs.push(`from() missing declared fields: ${missingInA.join(', ')}`);

	// Compare only named children — anonymous tokens (delimiters, separators)
	// are reconstructed from templates, not carried in factory output.
	// After commit 15c4c195 (child hoisting), anonymous leaf children scalarize
	// to numeric kind IDs on the wire. Numbers have no `$named` property, so
	// `c?.$named !== false` evaluates true for them — exclude explicitly.
	// Polymorph wrapper children (whose name starts with "{parent}_") are
	// produced differently by read vs factory — filter them from both sides to
	// avoid false divergence on the wrapper/unwrapper split.
	// $type is a numeric kind ID after child hoisting, so resolve parent name
	// through kindNameFromId before building the prefix. Hidden-rule types are
	// stored with a leading `_` (e.g. `_mod_item_external`); strip it before
	// the prefix comparison so the filter matches both underscored and plain names.
	const resolveTypeName = (t: string | number | undefined): string | undefined =>
		typeof t === 'string' ? t : t != null ? kindNameFromId?.(t) : undefined;
	const parentName = resolveTypeName(a.$type);
	const polymorphPrefix = parentName ? parentName + '_' : null;
	const resolveChildName = (t: string | number | undefined): string | undefined => {
		const name = resolveTypeName(t);
		return name?.startsWith('_') ? name.slice(1) : name;
	};
	const isRealNamedChild = (c: any) =>
		typeof c !== 'number' &&
		c?.$named !== false &&
		!(polymorphPrefix && resolveChildName(c?.$type)?.startsWith(polymorphPrefix));
	const aChildren = a.$other === undefined ? [] : Array.isArray(a.$other) ? a.$other : [a.$other];
	const bChildren = b.$other === undefined ? [] : Array.isArray(b.$other) ? b.$other : [b.$other];
	const aNamed = aChildren.filter(isRealNamedChild);
	const bNamed = bChildren.filter(isRealNamedChild);
	if (aNamed.length !== bNamed.length) diffs.push(`named children: ${aNamed.length} vs ${bNamed.length}`);

	return diffs;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FromValidationError {
	kind: string;
	severity: 'error' | 'warning';
	message: string;
}

export interface FromValidationResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	undefinedCount: number;
	divergentCount: number;
	errors: FromValidationError[];
}

export async function validateFrom(grammar: string, backend?: 'native' | 'js'): Promise<FromValidationResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	// Phase D: $type is numeric — load both resolvers.
	// kindIdFromName (name→id): for treeHandle JS-side reads and findNativeNodeId's kindId variant.
	// kindNameFromId (id→name): for findNativeNodeId's id-to-kind comparison.
	// The generated kindIdFromName throws on missing entries; wrap it so
	// readNode's resolveKindId falls back to the zero sentinel instead of
	// propagating a TypeError for form kinds not in the numeric catalog.
	const rawKindIdFromName = await loadKindIdFromName(grammar);
	const kindIdFromName = rawKindIdFromName
		? (name: string): number | undefined => {
				try {
					return rawKindIdFromName(name);
				} catch {
					return undefined;
				}
			}
		: rawKindIdFromName;
	const kindNameFromId = await loadKindNameFromId(grammar);
	const storageKindNameFromId = await loadStorageKindNameFromId(grammar);
	const kindLiteralText = await loadKindLiteralText(grammar);

	// Import from() + factory + wrap modules. `.from()` expects a fluent
	// NodeData (from factory output OR readTreeNode wrap) OR a camelCase
	// loose bag — per spec 008 US3, bare `readNode` output isn't a
	// supported input. readTreeNode wraps readNode output via the per-kind
	// wrap function, producing a fluent NodeData that `.from()` accepts.
	let fromMap: Record<string, (input: object) => unknown> = {};
	let factoryMap: Record<string, (config?: any) => unknown> = {};
	let factoryShapes: Record<string, FactoryShape> = {};
	let factoryFields: Record<string, readonly string[]> = {};
	let factorySlots: Record<string, Record<string, FactorySlotMeta>> = {};
	let fieldAliasMap: Record<string, Record<string, string>> = {};
	let polymorphVariants: Record<string, unknown> = {};
	let readTreeNode: ((tree: unknown, handle?: number, childIndex?: number) => unknown) | undefined;
	let wrapNode: ((data: AnyNodeData, tree: unknown) => unknown) | undefined;
	const errors: FromValidationError[] = [];
	try {
		const fromModule = await import(new URL(FROM_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		fromMap = fromModule._fromMap ?? {};
	} catch (e) {
		errors.push({
			kind: '(from-module-load)',
			severity: 'error',
			message: (e as Error).message
		});
	}
	try {
		const factoryModule = await import(new URL(FACTORY_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		factoryMap = factoryModule._factoryMap ?? {};
		// Validator-only metadata (shapes, field-alias, factoryFields,
		// factorySlots, polymorphVariants) lives in node-model.json5 (PR-K).
		const model = await loadNodeModel(grammar);
		factoryShapes = model.factoryShapes;
		factoryFields = model.factoryFields;
		factorySlots = model.factorySlots;
		fieldAliasMap = model.fieldAliasMap;
		polymorphVariants = model.polymorphVariants;
	} catch (e) {
		errors.push({
			kind: '(factory-module-load)',
			severity: 'error',
			message: (e as Error).message
		});
	}
	try {
		const wrapModule = await import(new URL(WRAP_MODULE_PATHS[grammar]!, import.meta.url).pathname);
		readTreeNode = wrapModule.readTreeNode;
		wrapNode = wrapModule.wrapNode;
	} catch {
		/* wrap module unavailable — readTreeNode falls back to raw readNode below */
	}

	// Without fromMap/factoryMap, every kind fails `kind in fromMap && kind
	// in factoryMap` below and total stays 0 — silently reporting a passing
	// "0/0" run instead of the real load failure. Short-circuit and surface
	// it, matching validateFactoryRenderParse's importFailure guard.
	if (errors.length > 0) {
		return {
			grammar,
			total: 0,
			pass: 0,
			fail: 0,
			skip: 0,
			undefinedCount: 0,
			divergentCount: 0,
			errors
		};
	}

	const entries = loadCorpusEntries(grammar);
	const testedKinds = new Set<string>();
	let pass = 0;
	let skip = 0;
	let total = 0;
	let undefinedCount = 0;
	let divergentCount = 0;

	for (const entry of entries) {
		const tree1 = parser.parse(entry.source) as TSTree;
		if (tree1.rootNode.hasError) continue;

		for (const kind of collectKinds(tree1.rootNode)) {
			if (!(kind in fromMap) || !(kind in factoryMap)) continue;
			if (testedKinds.has(kind)) continue;
			testedKinds.add(kind);
			total++;

			const node1 = findFirst(tree1.rootNode, kind);
			if (!node1) continue;

			let readData: AnyNodeData;
			try {
				const handle = buildReadHandle(grammar, tree1, entry.source, backend, kindIdFromName);
				// Native engine Rust-heap IDs differ from WASM linear-memory IDs.
				// Resolve via the native data tree; if the kind is an alias target
				// the native engine emits under a different rule name, skip rather
				// than fall back to a mismatched WASM ID.
				const nativeCoords = findNativeNodeId(handle, kind, kindNameFromId);
				if (nativeCoords === null && handle.read) {
					// The native read stores most leaf kinds SCALARIZED — collapsed
					// to text inside parent storage, no node to locate — and alias
					// targets emit under a different rule name. For a text-shaped
					// kind that is not a locator failure: the sound comparison
					// needs no native node at all. Feed the WASM node's text
					// through both from() (the real leaf-coercion route, pattern
					// guards included) and the factory, and compare the results.
					const leafShape = factoryShapes[kind] ?? 'config';
					if (leafShape === 'text') {
						try {
							const text = node1.text;
							const fromResult = fromMap[kind]!(text as never) as AnyNodeData;
							const factoryResult = (factoryMap[kind]! as (t: string) => AnyNodeData)(text);
							const diffs = structuralDiff(fromResult, factoryResult, kindNameFromId);
							if (diffs.length > 0) {
								divergentCount++;
								errors.push({
									kind,
									severity: 'warning',
									message: `from() diverges: ${diffs.join('; ')}`
								});
							} else {
								pass++;
							}
						} catch (e) {
							errors.push({
								kind,
								severity: 'error',
								message: `leaf text route throws: ${(e as Error).message}`
							});
						}
						continue;
					}
					errors.push({
						kind,
						severity: 'error',
						message: `native coords unresolved for alias target — comparing against a mismatched WASM id would be unsound`
					});
					continue;
				}
				// Use readTreeNode (wrapped via per-kind dispatch) when available,
				// so `.from()` sees a fluent NodeData — the supported input shape
				// per spec 008 US3. Fall back to raw readNode if the wrap module
				// isn't loaded (bootstrap scenarios).
				// For the WASM/JS path, temporarily swap rootNode to target then
				// call with no navigation coords (reads rootNode).
				if (nativeCoords?.embeddedData !== undefined) {
					// A trivia entry — already fully materialized, no
					// handle+child-index to read through. Apply the same
					// fluent-view wrap readTreeNode would, so `.from()` sees
					// the same input shape as every other candidate.
					readData = wrapNode
						? (wrapNode(nativeCoords.embeddedData, handle) as AnyNodeData)
						: nativeCoords.embeddedData;
				} else if (nativeCoords && handle.read) {
					readData = readTreeNode
						? (readTreeNode(handle, nativeCoords.handle, nativeCoords.childIndex) as AnyNodeData)
						: readNodeAt(handle, adaptNode(node1), nativeCoords);
				} else {
					const prev = handle.rootNode;
					(handle as { rootNode: typeof prev }).rootNode = adaptNode(node1);
					try {
						readData = readTreeNode
							? (readTreeNode(handle) as AnyNodeData)
							: readNodeAt(handle, adaptNode(node1), null);
					} finally {
						(handle as { rootNode: typeof prev }).rootNode = prev;
					}
				}
			} catch (e) {
				errors.push({
					kind,
					severity: 'error',
					message: `read/wrap throws: ${(e as Error).message}`
				});
				continue;
			}

			// The read node's $type is the storage stamp; in an alias context the
			// CST face name (`kind`) differs from it (a decorator's member chain
			// wears the member_expression face over the decorator_member_expression
			// storage kind). Storage identity picks the from/factory pair — the
			// face is only how the corpus walk found the node.
			const readTypeName = typeof readData.$type === 'number' ? storageKindNameFromId?.(readData.$type) : undefined;
			const readKind =
				readTypeName !== undefined && readTypeName in fromMap && readTypeName in factoryMap ? readTypeName : kind;
			try {
				const fromResult = fromMap[readKind]!(readData) as AnyNodeData;
				let factoryResult: AnyNodeData;
				try {
					// Route by the shape declared at codegen time — same
					// pattern as validate-factory-roundtrip.ts. Guessing
					// from `readData.fields` alone mis-routes empty
					// containers (python `()` has promoted `(`/`)` fields
					// but `children === undefined`, yet is a children-shape
					// factory that must dispatch as `factory()` with no args).
					const shape = factoryShapes[readKind] ?? 'config';
					const factory = factoryMap[readKind]!;
					if (shape === 'config' || shape === 'direct' || shape === 'forwarded') {
						// ADR-0018: readNode emits `_<name>` top-level keys, not
						// `$fields`. Use `nodeToConfig` which handles both shapes
						// and recursively resolves children through factories.
						const config = nodeToConfig(readData, {
							factoryMap: factoryMap as Record<string, (...args: unknown[]) => unknown>,
							factoryShapes,
							factoryFields,
							factorySlots,
							fieldAliasMap,
							polymorphVariants: polymorphVariants as any,
							kindNameFromId,
							kindLiteralText
						});
						if (shape === 'direct' || shape === 'forwarded') {
							// Direct-call shape: use the sole field when metadata
							// names one, otherwise treat it as a single child call.
							const fieldNames = factoryFields[readKind];
							const rawName = fieldNames?.[0];
							const camelName = rawName?.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
							const childArgs = getChildFactoryArgs(readKind, config, factorySlots, factoryFields);
							const value = camelName ? (config as Record<string, unknown>)[camelName] : childArgs[0];
							factoryResult = (factory as (v: unknown) => AnyNodeData)(value);
						} else {
							// Config-shaped factories with flank capture take `(config,
							// options)` — factories without options ignore the extra argument.
							factoryResult = (factory as (c: unknown, o?: unknown) => AnyNodeData)(
								config,
								separatedListFactoryOptions(readData, kindLiteralText)
							);
						}
					} else if (shape === 'text') {
						// readData.$text is absent on branch nodes (gated by
						// SITTIR_DEBUG_TEXT). For text-shaped factories, fall back to
						// slicing the source span directly when $text is absent.
						const textForFactory =
							readData.$text ?? (readData.$span ? entry.source.slice(readData.$span.start, readData.$span.end) : '');
						factoryResult = (factory as (text: string) => AnyNodeData)(textForFactory);
					} else if (shape === 'elements') {
						// separatedList factory: spread with a LEADING optional
						// options bag — `(...elements)` / `({separatorKind?,
						// leading?, trailing?}, ...elements)` — distinct calling
						// convention from 'spread's plain rest-param factories (see
						// classifyFactoryShape's separatedList case).
						const config = nodeToConfig(readData, {
							factoryMap: factoryMap as Record<string, (...args: unknown[]) => unknown>,
							factoryShapes,
							factoryFields,
							factorySlots,
							fieldAliasMap,
							polymorphVariants: polymorphVariants as any,
							kindNameFromId,
							kindLiteralText
						});
						const elements = getChildFactoryArgs(readKind, config, factorySlots, factoryFields);
						const options = separatedListFactoryOptions(readData, kindLiteralText);
						const listFactory = factory as (...args: unknown[]) => AnyNodeData;
						factoryResult = options !== undefined ? listFactory(options, ...elements) : listFactory(...elements);
					} else {
						const config = nodeToConfig(readData, {
							factoryMap: factoryMap as Record<string, (...args: unknown[]) => unknown>,
							factoryShapes,
							factoryFields,
							factorySlots,
							fieldAliasMap,
							polymorphVariants: polymorphVariants as any,
							kindNameFromId,
							kindLiteralText
						});
						const childArgs = getChildFactoryArgs(readKind, config, factorySlots, factoryFields);
						factoryResult = (factory as (...args: unknown[]) => AnyNodeData)(...childArgs);
					}
				} catch (e) {
					errors.push({
						kind,
						severity: 'error',
						message: `factory build throws: ${(e as Error).message}`
					});
					skip++;
					continue;
				}

				// Check for undefined nodes in from() output
				const undefinedNodes = findUndefined(fromResult);
				if (undefinedNodes.length > 0) {
					undefinedCount++;
					errors.push({
						kind,
						severity: 'error',
						message: `from() produces undefined nodes at: ${undefinedNodes.slice(0, 3).join(', ')}`
					});
					continue;
				}

				// Structural comparison
				const diffs = structuralDiff(fromResult, factoryResult, kindNameFromId);
				if (diffs.length > 0) {
					divergentCount++;
					errors.push({
						kind,
						severity: 'warning',
						message: `from() diverges (face=${kind}, storage=${readKind}, read $type=${String(readData.$type)}): ${diffs.slice(0, 3).join('; ')}`
					});
					continue;
				}

				pass++;
			} catch (e) {
				errors.push({
					kind,
					severity: 'error',
					message: `from() throws: ${(e as Error).message}`
				});
			}
		}
	}

	emitValidatorMetrics();
	return {
		grammar,
		total,
		pass,
		fail: total - pass - skip,
		skip,
		undefinedCount,
		divergentCount,
		errors
	};
}

export function formatFromReport(result: FromValidationResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.pass}/${result.total} from() correctness (${result.undefinedCount} undefined, ${result.divergentCount} divergent, ${result.skip} skipped)`
	);
	if (result.errors.length > 0) {
		for (const e of result.errors) {
			const prefix = e.severity === 'error' ? 'x' : '!';
			lines.push(`    ${prefix} ${e.kind}: ${e.message}`);
		}
	}
	return lines.join('\n');
}
