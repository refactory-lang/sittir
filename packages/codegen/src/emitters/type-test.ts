/**
 * Type-level test emitter — consumes NodeMap directly.
 * Generates compile-time assertions verifying generated types are well-formed.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import {
	collectKindEntries,
	collectCatalogKinds,
	kindDiscriminantExpr,
	findKindEntry,
	type KindEnumEntry
} from './kind-discriminant.ts';
import { AssembledEnum } from '../compiler/node-map.ts';
import { referencedKinds, resolveHiddenKeywordLiteral } from './shared.ts';

export interface EmitTypeTestsConfig {
	nodeMap: NodeMap;
	/**
	 * Parser-symbol ID tables for numeric $type assertion emission.
	 * When present, generated type tests emit `TSKindId.X` in extends checks.
	 * When absent (legacy callers), falls back to string literal checks.
	 */
	generatedIdTables?: GeneratedIdTables;
}

/**
 * Returns the expected-type expression for a `_TypeExtends<X['$type'], ...>` check.
 *
 * @remarks
 * When kindEntries is present (KindID pipeline), emits `TSKindId.X`. When
 * absent (legacy / unit-test path), falls back to `'<kind>'` string literal.
 *
 * @param kind - The grammar kind string.
 * @param kindEntries - Collected kind-enum entries, or `undefined` for fallback.
 * @param nodeMap - The assembled node map.
 * @returns Expression string suitable for `_TypeExtends<X['$type'], <expr>>`.
 */
/**
 * @param isLeaf - When true, the node uses `Terminal<K>` (string-keyed `$type`);
 *   numeric discriminants are not applicable until `Terminal` itself is migrated.
 *   Phase A only migrates structural (branch/container/polymorph) interfaces.
 */
function typeTestDiscriminant(
	kind: string,
	kindEntries: readonly KindEnumEntry[] | undefined,
	nodeMap: NodeMap,
	isLeaf = false
): string {
	if (!kindEntries) return `'${kind}'`;
	// Leaf nodes use Terminal<K extends string> which keeps string $type until
	// Phase B updates @sittir/types. Assert string discriminant for now.
	if (isLeaf) return `'${kind}'`;
	const hasEntry = kindEntries.some((e) => e.kind === kind);
	if (!hasEntry) return `'${kind}'`;
	return kindDiscriminantExpr(kind, nodeMap, kindEntries);
}

/**
 * Build the expected discriminant for a type-test assertion on an enum kind.
 *
 * @remarks
 * Mirrors `enumMemberDiscriminant` in `types.ts`: resolves each member
 * value to its `TSKindId.X` entry and joins as a union. Falls back to
 * the string kind name when no entries resolve or `kindEntries` is absent.
 *
 * @param node - The `AssembledEnum` node.
 * @param kindEntries - Catalog entries for TSKindId lookup.
 * @returns The expected discriminant expression for the type assertion.
 */
function enumMemberTypeTestDiscriminant(
	node: AssembledEnum,
	kindEntries: readonly KindEnumEntry[] | undefined
): string {
	if (!kindEntries) return `'${node.kind}'`;
	const members: string[] = [];
	for (const value of node.values) {
		const entry = findKindEntry(kindEntries, value);
		if (entry) {
			members.push(`TSKindId.${entry.member}`);
		}
	}
	if (members.length === 0) return 'number';
	return members.join(' | ');
}

export function emitTypeTests(config: EmitTypeTestsConfig): string {
	const { nodeMap } = config;
	// Use the full catalog superset (children-only kinds + anon tokens) so
	// enum member lookups resolve anonymous tokens like "block", "expr" that
	// aren't in nodeMap.nodes but DO have parser symbols. Matches types.ts's
	// kindEntries construction — DRY: same universe for both surfaces.
	const allKinds = config.generatedIdTables
		? collectCatalogKinds(config.generatedIdTables)
		: Array.from(nodeMap.nodes.keys());
	const kindEntries = config.generatedIdTables
		? collectKindEntries(allKinds, nodeMap, config.generatedIdTables)
		: undefined;

	const structuralKinds: {
		kind: string;
		typeName: string;
		hasVariants: boolean;
	}[] = [];
	const leafKinds: { kind: string; typeName: string }[] = [];

	// Mirror the T073 liveness check from types: a terminal is only emitted
	// when it has a factory OR is referenced by another structural node.
	// Shared derivation — `shared.ts::referencedKinds` — so types.ts and
	// type-test.ts stay in lockstep.
	const referenced = referencedKinds(nodeMap);

	for (const [kind, node] of nodeMap.nodes) {
		switch (node.modelType) {
			case 'branch':
				structuralKinds.push({
					kind,
					typeName: node.typeName,
					hasVariants: false
				});
				break;
			case 'polymorph':
				structuralKinds.push({
					kind,
					typeName: node.typeName,
					hasVariants: node.forms.length > 1
				});
				break;
			case 'pattern':
			case 'keyword':
			case 'enum':
				// Only test leaves that actually made it into types.ts.
				if (!node.rawFactoryName && !referenced.has(kind)) continue;
				// Hidden `_kw_*` keywords are dropped from types.ts (the
				// factory inlines their literal), so skip them here too —
				// emitting `_Type_KwAsync` tests an identifier that
				// types.ts never exports. Lockstep with
				// `emitLeafTerminalAliases` in types.ts.
				if (resolveHiddenKeywordLiteral(kind, nodeMap) !== undefined) continue;
				leafKinds.push({ kind, typeName: node.typeName });
				break;
		}
	}

	const lines: string[] = [
		'// Auto-generated by @sittir/codegen — do not edit',
		'// Type-level test: verifies generated types are well-formed',
		''
	];

	// Build the assertion body first, tracking which type names we
	// actually reference. Then emit imports for exactly those names —
	// nothing more. Avoids hundreds of `no-unused-vars` warnings from
	// the prior "kitchen-sink" import list.
	const typeImports = new Set<string>();
	const body: string[] = [];
	// When kindEntries are present (KindID pipeline), $type checks use
	// TSKindId.X — import the const enum.
	const needsKindIdImport = kindEntries !== undefined;

	// Dedup by typeName — two distinct kinds (e.g. python's `'True'` string
	// literal vs a supertype/keyword with the same PascalCase name) can
	// normalise to the same typeName, producing duplicate `_Type_X` /
	// `_Config_X` / `_Tree_X` identifiers. The assertions are equivalent,
	// so keep the first occurrence and skip the rest.
	const seenType = new Set<string>();
	const seenTree = new Set<string>();

	body.push('// --- Concrete interface `$type` discriminant ---');
	// Canonical-hidden architecture (Option Y): types.ts declares
	// `$type: TSKindId.X` (numeric) for each concrete interface after Phase A.
	// The runtime canonicalizes parser output visible→hidden inside `wrapNode`
	// via the emitted alias map so both producer paths (factory stamping +
	// parser→wrap) match the interface's declared numeric discriminant.
	for (const s of structuralKinds) {
		if (seenType.has(s.typeName)) continue;
		seenType.add(s.typeName);
		typeImports.add(s.typeName);
		const discriminant = typeTestDiscriminant(s.kind, kindEntries, nodeMap);
		body.push(
			`export type _Type_${s.typeName} = _TypeAssert<_TypeExtends<${s.typeName}['$type'], ${discriminant}>>;`
		);
	}
	for (const l of leafKinds) {
		if (seenType.has(l.typeName)) continue;
		seenType.add(l.typeName);
		typeImports.add(l.typeName);
		const node = nodeMap.nodes.get(l.kind);
		const discriminant =
			node instanceof AssembledEnum
				? enumMemberTypeTestDiscriminant(node, kindEntries)
				: typeTestDiscriminant(l.kind, kindEntries, nodeMap);
		body.push(
			`export type _Type_${l.typeName} = _TypeAssert<_TypeExtends<${l.typeName}['$type'], ${discriminant}>>;`
		);
	}
	body.push('');

	// Config assertion dropped — base-kind `${TypeName}Config` aliases are
	// no longer emitted (spec 008 US7 landing). `X.Config` (namespace sugar)
	// and `ConfigOf<X>` resolve to the same type by construction; the old
	// test was a tautology.

	body.push('// --- TreeNode types have correct `type` ---');
	// TreeNode.type is from tree-sitter and stays as a string literal always.
	for (const s of structuralKinds) {
		if (seenTree.has(s.typeName)) continue;
		seenTree.add(s.typeName);
		typeImports.add(`${s.typeName}Tree`);
		body.push(
			`export type _Tree_${s.typeName} = _TypeAssert<_TypeExtends<${s.typeName}Tree['type'], '${s.kind}'>>;`
		);
	}
	for (const l of leafKinds) {
		if (seenTree.has(l.typeName)) continue;
		seenTree.add(l.typeName);
		typeImports.add(`${l.typeName}Tree`);
		body.push(
			`export type _Tree_${l.typeName} = _TypeAssert<_TypeExtends<${l.typeName}Tree['type'], '${l.kind}'>>;`
		);
	}
	body.push('');

	// Imports — now emitted from the narrowed set.
	// When kindEntries are present, also import TSKindId for the numeric checks.
	const typeImportList = [...typeImports].sort();
	if (needsKindIdImport) {
		lines.push(`import type { ${typeImportList.join(', ')} } from './types.js';`);
		lines.push(`import { TSKindId } from './types.js';`);
	} else {
		lines.push(`import type { ${typeImportList.join(', ')} } from './types.js';`);
	}
	lines.push('');
	lines.push('type _TypeExtends<A, B> = A extends B ? true : false;');
	lines.push('type _TypeAssert<T extends true> = T;');
	lines.push('');
	lines.push(...body);

	return lines.join('\n');
}
