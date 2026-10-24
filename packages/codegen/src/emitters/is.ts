import { findOwnKindEntry } from '../dsl/symbol-table.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import { AssembledEnum, isFixedTextLeaf, isPatternLeaf, type AssembledNode } from '../compiler/model/node-map.ts';
import { isDeclaredSupertype } from './shared.ts';
import { membershipKindsOf } from './membership.ts';
import { collectKindEntries, findKindEntry, kindDiscriminantExpr, type KindEnumEntry } from './kind-discriminant.ts';
import { flattenedVariantParents, formRoutesOf, seatedFormKinds, type FlattenedVariantRoute, type FormRoute } from '../compiler/model/ir-surface.ts';

export interface EmitIsConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
}

const RESERVED_GUARD_NAMES = new Set(['kind']);

function kindPredicate(narrowType: string): string {
	return `<T extends { readonly $type: number } | number>(v: T): v is Extract<T, { readonly $type: number }> & { readonly $type: ${narrowType} }`;
}

function supertypePredicate(discriminant: string): string {
	return `<T extends { readonly $type: number } | number>(v: T): v is NarrowTo<T, ${discriminant}>`;
}

function leafShapeOf(node: AssembledNode): 'text' | 'unit' | 'enum' | undefined {
	if (isPatternLeaf(node)) return 'text';
	if (node instanceof AssembledEnum) return 'enum';
	return isFixedTextLeaf(node) ? 'unit' : undefined;
}

export function emitIs(config: EmitIsConfig): string {
	const { nodeMap, generatedIdTables } = config;

	const kindEntries: readonly KindEnumEntry[] = collectKindEntries(nodeMap, generatedIdTables);

	const kindIdOf = (kind: string): number | undefined =>
		findOwnKindEntry(kindEntries, kind)?.id;

	const usedGuardKeys = new Set<string>();
	const claimGuardKey = (node: AssembledNode): string => {
		const key = node.typeKey;
		if (key === undefined) throw new Error(`is emitter: '${node.kind}' has no stamped type key.`);
		if (usedGuardKeys.has(key) || RESERVED_GUARD_NAMES.has(key)) {
			throw new Error(`is emitter: '${node.kind}' takes the guard key '${key}', which another guard or an is method already holds.`);
		}
		usedGuardKeys.add(key);
		return key;
	};

	const structuralKinds: Array<{
		kind: string;
		typeName: string;
		guardKey: string;
		member?: string;
	}> = [];

	const seated = seatedFormKinds(nodeMap);
	const guardedAtOwnKey = (kind: string, node: AssembledNode): boolean =>
		!node.hidden &&
		node.modelType !== 'supertype' &&
		kindIdOf(kind) !== undefined &&
		(node.builderPath === undefined || node.builderPath.length === 1 || seated.has(kind));

	for (const [kind, node] of nodeMap.nodes) {
		if (!guardedAtOwnKey(kind, node) || leafShapeOf(node) !== undefined) continue;
		const guardKey = claimGuardKey(node);
		const member = findOwnKindEntry(kindEntries, kind)?.member;
		structuralKinds.push({ kind, typeName: node.typeName, guardKey, member });
	}

	const variantParents = flattenedVariantParents(nodeMap);
	const supertypeKindByKey = new Map(variantParents.map((parent) => [parent.key, parent.node.kind]));
	const formRoutes: ReadonlyMap<string, readonly FormRoute[]> = formRoutesOf(nodeMap);
	const formsOf = (kind: string): readonly FormRoute[] | undefined => (nodeMap.nodes.get(kind)!.builderPath === undefined ? undefined : formRoutes.get(kind));

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
		const typeName = node.typeName;
		const memberKinds: string[] = [];
		const memberIds: number[] = [];
		const memberKindIds: string[] = [];
		for (const sub of membershipKindsOf([kind], nodeMap)) {
			memberKinds.push(sub);
			const entry = findKindEntry(kindEntries, sub);
			if (entry === undefined || memberIds.includes(entry.id)) continue;
			memberIds.push(entry.id);
			memberKindIds.push(`TSKindId.${entry.member}`);
		}
		if (memberKinds.length === 0) continue;
		const guardKey = claimGuardKey(st);
		const variants = variantParents.find((parent) => parent.node === st)?.variants ?? [];
		const own = findOwnKindEntry(kindEntries, kind);
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
		const shape = leafShapeOf(node);
		if (shape === undefined || !guardedAtOwnKey(kind, node)) continue;
		const entry = findOwnKindEntry(kindEntries, kind);
		const guardKey = claimGuardKey(node);
		const memberEntries = node instanceof AssembledEnum && kindEntries ? membershipKindsOf([kind], nodeMap).flatMap((member) => findKindEntry(kindEntries, member) ?? []) : [];
		leafGuards.push({
			kind,
			guardKey,
			shape,
			discriminant: node instanceof AssembledEnum ? (memberEntries.length > 0 ? memberEntries.map((m) => `TSKindId.${m.member}`).join(' | ') : 'number') : entry ? `TSKindId.${entry.member}` : 'number',
			memberIds: [...new Set(memberEntries.map((m) => m.id))]
		});
	}
	const guardKeyOfSupertype = (key: string): string => {
		const nested = supertypes.find((s) => s.kind === supertypeKindByKey.get(key));
		if (nested === undefined) throw new Error(`is emitter: the nested variant parent '${key}' has no supertype guard.`);
		return nested.guardKey;
	};
	const testsIdOnly = (kind: string): boolean => {
		const shape = leafShapeOf(nodeMap.nodes.get(kind)!);
		return shape === 'unit' || shape === 'enum';
	};
	const ownPredicate = (kind: string): string => {
		const id = kindDiscriminantExpr(kind, nodeMap, kindEntries);
		return testsIdOnly(kind) ? supertypePredicate(id) : kindPredicate(id);
	};
	const baseGuard = (kind: string): string => `${testsIdOnly(kind) ? '_mg' : '_g'}(${kindDiscriminantExpr(kind, nodeMap, kindEntries)})`;
	const formGuardConst = (kind: string): string => `_form_${nodeMap.nodes.get(kind)!.typeName}_guard`;
	const kindConsts: string[] = [];
	const formConsts: string[] = [];
	const kindTestNames = new Map<string, string>();
	const kindTest = (kind: string): string => {
		let name = kindTestNames.get(kind);
		if (name === undefined) {
			name = `_kind_${nodeMap.nodes.get(kind)!.typeName}_guard`;
			kindTestNames.set(kind, name);
			kindConsts.push(`    const ${name} = ${baseGuard(kind)};`);
		}
		return name;
	};
	const kindGuard = (kind: string): string => (formsOf(kind) !== undefined ? formGuard(kind) : kindTest(kind));
	const selfTest = (kind: string): string => (seated.has(kind) ? kindTest(kind) : kindGuard(kind));
	let seatsRead = false;
	const guardTree = (kind: string, routes: readonly FormRoute[]): string => `_vg(${baseGuard(kind)}, { ${routes.map((route) => formMember(kind, route)).join(', ')} })`;
	const formMember = (kind: string, route: FormRoute): string => {
		if (route.seat === undefined) return `${route.name}: ${kindGuard(route.child.kind)}`;
		const child = route.forms === undefined ? kindTest(route.child.kind) : guardTree(route.child.kind, route.forms);
		seatsRead = true;
		return `${route.name}: _at(${kindTest(kind)}, ${JSON.stringify(route.seat)}, ${child})`;
	};
	const formGuardNames = new Set<string>();
	const formGuard = (kind: string): string => {
		const name = formGuardConst(kind);
		if (formGuardNames.has(kind)) return name;
		formGuardNames.add(kind);
		formConsts.push(`    const ${name} = ${guardTree(kind, formsOf(kind)!)};`);
		return name;
	};
	const seatedPredicate = (host: string): string =>
		`<T extends { readonly $type: number }>(v: T): v is T & { readonly $type: ${kindDiscriminantExpr(host, nodeMap, kindEntries)} }`;
	const seatedMemberType = (host: string, route: FormRoute): string => {
		if (route.forms === undefined) return `${route.name}${seatedPredicate(host)}`;
		return `readonly ${route.name}: { ${seatedPredicate(host)}; ${route.forms.map((inner) => seatedMemberType(host, inner)).join('; ')} }`;
	};
	const formMemberType = (host: string, route: FormRoute): string => {
		if (route.seat !== undefined) return seatedMemberType(host, route);
		return formsOf(route.child.kind) !== undefined ? `readonly ${route.name}: ${formGuardType(route.child.kind)}` : `${route.name}${ownPredicate(route.child.kind)}`;
	};
	const formGuardType = (kind: string): string => `{ ${ownPredicate(kind)}; ${formsOf(kind)!.map((route) => formMemberType(kind, route)).join('; ')} }`;

	const variantGuard = (route: FlattenedVariantRoute): { readonly type: string; readonly value: string } => {
		if (route.nestedParentKey !== undefined) {
			const nested = guardKeyOfSupertype(route.nestedParentKey);
			return { type: `${route.name}: IsGuards['${nested}']`, value: `_supertype_${nested}_guard` };
		}
		const type = formsOf(route.child.kind) !== undefined ? `readonly ${route.name}: ${formGuardType(route.child.kind)}` : `${route.name}${ownPredicate(route.child.kind)}`;
		return { type, value: kindGuard(route.child.kind) };
	};

	const supertypeKey = (s: (typeof supertypes)[number]): string | undefined => (s.member !== undefined && s.memberIds.length > 0 ? `TSKindId.${s.member}` : undefined);
	const enumKey = (leaf: (typeof leafGuards)[number]): string | undefined =>
		leaf.shape === 'enum' && leaf.memberIds.length > 0 ? kindDiscriminantExpr(leaf.kind, nodeMap, kindEntries) : undefined;
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
	lines.push("import { TSKindId } from './kinds.js';");
	lines.push("import { holdsKinds, type KindTest } from '@sittir/common/language';");
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
		const own = kindPredicate(s.member ? `TSKindId.${s.member}` : 'number');
		const routes = seated.has(s.kind) ? undefined : formsOf(s.kind);
		if (routes === undefined) {
			lines.push(`    ${s.guardKey}${own};`);
			continue;
		}
		lines.push(`    readonly ${s.guardKey}: {`);
		lines.push(`        ${own};`);
		for (const route of routes) lines.push(`        ${formMemberType(s.kind, route)};`);
		lines.push('    };');
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
		if (s.memberIds.length > 0) {
			const ids = s.memberIds.join(', ');
			lines.push(`const _supertype_${s.guardKey}_ids = new Set<number>([${ids}]);`);
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

	const supertypeConsts: string[] = [];
	for (const parent of variantParents) {
		const s = supertypes.find((candidate) => candidate.kind === parent.node.kind);
		if (s === undefined || s.variants.length === 0) continue;
		const members = s.variants.map((variant) => `${variant.name}: ${variantGuard(variant).value}`).join(', ');
		const base = s.id !== undefined ? `_mg(${s.id})` : `_sg(_supertype_${s.guardKey}_ids)`;
		supertypeConsts.push(`    const _supertype_${s.guardKey}_guard = _vg(${base}, { ${members} });`);
	}
	const table: string[] = [];
	for (const s of structuralKinds) table.push(`        ${s.guardKey}: ${selfTest(s.kind)},`);
	table.push("        kind: (v: { readonly $type: number }, k: number): boolean => typeof v !== 'number' && test(v, _kinds(k)),");
	for (const s of supertypes) {
		if (s.variants.length > 0) table.push(`        ${s.guardKey}: _supertype_${s.guardKey}_guard,`);
		else if (s.memberIds.length > 0) table.push(`        ${s.guardKey}: ${s.id !== undefined ? `_mg(${s.id})` : `_sg(_supertype_${s.guardKey}_ids)`},`);
		else table.push(`        ${s.guardKey}: _sg(new Set<number>()),`);
	}
	for (const leaf of leafGuards) table.push(`        ${leaf.guardKey}: ${selfTest(leaf.kind)},`);
	if (formConsts.length > 0 || supertypeConsts.length > 0) {
		lines.push('function _vg<G extends object>(guard: G, variants: object): G {');
		lines.push('    return Object.freeze(Object.defineProperties(guard, Object.getOwnPropertyDescriptors(variants)));');
		lines.push('}');
		lines.push('');
	}
	if (seatsRead) {
		lines.push('function _at<G extends object>(host: (v: unknown) => boolean, seat: string, guard: G): G {');
		lines.push('    const inner = guard as unknown as (v: unknown) => boolean;');
		lines.push('    const forms: Record<string, object> = {};');
		lines.push('    for (const name of Object.keys(guard)) forms[name] = _at(host, seat, (guard as Record<string, object>)[name]!);');
		lines.push('    return _vg((v: unknown): boolean => host(v) && inner((v as Record<string, () => unknown>)[seat]!()), forms) as unknown as G;');
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
	lines.push(...kindConsts, ...formConsts, ...supertypeConsts);
	lines.push('    return Object.freeze({');
	lines.push(...table);
	lines.push('    }) as unknown as IsGuards;');
	lines.push('}');
	lines.push('');
	lines.push('export const is = guardsWith(holdsKinds);');
	lines.push('');

	return lines.join('\n');
}
