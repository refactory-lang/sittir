import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableCallShape,
	PortableContainer,
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
	const call = (key: string, input: unknown): unknown => builderAt(key)(...argsOf(table.builders[key], input));
	const sole = (config: Readonly<Record<string, unknown>>): unknown => {
		const values = Object.values(config);
		return values.length === 0 ? undefined : values.length === 1 ? values[0] : config;
	};
	const configOf = (frame: Frame): Record<string, unknown> =>
		Object.fromEntries(Object.entries(frame.config).map(([key, value]) => [key, value instanceof Frame ? materialize(value) : value]));
	const shapeOf = (frame: Frame): PortableCallShape | undefined => (frame.builder === undefined ? frame.form?.seats : table.builders[frame.builder]);
	const inputOf = (frame: Frame): unknown => {
		if (frame.input !== undefined) return frame.input;
		const config = configOf(frame);
		return shapeOf(frame) === 'config' ? config : sole(config);
	};
	const materialize = (frame: Frame): unknown => {
		if (frame.builder !== undefined) return call(frame.builder, inputOf(frame));
		if (frame.form === undefined) return inputOf(frame);
		const args = argsOf(frame.form.seats, inputOf(frame));
		return frame.form.call === 'keyed' ? args[0] : args;
	};
	const wrap = (value: unknown, containers: readonly PortableContainer[]): unknown =>
		containers.reduceRight<unknown>(
			(inner, container) =>
				container.builder === undefined ? inner : call(container.builder, takesConfig(container.builder) ? { [container.key]: inner } : inner),
			value
		);
	const wrapEmpty = (containers: readonly PortableContainer[]): unknown => {
		const stop = containers.findIndex((container) => container.optional === true);
		if (stop < 0) return wrap([], containers);
		const left = containers[stop]!;
		return wrap(left.builder === undefined ? undefined : call(left.builder, undefined), containers.slice(0, stop));
	};
	const seated = (value: unknown, containers: readonly PortableContainer[], empty: boolean): Placed => {
		const [head, ...rest] = containers;
		if (head?.mounted !== undefined) return { value: empty ? (rest.length === 0 ? undefined : wrapEmpty(rest)) : wrap(value, rest), mount: head };
		return { value: empty ? wrapEmpty(containers) : wrap(value, containers) };
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
		const seatOf = (arm: PortableBuildArm, seats: readonly PortableSeat[]): PortableSeat | undefined =>
			seats.find(
				(seat) =>
					(arm.holders === undefined || arm.holders.some(([holder, key]) => holder === seat.at[0] && key === seat.at[1])) &&
					seat.kinds.includes(arm.kind)
			);
		const textOf = (value: string, seats: readonly PortableSeat[]): unknown => {
			const leaf = seats.find((seat) => seat.leaf !== undefined)?.leaf;
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
			if ('variant' in test) return test.default === true;
			const value = structure[test.member];
			if (value === undefined) return true;
			const member = arm.members.find((m) => m.name === test.member);
			return member !== undefined && listOf(value).every((item) => test.kinds.includes(kindOf(item, member) ?? -1));
		};
		const pick = (structure: PortableStructure, seats: readonly PortableSeat[] | undefined): Picked | undefined => {
			const memo = picks.get(structure) ?? picks.set(structure, new Map()).get(structure)!;
			if (memo.has(seats)) return memo.get(seats);
			memo.set(seats, undefined);
			const open = (pathOf(structure)?.arms ?? []).flatMap((arm): Picked[] => {
				const seat = seats === undefined ? undefined : seatOf(arm, seats);
				return (seats === undefined ? arm.holders !== undefined : seat === undefined) ? [] : [{ arm, seat }];
			});
			const scalar = scalarOf(structure);
			const scalars = scalar === undefined ? [] : open.filter(({ arm }) => arm.scalar !== undefined);
			const picked =
				scalars.length > 0
					? (scalars.find(({ arm }) => arm.scalar === (integral(scalar!) ? 'integer' : 'float')) ?? scalars[0])
					: open.find(({ arm }) => arm.when.every((test) => passes(test, arm, structure)));
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
				held.input = value;
			} else if (frame.presets.delete(key) && !Array.isArray(held) && !Array.isArray(value)) frame.config[key] = value;
			else frame.config[key] = held === undefined ? value : [...listOf(held), ...listOf(value)];
		};
		const mountOn = (frame: Frame, placed: Placed, path: string): void => {
			const head = placed.mount!;
			const target = frame.input === undefined ? enter(frame, head.builder!, head.mounted!, true) : undefined;
			if (target === undefined) throw new Error(`portable build: ${path} builds ${head.builder} beside other members`);
			if (placed.value !== undefined) set(target.frame, head.key, placed.value, path);
		};
		const preset = (frame: Frame, step: PortablePreset, path: string): void => {
			const last = step.steps.at(-1)!;
			if (last.mounted !== undefined) {
				ownerOf(frame, step.steps, path);
				return;
			}
			const owner = ownerOf(frame, step.steps.slice(0, -1), path);
			if (step.builder === undefined) {
				const fixed = step.kind ?? step.text;
				const held = owner.config[last.key];
				owner.config[last.key] = held === undefined ? fixed : [...listOf(held), fixed];
				owner.presets.add(last.key);
			}
			else if (owner.config[last.key] === undefined) owner.config[last.key] = new Frame(step.builder);
		};

		const element = (value: unknown, member: PortableMemberStep, seats: readonly PortableSeat[], depth: number): Placed => {
			if (isStructure(value)) {
				const built = build(value, seats);
				return seated(built.value, within(built.seat ?? seats[0]!).slice(depth), false);
			}
			const placed = typeof value === 'string' ? textOf(value, seats) : value;
			const kind = hasKind(placed) ? placed.$type : typeof placed === 'number' ? placed : undefined;
			const seat = seats.find((s) => kind !== undefined && s.kinds.includes(kind)) ?? seats[0]!;
			return seated(placed, within(seat).slice(depth), false);
		};
		const unmounted = (placed: Placed, member: PortableMemberStep, path: string): unknown => {
			if (placed.mount !== undefined) throw new Error(`portable build: ${path}'s ${member.name} holds many values, each built through ${placed.mount.builder}`);
			return placed.value;
		};
		const valueOf = (value: unknown, member: PortableMemberStep, path: string): Placed => {
			if (member.multiple) return { value: listOf(value).map((item) => unmounted(element(item, member, member.seats, 0), member, path)) };
			if (!Array.isArray(value)) return element(value, member, member.seats, 0);
			const list = member.seats.find((seat) => seat.many === true)!;
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
			else set(owner, key, placed.value, path);
		};
		const decimalParts = (value: number, arm: PortableBuildArm, path: string): ReadonlyMap<string, string> => {
			const has = (name: string): boolean => arm.numeric!.includes(name);
			const member = (name: string): PortableMemberStep | undefined => arm.members.find((m) => m.name === name);
			const cannot = (): never => {
				throw new Error(`portable build: ${path} builds a ${nameOf(arm.kind)} in ${language}, which cannot spell ${spelledValue(value)}`);
			};
			const [, integer, fraction, sign, exponent] = /^(\d+)(?:\.(\d+))?(?:e([+-])(\d+))?$/.exec(String(value)) ?? cannot();
			const parts = new Map<string, string>();
			if (has('integer')) parts.set('integer', integer!);
			else if (integer !== '0') cannot();
			if (has('fraction')) parts.set('fraction', fraction ?? '0');
			else if (fraction !== undefined) cannot();
			const required = member('exponent')?.steps.every((step) => step.optional !== true) === true;
			const written = exponent ?? (has('exponent') && required ? '0' : undefined);
			if (written === undefined) return parts;
			if (!has('exponent')) cannot();
			parts.set('exponent', written);
			if (member('marker') !== undefined) parts.set('marker', 'e');
			if (sign === '-' && member('sign') !== undefined) parts.set('sign', '-');
			return parts;
		};
		const takesList = (route: PortableMemberStep): boolean => route.multiple || route.seats.some((seat) => seat.many === true);
		const seats = (route: PortableMemberStep, item: unknown): boolean =>
			isStructure(item)
				? pick(item, route.seats) !== undefined
				: typeof item === 'string'
					? route.seats.some((seat) => seat.leaf !== undefined || seat.kinds.length === 0)
					: !hasKind(item) || route.seats.some((seat) => seat.kinds.includes(item.$type));
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
			const values = new Map<string, unknown>(memberKeys(structure).flatMap((name) => (holes.has(name) || structure[name] === undefined ? [] : [[name, structure[name]] as const])));
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
				if (arm.numeric === undefined) frame.input = scalar;
				else if (arm.numeric.length === 1) values.set(arm.numeric[0]!, scalar);
				else for (const [name, part] of decimalParts(Number(scalar), arm, structure.$path)) values.set(name, part);
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
