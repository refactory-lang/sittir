import type { NodeMap } from '../../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	AssembledSupertype,
	isNodeRef,
	isMultiple,
	storageKindOfRef,
	type AssembledNode,
	type AssembledNonterminal,
	type NodeBackedRef,
	type NodeOrTerminal,
	type TextValueStorage,
	isTextStorage
} from '../../compiler/model/node-map.ts';
import {
	forwardedTargetKind,
	isSlotBearingCompound,
	isTextLeaf,
	classifyFactoryEmission,
	classifyFactoryShape,
	resolveDirectFactorySlot,
	valueStorageOf
} from '../shared.ts';
import { lowerCamelCase } from '../../compiler/model/casing.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

export interface ValueArm {
	readonly via: 'value';
	readonly storage: TextValueStorage;
}

export interface NodeArm {
	readonly via: 'node';
	readonly child: AssembledNode;
	readonly path: readonly string[];
	readonly leaf?: AssembledNode;
}

export interface SubFactory {
	readonly name: string;
	readonly slot: AssembledNonterminal;
	readonly residual: readonly AssembledNonterminal[];
	readonly arm: ValueArm | NodeArm;
	readonly depth: number;
	readonly merges: boolean;
}

export interface SubFactoryDiagnostic {
	readonly parent: string;
	readonly name: string;
	readonly reason: 'ambiguous' | 'shared-key';
	readonly claimants: readonly string[];
	readonly keys?: readonly string[];
}

export interface SubFactorySet {
	readonly entries: readonly SubFactory[];
	readonly diagnostics: readonly SubFactoryDiagnostic[];
}

type IsEmittedPredicate = (kind: string) => boolean;

interface SubFactoryOptions {
	readonly isEmitted?: IsEmittedPredicate;
}

const DEFAULT_IS_EMITTED: IsEmittedPredicate = () => true;

const EMPTY: SubFactorySet = { entries: [], diagnostics: [] };

function textStorageOf(value: NodeOrTerminal, nodeMap: NodeMap): TextValueStorage | undefined {
	const storage = valueStorageOf(value, nodeMap);
	return storage !== undefined && isTextStorage(storage) ? storage : undefined;
}

type LabelledValue = NodeOrTerminal & { readonly variant: string };

function isLabelled(value: NodeOrTerminal): value is LabelledValue {
	return value.variant !== undefined;
}

function kindOfValue(value: NodeOrTerminal): string | undefined {
	return isNodeRef(value) ? storageKindOfRef(value.node) : value.resolvedKind;
}

function isInlinedMember(value: LabelledValue, nodeMap: NodeMap): boolean {
	const owner = nodeMap.nodes.get(value.variantOf ?? '');
	if (!(owner instanceof AssembledSupertype)) return false;
	const kind = kindOfValue(value);
	return owner.subtypes.some((member) => kindOfValue(member) === kind);
}

function seatsInlinedLabel(slot: AssembledNonterminal, value: LabelledValue, nodeMap: NodeMap): boolean {
	return slot.isUnnamed || value.variantOf === undefined || nodeMap.nodes.has(value.variantOf);
}

function armValuesOf(slot: AssembledNonterminal, nodeMap: NodeMap): readonly LabelledValue[] {
	const out: LabelledValue[] = [];
	for (const value of slot.values) {
		const child = isNodeRef(value) ? nodeMap.nodes.get(storageKindOfRef(value.node)) : undefined;
		const variants = child instanceof AssembledSupertype ? child.variantSubtypes : undefined;
		const mounts = isLabelled(value) ? !isInlinedMember(value, nodeMap) && seatsInlinedLabel(slot, value, nodeMap) : variants !== undefined && slot.isUnnamed;
		if (!mounts) continue;
		if (variants === undefined) {
			if (isLabelled(value)) out.push(value);
			continue;
		}
		for (const ref of variants) if (isLabelled(ref)) out.push({ ...ref, multiplicity: value.multiplicity });
	}
	return out;
}

const DIRECT = 0;
const NESTED = 1;

function claimantOf(entry: SubFactory): string {
	if (entry.arm.via === 'value') return `'${entry.arm.storage.text}'`;
	return [entry.arm.child.kind, ...entry.arm.path].join('.');
}

export function variantArmsOf(node: AssembledSupertype): readonly { readonly name: string; readonly ref: NodeBackedRef }[] {
	return (node.variantSubtypes ?? []).map((ref) => ({ name: lowerCamelCase(ref.variant!), ref }));
}

function isCallableArm(child: AssembledNode, isEmitted: IsEmittedPredicate): boolean {
	if (child instanceof AssembledSupertype) return child.variantSubtypes !== undefined;
	return child.rawFactoryName !== undefined && isEmitted(child.kind) && (isSlotBearingCompound(child) || isTextLeaf(child));
}

interface InnerArm {
	readonly name: string;
	readonly depth: number;
	readonly leaf?: AssembledNode;
}

function innerArmsOf(child: AssembledNode, nodeMap: NodeMap, isEmitted: IsEmittedPredicate, visiting: ReadonlySet<string>): readonly InnerArm[] {
	if (child instanceof AssembledSupertype) {
		return variantArmsOf(child).flatMap(({ name, ref }) => {
			const leaf = nodeMap.nodes.get(storageKindOfRef(ref.node));
			return leaf === undefined ? [] : [{ name, depth: DIRECT, leaf }];
		});
	}
	return subFactoriesInternal(child, nodeMap, isEmitted, visiting).entries.map((inner) => ({ name: inner.name, depth: inner.depth, ...leafOf(inner) }));
}

function nestedArmsOf(
	host: SubFactory,
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	visiting: ReadonlySet<string>
): SubFactory[] {
	if (host.arm.via !== 'node' || visiting.has(host.arm.child.kind)) return [];
	const child = host.arm.child;
	return innerArmsOf(child, nodeMap, isEmitted, visiting).map((inner) => ({
		name: `${host.name}$${inner.name}`,
		slot: host.slot,
		residual: host.residual,
		arm: { via: 'node', child, path: [inner.name], ...(inner.leaf === undefined ? {} : { leaf: inner.leaf }) },
		depth: inner.depth + NESTED,
		merges: false
	}));
}

function leafOf(inner: SubFactory): { leaf?: AssembledNode } {
	if (inner.arm.via !== 'node') return {};
	return { leaf: inner.arm.leaf ?? inner.arm.child };
}

function derive(
	node: AssembledNode,
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	visiting: ReadonlySet<string>
): SubFactorySet {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return EMPTY;
	if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return EMPTY;
	const nextVisiting = new Set([...visiting, node.kind]);
	const direct: SubFactory[] = [];
	for (const slot of node.slots) {
		if (isMultiple(slot)) continue;
		const residual = node.configSlots.filter((f) => f !== slot);
		for (const value of armValuesOf(slot, nodeMap)) {
			const name = lowerCamelCase(value.variant);
			const storage = textStorageOf(value, nodeMap);
			if (storage !== undefined) {
				direct.push({ name, slot, residual, arm: { via: 'value', storage }, depth: DIRECT, merges: false });
				continue;
			}
			const child = isNodeRef(value) ? nodeMap.nodes.get(storageKindOfRef(value.node)) : undefined;
			if (child !== undefined && isCallableArm(child, isEmitted)) {
				direct.push({ name, slot, residual, arm: { via: 'node', child, path: [] }, depth: DIRECT, merges: false });
			}
		}
	}
	const nested = direct.flatMap((host) => nestedArmsOf(host, nodeMap, isEmitted, nextVisiting));
	return settle(node, direct, nested, nodeMap, isEmitted, nextVisiting);
}

function settle(
	node: AssembledNode,
	direct: readonly SubFactory[],
	nested: readonly SubFactory[],
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	nextVisiting: ReadonlySet<string>
): SubFactorySet {
	const byName = new Map<string, SubFactory[]>();
	for (const entry of direct) byName.set(entry.name, [...(byName.get(entry.name) ?? []), entry]);
	const entries: SubFactory[] = [];
	const diagnostics: SubFactoryDiagnostic[] = [];
	const hosts = new Set<AssembledNode>();
	for (const [name, list] of byName) {
		if (list.length > 1) {
			diagnostics.push({ parent: node.kind, name, reason: 'ambiguous', claimants: list.map(claimantOf) });
			continue;
		}
		const entry = list[0]!;
		const shared = sharedKeysOf(entry, nodeMap, { isEmitted }, nextVisiting);
		if (entry.arm.via === 'node') hosts.add(entry.arm.child);
		if (shared === undefined) {
			entries.push(entry);
			continue;
		}
		entries.push({ ...entry, merges: shared.length === 0 });
		if (shared.length > 0) {
			diagnostics.push({ parent: node.kind, name, reason: 'shared-key', claimants: [claimantOf(entry)], keys: shared });
		}
	}
	for (const entry of nested) if (entry.arm.via === 'node' && hosts.has(entry.arm.child)) entries.push(entry);
	return { entries, diagnostics };
}

const cache = new WeakMap<NodeMap, WeakMap<IsEmittedPredicate, Map<string, SubFactorySet>>>();

const inProgress = new WeakMap<NodeMap, WeakMap<IsEmittedPredicate, Set<string>>>();

function subFactoriesInternal(
	node: AssembledNode,
	nodeMap: NodeMap,
	isEmitted: IsEmittedPredicate,
	visiting: ReadonlySet<string>
): SubFactorySet {
	let perMap = cache.get(nodeMap);
	if (perMap === undefined) {
		perMap = new WeakMap();
		cache.set(nodeMap, perMap);
	}
	let perPredicate = perMap.get(isEmitted);
	if (perPredicate === undefined) {
		perPredicate = new Map();
		perMap.set(isEmitted, perPredicate);
	}
	if (visiting.size === 0) {
		const cached = perPredicate.get(node.kind);
		if (cached !== undefined) return cached;
	}

	let inProgressPerMap = inProgress.get(nodeMap);
	if (inProgressPerMap === undefined) {
		inProgressPerMap = new WeakMap();
		inProgress.set(nodeMap, inProgressPerMap);
	}
	let inProgressKinds = inProgressPerMap.get(isEmitted);
	if (inProgressKinds === undefined) {
		inProgressKinds = new Set();
		inProgressPerMap.set(isEmitted, inProgressKinds);
	}
	if (inProgressKinds.has(node.kind)) return EMPTY;

	inProgressKinds.add(node.kind);
	const result = derive(node, nodeMap, isEmitted, visiting);
	inProgressKinds.delete(node.kind);

	if (visiting.size === 0) perPredicate.set(node.kind, result);
	return result;
}

function isHoistedAt(value: NodeBackedRef, group: AssembledNode | undefined): boolean {
	return group?.seated === true || value.flattened === true;
}

export interface FlattenKey {
	readonly key: string;
	readonly field: string;
}

export interface FlattenSeat {
	readonly slot: AssembledNonterminal;
	readonly group: AssembledNode;
	readonly directKey?: string;
}

export interface FlattenedSeat extends FlattenSeat {
	readonly keys: readonly FlattenKey[];
}

export function prefixedKey(seat: string, field: string): string {
	return `${seat}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

export function flattenSeatsOf(node: AssembledNode, nodeMap: NodeMap): readonly FlattenedSeat[] {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return [];
	if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return [];
	const found: (FlattenSeat & { readonly fields: readonly string[] })[] = [];
	for (const slot of node.slots) {
		if (isMultiple(slot) || slot.values.length !== 1) continue;
		const value = slot.values[0]!;
		if (!isNodeRef(value)) continue;
		if (value.variant !== undefined) continue;
		const group = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (!(group instanceof AbstractAssembledCompound) || !isHoistedAt(value, group)) continue;
		if (group.rawFactoryName === undefined) continue;
		const shape = classifyFactoryShape(group, nodeMap);
		const direct = shape === 'direct' ? resolveDirectFactorySlot(group, nodeMap) : undefined;
		const fields = shape === 'config' ? configKeysOf(group) : direct === undefined ? undefined : [direct.configKey];
		if (fields === undefined) continue;
		found.push(direct === undefined ? { slot, group, fields } : { slot, group, directKey: direct.configKey, fields });
	}
	const seats = found.map(({ fields, ...seat }) => {
		const taken = new Set([
			...node.slots.filter((other) => other !== seat.slot).map((other) => other.configKey),
			...found.filter((other) => other.slot !== seat.slot).flatMap((other) => other.fields)
		]);
		return { ...seat, keys: fields.map((field) => ({ key: taken.has(field) ? prefixedKey(seat.slot.configKey, field) : field, field })) };
	});
	const claimed = new Map<string, FlattenedSeat>();
	for (const seat of seats) {
		for (const { key, field } of seat.keys) {
			const holder = claimed.get(key);
			if (holder !== undefined || node.slots.some((slot) => slot !== seat.slot && slot.configKey === key)) {
				throw new Error(
					`flattenSeatsOf: '${node.kind}' seats '${seat.group.kind}' in '${seat.slot.propertyName}', and the group's key '${field}' collides with ${holder === undefined ? 'another slot of the parent' : `a key of '${holder.group.kind}'`} even as '${key}'`
				);
			}
			claimed.set(key, seat);
		}
	}
	return seats;
}

export function emittedElementsSeats(
	node: AssembledNode,
	nodeMap: NodeMap,
	kindEntries: readonly KindEnumEntry[] | undefined
): readonly FlattenSeat[] {
	return elementsSeatOf(node, nodeMap).filter(
		(seat) => classifyFactoryEmission(seat.group.kind, seat.group, { nodeMap, kindEntries }) === 'emit'
	);
}

export function elementsSeatOf(node: AssembledNode, nodeMap: NodeMap): readonly FlattenSeat[] {
	if (!isSlotBearingCompound(node)) return [];
	if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return [];
	const seats: FlattenSeat[] = [];
	for (const slot of node.slots) {
		if (!isMultiple(slot) || slot.values.length === 0) continue;
		const groups: AssembledNode[] = [];
		for (const value of slot.values) {
			if (!isNodeRef(value)) continue;
			const child = nodeMap.nodes.get(storageKindOfRef(value.node));
			if (!(child instanceof AbstractAssembledCompound) || !child.seated) continue;
			if (child.rawFactoryName === undefined || classifyFactoryShape(child, nodeMap) !== 'config') continue;
			groups.push(child);
		}
		if (groups.length === 1) seats.push({ slot, group: groups[0]! });
	}
	return seats;
}

export function tupleSeatOf(node: AssembledNode, nodeMap: NodeMap): readonly FlattenSeat[] {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return [];
	if (node.rawFactoryName === undefined || nodeMap.refineForms?.has(node.kind)) return [];
	if (classifyFactoryShape(node, nodeMap) !== 'config') return [];
	const seats: FlattenSeat[] = [];
	for (const slot of node.slots) {
		if (isMultiple(slot) || slot.values.length !== 1) continue;
		const value = slot.values[0]!;
		if (!isNodeRef(value)) continue;
		const group = nodeMap.nodes.get(storageKindOfRef(value.node));
		if (group === undefined || !group.seated) continue;
		if (group.rawFactoryName === undefined) continue;
		const shape = classifyFactoryShape(group, nodeMap);
		if (shape !== 'spread' && shape !== 'elements') continue;
		seats.push({ slot, group });
	}
	return seats;
}

export interface Seat {
	readonly kind: string;
	readonly shape: 'arm' | 'flatten' | 'elements' | 'tuple';
	readonly mount?: string;
	readonly seated?: true;
}

export interface SeatSource {
	readonly subs: readonly SubFactory[];
	readonly flattens?: readonly FlattenSeat[];
	readonly elements?: readonly FlattenSeat[];
	readonly tuples?: readonly FlattenSeat[];
}

export function seatOf(
	parent: AssembledNode,
	slot: AssembledNonterminal,
	value: NodeOrTerminal,
	nodeMap: NodeMap,
	source: SeatSource | undefined
): Seat | undefined {
	if (source === undefined || !isNodeRef(value)) return undefined;
	const child = nodeMap.nodes.get(storageKindOfRef(value.node));
	if (child === undefined || !isHoistedAt(value, child)) return undefined;
	const text = textStorageOf(value, nodeMap)?.text;
	const arm = source.subs.find(
		(e) =>
			e.slot === slot &&
			(e.arm.via === 'node'
				? e.arm.path.length === 0 && e.arm.child === child
				: text !== undefined && e.arm.storage.text === text)
	);
	if (arm !== undefined) {
		return seatsConfigChild(arm, nodeMap)
			? { kind: child.kind, shape: 'arm', mount: arm.name, seated: true }
			: { kind: child.kind, shape: 'arm', mount: arm.name };
	}
	if ((source.flattens ?? []).some((e) => e.slot === slot && e.group === child)) {
		return { kind: child.kind, shape: 'flatten' };
	}
	if ((source.elements ?? []).some((e) => e.slot === slot && e.group === child)) {
		return { kind: child.kind, shape: 'elements' };
	}
	if ((source.tuples ?? []).some((e) => e.slot === slot && e.group === child)) {
		return { kind: child.kind, shape: 'tuple' };
	}
	return undefined;
}

/**
 * True when the forwarded target itself accepts a `repeat`-sourced spread
 * (chasing through a chain of forwards, since a forward can target another
 * forward). Mirrors the `targetOverloads` wrapper in factories.ts: every
 * forwarded factory re-exposes its target's own constructor surface as
 * extra overloads, so a node forwarding to a `'spread'` target inherits
 * that target's variadic overload (the `buildSuiteBlock`-style "bare
 * `Block` or `...children`" pair) even though its own slot is single-valued.
 */
function forwardsToSpreadTarget(node: AssembledNode, nodeMap: NodeMap): boolean {
	const targetKind = forwardedTargetKind(node, nodeMap);
	if (targetKind === null) return false;
	const target = nodeMap.nodes.get(targetKind);
	if (target === undefined) return false;
	const targetShape = classifyFactoryShape(target, nodeMap);
	if (targetShape === 'spread') return true;
	return targetShape === 'forwarded' && forwardsToSpreadTarget(target, nodeMap);
}

/**
 * True when the child's own factory takes the seated value as ONE argument
 * — a config object (`'config'`), a thin single-positional-param wrapper
 * (`'direct'`), or one forwarded to another kind's own single-value factory
 * (`'forwarded'`, provided that target isn't itself variadic —
 * `forwardsToSpreadTarget`). `'spread'` (a `repeat`-sourced slot) and
 * `'elements'` (a separated list) are the only genuinely multi-valued
 * shapes here: `ArgsOf<CF>[0]` on a union of overload tuples would collapse
 * a variadic arm into a bare element type, so those (and forwards that
 * chase down to one) keep spreading a whole argument list instead of
 * seating bare.
 */
export function seatsConfigChild(sub: SubFactory, nodeMap: NodeMap): boolean {
	if (sub.arm.via !== 'node' || sub.arm.path.length !== 0 || sub.merges) return false;
	const child = sub.arm.child;
	const shape = classifyFactoryShape(child, nodeMap);
	if (shape === 'config' || shape === 'direct') return true;
	return shape === 'forwarded' && !forwardsToSpreadTarget(child, nodeMap);
}

export function configKeysOf(node: AssembledNode): readonly string[] {
	return isSlotBearingCompound(node) ? node.slots.map((f) => f.configKey) : [];
}

export function subFactoriesOf(node: AssembledNode, nodeMap: NodeMap, opts: SubFactoryOptions = {}): SubFactorySet {
	return subFactoriesInternal(node, nodeMap, opts.isEmitted ?? DEFAULT_IS_EMITTED, new Set());
}

function armIsConfigShaped(sub: SubFactory, nodeMap: NodeMap, opts: SubFactoryOptions): boolean {
	const arm = sub.arm;
	if (arm.via === 'value') return false;
	if (arm.path.length === 0) return classifyFactoryShape(arm.child, nodeMap) === 'config';
	const nested = subFactoriesOf(arm.child, nodeMap, opts).entries.find((e) => e.name === arm.path[0]);
	if (nested === undefined) return false;
	return armIsConfigShaped(nested, nodeMap, opts);
}

function mergedKeysOf(
	sub: SubFactory,
	nodeMap: NodeMap,
	opts: SubFactoryOptions,
	visiting: ReadonlySet<string>
): readonly string[] {
	const arm = sub.arm as NodeArm;
	if (arm.path.length === 0) return configKeysOf(arm.child);
	if (visiting.has(arm.child.kind)) return [];
	const nested = subFactoriesOf(arm.child, nodeMap, opts).entries.find((e) => e.name === arm.path[0]);
	if (nested === undefined) return [];
	const residualKeys = nested.residual.map((f) => f.configKey);
	return [...residualKeys, ...armConfigKeys(nested, nodeMap, opts, new Set([...visiting, arm.child.kind]))];
}

function sharedKeysOf(
	sub: SubFactory,
	nodeMap: NodeMap,
	opts: SubFactoryOptions,
	visiting: ReadonlySet<string>
): readonly string[] | undefined {
	if (!armIsConfigShaped(sub, nodeMap, opts)) return undefined;
	const residual = new Set(sub.residual.map((f) => f.configKey));
	return mergedKeysOf(sub, nodeMap, opts, visiting).filter((key) => residual.has(key));
}

export function armConfigKeys(
	sub: SubFactory,
	nodeMap: NodeMap,
	opts: SubFactoryOptions = {},
	visiting: ReadonlySet<string> = new Set()
): readonly string[] {
	const arm = sub.arm;
	if (arm.via === 'value') return [];
	if (sub.merges) return mergedKeysOf(sub, nodeMap, opts, visiting);
	if (arm.path.length === 0) return [];
	if (visiting.has(arm.child.kind)) return [];
	const nested = subFactoriesOf(arm.child, nodeMap, opts).entries.find((e) => e.name === arm.path[0]);
	if (nested === undefined) return [];
	const residualKeys = nested.residual.map((f) => f.configKey);
	if (nested.arm.via === 'value') return residualKeys;
	const deeper = nested.arm.path.length > 0 ? armConfigKeys(nested, nodeMap, opts, new Set([...visiting, arm.child.kind])) : [];
	return [...residualKeys, nested.slot.configKey, ...deeper];
}
