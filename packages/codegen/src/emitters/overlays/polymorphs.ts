import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { AbstractAssembledCompound, AssembledList, AssembledSupertype, isRequired, separatorRequired, type AssembledNode } from '../../compiler/model/node-map.ts';
import {
	classifyFactoryEmission,
	classifyFromEmission,
	isValidIdent,
	resolveDirectFactorySlot,
	resolveFieldStorageInfo,
	classifyFactoryShape,
	listRestParamType,
	withEmptyOverload
} from '../shared.ts';
import { emptyForms } from '../../compiler/model/trivia.ts';
import { keywordLeafArity } from '../from.ts';
import { builtTypeSurfaceOf, listHasOptions, spellingTypeOf, valueStorageExpr } from '../factories.ts';
import { collectCatalogKinds, collectKindEntries, kindDiscriminantExpr, type KindEnumEntry } from '../kind-discriminant.ts';
import {
	armConfigKeys,
	seatsConfigChild,
	configKeysOf,
	elementsSeatOf,
	flattenSeatOf,
	tupleSeatOf,
	subFactoriesOf,
	variantArmsOf,
	type FlattenSeat,
	type SubFactory
} from './sub-factories.ts';
import { bundleEntries, bundleExpr, flattenedVariantParents, overlayFrame, overlayImportPath, type FlattenedVariantParent } from './module.ts';
import { lowerCamelCase } from '../../compiler/model/casing.ts';

interface FlavorRefs {
	readonly strict: string;
	readonly coerce?: string;
	readonly set?: string;
	readonly max?: number;
}

type CoerceEmitted = (node: AssembledNode) => boolean;

function isHoistedCompound(node: AssembledNode): boolean {
	return (
		node instanceof AbstractAssembledCompound && !(node instanceof AssembledList) && node.annotations?.hoisted === true
	);
}

function parentRefs(node: AssembledNode, coerceEmitted: CoerceEmitted): FlavorRefs {
	return {
		strict: `F.${node.rawFactoryName}`,
		coerce: coerceEmitted(node) ? `C.${node.fromFunctionName}` : undefined
	};
}

function childRefs(
	sub: SubFactory,
	keyByKind: ReadonlyMap<string, string>,
	coerceEmitted: CoerceEmitted,
	seated?: (kind: string) => boolean,
	wires?: PolymorphWires
): FlavorRefs | undefined {
	if (sub.arm.via !== 'node') return undefined;
	const { child, path } = sub.arm;
	if (path.length > 0) {
		const childKey = keyByKind.get(child.kind);
		if (childKey === undefined) return undefined;
		const spelled = wires === undefined ? [...path] : emittedArmPath(child.kind, path, wires);
		const base = `${childKey}.${spelled.join('.')}`;
		return { strict: `${base}.strict`, coerce: `${base}.coerce`, set: child.kind, ...(wires === undefined ? {} : maxOf(routeArity(base, wires))) };
	}
	const childKey = keyByKind.get(child.kind);
	if (childKey !== undefined && (child instanceof AssembledSupertype || seated?.(child.kind) === true)) {
		return { strict: `${childKey}.strict`, coerce: `${childKey}.coerce`, set: child.kind, ...(wires === undefined ? {} : maxOf(entryArity(child.kind, wires))) };
	}
	const strict = `F.${child.rawFactoryName}`;
	return { strict, coerce: coerceEmitted(child) ? `C.${child.fromFunctionName}` : strict, ...(wires === undefined ? {} : maxOf(surfaceArity(child, wires))) };
}

function maxOf(max: number | undefined): { readonly max?: number } {
	return max === undefined ? {} : { max };
}

function surfaceArity(node: AssembledNode, wires: PolymorphWires): number | undefined {
	return builtTypeSurfaceOf(node, wires.nodeMap, wires.kindEntries)?.maxArgs ?? keywordLeafArity(node);
}

function routeArity(path: string, wires: PolymorphWires): number | undefined {
	if (wires.routes.has(path)) return wires.routes.get(path);
	const [key, name, ...rest] = path.split('.');
	const parent = [...wires.flattened.values()].find((candidate) => candidate.key === key);
	const variant = parent?.variants.find((route) => route.name === name && route.leaf !== true);
	if (variant === undefined) throw new Error(`[codegen] polymorph route ${path} is referenced before its arity is stamped`);
	if (rest.length === 0) return entryArity(variant.child.kind, wires);
	const childKey = variant.nestedParentKey ?? wires.keyByKind.get(variant.child.kind);
	if (childKey === undefined) throw new Error(`[codegen] polymorph route ${path} reaches ${variant.child.kind}, which has no entry`);
	return routeArity([childKey, ...rest].join('.'), wires);
}

function entryArity(kind: string, wires: PolymorphWires): number | undefined {
	const flattened = wires.flattened.get(kind);
	if (flattened !== undefined) {
		const route = flattened.variants.find((variant) => variant.default === true && variant.leaf !== true);
		if (route === undefined) return undefined;
		return entryArity(route.child.kind, wires);
	}
	const set = wires.byKind.get(kind);
	const node = wires.nodeMap.nodes.get(kind);
	if (node === undefined) return undefined;
	const seated = set === undefined ? undefined : seatedArity(set, wires);
	return seated !== undefined && (seated.coercible || isHoistedCompound(node)) ? seated.max : surfaceArity(node, wires);
}

interface VariantRoute {
	readonly set?: string;
	readonly value: string;
	readonly type: string;
	readonly strict: string;
	readonly coerce?: string;
	readonly max?: number;
}

export interface AliasWire {
	readonly name: string;
	readonly child: AssembledNode;
}

function variantAliasWires(
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

export interface PolymorphWireSet {
	readonly parentKey: string;
	readonly node: AssembledNode;
	readonly subs: readonly SubFactory[];
	readonly aliases: readonly AliasWire[];
	readonly flatten?: FlattenSeat;
	readonly elements?: readonly FlattenSeat[];
	readonly tuples?: readonly FlattenSeat[];
}

export interface PolymorphWires {
	readonly order: readonly string[];
	readonly byKind: ReadonlyMap<string, PolymorphWireSet>;
	readonly kindEntries: readonly KindEnumEntry[] | undefined;
	readonly isEmitted: (kind: string) => boolean;
	readonly coerceEmitted: CoerceEmitted;
	readonly keyByKind: ReadonlyMap<string, string>;
	readonly bundledKinds: ReadonlySet<string>;
	readonly nodeMap: NodeMap;
	readonly flattened: ReadonlyMap<string, FlattenedVariantParent>;
	readonly routes: Map<string, number | undefined>;
}

export function collectPolymorphWires(
	nodeMap: NodeMap,
	generatedIdTables?: GeneratedIdTables,
	options: { silent?: boolean } = {}
): PolymorphWires {
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;
	const isEmitted = (kind: string): boolean => {
		const node = nodeMap.nodes.get(kind);
		return node !== undefined && classifyFactoryEmission(kind, node, { nodeMap, kindEntries }) === 'emit';
	};
	const coerceEmitted: CoerceEmitted = (node) =>
		node.fromFunctionName !== undefined && classifyFromEmission(node.kind, node, { nodeMap, kindEntries }) === 'emit';
	const keyByKind = new Map(bundleEntries(nodeMap, generatedIdTables).map((e) => [e.node.kind, e.exportName]));
	const bundledKinds = new Set(keyByKind.keys());
	for (const [kind, node] of nodeMap.nodes) {
		if (!isHoistedCompound(node) || node.factoryName === undefined || !isValidIdent(node.factoryName)) continue;
		if (node.rawFactoryName === undefined || !isEmitted(kind) || keyByKind.has(kind)) continue;
		keyByKind.set(kind, node.factoryName);
	}
	const flattened = new Map(flattenedVariantParents(nodeMap, generatedIdTables).map((parent) => [parent.node.kind, parent]));
	for (const { key, node } of flattened.values()) if (!keyByKind.has(node.kind)) keyByKind.set(node.kind, key);
	const warn = options.silent ? () => {} : (message: string) => console.warn(message);

	const order: string[] = [];
	const byKind = new Map<string, PolymorphWireSet>();
	const seen = new Set<string>();
	const visiting = new Set<string>();

	function visit(node: AssembledNode): void {
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
		for (const d of set.diagnostics) {
			warn(
				d.reason === 'shared-key'
					? `[codegen] ${node.kind}: sub-factory ${d.name} seated, not merged (${d.reason}: ${(d.keys ?? []).join(', ')}): ${d.claimants.join(', ')}`
					: `[codegen] ${node.kind}: sub-factory ${d.name} skipped (${d.reason}): ${d.claimants.join(', ')}`
			);
		}
		const subs = set.entries.filter((sub) => {
			if (sub.arm.via === 'value') return true;
			if (sub.arm.path.length > 0) {
				const emitted = byKind.get(sub.arm.child.kind);
				const step = sub.arm.path[0]!;
				const child = sub.arm.child;
				const present =
					emitted !== undefined
						? emitted.subs.some((e) => e.name === step) || emitted.aliases.some((a) => a.name === step)
						: child instanceof AssembledSupertype && variantArmsOf(child).some((arm) => arm.name === step);
				if (!present) {
					warn(
						`[codegen] ${node.kind}: sub-factory ${sub.name} skipped (context-mismatch): ${sub.arm.child.kind}.${sub.arm.path.join('.')}`
					);
					return false;
				}
			}
			return childRefs(sub, keyByKind, coerceEmitted) !== undefined;
		});
		const aliases = variantAliasWires(node, nodeMap, isEmitted, subs);
		const seat = flattenSeatOf(node, nodeMap);
		const flatten = seat !== undefined && isEmitted(seat.group.kind) ? seat : undefined;
		const elements = elementsSeatOf(node, nodeMap).filter((e) => isEmitted(e.group.kind));
		const claimed = new Set(subs.map((sub) => sub.slot));
		const tuples = tupleSeatOf(node, nodeMap).filter((e) => isEmitted(e.group.kind) && !claimed.has(e.slot));
		visiting.add(node.kind);
		for (const s of [...(flatten ? [flatten] : []), ...elements, ...tuples]) visit(s.group);
		for (const alias of aliases) visit(alias.child);
		visiting.delete(node.kind);
		if (subs.length > 0 || aliases.length > 0 || flatten !== undefined || elements.length > 0 || tuples.length > 0) {
			order.push(node.kind);
			byKind.set(node.kind, {
				parentKey,
				node,
				subs,
				aliases,
				...(flatten ? { flatten } : {}),
				...(elements.length > 0 ? { elements } : {}),
				...(tuples.length > 0 ? { tuples } : {})
			});
		}
		seen.add(node.kind);
	}

	for (const node of nodeMap.nodes.values()) visit(node);
	return { order, byKind, kindEntries, isEmitted, coerceEmitted, keyByKind, bundledKinds, nodeMap, flattened, routes: new Map() };
}

interface OverlayChunk {
	readonly kind: string;
	readonly isPrivate: boolean;
	readonly lines: readonly string[];
	readonly uses: ReadonlySet<string>;
	readonly hasMethods: boolean;
}

function withoutUnusedPrivateSets(chunks: readonly OverlayChunk[]): OverlayChunk[] {
	let kept = [...chunks];
	for (;;) {
		const used = new Set(kept.flatMap((chunk) => [...chunk.uses].filter((kind) => kind !== chunk.kind)));
		const next = kept.filter((chunk) => !chunk.isPrivate || used.has(chunk.kind));
		if (next.length === kept.length) return kept;
		kept = next;
	}
}

function inDependencyOrder(chunks: readonly OverlayChunk[]): OverlayChunk[] {
	const provided = new Set(chunks.map((chunk) => chunk.kind));
	const placed = new Set<string>();
	const pending = [...chunks];
	const ordered: OverlayChunk[] = [];
	while (pending.length > 0) {
		const ready = pending.findIndex((chunk) => [...chunk.uses].every((kind) => kind === chunk.kind || !provided.has(kind) || placed.has(kind)));
		const [next] = pending.splice(ready === -1 ? 0 : ready, 1);
		placed.add(next!.kind);
		ordered.push(next!);
	}
	return ordered;
}

function seatBearing(wires: PolymorphWires, kind: string, parentKind: string): boolean {
	const set = wires.byKind.get(kind);
	if (set === undefined) return false;
	if (set.flatten === undefined && (set.elements ?? []).length === 0 && (set.tuples ?? []).length === 0) return false;
	const at = wires.order.indexOf(kind);
	return at !== -1 && at < wires.order.indexOf(parentKind);
}

interface ArmPair {
	readonly strict: string;
	readonly coerce?: string;
	readonly max?: number;
}

interface ArmEntry {
	readonly sub: SubFactory;
	readonly pair?: ArmPair;
	readonly type: string;
	readonly children: Map<string, ArmEntry>;
}

function isNamespaceArm(sub: SubFactory): boolean {
	return sub.arm.via === 'node' && sub.arm.path.length === 0 && sub.arm.child instanceof AssembledSupertype && sub.arm.child.defaultVariantSubtype === undefined;
}

function pairExpr(pair: ArmPair, path: string, routes: Map<string, number | undefined>): string {
	routes.set(path, pair.max);
	return bundleExpr(pair.strict, pair.coerce, path, pair.max);
}

function armPair(emission: SubEmission, methods: string[]): ArmPair {
	const strict = `${emission.name}$strict`;
	methods.push(`const ${strict} = ${emission.strictApply};`);
	if (emission.coerceApply === undefined) return { strict, ...maxOf(emission.max) };
	const coerce = `${emission.name}$coerce`;
	methods.push(`const ${coerce} = ${emission.coerceApply};`);
	return { strict, coerce, ...maxOf(emission.max) };
}

function armType(emission: SubEmission): string {
	return emission.coerceType === undefined
		? `strict: ${emission.strictType}`
		: `strict: ${emission.strictType}; coerce: ${emission.coerceType}`;
}

function renderArm(name: string, entry: ArmEntry, path: string, routes: Map<string, number | undefined>): { line: string; type: string } {
	const typeParts = entry.type === '' ? [] : [entry.type];
	if (entry.pair !== undefined && entry.children.size === 0) {
		return { line: `${name}: ${pairExpr(entry.pair, path, routes)}`, type: `${name}: { ${typeParts.join('; ')} }` };
	}
	const parts = entry.pair === undefined ? [] : [`...${pairExpr(entry.pair, path, routes)}`];
	for (const [key, child] of entry.children) {
		const rendered = renderArm(key, child, `${path}.${key}`, routes);
		parts.push(rendered.line);
		typeParts.push(rendered.type);
	}
	return { line: `${name}: { ${parts.join(', ')} }`, type: `${name}: { ${typeParts.join('; ')} }` };
}

function walkArms(entries: ReadonlyMap<string, ArmEntry>): ArmEntry[] {
	const out: ArmEntry[] = [];
	for (const entry of entries.values()) {
		out.push(entry, ...walkArms(entry.children));
	}
	return out;
}

function composeAcrossSlots(
	wireSet: PolymorphWireSet,
	wires: PolymorphWires,
	nodeMap: NodeMap,
	seated: FlavorRefs | undefined,
	armEntries: Map<string, ArmEntry>,
	methods: string[],
	chainsByArm: Map<string, string[]>,
	uses: Set<string>
): void {
	const slots = wireSet.node instanceof AbstractAssembledCompound ? wireSet.node.slots : [];
	const indexOf = (sub: SubFactory): number => slots.indexOf(sub.slot);
	const bySlot = new Set(wireSet.subs.map(indexOf));
	if (bySlot.size < 2) return;
	for (const host of walkArms(armEntries)) {
		const outer = host.sub;
		const applied = emitSub(wireSet.node, wireSet.parentKey, outer, wires, nodeMap, seated);
		if (applied === undefined || applied.coerceApply === undefined || applied.coerceType === undefined) continue;
		const strictName = `${methodName(wireSet.parentKey, outer.name)}$applied`;
		const coerceName = `${strictName}Coerce`;
		let named = false;
		for (const inner of wireSet.subs) {
			if (indexOf(inner) <= indexOf(outer)) continue;
			const chained = emitSub(
				wireSet.node,
				wireSet.parentKey,
				inner,
				wires,
				nodeMap,
				{ strict: strictName, coerce: coerceName },
				`${outer.name}$${inner.name}`
			);
			if (chained === undefined || chained.coerceApply === undefined || chained.coerceType === undefined) continue;
			if (host.children.has(inner.name)) continue;
			if (!named) {
				if (applied.set !== undefined) uses.add(applied.set);
				methods.push(`const ${strictName}: ${applied.strictType} = ${applied.strictApply};`);
				methods.push(`const ${coerceName}: ${applied.coerceType} = ${applied.coerceApply};`);
				named = true;
			}
			methods.push(...chained.method);
			if (chained.set !== undefined) uses.add(chained.set);
			chainsByArm.set(outer.name, [...(chainsByArm.get(outer.name) ?? []), inner.name]);
			host.children.set(inner.name, { sub: inner, pair: armPair(chained, methods), type: armType(chained), children: new Map() });
		}
	}
}

interface SeatedParent {
	readonly refs: FlavorRefs;
	readonly wireLine: string;
	readonly wireType: string;
}

function composeSeats(
	seats: readonly SeatEmission[],
	wireSet: PolymorphWireSet,
	wires: PolymorphWires,
	nodeMap: NodeMap,
	methods: string[]
): SeatedParent | undefined {
	if (seats.length === 0) return undefined;
	const p = parentRefs(wireSet.node, wires.coerceEmitted);
	const spread = seats.some((seat) => seat.spread);
	let strictExpr = p.strict;
	let strictParam = spread ? `ElementsOf<typeof ${p.strict}>` : `ArgsOf<typeof ${p.strict}>[0]`;
	let strictParams = '';
	let coerceExpr = p.coerce;
	let coerceParam = p.coerce ? (spread ? `ElementsOf<typeof ${p.coerce}>` : `ArgsOf<typeof ${p.coerce}>[0]`) : undefined;
	let coerceParams = '';
	const inner = (params: string): string => params.slice(params.indexOf(': ') + 2, -1);
	for (const seat of seats) {
		methods.push(...seat.method);
		strictParams = seat.paramFor(strictParam, seat.child.strict);
		strictParam = inner(strictParams);
		strictExpr = seat.apply(strictExpr, seat.child.strict);
		if (coerceExpr !== undefined && coerceParam !== undefined && seat.child.coerce !== undefined) {
			coerceParams = seat.paramFor(coerceParam, seat.child.coerce);
			coerceParam = inner(coerceParams);
			coerceExpr = seat.apply(coerceExpr, seat.child.coerce);
		} else {
			coerceExpr = undefined;
			coerceParam = undefined;
		}
	}
	const optionsType = seatedOptionsType(wireSet, wires, spread);
	const withOptions = (params: string): string =>
		optionsType === undefined ? params : `${params.slice(0, -1)}, options?: ${optionsType})`;
	const seated = (name: string, params: string, returnType: string, expr: string): string[] =>
		emptyForms(nodeMap).has(wireSet.node.kind)
			? withEmptyOverload(
					nodeMap,
					wireSet.node.kind,
					`function ${name}`,
					[`function ${name}(...args: [${params.slice(1, -1).replace(/^(\w+):/, '$1?:')}]): ${returnType} {`, `	return ${expr}(...args);`, '}'],
					`function ${name}${params}: ${returnType};`
				)
			: [`const ${name}: ${params} => ${returnType} = ${expr};`];
	const strictName = `${wireSet.parentKey}$seated`;
	methods.push(...seated(strictName, withOptions(strictParams), `ReturnType<typeof ${p.strict}>`, strictExpr));
	const { max } = seatedArity(wireSet, wires)!;
	if (coerceExpr === undefined || p.coerce === undefined) {
		return {
			refs: { strict: strictName, coerce: undefined, ...maxOf(max) },
			wireLine: isHoistedCompound(wireSet.node)
				? `	...${bundleExpr(strictName, undefined, wireSet.parentKey, max)},`
				: `	strict: ${strictName},`,
			wireType: `	strict: typeof ${strictName};`
		};
	}
	const coerceName = `${wireSet.parentKey}$seatedCoerce`;
	methods.push(...seated(coerceName, withOptions(coerceParams), `ReturnType<typeof ${p.coerce}>`, coerceExpr));
	return {
		refs: { strict: strictName, coerce: coerceName, ...maxOf(max) },
		wireLine: `	...${bundleExpr(strictName, coerceName, wireSet.parentKey, max)},`,
		wireType: `	strict: typeof ${strictName}; coerce: typeof ${coerceName};`
	};
}

function seatedOptionsType(wireSet: PolymorphWireSet, wires: PolymorphWires, spread: boolean): string | undefined {
	return !spread && 'slots' in wireSet.node && spellingTypeOf(wireSet.node, wires.nodeMap, wires.kindEntries) !== undefined
		? `T.${wireSet.node.typeName}.Options`
		: undefined;
}

function seatsOf(wireSet: PolymorphWireSet, wires: PolymorphWires): SeatEmission[] {
	return [
		...(wireSet.flatten ? [seatEmission(wireSet.node, wireSet.parentKey, wireSet.flatten, 'flatten', wires, wires.nodeMap)] : []),
		...(wireSet.elements ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'elements', wires, wires.nodeMap)),
		...(wireSet.tuples ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'tuple', wires, wires.nodeMap))
	];
}

function seatedArity(wireSet: PolymorphWireSet, wires: PolymorphWires): { readonly max: number | undefined; readonly coercible: boolean } | undefined {
	const seats = seatsOf(wireSet, wires);
	if (seats.length === 0) return undefined;
	const spread = seats.some((seat) => seat.spread);
	return {
		max: spread ? undefined : seatedOptionsType(wireSet, wires, spread) === undefined ? 1 : 2,
		coercible: parentRefs(wireSet.node, wires.coerceEmitted).coerce !== undefined && seats.every((seat) => seat.child.coerce !== undefined)
	};
}

export function emittedArmPath(kind: string, path: readonly string[], wires: PolymorphWires): string[] {
	const set = wires.byKind.get(kind);
	const head = path[0];
	if (set === undefined || head === undefined) return [...path];
	const sub = set.subs.find((candidate) => candidate.name === head);
	if (sub === undefined) return [...path];
	const under = nestingArmOf(sub, set.subs, wires);
	const spelled = under === undefined ? [sub.name] : [under.host, ...under.keys];
	const rest = path.slice(1);
	if (rest.length === 0) return spelled;
	const next = sub.arm.via === 'node' ? sub.arm.child.kind : undefined;
	return next === undefined ? [...spelled, ...rest] : [...spelled, ...emittedArmPath(next, rest, wires)];
}

function nestingArmOf(sub: SubFactory, subs: readonly SubFactory[], wires: PolymorphWires): { host: string; keys: readonly string[] } | undefined {
	if (sub.arm.via !== 'node' || sub.arm.path.length === 0) return undefined;
	const child = sub.arm.child;
	const host = subs.find((d) => d.arm.via === 'node' && d.arm.path.length === 0 && d.arm.child === child);
	if (host === undefined) return undefined;
	const key = sub.arm.path[sub.arm.path.length - 1]!;
	const inner = wires.byKind.get(child.kind)?.subs.find((candidate) => candidate.name === key);
	if (inner !== undefined && inner.arm.via === 'node' && inner.arm.path.length > 0) {
		return { host: host.name, keys: emittedArmPath(child.kind, sub.arm.path, wires) };
	}
	const collides = subs.some(
		(other) =>
			other !== sub &&
			other.arm.via === 'node' &&
			other.arm.path.length > 0 &&
			other.arm.child === child &&
			other.arm.path[other.arm.path.length - 1] === key
	);
	return { host: host.name, keys: [collides ? sub.name : key] };
}

function childChains(sub: SubFactory, chainedByKind: ReadonlyMap<string, ReadonlyMap<string, readonly string[]>>): readonly string[] {
	if (sub.arm.via !== 'node' || sub.arm.path.length === 0) return [];
	return chainedByKind.get(sub.arm.child.kind)?.get(sub.arm.path[sub.arm.path.length - 1]!) ?? [];
}

function methodName(parentKey: string, subName: string): string {
	return `${parentKey}$${subName.replace(/[^A-Za-z0-9_$]/g, '_')}`;
}

const PF = 'PF extends (config: never) => unknown';
const PFV = 'PF extends (value: never) => unknown';
const CF = 'CF extends (...args: never[]) => unknown';
const CALL_P = '_p<ReturnType<PF>>(parent)';
const CALL_C = '_c(child)';
const CALL_PO = (arg: string): string => `_fwd<ReturnType<PF>>(parent, ${arg}, options)`;
const OPTS = 'options?: unknown';
const ERASED_HELPERS = [
	'// Erased applications, centralized: TS cannot infer a Cfg type parameter',
	'// constrained by another inference variable in a contravariant position,',
	'// so the pair below carries the one sanctioned dsl-bridging double cast;',
	'// every wire method routes through these two sites.',
	'const _p = <R,>(f: unknown) => f as (arg: unknown) => R;',
	'const _c = (f: unknown) => f as (...a: readonly unknown[]) => unknown;',
	'const _s = <R,>(f: unknown) => f as (...a: readonly unknown[]) => R;',
	"// A kind's Config is a declared interface, and those are not assignable",
	'// to an index signature — so reading or spreading one generically needs',
	'// an erasure. It lives here, once, rather than at every method that',
	'// merges or partitions a config.',
	'const _o = (config: unknown) => config as Record<string, unknown>;',
	'const _m = (config: unknown, extra: Record<string, unknown>): Record<string, unknown> =>',
	'\t({ ..._o(config), ...extra });',
	'const _built = (v: unknown): boolean => typeof v === \'object\' && v !== null && \'$type\' in v;',
	'// A seat forwards the parent\'s trailing options only when given: a',
	'// bare-text call must keep its one-argument arity.',
	'const _fwd = <R,>(f: unknown, arg: unknown, options: unknown): R =>',
	'\t(options === undefined ? _s<R>(f)(arg) : _s<R>(f)(arg, options));',
	''
];

const LIST_HELPER = [
	'type ListOptions = { readonly separator?: unknown; readonly delimiter?: unknown };',
	'type ListElement<P> = Exclude<P, ListOptions>;',
	'type ListOptionsOf<P> = Extract<P, ListOptions>;'
];

const FLATTEN_HELPER = [
	'// A flattened group is present as a whole or absent as a whole: the second',
	'// overload forbids every one of its keys.',
	'type NoneOf<T> = { [K in keyof T]?: never };'
];

interface WireShape {
	readonly method: readonly string[];
	readonly paramFor: (parentRef: string, childRef: string | undefined) => string;
	readonly max: number | 'child';
}

function shape(
	sub: SubFactory,
	k: string,
	positional: boolean,
	mergeKeys: readonly string[] | undefined,
	m: string,
	seatsConfig = false
): WireShape {
	const registered = sub.slot.registeredOption !== undefined;
	if (sub.arm.via === 'value') {
		if (sub.residual.length === 0) {
			return {
				method: positional
					? [
							`const ${m} = <${PFV}>(parent: PF, value: ArgsOf<PF>[0]) =>`,
							`	(options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(value as never, options as never);`
						]
					: registered
						? [
								`const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
								`	(options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(undefined as never, _m(options, { ${k}: value }) as never);`
							]
						: [
								`const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
								`	(options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)({ ${k}: value } as never, options as never);`
							],
				paramFor: (p) => `(options?: OptionsArg<typeof ${p}>)`,
				max: 1
			};
		}
		if (positional) {
			return {
				method: [
					`const ${m} = <${PFV}>(parent: PF, value: unknown) =>`,
					`	(arg: ArgsOf<PF>[0], options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(arg as never, _m(options, { ${k}: value }) as never);`
				],
				paramFor: (p) => `(arg: ArgsOf<typeof ${p}>[0], options?: OptionsArg<typeof ${p}>)`,
				max: 2
			};
		}
		return {
			method: [
				`const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
				registered
					? `	(config: OmitEach<ArgsOf<PF>[0], '${k}'>, options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(config as never, _m(options, { ${k}: value }) as never);`
					: `	(config: OmitEach<ArgsOf<PF>[0], '${k}'>, options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)({ ...config, ${k}: value } as never, options as never);`
			],
			paramFor: (p) => `(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'>, options?: OptionsArg<typeof ${p}>)`,
			max: 2
		};
	}
	if (sub.residual.length === 0) {
		return {
			method: positional
				? [
						`const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: ArgsOf<CF>): ReturnType<PF> => ${CALL_P}(${CALL_C}(...args));`
					]
				: [
						`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: ArgsOf<CF>): ReturnType<PF> => ${CALL_P}({ ${k}: ${CALL_C}(...args) });`
					],
			paramFor: (_p, c) => `(...args: ArgsOf<typeof ${c}>)`,
			max: 'child'
		};
	}
	if (mergeKeys !== undefined) {
		if (mergeKeys.length === 0) {
			return {
				method: [
					`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
					`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & ArgsOf<CF>[0], options?: OptionsArg<PF>): ReturnType<PF> =>`,
					`		_s<ReturnType<PF>>(parent)(_m(config, { ${k}: ${CALL_C}({}) }) as never, options as never);`
				],
				paramFor: (p, c) =>
					`(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & ArgsOf<typeof ${c}>[0], options?: OptionsArg<typeof ${p}>)`,
				max: 2
			};
		}
		const keyTests = mergeKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ');
		return {
			method: [
				`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & ArgsOf<CF>[0], options?: OptionsArg<PF>): ReturnType<PF> => {`,
				`		const rest: Record<string, unknown> = {};`,
				`		const inner: Record<string, unknown> = {};`,
				`		for (const [key, value] of Object.entries(_o(config))) {`,
				`			if (${keyTests}) inner[key] = value;`,
				`			else rest[key] = value;`,
				`		}`,
				`		return _s<ReturnType<PF>>(parent)({ ...rest, ${k}: ${CALL_C}(inner) } as never, options as never);`,
				`	};`
			],
			paramFor: (p, c) =>
				`(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & ArgsOf<typeof ${c}>[0], options?: OptionsArg<typeof ${p}>)`,
			max: 2
		};
	}
	if (sub.arm.child.parameterless) {
		const config = sub.residual.some(isRequired) ? 'config' : 'config?';
		return {
			method: [
				`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(${config}: OmitEach<ArgsOf<PF>[0], '${k}'>, options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)({ ...config, ${k}: ${CALL_C}() } as never, options as never);`
			],
			paramFor: (p) => `(${config}: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'>, options?: OptionsArg<typeof ${p}>)`
		};
	}
	if (seatsConfig) {
		return {
			method: [
				`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & { ${k}: ArgsOf<CF>[0] }, options?: OptionsArg<PF>): ReturnType<PF> => {`,
				`		const { ${k}: seated, ...rest } = config;`,
				`		return _s<ReturnType<PF>>(parent)({ ...rest, ${k}: ${CALL_C}(seated) } as never, options as never);`,
				`	};`
			],
			paramFor: (p, c) =>
				`(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & { ${k}: ArgsOf<typeof ${c}>[0] }, options?: OptionsArg<typeof ${p}>)`,
			max: 2
		};
	}
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
			`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & { ${k}: ArgsOf<CF> }, options?: OptionsArg<PF>): ReturnType<PF> => {`,
			`		const { ${k}: seated, ...rest } = config;`,
			`		return _s<ReturnType<PF>>(parent)({ ...rest, ${k}: ${CALL_C}(...seated) } as never, options as never);`,
			`	};`
		],
		paramFor: (p, c) =>
			`(config: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'> & { ${k}: ArgsOf<typeof ${c}> }, options?: OptionsArg<typeof ${p}>)`,
		max: 2
	};
}

interface SeatShape {
	readonly method: readonly string[];
	readonly paramFor: (parentParamType: string, childRef: string) => string;
	readonly spread?: true;
}

function flattenShape(
	k: string,
	mergeKeys: readonly string[],
	m: string,
	positional: boolean,
	directKey: string | undefined,
	wrapperSeat: boolean
): SeatShape {
	if (positional) {
		return {
			method: [
				`const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: ArgsOf<PF>[0] | ArgsOf<CF>[0], ${OPTS}): ReturnType<PF> =>`,
				`		config === undefined || _built(config) ? ${CALL_PO('config')} : ${CALL_PO(`${CALL_C}(config)`)};`
			],
			paramFor: (p, c) => `(config: ${p} | ArgsOf<typeof ${c}>[0])`
		};
	}
	const keyTests = mergeKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ');
	const groupConfig = (c: string): string =>
		directKey === undefined ? `ArgsOf<${c}>[0]` : `{ ${directKey}: ArgsOf<${c}>[0] }`;
	const flattened = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & (${groupConfig(c)} | NoneOf<${groupConfig(c)}>))`;
	const buildGroup = directKey === undefined ? `${CALL_C}(inner)` : `${CALL_C}(inner[${JSON.stringify(directKey)}])`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF${wrapperSeat ? ', wrapperId: number' : ''}) =>`,
			`	(config: ${flattened('ArgsOf<PF>[0]', 'CF')}, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
			...(wrapperSeat
				? [
						`		const own = _o(config)[${JSON.stringify(k)}];`,
						`		if (typeof own === 'object' && own !== null && !Array.isArray(own)) {`,
						`			const spelled = '$type' in own ? (own as { $type?: unknown }).$type === wrapperId : !('kind' in own) && Object.keys(own).every((key) => ${keyTests});`,
						`			if (spelled) return ${CALL_PO('config')};`,
						`		}`
					]
				: []),
			`		const rest: Record<string, unknown> = {};`,
			`		const inner: Record<string, unknown> = {};`,
			`		let seated = false;`,
			`		for (const [key, value] of Object.entries(_o(config))) {`,
			`			if (${keyTests}) {`,
			`				inner[key] = value;`,
			`				seated = seated || value !== undefined;`,
			`			} else rest[key] = value;`,
			`		}`,
			`		return ${CALL_PO(`seated ? { ...rest, ${k}: ${buildGroup} } : rest`)};`,
			`	};`
		],
		paramFor: (p, c) => `(config: ${flattened(p, `typeof ${c}`)})`
	};
}

const PFS = 'PF extends (...args: never[]) => unknown';

function configTest(keys: readonly string[]): string {
	const keyTests = keys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ') || 'false';
	return `(e: unknown): boolean => typeof e === 'object' && e !== null && !('$type' in e) && Object.keys(e).every((key) => ${keyTests})`;
}

function elementsShape(
	k: string,
	groupKeys: readonly string[],
	m: string,
	spread: boolean,
	list: { readonly nonEmpty: boolean; readonly options: boolean; readonly optionsRequired: boolean } | undefined
): SeatShape {
	if (spread) {
		return {
			method: [
				`const ${m} = <${PFS}, ${CF}>(parent: PF, child: CF) => {`,
				`	const isConfig = ${configTest(groupKeys)};`,
				`	return (...args: ReadonlyArray<ArgsOf<PF>[number] | ArgsOf<CF>[0] | undefined>): ReturnType<PF> =>`,
				`		_s<ReturnType<PF>>(parent)(...args.map((e) => (isConfig(e) ? ${CALL_C}(e) : e)));`,
				`};`
			],
			paramFor: (p, c) => {
				const child = `ArgsOf<typeof ${c}>[0]`;
				if (list === undefined) return `(...args: ReadonlyArray<${p} | ${child}>)`;
				const element = list.options ? `(ListElement<${p}> | ${child})` : `(${p} | ${child})`;
				return `(...args: ${listRestParamType(list.nonEmpty, element, list.options ? `ListOptionsOf<${p}>` : undefined, list.optionsRequired)})`;
			},
			spread: true
		};
	}
	const seated = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & { ${k}: ReadonlyArray<ArgsOf<${c}>[0] | (NonNullable<${p}> extends { readonly ${k}?: infer E } ? (E extends readonly (infer I)[] ? I : never) : never)> })`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	const isConfig = ${configTest(groupKeys)};`,
			`	return (config: ${seated('ArgsOf<PF>[0]', 'CF')}, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
			`		const seat = _o(config)[${JSON.stringify(k)}];`,
			`		if (!Array.isArray(seat)) return ${CALL_PO('config')};`,
			`		return ${CALL_PO(`{ ..._o(config), ${k}: seat.map((e) => (isConfig(e) ? ${CALL_C}(e) : e)) }`)};`,
			`	};`,
			`};`
		],
		paramFor: (p, c) => `(config: ${seated(p, `typeof ${c}`)})`
	};
}

function tupleShape(k: string, m: string): SeatShape {
	const seated = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & { ${k}: ArgsOf<${c}> })`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	return (config: ${seated('ArgsOf<PF>[0]', 'CF')}, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
			`		const seat = _o(config)[${JSON.stringify(k)}];`,
			`		if (!Array.isArray(seat)) return ${CALL_PO('config')};`,
			`		return ${CALL_PO(`{ ..._o(config), ${k}: ${CALL_C}(...seat) }`)};`,
			`	};`,
			`};`
		],
		paramFor: (p, c) => `(config: ${seated(p, `typeof ${c}`)})`
	};
}

interface SeatEmission {
	readonly method: readonly string[];
	readonly apply: (parentExpr: string, childRef: string) => string;
	readonly paramFor: (parentParamType: string, childRef: string) => string;
	readonly child: FlavorRefs;
	readonly spread: boolean;
}

function seatEmission(
	parent: AssembledNode,
	parentKey: string,
	seat: FlattenSeat,
	kind: 'flatten' | 'elements' | 'tuple',
	wires: PolymorphWires,
	nodeMap: NodeMap
): SeatEmission {
	const m = methodName(parentKey, kind === 'flatten' ? 'flatten' : seat.slot.configKey);
	const direct = resolveDirectFactorySlot(parent, nodeMap) !== undefined;
	const wrapperSeat = kind === 'flatten' && !direct && configKeysOf(seat.group).includes(seat.slot.configKey);
	const wrapperId = wrapperSeat ? kindDiscriminantExpr(seat.group.kind, nodeMap, wires.kindEntries) : undefined;
	const childKey = wires.keyByKind.get(seat.group.kind);
	const child: FlavorRefs =
		childKey !== undefined && seatBearing(wires, seat.group.kind, parent.kind)
			? { strict: `${childKey}.strict`, coerce: `${childKey}.coerce`, set: seat.group.kind }
			: {
					strict: `F.${seat.group.rawFactoryName}`,
					coerce: wires.coerceEmitted(seat.group) ? `C.${seat.group.fromFunctionName}` : undefined
				};
	const s =
		kind === 'tuple'
			? tupleShape(seat.slot.configKey, m)
			: kind === 'flatten'
			? flattenShape(seat.slot.configKey, configKeysOf(seat.group), m, direct, seat.directKey, wrapperSeat)
			: elementsShape(
					seat.slot.configKey,
					configKeysOf(seat.group),
					m,
					parent instanceof AssembledList || classifyFactoryShape(parent, nodeMap) === 'spread',
					parent instanceof AssembledList
						? { nonEmpty: parent.nonEmpty, options: listHasOptions(parent), optionsRequired: separatorRequired(parent) }
						: undefined
				);
	return {
		method: s.method,
		apply: (pe, c) => (wrapperId === undefined ? `${m}(${pe}, ${c})` : `${m}(${pe}, ${c}, ${wrapperId})`),
		paramFor: s.paramFor,
		child,
		spread: s.spread === true
	};
}

interface SubEmission {
	readonly name: string;
	readonly set?: string;
	readonly method: readonly string[];
	readonly strictApply: string;
	readonly strictType: string;
	readonly coerceApply?: string;
	readonly coerceType?: string;
	readonly max?: number;
}

function emitSub(
	parent: AssembledNode,
	parentKey: string,
	sub: SubFactory,
	wires: PolymorphWires,
	nodeMap: NodeMap,
	parentOverride?: FlavorRefs,
	methodKey?: string
): SubEmission | undefined {
	const m = methodName(parentKey, methodKey ?? sub.name);
	const p = parentOverride ?? parentRefs(parent, wires.coerceEmitted);
	const k = sub.slot.configKey;
	const positional = resolveDirectFactorySlot(parent, nodeMap) !== undefined;

	if (sub.arm.via === 'value') {
		const val = valueStorageExpr(sub.arm.storage, resolveFieldStorageInfo(sub.slot, nodeMap), wires.kindEntries);
		const s = shape(sub, k, positional, undefined, m);
		const typeFor = (ref: string): string => `${s.paramFor(ref, undefined)} => ReturnType<typeof ${ref}>`;
		return {
			name: m,
			method: s.method,
			strictApply: `${m}(${p.strict}, ${val})`,
			strictType: typeFor(p.strict),
			coerceApply: p.coerce ? `${m}(${p.coerce}, ${val})` : undefined,
			coerceType: p.coerce ? typeFor(p.coerce) : undefined,
			...maxOf(s.max === 'child' ? undefined : s.max)
		};
	}

	const c = childRefs(sub, wires.keyByKind, wires.coerceEmitted, (kind) => seatBearing(wires, kind, parent.kind), wires);
	if (c === undefined) return undefined;
	const mergeKeys =
		sub.arm.path.length === 0 && sub.residual.length > 0 && sub.merges
			? armConfigKeys(sub, nodeMap, { isEmitted: wires.isEmitted })
			: undefined;
	const s = shape(sub, k, positional, mergeKeys, m, seatsConfigChild(sub, nodeMap));
	const typeFor = (pRef: string, cRef: string): string => `${s.paramFor(pRef, cRef)} => ReturnType<typeof ${pRef}>`;
	const wrap: FlavorRefs = positional ? { strict: p.strict, coerce: p.coerce && p.strict } : p;
	return {
		name: m,
		set: c.set,
		method: s.method,
		strictApply: `${m}(${wrap.strict}, ${c.strict})`,
		strictType: typeFor(wrap.strict, c.strict),
		coerceApply: wrap.coerce && c.coerce ? `${m}(${wrap.coerce}, ${c.coerce})` : undefined,
		coerceType: wrap.coerce && c.coerce ? typeFor(wrap.coerce, c.coerce) : undefined,
		...maxOf(s.max === 'child' ? c.max : s.max)
	};
}

export function emitPolymorphsOverlay(config: { nodeMap: NodeMap; generatedIdTables?: GeneratedIdTables }): string {
	const { nodeMap, generatedIdTables } = config;
	const wires = collectPolymorphWires(nodeMap, generatedIdTables);

	const chunks: OverlayChunk[] = [];
	let usesKindId = false;
	const chainedByKind = new Map<string, Map<string, string[]>>();
	const emittedEntries = new Set<string>();
	const seatedEntries = new Set<string>();
	const coercibleSeats = new Set<string>();

	for (const kind of wires.order) {
		const wireSet = wires.byKind.get(kind)!;
		const uses = new Set<string>();
		const wireLines: string[] = [];
		const wireTypes: string[] = [];
		const methods: string[] = [];
		const seats = seatsOf(wireSet, wires);
		const seated = composeSeats(seats, wireSet, wires, nodeMap, methods);
		if (seated !== undefined) for (const seat of seats) if (seat.child.set !== undefined) uses.add(seat.child.set);
		if (methods.some((line) => line.includes('TSKindId.'))) usesKindId = true;
		const armEntries = new Map<string, ArmEntry>();
		const flat: { line: string; type: string }[] = [];
		const built: { sub: SubFactory; entry: ArmEntry }[] = [];
		for (const sub of wireSet.subs) {
			if (isNamespaceArm(sub)) {
				const entry: ArmEntry = { sub, type: '', children: new Map() };
				built.push({ sub, entry });
				armEntries.set(sub.name, entry);
				continue;
			}
			const emission = emitSub(wireSet.node, wireSet.parentKey, sub, wires, nodeMap, seated?.refs);
			if (emission === undefined) continue;
			methods.push(...emission.method);
			if (emission.set !== undefined) uses.add(emission.set);
			if (emission.strictApply.includes('TSKindId.') || emission.coerceApply?.includes('TSKindId.')) usesKindId = true;
			const entry: ArmEntry = { sub, pair: armPair(emission, methods), type: armType(emission), children: new Map() };
			built.push({ sub, entry });
			if (nestingArmOf(sub, wireSet.subs, wires) === undefined) armEntries.set(sub.name, entry);
		}
		for (const { sub, entry } of built) {
			const under = nestingArmOf(sub, wireSet.subs, wires);
			if (under === undefined) continue;
			const parent = under.keys.slice(0, -1).reduce<ArmEntry | undefined>((at, key) => at?.children.get(key), armEntries.get(under.host));
			if (parent === undefined) {
				flat.push({ line: `	${sub.name}: ${pairExpr(entry.pair!, `${wireSet.parentKey}.${sub.name}`, wires.routes)},`, type: `	${sub.name}: { ${entry.type} };` });
			} else {
				parent.children.set(under.keys[under.keys.length - 1]!, entry);
			}
			for (const chain of childChains(sub, chainedByKind)) {
				if (sub.arm.via !== 'node') break;
				const chainedName = `${sub.name}$${chain}`;
				const chainedSub: SubFactory = { ...sub, name: chainedName, arm: { ...sub.arm, path: [...sub.arm.path, chain] } };
				const emission = emitSub(wireSet.node, wireSet.parentKey, chainedSub, wires, nodeMap, seated?.refs, chainedName);
				if (emission === undefined || emission.coerceApply === undefined || emission.coerceType === undefined) continue;
				methods.push(...emission.method);
				if (emission.set !== undefined) uses.add(emission.set);
				entry.children.set(chain, { sub: chainedSub, pair: armPair(emission, methods), type: armType(emission), children: new Map() });
			}
		}
		const chained = new Map<string, string[]>();
		composeAcrossSlots(wireSet, wires, nodeMap, seated?.refs, armEntries, methods, chained, uses);
		chainedByKind.set(kind, chained);
		for (const [name, entry] of armEntries) {
			const rendered = renderArm(name, entry, `${wireSet.parentKey}.${name}`, wires.routes);
			wireLines.push(`	${rendered.line},`);
			wireTypes.push(`	${rendered.type};`);
		}
		for (const f of flat) {
			wireLines.push(f.line);
			wireTypes.push(f.type);
		}
		if (seated !== undefined) {
			wireLines.push(seated.wireLine);
			wireTypes.push(seated.wireType);
		}
		for (const alias of wireSet.aliases) {
			const path = `${wireSet.parentKey}.${alias.name}`;
			const route = variantRouteOf(alias.child, path);
			wires.routes.set(path, route.max);
			if (route.set !== undefined) uses.add(route.set);
			wireLines.push(`	${alias.name}: ${route.value},`);
			wireTypes.push(`	${alias.name}: ${route.type};`);
		}
		if (wireLines.length > 0) {
			emittedEntries.add(wireSet.node.kind);
			if (seated !== undefined) seatedEntries.add(wireSet.node.kind);
			if (seated?.refs.coerce !== undefined) coercibleSeats.add(wireSet.node.kind);
			const isPrivate = isHoistedCompound(wireSet.node);
			const lines = [
				...methods,
				...(isPrivate
					? [`const ${wireSet.parentKey}: {`, ...wireTypes, `} = Object.freeze({`]
					: [`export const ${wireSet.parentKey} = Object.freeze({`, `	...B.${wireSet.parentKey},`]),
				...wireLines,
				...(isPrivate ? ['});'] : [`}) as unknown as typeof B.${wireSet.parentKey} & {`, ...wireTypes, '};']),
				''
			];
			chunks.push({ kind, isPrivate, lines, uses, hasMethods: methods.length > 0 });
		}
	}

	function variantRouteOf(child: AssembledNode, path: string): VariantRoute {
		const entryKey = wires.keyByKind.get(child.kind);
		const max = entryArity(child.kind, wires);
		if (entryKey !== undefined && wires.bundledKinds.has(child.kind) && !emittedEntries.has(child.kind)) {
			return { value: `B.${entryKey}`, type: `typeof B.${entryKey}`, strict: `B.${entryKey}.strict`, coerce: `B.${entryKey}.coerce`, ...maxOf(max) };
		}
		const subFactories = entryKey !== undefined && emittedEntries.has(child.kind) ? entryKey : undefined;
		if (subFactories !== undefined && (seatedEntries.has(child.kind) || !isHoistedCompound(child))) {
			const coercible = seatedEntries.has(child.kind) ? coercibleSeats.has(child.kind) : true;
			return {
				set: child.kind,
				value: subFactories,
				type: `typeof ${subFactories}`,
				strict: `${subFactories}.strict`,
				...(coercible ? { coerce: `${subFactories}.coerce` } : {}),
				...maxOf(max)
			};
		}
		const strictRef = `F.${child.rawFactoryName}`;
		const coerceRef = wires.coerceEmitted(child) ? `C.${child.fromFunctionName}` : undefined;
		const pairValue = bundleExpr(strictRef, coerceRef, path, max);
		const pairType = coerceRef === undefined ? `strict: typeof ${strictRef}` : `strict: typeof ${strictRef}; coerce: typeof ${coerceRef}`;
		const refs = { strict: strictRef, ...(coerceRef === undefined ? {} : { coerce: coerceRef }), ...maxOf(max) };
		return subFactories === undefined
			? { value: pairValue, type: `{ ${pairType} }`, ...refs }
			: { set: child.kind, value: `Object.freeze({ ...${pairValue}, ...${subFactories} })`, type: `{ ${pairType} } & typeof ${subFactories}`, ...refs };
	}

	const defaultRoutes = new Map<string, Pick<VariantRoute, 'strict' | 'coerce' | 'set' | 'max'>>();
	for (const parent of flattenedVariantParents(nodeMap, generatedIdTables)) {
		const lines: string[] = [];
		const types: string[] = [];
		const uses = new Set<string>();
		for (const route of parent.variants) {
			const { name, child, nestedParentKey } = route;
			if (route.leaf === true) {
				const id = kindDiscriminantExpr(child.kind, nodeMap, wires.kindEntries);
				usesKindId = true;
				lines.push(`	${name}: ${id},`);
				types.push(`	readonly ${name}: typeof ${id};`);
				continue;
			}
			const target = nestedParentKey === undefined ? variantRouteOf(child, `${parent.key}.${name}`) : defaultRoutes.get(nestedParentKey);
			if (target?.set !== undefined) uses.add(target.set);
			if (route.default && target !== undefined) {
				defaultRoutes.set(parent.key, target);
				lines.unshift(`	...${bundleExpr(target.strict, target.coerce, parent.key, target.max)},`);
				types.unshift(`	readonly strict: typeof ${target.strict};`, ...(target.coerce === undefined ? [] : [`	readonly coerce: typeof ${target.coerce};`]));
			}
			if (nestedParentKey !== undefined) {
				uses.add(child.kind);
				lines.push(`	${name}: ${nestedParentKey},`);
				types.push(`	readonly ${name}: typeof ${nestedParentKey};`);
				continue;
			}
			const own = target as VariantRoute;
			lines.push(`	${name}: ${own.value},`);
			types.push(`	readonly ${name}: ${own.type};`);
		}
		chunks.push({ kind: parent.node.kind, isPrivate: false, lines: [`export const ${parent.key}: {`, ...types, '} = Object.freeze({', ...lines, '});', ''], uses, hasMethods: false });
	}

	const kept = inDependencyOrder(withoutUnusedPrivateSets(chunks));
	const helpersAt = kept.findIndex((chunk) => chunk.hasMethods);
	const blocks = kept.flatMap((chunk, i) => (i === helpersAt ? [...ERASED_HELPERS, ...chunk.lines] : chunk.lines));

	const extraImports = [
		"import * as F from '../raw.js';",
		"import * as C from '../coerce.js';",
		"import { bundle } from '@sittir/common/utils';",
		`import type { ArgsOf, ${blocks.some((b) => b.includes('ElementsOf<')) ? 'ElementsOf, ' : ''}OmitEach${blocks.some((b) => b.includes('OptionsArg<')) ? ', OptionsArg' : ''} } from '@sittir/types';`,
		...(usesKindId ? ["import { TSKindId } from '../../types.js';"] : []),
		...(blocks.some((b) => /(?<![\w$.])T\./.test(b)) ? ["import type * as T from '../../types.js';"] : [])
	];
	const start = blocks.indexOf(ERASED_HELPERS[0]!);
	const end = start + ERASED_HELPERS.length - 1;
	if (start >= 0 && blocks.some((b) => b.includes('NoneOf<'))) blocks.splice(end, 0, ...FLATTEN_HELPER);
	if (start >= 0 && blocks.some((b) => b.includes('ListElement<'))) blocks.splice(end, 0, ...LIST_HELPER);
	return [...overlayFrame(overlayImportPath(1), blocks, extraImports), ...blocks].join('\n');
}
