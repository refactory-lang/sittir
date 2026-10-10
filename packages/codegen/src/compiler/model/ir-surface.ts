import type { NodeMap } from '../types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import {
	AbstractAssembledCompound,
	AssembledAlias,
	AssembledEnum,
	AssembledList,
	AssembledPattern,
	AssembledSupertype,
	FACTORY_NAME_RESERVED,
	isBuilderTextLeaf,
	isBuilderlessPunctuationLeaf,
	isKindIdStored,
	isNodeRef,
	isSurfaceHiddenIn,
	storageKindOfRef,
	type AssembledNode
} from './node-map.ts';
import { collectCatalogKinds, collectKindEntries, hasCatalogEntry, type KindEnumEntry } from '../../emitters/kind-discriminant.ts';
import { lowerCamelCase } from './casing.ts';
import { supertypeMemberName } from '../../dsl/arm-names.ts';
import { classifyFactoryEmission, classifyFromEmission, isDeclaredSupertype, isValidIdent, ownTextLeaf } from '../../emitters/shared.ts';
import { subFactoriesOf, variantArmsOf, type SubFactory, type SubFactoryDiagnostic } from './sub-factories.ts';

type KindEntries = ReturnType<typeof collectKindEntries> | undefined;

export interface IrKeyedNode {
	readonly key: string;
	readonly exportName: string;
	readonly node: AssembledNode;
}

export function bundleKeyedNodes(nodeMap: NodeMap): readonly IrKeyedNode[] {
	return irSurfaceOf(nodeMap).bundles;
}

export function ownTextKeyedNodes(nodeMap: NodeMap): readonly IrKeyedNode[] {
	return irSurfaceOf(nodeMap).ownText;
}

function irKeyedNodes(nodeMap: NodeMap, kindEntries: KindEntries): IrKeyedNode[] {
	const used = new Set<string>();
	const out: IrKeyedNode[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (node.factoryInline) continue;
		if (!node.rawFactoryName || !node.fromFunctionName) continue;
		if (!(node instanceof AbstractAssembledCompound) && !(node instanceof AssembledList)) continue;
		if (node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && !node.ownSurface) continue;
		if (node instanceof AssembledAlias) continue;
		if (kindEntries && !hasCatalogEntry(kindEntries, kind)) continue;
		if (classifyFromEmission(kind, node, { nodeMap, kindEntries }) !== 'emit') continue;
		const key = node.irKey;
		if (key === undefined || !isValidIdent(key) || used.has(key)) continue;
		used.add(key);
		out.push({ key, exportName: FACTORY_NAME_RESERVED.has(key) ? `${key}_` : key, node });
	}
	return out;
}

export interface FlattenedVariantRoute {
	readonly name: string;
	readonly child: AssembledNode;
	readonly nestedParentKey?: string;
	readonly default?: true;
	readonly leaf?: true;
}

export interface FlattenedVariantParent {
	readonly key: string;
	readonly node: AssembledSupertype;
	readonly variants: readonly FlattenedVariantRoute[];
}

function containersOf(nodeMap: NodeMap): ReadonlyMap<string, ReadonlySet<string>> {
	const out = new Map<string, Set<string>>();
	for (const [kind, node] of nodeMap.nodes) {
		if (!(node instanceof AbstractAssembledCompound)) continue;
		for (const slot of node.slots) for (const value of slot.values) if (isNodeRef(value)) addReferrer(out, storageKindOfRef(value.node), kind);
	}
	return out;
}
function addReferrer(out: Map<string, Set<string>>, child: string, parent: string): void {
	const set = out.get(child) ?? new Set<string>();
	set.add(parent);
	out.set(child, set);
}

export function hasOneSurface(node: AssembledNode): boolean {
	return isBuilderTextLeaf(node) || node instanceof AssembledPattern || ownTextLeaf(node) !== undefined;
}

export function isFlatLeafOrKeyword(
	kind: string,
	node: AssembledNode,
	kindEntries: ReturnType<typeof collectKindEntries> | undefined
): boolean {
	if (!node.userFacing || node.factoryInline) return false;
	if (!hasOneSurface(node) || (isBuilderTextLeaf(node) && node.surfaceHidden)) return false;
	if (!node.irKey || !node.rawFactoryName || !isValidIdent(node.irKey)) return false;
	return !kindEntries || hasCatalogEntry(kindEntries, kind);
}

export function hasFlatEntry(
	kind: string,
	node: AssembledNode,
	kindEntries: ReturnType<typeof collectKindEntries> | undefined
): boolean {
	return isFlatLeafOrKeyword(kind, node, kindEntries) && node.annotations?.tokenForm !== true;
}

function flatLeafKindByKey(nodeMap: NodeMap, kindEntries: KindEntries): ReadonlyMap<string, string> {
	const out = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) if (isFlatLeafOrKeyword(kind, node, kindEntries)) out.set(node.irKey!, kind);
	return out;
}

export function flattenedVariantParents(nodeMap: NodeMap): readonly FlattenedVariantParent[] {
	return irSurfaceOf(nodeMap).flattened;
}

function deriveFlattenedVariantParents(
	nodeMap: NodeMap,
	kindEntries: KindEntries,
	bundles: readonly IrKeyedNode[]
): FlattenedVariantParent[] {
	const taken = new Set(bundles.map((entry) => entry.key));
	const leafKinds = flatLeafKindByKey(nodeMap, kindEntries);
	const out: FlattenedVariantParent[] = [];
	const keyByParent = new Map<string, string>();
	const pending = [...nodeMap.nodes].filter(
		(entry): entry is [string, AssembledSupertype] =>
			entry[1] instanceof AssembledSupertype && entry[1].declared && entry[1].subtypes.filter(isNodeRef).length >= 2
	);
	const routesOf = (kind: string, node: AssembledSupertype): FlattenedVariantRoute[] | 'wait' | null => {
		const routes: FlattenedVariantRoute[] = [];
		let waiting = false;
		for (const ref of node.subtypes.filter(isNodeRef)) {
			const childKind = storageKindOfRef(ref.node);
			const child = nodeMap.nodes.get(childKind);
			if (ref.variantOf !== kind || ref.variant === undefined || child === undefined) return null;
			const nestedParentKey = keyByParent.get(childKind);
			const facts = ref.default ? { default: true as const } : {};
			if (nestedParentKey !== undefined) {
				routes.push({ name: lowerCamelCase(ref.variant), child, nestedParentKey, ...facts });
			} else if (child.rawFactoryName !== undefined) {
				routes.push({ name: lowerCamelCase(ref.variant), child, ...facts });
			} else if (child instanceof AssembledSupertype && pending.some(([k]) => k === childKind)) {
				waiting = true;
			} else if (isKindIdStored(child) && !(child instanceof AssembledEnum)) {
				routes.push({ name: lowerCamelCase(ref.variant), child, leaf: true, ...facts });
			} else {
				return null;
			}
		}
		const defaults = routes.filter((route) => route.default);
		if (defaults.length > 1) {
			throw new Error(`arm.default: ${defaults.length} variants of '${kind}' are declared the default (${defaults.map((d) => d.name).join(', ')}); pick one`);
		}
		return waiting ? 'wait' : routes;
	};
	for (let progressed = true; progressed; ) {
		progressed = false;
		for (let i = 0; i < pending.length; i++) {
			const [kind, node] = pending[i]!;
			const routes = routesOf(kind, node);
			if (routes === 'wait') continue;
			pending.splice(i--, 1);
			progressed = true;
			if (routes === null) continue;
			const key = node.irKey;
			if (key === undefined) throw new Error(`ir: the supertype '${kind}' has no ir key`);
			if (!isValidIdent(key) || taken.has(key)) continue;
			const leafKind = leafKinds.get(key);
			if (leafKind !== undefined) throw new Error(`ir: '${kind}' and the leaf '${leafKind}' both take the key '${key}'`);
			taken.add(key);
			keyByParent.set(kind, key);
			out.push({ key, node, variants: routes });
		}
	}
	return out;
}

export function isHoistedCompound(node: AssembledNode): boolean {
	return (
		node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && !node.ownSurface
	);
}

export interface AliasWire {
	readonly name: string;
	readonly child: AssembledNode;
}

export function variantAliasWires(
	node: AssembledNode,
	nodeMap: NodeMap,
	isEmitted: (kind: string) => boolean,
	subs: readonly SubFactory[]
): readonly AliasWire[] {
	if (!(node instanceof AbstractAssembledCompound)) return [];
	const claimedNames = new Set(subs.map((s) => s.name));
	const claimedKinds = new Set(subs.flatMap((s) => (s.arm.via === 'node' ? [s.arm.child.kind] : [])));
	const aliases: AliasWire[] = [];
	for (const variantChild of node.variantChildKinds) {
		const visible = variantChild.kind;
		const child = nodeMap.nodes.get(visible) ?? nodeMap.nodes.get(`_${visible}`);
		if (child === undefined || child.rawFactoryName === undefined) continue;
		if (!isEmitted(child.kind) || claimedKinds.has(child.kind)) continue;
		const name = lowerCamelCase(variantChild.name);
		if (claimedNames.has(name)) continue;
		aliases.push({ name, child });
	}
	return aliases;
}

export function isNamespaceArm(sub: SubFactory): boolean {
	return sub.arm.via === 'node' && sub.arm.path.length === 0 && sub.arm.child instanceof AssembledSupertype && sub.arm.child.defaultVariantSubtype === undefined;
}

export interface ArmRouteSet {
	readonly parentKey: string;
	readonly node: AssembledNode;
	readonly candidates: readonly SubFactory[];
	readonly subs: readonly SubFactory[];
	readonly aliases: readonly AliasWire[];
	readonly diagnostics: readonly SubFactoryDiagnostic[];
	readonly mismatched: readonly SubFactory[];
}

export interface ArmRoutes {
	readonly kindEntries: readonly KindEnumEntry[] | undefined;
	readonly isEmitted: (kind: string) => boolean;
	readonly keyByKind: ReadonlyMap<string, string>;
	readonly bundledKinds: ReadonlySet<string>;
	readonly flattened: ReadonlyMap<string, FlattenedVariantParent>;
	readonly byKind: ReadonlyMap<string, ArmRouteSet>;
}

export function armRoutesOf(nodeMap: NodeMap): ArmRoutes {
	return irSurfaceOf(nodeMap).armRoutes;
}

function deriveArmRoutes(
	nodeMap: NodeMap,
	kindEntries: KindEntries,
	bundles: readonly IrKeyedNode[],
	flattenedParents: readonly FlattenedVariantParent[]
): ArmRoutes {
	const isEmitted = (kind: string): boolean => {
		const node = nodeMap.nodes.get(kind);
		return node !== undefined && classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) === 'emit';
	};
	const keyByKind = new Map(bundles.map((e) => [e.node.kind, e.exportName]));
	const bundledKinds = new Set(keyByKind.keys());
	for (const [kind, node] of nodeMap.nodes) {
		if (!isHoistedCompound(node) || node.factoryName === undefined || !isValidIdent(node.factoryName)) continue;
		if (node.rawFactoryName === undefined || !isEmitted(kind) || keyByKind.has(kind)) continue;
		keyByKind.set(kind, node.factoryName);
	}
	const flattened = new Map(flattenedParents.map((parent) => [parent.node.kind, parent]));
	for (const { key, node } of flattened.values()) if (!keyByKind.has(node.kind)) keyByKind.set(node.kind, key);

	const byKind = new Map<string, ArmRouteSet>();
	const seen = new Set<string>();
	const visiting = new Set<string>();
	const hasArms = (kind: string): ArmRouteSet | undefined => {
		const set = byKind.get(kind);
		return set !== undefined && (set.subs.length > 0 || set.aliases.length > 0) ? set : undefined;
	};

	const visit = (node: AssembledNode): void => {
		if (seen.has(node.kind) || visiting.has(node.kind)) return;
		const parentKey = keyByKind.get(node.kind);
		if (parentKey === undefined) {
			seen.add(node.kind);
			return;
		}
		const set = subFactoriesOf(node, nodeMap, { isEmitted });
		visiting.add(node.kind);
		for (const sub of set.entries) {
			if (sub.arm.via === 'node') visit(sub.arm.child);
		}
		visiting.delete(node.kind);
		const mismatched: SubFactory[] = [];
		const subs = set.entries.filter((sub) => {
			if (sub.arm.via === 'value') return true;
			if (sub.arm.path.length > 0) {
				const emitted = hasArms(sub.arm.child.kind);
				const step = sub.arm.path[0]!;
				const child = sub.arm.child;
				const present =
					emitted !== undefined
						? emitted.subs.some((e) => e.name === step) || emitted.aliases.some((a) => a.name === step)
						: child instanceof AssembledSupertype && variantArmsOf(child).some((arm) => arm.name === step);
				if (!present) {
					mismatched.push(sub);
					return false;
				}
				return keyByKind.has(child.kind);
			}
			return true;
		});
		const aliases = variantAliasWires(node, nodeMap, isEmitted, subs);
		visiting.add(node.kind);
		for (const alias of aliases) visit(alias.child);
		visiting.delete(node.kind);
		byKind.set(node.kind, { parentKey, node, candidates: set.entries, subs, aliases, diagnostics: set.diagnostics, mismatched });
		seen.add(node.kind);
	};

	for (const node of nodeMap.nodes.values()) visit(node);
	return { kindEntries, isEmitted, keyByKind, bundledKinds, flattened, byKind };
}

export interface IrMember {
	readonly key: string;
	readonly node: AssembledNode;
	readonly factory: string;
}

export interface IrGroup {
	readonly key: string;
	readonly node: AssembledSupertype;
	readonly members: readonly IrMember[];
}

export interface IrVariantParent {
	readonly key: string;
	readonly node: AssembledSupertype;
}

export interface IrPlan {
	readonly groups: readonly IrGroup[];
	readonly variantParents: readonly IrVariantParent[];
	readonly bundles: readonly IrMember[];
	readonly keywords: readonly IrMember[];
	readonly ownText: readonly IrMember[];
	readonly patterns: readonly IrMember[];
}

export function irPlanOf(nodeMap: NodeMap): IrPlan {
	return irSurfaceOf(nodeMap).plan;
}

export function memberKeyFor(memberKind: string, supertypeKind: string): string {
	return lowerCamelCase(supertypeMemberName(memberKind, supertypeKind));
}

function deriveIrPlan(
	nodeMap: NodeMap,
	kindEntries: KindEntries,
	bundles: readonly IrKeyedNode[],
	ownText: readonly IrKeyedNode[],
	flattenedParents: readonly FlattenedVariantParent[]
): IrPlan {
	const bundleKeyByKind = new Map(bundles.map((e) => [e.node.kind, e.exportName]));
	const flatKeys = new Set([...bundles, ...ownText].map((entry) => entry.key));
	for (const [kind, node] of nodeMap.nodes) if (isFlatLeafOrKeyword(kind, node, kindEntries)) flatKeys.add(node.irKey!);
	const flattenedKinds = new Set(flattenedParents.map((parent) => parent.node.kind));
	const flattenedKeyByKind = new Map(flattenedParents.map((parent) => [parent.node.kind, parent.key] as const));
	const usedGroupNames = new Set<string>();

	const groups: IrGroup[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (!isDeclaredSupertype(node) || flattenedKinds.has(kind)) continue;
		const groupName = node.irKey;
		if (groupName === undefined || !isValidIdent(groupName) || usedGroupNames.has(groupName)) continue;
		const members: IrMember[] = [];
		const usedMemberKeys = new Set<string>();
		for (const subKind of node.subtypeNames) {
			const sub = nodeMap.nodes.get(subKind);
			if (!sub) continue;
			if (isSurfaceHiddenIn(subKind, nodeMap) && !isBuilderTextLeaf(sub)) continue;
			const flattenedKey = flattenedKeyByKind.get(subKind);
			if (flattenedKey !== undefined) {
				const memberKey = memberKeyFor(subKind, kind);
				if (!isValidIdent(memberKey) || usedMemberKeys.has(memberKey)) continue;
				usedMemberKeys.add(memberKey);
				members.push({ key: memberKey, node: sub, factory: flattenedKey });
				continue;
			}
			if (sub.factoryInline) continue;
			if (!sub.rawFactoryName) continue;
			if (sub instanceof AssembledSupertype || isBuilderlessPunctuationLeaf(sub)) continue;
			if ((sub instanceof AbstractAssembledCompound || sub instanceof AssembledList) && !hasOneSurface(sub) && !bundleKeyByKind.has(subKind))
				continue;
			if (kindEntries && !hasCatalogEntry(kindEntries, subKind)) continue;
			const memberKey = memberKeyFor(subKind, kind);
			if (!isValidIdent(memberKey) || usedMemberKeys.has(memberKey)) continue;
			usedMemberKeys.add(memberKey);
			if (hasOneSurface(sub)) {
				members.push({ key: memberKey, node: sub, factory: sub.rawFactoryName });
			} else if (sub instanceof AbstractAssembledCompound || sub instanceof AssembledList) {
				if (!sub.fromFunctionName) continue;
				const bundleKey = bundleKeyByKind.get(subKind);
				if (bundleKey === undefined) {
					throw new Error(`[ir] no bundle entry for kind '${subKind}' — flat/group emission and bundleEntries disagree`);
				}
				members.push({ key: memberKey, node: sub, factory: bundleKey });
			}
		}
		if (members.length === 0) continue;
		usedGroupNames.add(groupName);
		if (flatKeys.has(groupName)) {
			throw new Error(`ir: the supertype group '${groupName}' shares its key with a flat factory`);
		}
		groups.push({ key: groupName, node, members });
	}

	const variantParents: IrVariantParent[] = [];
	for (const { key, node } of flattenedParents) {
		if (!usedGroupNames.has(key)) variantParents.push({ key, node });
	}

	const flat = (entries: readonly IrKeyedNode[], factory: (entry: IrKeyedNode) => string): IrMember[] =>
		entries.filter((entry) => !usedGroupNames.has(entry.key)).map((entry) => ({ key: entry.key, node: entry.node, factory: factory(entry) }));
	const leaves = (admits: (node: AssembledNode) => boolean): IrMember[] => {
		const out: IrMember[] = [];
		for (const [kind, node] of nodeMap.nodes) {
			if (!admits(node) || !hasFlatEntry(kind, node, kindEntries)) continue;
			if (usedGroupNames.has(node.irKey!)) continue;
			out.push({ key: node.irKey!, node, factory: node.rawFactoryName! });
		}
		return out;
	};
	return {
		groups,
		variantParents,
		bundles: flat(bundles, (entry) => entry.exportName),
		keywords: leaves(isBuilderTextLeaf),
		ownText: flat(ownText, (entry) => entry.node.rawFactoryName!),
		patterns: leaves((node) => node instanceof AssembledPattern)
	};
}

export interface IrSurface {
	readonly bundles: readonly IrKeyedNode[];
	readonly ownText: readonly IrKeyedNode[];
	readonly flattened: readonly FlattenedVariantParent[];
	readonly armRoutes: ArmRoutes;
	readonly plan: IrPlan;
}

export function stampIrSurface(nodeMap: NodeMap, generatedIdTables?: GeneratedIdTables): void {
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;
	const keyed = irKeyedNodes(nodeMap, kindEntries);
	const bundles = keyed.filter((entry) => !hasOneSurface(entry.node));
	const ownText = keyed.filter((entry) => hasOneSurface(entry.node));
	const flattened = deriveFlattenedVariantParents(nodeMap, kindEntries, bundles);
	const armRoutes = deriveArmRoutes(nodeMap, kindEntries, bundles, flattened);
	const plan = deriveIrPlan(nodeMap, kindEntries, bundles, ownText, flattened);
	nodeMap.irSurface = { bundles, ownText, flattened, armRoutes, plan };
	const exported = exportedNodesOf(plan);
	for (const node of nodeMap.nodes.values()) if (!exported.has(node)) node.irKey = undefined;
	resolveBuilderPaths(nodeMap.name, nodeMap.nodes.values(), ownerRoutesOf(nodeMap, flattened, armRoutes, plan));
}

function exportedNodesOf(plan: IrPlan): ReadonlySet<AssembledNode> {
	return new Set<AssembledNode>([
		...plan.groups.map((group) => group.node),
		...plan.variantParents.map((parent) => parent.node),
		...[plan.bundles, plan.keywords, plan.ownText, plan.patterns].flatMap((members) => members.map((member) => member.node))
	]);
}

export interface OwnerRoute {
	readonly parent: AssembledNode;
	readonly name: string;
}
export interface OwnerRoutes {
	readonly all: ReadonlyMap<string, readonly OwnerRoute[]>;
	readonly declared: ReadonlyMap<string, readonly OwnerRoute[]>;
	readonly contained: ReadonlyMap<string, OwnerRoute>;
	readonly grouped: ReadonlyMap<string, OwnerRoute>;
}
function ownerRoutesOf(nodeMap: NodeMap, flattened: readonly FlattenedVariantParent[], armRoutes: ArmRoutes, plan: IrPlan): OwnerRoutes {
	const containers = containersOf(nodeMap);
	const all = new Map<string, OwnerRoute[]>();
	const declared = new Map<string, OwnerRoute[]>();
	const contained = new Map<string, OwnerRoute[]>();
	const grouped = new Map<string, OwnerRoute[]>();
	const aliased = new Map<string, OwnerRoute[]>();
	const offer = (into: Map<string, OwnerRoute[]>, child: AssembledNode, route: OwnerRoute): void => {
		into.set(child.kind, [...(into.get(child.kind) ?? []), route]);
	};
	const offerArm = (child: AssembledNode, route: OwnerRoute, declares: boolean): void => {
		if (!child.seated) return;
		if (declares) offer(declared, child, route);
		if (isSoleContainer(containers, route.parent.kind, child.kind)) offer(contained, child, route);
	};
	for (const parent of flattened) {
		for (const route of parent.variants) offer(declared, route.child, { parent: parent.node, name: route.name });
	}
	for (const set of armRoutes.byKind.values()) {
		for (const sub of set.subs) {
			if (sub.arm.via !== 'node' || sub.arm.path.length > 0 || isNamespaceArm(sub)) continue;
			offerArm(sub.arm.child, { parent: set.node, name: sub.name }, sub.arm.variantOf === set.node.kind);
		}
		for (const alias of set.aliases) {
			offer(aliased, alias.child, { parent: set.node, name: alias.name });
			offerArm(alias.child, { parent: set.node, name: alias.name }, true);
		}
	}
	for (const group of plan.groups) {
		for (const member of group.members) offer(grouped, member.node, { parent: group.node, name: member.key });
	}
	const order = new Map([...nodeMap.nodes.keys()].map((kind, index) => [kind, index]));
	const byDeclaration = (a: OwnerRoute, b: OwnerRoute): number => order.get(a.parent.kind)! - order.get(b.parent.kind)!;
	const sorted = (routes: ReadonlyMap<string, readonly OwnerRoute[]>): ReadonlyMap<string, readonly OwnerRoute[]> =>
		new Map([...routes].map(([kind, list]) => [kind, [...list].sort(byDeclaration)]));
	const sole = soleRoutes(contained);
	for (const [kind, routes] of declared) all.set(kind, [...routes]);
	for (const [kind, route] of sole) all.set(kind, [...(all.get(kind) ?? []), route]);
	for (const [kind, routes] of aliased) all.set(kind, [...(all.get(kind) ?? []), ...routes]);
	for (const [kind, routes] of grouped) all.set(kind, [...(all.get(kind) ?? []), ...routes]);
	return { all: sorted(all), declared: sorted(declared), contained: sole, grouped: soleRoutes(grouped) };
}
function soleRoutes(candidates: ReadonlyMap<string, readonly OwnerRoute[]>): ReadonlyMap<string, OwnerRoute> {
	return new Map([...candidates].flatMap(([kind, routes]) => (routes.length === 1 ? [[kind, routes[0]!] as const] : [])));
}
function isSoleContainer(containers: ReadonlyMap<string, ReadonlySet<string>>, parent: string, child: string): boolean {
	const set = containers.get(child);
	return set?.size === 1 && set.has(parent);
}

export function resolveBuilderPaths(grammar: string, nodes: Iterable<AssembledNode>, owners: OwnerRoutes): void {
	const resolved = new Map<string, readonly (readonly string[])[]>();
	const pathsOf = (node: AssembledNode, visiting: readonly string[]): readonly (readonly string[])[] => {
		const known = resolved.get(node.kind);
		if (known !== undefined) return known;
		if (visiting.includes(node.kind)) {
			throw new Error(`ir surface: '${grammar}' has a cycle of owner routes (${[...visiting.slice(visiting.indexOf(node.kind)), node.kind].join(' → ')})`);
		}
		const own = node.irKey === undefined ? [] : [[node.irKey]];
		const routed = (owners.all.get(node.kind) ?? []).flatMap((route) => pathsOf(route.parent, [...visiting, node.kind]).map((path) => [...path, route.name]));
		const paths = [...own, ...routed];
		resolved.set(node.kind, paths);
		return paths;
	};
	const through = (route: OwnerRoute | undefined): readonly string[] | undefined => {
		if (route === undefined) return undefined;
		const base = primaryOf(route.parent);
		return base === undefined ? undefined : [...base, route.name];
	};
	const primaries = new Map<string, readonly string[] | undefined>();
	const primaryOf = (node: AssembledNode): readonly string[] | undefined => {
		if (primaries.has(node.kind)) return primaries.get(node.kind);
		const declared = (owners.declared.get(node.kind) ?? []).map(through).find((path) => path !== undefined);
		const primary =
			(node.irKey === undefined ? undefined : [node.irKey]) ??
			declared ??
			through(owners.contained.get(node.kind)) ??
			(node.seated ? through(owners.grouped.get(node.kind)) : undefined);
		primaries.set(node.kind, primary);
		return primary;
	};
	for (const node of nodes) {
		const all = pathsOf(node, []);
		const path = primaryOf(node);
		const spelled = new Set(path === undefined ? [] : [path.join('.')]);
		const alternates = all.filter((candidate) => {
			const key = candidate.join('.');
			if (spelled.has(key)) return false;
			spelled.add(key);
			return true;
		});
		node.builderPath = path;
		node.builderPathAlternates = alternates.length > 0 ? alternates : undefined;
	}
}

export function irSurfaceOf(nodeMap: NodeMap): IrSurface {
	const surface = nodeMap.irSurface;
	if (surface === undefined) throw new Error(`ir surface: '${nodeMap.name}' was not stamped (compileGrammar stamps it once slot refs are hydrated)`);
	return surface;
}
