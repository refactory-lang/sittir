import { findOwnKindEntry } from '../dsl/symbol-table.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { AssembledEnum, isFixedTextLeaf, isPatternLeaf, snakeToCamel } from '../compiler/model/node-map.ts';
import { isDeclaredSupertype } from './shared.ts';
import { membershipKindsOf } from './membership.ts';
import { assertNever } from '../polymorph-variant.ts';
import { collectCatalogKinds, collectKindEntries, findKindEntry, kindDiscriminantExpr, type KindEnumEntry } from './kind-discriminant.ts';
import { flattenedVariantParents, type FlattenedVariantRoute } from '../compiler/model/ir-surface.ts';

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
	return `<T extends { readonly $type: number } | number>(v: T): v is NarrowTo<T, ${discriminant}>`;
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
				structural = node.ownSurface;
				break;
			case 'polymorph':
			case 'alias':
				structural = node.ownSurface;
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

	const variantParents = kindEntries ? flattenedVariantParents(nodeMap) : [];
	const supertypeKindByKey = new Map(variantParents.map((parent) => [parent.key, parent.node.kind]));

	const supertypes: Array<{
		kind: string;
		id: number | undefined;
		member: string | undefined;
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
		for (const sub of membershipKindsOf([kind], nodeMap)) {
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
		const own = kindEntries === undefined ? undefined : findOwnKindEntry(kindEntries, kind);
		supertypes.push({ kind, id: own?.id, member: own?.member, typeName, guardKey, memberKinds, memberIds, memberKindIds, variants });
	}

	const leafGuards: Array<{
		kind: string;
		guardKey: string;
		shape: 'text' | 'unit' | 'enum';
		discriminant: string;
		memberIds: number[];
	}> = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (node.hidden || !(isPatternLeaf(node) || isFixedTextLeaf(node) || node instanceof AssembledEnum)) continue;
		const entry = kindEntries === undefined ? undefined : findOwnKindEntry(kindEntries, kind);
		if (kindEntries && entry === undefined) continue;
		const guardKey = safeGuardKey(toCamelCase(kind.replace(/^_/, '')));
		if (usedCamelKeys.has(guardKey) || RESERVED_GUARD_NAMES.has(guardKey)) {
			throw new Error(`is emitter: camelCase kind '${guardKey}' collides with reserved guard key or another kind. Rename '${kind}' before proceeding.`);
		}
		usedCamelKeys.add(guardKey);
		const memberEntries = node instanceof AssembledEnum && kindEntries ? membershipKindsOf([kind], nodeMap).flatMap((member) => findKindEntry(kindEntries, member) ?? []) : [];
		leafGuards.push({
			kind,
			guardKey,
			shape: isPatternLeaf(node) ? 'text' : node instanceof AssembledEnum ? 'enum' : 'unit',
			discriminant: node instanceof AssembledEnum ? (memberEntries.length > 0 ? memberEntries.map((m) => `TSKindId.${m.member}`).join(' | ') : 'number') : entry ? `TSKindId.${entry.member}` : 'number',
			memberIds: [...new Set(memberEntries.map((m) => m.id))]
		});
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
			? { type: `${route.name}${supertypePredicate(id)}`, value: `_mg(${id})` }
			: { type: `${route.name}${kindPredicate(id)}`, value: `_g(${id})` };
	};

	const supertypeKey = (s: (typeof supertypes)[number]): string | undefined => (s.member !== undefined && s.memberIds.length > 0 ? `TSKindId.${s.member}` : undefined);
	const enumKey = (leaf: (typeof leafGuards)[number]): string | undefined =>
		leaf.shape === 'enum' && kindEntries !== undefined && leaf.memberIds.length > 0 ? kindDiscriminantExpr(leaf.kind, nodeMap, kindEntries) : undefined;
	const memberRows = [
		...supertypes.flatMap((s) => {
			const key = supertypeKey(s);
			return key === undefined ? [] : [{ key, set: `_supertype_${s.guardKey}_ids`, members: s.memberKindIds.join(' | ') }];
		}),
		...leafGuards.flatMap((leaf) => {
			const key = enumKey(leaf);
			return key === undefined ? [] : [{ key, set: `new Set<number>([${leaf.memberIds.join(', ')}])`, members: leaf.discriminant }];
		})
	];
	const membersOfKey = (key: string | undefined, inline: string): string => (key === undefined ? inline : `KindMembers[${key}]`);

	const lines: string[] = [];
	lines.push('// Auto-generated by @sittir/codegen — do not edit');
	lines.push('// Per-grammar type guards: is.');
	lines.push('// Composition: kind × shape = concrete type via NamespaceMap.');
	lines.push('');
	if (kindEntries) {
		lines.push("import { TSKindId } from './kinds.js';");
		lines.push("import { holdsKinds, type KindTest } from '@sittir/common/language';");
	}
	lines.push("import type { NamespaceMap } from './types.js';");
	if (supertypes.length > 0 || leafGuards.some((leaf) => leaf.shape !== 'text')) lines.push("import type { NarrowTo } from '@sittir/types';");
	lines.push('');

	lines.push('// KindMembers — each supertype and enum kind, mapped to the kind ids it holds for.');
	lines.push('export interface KindMembers {');
	for (const row of memberRows) lines.push(`    [${row.key}]: ${row.members};`);
	lines.push('}');
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
		const predicate = supertypePredicate(membersOfKey(supertypeKey(s), s.memberKindIds.length > 0 ? s.memberKindIds.join(' | ') : 'number'));
		if (s.variants.length === 0) {
			lines.push(`    ${s.guardKey}${predicate};`);
			continue;
		}
		lines.push(`    readonly ${s.guardKey}: {`);
		lines.push(`        ${predicate};`);
		for (const variant of s.variants) lines.push(`        ${variantGuard(variant).type};`);
		lines.push('    };');
	}
	for (const leaf of leafGuards) {
		lines.push(`    ${leaf.guardKey}${leaf.shape === 'text' ? kindPredicate(leaf.discriminant) : supertypePredicate(membersOfKey(enumKey(leaf), leaf.discriminant))};`);
	}
	lines.push('}');
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

	lines.push('const _members = new Map<number, ReadonlySet<number>>([');
	for (const row of memberRows) lines.push(`    [${row.key}, ${row.set}],`);
	lines.push(']);');
	lines.push('const _single = new Map<number, ReadonlySet<number>>();');
	lines.push('function _kinds(kind: number): ReadonlySet<number> {');
	lines.push('    const members = _members.get(kind);');
	lines.push('    if (members !== undefined) return members;');
	lines.push('    let single = _single.get(kind);');
	lines.push('    if (single === undefined) _single.set(kind, (single = new Set([kind])));');
	lines.push('    return single;');
	lines.push('}');
	lines.push('export function isMember(kind: number, type: number): boolean {');
	lines.push('    return _kinds(kind).has(type);');
	lines.push('}');
	lines.push('export function membersOf(kind: number): readonly number[] {');
	lines.push('    return [..._kinds(kind)];');
	lines.push('}');
	lines.push('');

	if (!kindEntries) {
		lines.push('// Runtime: kind guards = string equality; supertype guards = Set.has.');
		lines.push('function _g(k: string): (v: { readonly $type: number }) => boolean {');
		lines.push('    return (v) => (v.$type as unknown) === k;');
		lines.push('}');
		lines.push('function _sg(ks: ReadonlySet<string>): (v: { readonly $type: number }) => boolean {');
		lines.push('    return (v) => ks.has(v.$type as unknown as string);');
		lines.push('}');
		lines.push('');
		lines.push('export const is = Object.freeze({');
		for (const s of structuralKinds) lines.push(`    ${s.guardKey}: _g(${JSON.stringify(s.kind)}),`);
		lines.push(`    kind: (v: { readonly $type: number }, k: string): boolean => (v.$type as unknown) === k,`);
		for (const s of supertypes) lines.push(`    ${s.guardKey}: _sg(_supertype_${s.guardKey}),`);
		for (const leaf of leafGuards) lines.push(`    ${leaf.guardKey}: _g(${JSON.stringify(leaf.kind)}),`);
		lines.push('}) as unknown as IsGuards;');
		lines.push('export function guardsWith(): IsGuards {');
		lines.push('    return is;');
		lines.push('}');
		lines.push('');
		return lines.join('\n');
	}

	if (supertypes.some((s) => s.variants.length > 0)) {
		lines.push('function _vg<G extends object>(guard: G, variants: object): G {');
		lines.push('    return Object.freeze(Object.defineProperties(guard, Object.getOwnPropertyDescriptors(variants)));');
		lines.push('}');
		lines.push('');
	}
	lines.push('// Runtime: every guard holds through the one kind test it is built with; an engine\'s `ofType` reads the same test.');
	lines.push('export function guardsWith(test: KindTest): IsGuards {');
	lines.push('    const _g = (id: number) => {');
	lines.push('        const kinds = _kinds(id);');
	lines.push("        return (v: unknown): boolean => typeof v !== 'number' && test(v, kinds);");
	lines.push('    };');
	lines.push('    const _mg = (kind: number) => {');
	lines.push('        const kinds = _kinds(kind);');
	lines.push('        return (v: unknown): boolean => test(v, kinds);');
	lines.push('    };');
	lines.push('    const _sg = (kinds: ReadonlySet<number>) => (v: unknown): boolean => test(v, kinds);');
	for (const parent of variantParents) {
		const s = supertypes.find((candidate) => candidate.kind === parent.node.kind);
		if (s === undefined || s.variants.length === 0) continue;
		const members = s.variants.map((variant) => `${variant.name}: ${variantGuard(variant).value}`).join(', ');
		const base = s.id !== undefined ? `_mg(${s.id})` : `_sg(_supertype_${s.guardKey}_ids)`;
		lines.push(`    const _supertype_${s.guardKey}_guard = _vg(${base}, { ${members} });`);
	}
	lines.push('    return Object.freeze({');
	for (const s of structuralKinds) {
		lines.push(`        ${s.guardKey}: _g(${kindDiscriminantExpr(s.kind, nodeMap, kindEntries)}),`);
	}
	lines.push("        kind: (v: { readonly $type: number }, k: number): boolean => typeof v !== 'number' && test(v, _kinds(k)),");
	for (const s of supertypes) {
		if (s.variants.length > 0) lines.push(`        ${s.guardKey}: _supertype_${s.guardKey}_guard,`);
		else if (s.memberIds.length > 0) lines.push(`        ${s.guardKey}: ${s.id !== undefined ? `_mg(${s.id})` : `_sg(_supertype_${s.guardKey}_ids)`},`);
		else lines.push(`        ${s.guardKey}: _sg(new Set<number>()),`);
	}
	for (const leaf of leafGuards) {
		const expr = kindDiscriminantExpr(leaf.kind, nodeMap, kindEntries);
		lines.push(`        ${leaf.guardKey}: ${leaf.shape === 'text' ? `_g(${expr})` : `_mg(${expr})`},`);
	}
	lines.push('    }) as unknown as IsGuards;');
	lines.push('}');
	lines.push('');
	lines.push('export const is = guardsWith(holdsKinds);');
	lines.push('');

	return lines.join('\n');
}
