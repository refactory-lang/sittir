import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableCallShape,
	PortableContainer,
	PortableDecimalParts,
	PortableKeyedMount,
	PortableMemberStep,
	PortableMount,
	PortablePickTest,
	PortablePreset,
	PortableSeat,
	PortableSlotStep,
	PortableStructure,
	PortableValueBuild
} from '@sittir/types';
import { hasKind } from './classify.ts';

export interface PortableBuildContext {
	readonly language: string;
	readonly table: PortableBuildTable;
	readonly builders: object;
	readonly kindName: (kind: number) => string | undefined;
	readonly readsAs: (path: string, node: { readonly $type: number }) => boolean;
}

type Builder = (...input: readonly unknown[]) => unknown;

interface Picked {
	readonly arm: PortableBuildArm;
	readonly seat: PortableSeat | undefined;
}

interface Built {
	readonly value: unknown;
	readonly seat: PortableSeat | undefined;
}

interface Placed {
	readonly value: unknown;
	readonly mount?: PortableContainer;
	readonly key?: string;
}

interface Reached {
	readonly frame: Frame;
	readonly reached: number;
}

class Frame {
	readonly config: Record<string, unknown> = {};
	readonly presets = new Set<string>();
	input: unknown;
	mount: string | undefined;
	seated: PortableCallShape | undefined;
	listed = false;
	constructor(
		public builder: string | undefined,
		public form?: PortableKeyedMount,
		readonly parent?: Frame
	) {}
}

const nests = (mount: string, outer: string): boolean => mount === outer || mount.startsWith(`${outer}.`);

const mounts = (frame: Frame, mount: string): boolean => frame.mount !== undefined && nests(frame.mount, mount);

const mountable = (frame: Frame, mount: string): boolean =>
	frame.form === undefined && (frame.mount === undefined || nests(frame.mount, mount) || nests(mount, frame.mount));

const mountOnto = (frame: Frame, mount: string): void => {
	if (frame.mount === undefined || nests(mount, frame.mount)) frame.builder = frame.mount = mount;
};

const isStructure = (value: unknown): value is PortableStructure =>
	typeof value === 'object' && value !== null && typeof (value as { readonly $path?: unknown }).$path === 'string';

const listOf = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : [value]);

const argsOf = (shape: PortableCallShape | undefined, input: unknown): readonly unknown[] => {
	switch (shape) {
		case 'config':
			return [input ?? {}];
		case 'constant':
			return [];
		case 'spread':
		case 'elements':
		case 'forwarded':
			return input === undefined ? [] : listOf(input);
		default:
			return input === undefined ? [] : [input];
	}
};

const within = (seat: PortableSeat): readonly PortableContainer[] => seat.within ?? [];

const sameContainer = (a: PortableContainer, b: PortableContainer): boolean => a.builder === b.builder && a.key === b.key;

const flattened = (containers: readonly PortableContainer[]): { readonly key?: string; readonly containers: readonly PortableContainer[] } => {
	const kept: PortableContainer[] = [];
	let key: string | undefined;
	for (const container of containers) {
		if (container.flatten !== true) kept.push(container);
		else if (kept.length === 0) key = container.key;
		else kept.push({ ...kept.pop()!, key: container.key });
	}
	return key === undefined ? { containers: kept } : { key, containers: kept };
};

const extending = (seats: readonly PortableSeat[], base: PortableSeat): readonly PortableSeat[] => {
	const prefix = within(base);
	return seats.filter((seat) => within(seat).length >= prefix.length && prefix.every((container, i) => sameContainer(container, within(seat)[i]!)));
};

const sameSteps = (a: PortableMemberStep, b: PortableMemberStep): boolean =>
	a.steps.length === b.steps.length && a.steps.every((step, i) => step.key === b.steps[i]!.key && step.builder === b.steps[i]!.builder);

const furthest = <T extends { readonly reached: number }>(routes: readonly T[]): T | undefined =>
	routes.reduce<T | undefined>((best, route) => (best === undefined || route.reached > best.reached ? route : best), undefined);

const memberKeys = (structure: PortableStructure): readonly string[] => Object.keys(structure).filter((key) => !key.startsWith('$'));

const routeText = (steps: readonly PortableSlotStep[]): string => steps.map((step) => step.key).join('.');

const scalarOf = (structure: PortableStructure): number | bigint | undefined =>
	typeof structure.$value === 'number' || typeof structure.$value === 'bigint' ? structure.$value : undefined;

const integral = (value: number | bigint): boolean => typeof value === 'bigint' || Number.isSafeInteger(value);

const spelledValue = (value: PortableStructure['$value']): string =>
	typeof value === 'string' ? `"${value}"` : typeof value === 'bigint' ? `${value}n` : Object.is(value, -0) ? '-0' : String(value);

export function portableBuilder({ language, table, builders, kindName, readsAs }: PortableBuildContext): (structure: PortableStructure) => unknown {
	const nameOf = (kind: number): string => kindName(kind) ?? `kind ${kind}`;
	const builderAt = (key: string): Builder => {
		const builder = key.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown> | undefined)?.[segment], builders);
		if (typeof builder !== 'function') throw new Error(`portable build: the ${language} strict table has no builder ${key}`);
		return builder as Builder;
	};
	const takesConfig = (key: string): boolean => table.builders[key] === 'config';
	const call = (key: string, input: unknown, options?: Readonly<Record<string, unknown>>): unknown => {
		const args = argsOf(table.builders[key], input);
		if (options === undefined) return builderAt(key)(...args);
		if (args.length > 1) throw new Error(`portable build: ${key} takes its input as a list, so it takes no options`);
		return builderAt(key)(args[0], options);
	};
	const sole = (config: Readonly<Record<string, unknown>>): unknown => {
		const values = Object.values(config);
		return values.length === 0 ? undefined : values.length === 1 ? values[0] : config;
	};
	const configOf = (frame: Frame): Record<string, unknown> =>
		Object.fromEntries(
			Object.entries(frame.config).map(([key, value]) => [key, value instanceof Frame ? (value.listed ? [materialize(value)] : materialize(value)) : value])
		);
	const shapeOf = (frame: Frame): PortableCallShape | undefined => (frame.builder === undefined ? (frame.form?.seats ?? frame.seated) : table.builders[frame.builder]);
	const inputFrom = (frame: Frame, config: Readonly<Record<string, unknown>>): unknown => (shapeOf(frame) === 'config' ? config : sole(config));
	const inputOf = (frame: Frame): unknown => (frame.input !== undefined ? frame.input : inputFrom(frame, configOf(frame)));
	const builtFrom = (frame: Frame, builder: string): unknown => {
		const keys = table.options?.[builder] ?? [];
		if (frame.input !== undefined || keys.length === 0) return call(builder, inputOf(frame));
		const config = configOf(frame);
		const options = Object.fromEntries(keys.flatMap((key) => (config[key] === undefined ? [] : [[key, config[key]]])));
		const input = inputFrom(frame, Object.fromEntries(Object.entries(config).filter(([key]) => !keys.includes(key))));
		return call(builder, input, Object.keys(options).length === 0 ? undefined : options);
	};
	const materialize = (frame: Frame): unknown => {
		if (frame.builder !== undefined) return builtFrom(frame, frame.builder);
		if (frame.form === undefined) return frame.seated === undefined ? inputOf(frame) : argsOf(frame.seated, inputOf(frame));
		const args = argsOf(frame.form.seats, inputOf(frame));
		return frame.form.call === 'keyed' ? args[0] : args;
	};
	const wrap = (value: unknown, containers: readonly PortableContainer[], fill?: (container: PortableContainer) => Readonly<Record<string, unknown>>): unknown =>
		containers.reduceRight<unknown>((inner, container) => {
			const filled = fill?.(container) ?? {};
			if (container.builder === undefined) return Object.keys(filled).length === 0 ? inner : { [container.key]: inner, ...filled };
			if (!takesConfig(container.builder)) {
				if (Object.keys(filled).length > 0) throw new Error(`portable build: ${container.builder} takes its element alone, so it holds none of ${Object.keys(filled).join(', ')}`);
				return call(container.builder, inner);
			}
			return call(container.builder, { [container.key]: inner, ...filled });
		}, value);
	const wrapEmpty = (containers: readonly PortableContainer[]): unknown => {
		const stop = containers.findIndex((container) => container.optional === true);
		if (stop < 0) return wrap([], containers);
		const left = containers[stop]!;
		return wrap(left.builder === undefined ? undefined : call(left.builder, undefined), containers.slice(0, stop));
	};
	const seated = (value: unknown, all: readonly PortableContainer[], empty: boolean, fill?: (container: PortableContainer) => Readonly<Record<string, unknown>>): Placed => {
		const [head, ...after] = all;
		const { key, containers } = flattened(head?.mounted === undefined ? all : after);
		const placed = { value: empty ? (containers.length === 0 && head?.mounted !== undefined ? undefined : wrapEmpty(containers)) : wrap(value, containers, fill) };
		const keyed = key === undefined ? placed : { ...placed, key };
		return head?.mounted === undefined ? keyed : { ...keyed, mount: head };
	};
	const patterns = new WeakMap<NonNullable<PortableSeat['pattern']>, RegExp>();
	const spells = (seat: PortableSeat, text: string): boolean => {
		if (seat.pattern === undefined) return true;
		const regex = patterns.get(seat.pattern) ?? patterns.set(seat.pattern, new RegExp(seat.pattern.source, seat.pattern.flags)).get(seat.pattern)!;
		return regex.test(text);
	};

	return (root: PortableStructure): unknown => {
		const picks = new WeakMap<object, Map<readonly PortableSeat[] | undefined, Picked | undefined>>();
		const leaves = new Map<string, Map<string, unknown>>();
		const leafOf = (leaf: string, text: string): unknown => {
			const built = leaves.get(leaf) ?? leaves.set(leaf, new Map()).get(leaf)!;
			if (!built.has(text)) built.set(text, call(leaf, text));
			return built.get(text);
		};
		const ownPath = (name: string): PortableBuildPath | undefined => (Object.hasOwn(table.paths, name) ? table.paths[name] : undefined);
		const valueBuildOf = (structure: PortableStructure): PortableValueBuild | undefined =>
			table.values !== undefined && Object.hasOwn(table.values, structure.$path) ? table.values[structure.$path] : undefined;
		const valueKeyOf = (value: PortableStructure['$value'], build: PortableValueBuild): keyof PortableValueBuild | undefined => {
			if (typeof value === 'boolean') return value ? 'true' : 'false';
			if (typeof value === 'bigint') return 'integer';
			if (typeof value !== 'number') return undefined;
			return Number.isSafeInteger(value) && build.integer !== undefined ? 'integer' : 'float';
		};
		const pathOf = (structure: PortableStructure): PortableBuildPath | undefined => {
			const own = ownPath(structure.$path);
			const build = valueBuildOf(structure);
			if ((own !== undefined && own.arms.length > 0) || build === undefined) return own;
			const key = valueKeyOf(structure.$value, build);
			const target = key === undefined ? undefined : build[key];
			return target === undefined ? own : ownPath(target);
		};
		const builtPathOf = (structure: PortableStructure): PortableBuildPath => {
			const path = pathOf(structure);
			if (path !== undefined) return path;
			const build = valueBuildOf(structure);
			if (build !== undefined && structure.$value !== undefined)
				throw new Error(`portable build: ${structure.$path} builds only ${Object.keys(build).join(' and ')} values in ${language}, not ${spelledValue(structure.$value)}`);
			throw new Error(`portable build: ${structure.$path} is not a path ${language} builds`);
		};
		const slotsOf = (seats: readonly PortableSeat[]): string => [...new Set(seats.map(({ at: [holder, key] }) => `${nameOf(holder)}.${key}`))].sort().join(', ');
		const ownedBy = (seat: PortableSeat): ReadonlySet<string> => new Set(within(seat).flatMap((container) => (container.members ?? []).map((member) => member.name)));
		const seatOf = (arm: PortableBuildArm, seats: readonly PortableSeat[], structure?: PortableStructure): PortableSeat | undefined => {
			const fitting = seats.filter(
				(seat) =>
					(arm.holders === undefined || arm.holders.some(([holder, key]) => holder === seat.at[0] && key === seat.at[1])) &&
					seat.kinds.includes(arm.kind)
			);
			if (structure === undefined || fitting.length < 2) return fitting[0];
			const stated = memberKeys(structure).filter((name) => structure[name] !== undefined && fitting.some((seat) => ownedBy(seat).has(name)));
			return fitting.find((seat) => stated.every((name) => ownedBy(seat).has(name))) ?? fitting[0];
		};
		const leafSeatOf = (value: string, seats: readonly PortableSeat[]): PortableSeat | undefined =>
			seats.find((seat) => seat.leaf !== undefined && spells(seat, value)) ?? seats.find((seat) => seat.leaf !== undefined);
		const textOf = (value: string, seats: readonly PortableSeat[]): unknown => {
			const leaf = leafSeatOf(value, seats)?.leaf;
			return leaf === undefined ? value : leafOf(leaf, value);
		};
		const kindOf = (value: unknown, member: PortableMemberStep): number | undefined => {
			if (isStructure(value)) return pick(value, member.seats)?.arm.kind;
			const placed = typeof value === 'string' ? textOf(value, member.seats) : value;
			return hasKind(placed) ? placed.$type : typeof placed === 'number' ? placed : undefined;
		};
		const passes = (test: PortablePickTest, arm: PortableBuildArm, structure: PortableStructure): boolean => {
			if ('absent' in test) return test.required.every((name) => structure[name] !== undefined) && test.absent.every((name) => structure[name] === undefined);
			if ('flag' in test) return (structure.$flags ?? []).includes(test.flag) === test.set;
			if ('text' in test) return structure.$value === test.text;
			if ('boolean' in test) return structure.$value === test.boolean;
			if ('variant' in test) return spelledBy(arm, structure);
			const value = structure[test.member];
			if (value === undefined) return true;
			const member = arm.members.find((m) => m.name === test.member);
			return member !== undefined && listOf(value).every((item) => test.kinds.includes(kindOf(item, member) ?? -1));
		};
		const withoutOwned = (structure: PortableStructure, seat: PortableSeat | undefined): PortableStructure => {
			const owned = seat === undefined ? undefined : ownedBy(seat);
			return owned === undefined || owned.size === 0 ? structure : (Object.fromEntries(Object.entries(structure).filter(([key]) => !owned.has(key))) as PortableStructure);
		};
		const pick = (structure: PortableStructure, seats: readonly PortableSeat[] | undefined): Picked | undefined => {
			const memo = picks.get(structure) ?? picks.set(structure, new Map()).get(structure)!;
			if (memo.has(seats)) return memo.get(seats);
			memo.set(seats, undefined);
			const open = (pathOf(structure)?.arms ?? []).flatMap((arm): Picked[] => {
				const seat = seats === undefined ? undefined : seatOf(arm, seats, structure);
				return (seats === undefined ? arm.holders !== undefined : seat === undefined) ? [] : [{ arm, seat }];
			});
			const scalar = scalarOf(structure);
			const scalars = scalar === undefined ? [] : open.filter(({ arm }) => arm.scalar !== undefined);
			const picked =
				scalars.length > 0
					? (scalars.find(({ arm }) => arm.scalar === (integral(scalar!) ? 'integer' : 'float')) ?? scalars[0])
					: open.find(({ arm, seat }) => arm.when.every((test) => passes(test, arm, withoutOwned(structure, seat))));
			memo.set(seats, picked);
			return picked;
		};
		const refuse = (structure: PortableStructure, path: PortableBuildPath, seats: readonly PortableSeat[] | undefined): never => {
			if (path.arms.length === 0)
				throw new Error(`portable build: ${structure.$path} does not build in ${language}: no member or preset of it fills a slot its kind requires`);
			if (seats === undefined && !path.root) {
				const holders = [...new Set(path.arms.flatMap((arm) => (arm.holders ?? []).map(([holder]) => nameOf(holder))))].sort();
				throw new Error(`portable build: ${structure.$path} has no root build in ${language}; it builds in a holder slot of ${holders.join(', ')}`);
			}
			if (seats !== undefined && !path.arms.some((arm) => seatOf(arm, seats) !== undefined))
				throw new Error(`portable build: no ${language} form of ${structure.$path} sits in ${slotsOf(seats)}`);
			const members = memberKeys(structure);
			const flags = structure.$flags ?? [];
			const stated = [
				...(structure.$value === undefined ? [] : [`value ${spelledValue(structure.$value)}`]),
				...(members.length === 0 && structure.$value === undefined ? ['no members'] : members.length === 0 ? [] : [`members ${members.join(', ')}`]),
				...(flags.length === 0 ? [] : [`flags ${flags.join(', ')}`])
			];
			throw new Error(`portable build: no ${language} form of ${structure.$path} builds this structure (${stated.join(', ')})`);
		};

		const enter = (frame: Frame, builder: string, mounted: PortableMount, create: boolean): Reached | undefined => {
			const formed: (readonly [Frame, PortableKeyedMount])[] = [];
			let host = frame;
			for (let outer = mounted.outer; outer !== undefined; outer = outer.outer) {
				if (host.form?.key !== outer.key || host.parent === undefined) return undefined;
				formed.push([host, outer]);
				host = host.parent;
			}
			if (!mountable(host, builder)) return undefined;
			const entered = mounts(host, builder) ? 1 : 0;
			const superseded = entered === 0 && frame.presets.has(mounted.key);
			if (create) {
				mountOnto(host, builder);
				if (host.mount === builder) for (const [at, outer] of formed) at.form = outer;
				if (superseded) {
					delete frame.config[mounted.key];
					frame.presets.delete(mounted.key);
				}
			}
			if (mounted.call !== 'keyed' && mounted.call !== 'keyedArgs') return { frame, reached: entered };
			const held = superseded ? undefined : frame.config[mounted.key];
			if (held !== undefined) {
				if (!(held instanceof Frame) || held.form === undefined) return undefined;
				if (create && host.mount === builder) held.form = mounted;
				return { frame: held, reached: 1 };
			}
			const made = new Frame(undefined, mounted, frame);
			if (create) frame.config[mounted.key] = made;
			return { frame: made, reached: entered };
		};
		const descend = (frame: Frame, steps: readonly PortableSlotStep[], create: boolean): Reached | undefined => {
			let at = frame;
			let reached = 0;
			for (const step of steps) {
				if (step.flatten === true) continue;
				if (step.mounted !== undefined) {
					const entered = enter(at, step.builder!, step.mounted, create);
					if (entered === undefined) return undefined;
					at = entered.frame;
					reached += entered.reached;
					continue;
				}
				const next = at.config[step.key];
				if (next === undefined) {
					if (!create) return { frame: at, reached };
					const made = new Frame(step.builder);
					made.seated = step.seated;
					made.listed = step.many === true;
					at.config[step.key] = made;
					at = made;
					continue;
				}
				if (!(next instanceof Frame) || (next.mount === undefined && next.builder !== step.builder)) return undefined;
				at = next;
				reached++;
			}
			return { frame: at, reached };
		};
		const ownerOf = (frame: Frame, steps: readonly PortableSlotStep[], path: string): Frame => {
			const owner = descend(frame, steps, true);
			if (owner === undefined) throw new Error(`portable build: ${path} routes two values through ${routeText(steps)}`);
			return owner.frame;
		};
		const set = (frame: Frame, key: string, value: unknown, path: string): void => {
			const held = frame.config[key];
			if (held instanceof Frame) {
				if (held.input !== undefined || Object.keys(held.config).length > 0) throw new Error(`portable build: ${path} sets ${key} twice`);
				if (held.mount === undefined && hasKind(value)) frame.config[key] = value;
				else held.input = value;
			} else if (frame.presets.delete(key) && !Array.isArray(held) && !Array.isArray(value)) frame.config[key] = value;
			else frame.config[key] = held === undefined ? value : [...listOf(held), ...listOf(value)];
		};
		const mountOn = (frame: Frame, placed: Placed, path: string): void => {
			const head = placed.mount!;
			const target = frame.input === undefined ? enter(frame, head.builder!, head.mounted!, true) : undefined;
			if (target === undefined) throw new Error(`portable build: ${path} builds ${head.builder} beside other members`);
			if (placed.value !== undefined) set(target.frame, placed.key ?? head.key, placed.value, path);
		};
		const preset = (frame: Frame, step: PortablePreset, path: string): void => {
			const last = step.steps.at(-1)!;
			if (last.mounted !== undefined) {
				ownerOf(frame, step.steps, path);
				return;
			}
			const owner = ownerOf(frame, step.steps.slice(0, -1), path);
			if (step.builder === undefined || step.text !== undefined) {
				const fixed = step.builder !== undefined && step.text !== undefined ? leafOf(step.builder, step.text) : (step.kind ?? step.text);
				const held = owner.config[last.key];
				owner.config[last.key] = held === undefined ? fixed : [...listOf(held), fixed];
				owner.presets.add(last.key);
			}
			else if (owner.config[last.key] === undefined) owner.config[last.key] = new Frame(step.builder);
		};

		const element = (value: unknown, member: PortableMemberStep, seats: readonly PortableSeat[], depth: number): Placed => {
			if (isStructure(value)) {
				const built = build(value, seats);
				const fill = (container: PortableContainer): Readonly<Record<string, unknown>> =>
					Object.fromEntries(
						(container.members ?? []).flatMap((owned) => {
							const held = value[owned.name];
							if (held === undefined) return [];
							if (owned.steps.length !== 1) throw new Error(`portable build: ${value.$path}'s ${owned.name} sits ${owned.steps.length} steps into ${container.builder}`);
							return [[owned.steps[0]!.key, unmounted(valueOf(held, owned, value.$path), owned, value.$path)]];
						})
					);
				return seated(built.value, within(built.seat ?? seats[0]!).slice(depth), false, fill);
			}
			if (typeof value === 'string') {
				const seat = leafSeatOf(value, seats) ?? seats[0]!;
				return seated(textOf(value, [seat]), within(seat).slice(depth), false);
			}
			const kind = hasKind(value) ? value.$type : typeof value === 'number' ? value : undefined;
			const seat = seats.find((s) => kind !== undefined && s.kinds.includes(kind)) ?? seats[0]!;
			return seated(value, within(seat).slice(depth), false);
		};
		const unmounted = (placed: Placed, member: PortableMemberStep, path: string): unknown => {
			if (placed.mount !== undefined) throw new Error(`portable build: ${path}'s ${member.name} holds many values, each built through ${placed.mount.builder}`);
			if (placed.key !== undefined) throw new Error(`portable build: ${path}'s ${member.name} holds many values, each flattened into its holder's ${placed.key}`);
			return placed.value;
		};
		const valueOf = (value: unknown, member: PortableMemberStep, path: string): Placed => {
			if (member.multiple) return { value: listOf(value).map((item) => unmounted(element(item, member, member.seats, 0), member, path)) };
			if (!Array.isArray(value)) return element(value, member, member.seats, 0);
			const lists = member.seats.filter((seat) => seat.many === true);
			const list = lists.find((seat) => value.every((item) => seatsIn(extending(member.seats, seat), item))) ?? lists[0]!;
			const depth = within(list).length;
			const items = value.map((item) => unmounted(element(item, member, extending(member.seats, list), depth), member, path));
			return seated(items, within(list), items.length === 0);
		};
		const placeMember = (frame: Frame, member: PortableMemberStep, value: unknown, path: string): void => {
			const stop = Array.isArray(value) && value.length === 0 ? member.steps.findIndex((step) => step.optional === true) : -1;
			if (stop >= 0) {
				descend(frame, member.steps.slice(0, stop), true);
				return;
			}
			const owner = ownerOf(frame, member.steps.slice(0, -1), path);
			const key = member.steps.at(-1)!.key;
			const held = owner.config[key];
			if (typeof value === 'string' && held instanceof Frame && held.builder !== undefined) return set(owner, key, value, path);
			const placed = valueOf(value, member, path);
			if (placed.mount !== undefined) mountOn(owner, placed, path);
			else set(owner, placed.key ?? key, placed.value, path);
		};
		const spelledParts = (spelling: string, parts: PortableDecimalParts, arm: PortableBuildArm): ReadonlyMap<string, string> | undefined => {
			const [, integer, fraction, sign, exponent] = /^(\d+)(?:\.(\d+))?(?:e([+-])(\d+))?$/.exec(spelling) ?? [];
			if (integer === undefined) return undefined;
			const out = new Map<string, string>();
			if (parts.integer !== undefined) out.set(parts.integer, integer);
			else if (integer !== '0') return undefined;
			if (parts.fraction !== undefined) out.set(parts.fraction, fraction ?? '0');
			else if (fraction !== undefined) return undefined;
			const required = parts.exponent !== undefined && arm.members.find((m) => m.name === parts.exponent)?.steps.every((step) => step.optional !== true) === true;
			const written = exponent ?? (required ? '0' : undefined);
			if (written === undefined) return out;
			if (parts.exponent === undefined) return undefined;
			out.set(parts.exponent, written);
			if (parts.marker !== undefined) out.set(parts.marker, 'e');
			if (sign !== '-') return out;
			if (parts.sign === undefined) return undefined;
			out.set(parts.sign, '-');
			return out;
		};
		const decimalParts = (value: number | bigint, parts: PortableDecimalParts, arm: PortableBuildArm, path: string): ReadonlyMap<string, string> => {
			const spellings = [String(value), ...(typeof value === 'number' && parts.exponent !== undefined ? [value.toExponential()] : [])];
			for (const spelling of spellings) {
				const out = spelledParts(spelling, parts, arm);
				if (out !== undefined) return out;
			}
			throw new Error(`portable build: ${path} builds a ${nameOf(arm.kind)} in ${language}, which cannot spell ${spelledValue(value)}`);
		};
		const takesList = (route: PortableMemberStep): boolean => route.multiple || route.seats.some((seat) => seat.many === true);
		const seatsIn = (offered: readonly PortableSeat[], item: unknown): boolean =>
			isStructure(item)
				? pick(item, offered) !== undefined
				: typeof item === 'string'
					? offered.some((seat) => (seat.leaf !== undefined || seat.kinds.length === 0) && spells(seat, item))
					: !hasKind(item) || offered.some((seat) => seat.kinds.includes(item.$type));
		const seats = (route: PortableMemberStep, item: unknown): boolean => seatsIn(route.seats, item);
		const admits = (route: PortableMemberStep, value: unknown): boolean =>
			Array.isArray(value) ? takesList(route) && value.every((item) => seats(route, item)) : seats(route, value);
		const refuseValue = (path: string, name: string, value: unknown, routes: readonly PortableMemberStep[]): never => {
			const offered = routes.flatMap((route) => route.seats);
			if (Array.isArray(value) && !routes.some(takesList)) throw new Error(`portable build: ${path}'s ${name} holds one value, not a list`);
			const item = listOf(value).find((candidate) => !routes.some((route) => seats(route, candidate)));
			if (isStructure(item)) refuse(item, builtPathOf(item), offered);
			const what = typeof item === 'string' ? `the text "${item}"` : hasKind(item) ? `a ${nameOf(item.$type)}` : 'these values';
			throw new Error(`portable build: ${path}'s ${name} has no route that seats ${what}; it sits in ${slotsOf(offered)}`);
		};
		const routesOf = (arm: PortableBuildArm, name: string): readonly PortableMemberStep[] =>
			arm.members.filter((member, i) => member.name === name && !arm.members.slice(0, i).some((other) => other.name === name && sameSteps(other, member)));
		const spelledBy = (arm: PortableBuildArm, structure: PortableStructure): boolean =>
			arm.members.every(({ name }) => {
				const texts = listOf(structure[name]).filter((item) => typeof item === 'string');
				return texts.length === 0 || routesOf(arm, name).some((route) => texts.every((text) => seats(route, text)));
			});
		const templated = (arm: PortableBuildArm, structure: PortableStructure): string | undefined => {
			const template = arm.template;
			if (template === undefined || structure[template.member] !== undefined) return undefined;
			let at = 0;
			return template.pattern.replaceAll('${string}', () => {
				const hole = template.holes[at++]!;
				const filled = structure[hole];
				if (typeof filled !== 'string') throw new Error(`portable build: ${structure.$path} spells ${template.member} from ${hole}, which is missing`);
				return filled;
			});
		};

		const build = (structure: PortableStructure, seats: readonly PortableSeat[] | undefined): Built => {
			const path = builtPathOf(structure);
			const { arm, seat } = pick(structure, seats) ?? refuse(structure, path, seats);
			const top = new Frame(arm.builder);
			const frame = arm.mounted === undefined ? top : enter(top, arm.builder!, arm.mounted, true)?.frame;
			if (frame === undefined) throw new Error(`portable build: ${structure.$path} builds through ${arm.builder}, which seats ${nameOf(arm.kind)} in a holder it has none of`);
			for (const step of arm.presets) preset(frame, step, structure.$path);
			for (const flag of structure.$flags ?? []) {
				const steps = arm.flags[flag];
				if (steps === undefined && !arm.when.some((test) => 'flag' in test && test.flag === flag && test.set))
					throw new Error(`portable build: ${structure.$path}: ${flag} is not a flag of ${nameOf(arm.kind)}`);
				for (const step of steps?.presets ?? []) preset(frame, step, structure.$path);
			}
			for (const [flag, steps] of Object.entries(arm.flags))
				if (!(structure.$flags ?? []).includes(flag)) for (const step of steps.unset ?? []) preset(frame, step, structure.$path);
			const holes = new Set(arm.template?.holes ?? []);
			const owned = seat === undefined ? new Set<string>() : ownedBy(seat);
			const values = new Map<string, unknown>(
				memberKeys(structure).flatMap((name) => (holes.has(name) || owned.has(name) || structure[name] === undefined ? [] : [[name, structure[name]] as const]))
			);
			const spelled = templated(arm, structure);
			if (spelled !== undefined) values.set(arm.template!.member, spelled);
			const scalar = scalarOf(structure);
			if (arm.scalar !== undefined && scalar !== undefined) {
				if (typeof scalar === 'number' && !Number.isFinite(scalar)) throw new Error(`portable build: ${structure.$path}: no ${language} literal spells ${spelledValue(scalar)}`);
				if (scalar < 0 || Object.is(scalar, -0))
					throw new Error(`portable build: ${structure.$path}: ${nameOf(arm.kind)} spells no sign, so it cannot build ${spelledValue(scalar)}; build the negation of its magnitude`);
				if (arm.scalar === 'float' ? typeof scalar === 'bigint' : !integral(scalar))
					throw new Error(
						`portable build: ${structure.$path} takes ${arm.scalar === 'float' ? 'a float (a number)' : 'an integer (a safe integer or a bigint)'} in ${language}, not ${spelledValue(scalar)}`
					);
				const spelling = arm.numeric === undefined ? [] : typeof arm.numeric === 'string' ? [arm.numeric] : Object.values(arm.numeric);
				const stated = spelling.filter((name) => values.has(name));
				if (stated.length > 0)
					throw new Error(`portable build: ${structure.$path}: $value ${spelledValue(scalar)} spells ${stated.join(' and ')}; state the $value or ${stated.length === 1 ? 'that member' : 'those members'}, not both`);
				if (arm.numeric === undefined) frame.input = scalar;
				else if (typeof arm.numeric === 'string') values.set(arm.numeric, scalar);
				else for (const [name, part] of decimalParts(scalar, arm.numeric, arm, structure.$path)) values.set(name, part);
			}
			const routed = [...values.keys()].map((name) => {
				const routes = routesOf(arm, name);
				if (routes.length === 0) throw new Error(`portable build: ${structure.$path}: ${nameOf(arm.kind)} has no member ${name}`);
				return [name, routes] as const;
			});
			const present = (other: string): boolean => structure[other] !== undefined || values.has(other) || (structure.$flags ?? []).includes(other);
			const unmet = (route: PortableMemberStep): readonly (readonly string[])[] => (route.requires ?? []).filter((group) => !group.some(present));
			for (const [name, all] of [...routed].sort(([, a], [, b]) => a.length - b.length)) {
				const value = values.get(name);
				const routes = all.filter((route) => unmet(route).length === 0);
				if (routes.length === 0)
					throw new Error(
						`portable build: ${structure.$path}: ${name} builds only beside ${all.map((route) => unmet(route).map((group) => group.join(' or ')).join(' and ')).join(', or beside ')}`
					);
				const open = routes.flatMap((candidate) => {
					const reach = descend(frame, candidate.steps.slice(0, -1), false);
					return reach === undefined ? [] : [{ candidate, reached: reach.reached }];
				});
				if (open.length === 0) throw new Error(`portable build: ${structure.$path}: ${name} has no route beside the other members`);
				const route =
					furthest(open.filter(({ candidate }) => admits(candidate, value)))?.candidate ??
					refuseValue(structure.$path, name, value, open.map(({ candidate }) => candidate));
				placeMember(frame, route, value, structure.$path);
			}
			if (top.builder === undefined) return { value: arm.seated === undefined ? arm.kind : arm.seated === 'config' ? configOf(top) : inputOf(top), seat };
			const value = materialize(top);
			if (hasKind(value) && !readsAs(structure.$path, value))
				throw new Error(`portable build: the ${nameOf(arm.kind)} built for ${structure.$path} does not read as ${structure.$path}`);
			return { value, seat };
		};
		return build(root, undefined).value;
	};
}
