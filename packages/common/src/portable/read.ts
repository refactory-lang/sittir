import type { PortableBuildArm, PortableBuildTable, PortableContainer, PortableDecimalParts, PortableMemberStep, PortablePreset, PortableSeat, PortableSlotStep } from '@sittir/types';
import { nodeText } from '../node-data.ts';
import { hasKind, type PortableClassifier } from './classify.ts';

type Node = { readonly $type: number };

export type PortableCarry = { readonly reason: 'unclaimed' | 'scalar' | 'text' | 'preset' } | { readonly reason: 'flags'; readonly flags: readonly string[] };

export type PortableCarried = (node: Node, carry: PortableCarry) => void;

const kept = (node: Node, carry: PortableCarry, carried: PortableCarried | undefined): Node => {
	carried?.(node, carry);
	return node;
};

export interface PortableReadContext {
	readonly table: PortableBuildTable;
	readonly classify: PortableClassifier;
	readonly flagHolds: (value: Node | number, flag: string) => boolean;
	readonly flagsOf: (kind: number) => readonly string[];
	readonly textOf: (value: unknown) => string | undefined;
}

const accessed = (node: object, key: string): unknown => {
	const read = (node as Record<string, unknown>)[key];
	return typeof read === 'function' ? (read as () => unknown).call(node) : read;
};

const present = (value: unknown): boolean => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);

interface Hop {
	readonly key: string;
	readonly builds: string | undefined;
}

const walk = (value: unknown, hops: readonly Hop[]): unknown => {
	if (Array.isArray(value)) return value.flatMap((item) => [walk(item, hops) ?? []].flat());
	let at = value;
	for (let i = 0; i < hops.length; i++) {
		if (Array.isArray(at)) return walk(at, hops.slice(i));
		if (!hasKind(at)) return undefined;
		const next = accessed(at, hops[i]!.key);
		if (next === undefined || next === null) return undefined;
		if (Array.isArray(next) && hops[i]!.builds !== undefined) i++;
		at = next;
	}
	return at;
};

const stepHops = (steps: readonly PortableSlotStep[]): readonly Hop[] => steps.map((step) => ({ key: step.key, builds: step.builder }));


const kindOfValue = (value: unknown): number | undefined => (typeof value === 'number' ? value : hasKind(value) ? value.$type : undefined);

const fits = (seat: PortableSeat, value: unknown): boolean => {
	if (typeof value === 'number') return seat.kinds.length > 0;
	const kind = kindOfValue(value);
	return kind !== undefined && (seat.kinds.includes(kind) || (seat.kinds.length === 0 && seat.leaf !== undefined && nodeText(value) !== undefined));
};

const integerOf = (text: string): number | bigint | undefined => {
	if (!/^(?:0[xXoObB]_?)?[0-9a-fA-F](?:_?[0-9a-fA-F])*$/.test(text)) return undefined;
	try {
		const big = BigInt(text.replaceAll('_', ''));
		return big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big;
	} catch {
		return undefined;
	}
};

const floatOf = (text: string): number | undefined => {
	const digits = text.replace(/(?<=\d)_(?=\d)/g, '');
	if (!/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(digits)) return undefined;
	const value = Number(digits);
	return Number.isFinite(value) ? value : undefined;
};

export function portableReader({ table, classify, flagHolds, flagsOf, textOf }: PortableReadContext): (value: unknown, carried?: PortableCarried) => unknown {
	interface Pending {
		readonly seat: PortableSeat;
		readonly containers: readonly PortableContainer[];
	}
	const held = new WeakMap<object, readonly { readonly member: PortableMemberStep; readonly value: unknown }[]>();
	const heldBy = (container: Node, element: unknown, members: readonly PortableMemberStep[]): void => {
		if (members.length === 0 || element === null || typeof element !== 'object' || Array.isArray(element)) return;
		const values = [...new Map(members.map((member) => [member.name, member])).values()].flatMap((member) => {
			const found = routeValue(container, member);
			return found === undefined || found.value === null ? [] : [{ member, value: found.value }];
		});
		if (values.length > 0) held.set(element, [...(held.get(element) ?? []), ...values]);
	};
	const resolve = (value: unknown, pending: readonly Pending[]): { readonly found: unknown; readonly many: boolean } | undefined => {
		if (Array.isArray(value)) {
			const parts = value.map((item) => resolve(item, pending) ?? { found: item, many: false });
			return { found: parts.flatMap((part) => [part.found].flat()), many: parts.some((part) => part.many) };
		}
		for (const { seat, containers } of pending) if (containers.length === 0 && fits(seat, value)) return { found: value, many: seat.many === true };
		if (!hasKind(value)) return undefined;
		const keys = [...new Set(pending.flatMap(({ containers }) => (containers.length === 0 ? [] : [containers[0]!.key])))];
		let empty = false;
		let vacant = false;
		for (const key of keys) {
			const next = accessed(value, key);
			if (next === undefined || next === null) {
				empty ||= pending.some(({ seat, containers }) => seat.many === true && containers[0]?.key === key);
				vacant ||= key in value;
				continue;
			}
			const advanced = pending.flatMap(({ seat, containers }) => {
				if (containers[0]?.key !== key) return [];
				const rest = containers.slice(1);
				return Array.isArray(next) && rest[0]?.builder !== undefined ? [{ seat, containers: rest }, { seat, containers: rest.slice(1) }] : [{ seat, containers: rest }];
			});
			const result = resolve(next, advanced);
			if (result === undefined) continue;
			if (!Array.isArray(next)) heldBy(value as Node, result.found, pending.flatMap(({ containers }) => (containers[0]?.key === key ? (containers[0].members ?? []) : [])));
			return Array.isArray(next) ? { ...result, many: true } : result;
		}
		return empty ? { found: [], many: true } : vacant ? { found: undefined, many: false } : undefined;
	};
	const seatedIn = (slotted: unknown, member: PortableMemberStep): { readonly found: unknown; readonly many: boolean; readonly fitted?: false } =>
		resolve(
			slotted,
			member.seats.flatMap((seat) => {
				const within = (seat.within ?? []).flatMap((container): PortableContainer[] => [...(container.through ?? []).map((key) => ({ key })), container]);
				return within[0]?.builder === undefined ? [{ seat, containers: within }] : [{ seat, containers: within }, { seat, containers: within.slice(1) }];
			})
		) ?? { found: slotted, many: false, fitted: false };
	const routeValue = (node: Node, member: PortableMemberStep): { readonly value: unknown; readonly fitted: boolean } | undefined => {
		const kept = (item: unknown): boolean => member.reads === undefined || member.reads.includes(kindOfValue(item) ?? -1);
		const walked = walk(node, stepHops(member.steps));
		const slotted = Array.isArray(walked) ? walked.filter(kept) : kept(walked) ? walked : undefined;
		if (!present(slotted)) return undefined;
		const { found, many, fitted } = seatedIn(slotted, member);
		if (found === undefined) return undefined;
		const value = !Array.isArray(found) ? (member.multiple ? [found] : found) : found.length === 0 || member.multiple || many ? found : found[0];
		return { value, fitted: fitted !== false };
	};
	const memberValue = (node: Node, member: PortableMemberStep): unknown => routeValue(node, member)?.value;
	const memberText = (node: Node, arm: PortableBuildArm, name: string): string | undefined => {
		const member = arm.members.find((m) => m.name === name);
		return member === undefined ? undefined : textOf(memberValue(node, member));
	};
	const decimalOf = (node: Node, arm: PortableBuildArm, parts: PortableDecimalParts): number | undefined => {
		const part = (name: string | undefined): string | undefined => (name === undefined ? undefined : memberText(node, arm, name));
		const [integer, fraction, exponent, sign] = [part(parts.integer), part(parts.fraction), part(parts.exponent), part(parts.sign)];
		return floatOf(`${integer ?? '0'}.${fraction ?? '0'}${exponent === undefined ? '' : `e${sign ?? ''}${exponent}`}`);
	};
	const spelledBy = (arm: PortableBuildArm): readonly string[] =>
		arm.numeric === undefined ? [] : typeof arm.numeric === 'string' ? [arm.numeric] : Object.values(arm.numeric);
	const scalarOf = (node: Node, arm: PortableBuildArm): number | bigint | undefined => {
		const others = arm.numeric === undefined ? [] : arm.members.filter((member) => !spelledBy(arm).includes(member.name));
		if (others.some((member) => present(memberValue(node, member)))) return undefined;
		if (typeof arm.numeric === 'object') return decimalOf(node, arm, arm.numeric);
		const text = arm.numeric === undefined ? textOf(node) : memberText(node, arm, arm.numeric);
		if (text === undefined) return undefined;
		return arm.scalar === 'float' ? floatOf(text) : integerOf(text);
	};
	const armsAt = (path: string, kind: number): readonly PortableBuildArm[] => (table.paths[path]?.arms ?? []).filter((arm) => arm.kind === kind);
	const contradicts = (node: Node, preset: PortablePreset): boolean => {
		if ((preset.text === undefined && preset.kind === undefined) || preset.steps.at(-1)?.mounted !== undefined) return false;
		const held = walk(node, stepHops(preset.steps));
		if (held === undefined || Array.isArray(held)) return false;
		if (preset.text !== undefined) {
			const text = textOf(held);
			return text !== undefined && text !== preset.text;
		}
		const kind = kindOfValue(held);
		return kind !== undefined && kind !== preset.kind;
	};
	const booleanOf = (arms: readonly PortableBuildArm[]): boolean | undefined => {
		for (const arm of arms) for (const test of arm.when) if ('boolean' in test) return test.boolean;
		return undefined;
	};
	const rebuilds = (kind: number, seats: readonly PortableSeat[] | undefined): boolean =>
		seats === undefined || seats.some((seat) => (seat.leaf === undefined ? seat.kinds.length === 0 : (seat.texts ?? []).includes(kind)));
	const read = (value: unknown, carried: PortableCarried | undefined, seats?: readonly PortableSeat[]): unknown => {
		if (Array.isArray(value)) return value.map((item) => read(item, carried, seats));
		const kind = kindOfValue(value);
		if (kind === undefined) return value;
		const path = classify(typeof value === 'number' ? value : (value as Node));
		const claimed = path === undefined ? [] : armsAt(path, kind);
		if (path === undefined || claimed.length === 0) return typeof value === 'number' ? value : kept(value as Node, { reason: 'unclaimed' }, carried);
		const arms = typeof value === 'number' ? claimed : claimed.filter((arm) => !arm.presets.some((preset) => contradicts(value as Node, preset)));
		if (arms.length === 0) return kept(value as Node, { reason: 'preset' }, carried);
		const truth = booleanOf(arms);
		if (truth !== undefined) return { $path: path, $value: truth };
		if (typeof value === 'number') return value;
		const node = value as Node;
		for (const arm of arms) {
			if (arm.scalar === undefined) continue;
			const scalar = scalarOf(node, arm);
			if (scalar !== undefined) return { $path: path, $value: scalar };
		}
		if (arms.some((arm) => arm.scalar !== undefined)) return kept(node, { reason: 'scalar' }, carried);
		const text = nodeText(node);
		if (text !== undefined) return rebuilds(kind, seats) ? text : kept(node, { reason: 'text' }, carried);
		if (arms.every((arm) => arm.members.length === 0 && (arm.seated !== undefined || (arm.builder !== undefined && table.builders[arm.builder] === 'text'))))
			return (rebuilds(kind, seats) ? textOf(node) : undefined) ?? kept(node, { reason: 'text' }, carried);
		const buildable = new Set(arms.flatMap((arm) => [...Object.keys(arm.flags), ...arm.when.flatMap((test) => ('flag' in test ? [test.flag] : []))]));
		const unbuilt = flagsOf(kind).filter((flag) => !buildable.has(flag) && flagHolds(node, flag));
		if (unbuilt.length > 0) return kept(node, { reason: 'flags', flags: unbuilt }, carried);
		const flags = [...buildable].filter((flag) => flagHolds(node, flag));
		const structure: Record<string, unknown> = { $path: path, ...(flags.length === 0 ? {} : { $flags: flags }) };
		type Chosen = { readonly value: unknown; readonly member: PortableMemberStep; readonly fitted: boolean };
		const candidates = new Map<string, Chosen[]>();
		for (const arm of arms)
			for (const member of arm.members) {
				const found = routeValue(node, member);
				if (found === undefined || found.value === null) continue;
				const list = candidates.get(member.name) ?? candidates.set(member.name, []).get(member.name)!;
				list.push({ value: found.value, member, fitted: found.fitted });
			}
		for (const list of candidates.values()) list.sort((a, b) => Number(b.fitted) - Number(a.fitted) || (a.fitted ? b.member.steps.length - a.member.steps.length : 0));
		const met = (member: PortableMemberStep, names: ReadonlySet<string>): boolean => (member.requires ?? []).every((group) => group.some((name) => names.has(name)));
		let chosen = new Map<string, Chosen>();
		for (let names: ReadonlySet<string> = new Set(candidates.keys()); ; ) {
			chosen = new Map([...candidates].flatMap(([name, list]) => {
				const pick = list.find((candidate) => met(candidate.member, names));
				return pick === undefined ? [] : [[name, pick] as const];
			}));
			if (chosen.size === names.size) break;
			names = new Set(chosen.keys());
		}
		for (const name of new Set(arms.flatMap((arm) => arm.members.map((member) => member.name)))) {
			const pick = chosen.get(name);
			if (pick !== undefined) structure[name] = read(pick.value, carried, pick.member.seats);
		}
		for (const { member, value } of held.get(node) ?? []) if (!(member.name in structure)) structure[member.name] = read(value, carried, member.seats);
		return structure;
	};
	return (value, carried) => read(value, carried);
}
