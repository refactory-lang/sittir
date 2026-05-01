/**
 * Emits is.ts — per-grammar type guards.
 *
 * Three surfaces per grammar:
 *   - `is`     — per-kind guards keyed by camelCase kind name, a generic
 *                inverse `is.kind(v, k)`, and supertype guards
 *                (narrow the `type` discriminant).
 *   - `isTree` / `isNode` — shape guards with overloaded signatures that
 *                narrow through NamespaceMap when the kind is known or
 *                fall back to AnyTreeNode / AnyNodeData when it isn't.
 *   - `assert` — mirror of `is` with `asserts v is T` signatures, throws
 *                TypeError on mismatch. Runtime wraps `is` — no
 *                duplicated kind-check logic.
 *
 * Composition: `is.kind × shape = concrete type`. Inside
 * `if (is.functionItem(v) && isTree(v))`, `v` narrows to
 * `NamespaceMap['function_item']['Tree']` = `FunctionItem.Tree`.
 *
 * See `specs/008-factory-ergonomic-cleanup/contracts/is-guards.md`
 * for the full contract.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { AssembledSupertype } from '../compiler/node-map.ts';
import { snakeToCamel } from '../compiler/node-map.ts';
import { assertNever } from '../polymorph-variant.ts';
import {
	collectKindEntries,
	kindDiscriminantExpr,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { collectAllKinds } from './types.ts';

export interface EmitIsConfig {
	grammar: string;
	nodeMap: NodeMap;
	/**
	 * Parser-symbol ID tables (from `loadGeneratedIdTables`). When present,
	 * guards compare BOTH numeric `TSKindId.X` and string kind-name during
	 * Phase A coexistence. Kinds with no parser symbol (TSGrammar-only) are
	 * skipped — they can never appear at runtime. When absent (legacy /
	 * unit-test callers), guards compare string kind-names only.
	 */
	generatedIdTables?: GeneratedIdTables;
}

const toCamelCase = snakeToCamel;

/** JS reserved words that need a trailing `_` when used as a guard key. */
const RESERVED = new Set([
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'new',
	'null',
	'return',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'let',
	'static',
	'implements',
	'interface',
	'package',
	'private',
	'protected',
	'public',
	// Also reserve `is` method names so kind keys don't shadow them
	'kind'
]);

/** Methods on the `is` / `assert` namespaces beyond per-kind entries. */
const RESERVED_GUARD_NAMES = new Set(['kind']);

function safeGuardKey(camel: string): string {
	return RESERVED.has(camel) ? `${camel}_` : camel;
}

export function emitIs(config: EmitIsConfig): string {
	const { nodeMap, generatedIdTables } = config;

	// Collect KindEnumEntry table for numeric $type coexistence when
	// generatedIdTables is present (Phase A KindID migration). Undefined
	// for legacy callers / unit tests — those fall back to string-only guards.
	//
	// `collectAllKinds` is the single source of truth shared with the
	// types.ts emitter; both files must consume the same kind list so
	// `_kindIdByKind` and `TSKindId` agree on which members exist.
	const allKinds = collectAllKinds(nodeMap);
	const kindEntries: readonly KindEnumEntry[] | undefined = generatedIdTables
		? collectKindEntries(allKinds, nodeMap, generatedIdTables)
		: undefined;

	// Build a fast lookup map: kind → numeric id, for guard body emission.
	const kindIdByKind = new Map<string, number>();
	if (kindEntries) {
		for (const e of kindEntries) kindIdByKind.set(e.kind, e.id);
	}

	// Collect structural kinds with data interfaces (those that emitTypes
	// emits NodeNs entries for). These are the kinds that get per-kind
	// is.<camel> guards.
	//
	// When kindEntries is present, kinds that have NO parser symbol
	// (TSGrammar-only — inlined by tree-sitter, never present at runtime)
	// are skipped entirely. They can't appear on a parsed or factory-produced
	// node so a guard for them would always return false and mislead callers.
	const structuralKinds: Array<{
		kind: string;
		typeName: string;
		guardKey: string;
		/** Numeric TSKindId (Phase A coexistence); undefined = string-only guard. */
		numericId?: number;
	}> = [];
	const usedCamelKeys = new Set<string>();

	for (const [kind, node] of nodeMap.nodes) {
		switch (node.modelType) {
			case 'branch':
			case 'container':
			case 'polymorph': {
				const numericId = kindIdByKind.get(kind);
				// TSGrammar-only skip: when kindEntries is available and this kind
				// has no parser symbol, do not emit a guard for it — it has no
				// runtime presence and the guard would always return false.
				if (kindEntries && numericId === undefined) {
					// TSGrammar-only — no runtime presence; skip guard emission.
					break;
				}
				const camel = toCamelCase(kind);
				const guardKey = safeGuardKey(camel);
				// Collision detection — mirrors types emitter FR-017.
				if (usedCamelKeys.has(guardKey) || RESERVED_GUARD_NAMES.has(camel)) {
					throw new Error(
						`is emitter: camelCase kind '${camel}' collides with reserved guard key ` +
							`or another kind. Rename '${kind}' before proceeding (spec 008 FR-017).`
					);
				}
				usedCamelKeys.add(guardKey);
				structuralKinds.push({ kind, typeName: node.typeName, guardKey, numericId });
				break;
			}
			case 'leaf':
			case 'keyword':
			case 'enum':
			case 'token':
			case 'group':
			case 'multi':
			case 'supertype':
				// Per-kind guards exist only for structural kinds (branch /
				// container / polymorph). Leaves / keywords / enums use shape
				// guards (isNode / isTree) instead; tokens, groups, multi,
				// and supertypes have no per-kind guard surface. Supertypes
				// get their own guards in a separate pass below.
				break;
			default:
				assertNever(node);
		}
	}

	// Collect supertypes. Each supertype becomes `is.<name>` (narrow to the
	// union) and `assert.<name>` (throws on mismatch).
	const supertypes: Array<{
		kind: string;
		typeName: string;
		guardKey: string;
		memberKinds: string[];
		/** Numeric IDs of member kinds (Phase A coexistence); empty = string-only. */
		memberIds: number[];
	}> = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType !== 'supertype') continue;
		const st = node as AssembledSupertype;
		const cleanName = kind.replace(/^_/, '');
		const typeName = node.typeName;
		const camel = toCamelCase(cleanName);
		const guardKey = safeGuardKey(camel);
		// Resolve subtypes to concrete kinds (skip if missing — supertype
		// might reference hidden rules that didn't produce a data
		// interface; those aren't narrowable). Also collect numeric IDs
		// for Phase A coexistence guards.
		const memberKinds: string[] = [];
		const memberIds: number[] = [];
		for (const sub of st.subtypes) {
			const subNode = nodeMap.nodes.get(sub);
			if (!subNode) continue;
			memberKinds.push(sub);
			const numId = kindIdByKind.get(sub);
			if (numId !== undefined) memberIds.push(numId);
		}
		if (memberKinds.length === 0) continue;
		// Supertype name collision with per-kind guard is possible (e.g.
		// a kind named exactly `expression`). Skip the supertype entry if
		// it would shadow — the per-kind takes precedence.
		if (usedCamelKeys.has(guardKey)) continue;
		usedCamelKeys.add(guardKey);
		supertypes.push({ kind, typeName, guardKey, memberKinds, memberIds });
	}

	// Type imports — only supertype typeNames are referenced at the type
	// level (in `v is <SupertypeUnion>` return annotations). Per-kind
	// guards narrow via string-literal type discriminants (e.g.
	// `v is T & { readonly type: 'function_item' }`) and don't need
	// the concrete interface imported.
	const typeImports = new Set<string>();
	for (const s of supertypes) typeImports.add(s.typeName);

	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('// Per-grammar type guards: is / assert / isTree / isNode.');
	lines.push('// Composition: kind × shape = concrete type via NamespaceMap.');
	lines.push('');
	lines.push(
		"import type { AnyNodeData, AnyTreeNodeOf as AnyTreeNode } from '@sittir/types';"
	);
	// When kindEntries is present (Phase A KindID migration), emit a value-
	// import for TSKindId so guard bodies can compare numeric discriminants.
	const typeImportList = [...typeImports].sort();
	if (typeImportList.length > 0) {
		if (kindEntries) {
			lines.push('import { TSKindId } from \'./types.js\';');
			lines.push('import type {');
			lines.push('    NamespaceMap,');
			for (const t of typeImportList) lines.push(`    ${t},`);
			lines.push("} from './types.js';");
		} else {
			lines.push('import type {');
			lines.push('    NamespaceMap,');
			for (const t of typeImportList) lines.push(`    ${t},`);
			lines.push("} from './types.js';");
		}
	} else if (kindEntries) {
		lines.push('import { TSKindId } from \'./types.js\';');
		lines.push("import type { NamespaceMap } from './types.js';");
	} else {
		lines.push("import type { NamespaceMap } from './types.js';");
	}
	lines.push('');

	// IsGuards mapped type — per-kind entries narrow the `type` discriminant
	// to the kind literal; supertype entries narrow to the supertype union.
	lines.push('// IsGuards — per-kind + supertype type-narrowing guards.');
	lines.push('export interface IsGuards {');
	for (const s of structuralKinds) {
		lines.push(
			`    ${s.guardKey}<T extends { readonly $type: string | number }>(v: T): v is T & { readonly $type: '${s.kind}' };`
		);
	}
	lines.push(
		`    kind<K extends keyof NamespaceMap>(v: { readonly $type: string | number }, kind: K): v is { readonly $type: K & string };`
	);
	for (const s of supertypes) {
		lines.push(
			`    ${s.guardKey}(v: { readonly $type: string | number }): v is ${s.typeName};`
		);
	}
	lines.push('}');
	lines.push('');

	// AssertGuards — same shape as IsGuards but with `asserts v is T`.
	lines.push(
		'// AssertGuards — assertion form of IsGuards; throws TypeError on mismatch.'
	);
	lines.push('export interface AssertGuards {');
	for (const s of structuralKinds) {
		lines.push(
			`    ${s.guardKey}(v: { readonly $type: string | number }): asserts v is { readonly $type: '${s.kind}' };`
		);
	}
	lines.push(
		`    kind<K extends keyof NamespaceMap>(v: { readonly $type: string | number }, kind: K): asserts v is { readonly $type: K & string };`
	);
	for (const s of supertypes) {
		lines.push(
			`    ${s.guardKey}(v: { readonly $type: string | number }): asserts v is ${s.typeName};`
		);
	}
	lines.push('}');
	lines.push('');

	// Runtime construction.
	if (kindEntries) {
		// Phase A coexistence: guards compare both numeric TSKindId and string
		// kind-name. Factories/wrap emit numeric $type; readNode still emits
		// string. Both shapes must be accepted until Phase D removes the string
		// arm once all producers switch to numeric.
		lines.push(
			'// Runtime: kind guards accept both numeric (factory/wrap) and string (readNode)'
		);
		lines.push(
			'// $type during Phase A coexistence. Phase D removes the string arm.'
		);
		lines.push(
			'function _g(k: string, id: number): (v: { readonly $type: string | number }) => boolean {'
		);
		lines.push('    return (v) => v.$type === id || v.$type === k;');
		lines.push('}');
		lines.push(
			'function _sg(ks: ReadonlySet<string>, ids: ReadonlySet<number>): (v: { readonly $type: string | number }) => boolean {'
		);
		lines.push(
			'    return (v) => typeof v.$type === \'number\' ? ids.has(v.$type) : ks.has(v.$type);'
		);
		lines.push('}');
	} else {
		// Legacy / unit-test callers without generatedIdTables: string-only.
		lines.push(
			'// Runtime: kind guards = string equality; supertype guards = Set.has.'
		);
		lines.push(
			'// Building from literal string arrays keeps the runtime footprint minimal.'
		);
		lines.push(
			'function _g(k: string): (v: { readonly $type: string | number }) => boolean {'
		);
		lines.push('    return (v) => v.$type === k;');
		lines.push('}');
		lines.push(
			'function _sg(ks: ReadonlySet<string>): (v: { readonly $type: string | number }) => boolean {'
		);
		// v.$type may be a number (Phase A numeric discriminant) — Set<string>.has
		// only accepts string, so cast. If $type is numeric, has() returns false
		// (correct: string-keyed supertype sets don't contain numeric members).
		lines.push('    return (v) => ks.has(v.$type as string);');
		lines.push('}');
	}
	lines.push('');

	// Per-supertype Sets, one per supertype. Declared before `is` so the
	// object-literal construction can reference them.
	for (const s of supertypes) {
		const members = s.memberKinds.map((k) => JSON.stringify(k)).join(', ');
		lines.push(
			`const _supertype_${s.guardKey} = new Set<string>([${members}]);`
		);
		if (kindEntries && s.memberIds.length > 0) {
			const ids = s.memberIds.join(', ');
			lines.push(
				`const _supertype_${s.guardKey}_ids = new Set<number>([${ids}]);`
			);
		}
	}
	if (supertypes.length > 0) lines.push('');

	// Phase A coexistence: kind-name → numeric TSKindId map for the generic
	// `is.kind(v, k)` guard. When `v.$type` is numeric (factory/wrap output)
	// and `k` is a string kind-name, we need to translate `k` to its numeric
	// form before comparing. Map drops to undefined for kinds without a parser
	// symbol; the guard returns false in that case (TSGrammar-only kinds can
	// never match a numeric runtime $type anyway).
	if (kindEntries && kindEntries.length > 0) {
		const entries = kindEntries
			.map(
				(e) =>
					`    [${JSON.stringify(e.kind)}, TSKindId.${e.member}]`
			)
			.join(',\n');
		lines.push('const _kindIdByKind = new Map<string, number>([');
		lines.push(entries + ',');
		lines.push(']);');
		lines.push('');
	}

	// The is const — per-kind, kind(), supertype methods.
	lines.push('export const is = {');
	for (const s of structuralKinds) {
		if (kindEntries && s.numericId !== undefined) {
			// Phase A coexistence: compare numeric TSKindId first, then string.
			const expr = kindDiscriminantExpr(s.kind, nodeMap, kindEntries);
			lines.push(`    ${s.guardKey}: _g(${JSON.stringify(s.kind)}, ${expr}),`);
		} else {
			lines.push(`    ${s.guardKey}: _g(${JSON.stringify(s.kind)}),`);
		}
	}
	if (kindEntries) {
		// Phase A coexistence: kind() must accept numeric $type. Translate
		// the string kind-name `k` to its numeric TSKindId via the map and
		// compare both. Falls through to `false` when `k` is not a known
		// kind (TSGrammar-only or genuinely unknown).
		lines.push(
			`    kind: (v: { readonly $type: string | number }, k: string): boolean => {`
		);
		lines.push(`        if (v.$type === k) return true;`);
		lines.push(`        const id = _kindIdByKind.get(k);`);
		lines.push(`        return id !== undefined && v.$type === id;`);
		lines.push(`    },`);
	} else {
		// Legacy / unit-test callers without generatedIdTables: string-only.
		lines.push(
			`    kind: (v: { readonly $type: string | number }, k: string): boolean => v.$type === k,`
		);
	}
	for (const s of supertypes) {
		if (kindEntries && s.memberIds.length > 0) {
			lines.push(
				`    ${s.guardKey}: _sg(_supertype_${s.guardKey}, _supertype_${s.guardKey}_ids),`
			);
		} else if (kindEntries) {
			// All member kinds are TSGrammar-only; emit with empty id set.
			lines.push(
				`    ${s.guardKey}: _sg(_supertype_${s.guardKey}, new Set<number>()),`
			);
		} else {
			lines.push(`    ${s.guardKey}: _sg(_supertype_${s.guardKey}),`);
		}
	}
	lines.push('} as unknown as IsGuards;');
	lines.push('');

	// The assert const — wraps each `is` entry with a throwing semantics.
	// Kind-named asserts (e.g. `assert.functionItem`) use the method name
	// as the expected-type label. The generic `assert.kind(v, k)` uses the
	// second argument `k` as the expected-type label instead — otherwise
	// the error message would say `expected 'kind'`, which is useless.
	lines.push(
		'// assert — reuses `is` runtime logic via closure; TypeError on mismatch.'
	);
	lines.push('type _AnyGuard = (...args: unknown[]) => boolean;');
	lines.push('function _makeAssert(name: string, guard: _AnyGuard) {');
	lines.push('    return (...args: unknown[]): void => {');
	lines.push('        if (!guard(...args)) {');
	lines.push(`            const v = args[0] as { $type?: unknown } | null;`);
	lines.push(`            const actual = v?.$type ?? '(none)';`);
	lines.push(
		`            throw new TypeError(\`assert.\${name}: expected type '\${name}', got '\${String(actual)}'\`);`
	);
	lines.push('        }');
	lines.push('    };');
	lines.push('}');
	lines.push('function _makeAssertKind(guard: _AnyGuard) {');
	lines.push('    return (...args: unknown[]): void => {');
	lines.push('        if (!guard(...args)) {');
	lines.push(`            const v = args[0] as { $type?: unknown } | null;`);
	lines.push(`            const expected = String(args[1] ?? '(unknown)');`);
	lines.push(`            const actual = v?.$type ?? '(none)';`);
	lines.push(
		`            throw new TypeError(\`assert.kind: expected type '\${expected}', got '\${String(actual)}'\`);`
	);
	lines.push('        }');
	lines.push('    };');
	lines.push('}');
	lines.push('');
	lines.push('export const assert = {');
	// Build assert entries by wrapping each is entry. Keys must match
	// is's exactly.
	for (const s of structuralKinds) {
		lines.push(
			`    ${s.guardKey}: _makeAssert('${s.guardKey}', is.${s.guardKey} as _AnyGuard),`
		);
	}
	lines.push(`    kind: _makeAssertKind(is.kind as _AnyGuard),`);
	for (const s of supertypes) {
		lines.push(
			`    ${s.guardKey}: _makeAssert('${s.guardKey}', is.${s.guardKey} as _AnyGuard),`
		);
	}
	lines.push('} as unknown as AssertGuards;');
	lines.push('');

	// Shape guards — isTree / isNode — overloaded signatures.
	lines.push(
		'// Shape guards — narrow through NamespaceMap when kind is already known.'
	);
	lines.push(
		'// Overload 1: typed input whose type is a NamespaceMap key → narrow to Tree/Node projection.'
	);
	lines.push(
		'// Overload 2: generic unknown → fall back to AnyTreeNode / AnyNodeData.'
	);
	lines.push('');
	lines.push(
		'export function isTree<T extends { readonly $type: K }, K extends keyof NamespaceMap & string>('
	);
	lines.push('    v: T,');
	lines.push(`): v is T & NamespaceMap[K]['Tree'];`);
	lines.push('export function isTree(v: unknown): v is AnyTreeNode;');
	lines.push('export function isTree(v: unknown): boolean {');
	lines.push(
		`    return typeof (v as { range?: unknown })?.range === 'function';`
	);
	lines.push('}');
	lines.push('');
	lines.push(
		'export function isNode<T extends { readonly $type: K }, K extends keyof NamespaceMap & string>('
	);
	lines.push('    v: T,');
	lines.push(`): v is T & NamespaceMap[K]['Node'];`);
	lines.push(
		'export function isNode(v: { readonly $type: string | number }): v is AnyNodeData;'
	);
	lines.push(
		'export function isNode(v: { readonly $type: string | number }): boolean {'
	);
	lines.push('    const o = v as { $fields?: unknown; $text?: unknown };');
	// `typeof null === 'object'` — explicitly exclude null before accepting
	// the object-shape (matches the stricter isNodeData guard in from.ts).
	lines.push(
		`    return (o.$fields !== undefined && o.$fields !== null && typeof o.$fields === 'object') || typeof o.$text === 'string';`
	);
	lines.push('}');
	lines.push('');

	return lines.join('\n');
}
