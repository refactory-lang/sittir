import type { PortableMountCall } from '@sittir/types';
import type { NodeMap } from '../../compiler/types.ts';
import { AbstractAssembledCompound, AssembledEnum, AssembledList, AssembledSupertype, isKindIdStored, isRequired, separatorRequired, type AssembledNode } from '../../compiler/model/node-map.ts';
import {
	classifyFactoryShape,
	classifyFromEmission,
	compareOrdinal,
	isSlotBearingCompound,
	ownTextLeaf,
	resolveDirectFactorySlot,
	resolveFieldStorageInfo,
	functionTypeOf,
	plainParams,
	refusingParam,
	seatDeclaration,
	withTrailingParam,
	type RefusingParams
} from '../shared.ts';
import {
	constructorTargetKind,
	listHasOptions,
	listSpreadTarget,
	rowTuple,
	valueStorageExpr,
	type BuiltTypeSurface
} from '../factories.ts';
import { kindDiscriminantExpr, type KindEnumEntry } from '../kind-discriminant.ts';
import {
	armConfigKeys,
	mountCallOf,
	configKeysOf,
	emittedElementsSeats,
	flattenSeatsOf,
	tupleSeatOf,
	type FlattenKey,
	type FlattenSeat,
	type FlattenedSeat,
	type SubFactory
} from '../../compiler/model/sub-factories.ts';
import { localRef, memberAt, moduleRef, routesType, tableRef, withMembers, type BuilderSurface, type Member, type Ref } from './module.ts';
import type { RefinedEntry } from './refines.ts';
import { armRoutesOf, bundleKeyedNodes, flattenedVariantParents, hasOneSurface, isHoistedCompound, isNamespaceArm, type AliasWire, type FlattenedVariantParent } from '../../compiler/model/ir-surface.ts';

interface FlavorRefs<R = Ref> {
	readonly strict: R;
	readonly coerce?: R;
	readonly set?: string;
}

type CoerceEmitted = (node: AssembledNode) => boolean;

export function tableKeyOf(node: AssembledNode): string {
	return node.rawFactoryName!;
}

export function tableRefOf(node: AssembledNode): Ref {
	return tableRef(tableKeyOf(node));
}

function rawRef(node: AssembledNode): Ref {
	return moduleRef('F', node.rawFactoryName!);
}

function seatedKeyOf(parentKey: string): string {
	return `${parentKey}$seated`;
}

function parentRefs(node: AssembledNode, coerceEmitted: CoerceEmitted): FlavorRefs {
	return { strict: rawRef(node), coerce: coerceEmitted(node) ? tableRefOf(node) : undefined };
}

function seatParentRefs(node: AssembledNode, coerceEmitted: CoerceEmitted): FlavorRefs {
	return { strict: rawRef(node), coerce: coerceEmitted(node) ? moduleRef('C', node.fromFunctionName!) : undefined };
}

function entryRefs(entry: Ref, set: string): FlavorRefs {
	return { strict: entry, coerce: entry, set };
}

interface PathRefs {
	readonly refAt: (name: string, path: readonly string[]) => Ref;
}

function childRefs(sub: SubFactory, wires: PolymorphWires, seated: (kind: string) => boolean, paths: PathRefs): FlavorRefs | undefined {
	if (sub.arm.via !== 'node') return undefined;
	const { child, path } = sub.arm;
	const childKey = wires.keyByKind.get(child.kind);
	if (path.length > 0) {
		if (childKey === undefined) return undefined;
		const spelled = emittedArmPath(child.kind, path, wires);
		const target = variantChildAt(child.kind, spelled, wires);
		return target !== undefined && hasOneSurface(target)
			? builderRefs(target, wires.coerceEmitted)
			: entryRefs(paths.refAt(childKey, spelled), child.kind);
	}
	if (childKey !== undefined && (child instanceof AssembledSupertype || seated(child.kind))) return entryRefs(localRef(childKey), child.kind);
	return builderRefs(child, wires.coerceEmitted);
}

function builderRefs(node: AssembledNode, coerceEmitted: CoerceEmitted): { strict: Ref; coerce: Ref } {
	const strict = rawRef(node);
	return { strict, coerce: coerceEmitted(node) && ownTextLeaf(node) === undefined ? tableRefOf(node) : strict };
}

function armTargetAt(start: AssembledNode, path: readonly string[], wires: PolymorphWires): AssembledNode | undefined {
	let at: AssembledNode | undefined = start;
	for (const step of path) {
		const sub: SubFactory | undefined = wires.byKind.get(at.kind)?.subs.find((candidate) => candidate.name === step);
		at =
			sub !== undefined && sub.arm.via === 'node'
				? armTargetAt(sub.arm.child, sub.arm.path, wires)
				: variantChildAt(at.kind, [step], wires);
		if (at === undefined) return undefined;
	}
	return at;
}

function isConstantLeafArm(sub: SubFactory, wires: PolymorphWires): boolean {
	if (sub.arm.via !== 'node' || sub.arm.path.length === 0) return false;
	const target = armTargetAt(sub.arm.child, sub.arm.path, wires);
	return target !== undefined && isKindIdStored(target) && !(target instanceof AssembledEnum);
}

function isNestedNamespaceArm(sub: SubFactory, wires: PolymorphWires): boolean {
	if (sub.arm.via !== 'node' || sub.arm.path.length === 0) return false;
	const target = armTargetAt(sub.arm.child, sub.arm.path, wires);
	return target instanceof AssembledSupertype && target.defaultVariantSubtype === undefined && wires.flattened.has(target.kind);
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

interface VariantRoute {
	readonly kind: string;
	readonly set?: string;
	readonly value: Ref;
	readonly callable: Ref;
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
	readonly kindEntries: readonly KindEnumEntry[];
	readonly isEmitted: (kind: string) => boolean;
	readonly coerceEmitted: CoerceEmitted;
	readonly keyByKind: ReadonlyMap<string, string>;
	readonly bundledKinds: ReadonlySet<string>;
	readonly nodeMap: NodeMap;
	readonly flattened: ReadonlyMap<string, FlattenedVariantParent>;
}

export function collectPolymorphWires(nodeMap: NodeMap, options: { silent?: boolean } = {}): PolymorphWires {
	const routes = armRoutesOf(nodeMap);
	const { kindEntries, isEmitted, keyByKind, bundledKinds, flattened } = routes;
	const coerceEmitted: CoerceEmitted = (node) =>
		node.fromFunctionName !== undefined && classifyFromEmission(node.kind, node, { nodeMap, kindEntries }) === 'emit';
	const note = options.silent ? () => {} : (message: string) => console.log(message);
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
			if (d.reason === 'shared-key') note(`[codegen] ${node.kind}: sub-factory ${d.name} seated, not merged (${d.reason}: ${(d.keys ?? []).join(', ')}): ${d.claimants.join(', ')}`);
			else warn(`[codegen] ${node.kind}: sub-factory ${d.name} skipped (${d.reason}): ${d.claimants.join(', ')}`);
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
	return { order, byKind, kindEntries, isEmitted, coerceEmitted, keyByKind, bundledKinds, nodeMap, flattened };
}

interface OverlayChunk {
	readonly kind: string;
	readonly name: string;
	readonly combinators: readonly string[];
	readonly decls: readonly Decl[];
	readonly entry: Decl;
	readonly seated: Readonly<Record<BuilderSurface, readonly string[]>>;
	readonly uses: ReadonlySet<string>;
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

export interface Decl {
	readonly name: string;
	readonly type: string;
	readonly value: string;
}

interface ChunkOut {
	readonly combinators: string[];
	readonly decls: Decl[];
	readonly seated: Record<BuilderSurface, string[]>;
}

interface ArmEntry {
	readonly sub: SubFactory;
	readonly ref?: Ref;
	readonly children: Map<string, ArmEntry>;
}

function declare(out: ChunkOut, name: string, type: string, value: string): Ref {
	out.decls.push({ name, type, value });
	return localRef(name);
}

function armRef(emission: SubEmission, out: ChunkOut): Ref {
	return declare(out, emission.name, emission.type, emission.apply);
}

function renderArm(key: string, entry: ArmEntry): Member {
	return { key, ref: withMembers(entry.ref, true, [...entry.children].map(([childKey, child]) => renderArm(childKey, child))) };
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
	out: ChunkOut,
	chainsByArm: Map<string, string[]>,
	uses: Set<string>,
	paths: PathRefs
): void {
	const slots = wireSet.node instanceof AbstractAssembledCompound ? wireSet.node.slots : [];
	const indexOf = (sub: SubFactory): number => slots.indexOf(sub.slot);
	const bySlot = new Set(wireSet.subs.map(indexOf));
	if (bySlot.size < 2) return;
	for (const host of walkArms(armEntries)) {
		const outer = host.sub;
		const applied = emitSub(wireSet.node, wireSet.parentKey, outer, wires, nodeMap, paths, seated);
		if (applied === undefined || !applied.coercible) continue;
		const appliedName = `${methodName(wireSet.parentKey, outer.name)}$applied`;
		const appliedRef = localRef(appliedName);
		let named = false;
		for (const inner of wireSet.subs) {
			if (indexOf(inner) <= indexOf(outer)) continue;
			const chained = emitSub(
				wireSet.node,
				wireSet.parentKey,
				inner,
				wires,
				nodeMap,
				paths,
				{ strict: appliedRef, coerce: appliedRef },
				`${outer.name}${inner.name}`
			);
			if (chained === undefined || !chained.coercible) continue;
			if (host.children.has(inner.name)) continue;
			if (!named) {
				if (applied.set !== undefined) uses.add(applied.set);
				declare(out, appliedName, applied.type, applied.apply);
				named = true;
			}
			out.combinators.push(...chained.method);
			if (chained.set !== undefined) uses.add(chained.set);
			chainsByArm.set(outer.name, [...(chainsByArm.get(outer.name) ?? []), inner.name]);
			host.children.set(inner.name, { sub: inner, ref: armRef(chained, out), children: new Map() });
		}
	}
}

interface SeatedParent {
	readonly refs: FlavorRefs;
	readonly callable: Ref;
}

function composeSeats(
	seats: readonly SeatEmission[],
	wireSet: PolymorphWireSet,
	wires: PolymorphWires,
	nodeMap: NodeMap,
	out: ChunkOut
): SeatedParent | undefined {
	if (seats.length === 0) return undefined;
	const p = seatParentRefs(wireSet.node, wires.coerceEmitted);
	let strictExpr = p.strict.value;
	let coerceExpr = p.coerce?.value;
	for (const seat of seats) {
		out.combinators.push(...seat.method);
		strictExpr = seat.apply(strictExpr, seat.child.strict);
		coerceExpr =
			coerceExpr !== undefined && seat.child.coerce !== undefined ? seat.apply(coerceExpr, seat.child.coerce) : undefined;
	}
	if (coerceExpr === undefined || p.coerce === undefined) {
		throw new Error(
			`[codegen] ${wireSet.node.kind}: its seated builder has no loose form (a seat's group has no coercer), so the default engine's table has no builder for it`
		);
	}
	const name = seatedKeyOf(wireSet.parentKey);
	const seated = (argsType: string, returnType: string, expr: string): string =>
		seatDeclaration(nodeMap, wireSet.node.kind, name, functionTypeOf(refusingParam('args', argsType, { rest: true, loose: true }), returnType), expr);
	out.seated.strict.push(seated(`T.${wireSet.node.typeName}.BuildArgs`, `ReturnType<${p.strict.type}>`, strictExpr));
	out.seated.loose.push(seated(`T.${wireSet.node.typeName}.LooseArgs`, `ReturnType<${p.coerce.type}>`, coerceExpr));
	const ref = tableRef(name);
	return { refs: { strict: ref, coerce: ref }, callable: ref };
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
		looseArgs: seatsCoercible(wireSet, seats, wires)
			? rowTuple(row, 'loose', seatedType(row.looseType, 'LooseArgs'))
			: surface.looseArgs
	};
}

function seatsCoercible(wireSet: PolymorphWireSet, seats: readonly SeatEmission[], wires: PolymorphWires): boolean {
	return parentRefs(wireSet.node, wires.coerceEmitted).coerce !== undefined && seats.every((seat) => seat.child.coerce !== undefined);
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
export const ERASED_HELPERS = [
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

const optionsOf = (parentRef: string): string => `options?: OptionsArg<${parentRef}>`;

const refusingConfig = (type: string, parentRef: string, optional = false): RefusingParams =>
	withTrailingParam(refusingParam('config', type, { optional, loose: true }), optionsOf(parentRef));

interface WireShape {
	readonly method: readonly string[];
	readonly paramFor: (parentRef: string, childRef: string | undefined) => RefusingParams;
}

function shape(
	sub: SubFactory,
	k: string,
	positional: boolean,
	mergeKeys: readonly string[] | undefined,
	m: string,
	call: PortableMountCall
): WireShape {
	const registered = sub.slot.registeredOption !== undefined;
	if (sub.arm.via === 'value') {
		if (call === 'none') {
			return {
				method: positional
					? [
							`export const ${m} = <${PFV}>(parent: PF, value: ArgsOf<PF>[0]) =>`,
							`	(options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(value as never, options as never);`
						]
					: registered
						? [
								`export const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
								`	(options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(undefined as never, _m(options, { ${k}: value }) as never);`
							]
						: [
								`export const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
								`	(options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)({ ${k}: value } as never, options as never);`
							],
				paramFor: (p) => plainParams(optionsOf(p))
			};
		}
		if (positional) {
			return {
				method: [
					`export const ${m} = <${PFV}>(parent: PF, value: unknown) =>`,
					`	(arg: ArgsOf<PF>[0], options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(arg as never, _m(options, { ${k}: value }) as never);`
				],
				paramFor: (p) => withTrailingParam(refusingParam('arg', `ArgsOf<${p}>[0]`, { loose: true }), optionsOf(p))
			};
		}
		return {
			method: [
				`export const ${m} = <${PF}>(parent: PF, value: unknown) =>`,
				registered
					? `	(config: OmitEach<ArgsOf<PF>[0], '${k}'>, options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)(config as never, _m(options, { ${k}: value }) as never);`
					: `	(config: OmitEach<ArgsOf<PF>[0], '${k}'>, options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)({ ...config, ${k}: value } as never, options as never);`
			],
			paramFor: (p) => refusingConfig(`OmitEach<ArgsOf<${p}>[0], '${k}'>`, p)
		};
	}
	if (call === 'child') {
		return {
			method: positional
				? [
						`export const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: ArgsOf<CF>): ReturnType<PF> => ${CALL_P}(${CALL_C}(...args));`
					]
				: [
						`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
						`	(...args: ArgsOf<CF>): ReturnType<PF> => ${CALL_P}({ ${k}: ${CALL_C}(...args) });`
					],
			paramFor: (_p, c) => refusingParam('args', `ArgsOf<${c}>`, { rest: true, loose: true })
		};
	}
	if (call === 'merge' && mergeKeys !== undefined) {
		if (mergeKeys.length === 0) {
			return {
				method: [
					`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
					`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & ArgsOf<CF>[0], options?: OptionsArg<PF>): ReturnType<PF> =>`,
					`		_s<ReturnType<PF>>(parent)(_m(config, { ${k}: ${CALL_C}({}) }) as never, options as never);`
				],
				paramFor: (p, c) => refusingConfig(`OmitEach<ArgsOf<${p}>[0], '${k}'> & ArgsOf<${c}>[0]`, p)
			};
		}
		const keyTests = mergeKeys.map((key) => `key === ${JSON.stringify(key)}`).join(' || ');
		return {
			method: [
				`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
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
			paramFor: (p, c) => refusingConfig(`OmitEach<ArgsOf<${p}>[0], '${k}'> & ArgsOf<${c}>[0]`, p)
		};
	}
	if (call === 'holder') {
		const config = sub.residual.some(isRequired) ? 'config' : 'config?';
		return {
			method: [
				`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(${config}: OmitEach<ArgsOf<PF>[0], '${k}'>, options?: OptionsArg<PF>): ReturnType<PF> => _s<ReturnType<PF>>(parent)({ ...config, ${k}: ${CALL_C}() } as never, options as never);`
			],
			paramFor: (p) => refusingConfig(`OmitEach<ArgsOf<${p}>[0], '${k}'>`, p, config === 'config?')
		};
	}
	if (call === 'keyed') {
		return {
			method: [
				`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & { ${k}: ArgsOf<CF>[0] }, options?: OptionsArg<PF>): ReturnType<PF> => {`,
				`		const { ${k}: seated, ...rest } = config;`,
				`		return _s<ReturnType<PF>>(parent)({ ...rest, ${k}: ${CALL_C}(seated) } as never, options as never);`,
				`	};`
			],
			paramFor: (p, c) => refusingConfig(`OmitEach<ArgsOf<${p}>[0], '${k}'> & { ${k}: ArgsOf<${c}>[0] }`, p)
		};
	}
	return {
		method: [
			`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
			`	(config: OmitEach<ArgsOf<PF>[0], '${k}'> & { ${k}: ArgsOf<CF> }, options?: OptionsArg<PF>): ReturnType<PF> => {`,
			`		const { ${k}: seated, ...rest } = config;`,
			`		return _s<ReturnType<PF>>(parent)({ ...rest, ${k}: ${CALL_C}(...seated) } as never, options as never);`,
			`	};`
		],
		paramFor: (p, c) => refusingConfig(`OmitEach<ArgsOf<${p}>[0], '${k}'> & { ${k}: ArgsOf<${c}> }`, p)
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
	m: string,
	positional: boolean,
	directKey: string | undefined
): SeatShape {
	if (positional) {
		const typeFor = (p: string, c: string): string => `${p} | ${c}[0]`;
		return {
			method: [
				`export const ${m} = <${PFV}, ${CF}>(parent: PF, child: CF) =>`,
				`	(config?: unknown, ${OPTS}): ReturnType<PF> =>`,
				`		config === undefined || _built(config) ? ${CALL_PO('config')} : ${CALL_PO(`${CALL_C}(config)`)};`
			],
			typeFor
		};
	}
	const keyTests = keys.map(({ key }) => `key === ${JSON.stringify(key)}`).join(' || ');
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
		const groupKeys = `OmitEach<NonNullable<${groupConfig(config)}>, '$type'>`;
		return `WithoutGroup<${p}, ${groupKeys}> | (OmitEach<NonNullable<${p}>, '${k}'> & (${groupConfig(`${c}[0]`)} | NoneOf<${groupKeys}>))`;
	};
	const buildGroup = directKey === undefined ? `${CALL_C}(inner)` : `${CALL_C}(inner[${JSON.stringify(directKey)}])`;
	return {
		method: [
			`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) =>`,
			`	(config?: unknown, ${OPTS}): ReturnType<PF> => {`,
			`		if (config === undefined) return ${CALL_PO('config')};`,
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
				`export const ${m} = <${PFS}, ${CF}>(parent: PF, child: CF) => {`,
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
			`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	const isConfig = ${configTest(groupKeys)};`,
			`	return (config?: unknown, ${OPTS}): ReturnType<PF> => {`,
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
			`export const ${m} = <${PF}, ${CF}>(parent: PF, child: CF) => {`,
			`	return (config?: unknown, ${OPTS}): ReturnType<PF> => {`,
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
	readonly child: FlavorRefs<string>;
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
	const m = methodName(parentKey, kind === 'flatten' ? `flatten$${seat.slot.propertyName}` : seat.slot.propertyName);
	const direct = resolveDirectFactorySlot(parent, nodeMap) !== undefined;
	const childKey = wires.keyByKind.get(seat.group.kind);
	const child: FlavorRefs<string> =
		childKey !== undefined && seatBearing(wires, seat.group.kind, parent.kind)
			? { strict: seatedKeyOf(wires.byKind.get(seat.group.kind)!.parentKey), coerce: seatedKeyOf(wires.byKind.get(seat.group.kind)!.parentKey), set: seat.group.kind }
			: {
					strict: `F.${seat.group.rawFactoryName}`,
					coerce: wires.coerceEmitted(seat.group) ? `C.${seat.group.fromFunctionName}` : undefined
				};
	const s =
		kind === 'tuple'
			? tupleShape(seat.slot.propertyName, m)
			: kind === 'flatten'
			? flattenShape(seat.slot.propertyName, flattenedKeysOf(seat), m, direct, seat.directKey)
			: elementsShape(
					seat.slot.propertyName,
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
		apply: (pe, c) => `K.${m}(${pe}, ${c})`,
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
	readonly apply: string;
	readonly type: string;
	readonly coercible: boolean;
}

function emitSub(
	parent: AssembledNode,
	parentKey: string,
	sub: SubFactory,
	wires: PolymorphWires,
	nodeMap: NodeMap,
	paths: PathRefs,
	parentOverride?: FlavorRefs,
	methodKey?: string
): SubEmission | undefined {
	const m = methodName(parentKey, methodKey ?? sub.name);
	const p = parentOverride ?? parentRefs(parent, wires.coerceEmitted);
	const k = sub.slot.propertyName;
	const positional = resolveDirectFactorySlot(parent, nodeMap) !== undefined;

	if (sub.arm.via === 'value') {
		const val = valueStorageExpr(sub.arm.storage, resolveFieldStorageInfo(sub.slot, nodeMap), wires.kindEntries);
		const s = shape(sub, k, positional, undefined, m, mountCallOf(sub, nodeMap));
		const parent = p.coerce ?? p.strict;
		const type = functionTypeOf(s.paramFor(parent.type, undefined), `ReturnType<${parent.type}>`);
		return { name: m, method: s.method, apply: `K.${m}(${parent.value}, ${val})`, type, coercible: p.coerce !== undefined };
	}

	const c = childRefs(sub, wires, (kind) => seatBearing(wires, kind, parent.kind), paths);
	if (c === undefined) return undefined;
	const mergeKeys =
		sub.arm.path.length === 0 && sub.residual.length > 0 && sub.merges
			? armConfigKeys(sub, nodeMap, { isEmitted: wires.isEmitted })
			: undefined;
	const s = shape(sub, k, positional, mergeKeys, m, mountCallOf(sub, nodeMap));
	const wrap: FlavorRefs = positional ? { strict: p.strict, coerce: p.coerce && p.strict } : p;
	const coercible = wrap.coerce !== undefined && c.coerce !== undefined;
	const parentRef = coercible ? wrap.coerce! : wrap.strict;
	const childRef = coercible ? c.coerce! : c.strict;
	const type = functionTypeOf(s.paramFor(parentRef.type, childRef.type), `ReturnType<${parentRef.type}>`);
	return { name: m, set: c.set, method: s.method, apply: `K.${m}(${parentRef.value}, ${childRef.value})`, type, coercible };
}

export interface WiringChunk {
	readonly name: string;
	readonly decls: readonly Decl[];
	readonly combinators: readonly string[];
	readonly seated: Readonly<Record<BuilderSurface, readonly string[]>>;
}

export interface PolymorphsOverlay {
	readonly chunks: readonly WiringChunk[];
	readonly entryRows: ReadonlyMap<string, string>;
}

export const REFERENCE = /(?<![\w$])(?<!(?<!\.)\.)[A-Za-z_$][\w$]*/g;

export function declOf(name: string, ref: Ref): Decl {
	return { name, type: ref.type, value: ref.value };
}

const PATH_MARK = '\u0000';

function referencedDecls(decls: readonly Decl[], roots: readonly string[]): Decl[] {
	const names = new Set(decls.map((decl) => decl.name));
	const kept = new Set<string>();
	let frontier: readonly string[] = roots;
	while (frontier.length > 0) {
		const found = new Set<string>();
		for (const line of frontier) for (const [token] of line.matchAll(REFERENCE)) if (names.has(token) && !kept.has(token)) found.add(token);
		for (const name of found) kept.add(name);
		frontier = decls.filter((decl) => found.has(decl.name)).map((decl) => decl.value);
	}
	return decls.filter((decl) => kept.has(decl.name));
}

const SITTIR_TYPES = ['ArgsOf', 'ConfigSeat', 'ElementsOf', 'EmptyForm', 'NoneOf', 'OmitEach', 'OptionalConfigSeat', 'OptionsArg', 'RefuseUndeclared', 'RenameKeys', 'Seat', 'WithoutGroup'];

export function sittirTypesImport(body: readonly string[]): string[] {
	const text = body.join('\n');
	const names = SITTIR_TYPES.filter((name) => new RegExp(`\\b${name}<`).test(text));
	return names.length === 0 ? [] : [`import type { ${names.join(', ')} } from '@sittir/types';`];
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

export function emitPolymorphsOverlay(config: {
	readonly nodeMap: NodeMap;
	readonly wires: PolymorphWires;
	readonly refined: ReadonlyMap<string, RefinedEntry>;
}): PolymorphsOverlay {
	const { nodeMap, wires, refined } = config;
	const rowKindByPath = new Map<string, string>();
	const sharedSetByPath = new Map<string, string>();

	const chunks: OverlayChunk[] = [];
	const locals = new Map<string, Ref>();
	const pending = new Map<string, readonly string[]>();
	const paths: PathRefs = {
		refAt: (name, path) => {
			const key = String(pending.size);
			pending.set(key, [name, ...path]);
			return { value: [name, ...path].join('.'), type: `${PATH_MARK}${key}${PATH_MARK}` };
		}
	};
	const chainedByKind = new Map<string, Map<string, string[]>>();
	const emittedEntries = new Set<string>();
	const seatedEntries = new Set<string>();

	for (const kind of wires.order) {
		const wireSet = wires.byKind.get(kind)!;
		const uses = new Set<string>();
		const out: ChunkOut = { combinators: [], decls: [], seated: { loose: [], strict: [] } };
		const seats = seatsOf(wireSet, wires);
		const seated = composeSeats(seats, wireSet, wires, nodeMap, out);
		if (seated !== undefined) for (const seat of seats) if (seat.child.set !== undefined) uses.add(seat.child.set);
		const armEntries = new Map<string, ArmEntry>();
		const flat: { readonly name: string; readonly ref: Ref }[] = [];
		const built: { sub: SubFactory; entry: ArmEntry }[] = [];
		for (const sub of wireSet.subs) {
			if (isNamespaceArm(sub)) {
				const entry: ArmEntry = { sub, children: new Map() };
				built.push({ sub, entry });
				armEntries.set(sub.name, entry);
				continue;
			}
			if (isNestedNamespaceArm(sub, wires)) {
				built.push({ sub, entry: { sub, children: new Map() } });
				continue;
			}
			if (isConstantLeafArm(sub, wires)) continue;
			const emission = emitSub(wireSet.node, wireSet.parentKey, sub, wires, nodeMap, paths, seated?.refs);
			if (emission === undefined) continue;
			out.combinators.push(...emission.method);
			if (emission.set !== undefined) uses.add(emission.set);
			const entry: ArmEntry = { sub, ref: armRef(emission, out), children: new Map() };
			built.push({ sub, entry });
			if (nestingArmOf(sub, wireSet.subs, wires) === undefined) armEntries.set(sub.name, entry);
		}
		for (const { sub, entry } of built) {
			const under = nestingArmOf(sub, wireSet.subs, wires);
			if (under === undefined) continue;
			const parent = under.keys.slice(0, -1).reduce<ArmEntry | undefined>((at, key) => at?.children.get(key), armEntries.get(under.host));
			if (parent === undefined) flat.push({ name: sub.name, ref: entry.ref! });
			else parent.children.set(under.keys[under.keys.length - 1]!, entry);
			for (const chain of childChains(sub, chainedByKind)) {
				if (sub.arm.via !== 'node') break;
				const chainedName = `${sub.name}$${chain}`;
				const chainedSub: SubFactory = { ...sub, name: chainedName, arm: { ...sub.arm, path: [...sub.arm.path, chain] } };
				const emission = emitSub(wireSet.node, wireSet.parentKey, chainedSub, wires, nodeMap, paths, seated?.refs, chainedName);
				if (emission === undefined || !emission.coercible) continue;
				out.combinators.push(...emission.method);
				if (emission.set !== undefined) uses.add(emission.set);
				entry.children.set(chain, { sub: chainedSub, ref: armRef(emission, out), children: new Map() });
			}
		}
		const chained = new Map<string, string[]>();
		composeAcrossSlots(wireSet, wires, nodeMap, seated?.refs, armEntries, out, chained, uses, paths);
		chainedByKind.set(kind, chained);
		const aliasRoutes = wireSet.aliases.map((alias) => {
			const route = variantRouteOf(alias.child, `${wireSet.parentKey}.${alias.name}`);
			if (route.set !== undefined) uses.add(route.set);
			return { name: alias.name, route };
		});
		if (armEntries.size === 0 && flat.length === 0 && seated === undefined && aliasRoutes.length === 0) continue;
		emittedEntries.add(wireSet.node.kind);
		if (seated !== undefined) seatedEntries.add(wireSet.node.kind);
		const isPrivate = isHoistedCompound(wireSet.node);
		const key = wireSet.parentKey;
		const members: Member[] = [
			...(isPrivate ? [] : (refined.get(key)?.members ?? [])),
			...[...armEntries].map(([name, arm]) => renderArm(name, arm)),
			...flat.map(({ name, ref }) => ({ key: name, ref })),
			...aliasRoutes.map(({ name, route }) => ({ key: name, ref: route.value }))
		];
		const callable = seated?.callable ?? (isPrivate ? undefined : tableRefOf(wireSet.node));
		const entryRef = withMembers(callable, false, members);
		locals.set(key, entryRef);
		const entry = declOf(key, entryRef);
		chunks.push({ kind, name: key, combinators: out.combinators, decls: out.decls, entry, seated: out.seated, uses });
	}

	function variantRouteOf(child: AssembledNode, path: string): VariantRoute {
		const entryKey = wires.keyByKind.get(child.kind);
		const kind = child.kind;
		rowKindByPath.set(path, kind);
		if (hasOneSurface(child)) {
			const builder = rawRef(child);
			return { kind, value: builder, callable: builder };
		}
		if (entryKey !== undefined && wires.bundledKinds.has(child.kind) && !emittedEntries.has(child.kind)) {
			const entry = refined.has(entryKey) ? localRef(entryKey) : tableRefOf(child);
			return { kind, value: entry, callable: entry };
		}
		const subFactories = entryKey !== undefined && emittedEntries.has(child.kind) ? entryKey : undefined;
		if (subFactories !== undefined && (seatedEntries.has(child.kind) || !isHoistedCompound(child))) {
			sharedSetByPath.set(path, subFactories);
			const entry = localRef(subFactories);
			return { kind, set: child.kind, value: entry, callable: entry };
		}
		const builder = wires.coerceEmitted(child) ? tableRefOf(child) : rawRef(child);
		if (subFactories === undefined) return { kind, value: builder, callable: builder };
		sharedSetByPath.set(path, subFactories);
		return { kind, set: child.kind, value: withMembers(builder, false, [{ spread: localRef(subFactories) }]), callable: builder };
	}

	const defaultRoutes = new Map<string, VariantRoute>();
	for (const parent of flattenedVariantParents(nodeMap)) {
		const members: Member[] = [];
		const uses = new Set<string>();
		let fallback: VariantRoute | undefined;
		for (const route of parent.variants) {
			const { name, child, nestedParentKey } = route;
			if (route.leaf === true) {
				const id = kindDiscriminantExpr(child.kind, nodeMap, wires.kindEntries);
				members.push({ key: name, ref: { value: id, type: `typeof ${id}` } });
				continue;
			}
			const target = nestedParentKey === undefined ? variantRouteOf(child, `${parent.key}.${name}`) : defaultRoutes.get(nestedParentKey);
			if (target?.set !== undefined) uses.add(target.set);
			if (route.default && target !== undefined) {
				if (isKindIdStored(child)) throw new Error(`arm.default: '${child.kind}' has no content to build, so it cannot be the default of '${parent.node.kind}'`);
				defaultRoutes.set(parent.key, target);
				rowKindByPath.set(parent.key, target.kind);
				fallback = target;
			}
			if (nestedParentKey !== undefined) {
				uses.add(child.kind);
				sharedSetByPath.set(`${parent.key}.${name}`, nestedParentKey);
				members.push({ key: name, ref: localRef(nestedParentKey) });
				continue;
			}
			members.push({ key: name, ref: (target as VariantRoute).value });
		}
		const entryRef = withMembers(fallback?.callable, false, members);
		locals.set(parent.key, entryRef);
		const entry = declOf(parent.key, entryRef);
		chunks.push({ kind: parent.node.kind, name: parent.key, combinators: [], decls: [], entry, seated: { loose: [], strict: [] }, uses });
	}

	const resolved = new Map(
		[...pending].map(([key, [name, ...path]]) => {
			const base = locals.get(name!);
			return [key, (base === undefined ? undefined : memberAt(locals, base, path))?.type ?? routesType([name!, ...path])];
		})
	);
	const resolve = (decl: Decl): Decl => ({ ...decl, type: decl.type.split(PATH_MARK).map((part, at) => (at % 2 === 1 ? resolved.get(part)! : part)).join('') });
	const ordered = inDependencyOrder(chunks);
	const irKeyByRoot = new Map<string, string>([
		...bundleKeyedNodes(nodeMap).map((entry): [string, string] => [entry.exportName, entry.key]),
		...[...wires.flattened.values()].map((parent): [string, string] => [parent.key, parent.key])
	]);
	return {
		chunks: ordered.map((chunk) => ({
			name: chunk.name,
			decls: [...referencedDecls(chunk.decls, [chunk.entry.value]), chunk.entry].map(resolve),
			combinators: chunk.combinators,
			seated: chunk.seated
		})),
		entryRows: entryRowsByIrPath(rowKindByPath, sharedSetByPath, irKeyByRoot)
	};
}
