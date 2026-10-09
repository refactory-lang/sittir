import { findOwnKindEntry } from '../dsl/symbol-table.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { snakeToCamel } from '../compiler/model/node-map.ts';
import { expandToConcreteParseKinds, isDeclaredSupertype } from './shared.ts';
import { assertNever } from '../polymorph-variant.ts';
import { collectCatalogKinds, collectKindEntries, findKindEntry, kindDiscriminantExpr, type KindEnumEntry } from './kind-discriminant.ts';
import { flattenedVariantParents, type FlattenedVariantRoute } from './overlays/module.ts';

export interface EmitIsConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
}

const toCamelCase = snakeToCamel;

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
	'kind'
]);

const RESERVED_GUARD_NAMES = new Set(['kind']);

function safeGuardKey(camel: string): string {
	return RESERVED.has(camel) ? `${camel}_` : camel;
}

function kindPredicate(narrowType: string): string {
	return `<T extends { readonly $type: number } | number>(v: T): v is Extract<T, { readonly $type: number }> & { readonly $type: ${narrowType} }`;
}

function supertypePredicate(discriminant: string): string {
	return `<T extends { readonly $type: string | number } | number>(v: T): v is NarrowTo<T, ${discriminant}>`;
}

export function emitIs(config: EmitIsConfig): string {
	const { nodeMap, generatedIdTables } = config;

	const kindEntries: readonly KindEnumEntry[] | undefined = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;

	const kindIdOf = (kind: string): number | undefined =>
		kindEntries !== undefined ? findOwnKindEntry(kindEntries, kind)?.id : undefined;

	const structuralKinds: Array<{
		kind: string;
		typeName: string;
		guardKey: string;
		member?: string;
		numericId?: number;
	}> = [];
	const usedCamelKeys = new Set<string>();

	for (const [kind, node] of nodeMap.nodes) {
		let structural: boolean;
		switch (node.modelType) {
			case 'branch':
			case 'envelope':
				structural = !node.seated;
				break;
			case 'polymorph':
			case 'alias':
				structural = !node.seated;
				break;
			case 'supertype':
				structural = false;
				break;
			case 'list':
				structural = true;
				break;
			case 'pattern':
			case 'keyword':
			case 'punctuation':
			case 'enum':
				structural = false;
				break;
			default:
				assertNever(node);
		}
		if (!structural) continue;
		const numericId = kindIdOf(kind);
		if (kindEntries && numericId === undefined) {
			continue;
		}
		const camel = toCamelCase(kind);
		const guardKey = safeGuardKey(camel);
		if (usedCamelKeys.has(guardKey) || RESERVED_GUARD_NAMES.has(camel)) {
			throw new Error(
				`is emitter: camelCase kind '${camel}' collides with reserved guard key ` +
					`or another kind. Rename '${kind}' before proceeding.`
			);
		}
		usedCamelKeys.add(guardKey);
		const member = kindEntries ? findOwnKindEntry(kindEntries, kind)?.member : undefined;
		structuralKinds.push({ kind, typeName: node.typeName, guardKey, member, numericId });
	}

	const variantParents = kindEntries ? flattenedVariantParents(nodeMap, generatedIdTables) : [];
	const supertypeKindByKey = new Map(variantParents.map((parent) => [parent.key, parent.node.kind]));

	const supertypes: Array<{
		kind: string;
		typeName: string;
		guardKey: string;
		memberKinds: string[];
		memberIds: number[];
		memberKindIds: string[];
		variants: readonly FlattenedVariantRoute[];
	}> = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (!isDeclaredSupertype(node)) continue;
		const st = node;
		const cleanName = kind.replace(/^_/, '');
		const typeName = node.typeName;
		const camel = toCamelCase(cleanName);
		const guardKey = safeGuardKey(camel);
		const memberKinds: string[] = [];
		const memberIds: number[] = [];
		const memberKindIds: string[] = [];
		for (const sub of expandToConcreteParseKinds([kind], nodeMap)) {
			memberKinds.push(sub);
			const entry = kindEntries === undefined ? undefined : findKindEntry(kindEntries, sub);
			if (entry === undefined || memberIds.includes(entry.id)) continue;
			memberIds.push(entry.id);
			memberKindIds.push(`TSKindId.${entry.member}`);
		}
		if (memberKinds.length === 0) continue;
		if (usedCamelKeys.has(guardKey)) continue;
		usedCamelKeys.add(guardKey);
		const variants = variantParents.find((parent) => parent.node === st)?.variants ?? [];
		supertypes.push({ kind, typeName, guardKey, memberKinds, memberIds, memberKindIds, variants });
	}
	const guardKeyOfSupertype = (key: string): string => {
		const nested = supertypes.find((s) => s.kind === supertypeKindByKey.get(key));
		if (nested === undefined) throw new Error(`is emitter: the nested variant parent '${key}' has no supertype guard.`);
		return nested.guardKey;
	};
	const variantGuard = (route: FlattenedVariantRoute): { readonly type: string; readonly value: string } => {
		if (route.nestedParentKey !== undefined) {
			const nested = guardKeyOfSupertype(route.nestedParentKey);
			return { type: `${route.name}: IsGuards['${nested}']`, value: `_supertype_${nested}_guard` };
		}
		const id = kindDiscriminantExpr(route.child.kind, nodeMap, kindEntries);
		return route.leaf
			? { type: `${route.name}${supertypePredicate(id)}`, value: `_sg(new Set<number>([${id}]))` }
			: { type: `${route.name}${kindPredicate(id)}`, value: `_g(${id})` };
	};

	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('// Per-grammar type guards: is.');
	lines.push('// Composition: kind × shape = concrete type via NamespaceMap.');
	lines.push('');
	if (kindEntries) {
		lines.push("import { TSKindId } from './types.js';");
	}
	lines.push("import type { NamespaceMap } from './types.js';");
	if (supertypes.length > 0) lines.push("import type { NarrowTo } from '@sittir/types';");
	lines.push('');

	lines.push('// IsGuards — per-kind + supertype type-narrowing guards.');
	lines.push('export interface IsGuards {');
	for (const s of structuralKinds) {
		lines.push(`    ${s.guardKey}${kindPredicate(s.member ? `TSKindId.${s.member}` : 'number')};`);
	}
	lines.push(
		`    kind<K extends keyof NamespaceMap>(v: { readonly $type: number }, kind: K): v is { readonly $type: number };`
	);
	for (const s of supertypes) {
		const predicate = supertypePredicate(s.memberKindIds.length > 0 ? s.memberKindIds.join(' | ') : 'number');
		if (s.variants.length === 0) {
			lines.push(`    ${s.guardKey}${predicate};`);
			continue;
		}
		lines.push(`    readonly ${s.guardKey}: {`);
		lines.push(`        ${predicate};`);
		for (const variant of s.variants) lines.push(`        ${variantGuard(variant).type};`);
		lines.push('    };');
	}
	lines.push('}');
	lines.push('');

	if (kindEntries) {
		lines.push('// Runtime: kind guards compare numeric TSKindId only.');
		lines.push('function _g(id: number): (v: { readonly $type: number } | number) => boolean {');
		lines.push("    return (v) => typeof v !== 'number' && v.$type === id;");
		lines.push('}');
		lines.push('function _sg(ids: ReadonlySet<number>): (v: { readonly $type: number } | number) => boolean {');
		lines.push("    return (v) => ids.has(typeof v === 'number' ? v : v.$type);");
		lines.push('}');
		if (supertypes.some((s) => s.variants.length > 0)) {
			lines.push('function _vg<G extends object>(guard: G, variants: object): G {');
			lines.push('    return Object.freeze(Object.defineProperties(guard, Object.getOwnPropertyDescriptors(variants)));');
			lines.push('}');
		}
	} else {
		lines.push('// Runtime: kind guards = string equality; supertype guards = Set.has.');
		lines.push('// Building from literal string arrays keeps the runtime footprint minimal.');
		lines.push('function _g(k: string): (v: { readonly $type: number }) => boolean {');
		lines.push('    return (v) => (v.$type as unknown) === k;');
		lines.push('}');
		lines.push('function _sg(ks: ReadonlySet<string>): (v: { readonly $type: number }) => boolean {');
		lines.push('    return (v) => ks.has(v.$type as unknown as string);');
		lines.push('}');
	}
	lines.push('');

	for (const s of supertypes) {
		if (kindEntries) {
			if (s.memberIds.length > 0) {
				const ids = s.memberIds.join(', ');
				lines.push(`const _supertype_${s.guardKey}_ids = new Set<number>([${ids}]);`);
			}
		} else {
			const members = s.memberKinds.map((k) => JSON.stringify(k)).join(', ');
			lines.push(`const _supertype_${s.guardKey} = new Set<string>([${members}]);`);
		}
	}
	if (supertypes.length > 0) lines.push('');

	for (const parent of variantParents) {
		const s = supertypes.find((candidate) => candidate.kind === parent.node.kind);
		if (s === undefined || s.variants.length === 0) continue;
		const members = s.variants.map((variant) => `${variant.name}: ${variantGuard(variant).value}`).join(', ');
		lines.push(`const _supertype_${s.guardKey}_guard = _vg(_sg(_supertype_${s.guardKey}_ids), { ${members} });`);
	}
	if (supertypes.some((s) => s.variants.length > 0)) lines.push('');

	lines.push('export const is = Object.freeze({');
	for (const s of structuralKinds) {
		if (kindEntries && s.numericId !== undefined) {
			const expr = kindDiscriminantExpr(s.kind, nodeMap, kindEntries);
			lines.push(`    ${s.guardKey}: _g(${expr}),`);
		} else {
			lines.push(`    ${s.guardKey}: _g(${JSON.stringify(s.kind)}),`);
		}
	}
	if (kindEntries) {
		lines.push(`    kind: (v: { readonly $type: number }, k: number): boolean => v.$type === k,`);
	} else {
		lines.push(`    kind: (v: { readonly $type: number }, k: string): boolean => (v.$type as unknown) === k,`);
	}
	for (const s of supertypes) {
		if (s.variants.length > 0) {
			lines.push(`    ${s.guardKey}: _supertype_${s.guardKey}_guard,`);
		} else if (kindEntries && s.memberIds.length > 0) {
			lines.push(`    ${s.guardKey}: _sg(_supertype_${s.guardKey}_ids),`);
		} else if (kindEntries) {
			lines.push(`    ${s.guardKey}: _sg(new Set<number>()),`);
		} else {
			lines.push(`    ${s.guardKey}: _sg(_supertype_${s.guardKey}),`);
		}
	}
	lines.push('}) as unknown as IsGuards;');
	lines.push('');

	return lines.join('\n');
}
