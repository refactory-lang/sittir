import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { AbstractAssembledCompound, AssembledList, AssembledSupertype, isKindIdStored, isRequired, separatorRequired, type AssembledNode } from '../../compiler/model/node-map.ts';
import {
	classifyFactoryShape,
	classifyFromEmission,
	compareOrdinal,
	isSlotBearingCompound,
	ownTextLeaf,
	resolveDirectFactorySlot,
	resolveFieldStorageInfo,
	withEmptyOverload
} from '../shared.ts';
import { emptyForms } from '../../compiler/model/trivia.ts';
import { keywordLeafArity } from '../from.ts';
import {
	builtTypeSurfaceOf,
	constructorTargetKind,
	listHasOptions,
	listSpreadTarget,
	rowTuple,
	spellingTypeOf,
	valueStorageExpr,
	type BuiltTypeSurface
} from '../factories.ts';
import { kindDiscriminantExpr, type KindEnumEntry } from '../kind-discriminant.ts';
import {
	armConfigKeys,
	seatsConfigChild,
	configKeysOf,
	emittedElementsSeats,
	flattenSeatsOf,
	tupleSeatOf,
	type FlattenKey,
	type FlattenSeat,
	type FlattenedSeat,
	type SubFactory
} from '../../compiler/model/sub-factories.ts';
import { bundleEntries, bundleExpr, overlayFrame, overlayImportPath } from './module.ts';
import { armRoutesOf, flattenedVariantParents, hasOneSurface, isHoistedCompound, isNamespaceArm, type AliasWire, type FlattenedVariantParent } from '../../compiler/model/ir-surface.ts';

interface FlavorRefs {
	readonly strict: string;
	readonly coerce?: string;
	readonly set?: string;
	readonly max?: number;
}

type CoerceEmitted = (node: AssembledNode) => boolean;

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
		const target = wires === undefined ? undefined : variantChildAt(child.kind, spelled, wires);
		if (target !== undefined && hasOneSurface(target)) {
			return { ...builderRefs(target, coerceEmitted), ...maxOf(routeArity(base, wires!)) };
		}
		return { strict: `${base}.strict`, coerce: `${base}.${coerceSideOf(target, wires)}`, set: child.kind, ...(wires === undefined ? {} : maxOf(routeArity(base, wires))) };
	}
	const childKey = keyByKind.get(child.kind);
	if (childKey !== undefined && (child instanceof AssembledSupertype || seated?.(child.kind) === true)) {
		return { strict: `${childKey}.strict`, coerce: `${childKey}.${coerceSideOf(child, wires)}`, set: child.kind, ...(wires === undefined ? {} : maxOf(entryArity(child.kind, wires))) };
	}
	return { ...builderRefs(child, coerceEmitted), ...(wires === undefined ? {} : maxOf(surfaceArity(child, wires))) };
}

function builderRefs(node: AssembledNode, coerceEmitted: CoerceEmitted): { strict: string; coerce: string } {
	const strict = `F.${node.rawFactoryName}`;
	return { strict, coerce: coerceEmitted(node) && ownTextLeaf(node) === undefined ? `C.${node.fromFunctionName}` : strict };
}

function coerceSideOf(node: AssembledNode | undefined, wires: PolymorphWires | undefined): 'strict' | 'coerce' {
	let at = node;
	while (at !== undefined && wires !== undefined) {
		const next = wires.flattened.get(at.kind)?.variants.find((route) => route.default)?.child;
		if (next === undefined) break;
		at = next;
	}
	return at !== undefined && hasOneSurface(at) ? 'strict' : 'coerce';
}

function variantChildAt(kind: string, path: readonly string[], wires: PolymorphWires): AssembledNode | undefined {
	let at = kind;
	let node: AssembledNode | undefined;
	for (const step of path) {
		node =
			wires.flattened.get(at)?.variants.find((route) => route.name === step)?.child ??
			wires.byKind.get(at)?.aliases.find((alias) => alias.name === step)?.child;
		if (node === undefined) return undefined;
		at = node.kind;
	}
	return node;
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
	readonly kind: string;
	readonly set?: string;
	readonly value: string;
	readonly type: string;
	readonly strict: string;
	readonly coerce?: string;
	readonly max?: number;
}

export interface PolymorphWireSet {
	readonly parentKey: string;
	readonly node: AssembledNode;
	readonly subs: readonly SubFactory[];
	readonly aliases: readonly AliasWire[];
	readonly flattens?: readonly FlattenedSeat[];
	readonly elements?: readonly FlattenSeat[];
	readonly tuples?: readonly FlattenSeat[];
	readonly forwarded?: ForwardedSeats;
}

interface ForwardedSeats {
	readonly list: AssembledList;
	readonly elements: readonly FlattenSeat[];
}

function seatCount(set: PolymorphWireSet): number {
	return (set.flattens ?? []).length + (set.elements ?? []).length + (set.tuples ?? []).length + (set.forwarded?.elements ?? []).length;
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

export function collectPolymorphWires(nodeMap: NodeMap, options: { silent?: boolean } = {}): PolymorphWires {
	const routes = armRoutesOf(nodeMap);
	const { kindEntries, isEmitted, keyByKind, bundledKinds, flattened } = routes;
	const coerceEmitted: CoerceEmitted = (node) =>
		node.fromFunctionName !== undefined && classifyFromEmission(node.kind, node, { nodeMap, kindEntries }) === 'emit';
	const warn = options.silent ? () => {} : (message: string) => console.warn(message);

	const order: string[] = [];
	const byKind = new Map<string, PolymorphWireSet>();
	const seen = new Set<string>();
	const visiting = new Set<string>();

	function forwardedSeatsOf(node: AssembledNode): ForwardedSeats | undefined {
		if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
		const target = listSpreadTarget(node, nodeMap, kindEntries);
		if (target === null) return undefined;
		const list = nodeMap.nodes.get(constructorTargetKind(target, nodeMap, kindEntries));
		if (!(list instanceof AssembledList)) return undefined;
		const seats = emittedElementsSeats(list, nodeMap, kindEntries);
		return seats.length === 0 ? undefined : { list, elements: seats };
	}

	function visit(node: AssembledNode): void {
		if (seen.has(node.kind) || visiting.has(node.kind)) return;
		const route = routes.byKind.get(node.kind);
		if (route === undefined) {
			seen.add(node.kind);
			return;
		}
		const parentKey = route.parentKey;
		visiting.add(node.kind);
		for (const sub of route.candidates) {
			if (sub.arm.via === 'node') visit(sub.arm.child);
		}
		visiting.delete(node.kind);
		for (const d of route.diagnostics) {
			warn(
				d.reason === 'shared-key'
					? `[codegen] ${node.kind}: sub-factory ${d.name} seated, not merged (${d.reason}: ${(d.keys ?? []).join(', ')}): ${d.claimants.join(', ')}`
					: `[codegen] ${node.kind}: sub-factory ${d.name} skipped (${d.reason}): ${d.claimants.join(', ')}`
			);
		}
		for (const sub of route.mismatched) {
			if (sub.arm.via !== 'node') continue;
			warn(`[codegen] ${node.kind}: sub-factory ${sub.name} skipped (context-mismatch): ${sub.arm.child.kind}.${sub.arm.path.join('.')}`);
		}
		const subs = route.subs;
		const aliases = route.aliases;
		const flattens = flattenSeatsOf(node, nodeMap).filter((seat) => isEmitted(seat.group.kind));
		const elements = emittedElementsSeats(node, nodeMap, kindEntries);
		const forwarded = forwardedSeatsOf(node);
		const claimed = new Set(subs.map((sub) => sub.slot));
		const tuples = tupleSeatOf(node, nodeMap).filter((e) => isEmitted(e.group.kind) && !claimed.has(e.slot));
		visiting.add(node.kind);
		for (const s of [...flattens, ...elements, ...tuples, ...(forwarded?.elements ?? [])]) visit(s.group);
		if (forwarded !== undefined) visit(forwarded.list);
		for (const alias of aliases) visit(alias.child);
		visiting.delete(node.kind);
		if (subs.length > 0 || aliases.length > 0 || flattens.length > 0 || elements.length > 0 || tuples.length > 0 || forwarded !== undefined) {
			order.push(node.kind);
			byKind.set(node.kind, {
				parentKey,
				node,
				subs,
				aliases,
				...(flattens.length > 0 ? { flattens } : {}),
				...(elements.length > 0 ? { elements } : {}),
				...(tuples.length > 0 ? { tuples } : {}),
				...(forwarded === undefined ? {} : { forwarded })
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
	if (seatCount(set) === 0) return false;
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
	let strictExpr = p.strict;
	let coerceExpr = p.coerce;
	for (const seat of seats) {
		methods.push(...seat.method);
		strictExpr = seat.apply(strictExpr, seat.child.strict);
		coerceExpr =
			coerceExpr !== undefined && seat.child.coerce !== undefined ? seat.apply(coerceExpr, seat.child.coerce) : undefined;
	}
	const strictParams = `(...args: T.${wireSet.node.typeName}.BuildArgs)`;
	const coerceParams = `(...args: T.${wireSet.node.typeName}.LooseArgs)`;
	const seated = (name: string, params: string, returnType: string, expr: string): string[] =>
		emptyForms(nodeMap).has(wireSet.node.kind)
			? withEmptyOverload(
					nodeMap,
					wireSet.node.kind,
					`function ${name}`,
					[`function ${name}(${params.startsWith('(...') ? params.slice(1, -1) : `...args: [${params.slice(1, -1).replace(/^(\w+):/, '$1?:')}]`}): ${returnType} {`, `	return ${expr}(...args);`, '}'],
					`function ${name}${params}: ${returnType};`
				)
			: [`const ${name}: ${params} => ${returnType} = ${expr};`];
	const strictName = `${wireSet.parentKey}$seated`;
	methods.push(...seated(strictName, strictParams, `ReturnType<typeof ${p.strict}>`, strictExpr));
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
	methods.push(...seated(coerceName, coerceParams, `ReturnType<typeof ${p.coerce}>`, coerceExpr));
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
		...(wireSet.flattens ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'flatten', wires, wires.nodeMap)),
		...(wireSet.elements ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'elements', wires, wires.nodeMap)),
		...(wireSet.tuples ?? []).map((e) => seatEmission(wireSet.node, wireSet.parentKey, e, 'tuple', wires, wires.nodeMap)),
		...(wireSet.forwarded?.elements ?? []).map((e) =>
			seatEmission(wireSet.node, wireSet.parentKey, e, 'elements', wires, wires.nodeMap, wireSet.forwarded!.list)
		)
	];
}

export function seatedRowsOf(
	node: AssembledNode,
	wires: PolymorphWires,
	surface: BuiltTypeSurface
): { readonly buildArgs: string; readonly looseArgs: string } | undefined {
	const wireSet = wires.byKind.get(node.kind);
	const { row } = surface;
	if (wireSet === undefined || row === undefined) return undefined;
	const seats = seatsOf(wireSet, wires);
	if (seats.length === 0 || seats.some((seat) => seat.typeFor === undefined)) return undefined;
	const seatedType = (base: string, member: 'BuildArgs' | 'LooseArgs'): string =>
		seats.reduce(
			(type, seat) =>
				seat.typeFor!(
					type,
					`T.${seat.groupTypeName}.${member}`,
					`T.${seat.groupTypeName}.${member === 'BuildArgs' ? 'Config' : 'LooseConfig'}`
				),
			base
		);
	return {
		buildArgs: rowTuple(row, 'strict', seatedType(row.strictType, 'BuildArgs')),
		looseArgs: seatedArity(wireSet, wires)!.coercible
			? rowTuple(row, 'loose', seatedType(row.looseType, 'LooseArgs'))
			: surface.looseArgs
	};
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
			paramFor: (p) => `(${config}: OmitEach<ArgsOf<typeof ${p}>[0], '${k}'>, options?: OptionsArg<typeof ${p}>)`,
			max: 2
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
	readonly typeFor?: (parentParamType: string, childArgsType: string, childConfigType: string) => string;
	readonly spread?: true;
}

function flattenShape(
	k: string,
	keys: readonly FlattenKey[],
	groupKeys: readonly string[],
	m: string,
	positional: boolean,
	directKey: string | undefined,
	wrapperSeat: boolean
): SeatShape {
	if (positional) {
		const typeFor = (p: string, c: string): string => `${p} | ${c}[0]`;
		return {
			method: [
				`const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: unknown, ${OPTS}): ReturnType<PF> =>`,
				`		config === undefined || _built(config) ? ${CALL_PO('config')} : ${CALL_PO(`${CALL_C}(config)`)};`
			],
			typeFor
		};
	}
	const keyTests = keys.map(({ key }) => `key === ${JSON.stringify(key)}`).join(' || ');
	const ownKeyTests = groupKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ');
	const renames = Object.fromEntries(keys.filter(({ key, field }) => key !== field).map(({ key, field }) => [field, key]));
	const renamed = Object.keys(renames).length > 0;
	const outerKey = (field: string): string => renames[field] ?? field;
	const groupConfig = (c: string): string =>
		directKey !== undefined
			? `{ ${outerKey(directKey)}: ${c} }`
			: renamed
				? `RenameKeys<${c}, ${JSON.stringify(renames)}>`
				: c;
	const fieldOf = renamed
		? `(${JSON.stringify(Object.fromEntries(keys.map(({ key, field }) => [key, field])))} as Record<string, string>)[key]!`
		: 'key';
	const flattened = (p: string, c: string, config: string): string => {
		const groupKeys = `OmitEach<NonNullable<${groupConfig(config)}>, '${k}' | '$type'>`;
		return `WithoutGroup<${p}, ${groupKeys}> | (OmitEach<NonNullable<${p}>, '${k}'> & (${groupConfig(`${c}[0]`)} | NoneOf<${groupKeys}>))`;
	};
	const buildGroup = directKey === undefined ? `${CALL_C}(inner)` : `${CALL_C}(inner[${JSON.stringify(directKey)}])`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF${wrapperSeat ? ', wrapperId: number' : ''}) =>`,
			`	(config: unknown, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
			...(wrapperSeat
				? [
						`		const own = _o(config)[${JSON.stringify(k)}];`,
						`		if (typeof own === 'object' && own !== null && !Array.isArray(own)) {`,
						`			const spelled = '$type' in own ? (own as { $type?: unknown }).$type === wrapperId : !('kind' in own) && Object.keys(own).every((key) => ${ownKeyTests});`,
						`			if (spelled) return ${CALL_PO('config')};`,
						`		}`
					]
				: []),
			`		const rest: Record<string, unknown> = {};`,
			`		const inner: Record<string, unknown> = {};`,
			`		let seated = false;`,
			`		for (const [key, value] of Object.entries(_o(config))) {`,
			`			if (${keyTests}) {`,
			`				inner[${fieldOf}] = value;`,
			`				seated = seated || value !== undefined;`,
			`			} else rest[key] = value;`,
			`		}`,
			`		return ${CALL_PO(`seated ? { ...rest, ${k}: ${buildGroup} } : rest`)};`,
			`	};`
		],
		typeFor: flattened
	};
}

const PFS = 'PF extends (...args: never[]) => unknown';

function configTest(keys: readonly string[]): string {
	return `(e: unknown): boolean => isGroupConfig(e, ${JSON.stringify(keys)})`;
}

function elementsShape(
	k: string,
	groupKeys: readonly string[],
	m: string,
	spread: boolean,
	list: { readonly nonEmpty: boolean; readonly options: boolean; readonly optionsRequired: boolean } | undefined,
	ownerTypeName?: string
): SeatShape {
	if (spread) {
		return {
			method: [
				`const ${m} = <${PFS}, ${CF}>(parent: PF, child: CF) => {`,
				`	const isConfig = ${configTest(groupKeys)};`,
				`	return (...args: ${ownerTypeName === undefined ? 'ReadonlyArray<ArgsOf<PF>[number] | ArgsOf<CF>[0] | undefined>' : 'readonly unknown[]'}): ReturnType<PF> =>`,
				`		_s<ReturnType<PF>>(parent)(...args.map((e) => (isConfig(e) ? ${CALL_C}(e) : e)));`,
				`};`
			],
			spread: true
		};
	}
	const seated = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & { ${k}: ReadonlyArray<${c}[0] | (NonNullable<${p}> extends { readonly ${k}?: infer E } ? (E extends readonly (infer I)[] ? I : never) : never)> })`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	const isConfig = ${configTest(groupKeys)};`,
			`	return (config: unknown, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
			`		const seat = _o(config)[${JSON.stringify(k)}];`,
			`		if (!Array.isArray(seat)) return ${CALL_PO('config')};`,
			`		return ${CALL_PO(`{ ..._o(config), ${k}: seat.map((e) => (isConfig(e) ? ${CALL_C}(e) : e)) }`)};`,
			`	};`,
			`};`
		],
		typeFor: seated
	};
}

function tupleShape(k: string, m: string): SeatShape {
	const seated = (p: string, c: string): string =>
		`${p} | (OmitEach<NonNullable<${p}>, '${k}'> & { ${k}: ${c} })`;
	return {
		method: [
			`const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	return (config: unknown, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
			`		const seat = _o(config)[${JSON.stringify(k)}];`,
			`		if (!Array.isArray(seat)) return ${CALL_PO('config')};`,
			`		return ${CALL_PO(`{ ..._o(config), ${k}: ${CALL_C}(...seat) }`)};`,
			`	};`,
			`};`
		],
		typeFor: seated
	};
}

interface SeatEmission {
	readonly method: readonly string[];
	readonly apply: (parentExpr: string, childRef: string) => string;
	readonly typeFor?: (parentParamType: string, childArgsType: string, childConfigType: string) => string;
	readonly groupTypeName: string;
	readonly child: FlavorRefs;
	readonly spread: boolean;
}

function flattenedKeysOf(seat: FlattenSeat | FlattenedSeat): readonly FlattenKey[] {
	if (!('keys' in seat)) throw new Error(`flattenedKeysOf: '${seat.group.kind}' in '${seat.slot.propertyName}' is not a flatten seat`);
	return seat.keys;
}

function seatEmission(
	parent: AssembledNode,
	parentKey: string,
	seat: FlattenSeat | FlattenedSeat,
	kind: 'flatten' | 'elements' | 'tuple',
	wires: PolymorphWires,
	nodeMap: NodeMap,
	forwardedList?: AssembledList
): SeatEmission {
	const m = methodName(parentKey, kind === 'flatten' ? `flatten$${seat.slot.configKey}` : seat.slot.configKey);
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
			? flattenShape(seat.slot.configKey, flattenedKeysOf(seat), configKeysOf(seat.group), m, direct, seat.directKey, wrapperSeat)
			: elementsShape(
					seat.slot.configKey,
					configKeysOf(seat.group),
					m,
					forwardedList !== undefined || parent instanceof AssembledList || classifyFactoryShape(parent, nodeMap) === 'spread',
					parent instanceof AssembledList
						? { nonEmpty: parent.nonEmpty, options: listHasOptions(parent), optionsRequired: separatorRequired(parent) }
						: undefined,
					forwardedList === undefined ? undefined : parent.typeName
				);
	return {
		method: s.method,
		apply: (pe, c) => (wrapperId === undefined ? `${m}(${pe}, ${c})` : `${m}(${pe}, ${c}, ${wrapperId})`),
		...(s.typeFor === undefined ? {} : { typeFor: s.typeFor }),
		groupTypeName: seat.group.typeName,
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

export interface PolymorphsOverlay {
	readonly text: string;
	readonly entryRows: ReadonlyMap<string, string>;
	readonly forwardingPaths: readonly string[];
}

function entryRowsByIrPath(
	rowKindByPath: ReadonlyMap<string, string>,
	sharedSetByPath: ReadonlyMap<string, string>,
	irKeyByRoot: ReadonlyMap<string, string>
): Map<string, string> {
	const out = new Map<string, string>();
	const collect = (root: string, irPrefix: string, seen: readonly string[]): void => {
		for (const [path, kind] of rowKindByPath) {
			if (path === root) out.set(irPrefix, kind);
			else if (path.startsWith(`${root}.`)) out.set(`${irPrefix}${path.slice(root.length)}`, kind);
		}
		for (const [path, shared] of sharedSetByPath) {
			if (!path.startsWith(`${root}.`) || seen.includes(shared)) continue;
			collect(shared, `${irPrefix}${path.slice(root.length)}`, [...seen, shared]);
		}
	};
	for (const [root, irKey] of irKeyByRoot) collect(root, irKey, [root]);
	return new Map([...out].sort(([a], [b]) => compareOrdinal(a, b)));
}

export function emitPolymorphsOverlay(config: { nodeMap: NodeMap; generatedIdTables?: GeneratedIdTables; wires?: PolymorphWires }): PolymorphsOverlay {
	const { nodeMap, generatedIdTables } = config;
	const wires = config.wires ?? collectPolymorphWires(nodeMap);
	const rowKindByPath = new Map<string, string>();
	const sharedSetByPath = new Map<string, string>();

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
			const replaced = seated === undefined ? undefined : seated.refs.coerce === undefined ? "'strict'" : "'strict' | 'coerce'";
			const baseType =
				replaced === undefined ? `typeof B.${wireSet.parentKey}` : `Omit<typeof B.${wireSet.parentKey}, ${replaced}>`;
			const lines = [
				...methods,
				...(isPrivate
					? [`const ${wireSet.parentKey}: {`, ...wireTypes, `} = Object.freeze({`]
					: [`export const ${wireSet.parentKey} = Object.freeze({`, `	...B.${wireSet.parentKey},`]),
				...wireLines,
				...(isPrivate ? ['});'] : [`}) as unknown as ${baseType} & {`, ...wireTypes, '};']),
				''
			];
			chunks.push({ kind, isPrivate, lines, uses, hasMethods: methods.length > 0 });
		}
	}

	function variantRouteOf(child: AssembledNode, path: string): VariantRoute {
		const entryKey = wires.keyByKind.get(child.kind);
		const max = entryArity(child.kind, wires);
		const kind = child.kind;
		rowKindByPath.set(path, kind);
		if (hasOneSurface(child)) {
			const entry = `F.${child.rawFactoryName}`;
			return { kind, value: entry, type: `typeof ${entry}`, strict: entry, ...maxOf(max) };
		}
		if (entryKey !== undefined && wires.bundledKinds.has(child.kind) && !emittedEntries.has(child.kind)) {
			return { kind, value: `B.${entryKey}`, type: `typeof B.${entryKey}`, strict: `B.${entryKey}.strict`, coerce: `B.${entryKey}.coerce`, ...maxOf(max) };
		}
		const subFactories = entryKey !== undefined && emittedEntries.has(child.kind) ? entryKey : undefined;
		if (subFactories !== undefined && (seatedEntries.has(child.kind) || !isHoistedCompound(child))) {
			const coercible = seatedEntries.has(child.kind) ? coercibleSeats.has(child.kind) : true;
			sharedSetByPath.set(path, subFactories);
			return {
				kind,
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
		const refs = { kind, strict: strictRef, ...(coerceRef === undefined ? {} : { coerce: coerceRef }), ...maxOf(max) };
		if (subFactories !== undefined) sharedSetByPath.set(path, subFactories);
		return subFactories === undefined
			? { value: pairValue, type: `{ ${pairType} }`, ...refs }
			: { set: child.kind, value: `Object.freeze({ ...${pairValue}, ...${subFactories} })`, type: `{ ${pairType} } & typeof ${subFactories}`, ...refs };
	}

	const defaultRoutes = new Map<string, Pick<VariantRoute, 'kind' | 'strict' | 'coerce' | 'set' | 'max'>>();
	for (const parent of flattenedVariantParents(nodeMap)) {
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
				if (isKindIdStored(child)) throw new Error(`arm.default: '${child.kind}' has no content to build, so it cannot be the default of '${parent.node.kind}'`);
				defaultRoutes.set(parent.key, target);
				rowKindByPath.set(parent.key, target.kind);
				lines.unshift(`	...${bundleExpr(target.strict, target.coerce, parent.key, target.max)},`);
				types.unshift(`	readonly strict: typeof ${target.strict};`, ...(target.coerce === undefined ? [] : [`	readonly coerce: typeof ${target.coerce};`]));
			}
			if (nestedParentKey !== undefined) {
				uses.add(child.kind);
				sharedSetByPath.set(`${parent.key}.${name}`, nestedParentKey);
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
		`import type { ${['ArgsOf', 'ElementsOf', 'NoneOf', 'OmitEach', 'OptionsArg', 'RenameKeys', 'WithoutGroup'].filter((name) => name === 'ArgsOf' || name === 'OmitEach' || blocks.some((b) => b.includes(`${name}<`))).join(', ')} } from '@sittir/types';`,
		...(usesKindId ? ["import { TSKindId } from '../../types.js';"] : []),
		...(blocks.some((b) => b.includes('isGroupConfig(')) ? ["import { isGroupConfig } from '@sittir/common/utils';"] : []),
		...(blocks.some((b) => /(?<![\w$.])T\./.test(b)) ? ["import type * as T from '../../types.js';"] : [])
	];
	const irKeyByRoot = new Map<string, string>([
		...bundleEntries(nodeMap, generatedIdTables).map((entry): [string, string] => [entry.exportName, entry.key]),
		...[...wires.flattened.values()].map((parent): [string, string] => [parent.key, parent.key])
	]);
	const entryRows = entryRowsByIrPath(rowKindByPath, sharedSetByPath, irKeyByRoot);
	const forwardingPaths = [...entryRowsByIrPath(new Map([...wires.routes.keys()].map((path) => [path, ''])), sharedSetByPath, irKeyByRoot).keys()].filter(
		(path) => !entryRows.has(path)
	);
	return { text: [...overlayFrame(overlayImportPath(1), blocks, extraImports), ...blocks].join('\n'), entryRows, forwardingPaths };
}
