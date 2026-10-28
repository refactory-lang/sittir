import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableCallShape,
	PortableContainer,
	PortableMount,
	PortableFlagStep,
	PortableKeyedMount,
	PortableMemberStep,
	PortableMountCall,
	PortablePickTest,
	PortablePreset,
	PortableSeat,
	PortableSlotStep,
	PortableValueBuild,
	QueryPlan
} from '@sittir/types';
import type { ChildTest, GrammarRoutes, MemberRoute, ReadEntry, SlotStep } from '../../../bindings/routes.ts';
import { heldSteps, modelNode } from '../../../bindings/routes.ts';
import type { ModelMount, SlotModel } from '../../../bindings/facts.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledPattern,
	AssembledSupertype,
	isMultiple,
	isRequired,
	slotFilledWhenOmitted,
	storageKindOfRef,
	valueParseKindsOf,
	type AssembledNode,
	type AssembledNonterminal,
	type NodeRef
} from '../../../compiler/model/node-map.ts';
import { buildFactoryMap } from '../../factory-map.ts';
import { slotResolverKinds, transparentEnvelopeTextLeaves } from '../../from.ts';
import { numberShapes, numericSlotKeys } from '../../interior.ts';
import { findKindEntry, fixedTextKinds, type KindEnumEntry } from '../../kind-discriminant.ts';
import { membershipKindsOf } from '../../membership.ts';

export type PickDiagnosticCode =
	| 'portable-pick-undecided'
	| 'portable-form-product'
	| 'portable-value-undecided';

const FORM_PRODUCT_LIMIT = 8;

export interface PickDiagnostic {
	readonly code: PickDiagnosticCode;
	readonly path: string;
	readonly kinds: readonly string[];
	readonly holder?: string;
	readonly slot?: string;
	readonly arms?: number;
}

export interface PortableBuildInput {
	readonly routes: GrammarRoutes;
	readonly model: SlotModel;
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly flagPlans: ReadonlyMap<string, ReadonlyMap<string, QueryPlan | null>>;
}

export interface PortableBuildOutput {
	readonly table: PortableBuildTable;
	readonly diagnostics: readonly PickDiagnostic[];
}

interface Arm {
	readonly kind: string;
	readonly entry: ReadEntry;
	readonly arm: Omit<PortableBuildArm, 'when' | 'holders'>;
	readonly memberKinds: ReadonlyMap<string, ReadonlySet<number>>;
	readonly required: ReadonlySet<string>;
	readonly text: string | undefined;
	readonly value: boolean | undefined;
	readonly scalar: 'integer' | 'float' | undefined;
	readonly complete: boolean;
	readonly builds: string;
}

const sortedIds = (ids: Iterable<number>): readonly number[] => [...new Set(ids)].sort((a, b) => a - b);

const disjoint = (sets: readonly ReadonlySet<number>[]): boolean =>
	sets.every((a, i) => sets.every((b, j) => i === j || [...a].every((id) => !b.has(id))));

export function portableBuildTable({ routes, model, nodeMap, kindEntries, flagPlans }: PortableBuildInput): PortableBuildOutput {
	const typeOf = (kind: string): number | undefined => findKindEntry(kindEntries, kind)?.id;
	const shapes = buildFactoryMap(nodeMap, kindEntries).factoryShapes;
	const fixedText = new Map(fixedTextKinds(nodeMap, kindEntries));
	const numeric = numberShapes(nodeMap);
	const builders = new Map<string, PortableCallShape>();
	const nodeOf = (kind: string): AssembledNode | undefined => nodeMap.nodes.get(modelNode(model, kind)?.kind ?? kind);
	const slotOf = (owner: string, slot: string): AssembledNonterminal | undefined => nodeOf(owner)?.slots.find((s) => s.name === slot);
	const storageName = (kind: string): string => modelNode(model, kind)?.kind ?? kind;
	const flagOnly: ReadonlySet<string> = new Set(
		[...routes.members.values()].flatMap((members) => members.flatMap((route) => (route.flag === true && route.route === 'kind' ? [storageName(route.kind)] : [])))
	);
	const declaredValues = new Map<string, boolean>();
	for (const [kind, entries] of routes.readEntries) for (const { claim } of entries) if (claim.value !== undefined) declaredValues.set(kind, claim.value);
	const register = (key: string, shape: PortableCallShape): string => {
		const known = builders.get(key);
		if (known !== undefined && known !== shape) throw new Error(`portable build: ${key} takes both ${known} and ${shape} input`);
		builders.set(key, shape);
		return key;
	};
	const shapeOf = (kind: string): PortableCallShape => shapes[nodeOf(kind)?.kind ?? kind] ?? 'constant';
	const plainBuilderOf = (kind: string): string | undefined => {
		const node = nodeOf(kind);
		const path = node?.builderPath;
		if (node === undefined || path === undefined || fixedText.has(node.kind)) return undefined;
		const shape = shapes[node.kind];
		if (shape === undefined) throw new Error(`portable build: ${kind} has a builder path but no call shape`);
		return register(path.join('.'), shape);
	};
	const builderOf = (kind: string): string | undefined => {
		const up = mountHolders.get(storageName(kind));
		return up === undefined ? plainBuilderOf(kind) : mountAt(up.holder, up.slot, kind)?.builder;
	};
	const mountOf = (owner: string, slot: string, kind: string): ModelMount | undefined => {
		const mounts = modelNode(model, owner)?.slots.find((s) => s.name === slot)?.mounts;
		return mounts?.[kind] ?? mounts?.[storageName(kind)];
	};
	const callShape = (call: PortableMountCall, holder: string, seated: PortableCallShape): PortableCallShape =>
		call === 'none' ? 'constant' : call === 'holder' ? shapeOf(holder) : call === 'child' ? seated : 'config';
	const keyAt = (owner: string, slot: string): string => {
		const key = slotOf(owner, slot)?.propertyName;
		if (key === undefined) throw new Error(`portable build: ${owner} mounts a kind at ${slot}, which it has no slot for`);
		return key;
	};
	interface MountBuilder {
		readonly builder: string;
		readonly shape: PortableCallShape;
		readonly outer?: PortableKeyedMount;
	}
	const mountBuilderOf = (owner: string, name: string, call: PortableMountCall, seated: PortableCallShape): MountBuilder | undefined => {
		const own = callShape(call, owner, seated);
		const up = mountHolders.get(storageName(owner));
		if (up === undefined) {
			const holder = plainBuilderOf(owner);
			return holder === undefined ? undefined : { builder: `${holder}.${name.replaceAll('$', '.')}`, shape: own };
		}
		const host = mountOf(up.holder, up.slot, owner);
		const nested = name.replaceAll('.', '$');
		const upCall = host?.nested?.[nested];
		if (host === undefined || upCall === undefined) throw new Error(`portable build: ${up.holder} mounts ${owner} with no nested mount ${nested}`);
		const above = mountBuilderOf(up.holder, `${host.mount}$${nested}`, upCall, own);
		if (above === undefined || (upCall !== 'keyed' && upCall !== 'keyedArgs')) return above;
		return { ...above, outer: { call: upCall, key: keyAt(up.holder, up.slot), seats: own, ...(above.outer === undefined ? {} : { outer: above.outer }) } };
	};
	const mountAt = (owner: string, slot: string, kind: string): { readonly builder: string; readonly mounted: PortableMount } | undefined => {
		const mount = mountOf(owner, slot, kind);
		if (mount === undefined) return undefined;
		const seats = shapeOf(kind);
		const fn = mountBuilderOf(owner, mount.mount, mount.call, seats);
		if (fn === undefined) return undefined;
		const builder = register(fn.builder, fn.shape);
		const outer = fn.outer === undefined ? {} : { outer: fn.outer };
		const { call } = mount;
		const key = keyAt(owner, slot);
		return { builder, mounted: call === 'keyed' || call === 'keyedArgs' ? { call, key, seats, ...outer } : { call, key, ...outer } };
	};
	const mountHolders = new Map<string, { readonly holder: string; readonly slot: string }>();
	for (const node of model.values())
		for (const slot of node.slots) for (const kind of Object.keys(slot.mounts ?? {})) if (!mountHolders.has(kind)) mountHolders.set(kind, { holder: node.kind, slot: slot.name });
	const mountRoot = (kind: string, seen: ReadonlySet<string> = new Set()): string => {
		const mounted = mountHolders.get(kind);
		return mounted === undefined || seen.has(kind) ? kind : mountRoot(storageName(mounted.holder), new Set([...seen, kind]));
	};
	const admitted = (slot: AssembledNonterminal): readonly string[] => membershipKindsOf(valueParseKindsOf(slot), nodeMap);
	const textLeaf = (kind: string): boolean => {
		const node = nodeOf(kind);
		return node instanceof AssembledPattern || (node !== undefined && transparentEnvelopeTextLeaves(node, nodeMap).length > 0);
	};
	const requiredSlot = (owner: string, slot: string): boolean => modelNode(model, owner)?.slots.find((s) => s.name === slot)?.required === true;
	const optional = (owner: string, slot: AssembledNonterminal): { readonly optional?: true } => (requiredSlot(owner, slot.name) ? {} : { optional: true });
	interface Seat {
		readonly holder: AssembledNode;
		readonly key: string;
		readonly slot: AssembledNonterminal;
		readonly kinds: ReadonlySet<string>;
		readonly within: readonly PortableContainer[];
		readonly many: boolean;
	}
	const seatsOf = (
		holder: AssembledNode,
		key: string,
		owner: string,
		slot: AssembledNonterminal,
		within: readonly PortableContainer[],
		entered: ReadonlySet<string>
	): Seat[] => {
		const kinds = new Set<string>();
		const nested: Seat[] = [];
		const visited = new Set<string>();
		const visit = (refs: readonly NodeRef[]): void => {
			for (const ref of refs) {
				const kind = ref.node === undefined ? ref.parseKind?.name : storageKindOfRef(ref.node);
				const node = kind === undefined ? undefined : nodeMap.nodes.get(kind);
				if (kind === undefined || node === undefined || visited.has(kind)) continue;
				visited.add(kind);
				const unwrap = routes.readEntries.has(kind) || entered.has(kind) ? undefined : routes.containers.get(kind);
				const element = unwrap === undefined ? undefined : slotOf(kind, unwrap.slot);
				if (element !== undefined) {
					const visible = node.kindId !== undefined;
					const mount = mountAt(owner, slot.name, kind);
					const builder = mount?.builder ?? builderOf(kind);
					const outer = mount !== undefined && within.length > 0 ? within.at(-1) : undefined;
					const mounted = mount === undefined ? undefined : within.length === 0 ? mount.mounted : outer?.mounted !== undefined ? mount.mounted : undefined;
					const container: PortableContainer = {
						...(builder === undefined ? {} : { builder }),
						key: element.propertyName,
						...optional(kind, element),
						...(mounted === undefined ? {} : { mounted })
					};
					if (mount !== undefined && mounted === undefined && mount.mounted.call !== 'child')
						throw new Error(`portable build: ${kind} in ${owner}'s ${slot.name} builds through ${mount.builder}, which takes ${mount.mounted.call} input inside another container`);
					const next = outer === undefined ? [...within, container] : [...within.slice(0, -1), container];
					nested.push(...seatsOf(visible ? node : holder, visible ? element.propertyName : key, kind, element, next, new Set([...entered, kind])));
				} else if (node instanceof AssembledSupertype) {
					if (node.kindId !== undefined) kinds.add(kind);
					visit(node.subtypes);
				} else if (node.kindId !== undefined) kinds.add(kind);
			}
		};
		visit(slot.values);
		return [{ holder, key, slot, kinds, within, many: isMultiple(slot) }, ...nested.filter((seat) => seat.kinds.size > 0 || seat.many)];
	};
	const seatsOfRoute = (path: readonly SlotStep[]): Seat[] | undefined => {
		const slot = lastSlot(path);
		const at = [...path].reverse().find((step) => nodeOf(step.owner)?.kindId !== undefined);
		const holder = at === undefined ? undefined : nodeOf(at.owner);
		const key = at === undefined ? undefined : slotOf(at.owner, at.slot)?.propertyName;
		const owner = path.at(-1)?.owner;
		return slot === undefined || holder === undefined || key === undefined || owner === undefined ? undefined : seatsOf(holder, key, owner, slot, [], new Set());
	};
	const seatRecord = (seat: Seat): PortableSeat => {
		const leaf = defaultLeaf(seat.slot);
		return {
		at: [seat.holder.kindId!, seat.key],
		kinds: sortedIds([...seat.kinds].flatMap((kind) => typeOf(kind) ?? [])),
		...(leaf === undefined ? {} : { leaf }),
		...(seat.within.length === 0 ? {} : { within: seat.within }),
		...(seat.many ? { many: true as const } : {})
		};
	};
	const valueIds = (seats: readonly Seat[]): ReadonlySet<number> => {
		const kinds = [...new Set(seats.flatMap((seat) => [...seat.kinds]))];
		return new Set(kinds.every(textLeaf) ? [] : kinds.flatMap((kind) => typeOf(kind) ?? []));
	};
	const defaultLeaf = (slot: AssembledNonterminal): string | undefined => {
		const { leafKinds, branchKinds } = slotResolverKinds(slot, nodeMap);
		const texts = [...leafKinds, ...branchKinds].flatMap((kind) => {
			const node = nodeOf(kind);
			return node === undefined || node instanceof AssembledPattern ? [kind] : transparentEnvelopeTextLeaves(node, nodeMap);
		});
		const leaves = [...new Set(texts)].filter((kind) => {
			const node = nodeOf(kind);
			return node instanceof AssembledPattern && !numeric.has(kind) && !fixedText.has(kind);
		});
		const plain = leaves.length > 1 ? leaves.filter((kind) => nodeOf(kind)?.variantOf === undefined) : leaves;
		return plain.length === 1 ? builderOf(plain[0]!) : undefined;
	};
	const stepsOf = (path: readonly SlotStep[]): PortableSlotStep[] | undefined => {
		const steps: PortableSlotStep[] = [];
		for (const [i, step] of path.entries()) {
			const slot = slotOf(step.owner, step.slot);
			if (slot === undefined) return undefined;
			const next = path[i + 1];
			const mount = next === undefined ? undefined : mountAt(step.owner, step.slot, next.owner);
			const builder = mount?.builder ?? (next === undefined ? undefined : builderOf(next.owner));
			steps.push({
				key: slot.propertyName,
				...(builder === undefined ? {} : { builder }),
				...optional(step.owner, slot),
				...(mount === undefined ? {} : { mounted: mount.mounted })
			});
		}
		return steps;
	};
	const lastSlot = (path: readonly SlotStep[]): AssembledNonterminal | undefined => {
		const last = path.at(-1);
		return last === undefined ? undefined : slotOf(last.owner, last.slot);
	};
	const tokenKind = (path: readonly SlotStep[], text: string): string | undefined => {
		const slot = lastSlot(path);
		const kinds = slot === undefined ? [] : admitted(slot).filter((kind) => fixedText.get(kind) === text);
		return kinds.length === 1 ? kinds[0] : undefined;
	};
	const valuePreset = (path: readonly SlotStep[], kind: string): PortablePreset | undefined => {
		const steps = stepsOf(path);
		if (steps === undefined) return undefined;
		const last = path.at(-1)!;
		const mount = mountAt(last.owner, last.slot, kind);
		if (mount !== undefined) return { steps: [...steps.slice(0, -1), { ...steps.at(-1)!, builder: mount.builder, mounted: mount.mounted }] };
		const id = typeOf(kind);
		if (fixedText.has(kind) && id !== undefined) return { steps, kind: id };
		const builder = builderOf(kind);
		return builder === undefined ? undefined : { steps, builder };
	};
	const held = (owner: string, selectorPath: ChildTest['subject']): SlotStep[] | undefined => {
		if (selectorPath.up !== 0) return undefined;
		let holder: string | undefined = owner;
		const out: SlotStep[] = [];
		for (const selector of selectorPath.down) {
			if (holder === undefined) return undefined;
			const steps = heldSteps(model, holder, selector);
			if (steps === undefined) return undefined;
			out.push(...steps.map((step) => ({ owner: step.holder, slot: step.slot.name })));
			holder = selector.kind ?? undefined;
		}
		return out;
	};

	const memberOf = (route: MemberRoute): { readonly member: PortableMemberStep; readonly seats: readonly Seat[] } | undefined => {
		if (route.flag === true || route.spelled === true || route.path === undefined) return undefined;
		const steps = stepsOf(route.path);
		const slot = lastSlot(route.path);
		const seats = seatsOfRoute(route.path);
		if (steps === undefined || slot === undefined || seats === undefined) return undefined;
		return {
			member: {
				name: route.name,
				steps,
				multiple: route.route === 'nested' ? route.multiple : isMultiple(slot),
				seats: seats.map(seatRecord)
			},
			seats
		};
	};
	interface Site {
		readonly path: readonly SlotStep[];
		readonly enters?: string;
	}
	interface Placed extends Site {
		readonly preset: PortablePreset;
		readonly kind?: string;
	}
	interface Frame {
		readonly prefix: readonly SlotStep[];
		readonly owner: string;
		readonly continues?: string;
	}
	interface Filler {
		readonly name: string;
		readonly site: Site;
	}
	const placedValue = (path: readonly SlotStep[], kind: string): Placed | undefined => {
		const preset = valuePreset(path, kind);
		return preset === undefined ? undefined : { preset, path, kind, ...(preset.kind === undefined ? { enters: kind } : {}) };
	};
	const placedText = (path: readonly SlotStep[], text: string): Placed | undefined => {
		const kind = tokenKind(path, text);
		if (kind !== undefined) return placedValue(path, kind);
		const steps = stepsOf(path);
		return steps === undefined ? undefined : { preset: { steps, text }, path };
	};
	const placedFlag = (route: MemberRoute): Placed | undefined => {
		if (route.flag !== true || route.path === undefined) return undefined;
		switch (route.route) {
			case 'presence':
				return placedText(route.path, route.token);
			case 'kind':
				return placedValue(route.path, route.kind);
			case 'slot':
			case 'nested':
				return undefined;
		}
	};
	const unsetOf = (flag: Placed): PortablePreset | undefined => {
		const slot = lastSlot(flag.path);
		if (slot === undefined || flag.kind === undefined || !isRequired(slot) || slotFilledWhenOmitted(slot, nodeMap)) return undefined;
		const values = admitted(slot);
		const others = values.filter((kind) => kind !== flag.kind);
		return others.length === 1 && values.length === 2 && values.every((kind) => fixedText.has(kind)) ? placedValue(flag.path, others[0]!)?.preset : undefined;
	};
	const unfilledOf = (kind: string): readonly string[] => {
		const node = nodeOf(kind);
		if (!(node instanceof AbstractAssembledCompound) || textLeaf(kind)) return [];
		return node.slots.flatMap((slot) => (slot.registeredOption !== undefined || slotFilledWhenOmitted(slot, nodeMap) ? [] : [slot.name]));
	};
	const sameStep = (a: SlotStep, b: SlotStep): boolean => storageName(a.owner) === storageName(b.owner) && a.slot === b.slot;
	const through = (site: Site, prefix: readonly SlotStep[], at: SlotStep): boolean =>
		site.path.length > prefix.length && prefix.every((step, i) => sameStep(step, site.path[i]!)) && sameStep(at, site.path[prefix.length]!);
	const framesOf = (site: Site): Frame[] => [
		...site.path.slice(1).map((step, i): Frame => ({ prefix: site.path.slice(0, i + 1), owner: step.owner, continues: step.slot })),
		...(site.enters === undefined ? [] : [{ prefix: site.path, owner: site.enters }])
	];
	const frameKey = (frame: Frame): string => [...frame.prefix.map((step) => `${storageName(step.owner)}.${step.slot}`), storageName(frame.owner)].join('/');
	const fillersOf = (
		frame: Frame,
		fillers: readonly Filler[],
		presets: readonly Site[]
	): readonly (readonly string[])[] | undefined => {
		const groups: string[][] = [];
		for (const slot of unfilledOf(frame.owner)) {
			if (slot === frame.continues) continue;
			const at = { owner: frame.owner, slot };
			if (presets.some((preset) => through(preset, frame.prefix, at))) continue;
			const names = [...new Set(fillers.flatMap((filler) => (through(filler.site, frame.prefix, at) ? [filler.name] : [])))].sort();
			if (names.length === 0) return undefined;
			groups.push(names);
		}
		return groups;
	};
	const formAt = (site: Site, kind: string, slot: string, forms: readonly string[]): string | null | undefined => {
		const first = site.path[0];
		if (first === undefined || !sameStep(first, { owner: kind, slot })) return undefined;
		const next = site.path[1]?.owner ?? site.enters;
		return next !== undefined && forms.includes(storageName(next)) ? storageName(next) : null;
	};
	const bareFormSlotsOf = (kind: string, claimed: readonly Site[]): { readonly slot: string; readonly forms: readonly string[]; readonly bare: readonly string[] }[] => {
		const unfilled = unfilledOf(kind);
		return (modelNode(model, kind)?.slots ?? []).flatMap((slot) => {
			if (slot.mounts === undefined || !unfilled.includes(slot.name)) return [];
			const forms = Object.keys(slot.mounts).map(storageName);
			if (claimed.some((site) => formAt(site, kind, slot.name, forms) !== undefined)) return [];
			const at = [{ owner: kind, slot: slot.name }];
			const bare = forms.filter((form) => fillersOf({ prefix: at, owner: form }, [], claimed) !== undefined);
			return bare.length === 0 ? [] : [{ slot: slot.name, forms, bare }];
		});
	};
	const product = <T,>(lists: readonly (readonly T[])[]): T[][] => lists.reduce<T[][]>((acc, list) => acc.flatMap((head) => list.map((item) => [...head, item])), [[]]);
	const formDiagnostics: PickDiagnostic[] = [];

	const armsOf = (kind: string, entry: ReadEntry): Arm[] => {
		const node = nodeOf(kind);
		const id = typeOf(kind);
		if (node === undefined || id === undefined) throw new Error(`portable build: ${kind} reads as ${entry.vocab} but has no kind id`);
		const routed = entry.members.flatMap((route) => {
			const built = memberOf(route);
			return built === undefined || route.path === undefined ? [] : [{ ...built, name: route.name, site: { path: route.path } }];
		});
		const flagged = entry.members.flatMap((route) => {
			const placed = placedFlag(route);
			return placed === undefined ? [] : [{ ...placed, name: route.name }];
		});
		const claimed = [
			...entry.pins.flatMap((pin) => {
				const path = held(kind, { up: 0, down: [{ field: pin.slot, kind: null, after: null, anchor: null }] });
				const placed = path === undefined ? undefined : placedText(path, pin.text);
				return placed === undefined ? [] : [placed];
			}),
			...entry.children.flatMap((child) => {
				const path = held(kind, child.subject);
				if (path === undefined) return [];
				if ('text' in child) return placedText(path, child.text) ?? [];
				if ('kinds' in child && child.kinds.length === 1) return placedValue(path, child.kinds[0]!) ?? [];
				return [];
			}),
			...entry.claim.predicates.flatMap((predicate) => {
				const [value, ...more] = predicate.arguments;
				if (predicate.operator !== 'eq' || value === undefined || more.length > 0 || !('text' in value)) return [];
				const site = predicate.subject ?? { up: 0, down: [] };
				if (site.down.length === 0 && fixedText.get(node.kind) === value.text) return [];
				const path = held(kind, site);
				return path === undefined ? [] : (placedText(path, value.text) ?? []);
			})
		];
		const keys = (preset: PortablePreset): string => preset.steps.map((step) => step.key).join('.');
		const mounted = mountHolders.get(storageName(kind));
		const mount = mounted === undefined ? undefined : mountAt(mounted.holder, mounted.slot, kind);
		if (mount?.mounted.outer !== undefined) throw new Error(`portable build: ${kind} builds through ${mount.builder}, which seats its holder in another holder's key`);
		const builder = mount?.builder ?? builderOf(kind);
		const builds = mountRoot(storageName(kind));
		const builtId = typeOf(builds);
		if (builtId === undefined) throw new Error(`portable build: ${kind} builds through ${builds}, which has no kind id`);
		const seated = builder === undefined && !fixedText.has(node.kind) ? shapes[node.kind] : undefined;
		const shape = numeric.get(kind);
		const combos = product(bareFormSlotsOf(kind, claimed).map(({ slot, forms, bare }) => [...bare, null].map((choice) => ({ slot, forms, bare, choice }))));
		if (combos.length > FORM_PRODUCT_LIMIT) formDiagnostics.push({ code: 'portable-form-product', path: entry.vocab, kinds: [kind], arms: combos.length });
		return combos.flatMap((combo): Arm[] => {
			const keeps = (site: Site): boolean =>
				combo.every(({ slot, forms, bare, choice }) => {
					const form = formAt(site, kind, slot, forms);
					return form === undefined || (choice === null ? form === null || !bare.includes(form) : form === choice);
				});
			const placed = [...claimed, ...combo.flatMap(({ slot, choice }) => (choice === null ? [] : (placedValue([{ owner: kind, slot }], choice) ?? [])))];
			const members = routed.filter(({ site }) => keeps(site));
			const replaced = (site: Site): boolean =>
				members.some((member) => member.site.path.length === site.path.length && member.site.path.every((step, i) => sameStep(step, site.path[i]!)));
			const flags = flagged.filter(keeps);
			const flagFillers = flags.map(({ name, path, enters }): Filler => ({ name, site: { path, ...(enters === undefined ? {} : { enters }) } }));
			const groupsOf = (frames: readonly Frame[], fillers: readonly Filler[]): readonly (readonly string[])[] | undefined =>
				frames.reduce<(readonly string[])[] | undefined>((groups, frame) => {
					const found = groups === undefined ? undefined : fillersOf(frame, fillers, placed);
					return groups === undefined || found === undefined ? undefined : [...groups, ...found];
				}, []);
			const armFrames = [{ prefix: [], owner: kind }, ...placed.flatMap((site) => framesOf(replaced(site) ? { path: site.path } : site))];
			const armKeys = new Set(armFrames.map(frameKey));
			const requiresOf = (member: (typeof members)[number], fillers: readonly Filler[]): readonly (readonly string[])[] | undefined =>
				groupsOf(
					framesOf(member.site).filter((frame) => !armKeys.has(frameKey(frame))),
					fillers
				);
			const completable = (open: typeof members): typeof members => {
				const next = open.filter((member) => requiresOf(member, [...open, ...flagFillers]) !== undefined);
				return next.length === open.length ? open : completable(next);
			};
			const survivors = completable(members);
			const fillers = [...survivors, ...flagFillers];
			if (groupsOf(armFrames, fillers) === undefined) return [];
			const completed = survivors.map((member) => {
				const requires = [...new Map(requiresOf(member, fillers)!.map((group) => [group.join(','), group])).values()];
				return { ...member, member: { ...member.member, ...(requires.length === 0 ? {} : { requires }) } };
			});
			const presets = placed.map(({ preset }) => preset);
			const deepest = presets.filter((preset) => !presets.some((other) => other !== preset && keys(other).startsWith(`${keys(preset)}.`)));
			const flagSteps: Record<string, PortableFlagStep> = {};
			for (const flag of flags) {
				const other = unsetOf(flag);
				const unset = [...(flagSteps[flag.name]?.unset ?? []), ...(other === undefined ? [] : [other])];
				flagSteps[flag.name] = { presets: [...(flagSteps[flag.name]?.presets ?? []), flag.preset], ...(unset.length === 0 ? {} : { unset }) };
			}
			const requiredPath = (path: readonly SlotStep[]): boolean => path.every((step) => requiredSlot(step.owner, step.slot));
			const dropped = new Set(members.flatMap(({ site }) => (survivors.some((member) => member.site === site) ? [] : [site.path])));
			const required = new Set(
				entry.members.flatMap((route) =>
					route.flag !== true &&
					route.spelled !== true &&
					route.path !== undefined &&
					keeps({ path: route.path }) &&
					!dropped.has(route.path) &&
					requiredPath(route.path)
						? [route.name]
						: []
				)
			);
			const memberKinds = new Map<string, ReadonlySet<number>>();
			for (const { member, seats } of completed) if (!memberKinds.has(member.name)) memberKinds.set(member.name, valueIds(seats));
			const numericKeys = shape !== undefined && builder !== undefined && builders.get(builder) === 'config' ? numericSlotKeys(node) : [];
			const numeric = [
				...new Set(completed.flatMap(({ member }) => (member.steps.length === 1 && numericKeys.includes(member.steps[0]!.key) ? [member.name] : [])))
			];
			return [
				{
					kind,
					entry,
					memberKinds,
					required,
					builds,
					text: fixedText.get(kind),
					value: declaredValues.get(kind),
					scalar: shape === undefined ? undefined : shape.base === 'float' ? 'float' : 'integer',
					complete: shape?.base !== 'float' || shape.complete,
					arm: {
						kind: builtId,
						...(builder === undefined ? {} : { builder }),
						...(mount === undefined ? {} : { mounted: mount.mounted }),
						...(seated === undefined ? {} : { seated }),
						...(numeric.length === 0 ? {} : { numeric }),
						members: completed.map(({ member }) => member),
						presets: deepest,
						flags: flagSteps,
						...(entry.template === undefined ? {} : { template: { member: entry.template.target, pattern: entry.template.template, holes: entry.template.holes } })
					}
				}
			];
		});
	};

	const byPath = new Map<string, Arm[]>();
	for (const [kind, entries] of routes.readEntries) {
		const node = modelNode(model, kind);
		if (kind.startsWith('_') || node === undefined || node.modelType === 'supertype' || typeOf(kind) === undefined) continue;
		for (const entry of entries) {
			const arms = byPath.get(entry.vocab) ?? byPath.set(entry.vocab, []).get(entry.vocab)!;
			if (arms.some((arm) => arm.kind === kind)) continue;
			arms.push(...armsOf(kind, entry));
		}
	}
	for (const [path, arms] of byPath) {
		const pickable = arms.filter((arm) => !flagOnly.has(storageName(arm.kind)));
		if (pickable.length > 0 && pickable.length < arms.length) byPath.set(path, pickable);
	}

	const diagnostics: PickDiagnostic[] = [...formDiagnostics];
	const storageKinds = (refs: readonly NodeRef[], seen = new Set<string>()): string[] =>
		refs.flatMap((ref) => {
			const kind = ref.node === undefined ? ref.parseKind?.name : storageKindOfRef(ref.node);
			const node = kind === undefined ? undefined : nodeMap.nodes.get(kind);
			if (kind === undefined || node === undefined || seen.has(kind)) return [];
			seen.add(kind);
			if (node instanceof AssembledSupertype) return [kind, ...storageKinds(node.subtypes, seen)];
			if (node.kindId === undefined) return [kind, ...node.slots.flatMap((slot) => storageKinds(slot.values, seen))];
			return [kind];
		});
	const holderSlots = [...nodeMap.nodes.values()].flatMap((holder) =>
		holder.kindId === undefined ? [] : holder.slots.map((slot) => ({ holder, slot, kinds: new Set(storageKinds(slot.values)) }))
	);
	const storageOf = (arm: Arm): string => storageName(arm.kind);
	const isLeaf = (arm: Arm): boolean => textLeaf(arm.kind);
	type Part = readonly [test: PortablePickTest | undefined, arms: readonly Arm[]];
	let holders = new Map<Arm, (readonly [number, string])[]>();
	const variantChain = (kind: string): string[] => {
		const parent = nodeOf(kind)?.variantOf;
		return parent === undefined || nodeMap.nodes.get(parent) === undefined ? [] : [parent, ...variantChain(parent)];
	};
	const defaultOf = (node: AssembledNode | undefined): string | undefined => {
		const chosen = node instanceof AssembledSupertype ? (node.optionDefaultSubtype ?? node.defaultVariantSubtype) : undefined;
		if (chosen === undefined) return undefined;
		const kind = storageKindOfRef(chosen.node);
		return nodeMap.nodes.get(kind) instanceof AssembledSupertype ? defaultOf(nodeMap.nodes.get(kind)) : kind;
	};
	const grammarDefault = (kinds: readonly string[]): { readonly supertype: AssembledNode; readonly kind: string } | undefined => {
		const chains = kinds.map(variantChain);
		const common = chains[0]?.find((kind) => chains.every((other) => other.includes(kind)));
		const supertype = common === undefined ? undefined : nodeMap.nodes.get(common);
		const kind = defaultOf(supertype);
		return supertype === undefined || kind === undefined || !kinds.includes(kind) ? undefined : { supertype, kind };
	};
	const literalSplit =
		(literal: (arm: Arm) => PortablePickTest | undefined) =>
		(group: readonly Arm[]): readonly Part[] | undefined => {
			const fixed = group.flatMap((arm) => {
				const test = literal(arm);
				return test === undefined ? [] : [[arm, test] as const];
			});
			if (fixed.length === 0 || new Set(fixed.map(([, test]) => JSON.stringify(test))).size < fixed.length) return undefined;
			const rest = group.filter((arm) => literal(arm) === undefined);
			return [...fixed.map(([arm, test]): Part => [test, [arm]]), ...(rest.length === 0 ? [] : [[undefined, rest] as Part])];
		};
	const splitters: readonly ((group: readonly Arm[]) => readonly Part[] | undefined)[] = [
		literalSplit((arm) => (arm.value === undefined ? undefined : { boolean: arm.value })),
		literalSplit((arm) => (arm.text === undefined ? undefined : { text: arm.text })),
		(group) => {
			const scalars = [...new Set(group.flatMap((arm) => arm.scalar ?? []))];
			if (scalars.length === 0 || (scalars.length === 1 && group.every((arm) => arm.scalar !== undefined))) return undefined;
			const rest = group.filter((arm) => arm.scalar === undefined);
			return [...scalars.map((scalar): Part => [undefined, group.filter((arm) => arm.scalar === scalar)]), ...(rest.length === 0 ? [] : [[undefined, rest] as Part])];
		},
		(group) => {
			const implied = (arm: Arm, flag: string): boolean | undefined => {
				const plan = flagPlans.get(arm.kind)?.get(flag) ?? flagPlans.get(storageOf(arm))?.get(flag);
				return plan === undefined ? false : plan !== null && plan.op === 'and' && plan.of.length === 0 ? true : undefined;
			};
			const flags = [...new Set(group.flatMap((arm) => [...(flagPlans.get(arm.kind) ?? flagPlans.get(storageOf(arm)) ?? new Map()).keys()]))].sort();
			const flag = flags.find((f) => group.every((arm) => implied(arm, f) !== undefined) && new Set(group.map((arm) => implied(arm, f))).size > 1);
			if (flag === undefined) return undefined;
			return [true, false].map((set): Part => [{ flag, set }, group.filter((arm) => implied(arm, flag) === set)]);
		},
		(group) => {
			const found = grammarDefault(group.map(storageOf));
			if (found === undefined) return undefined;
			const ordered = [...group].sort((a, b) => Number(storageOf(b) === found.kind) - Number(storageOf(a) === found.kind));
			return ordered.map((arm): Part => [{ variant: found.supertype.kind, value: arm.arm.kind, ...(storageOf(arm) === found.kind ? { default: true as const } : {}) }, [arm]]);
		},
		(group) => {
			const names = (arm: Arm): string[] => arm.arm.members.map((m) => m.name).sort();
			const parts = new Map<string, Arm[]>();
			for (const arm of group) (parts.get(names(arm).join(',')) ?? parts.set(names(arm).join(','), []).get(names(arm).join(','))!).push(arm);
			if (parts.size < 2) return undefined;
			const required = (arm: Arm): string[] => [...arm.required].sort();
			const sets = [...parts.values()].map((arms) => ({ own: names(arms[0]!), needs: required(arms[0]!), arms }));
			const passesBoth = (x: (typeof sets)[number], y: (typeof sets)[number]): boolean => {
				const shared = x.own.filter((name) => y.own.includes(name));
				return shared.length > 0 && x.needs.every((name) => shared.includes(name)) && y.needs.every((name) => shared.includes(name));
			};
			const components: (typeof sets)[] = [];
			for (const set of sets) {
				const joined = components.filter((component) => component.some((other) => passesBoth(set, other)));
				const merged = [...joined.flat(), set];
				for (const component of joined) components.splice(components.indexOf(component), 1);
				components.push(merged);
			}
			if (components.length < 2) return undefined;
			const ownOf = (component: (typeof sets)[number][]): string[] => [...new Set(component.flatMap((set) => set.own))].sort();
			return components
				.sort((x, y) => ownOf(x).length - ownOf(y).length)
				.map((component): Part => {
					const needs = component.map((set) => set.needs).reduce((x, y) => x.filter((name) => y.includes(name)));
					return [{ absent: [], required: needs }, component.flatMap((set) => set.arms)];
				});
		},
		(group) => {
			const subset = (a: ReadonlySet<number>, b: ReadonlySet<number>): boolean => [...a].every((id) => b.has(id));
			const partsBy = (name: string): Arm[][] | undefined => {
				if (group.some((arm) => (arm.memberKinds.get(name)?.size ?? 0) === 0)) return undefined;
				const parts = new Map<string, Arm[]>();
				for (const arm of group) {
					const key = sortedIds(arm.memberKinds.get(name)!).join(',');
					(parts.get(key) ?? parts.set(key, []).get(key)!).push(arm);
				}
				if (parts.size < 2) return undefined;
				const sets = [...parts.values()].map((arms) => arms[0]!.memberKinds.get(name)!);
				const nested = sets.every((x, i) => sets.every((y, j) => i === j || disjoint([x, y]) || subset(x, y) || subset(y, x)));
				return nested ? [...parts.values()].sort((x, y) => x[0]!.memberKinds.get(name)!.size - y[0]!.memberKinds.get(name)!.size) : undefined;
			};
			const member = group[0]!.arm.members.map((m) => m.name).find((name) => partsBy(name) !== undefined);
			return member === undefined
				? undefined
				: partsBy(member)!.map((arms): Part => [{ member, kinds: sortedIds(arms[0]!.memberKinds.get(member)!) }, arms]);
		},
		(group) => {
			if (!group.every((arm) => arm.scalar !== undefined)) return undefined;
			const complete = group.filter((arm) => arm.complete);
			if (complete.length !== 1 || complete.length === group.length) return undefined;
			return [complete[0]!, ...group.filter((arm) => !arm.complete)].map((arm): Part => [undefined, [arm]]);
		}
	];
	const paths: Record<string, PortableBuildPath> = {};
	const decided = new Map<string, Record<keyof PortableValueBuild, string | undefined>>();
	for (const [path, arms] of [...byPath].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
		const tests = new Map<Arm, PortablePickTest[]>(arms.map((arm) => [arm, []]));
		holders = new Map();
		const admittedAt = (arm: Arm): readonly (readonly [number, string])[] =>
			holderSlots.flatMap(({ holder, slot, kinds }) => (kinds.has(arm.builds) ? [[holder.kindId!, slot.propertyName] as const] : []));
		const union = new Set(arms.flatMap((arm) => admittedAt(arm).map(([holder, key]) => `${holder} ${key}`)));
		for (const arm of arms) {
			const own = admittedAt(arm);
			if (own.length > 0 && own.length < union.size) holders.set(arm, [...own]);
		}
		let root = true;
		const decide = (group: readonly Arm[]): readonly Arm[] => {
			if (group.length < 2) return group;
			for (const split of splitters) {
				const parts = split(group);
				if (parts === undefined) continue;
				return parts.flatMap(([test, part]) => {
					if (test !== undefined) for (const arm of part) tests.get(arm)!.push(test);
					return decide(part);
				});
			}
			root = false;
			const leaves = group.every(isLeaf);
			for (const { holder, slot, kinds: held } of holderSlots) {
				const hit = group.filter((arm) => held.has(arm.builds));
				if (hit.length === 1 && !holders.has(hit[0]!)) holders.set(hit[0]!, []);
				if (hit.length === 1 && !holders.get(hit[0]!)!.some(([h, k]) => h === holder.kindId && k === slot.propertyName)) holders.get(hit[0]!)!.push([holder.kindId!, slot.propertyName]);
				else if (hit.length > 1 && !leaves) diagnostics.push({ code: 'portable-pick-undecided', path, kinds: hit.map((arm) => arm.kind), holder: holder.kind, slot: slot.name });
			}
			if (!leaves && group.every((arm) => admittedAt(arm).length === 0)) diagnostics.push({ code: 'portable-pick-undecided', path, kinds: group.map((arm) => arm.kind) });
			return group;
		};
		const ordered = decide(arms);
		const scalarArms = new Map<Arm, 'integer' | 'float'>();
		for (const scalar of ['integer', 'float'] as const) {
			const pool = ordered.filter((arm) => arm.scalar === scalar);
			if (pool.length === 0) continue;
			const complete = pool.filter((arm) => arm.complete);
			const able = complete.length === 0 ? pool : complete;
			const fallback = able.length === 1 ? undefined : grammarDefault(able.map(storageOf))?.kind;
			const chosen = able.length === 1 ? able[0] : able.find((arm) => storageOf(arm) === fallback);
			if (chosen === undefined) diagnostics.push({ code: 'portable-pick-undecided', path, kinds: pool.map((arm) => arm.kind) });
			else scalarArms.set(chosen, scalar);
		}
		const kindOf = (arm: Arm | undefined): string | undefined => (arm === undefined ? undefined : storageOf(arm));
		const takes = (scalar: 'integer' | 'float'): string | undefined => kindOf([...scalarArms].find(([, taken]) => taken === scalar)?.[0]);
		decided.set(path, {
			integer: takes('integer'),
			float: takes('float'),
			true: kindOf(arms.find((arm) => arm.value === true)),
			false: kindOf(arms.find((arm) => arm.value === false))
		});
		const memberNames = (arm: Arm): readonly string[] => arm.arm.members.map((member) => member.name);
		const stated = new Set(arms.flatMap(memberNames));
		for (const arm of arms) {
			if (arm.text !== undefined) continue;
			const lacking = [...stated].filter((name) => !memberNames(arm).includes(name)).sort();
			const own = tests.get(arm)!;
			const presence = own.find((test): test is Extract<PortablePickTest, { readonly absent: readonly string[] }> => 'absent' in test);
			const required = presence === undefined ? [] : presence.required;
			const kept = own.filter((test) => test !== presence);
			tests.set(arm, lacking.length === 0 && required.length === 0 ? kept : [...kept, { absent: lacking, required }]);
		}
		paths[path] = {
			root: root && ordered.some((arm) => !holders.has(arm)),
			arms: ordered.map(
				(arm): PortableBuildArm => ({
					...arm.arm,
					...(scalarArms.has(arm) ? { scalar: scalarArms.get(arm)! } : {}),
					when: tests.get(arm)!,
					...(holders.has(arm) ? { holders: holders.get(arm)! } : {})
				})
			)
		};
	}
	const values = valueBuilds(paths, decided, (kinds) => grammarDefault(kinds)?.kind, diagnostics);
	return {
		table: {
			builders: Object.fromEntries([...builders].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
			paths,
			...(Object.keys(values).length === 0 ? {} : { values })
		},
		diagnostics
	};
}

const VALUE_KEYS = ['integer', 'float', 'true', 'false'] as const;

function valueBuilds(
	paths: Readonly<Record<string, PortableBuildPath>>,
	decided: ReadonlyMap<string, Record<keyof PortableValueBuild, string | undefined>>,
	defaultAmong: (kinds: readonly string[]) => string | undefined,
	diagnostics: PickDiagnostic[]
): Record<string, PortableValueBuild> {
	type Target = { readonly path: string; readonly kind: string };
	const armless = (path: string): boolean => (paths[path]?.arms.length ?? 0) === 0;
	const named = new Set(Object.keys(paths).flatMap((path) => path.split('.').map((_, i, parts) => parts.slice(0, i + 1).join('.'))));
	const childrenOf = (path: string): readonly string[] => [...named].filter((other) => other.startsWith(`${path}.`) && !other.slice(path.length + 1).includes('.'));
	const memo = new Map<string, Partial<Record<keyof PortableValueBuild, Target>>>();
	const derive = (path: string): Partial<Record<keyof PortableValueBuild, Target>> => {
		const known = memo.get(path);
		if (known !== undefined) return known;
		const found: Partial<Record<keyof PortableValueBuild, Target>> = {};
		for (const key of VALUE_KEYS) {
			if (!armless(path)) {
				const kind = decided.get(path)?.[key];
				if (kind !== undefined) found[key] = { path, kind };
				continue;
			}
			const candidates = childrenOf(path)
				.flatMap((child) => derive(child)[key] ?? [])
				.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
			const fallback = candidates.length > 1 ? defaultAmong(candidates.map((candidate) => candidate.kind)) : undefined;
			const chosen = candidates.length === 1 ? candidates[0] : candidates.find((candidate) => candidate.kind === fallback);
			if (chosen !== undefined) found[key] = chosen;
			else if (candidates.length > 1) diagnostics.push({ code: 'portable-value-undecided', path, kinds: candidates.map((candidate) => candidate.kind), slot: key });
		}
		memo.set(path, found);
		return found;
	};
	return Object.fromEntries(
		[...named].sort().flatMap((path) => {
			if (!armless(path)) return [];
			const found = Object.fromEntries(Object.entries(derive(path)).map(([key, target]) => [key, target.path]));
			return Object.keys(found).length === 0 ? [] : [[path, found] as const];
		})
	);
}

export function emitPortableBuild(input: PortableBuildInput): { readonly source: string; readonly diagnostics: readonly PickDiagnostic[] } {
	const { table, diagnostics } = portableBuildTable(input);
	return {
		source: [
			'// Auto-generated by @sittir/codegen — do not edit',
			'',
			"import type { PortableBuildTable } from '@sittir/types';",
			'',
			`export const build: PortableBuildTable = ${JSON.stringify(table, null, '\t')};`,
			''
		].join('\n'),
		diagnostics
	};
}
