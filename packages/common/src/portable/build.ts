import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableCallShape,
	PortableContainer,
	PortableDecimalParts,
	PortableFlagStep,
	PortableSpelledFact,
	PortableSpelling,
	PortableKeyedMount,
	PortableMemberStep,
	PortableMount,
	PortablePickTest,
	PortablePreset,
	PortableSeat,
	PortableSlotStep,
	PortableStructure,
	PortableTemplate,
	PortableValueBuild
} from '@sittir/types';
import { hasKind } from './classify.ts';
import { isNumberSlots, leafSeatOf, numberMembers, spells, textBuilt, tokenKind, tokenText } from './facts.ts';
import { vocabularyPathFeatures } from './vocabulary-paths.ts';

export interface PortableBuildContext {
	readonly language: string;
	readonly table: PortableBuildTable;
	readonly builders: object;
	readonly kindName: (kind: number) => string | undefined;
	readonly readsAs: (path: string, node: { readonly $type: number }) => boolean;
	readonly spellingOf: (kind: number, fact: string, item: unknown) => string | undefined;
}

type Builder = (...input: readonly unknown[]) => unknown;

interface Picked {
	readonly arm: PortableBuildArm;
	readonly seat: PortableSeat | undefined;
}

interface Built {
	readonly value: unknown;
	readonly seat: PortableSeat | undefined;
	readonly holder?: 'built' | 'host';
}

interface Placed {
	readonly value: unknown;
	readonly mount?: PortableContainer;
	readonly key?: string;
	readonly beside?: Readonly<Record<string, unknown>>;
	readonly host?: { readonly structure: PortableStructure; readonly seats: readonly PortableSeat[] };
	readonly delimited?: true;
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
	delimiter: number | undefined;
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
		case 'nullary':
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

const emptyList = (value: unknown): boolean => Array.isArray(value) && value.length === 0;

const holdsOne = (route: PortableMemberStep, seat: PortableSeat): boolean => route.list === false && seat.many === true && within(seat).length === 0;

const sameContainer = (a: PortableContainer, b: PortableContainer): boolean => a.builder === b.builder && a.key === b.key;

const flattened = (containers: readonly PortableContainer[]): { readonly into?: PortableContainer; readonly containers: readonly PortableContainer[] } => {
	const kept: PortableContainer[] = [];
	let into: PortableContainer | undefined;
	for (const container of containers) {
		if (container.flatten !== true) kept.push(container);
		else if (kept.length === 0) into = container;
		else {
			const outer = kept.pop()!;
			const members = [...(outer.members ?? []), ...(container.members ?? [])];
			kept.push({ ...outer, key: container.key, ...(members.length === 0 ? {} : { members }) });
		}
	}
	return into === undefined ? { containers: kept } : { into, containers: kept };
};

const extending = (seats: readonly PortableSeat[], base: PortableSeat): readonly PortableSeat[] => {
	const prefix = within(base);
	return seats.filter((seat) => within(seat).length >= prefix.length && prefix.every((container, i) => sameContainer(container, within(seat)[i]!)));
};

const sameRoute = (a: readonly PortableSlotStep[], b: readonly PortableSlotStep[]): boolean =>
	a.length === b.length && a.every((step, i) => step.key === b[i]!.key && step.builder === b[i]!.builder);

const sameSteps = (a: PortableMemberStep, b: PortableMemberStep): boolean => sameRoute(a.steps, b.steps);

const furthest = <T extends { readonly reached: number }>(routes: readonly T[]): T | undefined =>
	routes.reduce<T | undefined>((best, route) => (best === undefined || route.reached > best.reached ? route : best), undefined);

const memberKeys = (structure: PortableStructure): readonly string[] => Object.keys(structure).filter((key) => !key.startsWith('$'));

const routeText = (steps: readonly PortableSlotStep[]): string => steps.map((step) => step.key).join('.');

const scalarOf = (structure: PortableStructure): number | bigint | undefined =>
	typeof structure.$value === 'number' || typeof structure.$value === 'bigint' ? structure.$value : undefined;

const integral = (value: number | bigint): boolean => typeof value === 'bigint' || Number.isSafeInteger(value);

const spelledValue = (value: PortableStructure['$value']): string =>
	typeof value === 'string' ? `"${value}"` : typeof value === 'bigint' ? `${value}n` : Object.is(value, -0) ? '-0' : String(value);

export function portableBuilder({ language, table, builders, kindName, readsAs, spellingOf }: PortableBuildContext): (structure: PortableStructure) => unknown {
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
	const delimited = (builder: string, delimiter: number, input: unknown): unknown => {
		if (table.builders[builder] !== 'elements') throw new Error(`portable build: ${builder} builds no list, so it takes no delimiter`);
		return builderAt(builder)({ delimiter }, ...argsOf('elements', input));
	};
	const builtFrom = (frame: Frame, builder: string): unknown => {
		if (frame.delimiter !== undefined) return delimited(builder, frame.delimiter, inputOf(frame));
		const keys = table.options?.[builder] ?? [];
		if (keys.length === 0) return call(builder, inputOf(frame));
		const config = configOf(frame);
		const options = Object.fromEntries(keys.flatMap((key) => (config[key] === undefined ? [] : [[key, config[key]]])));
		const input = frame.input !== undefined ? frame.input : inputFrom(frame, Object.fromEntries(Object.entries(config).filter(([key]) => !keys.includes(key))));
		return call(builder, input, Object.keys(options).length === 0 ? undefined : options);
	};
	const materialize = (frame: Frame): unknown => {
		if (frame.builder !== undefined) return builtFrom(frame, frame.builder);
		if (frame.form === undefined) return frame.seated === undefined ? inputOf(frame) : argsOf(frame.seated, inputOf(frame));
		const args = argsOf(frame.form.seats, inputOf(frame));
		return frame.form.call === 'keyed' ? args[0] : args;
	};
	const wrap = (value: unknown, containers: readonly PortableContainer[], fill?: (container: PortableContainer) => Readonly<Record<string, unknown>>, delimiter?: number): unknown =>
		containers.reduceRight<unknown>((inner, container, i) => {
			if (delimiter !== undefined && i === containers.length - 1) return delimited(container.builder!, delimiter, inner);
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
	const seated = (
		value: unknown,
		all: readonly PortableContainer[],
		empty: boolean,
		fill?: (container: PortableContainer) => Readonly<Record<string, unknown>>,
		delimiter?: number
	): Placed => {
		const [head, ...after] = all;
		const { into, containers } = flattened(head?.mounted === undefined ? all : after);
		const listed = delimiter !== undefined && !empty && containers.at(-1)?.builder !== undefined;
		const placed = {
			value: empty ? (containers.length === 0 && head?.mounted !== undefined ? undefined : wrapEmpty(containers)) : wrap(value, containers, fill, listed ? delimiter : undefined),
			...(listed ? { delimited: true as const } : {})
		};
		const beside = into === undefined || empty ? {} : (fill?.(into) ?? {});
		const keyed = into === undefined ? placed : { ...placed, key: into.key, ...(Object.keys(beside).length === 0 ? {} : { beside }) };
		return head?.mounted === undefined ? keyed : { ...keyed, mount: head };
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
			const feature = Object.hasOwn(vocabularyPathFeatures, structure.$path) ? vocabularyPathFeatures[structure.$path] : undefined;
			if (feature !== undefined && !(table.features ?? []).includes(feature))
				throw new Error(`portable build: ${structure.$path} is a path of ${feature}, which ${language} lacks`);
			throw new Error(`portable build: ${structure.$path} is not a path ${language} builds`);
		};
		const slotsOf = (seats: readonly PortableSeat[]): string => [...new Set(seats.map(({ at: [holder, key] }) => `${nameOf(holder)}.${key}`))].sort().join(', ');
		const ownedBy = (seat: PortableSeat): ReadonlySet<string> => new Set(within(seat).flatMap((container) => (container.members ?? []).map((member) => member.name)));
		const factsSet = (arm: PortableBuildArm, structure: PortableStructure): readonly PortableSpelledFact[] =>
			(arm.facts ?? []).filter((fact) => fact.flag === undefined || (structure.$flags ?? []).includes(fact.flag));
		const spelledIn = new WeakMap<object, readonly { readonly member: string; readonly index: number | undefined; readonly item: PortableStructure }[]>();
		const spellingTexts = new WeakMap<PortableSpelling, string | undefined>();
		const memberAt = (seat: PortableSeat, name: string): PortableMemberStep | undefined =>
			within(seat)
				.flatMap((container) => container.members ?? [])
				.find((member) => member.name === name);
		const spellingText = (fact: PortableSpelledFact, spelling: PortableSpelling, kind: number, seat: PortableSeat): string | undefined => {
			if (spelling.holes !== undefined) return undefined;
			if (!spellingTexts.has(spelling)) spellingTexts.set(spelling, spellingOf(kind, fact.name, build(spelling.item, memberAt(seat, fact.member)?.seats).value));
			return spellingTexts.get(spelling);
		};
		const filledAt = (item: PortableStructure, [key, ...rest]: readonly string[], text: string): PortableStructure =>
			({ ...item, [key!]: rest.length === 0 ? text : filledAt((item[key!] ?? {}) as PortableStructure, rest, text) }) as PortableStructure;
		const spelledItem = (fact: PortableSpelledFact, structure: PortableStructure, kind: number, seat: PortableSeat): PortableStructure => {
			const spelling = structure.$at?.[fact.name]?.spelling;
			const chosen = spelling === undefined ? fact.spellings[0]! : fact.spellings.find((candidate) => spellingText(fact, candidate, kind, seat) === spelling);
			if (chosen === undefined) throw new Error(`portable build: ${structure.$path}'s ${fact.name} has no ${language} spelling ${JSON.stringify(spelling)}`);
			return Object.entries(chosen.holes ?? {}).reduce((item, [hole, keys]) => {
				const text = structure[hole];
				if (typeof text !== 'string') throw new Error(`portable build: ${structure.$path} spells its ${fact.name} from ${hole}, which is missing`);
				return filledAt(item, keys, text);
			}, chosen.item);
		};
		const withSpelled = (held: unknown, spelled: readonly { readonly index: number | undefined; readonly item: PortableStructure }[]): unknown[] => {
			const items = held === undefined ? [] : [...listOf(held)];
			for (const { index, item } of spelled.filter((at) => at.index !== undefined).sort((a, b) => a.index! - b.index!)) items.splice(Math.min(index!, items.length), 0, item);
			return [...spelled.flatMap(({ index, item }) => (index === undefined ? [item] : [])), ...items];
		};
		const seatOf = (arm: PortableBuildArm, seats: readonly PortableSeat[], structure?: PortableStructure): PortableSeat | undefined => {
			const fitting = seats.filter(
				(seat) =>
					(arm.holders === undefined || arm.holders.some(([holder, key]) => holder === seat.at[0] && key === seat.at[1])) &&
					seat.kinds.includes(arm.kind)
			);
			if (structure === undefined || fitting.length < 2) return fitting[0];
			const named = [...memberKeys(structure).filter((name) => structure[name] !== undefined), ...factsSet(arm, structure).map((fact) => fact.member)];
			const stated = named.filter((name) => fitting.some((seat) => ownedBy(seat).has(name)));
			return fitting.find((seat) => stated.every((name) => ownedBy(seat).has(name))) ?? fitting[0];
		};
		const textOf = (value: string, seats: readonly PortableSeat[]): unknown => {
			const leaf = leafSeatOf(value, seats)?.leaf;
			return leaf === undefined ? value : leafOf(leaf, value);
		};
		const kindOf = (value: unknown, member: PortableMemberStep): number | undefined => {
			if (isStructure(value)) return pick(value, member.seats)?.arm.kind;
			const placed = typeof value === 'string' ? (tokenKind(value, member.seats) ?? textOf(value, member.seats)) : value;
			return hasKind(placed) ? placed.$type : typeof placed === 'number' ? placed : undefined;
		};
		const passes = (test: PortablePickTest, arm: PortableBuildArm, structure: PortableStructure): boolean => {
			if ('absent' in test) return test.required.every((name) => structure[name] !== undefined) && test.absent.every((name) => structure[name] === undefined);
			if ('empty' in test) return test.empty.every((name) => structure[name] === undefined || (Array.isArray(structure[name]) && structure[name].length === 0));
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
			const path = pathOf(structure);
			const open = (path?.arms ?? []).flatMap((arm): Picked[] => {
				const seat = seats === undefined ? undefined : seatOf(arm, seats, structure);
				return (seats === undefined ? arm.holders !== undefined : seat === undefined) ? [] : [{ arm, seat }];
			});
			const scalar = scalarOf(structure);
			const scalars = scalar === undefined ? [] : open.filter(({ arm }) => arm.scalar !== undefined && path?.builds?.[arm.scalar] === arm.kind);
			const picked =
				scalars.length > 0
					? (scalars.find(({ arm }) => arm.scalar === (typeof scalar === 'bigint' ? 'bigint' : integral(scalar!) ? 'integer' : 'float')) ??
						scalars.find(({ arm }) => arm.scalar === (integral(scalar!) ? 'integer' : 'float')) ??
						scalars[0])
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
			const needed = [
				...new Set(
					path.arms.flatMap((arm) => {
						const presence = arm.when.find((test): test is Extract<PortablePickTest, { readonly absent: readonly string[] }> => 'absent' in test);
						if (presence === undefined || (seats !== undefined && seatOf(arm, seats) === undefined)) return [];
						const missing = presence.required.filter((name) => structure[name] === undefined);
						const otherwise = presence.absent.every((name) => structure[name] === undefined) && arm.when.every((test) => test === presence || passes(test, arm, structure));
						return missing.length > 0 && otherwise ? [missing.join(' and ')] : [];
					})
				)
			];
			throw new Error(`portable build: no ${language} form of ${structure.$path} builds this structure (${stated.join(', ')})${needed.length === 0 ? '' : `; it needs ${needed.join(', or ')}`}`);
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
		const frameAt = (frame: Frame, steps: readonly PortableSlotStep[]): Frame | undefined => {
			let at = frame;
			for (const step of steps) {
				if (step.flatten === true) continue;
				if (step.mounted !== undefined) {
					const entered = enter(at, step.builder!, step.mounted, false);
					if (entered === undefined) return undefined;
					at = entered.frame;
					continue;
				}
				const next = at.config[step.key];
				if (!(next instanceof Frame)) return undefined;
				at = next;
			}
			return at;
		};
		const holdsAny = (frame: Frame): boolean => [frame.input, ...Object.values(frame.config)].some((value) => value !== undefined && listOf(value).length > 0);
		const ownerOf = (frame: Frame, steps: readonly PortableSlotStep[], path: string): Frame => {
			const owner = descend(frame, steps, true);
			if (owner === undefined) throw new Error(`portable build: ${path} routes two values through ${routeText(steps)}`);
			return owner.frame;
		};
		const set = (frame: Frame, key: string, value: unknown, path: string): void => {
			const held = frame.config[key];
			if (held instanceof Frame) {
				if (held.input !== undefined || Object.keys(held.config).length > 0) throw new Error(`portable build: ${path} sets ${key} twice`);
				if (held.mount === undefined && (hasKind(value) || (Array.isArray(value) && value.length > 0 && value.every(hasKind)))) frame.config[key] = value;
				else held.input = value;
			} else if (frame.presets.delete(key) && !Array.isArray(held) && !Array.isArray(value)) frame.config[key] = value;
			else frame.config[key] = held === undefined ? value : [...listOf(held), ...listOf(value)];
		};
		const mountOn = (frame: Frame, placed: Placed, path: string): void => {
			const head = placed.mount!;
			const target = frame.input === undefined ? enter(frame, head.builder!, head.mounted!, true) : undefined;
			if (target === undefined) throw new Error(`portable build: ${path} builds ${head.builder} beside other members`);
			if (placed.value !== undefined) setPlaced(target.frame, placed.key ?? head.key, placed, path);
		};
		const setPlaced = (frame: Frame, key: string, placed: Placed, path: string): void => {
			set(frame, key, placed.value, path);
			for (const [at, value] of Object.entries(placed.beside ?? {})) set(frame, at, value, path);
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
				if (built.holder === 'host') return { value: undefined, host: { structure: value, seats } };
				const fill = (container: PortableContainer): Readonly<Record<string, unknown>> =>
					Object.fromEntries(
						(container.members ?? []).flatMap((owned) => {
							const spelled = (spelledIn.get(value) ?? []).filter((at) => at.member === owned.name);
							const held = spelled.length === 0 ? value[owned.name] : withSpelled(value[owned.name], spelled);
							if (held === undefined) return [];
							if (owned.steps.length !== 1) throw new Error(`portable build: ${value.$path}'s ${owned.name} sits ${owned.steps.length} steps into ${container.builder}`);
							if (!admits(owned, held)) refuseValue(value.$path, owned.name, held, [owned]);
							const given = Array.isArray(held) && !takesMany(owned) ? held[0] : held;
							if (given === undefined) return [];
							return [[owned.steps[0]!.key, unmounted(valueOf(given, owned, value.$path), owned, value.$path)]];
						})
					);
				const containers = within(built.seat ?? seats[0]!).slice(depth);
				if (built.holder === 'built' && containers.length === 0) throw new Error(`portable build: ${value.$path} builds its holder, which sits in a container this list does not wrap`);
				return seated(built.value, built.holder === 'built' ? containers.slice(0, -1) : containers, false, fill);
			}
			const token = typeof value === 'string' ? tokenKind(value, seats) : undefined;
			if (token !== undefined) {
				const seat = seats.find((s) => s.kinds.includes(token)) ?? seats[0]!;
				return seated(token, within(seat).slice(depth), false);
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
			if (placed.host !== undefined) throw new Error(`portable build: ${path}'s ${member.name} holds many values, each built into its holder through ${placed.host.structure.$path}'s mount`);
			if (placed.mount !== undefined) throw new Error(`portable build: ${path}'s ${member.name} holds many values, each built through ${placed.mount.builder}`);
			if (placed.key !== undefined) throw new Error(`portable build: ${path}'s ${member.name} holds many values, each flattened into its holder's ${placed.key}`);
			return placed.value;
		};
		const described = (item: unknown): string =>
			isStructure(item) ? item.$path : typeof item === 'string' ? `"${item}"` : hasKind(item) ? nameOf(item.$type) : typeof item;
		const valueOf = (value: unknown, member: PortableMemberStep, path: string, delimiter?: number): Placed => {
			for (const item of listOf(value)) {
				const text = typeof item === 'number' ? tokenText(item, member.seats) : undefined;
				if (text !== undefined) throw new Error(`portable build: ${path}'s ${member.name} takes the token "${text}" as its text, not as kind id ${item}`);
			}
			if (member.multiple) return { value: listOf(value).map((item) => unmounted(element(item, member, member.seats, 0), member, path)) };
			if (!Array.isArray(value)) return member.seats.some((seat) => holdsOne(member, seat)) && !seatsIn(member.seats.filter((seat) => !holdsOne(member, seat)), value) ? valueOf([value], member, path, delimiter) : element(value, member, member.seats, 0);
			const lists = member.seats.filter((seat) => seat.many === true);
			const placed = (seats: readonly PortableSeat[], i: number): readonly PortableSeat[] =>
				seats.some((seat) => seat.final === true) ? seats.filter((seat) => (seat.final === true) === (i === value.length - 1)) : seats;
			const list = lists.find((seat) => value.every((item, i) => seatsIn(placed(extending(member.seats, seat), i), item))) ?? lists[0]!;
			const depth = within(list).length;
			const last = value.length - 1;
			const finals = placed(extending(member.seats, list), last);
			if (last >= 0 && finals.some((seat) => seat.final === true) && !seatsIn(finals, value[last]))
				throw new Error(`portable build: ${path}'s ${member.name} ends with ${described(value[last])}, which builds in none of the forms its last element takes`);
			const items = value.map((item, i) => unmounted(element(item, member, placed(extending(member.seats, list), i), depth), member, path));
			return seated(items, within(list), items.length === 0, undefined, delimiter);
		};
		const placeMember = (frame: Frame, member: PortableMemberStep, given: unknown, path: string, delimiter?: number): boolean => {
			const one = Array.isArray(given) && !takesMany(member);
			const value: unknown = one ? given[0] : given;
			if (one && value === undefined) {
				const optional = member.steps.findIndex((step) => step.optional === true);
				if (optional >= 0) descend(frame, member.steps.slice(0, optional), true);
				return false;
			}
			const stop = Array.isArray(value) && value.length === 0 ? member.steps.findIndex((step) => step.optional === true) : -1;
			if (stop >= 0) {
				descend(frame, member.steps.slice(0, stop), true);
				return false;
			}
			const owner = ownerOf(frame, member.steps.slice(0, -1), path);
			const key = member.steps.at(-1)!.key;
			const held = owner.config[key];
			if (typeof value === 'string' && held instanceof Frame && held.builder !== undefined) {
				set(owner, key, value, path);
				return false;
			}
			const placed = valueOf(value, member, path, delimiter);
			if (placed.host !== undefined) build(placed.host.structure, placed.host.seats, owner);
			else if (placed.mount !== undefined) mountOn(owner, placed, path);
			else setPlaced(owner, placed.key ?? key, placed, path);
			return placed.delimited === true;
		};
		const spelledParts = (spelling: string, parts: PortableDecimalParts): ReadonlyMap<string, string> | undefined => {
			const [, integer, fraction, sign, exponent] = /^(\d+)(?:\.(\d+))?(?:e([+-])(\d+))?$/.exec(spelling) ?? [];
			if (integer === undefined) return undefined;
			const out = new Map<string, string>();
			if (parts.integer !== undefined) out.set(parts.integer, integer);
			else if (integer !== '0') return undefined;
			if (parts.fraction !== undefined) out.set(parts.fraction, fraction ?? '0');
			else if (fraction !== undefined) return undefined;
			if (exponent === undefined) return out;
			if (parts.exponent === undefined) return undefined;
			out.set(parts.exponent, exponent);
			if (parts.marker !== undefined) out.set(parts.marker, 'e');
			if (sign !== '-') return out;
			if (parts.exponentSign === undefined) return undefined;
			out.set(parts.exponentSign, '-');
			return out;
		};
		const significandOf = (value: number | bigint): { readonly digits: string; readonly power: number } | undefined => {
			const [, whole, fraction = '', exponent = '0'] = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(typeof value === 'number' ? value.toExponential() : String(value)) ?? [];
			if (whole === undefined) return undefined;
			const written = `${whole}${fraction}`;
			const digits = written.replace(/0+$/, '') || '0';
			return { digits, power: Number(exponent) - fraction.length + written.length - digits.length };
		};
		const exponentSpelling = (mantissa: string, power: number): string => `${mantissa}e${power < 0 ? '-' : '+'}${Math.abs(power)}`;
		const decimalParts = (value: number | bigint, parts: PortableDecimalParts, arm: PortableBuildArm, path: string): ReadonlyMap<string, string> => {
			const scientific = parts.exponent !== undefined && (arm.numericRequired ?? []).includes(parts.exponent);
			const significand = significandOf(value);
			const spellings = scientific
				? [significand && exponentSpelling(significand.digits, significand.power)]
				: [
						String(value),
						...(typeof value === 'number' && parts.exponent !== undefined
							? [value.toExponential(), significand && exponentSpelling(`0.${significand.digits}`, significand.power + significand.digits.length)]
							: [])
					];
			for (const spelling of spellings) {
				const out = spelling === undefined ? undefined : spelledParts(spelling, parts);
				if (out !== undefined) return out;
			}
			throw new Error(`portable build: ${path} builds a ${nameOf(arm.kind)} in ${language}, which cannot spell ${spelledValue(value)}`);
		};
		const takesMany = (route: PortableMemberStep): boolean => route.multiple || route.seats.some((seat) => seat.many === true && !holdsOne(route, seat));
		const takesList = (route: PortableMemberStep): boolean => takesMany(route) || route.list === true;
		const seatsIn = (offered: readonly PortableSeat[], item: unknown): boolean =>
			isStructure(item)
				? pick(item, offered) !== undefined
				: typeof item === 'string'
					? tokenKind(item, offered) !== undefined || offered.some((seat) => (seat.leaf !== undefined || seat.text === true) && spells(seat, item))
					: !hasKind(item) || offered.some((seat) => seat.kinds.includes(item.$type));
		const seats = (route: PortableMemberStep, item: unknown): boolean => seatsIn(route.seats, item);
		const listFits = (route: PortableMemberStep, value: readonly unknown[]): boolean =>
			takesList(route) && (takesMany(route) || value.length <= 1) && value.every((item) => seats(route, item));
		const admits = (route: PortableMemberStep, value: unknown): boolean => (Array.isArray(value) ? listFits(route, value) : seats(route, value));
		const refuseValue = (path: string, name: string, value: unknown, routes: readonly PortableMemberStep[]): never => {
			const offered = routes.flatMap((route) => route.seats);
			if (Array.isArray(value) && !routes.some(takesList)) throw new Error(`portable build: ${path}'s ${name} holds one value, not a list`);
			if (Array.isArray(value) && value.length > 1 && !routes.some(takesMany)) throw new Error(`portable build: ${path}'s ${name} holds one value in ${language}, not ${value.length}`);
			const item = listOf(value).find((candidate) => !routes.some((route) => seats(route, candidate)));
			if (isStructure(item)) refuse(item, builtPathOf(item), offered);
			const what = typeof item === 'string' ? `the text "${item}"` : hasKind(item) ? `a ${nameOf(item.$type)}` : 'these values';
			throw new Error(`portable build: ${path}'s ${name} has no route that seats ${what}; it sits in ${slotsOf(offered)}`);
		};
		const refuseUnmet = (path: string, name: string, routes: readonly PortableMemberStep[], unmet: (route: PortableMemberStep) => readonly (readonly string[])[]): never => {
			throw new Error(`portable build: ${path}: ${name} builds only beside ${[...new Set(routes.map((route) => unmet(route).map((group) => group.join(' or ')).join(' and ')))].join(', or beside ')}`);
		};
		const fitsShape = (route: PortableMemberStep, value: unknown): boolean =>
			Array.isArray(value) ? listFits(route, value) : !route.multiple && seatsIn(route.seats.filter((seat) => seat.many !== true || route.list === false), value);
		const ownerFor = (
			arm: PortableBuildArm,
			values: ReadonlyMap<string, unknown>,
			unmet: (route: PortableMemberStep) => readonly (readonly string[])[],
			path: string
		): ReadonlySet<PortableMemberStep> | undefined => {
			if (arm.owners === undefined) return undefined;
			const names = [...values.keys()];
			const fitting = arm.owners.map((owner) =>
				owner.flatMap((i) => {
					const route = arm.members[i]!;
					return values.has(route.name) && unmet(route).length === 0 && fitsShape(route, values.get(route.name)) ? [i] : [];
				})
			);
			const takesAll = (fit: readonly number[], taken: readonly string[]): boolean => taken.every((name) => fit.some((i) => arm.members[i]!.name === name));
			const held = names.filter((name) => !emptyList(values.get(name)));
			const whole = fitting.filter((fit) => takesAll(fit, names));
			const shapes = [...new Set((whole.length > 0 ? whole : fitting.filter((fit) => takesAll(fit, held))).map((fit) => fit.join(' ')))];
			if (shapes.length === 0) {
				const alone = names.filter((name) => !fitting.some((fit) => fit.some((i) => arm.members[i]!.name === name)));
				const waiting = alone.find((name) => arm.members.some((route) => route.name === name && unmet(route).length > 0 && fitsShape(route, values.get(name))));
				if (waiting !== undefined)
					refuseUnmet(path, waiting, arm.members.filter((route) => route.name === waiting && fitsShape(route, values.get(waiting))), unmet);
				const [refused] = alone;
				if (refused !== undefined) refuseValue(path, refused, values.get(refused), arm.members.filter((route) => route.name === refused));
				throw new Error(`portable build: ${path}: no ${language} form of ${nameOf(arm.kind)} takes ${names.join(', ')} together`);
			}
			if (shapes.length > 1) throw new Error(`portable build: ${path}: ${nameOf(arm.kind)} takes ${names.join(', ')} through more than one ${language} form`);
			return new Set(shapes[0]!.split(' ').filter((i) => i !== '').map((i) => arm.members[Number(i)]!));
		};
		const routesOf = (arm: PortableBuildArm, name: string): readonly PortableMemberStep[] =>
			arm.members.filter((member, i) => member.name === name && !arm.members.slice(0, i).some((other) => other.name === name && sameSteps(other, member)));
		const spelledBy = (arm: PortableBuildArm, structure: PortableStructure): boolean =>
			arm.members.every(({ name }) => {
				const texts = listOf(structure[name]).filter((item) => typeof item === 'string');
				return texts.length === 0 || routesOf(arm, name).some((route) => texts.every((text) => seats(route, text)));
			});
		const spell = (template: PortableTemplate, structure: PortableStructure): string => {
			let at = 0;
			const text = template.pattern.replaceAll('${string}', () => {
				const hole = template.holes[at++]!;
				const filled = structure[hole];
				if (typeof filled !== 'string') throw new Error(`portable build: ${structure.$path} spells ${template.member} from ${hole}, which is missing`);
				return filled;
			});
			if (!new RegExp(template.match, 'u').test(text)) throw new Error(`portable build: ${structure.$path} spells ${template.member} ${JSON.stringify(text)}, which ${template.match} does not match`);
			return text;
		};

		const build = (structure: PortableStructure, seats: readonly PortableSeat[] | undefined, host?: Frame): Built => {
			const path = builtPathOf(structure);
			const { arm, seat } = pick(structure, seats) ?? refuse(structure, path, seats);
			const holder = arm.mounted !== undefined && seat !== undefined && seat.at[0] === arm.mounted.holder && seat.at[1] === arm.mounted.key ? (within(seat).at(-1)?.key === arm.mounted.key ? 'built' : within(seat).length === 0 ? 'host' : undefined) : undefined;
			if (holder === 'host' && host === undefined) return { value: undefined, seat, holder };
			const top = host ?? new Frame(arm.builder);
			const frame = arm.mounted === undefined ? top : enter(top, arm.builder!, arm.mounted, true)?.frame;
			if (frame === undefined) throw new Error(`portable build: ${structure.$path} builds through ${arm.builder}, which seats ${nameOf(arm.kind)} in a holder it has none of`);
			for (const step of arm.presets) preset(frame, step, structure.$path);
			const facts = factsSet(arm, structure);
			const unset = Object.keys(structure.$at ?? {}).filter((name) => !facts.some((fact) => fact.name === name));
			if (unset.length > 0) throw new Error(`portable build: ${structure.$path}: $at names ${unset.join(', ')}, which it does not set`);
			if (facts.length > 0) {
				const unheld = facts.find((fact) => seat === undefined || !ownedBy(seat).has(fact.member));
				if (unheld !== undefined)
					throw new Error(`portable build: ${structure.$path}'s ${unheld.name} is spelled in its container's ${unheld.member}, which ${seat === undefined ? 'a structure built on its own' : 'its seat'} has none of`);
				spelledIn.set(structure, facts.map((fact) => ({ member: fact.member, index: structure.$at?.[fact.name]?.index, item: spelledItem(fact, structure, arm.kind, seat!) })));
			}
			const listed: (readonly [string, PortableFlagStep])[] = [];
			for (const flag of structure.$flags ?? []) {
				const steps = arm.flags[flag];
				if (steps === undefined && facts.some((fact) => fact.flag === flag)) continue;
				if (steps === undefined && !arm.when.some((test) => 'flag' in test && test.flag === flag && test.set))
					throw new Error(`portable build: ${structure.$path}: ${flag} is not a flag of ${nameOf(arm.kind)}`);
				for (const step of steps?.presets ?? []) preset(frame, step, structure.$path);
				if (steps?.delimiter !== undefined && steps.list !== undefined) listed.push([flag, steps]);
				else if (steps?.delimiter !== undefined) frame.delimiter = (frame.delimiter ?? 0) | steps.delimiter;
			}
			const sole = arm.sole === undefined ? undefined : structure[arm.sole.member];
			if (arm.sole !== undefined && Array.isArray(sole) && sole.length === 1) frame.delimiter = (frame.delimiter ?? 0) | arm.sole.delimiter;
			for (const [flag, steps] of Object.entries(arm.flags)) {
				if ((structure.$flags ?? []).includes(flag)) continue;
				for (const step of steps.unset ?? []) preset(frame, step, structure.$path);
				const text = steps.template === undefined ? undefined : structure[steps.template.member];
				if (typeof text === 'string' && new RegExp(steps.template!.match, 'u').test(text))
					throw new Error(`portable build: ${structure.$path}: ${steps.template!.member} ${JSON.stringify(text)} reads as ${flag}; set ${flag} and state ${steps.template!.holes.join(', ')}`);
			}
			const spelledFlags = (structure.$flags ?? []).flatMap((flag) => arm.flags[flag]?.template ?? []);
			const holes = new Set([...(arm.template?.holes ?? []), ...spelledFlags.flatMap((template) => template.holes)]);
			const owned = seat === undefined ? new Set<string>() : ownedBy(seat);
			const emptied = new Set(arm.when.flatMap((test) => ('empty' in test ? test.empty : [])));
			const values = new Map<string, unknown>(
				memberKeys(structure).flatMap((name) => (holes.has(name) || owned.has(name) || emptied.has(name) || structure[name] === undefined ? [] : [[name, structure[name]] as const]))
			);
			for (const name of arm.empty ?? []) if (!values.has(name) && !holes.has(name) && !owned.has(name)) values.set(name, []);
			if (arm.template !== undefined && structure[arm.template.member] === undefined) values.set(arm.template.member, spell(arm.template, structure));
			for (const template of spelledFlags) values.set(template.member, spell(template, structure));
			const scalar = scalarOf(structure);
			if (arm.scalar !== undefined && scalar !== undefined) {
				if (typeof scalar === 'number' && !Number.isFinite(scalar)) throw new Error(`portable build: ${structure.$path}: no ${language} literal spells ${spelledValue(scalar)}`);
				if (scalar < 0 || Object.is(scalar, -0))
					throw new Error(`portable build: ${structure.$path}: ${nameOf(arm.kind)} spells no sign, so it cannot build ${spelledValue(scalar)}; build the negation of its magnitude`);
				if (arm.scalar === 'float' ? typeof scalar === 'bigint' : !integral(scalar))
					throw new Error(
						`portable build: ${structure.$path} takes ${arm.scalar === 'float' ? 'a float (a number)' : 'an integer (a safe integer or a bigint)'} in ${language}, not ${spelledValue(scalar)}`
					);
				const stated = numberMembers(arm).flatMap((member) => (values.has(member.name) ? [member.name] : []));
				if (stated.length > 0)
					throw new Error(`portable build: ${structure.$path}: $value ${spelledValue(scalar)} spells ${stated.join(' and ')}; state the $value or ${stated.length === 1 ? 'that member' : 'those members'}, not both`);
				if (arm.numeric === undefined || (isNumberSlots(arm.numeric) && !takesConfig(arm.builder!))) frame.input = scalar;
				else if (isNumberSlots(arm.numeric)) frame.config[arm.numeric.at(-1)!] = scalar;
				else for (const [key, part] of decimalParts(scalar, arm.numeric, arm, structure.$path)) frame.config[key] = part;
			}
			if (arm.content !== undefined && typeof structure.$value !== 'string') throw new Error(`portable build: ${structure.$path} takes its ${nameOf(arm.kind)} as a text $value`);
			if ((arm.content !== undefined || textBuilt(table, arm)) && typeof structure.$value === 'string') frame.input = structure.$value;
			const routed = [...values.keys()].map((name) => {
				const routes = routesOf(arm, name);
				if (routes.length === 0) throw new Error(`portable build: ${structure.$path}: ${nameOf(arm.kind)} has no member ${name}`);
				return [name, routes] as const;
			});
			const silent = (name: string): boolean => arm.owners !== undefined && emptyList(values.get(name)) && !(arm.empty ?? []).includes(name);
			const present = (other: string): boolean => !silent(other) && (structure[other] !== undefined || values.has(other) || (structure.$flags ?? []).includes(other));
			const unmet = (route: PortableMemberStep): readonly (readonly string[])[] => (route.requires ?? []).filter((group) => !group.some(present));
			const owner = ownerFor(arm, new Map([...values].filter(([name]) => !silent(name))), unmet, structure.$path);
			const delimitedFlags = new Set<string>();
			const filledFlags = new Set<string>();
			for (const [name, all] of [...routed].sort(([, a], [, b]) => a.length - b.length)) {
				const value = values.get(name);
				const routes = all.filter((route) => (owner === undefined || owner.has(route)) && unmet(route).length === 0);
				if (routes.length === 0 && owner !== undefined && emptyList(value)) continue;
				if (routes.length === 0) refuseUnmet(structure.$path, name, all, unmet);
				const open = routes.flatMap((candidate) => {
					const reach = descend(frame, candidate.steps.slice(0, -1), false);
					return reach === undefined ? [] : [{ candidate, reached: reach.reached }];
				});
				if (open.length === 0) throw new Error(`portable build: ${structure.$path}: ${name} has no route beside the other members`);
				const route =
					furthest(open.filter(({ candidate }) => admits(candidate, value)))?.candidate ??
					refuseValue(structure.$path, name, value, open.map(({ candidate }) => candidate));
				const lists = listed.filter(([, steps]) => sameRoute(steps.list!, route.steps));
				const delimiter = lists.length === 0 ? undefined : lists.reduce((bits, [, steps]) => bits | steps.delimiter!, 0);
				const delimitedHere = placeMember(frame, route, value, structure.$path, delimiter);
				if (!emptyList(value)) for (const [flag] of lists) (delimitedHere ? delimitedFlags : filledFlags).add(flag);
			}
			for (const [flag, { list: steps, delimiter }] of listed) {
				if (delimitedFlags.has(flag)) continue;
				const list = frameAt(frame, steps!);
				if (list === undefined && filledFlags.has(flag)) throw new Error(`portable build: ${structure.$path}: ${flag} reaches ${routeText(steps!)}, which builds no list`);
				if (list === undefined || !holdsAny(list))
					throw new Error(`portable build: ${structure.$path}: ${flag} is the trailing separator of the list at ${routeText(steps!)}, which holds nothing`);
				list.delimiter = (list.delimiter ?? 0) | delimiter!;
			}
			if (host !== undefined) return { value: undefined, seat, holder: 'host' };
			if (top.builder === undefined) return { value: arm.seated === undefined ? arm.kind : arm.seated === 'config' ? configOf(top) : inputOf(top), seat };
			const value = materialize(top);
			if (hasKind(value) && !readsAs(structure.$path, value))
				throw new Error(`portable build: the ${nameOf(arm.kind)} built for ${structure.$path} does not read as ${structure.$path}`);
			return holder === 'built' ? { value, seat, holder } : { value, seat };
		};
		return build(root, undefined).value;
	};
}
