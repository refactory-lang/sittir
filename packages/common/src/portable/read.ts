import type { PortableBuildArm, PortableBuildTable, PortableContainer, PortableDecimalParts, PortableMemberStep, PortableSeat, PortableSlotStep } from '@sittir/types';
import { nodeText } from '../node-data.ts';
import { hasKind, type PortableClassifier } from './classify.ts';

type Node = { readonly $type: number };

export interface PortableReadContext {
	readonly table: PortableBuildTable;
	readonly classify: PortableClassifier;
	readonly flagHolds: (value: Node | number, flag: string) => boolean;
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

export function portableReader({ table, classify, flagHolds, textOf }: PortableReadContext): (value: unknown) => unknown {
	interface Pending {
		readonly seat: PortableSeat;
		readonly containers: readonly PortableContainer[];
	}
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
			if (result !== undefined) return Array.isArray(next) ? { ...result, many: true } : result;
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
	const booleanOf = (arms: readonly PortableBuildArm[]): boolean | undefined => {
		for (const arm of arms) for (const test of arm.when) if ('boolean' in test) return test.boolean;
		return undefined;
	};
	const rebuilds = (kind: number, seats: readonly PortableSeat[] | undefined): boolean =>
		seats === undefined || seats.some((seat) => (seat.leaf === undefined ? seat.kinds.length === 0 : (seat.texts ?? []).includes(kind)));
	const read = (value: unknown, seats?: readonly PortableSeat[]): unknown => {
		if (Array.isArray(value)) return value.map((item) => read(item, seats));
		const kind = kindOfValue(value);
		if (kind === undefined) return value;
		const path = classify(typeof value === 'number' ? value : (value as Node));
		const arms = path === undefined ? [] : armsAt(path, kind);
		if (path === undefined || arms.length === 0) return value;
		const truth = booleanOf(arms);
		if (truth !== undefined) return { $path: path, $value: truth };
		if (typeof value === 'number') return value;
		const node = value as Node;
		for (const arm of arms) {
			if (arm.scalar === undefined) continue;
			const scalar = scalarOf(node, arm);
			if (scalar !== undefined) return { $path: path, $value: scalar };
		}
		if (arms.some((arm) => arm.scalar !== undefined)) return node;
		const text = nodeText(node);
		if (text !== undefined) return rebuilds(kind, seats) ? text : node;
		if (arms.every((arm) => arm.members.length === 0 && (arm.seated !== undefined || (arm.builder !== undefined && table.builders[arm.builder] === 'text'))))
			return rebuilds(kind, seats) ? (textOf(node) ?? node) : node;
		const flags = [...new Set(arms.flatMap((arm) => [...Object.keys(arm.flags), ...arm.when.flatMap((test) => ('flag' in test ? [test.flag] : []))]))].filter((flag) =>
			flagHolds(node, flag)
		);
		const structure: Record<string, unknown> = { $path: path, ...(flags.length === 0 ? {} : { $flags: flags }) };
		type Chosen = { readonly value: unknown; readonly member: PortableMemberStep };
		const fitted = new Map<string, Chosen>();
		const carried = new Map<string, Chosen>();
		for (const arm of arms)
			for (const member of arm.members) {
				const found = routeValue(node, member);
				if (found === undefined || found.value === null) continue;
				const held = fitted.get(member.name);
				if (found.fitted && (held === undefined || member.steps.length > held.member.steps.length)) fitted.set(member.name, { value: found.value, member });
				else if (!found.fitted && !carried.has(member.name)) carried.set(member.name, { value: found.value, member });
			}
		for (const name of new Set(arms.flatMap((arm) => arm.members.map((member) => member.name)))) {
			const chosen = fitted.get(name) ?? carried.get(name);
			if (chosen !== undefined) structure[name] = read(chosen.value, chosen.member.seats);
		}
		return structure;
	};
	return read;
}
