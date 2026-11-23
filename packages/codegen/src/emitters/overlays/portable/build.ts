import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableCallShape,
	PortableCondition,
	PortableContainer,
	PortableDelimiterToken,
	PortableMount,
	PortableFlagStep,
	PortableSpelledFact,
	PortableKeyedMount,
	PortableSlotRoute,
	PortableMountCall,
	PortablePickTest,
	PortablePreset,
	PortableSeat,
	PortableSlotStep,
	PortableTemplate,
	PortableValueBuild,
	QueryPlan,
	QuerySubject
} from '@sittir/types';
import { emitShapeFailure } from '../../../compiler/diagnostics/emit-diagnostics.ts';
import { Delimiter } from '@sittir/common/delimiter';
import { builtSlots, buildsOnlyItem, holds, portablePathHasFacts, readableEntries, textBuilt } from '@sittir/common/engine';
import type { ChildTest, GrammarRoutes, SlotRoute, ReadEntry, SlotStep } from '../../../bindings/routes.ts';
import { capturedKinds, concreteKinds, entryRoutes, guaranteedBy, heldSteps, modelNode, mountHoldersOf, portableClaims, reachedBy, shownSlots, VALUE, valueTokensOf, writesText, type Guaranteed, type MountHolder } from '../../../bindings/routes.ts';
import { slotSubjectOf, tableReadEntries, type PortableFactRecord } from './read-tests.ts';
import { portableSpelledFactOf } from './spelled-facts.ts';
import type { Body } from '../../render-body.ts';
import { nodeSlotShapeOf } from '../../render-module.ts';
import type { ModelMount, ModelSlot, SlotModel, TemplateFact } from '../../../bindings/facts.ts';
import type { VocabularyScalar } from '../../../bindings/vocabulary.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { forwardedTargetKind } from '../../shared.ts';
import { SEQ, STRING } from '../../../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../../../types/rule.ts';
import {
	AbstractAssembledCompound,
	AssembledLexedPattern,
	AssembledPattern,
	AssembledSupertype,
	buildableMembersOf,
	hasOptionalElements,
	isDelimiterToken,
	isMultiple,
	isNodeRef,
	isNonEmpty,
	isRequired,
	isTerminalValue,
	memberOf as canonicalMemberOf,
	slotFilledWhenOmitted,
	storageKeyOf,
	storageKindOfRef,
	valueParseKindsOf,
	type AssembledNode,
	type AssembledNonterminal,
	type NodeRef
} from '../../../compiler/model/node-map.ts';
import { wrapperChainFor } from '../../../compiler/model/wrapper-chain.ts';
import { buildFactoryMap } from '../../factory-map.ts';
import { includesNonEmpty, patternDfa, type PatternDfa } from '../../../compiler/model/pattern-automaton.ts';
import { slotResolverKinds, transparentEnvelopeTextLeaves } from '../../from.ts';
import { DECIMAL_PARTS, interiorSlotGuards, collidesWithEarlier, interiorTextForm, type RoutedTextForm, kindNumberShape, numberSlotsSpellValue, numberSpelling, numericSlotShape, readsEveryInteger, slotPattern, wholeTextPattern, wholeTextShape, type NumberShape } from '../../interior.ts';
import { leafReDeclaration } from '../../factories.ts';
import { findKindEntry, fixedTextKinds, type KindEnumEntry } from '../../kind-discriminant.ts';
import { membershipKindsOf } from '../../membership.ts';
import { finalSeatOf, lexedContentSlot, registeredSlots } from '../../shared.ts';

const CARRIES_NODE_FLAGS: Readonly<Record<string, readonly string[]>> = { 'expression.interpolation': ['debug'] };

export type PickDiagnosticCode =
	| 'portable-pick-undecided'
	| 'portable-form-product'
	| 'portable-value-undecided'
	| 'portable-owner-undecided'
	| 'portable-token-ambiguous'
	| 'portable-claim-unplaced'
	| 'portable-kind-armless'
	| 'portable-value-unshaped'
	| 'portable-integer-partial';

const FORM_PRODUCT_LIMIT = 8;

type ArmScalar = NonNullable<PortableBuildArm['scalar']>;

const ARM_SCALARS = ['integer', 'float', 'bigint'] as const satisfies readonly ArmScalar[];

const armScalar = (shape: NumberShape | undefined, value: VocabularyScalar | undefined): ArmScalar | undefined =>
	shape === undefined || value === undefined ? undefined : value === 'bigint' ? 'bigint' : shape.base === 'float' ? 'float' : 'integer';

export interface PickDiagnostic {
	readonly code: PickDiagnosticCode;
	readonly path: string;
	readonly kinds: readonly string[];
	readonly holder?: string;
	readonly slot?: string;
	readonly arms?: number;
	readonly slots?: readonly string[];
	readonly text?: string;
}

export interface PortableBuildInput {
	readonly routes: GrammarRoutes;
	readonly model: SlotModel;
	readonly nodeMap: NodeMap;
	readonly kindEntries: readonly KindEnumEntry[];
	readonly flagPlans: ReadonlyMap<string, ReadonlyMap<string, QueryPlan | null>>;
	readonly features: readonly string[];
	readonly factOf: (entry: ReadEntry) => PortableFactRecord | undefined;
	readonly readTest: (entry: ReadEntry) => readonly PortableCondition[];
	readonly flagsOf: (path: string) => readonly string[];
	readonly valueScalarOf: (path: string) => VocabularyScalar | undefined;
	readonly bodies: ReadonlyMap<string, Body>;
}

export interface PortableBuildOutput {
	readonly table: PortableBuildTable;
	readonly diagnostics: readonly PickDiagnostic[];
	readonly presetCarried: ReadonlySet<ReadEntry>;
	readonly totalIntegerReads: ReadonlySet<number>;
	readonly freeTextClosedBy: ReadonlyMap<ReadEntry, readonly string[]>;
	readonly holes: readonly (readonly [holder: number, key: string])[];
	readonly textChoices: Readonly<Record<string, readonly string[]>>;
}

interface RoutedFill {
	readonly name: string;
	readonly site: { readonly path: readonly SlotStep[] };
	readonly seats: readonly { readonly kinds: ReadonlySet<string> }[];
}

interface Arm {
	readonly kind: string;
	readonly entry: ReadEntry;
	readonly arm: Omit<PortableBuildArm, 'when' | 'holders'>;
	readonly slotKinds: ReadonlyMap<string, ReadonlySet<number>>;
	readonly required: ReadonlySet<string>;
	readonly tested: ReadonlySet<string>;
	readonly text: string | undefined;
	readonly value: boolean | undefined;
	readonly scalar: ArmScalar | undefined;
	readonly complete: boolean;
	readonly builds: string;
	readonly chosen: boolean;
	readonly site?: readonly [holder: number, key: string];
}

const portableTemplate = (template: TemplateFact): PortableTemplate => ({ slot: template.target, pattern: template.template, holes: template.holes, match: template.match });

const routeSteps = (slot: PortableSlotRoute): readonly PortableSlotStep[] => slot.steps.filter((step) => step.flatten !== true);

const sameSlotStep = (a: PortableSlotStep, b: PortableSlotStep): boolean =>
	a.key === b.key && a.builder === b.builder && a.mounted?.key === b.mounted?.key && a.mounted?.call === b.mounted?.call;

function conflicts(a: PortableSlotRoute, b: PortableSlotRoute): boolean {
	const x = routeSteps(a);
	const y = routeSteps(b);
	for (const [i, step] of x.slice(0, y.length).entries()) {
		if (step.key !== y[i]!.key) return false;
		if (!sameSlotStep(step, y[i]!)) return true;
	}
	return x.length !== y.length;
}

export function unreadListItems(
	routes: readonly PortableSlotRoute[],
	held: (route: PortableSlotRoute, step: number) => readonly number[]
): { readonly route: PortableSlotRoute; readonly step: number } | undefined {
	const alike = (outer: PortableSlotStep, inner: PortableSlotStep): boolean =>
		outer.key === inner.key && outer.stored === inner.stored && (outer.kinds === undefined || (inner.kinds !== undefined && inner.kinds.every((kind) => outer.kinds!.includes(kind))));
	for (const route of routes)
		for (const [i, step] of route.steps.entries()) {
			if (step.many !== true || step.kinds === undefined) continue;
			const reaches = (other: PortableSlotRoute, depth: number): boolean => other !== route && other.steps.length >= depth && other.steps.slice(0, depth).every((own, j) => alike(own, route.steps[j]!));
			if (routes.some((other) => other.steps.length > 0 && other.steps.length <= i && reaches(other, other.steps.length))) continue;
			const siblings = routes.filter((other) => other.steps.length > i && reaches(other, i) && other.steps[i]!.key === step.key);
			if (siblings.some((other) => other.steps[i]!.kinds === undefined)) continue;
			const taken = new Set([...step.kinds, ...siblings.flatMap((other) => other.steps[i]!.kinds!)]);
			if (!held(route, i).every((kind) => taken.has(kind))) return { route, step: i };
		}
	return undefined;
}

function ownersOf(slots: readonly PortableSlotRoute[]): readonly (readonly number[])[] {
	const fit = (i: number, j: number): boolean => !conflicts(slots[i]!, slots[j]!);
	const owners: number[][] = [];
	const grow = (owner: readonly number[], open: readonly number[], closed: readonly number[]): void => {
		if (open.length === 0) {
			if (closed.length === 0) owners.push([...owner]);
			return;
		}
		const [next, ...rest] = open;
		grow([...owner, next!], rest.filter((i) => fit(i, next!)), closed.filter((i) => fit(i, next!)));
		grow(owner, rest, [...closed, next!]);
	};
	grow([], slots.map((_, i) => i), []);
	return owners;
}

const takesList = (slot: PortableSlotRoute): boolean => slot.multiple || slot.seats.some((seat) => seat.many === true);

const shapesOf = (slot: PortableSlotRoute): ReadonlySet<string> =>
	new Set([
		...(takesList(slot) ? slot.seats.flatMap((seat) => [...(seat.text ? ['list text'] : []), ...seat.kinds.map((kind) => `list ${kind}`)]) : []),
		...(slot.multiple ? [] : slot.seats.filter((seat) => seat.many !== true).flatMap((seat) => [...(seat.text ? ['one text'] : []), ...seat.kinds.map((kind) => `one ${kind}`)]))
	]);

function undecidedShape(slots: readonly PortableSlotRoute[], a: readonly number[], b: readonly number[]): readonly string[] | undefined {
	const routesIn = (owner: readonly number[], name: string): readonly PortableSlotRoute[] => owner.flatMap((i) => (slots[i]!.name === name ? [slots[i]!] : []));
	const names = (owner: readonly number[]): ReadonlySet<string> => new Set(owner.map((i) => slots[i]!.name));
	const onlyItem = (routes: readonly PortableSlotRoute[]): boolean => routes.some((slot) => buildsOnlyItem({ slots }, slot));
	const overlaps = (name: string): boolean => {
		if (onlyItem(routesIn(a, name)) !== onlyItem(routesIn(b, name))) return false;
		const left = new Set(routesIn(a, name).flatMap((slot) => [...shapesOf(slot)]));
		return routesIn(b, name).some((slot) => [...shapesOf(slot)].some((shape) => left.has(shape)));
	};
	const takes = (owner: readonly number[], name: string, shape: readonly string[]): boolean =>
		routesIn(owner, name).some((slot) => (slot.requires ?? []).every((group) => group.some((other) => shape.includes(other))));
	const settle = (shape: readonly string[]): readonly string[] => {
		const drop = shape.find((name) => !takes(a, name, shape) || !takes(b, name, shape));
		return drop === undefined ? shape : settle(shape.filter((name) => name !== drop));
	};
	const shape = settle([...names(a)].filter((name) => names(b).has(name) && overlaps(name)));
	if (shape.length === 0) return undefined;
	const key = (slot: PortableSlotRoute): string => JSON.stringify(slot.steps);
	const differs = shape.some((name) => {
		const left = new Set(routesIn(a, name).map(key));
		const right = routesIn(b, name).map(key);
		return right.length !== left.size || right.some((route) => !left.has(route));
	});
	return differs ? shape : undefined;
}

const landingOf = (steps: readonly PortableSlotStep[], within: readonly PortableContainer[]): string => {
	const last = steps.at(-1);
	const tail = last === undefined ? [] : [last.key, ...within.map((container) => container.key)].map((key, i) => `${key}:${within[i]?.builder ?? ''}`);
	return [...steps.slice(0, -1).map((step) => `${step.key}:${step.builder ?? ''}`), ...tail].join(' > ');
};

export const directBuilderUnfilled = (
	shape: PortableCallShape | undefined,
	arm: { readonly slots: readonly unknown[]; readonly presets: readonly unknown[]; readonly flags: object; readonly scalar: unknown; readonly content: unknown },
	requiresSlot: boolean
): boolean => shape === 'direct' && requiresSlot && arm.slots.length === 0 && arm.presets.length === 0 && Object.keys(arm.flags).length === 0 && arm.scalar === undefined && arm.content === undefined;

export function landsTwice(routes: readonly PortableSlotRoute[]): { readonly route: PortableSlotRoute; readonly landing: string } | undefined {
	const overlap = (a: PortableSlotRoute, b: PortableSlotRoute): boolean => a.reads === undefined || b.reads === undefined || a.reads.some((kind) => b.reads!.includes(kind));
	const landed = new Map<string, PortableSlotRoute[]>();
	for (const route of routes)
		for (const seat of route.seats) {
			const landing = landingOf(route.steps, seat.within ?? []);
			const at = `${route.name} ${landing}`;
			const others = landed.get(at) ?? [];
			if (others.some((other) => other !== route && overlap(other, route))) return { route, landing };
			if (!others.includes(route)) landed.set(at, [...others, route]);
		}
	return undefined;
}

const sortedIds = (ids: Iterable<number>): readonly number[] => [...new Set(ids)].sort((a, b) => a - b);

const disjoint = (sets: readonly ReadonlySet<number>[]): boolean =>
	sets.every((a, i) => sets.every((b, j) => i === j || [...a].every((id) => !b.has(id))));

export function portableBuildTable({ routes, model, nodeMap, kindEntries, flagPlans, features, factOf, readTest, flagsOf, valueScalarOf, bodies }: PortableBuildInput): PortableBuildOutput {
	const typeOf = (kind: string): number | undefined => findKindEntry(kindEntries, kind)?.id;
	const subjectOf = slotSubjectOf(nodeMap);
	const tableEntries = tableReadEntries(routes.readEntries, factOf, typeOf);
	const shapes = buildFactoryMap(nodeMap, kindEntries).factoryShapes;
	const fixedText = new Map(fixedTextKinds(nodeMap, kindEntries));
	const builders = new Map<string, PortableCallShape>();
	const optionKeys = new Map<string, readonly string[]>();
	const nodeOf = (kind: string): AssembledNode | undefined => nodeMap.nodes.get(modelNode(model, kind)?.kind ?? kind);
	const claimed = portableClaims(routes, model);
	const slotOf = (owner: string, slot: string): AssembledNonterminal | undefined => nodeOf(owner)?.slots.find((s) => s.name === slot);
	const storageName = (kind: string): string => modelNode(model, kind)?.kind ?? kind;
	const flagSites = new Map<string, Set<string> | 'any'>();
	for (const slots of routes.slots.values())
		for (const route of slots) {
			if (route.flag !== true || route.route !== 'kind') continue;
			const kind = storageName(route.kind);
			const step = route.path?.at(-1);
			const known = flagSites.get(kind);
			if (step === undefined || known === 'any') flagSites.set(kind, 'any');
			else (known ?? flagSites.set(kind, new Set()).get(kind) as Set<string>).add(`${storageName(step.owner)} ${step.slot}`);
		}
	const flagOnly: ReadonlySet<string> = new Set(flagSites.keys());
	const flagContent = (kind: string): string | undefined => {
		const node = nodeOf(kind);
		return flagOnly.has(storageName(kind)) && node instanceof AssembledLexedPattern ? lexedContentSlot(node)?.propertyName : undefined;
	};
	const flaggedAt = (kind: string, seat: Seat): boolean => {
		const sites = flagSites.get(storageName(kind));
		return sites === 'any' || sites?.has(`${storageName(seat.holder.kind)} ${seat.slot.name}`) === true;
	};
	const contentsOf = (seat: Seat): Readonly<Record<number, string>> | undefined => {
		const entries = [...seat.kinds].flatMap((kind) => {
			const key = flaggedAt(kind, seat) ? flagContent(kind) : undefined;
			const id = typeOf(kind);
			return key === undefined || id === undefined ? [] : [[id, key] as const];
		});
		return entries.length === 0 ? undefined : Object.fromEntries(entries.sort(([a], [b]) => a - b));
	};
	const literals = valueTokensOf(routes, fixedText);
	const declaredValues = new Map<string, boolean>();
	for (const [kind, entries] of routes.readEntries) for (const { claim } of entries) if (claim.value !== undefined) declaredValues.set(kind, claim.value);
	const kindValueScalars = new Map<string, VocabularyScalar>();
	for (const [kind, entries] of routes.readEntries) {
		const scalars = entries.flatMap((entry) => valueScalarOf(entry.vocab) ?? []);
		if (scalars.length > 0) kindValueScalars.set(kind, scalars.includes('bigint') ? 'bigint' : 'number');
	}
	const register = (key: string, shape: PortableCallShape): string => {
		const known = builders.get(key);
		if (known !== undefined && known !== shape) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${key} takes both ${known} and ${shape} input` });
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
		const key = register(path.join('.'), shape);
		const preference = node instanceof AbstractAssembledCompound ? node.delimiterPreference?.facet.propertyName : undefined;
		const options = [...registeredSlots(node).map((slot) => slot.propertyName), ...(preference === undefined ? [] : [preference])];
		if (options.length > 0) optionKeys.set(key, options);
		return key;
	};
	const holderOf = (kind: string): MountHolder | undefined => {
		const at = mountHoldersOf(model, storageName(kind));
		if (at.length > 1) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', ownerKind: kind, message: `${kind} is mounted at ${at.map(({ holder, slot }) => `${holder}.${slot}`).join(' and ')}, so no one mount builds it` });
		return at[0];
	};
	const builderOf = (kind: string): string | undefined => {
		const up = holderOf(kind);
		return up === undefined ? plainBuilderOf(kind) : mountAt(up.holder, up.slot, kind)?.builder;
	};
	const modelSlot = (owner: string, slot: string): ModelSlot | undefined => modelNode(model, owner)?.slots.find((s) => s.name === slot);
	const mountOf = (owner: string, slot: string, kind: string): ModelMount | undefined => {
		const mounts = modelSlot(owner, slot)?.mounts;
		return mounts?.[kind] ?? mounts?.[storageName(kind)];
	};
	const seatedAs = (shape: 'flattens' | 'tuples', owner: string, slot: string, kind: string): boolean => {
		const kinds = modelSlot(owner, slot)?.[shape] ?? [];
		return kinds.includes(kind) || kinds.includes(storageName(kind));
	};
	const flattens = (owner: string, slot: string, kind: string): boolean => seatedAs('flattens', owner, slot, kind);
	const callShape = (call: PortableMountCall, holder: string, seated: PortableCallShape): PortableCallShape =>
		call === 'none' ? 'constant' : call === 'holder' ? shapeOf(holder) : call === 'child' ? seated : 'config';
	const keyAt = (owner: string, slot: string): string => {
		const key = slotOf(owner, slot)?.propertyName;
		if (key === undefined) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${owner} mounts a kind at ${slot}, which it has no slot for` });
		return key;
	};
	interface MountBuilder {
		readonly builder: string;
		readonly shape: PortableCallShape;
		readonly outer?: PortableKeyedMount;
	}
	const mountBuilderOf = (owner: string, name: string, call: PortableMountCall, seated: PortableCallShape): MountBuilder | undefined => {
		const own = callShape(call, owner, seated);
		const up = holderOf(owner);
		if (up === undefined) {
			const holder = plainBuilderOf(owner);
			return holder === undefined ? undefined : { builder: `${holder}.${name.replaceAll('$', '.')}`, shape: own };
		}
		const host = mountOf(up.holder, up.slot, owner);
		const nested = name.replaceAll('.', '$');
		const upCall = host?.nested?.[nested];
		if (host === undefined || upCall === undefined) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${up.holder} mounts ${owner} with no nested mount ${nested}` });
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
	const admitted = (slot: AssembledNonterminal): readonly string[] => membershipKindsOf(valueParseKindsOf(slot), nodeMap);
	const textLeaf = (kind: string): boolean => {
		const node = nodeOf(kind);
		return node instanceof AssembledPattern || node instanceof AssembledLexedPattern || (node !== undefined && transparentEnvelopeTextLeaves(node, nodeMap).length > 0);
	};
	const requiredSlot = (owner: string, slot: string): boolean => modelSlot(owner, slot)?.required === true;
	const optional = (owner: string, slot: AssembledNonterminal): { readonly optional?: true } => (requiredSlot(owner, slot.name) ? {} : { optional: true });
	interface Seat {
		readonly holder: AssembledNode;
		readonly key: string;
		readonly slot: AssembledNonterminal;
		readonly kinds: ReadonlySet<string>;
		readonly refined: ReadonlySet<string>;
		readonly within: readonly PortableContainer[];
		readonly many: boolean;
		readonly entered: readonly string[];
		readonly final: boolean;
	}
	const seatsOf = (
		holder: AssembledNode,
		key: string,
		owner: string,
		slot: AssembledNonterminal,
		within: readonly PortableContainer[],
		entered: readonly string[],
		many = isMultiple(slot),
		final = false,
		only?: ReadonlySet<string>
	): Seat[] => {
		const split = final ? undefined : finalSeatOf(slot);
		if (split !== undefined) return [...seatsOf(holder, key, owner, split.rest, within, entered, many, false, only), ...seatsOf(holder, key, owner, split.last, within, entered, many, true, only)];
		const admitted = (kind: string): boolean => only === undefined || only.has(kind);
		const kinds = new Set<string>();
		const refined = new Set<string>();
		const nested: Seat[] = [];
		const visited = new Set<string>();
		const visit = (refs: readonly NodeRef[]): void => {
			for (const ref of refs) {
				const kind = ref.node === undefined ? ref.parseKind?.name : storageKindOfRef(ref.node);
				const node = kind === undefined ? undefined : nodeMap.nodes.get(kind);
				if (kind === undefined || node === undefined || visited.has(kind)) continue;
				visited.add(kind);
				const contained = routes.containers.get(kind);
				const unwrap = (routes.readEntries.has(kind) && contained?.refined !== true) || entered.includes(kind) || !admitted(kind) ? undefined : contained;
				const element = unwrap === undefined ? undefined : slotOf(kind, unwrap.slot);
				if (element !== undefined) {
					const visible = node.kindId !== undefined;
					if (visible && unwrap?.refined === true) {
						kinds.add(kind);
						refined.add(kind);
					}
					const mount = mountAt(owner, slot.name, kind);
					const builder = mount?.builder ?? builderOf(kind);
					const outer = mount !== undefined && within.length > 0 ? within.at(-1) : undefined;
					const mounted = mount === undefined ? undefined : within.length === 0 ? mount.mounted : outer?.mounted !== undefined ? mount.mounted : undefined;
					const slots = (unwrap?.slots ?? []).flatMap(({ name, slot, list }) => portableSlotOf({ route: 'slot', name, slot, path: [{ owner: kind, slot: slot.name }], ...(list === undefined ? {} : { list }) })?.slot ?? []);
					const container: PortableContainer = {
						...(builder === undefined ? {} : { builder }),
						key: element.propertyName,
						...optional(kind, element),
						...(mounted === undefined ? {} : { mounted }),
						...(builder === undefined && flattens(owner, slot.name, kind) ? { flatten: true as const } : {}),
						...(outer === undefined ? {} : { through: [...(outer.through ?? []), outer.key] }),
						...(slots.length === 0 ? {} : { slots }),
						...(node.kindId === undefined || (unwrap?.flags ?? []).length === 0
							? {}
							: {
									sets: {
										kind: node.kindId,
										flags: unwrap!.flags!,
										...(unwrap!.flagged === undefined
											? {}
											: { elements: [...new Set(concreteKinds(model, unwrap!.flagged).flatMap((flagged) => nodeMap.nodes.get(flagged)?.kindId ?? []))].sort((a, b) => a - b) })
									}
								})
					};
					if (mount !== undefined && mounted === undefined && mount.mounted.call !== 'child')
						throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${kind} in ${owner}'s ${slot.name} builds through ${mount.builder}, which takes ${mount.mounted.call} input inside another container` });
					const next = outer === undefined ? [...within, container] : [...within.slice(0, -1), container];
					const named = unwrap!.named === true ? new Set([...unwrap!.kinds, ...concreteKinds(model, unwrap!.kinds)].map(storageName)) : undefined;
					nested.push(...seatsOf(visible ? node : holder, visible ? element.propertyName : key, kind, element, next, [...entered, kind], unwrap!.list, final, named));
				} else if (node instanceof AssembledSupertype) {
					if (node.kindId !== undefined && admitted(kind)) kinds.add(kind);
					visit(node.subtypes);
				} else if (node.kindId !== undefined && admitted(kind)) for (const member of [kind, ...membershipKindsOf([kind], nodeMap)]) kinds.add(member);
			}
		};
		visit(slot.values);
		return [{ holder, key, slot, kinds, refined, within, many, entered, final }, ...nested.filter((seat) => seat.kinds.size > 0 || seat.many)];
	};
	const seatsOfRoute = (path: readonly SlotStep[], only?: readonly string[]): Seat[] | undefined => {
		const slot = lastSlot(path);
		const at = [...path].reverse().find((step) => nodeOf(step.owner)?.kindId !== undefined);
		const holder = at === undefined ? undefined : nodeOf(at.owner);
		const key = at === undefined ? undefined : slotOf(at.owner, at.slot)?.propertyName;
		const owner = path.at(-1)?.owner;
		if (slot === undefined || holder === undefined || key === undefined || owner === undefined) return undefined;
		const named = only === undefined ? undefined : new Set([...only, ...concreteKinds(model, only)].map(storageName));
		const [seat, ...nested] = seatsOf(holder, key, owner, slot, [], [], isMultiple(slot), false, named);
		return seat === undefined || path.at(-1)?.anchor === undefined ? [...(seat === undefined ? [] : [seat]), ...nested] : [{ ...seat, many: false }, ...nested];
	};
	const tokenDiagnostics = new Map<string, PickDiagnostic>();
	const tokensOf = (seat: Seat): Readonly<Record<string, number>> | undefined => {
		const byText = new Map<string, string[]>();
		for (const kind of seat.kinds) {
			const text = fixedText.get(kind);
			if (text !== undefined && !literals.has(kind) && typeOf(kind) !== undefined) (byText.get(text) ?? byText.set(text, []).get(text)!).push(kind);
		}
		for (const [text, kinds] of byText)
			if (kinds.length > 1)
				tokenDiagnostics.set(`${seat.holder.kind} ${seat.slot.name} ${text}`, { code: 'portable-token-ambiguous', path: seat.holder.kind, kinds: kinds.sort(), holder: seat.holder.kind, slot: seat.slot.name, text });
		const tokens = [...byText].filter(([, kinds]) => kinds.length === 1).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
		return tokens.length === 0 ? undefined : Object.fromEntries(tokens.map(([text, [kind]]) => [text, typeOf(kind!)!]));
	};
	const holes = new Map<string, readonly [holder: number, key: string]>();
	const textChoices: Record<string, readonly string[]> = {};
	const seatRecord = (seat: Seat, valued = false): PortableSeat => {
		if (hasOptionalElements(seat.slot)) holes.set(`${seat.holder.kindId!} ${seat.key}`, [seat.holder.kindId!, seat.key]);
		const leaf = defaultLeaf(seat.slot, seat.kinds, valued);
		const tokens = tokensOf(seat);
		const interior = interiorSlotGuards(seat.holder.kind, seat.holder).find(({ slot }) => slot === seat.slot.name);
		const guard = leaf === undefined ? interior?.regex : leaf.pattern;
		if (interior?.values !== undefined) textChoices[`${seat.holder.kindId!} ${seat.key}`] = interior.values;
		const contents = contentsOf(seat);
		return {
		at: [seat.holder.kindId!, seat.key],
		kinds: sortedIds([...seat.kinds].flatMap((kind) => typeOf(kind) ?? [])),
		...(seat.refined.size === 0 ? {} : { refined: sortedIds([...seat.refined].flatMap((kind) => typeOf(kind) ?? [])) }),
		...(leaf === undefined ? {} : { leaf: leaf.leaf, texts: leaf.texts }),
		...(interior === undefined ? {} : { text: true as const }),
		...(tokens === undefined ? {} : { tokens }),
		...(guard === undefined ? {} : { pattern: { source: guard.source, flags: guard.flags } }),
		...(seat.within.length === 0 ? {} : { within: seat.within }),
		...(seat.many ? { many: true as const } : {}),
		...(seat.final ? { final: true as const } : {}),
		...(contents === undefined ? {} : { contents })
		};
	};
	const valueIds = (seats: readonly Seat[]): ReadonlySet<number> => {
		const kinds = [...new Set(seats.flatMap((seat) => [...seat.kinds]))];
		return new Set(kinds.every(textLeaf) ? [] : kinds.flatMap((kind) => typeOf(kind) ?? []));
	};
	const leafDfa = (kind: string): PatternDfa | undefined => {
		const node = nodeOf(kind);
		const pattern = node instanceof AssembledPattern ? node.textPattern : undefined;
		return pattern === undefined ? undefined : patternDfa(pattern);
	};
	const covering = (kinds: readonly string[]): readonly string[] =>
		kinds.filter((kind) => {
			const outer = leafDfa(kind);
			return (
				outer !== undefined &&
				kinds.every((other) => {
					const inner = other === kind ? outer : leafDfa(other);
					return inner !== undefined && includesNonEmpty(inner, outer);
				})
			);
		});
	const defaultLeaf = (slot: AssembledNonterminal, admitted: ReadonlySet<string>, valued = false): { readonly leaf: string; readonly texts: readonly number[]; readonly pattern?: RegExp } | undefined => {
		const { leafKinds, branchKinds } = slotResolverKinds(slot, nodeMap);
		const textLeavesOf = (kind: string): readonly string[] => {
			const node = nodeOf(kind);
			return node === undefined || node instanceof AssembledPattern ? [kind] : transparentEnvelopeTextLeaves(node, nodeMap);
		};
		const reached = [...leafKinds, ...branchKinds].filter((kind) => nodeOf(kind)?.kindId === undefined || admitted.has(kind));
		const leaves = [...new Set(reached.flatMap(textLeavesOf))].filter((kind) => {
			const node = nodeOf(kind);
			return node instanceof AssembledPattern && kindNumberShape(kind, node) === undefined && !fixedText.has(kind);
		});
		const formAlone = (kind: string): boolean => {
			const parent = nodeOf(kind)?.variantOf;
			return parent === undefined || !reached.some((other) => other !== kind && nodeOf(other)?.variantOf === parent);
		};
		const unvaried = leaves.length > 1 ? leaves.filter((kind) => nodeOf(kind)?.variantOf === undefined) : leaves.filter(formAlone);
		const plain = valued && unvaried.length > 1 ? covering(unvaried) : unvaried;
		const leaf = plain.length === 1 ? builderOf(plain[0]!) : undefined;
		if (leaf === undefined) return undefined;
		const texts = sortedIds([...new Set([plain[0]!, ...reached.filter((kind) => textLeavesOf(kind).includes(plain[0]!))])].flatMap((kind) => typeOf(kind) ?? []));
		const node = nodeOf(plain[0]!);
		const pattern = node === undefined ? undefined : leafReDeclaration(plain[0]!, node)?.regex;
		return { leaf, texts, ...(pattern === undefined ? {} : { pattern }) };
	};
	const holdsOnlyForms = (kinds: readonly string[], forms: readonly string[]): boolean => {
		const entered = new Set(concreteKinds(model, [...forms]).map(storageName));
		return kinds.every((kind) => entered.has(storageName(kind)));
	};
	const formKinds = (slot: AssembledNonterminal, form: string): readonly number[] | undefined => {
		const entered = new Set(concreteKinds(model, [form]).map(storageName));
		if (holdsOnlyForms(admitted(slot), [form])) return undefined;
		const ids = sortedIds([...entered].flatMap((kind) => typeOf(kind) ?? []));
		return ids.length === 0 ? undefined : ids;
	};
	const holdsNothing = (kind: string): boolean => {
		const entries = routes.readEntries.get(kind) ?? [];
		return entries.length > 0 && entries.every((entry) => entry.slots.length === 0) && !writesText(model, kind);
	};
	const emptyForm = (slot: AssembledNonterminal, form: string): string | undefined => {
		const entered = new Set(concreteKinds(model, [form]).map(storageName));
		const builders = [...new Set(admitted(slot).flatMap((kind) => (entered.has(storageName(kind)) || !holdsNothing(kind) ? [] : (builderOf(kind) ?? []))))];
		return builders.length === 1 ? builders[0] : undefined;
	};
	const stepsOf = (path: readonly SlotStep[], guaranteed?: Guaranteed): PortableSlotStep[] | undefined => {
		const steps: PortableSlotStep[] = [];
		for (const [i, step] of path.entries()) {
			const slot = slotOf(step.owner, step.slot);
			if (slot === undefined) return undefined;
			const next = path[i + 1];
			const mount = next === undefined ? undefined : mountAt(step.owner, step.slot, next.owner);
			const builder = mount?.builder ?? (next === undefined ? undefined : builderOf(next.owner));
			const stored = wrapperChainFor(nodeMap, step.owner, step.slot)?.storage.some((wrapper) => (next === undefined ? claimed(wrapper, isMultiple(slot)) : wrapper === next.owner)) === true;
			const kinds = next === undefined ? undefined : formKinds(slot, next.owner);
			const empty = kinds === undefined ? undefined : emptyForm(slot, next!.owner);
			steps.push({
				key: slot.propertyName,
				...(stored ? { stored: storageKeyOf(slot.storageName) } : {}),
				...(builder === undefined ? {} : { builder }),
				...(guaranteed?.present(path.slice(0, i + 1)) === undefined ? optional(step.owner, slot) : {}),
				...(mount === undefined ? {} : { mounted: mount.mounted }),
				...(builder === undefined && next !== undefined && flattens(step.owner, step.slot, next.owner) ? { flatten: true as const } : {}),
				...(builder === undefined && next !== undefined && seatedAs('tuples', step.owner, step.slot, next.owner) ? { seated: shapeOf(next.owner) } : {}),
				...(next !== undefined && isMultiple(slot) ? { many: true as const } : {}),
				...(kinds === undefined ? {} : { kinds }),
				...(empty === undefined ? {} : { empty })
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
		const slot = lastSlot(path);
		if (slot !== undefined && !admitted(slot).includes(kind)) return undefined;
		if (fixedText.has(kind) && id !== undefined) return { steps, kind: id, ...(slot !== undefined && nodeSlotShapeOf(slot, nodeMap).tag === 'presence' ? { presence: true } : {}) };
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

	const readsOf = (route: SlotRoute, slot: AssembledNonterminal): readonly number[] | undefined => {
		const all = admitted(slot);
		const captured = route.route === 'kind' ? [route.kind] : route.route === 'nested' ? capturedKinds(route) : null;
		const excepted = route.route === 'slot' ? membershipKindsOf((route.except ?? []).map(storageName), nodeMap) : [];
		const kinds = captured !== null ? membershipKindsOf(captured.map(storageName), nodeMap) : all.filter((kind) => !excepted.includes(kind));
		const ids = sortedIds(kinds.flatMap((kind) => typeOf(kind) ?? []));
		return all.flatMap((kind) => typeOf(kind) ?? []).every((id) => ids.includes(id)) ? undefined : ids;
	};
	const otherFormHoldsNoRoute = (path: readonly SlotStep[], same: readonly SlotRoute[], guaranteed?: Guaranteed): boolean =>
		path.slice(0, -1).some((step, i) => {
			const slot = slotOf(step.owner, step.slot);
			if (slot === undefined) return false;
			const prefix = path.slice(0, i + 1);
			const sharing = same.flatMap(({ path: other }) => (other !== undefined && other.length > i && prefix.every((at, j) => sameStep(at, other[j]!)) ? [other] : []));
			return !sharing.some((other) => other.length === i + 1) && !holdsOnlyForms(guaranteed?.present(prefix) ?? admitted(slot), sharing.map((other) => other[i + 1]!.owner));
		});
	const emptinessOf = (path: readonly SlotStep[], seats: readonly Seat[], same: readonly SlotRoute[], guaranteed?: Guaranteed): Pick<PortableSlotRoute, 'nonEmpty' | 'emptyContainer'> => {
		const lists = seats.filter((seat) => seat.many);
		if (lists.length === 0) return {};
		const required = (step: SlotStep): boolean => {
			const slot = slotOf(step.owner, step.slot);
			return slot !== undefined && isRequired(slot);
		};
		if (lists.every((seat) => isNonEmpty(seat.slot))) return lists.every((seat) => seat.within.every((container) => container.optional !== true)) && path.every(required) ? { nonEmpty: true } : {};
		if (lists.some((seat) => isNonEmpty(seat.slot) || (seat.final && isRequired(seat.slot)))) return {};
		const leftOut = (seat: Seat): boolean => seat.within.slice(0, -1).some((container) => container.optional === true) || path.some((step) => slotOf(step.owner, step.slot) !== seat.slot && !required(step));
		return otherFormHoldsNoRoute(path, same, guaranteed) || lists.every(leftOut) ? { emptyContainer: true } : {};
	};
	const portableSlotOf = (route: SlotRoute, guaranteed?: Guaranteed, siblings: readonly SlotRoute[] = [route]): { readonly slot: PortableSlotRoute; readonly seats: readonly Seat[] } | undefined => {
		if (route.flag === true || route.spelled === true || route.path === undefined) return undefined;
		const steps = stepsOf(route.path, guaranteed);
		const slot = lastSlot(route.path);
		const seats = seatsOfRoute(route.path, route.route === 'slot' ? route.kinds : undefined);
		if (steps === undefined || slot === undefined || seats === undefined) return undefined;
		const reads = readsOf(route, slot);
		return {
			slot: {
				name: route.name,
				steps,
				multiple: route.route === 'nested' ? route.multiple : isMultiple(slot),
				...emptinessOf(route.path, seats, siblings.filter((other) => other.name === route.name), guaranteed),
				...(route.list === undefined ? {} : { list: route.list }),
				seats: seats.map((seat) => seatRecord(seat, route.name === VALUE)),
				...(reads === undefined ? {} : { reads })
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
		if (steps === undefined) return undefined;
		const leaf = (seatsOfRoute(path) ?? []).flatMap((seat) => defaultLeaf(seat.slot, seat.kinds)?.leaf ?? [])[0];
		return { preset: { steps, text, ...(leaf === undefined ? {} : { builder: leaf }) }, path };
	};
	const placedFlag = (route: SlotRoute): Placed | undefined => {
		if (route.flag !== true || route.path === undefined) return undefined;
		switch (route.route) {
			case 'presence':
				return placedText(route.path, route.token);
			case 'kind':
				return placedValue(route.path, route.kind);
			case 'slot': {
				const slot = lastSlot(route.path);
				const [only, ...more] = slot === undefined ? [] : admitted(slot);
				return only === undefined || more.length > 0 ? undefined : placedValue(route.path, only);
			}
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
	const throughDefaultForm = (path: readonly SlotStep[], other: readonly SlotStep[]): boolean => {
		const at = path.findIndex((step, i) => other[i] === undefined || !sameStep(step, other[i]!));
		if (at <= 0 || other[at] === undefined || storageName(path[at]!.owner) === storageName(other[at]!.owner)) return false;
		const held = modelSlot(path[at - 1]!.owner, path[at - 1]!.slot)?.kinds ?? [];
		const defaults = held.flatMap((kind) => {
			const form = modelNode(model, kind)?.defaultSubtype;
			return form === undefined || form === null ? [] : concreteKinds(model, [form]).map(storageName);
		});
		return defaults.includes(storageName(path[at]!.owner));
	};
	const tiedForms = <F extends { readonly slot: PortableSlotRoute; readonly site: { readonly path: readonly SlotStep[] } }>(fills: readonly F[]): ReadonlySet<F> => {
		const slots = fills.map((fill) => fill.slot);
		const owners = ownersOf(slots);
		const covers = (i: number, j: number): boolean =>
			slots[i]!.name === slots[j]!.name &&
			JSON.stringify(slots[i]!.requires ?? []) === JSON.stringify(slots[j]!.requires ?? []) &&
			[...shapesOf(slots[j]!)].every((shape) => shapesOf(slots[i]!).has(shape)) &&
			throughDefaultForm(fills[i]!.site.path, fills[j]!.site.path);
		const beaten = (owner: readonly number[]): boolean =>
			owners.some((other) => other !== owner && owner.every((j) => other.includes(j) || other.some((i) => !owner.includes(i) && covers(i, j))));
		const kept = owners.filter((owner) => !beaten(owner));
		return new Set(fills.filter((_, j) => !kept.some((owner) => owner.includes(j))));
	};
	const through =(site: Site, prefix: readonly SlotStep[], at: SlotStep): boolean =>
		site.path.length > prefix.length && prefix.every((step, i) => sameStep(step, site.path[i]!)) && sameStep(at, site.path[prefix.length]!);
	const framesOf = (site: Site): Frame[] => [
		...site.path.slice(1).map((step, i): Frame => ({ prefix: site.path.slice(0, i + 1), owner: step.owner, continues: step.slot })),
		...(site.enters === undefined ? [] : [{ prefix: site.path, owner: site.enters }])
	];
	const distinguishingOf = (frame: Frame): readonly string[] => {
		const at = frame.prefix.at(-1);
		const held = at === undefined ? undefined : modelSlot(at.owner, at.slot);
		const siblings = concreteKinds(model, held?.kinds ?? []).filter((kind) => storageName(kind) !== storageName(frame.owner));
		if (siblings.length === 0) return [];
		const named = new Set(siblings.flatMap((kind) => shownSlots(model, kind).map((slot) => slot.name)));
		return shownSlots(model, frame.owner).flatMap((slot) => (slot.required && !named.has(slot.name) ? [slot.name] : []));
	};
	const frameKey = (frame: Frame): string => [...frame.prefix.map((step) => `${storageName(step.owner)}.${step.slot}`), storageName(frame.owner)].join('/');
	const slotFillersOf = (
		frame: Frame,
		fillers: readonly Filler[],
		presets: readonly Site[]
	): { readonly groups: readonly (readonly string[])[]; readonly gaps: readonly string[] } => {
		const groups: string[][] = [];
		const gaps: string[] = [];
		for (const slot of new Set([...unfilledOf(frame.owner), ...distinguishingOf(frame)])) {
			if (slot === frame.continues) continue;
			const at = { owner: frame.owner, slot };
			if (presets.some((preset) => through(preset, frame.prefix, at))) continue;
			const names = [...new Set(fillers.flatMap((filler) => (through(filler.site, frame.prefix, at) ? [filler.name] : [])))].sort();
			if (names.length === 0) gaps.push(slot);
			else groups.push(names);
		}
		return { groups, gaps };
	};
	const fillersOf = (frame: Frame, fillers: readonly Filler[], presets: readonly Site[]): readonly (readonly string[])[] | undefined => {
		const { groups, gaps } = slotFillersOf(frame, fillers, presets);
		return gaps.length === 0 ? groups : undefined;
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
	const totalIntegerReads = new Set<number>();
	const partialIntegerReads = new Set<number>();
	const unfilledBy = new Map<string, Set<string>>();

	interface RefinedForm {
		readonly path: readonly SlotStep[];
		readonly kinds: readonly string[];
		readonly own: boolean;
	}
	const formOf = (kind: string, other: ReadEntry): Omit<RefinedForm, 'own'> | undefined => {
		const childTestsOnly =
			other.pins.length === 0 &&
			other.claim.predicates.length === 0 &&
			other.claim.tokens.length === 0 &&
			other.claim.within.length === 0 &&
			Object.keys(other.claim.fieldLiterals).length === 0;
		if (!childTestsOnly) return undefined;
		const tests = other.children.flatMap((child) => {
			if (!('kinds' in child)) return [];
			const path = held(kind, child.subject);
			return path === undefined || path.length === 0 ? [] : [{ path, kinds: child.kinds }];
		});
		if (tests.length === 0 || tests.length < other.children.length) return undefined;
		const deepest = tests.reduce((a, b) => (b.path.length > a.path.length ? b : a));
		const implied = (test: (typeof tests)[number]): boolean =>
			test === deepest ||
			(test.path.length < deepest.path.length &&
				test.path.every((step, i) => sameStep(step, deepest.path[i]!)) &&
				test.kinds.length === 1 &&
				storageName(test.kinds[0]!) === storageName(deepest.path[test.path.length]!.owner));
		return tests.every(implied) ? deepest : undefined;
	};
	const refinedFormsOf = (kind: string, entry: ReadEntry): readonly RefinedForm[] => {
		const entries = routes.readEntries.get(kind) ?? [];
		const own = entries.filter((other) => other.vocab === entry.vocab).map((other) => formOf(kind, other));
		const below = entries.filter((other) => other.vocab.startsWith(`${entry.vocab}.`)).flatMap((other) => formOf(kind, other) ?? []);
		const untested = (other: ReadEntry): ReadEntry => ({ ...other, children: other.children.filter((child) => !entry.children.some((mine) => JSON.stringify(mine) === JSON.stringify(child))) });
		const beside = entries
			.filter((other) => other.vocab !== entry.vocab && !other.vocab.startsWith(`${entry.vocab}.`) && portablePathHasFacts(entry.vocab, other.vocab))
			.flatMap((other) => formOf(kind, untested(other)) ?? []);
		const isForm = (form: Omit<RefinedForm, 'own'> | undefined): form is Omit<RefinedForm, 'own'> => form !== undefined;
		return [...(own.every(isForm) ? own.map((form) => ({ ...form, own: true })) : []), ...[...below, ...beside].map((form) => ({ ...form, own: false }))];
	};
	const pinHolds = (pin: RefinedForm, held: string): boolean =>
		pin.kinds.some((named) => reachedBy(model, held, named).length > 0 || concreteKinds(model, [named]).flatMap((kind) => [kind, ...membershipKindsOf([kind], nodeMap)]).includes(held));
	const reaches = (path: readonly SlotStep[], pin: RefinedForm): boolean => path.length >= pin.path.length && pin.path.every((step, i) => sameStep(step, path[i]!));
	const endsAt = (path: readonly SlotStep[], pin: RefinedForm): boolean => reaches(path, pin) && path.length === pin.path.length;
	const entersPinned = (path: readonly SlotStep[], pin: RefinedForm): boolean => {
		const next = path[pin.path.length];
		return reaches(path, pin) && next !== undefined && pinHolds(pin, next.owner) !== pin.own;
	};
	const outOfForms = (path: readonly SlotStep[], pins: readonly RefinedForm[]): boolean => {
		const own = pins.filter((pin) => pin.own);
		return pins.some((pin) => !pin.own && entersPinned(path, pin)) || (own.length > 0 && own.every((pin) => entersPinned(path, pin)));
	};
	const entersOtherKind = (path: readonly SlotStep[], guaranteed: Guaranteed): boolean =>
		path.slice(1).some((step, i) => {
			const kinds = guaranteed.present(path.slice(0, i + 1));
			return kinds !== undefined && kinds.length > 0 && !pinHolds({ path: [], kinds, own: true }, step.owner);
		});
	const narrowedBy = (path: readonly SlotStep[], at: Seat, pin: RefinedForm): Seat | undefined => {
		if (!endsAt(path, pin)) return at;
		const [first] = at.entered;
		if (first !== undefined) return pinHolds(pin, first) === pin.own ? at : undefined;
		if (at.kinds.size === 0) return at;
		const kinds = new Set([...at.kinds].filter((held) => pinHolds(pin, held) === pin.own));
		return kinds.size === 0 ? undefined : { ...at, kinds, refined: new Set([...at.refined].filter((held) => kinds.has(held))) };
	};
	const pinnedSeat = (path: readonly SlotStep[], seat: Seat, pins: readonly RefinedForm[]): Seat | undefined => {
		const at = pins.filter((pin) => !pin.own).reduce<Seat | undefined>((kept, pin) => (kept === undefined ? kept : narrowedBy(path, kept, pin)), seat);
		const own = pins.filter((pin) => pin.own && endsAt(path, pin));
		if (at === undefined || own.length === 0) return at;
		const forms = own.flatMap((pin) => narrowedBy(path, at, pin) ?? []);
		if (forms.includes(at)) return at;
		if (forms.length <= 1) return forms[0];
		return { ...at, kinds: new Set(forms.flatMap((form) => [...form.kinds])), refined: new Set(forms.flatMap((form) => [...form.refined])) };
	};
	const formRoutes = (routed: readonly RoutedFill[], path: readonly SlotStep[], tested: readonly string[]): readonly RoutedFill[] =>
		routed.filter(({ site, seats }) => {
			if (site.path.length < path.length || !path.every((step, i) => sameStep(step, site.path[i]!))) return false;
			const next = site.path[path.length];
			return next === undefined ? seats.some((seat) => seat.kinds.size === 0 || [...seat.kinds].some((held) => tested.includes(held))) : tested.includes(next.owner);
		});
	const builtThrough = (guaranteed: Guaranteed, routed: readonly RoutedFill[], path: readonly SlotStep[]): boolean => {
		const tested = guaranteed.present(path);
		const reaching = tested === undefined ? [] : formRoutes(routed, path, tested);
		return reaching.length > 0 && reaching.every(({ site }) => site.path.length > path.length);
	};
	const fillingSlot = (guaranteed: Guaranteed, routed: readonly RoutedFill[], path: readonly SlotStep[]): string | undefined => {
		const tested = guaranteed.present(path);
		if (tested === undefined) return undefined;
		const reaching = formRoutes(routed, path, tested);
		const [only] = reaching;
		if (only === undefined || reaching.some(({ name }) => name !== only.name)) return undefined;
		const fills = ({ site, seats }: RoutedFill): boolean =>
			site.path.length === path.length && seats.length > 0 && seats.every((seat) => seat.kinds.size > 0 && [...seat.kinds].every((held) => tested.includes(held)));
		return reaching.every(fills) ? only.name : undefined;
	};
	const tokenText = (token: AbstractAssembledCompound, input: string | null, preferred: string | null): string => {
		const part = (rule: RenderRule): string => {
			if (rule.type === SEQ) return rule.members.map(part).join('');
			const slot = rule.fieldName === undefined ? undefined : token.slots.find((candidate) => candidate.fieldName === rule.fieldName);
			if (slot?.delimiterRole === 'input') return input ?? '';
			if (slot?.delimiterRole === 'preferred') return preferred ?? '';
			if (slot !== undefined) return '';
			if (rule.type === STRING) return rule.value;
			return 'content' in rule && rule.content !== undefined ? part(rule.content as RenderRule) : '';
		};
		return part(token.renderRule);
	};
	const spelledReadsOf = (kind: string) => {
		const node = nodeOf(kind);
		if (!(node instanceof AbstractAssembledCompound) || node.delimiterFacets === undefined) return undefined;
		const open = node.delimiterFacets.open;
		const opener = node.slots.find((slot) => slot.name === open)?.values.find(isNodeRef);
		const token = opener === undefined ? undefined : nodeMap.nodes.get(storageKindOfRef(opener.node));
		if (!isDelimiterToken(token)) return undefined;
		const input = token.slots.find((slot) => slot.delimiterRole === 'input');
		const preferred = token.slots.find((slot) => slot.delimiterRole === 'preferred');
		const openerSlots = JSON.stringify(subjectOf(node.kind, open)?.slots);
		const readsOpener = (plan: QueryPlan<QuerySubject>): boolean => {
			switch (plan.op) {
				case 'eq':
				case 'match':
				case 'present':
					return 'slots' in plan && JSON.stringify(plan.slots) === openerSlots;
				case 'not':
					return readsOpener(plan.of);
				case 'and':
				case 'or':
					return plan.of.every(readsOpener);
				default:
					return false;
			}
		};
		const id = typeOf(kind);
		const entries = readableEntries((id === undefined ? [] : (tableEntries.get(id) ?? [])).map((entry) => ({ path: entry.vocab, within: entry.claim.within, test: readTest(entry), entry })));
		const spelled = entries.filter(({ test }) => test.every((condition) => condition.via.length === 0 && readsOpener(condition.plan)));
		const readAs = (member: string | null, preference: string | null): string | undefined => {
			const text = tokenText(token, member, preference);
			const holding = spelled.filter(({ test }) => test.every((condition) => holds(condition.plan, { texts: () => [text] })));
			return holding.find((at) => !holding.some((other) => other.path !== at.path && portablePathHasFacts(at.path, other.path)))?.path;
		};
		return { node, open, token, input, preferred, entries, decided: spelled.length === entries.length, readAs };
	};
	const freeTextClosedBy = new Map<ReadEntry, readonly string[]>();
	for (const kind of routes.readEntries.keys()) {
		const reads = spelledReadsOf(kind);
		const gate = reads?.node.freeText?.gate;
		if (reads === undefined || gate === undefined || gate.token !== reads.token.kind || !reads.decided) continue;
		const quotes = reads.preferred === undefined ? [null] : reads.preferred.values.flatMap((value) => (isTerminalValue(value) ? [value.value] : []));
		const opened = new Set(gate.spellings.flatMap((spelling) => quotes.flatMap((quote) => reads.readAs(spelling, quote) ?? [])));
		for (const { entry } of reads.entries) if (!opened.has(entry.vocab)) freeTextClosedBy.set(entry, reads.node.freeText!.opened);
	}
	const delimiterPresets = (kind: string, entry: ReadEntry): readonly Placed[] => {
		const reads = spelledReadsOf(kind);
		if (reads === undefined) return [];
		const { open, token, input, preferred, readAs } = reads;
		const inputs = input === undefined ? [null] : [...(isRequired(input) ? [] : [null]), ...(buildableMembersOf(input) ?? [])];
		const preferences = preferred === undefined ? [null] : (buildableMembersOf(preferred) ?? []);
		const won = inputs.flatMap((member) => preferences.flatMap((preference) => (readAs(member, preference) === entry.vocab ? [[member, preference] as const] : [])));
		const wonInputs = [...new Set(won.map(([member]) => member))];
		const wonPreferences = [...new Set(won.map(([, preference]) => preference))];
		if (won.length !== wonInputs.length * wonPreferences.length)
			throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${entry.vocab} claims ${token.kind} by spellings that are no product of its facets' texts` });
		const presetAt = (facet: AssembledNonterminal | undefined, members: readonly (string | null)[], satisfied: boolean): readonly Placed[] => {
			const among = members.flatMap((member) => (member === null ? [] : [member]));
			const [first] = among;
			if (facet === undefined || first === undefined || among.length < members.length || satisfied) return [];
			const placed = placedText([{ owner: kind, slot: open }, { owner: token.kind, slot: facet.name }], first);
			return placed === undefined ? [] : [among.length === 1 ? placed : { ...placed, preset: { ...placed.preset, among } }];
		};
		return [...presetAt(input, wonInputs, false), ...presetAt(preferred, wonPreferences, preferred?.optionDefaultArm !== undefined && wonPreferences.includes(preferred.optionDefaultArm))];
	};
	const armsOf = (kind: string, entry: ReadEntry): Arm[] => {
		const node = nodeOf(kind);
		const id = typeOf(kind);
		if (node === undefined || id === undefined) throw new Error(`portable build: ${kind} reads as ${entry.vocab} but has no kind id`);
		const refined = refinedFormsOf(kind, entry);
		const forms = refined.filter((pin) => pin.own).length;
		const guaranteed = guaranteedBy(model, entry);
		const claimsOfPath = (routes.readEntries.get(kind) ?? []).filter((other) => other.vocab === entry.vocab).map((other) => guaranteedBy(model, other));
		const pinnedOut = new Set<readonly SlotStep[]>();
		const routedAll = entryRoutes(entry).flatMap((route) => {
			const path = route.path;
			if (path === undefined) return [];
			if (outOfForms(path, refined) || claimsOfPath.every((claim) => entersOtherKind(path, claim))) return (pinnedOut.add(path), []);
			const built = portableSlotOf(route, guaranteed, entryRoutes(entry));
			if (built === undefined) return [];
			const seats = built.seats.flatMap((seat) => pinnedSeat(path, seat, refined) ?? []);
			if (seats.length === 0 && built.seats.length > 0) return (pinnedOut.add(path), []);
			return [{ seats, slot: { ...built.slot, seats: seats.map((seat) => seatRecord(seat, route.name === VALUE)) }, name: route.name, site: { path }, ...(route.readOnly === true ? { readOnly: true as const } : {}) }];
		});
		const stepped = new Set(routedAll.flatMap(({ name, slot, seats }) => (seats.some((seat) => seat.within.length === 0) ? [`${name} ${landingOf(slot.steps, [])}`] : [])));
		const routed = routedAll.flatMap((route) => {
			const seats = route.seats.filter((seat) => seat.within.length === 0 || !stepped.has(`${route.name} ${landingOf(route.slot.steps, seat.within)}`));
			return seats.length === 0 ? [] : [{ ...route, seats, slot: { ...route.slot, seats: seats.map((seat) => seatRecord(seat, route.name === VALUE)) } }];
		});
		const twice = landsTwice(routed.map(({ slot }) => slot));
		if (twice !== undefined) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${entry.vocab}: ${kind}'s slot ${twice.route.name} lands on ${twice.landing} by two routes` });
		const flagged = entry.slots.flatMap((route) => {
			const placed = placedFlag(route);
			return placed === undefined ? [] : [{ ...placed, name: route.name }];
		});
		const tested = new Set<string>();
		const claimed = [
			...delimiterPresets(kind, entry),
			...entry.pins.flatMap((pin) => {
				const path = held(kind, { up: 0, down: [{ field: pin.slot, kind: null, after: null, anchor: null }] });
				const placed = path === undefined ? undefined : placedText(path, pin.text);
				return placed === undefined ? [] : [placed];
			}),
			...entry.children.flatMap((child) => {
				const path = held(kind, child.subject);
				if (path === undefined) return [];
				if ('text' in child) return placedText(path, child.text) ?? [];
				if ('kinds' in child) {
					const filler = fillingSlot(guaranteed, routed, path);
					if (filler !== undefined) return (tested.add(filler), []);
					if (forms > 1 && builtThrough(guaranteed, routed, path)) return [];
					return child.kinds.length === 1 ? (placedValue(path, child.kinds[0]!) ?? []) : [];
				}
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
		const mounts = mountHoldersOf(model, storageName(kind)).flatMap(({ holder, slot }) => {
			const mount = mountAt(holder, slot, kind);
			if (mount === undefined) return [];
			if (mount.mounted.outer !== undefined) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${kind} builds through ${mount.builder}, which seats its holder in another holder's key` });
			if (holderOf(holder) !== undefined) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${kind} builds through ${mount.builder}, whose holder ${holder} is itself mounted` });
			const holderId = typeOf(holder);
			if (holderId === undefined) throw new Error(`portable build: ${kind} builds through ${mount.builder}, whose holder ${holder} has no kind id`);
			return [{ builder: mount.builder, mounted: { ...mount.mounted, holder: holderId }, site: [holderId, mount.mounted.key] as const }];
		});
		const [mount] = mounts;
		const builder = mount?.builder ?? builderOf(kind);
		const builds = storageName(kind);
		const builtId = id;
		const seated = builder === undefined && !fixedText.has(node.kind) ? shapes[node.kind] : undefined;
		const shape = kindNumberShape(node.kind, node);
		const combos = product(bareFormSlotsOf(kind, claimed).map(({ slot, forms, bare }) => [...bare, null].map((choice) => ({ slot, forms, bare, choice }))));
		if (combos.length > FORM_PRODUCT_LIMIT) formDiagnostics.push({ code: 'portable-form-product', path: entry.vocab, kinds: [kind], arms: combos.length });
		const spelledHere = [...(routes.readEntries.get(kind) ?? [])]
			.sort((a, b) => a.index - b.index)
			.flatMap((other) => {
				const fact = factOf(other);
				return fact === undefined ? [] : [{ fact, entry: other }];
			});
		const spelledFact = (name: string): PortableSpelledFact => {
			const group = spelledHere.filter(({ fact }) => fact.name === name);
			return portableSpelledFactOf(group[0]!.fact, group.map(({ entry }) => entry), model, routes, bodies);
		};
		const spelledFacts = [
			...new Set(spelledHere.flatMap(({ fact }) => (fact.path === entry.vocab || (fact.flag !== undefined && flagsOf(entry.vocab).includes(fact.flag)) ? [fact.name] : [])))
		].map(spelledFact);
		const arms = combos.flatMap((combo): Arm[] => {
			const keeps = (site: Site): boolean =>
				combo.every(({ slot, forms, bare, choice }) => {
					const form = formAt(site, kind, slot, forms);
					return form === undefined || (choice === null ? form === null || !bare.includes(form) : form === choice);
				});
			const placed = [...claimed, ...combo.flatMap(({ slot, choice }) => (choice === null ? [] : (placedValue([{ owner: kind, slot }], choice) ?? [])))];
			const fills = routed.filter(({ site }) => keeps(site));
			const replaced = (site: Site): boolean =>
				fills.some((fill) => fill.site.path.length === site.path.length && fill.site.path.every((step, i) => sameStep(step, site.path[i]!)));
			const flags = flagged.filter(keeps);
			const flagFillers = flags.map(({ name, path, enters }): Filler => ({ name, site: { path, ...(enters === undefined ? {} : { enters }) } }));
			const groupsOf = (frames: readonly Frame[], fillers: readonly Filler[]): readonly (readonly string[])[] | undefined =>
				frames.reduce<(readonly string[])[] | undefined>((groups, frame) => {
					const found = groups === undefined ? undefined : fillersOf(frame, fillers, placed);
					return groups === undefined || found === undefined ? undefined : [...groups, ...found];
				}, []);
			const armFrames = [{ prefix: [], owner: kind }, ...placed.flatMap((site) => framesOf(replaced(site) ? { path: site.path } : site))];
			const armKeys = new Set(armFrames.map(frameKey));
			const requiresOf = (fill: (typeof fills)[number], fillers: readonly Filler[]): readonly (readonly string[])[] | undefined =>
				groupsOf(
					framesOf(fill.site).filter((frame) => !armKeys.has(frameKey(frame))),
					fillers
				);
			const completable = (open: typeof fills): typeof fills => {
				const next = open.filter((fill) => requiresOf(fill, [...open, ...flagFillers]) !== undefined);
				return next.length === open.length ? open : completable(next);
			};
			const survivors = completable(fills);
			const fillers = [...survivors, ...flagFillers];
			if (groupsOf(armFrames, fillers) === undefined) {
				const gaps = unfilledBy.get(kind) ?? unfilledBy.set(kind, new Set()).get(kind)!;
				for (const frame of armFrames) for (const slot of slotFillersOf(frame, fillers, placed).gaps) gaps.add(`${frame.owner}.${slot}`);
				return [];
			}
			const completed = survivors.map((fill) => {
				const requires = [...new Map(requiresOf(fill, fillers)!.map((group) => [group.join(','), group])).values()];
				return { ...fill, slot: { ...fill.slot, ...(requires.length === 0 ? {} : { requires }) } };
			});
			const presets = placed.map(({ preset }) => preset);
			const claimedPresets = new Set(claimed.map(({ preset }) => preset));
			const deepest = presets.filter((preset) => !presets.some((other) => other !== preset && keys(other).startsWith(`${keys(preset)}.`)));
			const flagSteps: Record<string, PortableFlagStep> = {};
			for (const flag of flags) {
				const other = unsetOf(flag);
				const unset = [...(flagSteps[flag.name]?.unset ?? []), ...(other === undefined ? [] : [other])];
				flagSteps[flag.name] = { presets: [...(flagSteps[flag.name]?.presets ?? []), flag.preset], ...(unset.length === 0 ? {} : { unset }) };
			}
			for (const spelled of (routes.readEntries.get(kind) ?? []).filter((other) => other.vocab === entry.vocab && other.claim.flag !== undefined && other.template !== undefined))
				flagSteps[spelled.claim.flag!] = { ...(flagSteps[spelled.claim.flag!] ?? { presets: [] }), template: portableTemplate(spelled.template!) };
			for (const route of entry.slots) {
				if (route.route !== 'delimiter') continue;
				const list = route.path === undefined ? undefined : (stepsOf(route.path) ?? refuseList(route.name, entry.vocab));
				flagSteps[route.name] = { ...(flagSteps[route.name] ?? { presets: [] }), delimiter: route.delimiter, ...(list === undefined ? {} : { list }) };
			}
			for (const flag of CARRIES_NODE_FLAGS[entry.vocab] ?? []) {
				const step = flagSteps[flag];
				if (step !== undefined) flagSteps[flag] = { ...step, carriesNode: true };
			}
			const sharingAt = (path: readonly SlotStep[], i: number): readonly { readonly name: string; readonly path: readonly SlotStep[] }[] =>
				survivors.flatMap(({ name, site: { path: other } }) => (other.length < i || !path.slice(0, i).every((step, j) => sameStep(step, other[j]!)) ? [] : [{ name, path: other }]));
			const holdsOnly = (step: SlotStep, kind: string): boolean => {
				const slot = slotOf(step.owner, step.slot);
				const kinds = slot === undefined ? [] : [...new Set(admitted(slot).map(storageName))];
				return kinds.length === 1 && kinds[0] === storageName(kind);
			};
			const covered = (name: string, path: readonly SlotStep[], i: number): boolean => {
				const sharing = sharingAt(path, i);
				if (sharing.some((other) => other.path.length === i)) return false;
				const forms = new Set(sharing.map((other) => storageName(other.path[i]!.owner)));
				return [...forms].every((form) => sharing.some((other) => other.name === name && storageName(other.path[i]!.owner) === form && requiredPath(name, other.path, i)));
			};
			const requiredPath = (name: string, path: readonly SlotStep[], from = 0): boolean =>
				path.slice(from).every((step, k) => {
					const i = from + k;
					return (
						(requiredSlot(step.owner, step.slot) || guaranteed.present(path.slice(0, i + 1)) !== undefined) &&
						(i === 0 ||
							(k === 0 && from > 0) ||
							holdsOnly(path[i - 1]!, step.owner) ||
							armKeys.has(frameKey({ prefix: path.slice(0, i), owner: step.owner })) ||
							covered(name, path, i))
					);
				});
			const dropped = new Set(fills.flatMap(({ site }) => (survivors.some((fill) => fill.site === site) ? [] : [site.path])));
			const sharedSlot = (name: string, path: readonly SlotStep[]): boolean =>
				completed.some(
					({ name: other, site, slot }) =>
						other !== name &&
						site.path.length >= path.length &&
						path.every((step, i) => sameStep(step, site.path[i]!)) &&
						!(slot.requires ?? []).some((group) => group.every((needed) => needed === name))
				);
			const required = new Set([
				...[...tested].filter((name) => survivors.some((fill) => fill.name === name)),
				...entryRoutes(entry).flatMap((route) =>
					route.flag !== true &&
					route.spelled !== true &&
					route.path !== undefined &&
					keeps({ path: route.path }) &&
					!dropped.has(route.path) &&
					!pinnedOut.has(route.path) &&
					!sharedSlot(route.name, route.path) &&
					requiredPath(route.name, route.path)
						? [route.name]
						: []
				)
			]);
			const slotKinds = new Map<string, ReadonlySet<number>>();
			for (const { slot, seats } of completed) if (!slotKinds.has(slot.name)) slotKinds.set(slot.name, valueIds(seats));
			const valueScalar = valueScalarOf(entry.vocab);
			if (valueScalar !== undefined && shape === undefined) formDiagnostics.push({ code: 'portable-value-unshaped', path: entry.vocab, kinds: [kind] });
			const contentSlot = lexedContentSlot(node);
			const config = builder !== undefined && builders.get(builder) === 'config';
			const scalar = armScalar(shape, valueScalar === undefined ? undefined : (kindValueScalars.get(kind) ?? valueScalar));
			const spellsValue = numberSlotsSpellValue(node, config);
			const stamped = new Set((modelNode(model, node.kind)?.slots ?? []).flatMap((slot) => (slot.valueSource === true ? [slot.name] : [])));
			const numericSlots = scalar === undefined || builder === undefined || !spellsValue ? [] : node.slots.filter((slot) => stamped.has(slot.name));
			const numericKeys = numericSlots.map((slot) => slot.propertyName);
			const parts = config && numericKeys.length > 1 && numericKeys.every((key) => DECIMAL_PARTS.some((part) => part === key));
			const prefixed = config && numericKeys.length > 1 && !parts;
			const spelling = parts || numericKeys.length === 0 || config || contentSlot === undefined ? undefined : numberSpelling(node, contentSlot);
			const spelled =
				spelling === undefined || spelling.slots.every((slot) => numericSlots.includes(slot)) ? spelling : { shape: { ...spelling.shape, prefix: '' }, pattern: slotPattern(numericSlots[0]!) };
			const numeric: PortableBuildArm['numeric'] = scalar !== undefined && !spellsValue ? [] : numericKeys.length === 0 ? undefined : parts ? Object.fromEntries(numericKeys.map((key) => [key, key])) : numericKeys;
			const scientific = parts && numericSlots.some((slot) => slot.propertyName === 'exponent' && isRequired(slot));
			const read =
				numericKeys.length === 0 || prefixed
					? { shape: wholeTextShape(kind, node), pattern: wholeTextPattern(node) }
					: parts
						? undefined
						: (spelled ?? { shape: numericSlotShape(numericSlots[0]!), pattern: slotPattern(numericSlots[0]!) });
			const readShape = scalar === 'integer' || scalar === 'bigint' ? read?.shape : undefined;
			const digits = !spellsValue || readShape === undefined || readShape.base === 'float' ? undefined : { base: readShape.base, affix: readShape.prefix };
			if (spellsValue && (scalar === 'integer' || scalar === 'bigint')) {
				if (readShape !== undefined && readsEveryInteger(read?.pattern, readShape)) totalIntegerReads.add(builtId);
				else if (!partialIntegerReads.has(builtId)) {
					partialIntegerReads.add(builtId);
					formDiagnostics.push({ code: 'portable-integer-partial', path: entry.vocab, kinds: [kind] });
				}
			}
			const valued = completed.find(({ slot }) => slot.name === VALUE)?.slot;
			const building = completed.filter((fill) => fill.slot !== valued && fill.readOnly !== true);
			const tied = tiedForms(building);
			const armSlots = building.flatMap((fill) => (tied.has(fill) ? [] : [fill.slot]));
			const readOnly = completed.flatMap((fill) => (fill.readOnly === true || tied.has(fill) ? [fill.slot] : []));
			const lexed =
				valued === undefined && contentSlot !== undefined && node instanceof AssembledLexedPattern && armSlots.length === 0 && shape === undefined && builder !== undefined && builders.get(builder) === 'direct'
					? { name: VALUE, steps: [{ key: contentSlot.propertyName }], multiple: false, list: false, seats: [{ at: [builtId, contentSlot.propertyName] as const, kinds: [], text: true as const }] }
					: undefined;
			const content: PortableSlotRoute | undefined = valued ?? lexed;
			const heldAt = (route: PortableSlotRoute, step: number): readonly number[] => {
				const at = completed.find((fill) => fill.slot === route)?.site.path[step];
				const slot = at === undefined ? undefined : slotOf(at.owner, at.slot);
				return slot === undefined ? [] : sortedIds(admitted(slot).flatMap((held) => typeOf(storageName(held)) ?? []));
			};
			const unread = unreadListItems(completed.map((fill) => fill.slot), heldAt);
			if (unread !== undefined)
				throw new Error(`portable build: ${kind}'s ${unread.route.name} reads only some of the items its step ${unread.route.steps[unread.step]!.key} holds, and no other route of ${entry.vocab} reads the rest; route the other items, or read their holder whole`);
			const owners = ownersOf(armSlots);
			const unfilled = mount === undefined && directBuilderUnfilled(builder === undefined ? undefined : builders.get(builder), { slots: armSlots, presets: deepest, flags: flagSteps, scalar, content }, node.slots.some(isRequired));
			for (const [i, a] of owners.entries())
				for (const b of owners.slice(i + 1)) {
					const shape = undecidedShape(armSlots, a, b);
					if (shape !== undefined) formDiagnostics.push({ code: 'portable-owner-undecided', path: entry.vocab, kinds: [kind], slots: shape });
				}
			return [
				{
					kind,
					entry,
					slotKinds,
					required,
					tested: new Set([...tested].filter((name) => survivors.some((fill) => fill.name === name))),
					builds,
					chosen: deepest.some((preset) => !claimedPresets.has(preset)),
					text: fixedText.get(kind),
					value: declaredValues.get(kind),
					scalar,
					complete: shape?.complete ?? true,
					arm: {
						kind: builtId,
						...(builder === undefined || unfilled ? {} : { builder }),
						...(mount === undefined ? {} : { mounted: mount.mounted }),
						...(unfilled ? { seated: shapes[node.kind] } : seated === undefined ? {} : { seated }),
						...(numeric === undefined ? {} : { numeric }),
						...(scientific ? { scientific } : {}),
						...(digits === undefined ? {} : { digits }),
						...(literals.has(kind) ? { literal: declaredValues.has(kind) ? { value: declaredValues.get(kind)! } : {} } : {}),
						slots: armSlots,
						...(readOnly.length === 0 ? {} : { readOnly }),
						...(owners.length > 1 ? { owners } : {}),
						presets: deepest,
						flags: flagSteps,
						...(entry.template === undefined || entry.claim.flag !== undefined ? {} : { template: portableTemplate(entry.template) }),
						...(spelledFacts.length === 0 ? {} : { facts: spelledFacts }),
						...soleOf(entry, armSlots),
						...(content === undefined ? {} : { content })
					}
				}
			];
		});
		if (mounts.length < 2) return arms;
		if (shape !== undefined) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${kind} is mounted at ${mounts.length} holders, so no one mount spells its number` });
		return mounts.flatMap(({ builder, mounted, site }) => arms.map((arm): Arm => ({ ...arm, site, arm: { ...arm.arm, builder, mounted } })));
	};

	const refuseList = (flag: string, path: string): never => {
		throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${path}'s ${flag} is the trailing separator of a list no step reaches` });
	};
	const soleOf = (entry: ReadEntry, slots: readonly PortableSlotRoute[]): { readonly sole?: PortableBuildArm['sole'] } => {
		if (entry.separated !== true) return {};
		const listed = [...new Set(slots.filter((slot) => slot.list === true).map((slot) => slot.name))];
		if (listed.length !== 1) throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', message: `${entry.kind} as ${entry.vocab} is read by its own separator, so it builds one list slot; it has ${listed.length}` });
		return { sole: { slot: listed[0]!, delimiter: Delimiter.Trailing } };
	};
	const byPath = new Map<string, Arm[]>();
	const builtSlotNames = (arm: Arm): string => [...new Set(builtSlots(arm.arm).map((slot) => slot.name))].sort().join(' ');
	for (const [kind, entries] of routes.readEntries) {
		const node = modelNode(model, kind);
		if (node === undefined || node.modelType === 'supertype' || typeOf(kind) === undefined) continue;
		for (const entry of entries) {
			const arms = byPath.get(entry.vocab) ?? byPath.set(entry.vocab, []).get(entry.vocab)!;
			const earlier = new Set(arms.filter((arm) => arm.kind === kind).map(builtSlotNames));
			const noted = formDiagnostics.length;
			const built = armsOf(kind, entry);
			const fresh = earlier.size === 0 ? built : built.filter((arm) => !earlier.has(builtSlotNames(arm)));
			if (fresh.length === 0) formDiagnostics.length = noted;
			arms.push(...fresh);
		}
	}
	for (const [path, arms] of byPath) {
		const pickable = arms.filter((arm) => !flagOnly.has(storageName(arm.kind)));
		if (pickable.length > 0 && pickable.length < arms.length) byPath.set(path, pickable);
	}
	const seatedAt = (slot: PortableSlotRoute): string[] =>
		slot.seats.flatMap((seat) => [...seat.kinds.map((kind) => `${seat.at[0]} ${seat.at[1]} ${kind}`), ...(seat.within ?? []).flatMap((container) => (container.slots ?? []).flatMap(seatedAt))]);
	const seated = new Set([...byPath.values()].flatMap((arms) => arms.flatMap(({ arm }) => arm.slots.flatMap(seatedAt))));
	for (const [path, arms] of byPath) byPath.set(path, arms.filter(({ site, arm }) => site === undefined || seated.has(`${site[0]} ${site[1]} ${arm.kind}`)));
	const armed = new Set([...byPath.values()].flatMap((arms) => arms.map((arm) => arm.kind)));
	const armlessDiagnostics = [...routes.readEntries]
		.filter(([kind]) => {
			const node = modelNode(model, kind);
			return node !== undefined && node.modelType !== 'supertype' && typeOf(kind) !== undefined && !armed.has(kind) && flagContent(kind) === undefined;
		})
		.map(
			([kind, entries]): PickDiagnostic => ({
				code: 'portable-kind-armless',
				path: [...new Set(entries.map((entry) => entry.vocab))].sort((a, b) => a.length - b.length || a.localeCompare(b))[0]!,
				kinds: [kind],
				holder: kind,
				slots: [...(unfilledBy.get(kind) ?? [])].sort()
			})
		);

	const diagnostics: PickDiagnostic[] = [...formDiagnostics, ...tokenDiagnostics.values(), ...armlessDiagnostics];
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
		holder.kindId === undefined
			? []
			: holder.slots.flatMap((slot) => {
					const seat = finalSeatOf(slot);
					return (seat === undefined ? [slot] : [seat.rest, seat.last]).map((site) => ({ holder, slot: site, kinds: new Set(storageKinds(site.values)) }));
				})
	);
	const storageOf = (arm: Arm): string => storageName(arm.kind);
	const variantOf = (arm: Arm): string => {
		const envelopes = arm.site !== undefined ? [] : [...new Set(holderSlots.filter(({ kinds }) => kinds.has(arm.builds)).map(({ holder }) => holder))];
		const [envelope] = envelopes;
		return envelopes.length === 1 && variantChain(envelope!.kind).length > 0 && forwardedTargetKind(envelope!, nodeMap) === arm.builds ? envelope!.kind : storageOf(arm);
	};
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
			const found = grammarDefault(group.map(variantOf));
			if (found === undefined) return undefined;
			const ordered = [...group].sort((a, b) => Number(variantOf(b) === found.kind) - Number(variantOf(a) === found.kind));
			return ordered.map((arm): Part => [{ variant: found.supertype.kind, value: arm.arm.kind, ...(variantOf(arm) === found.kind ? { default: true as const } : {}) }, [arm]]);
		},
		(group) => {
			const names = (arm: Arm): string[] => builtSlots(arm.arm).map((m) => m.name).sort();
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
				if (group.some((arm) => (arm.slotKinds.get(name)?.size ?? 0) === 0)) return undefined;
				const parts = new Map<string, Arm[]>();
				for (const arm of group) {
					const key = sortedIds(arm.slotKinds.get(name)!).join(',');
					(parts.get(key) ?? parts.set(key, []).get(key)!).push(arm);
				}
				if (parts.size < 2) return undefined;
				const sets = [...parts.values()].map((arms) => arms[0]!.slotKinds.get(name)!);
				const nested = sets.every((x, i) => sets.every((y, j) => i === j || disjoint([x, y]) || subset(x, y) || subset(y, x)));
				return nested ? [...parts.values()].sort((x, y) => x[0]!.slotKinds.get(name)!.size - y[0]!.slotKinds.get(name)!.size) : undefined;
			};
			const slot = builtSlots(group[0]!.arm).map((m) => m.name).find((name) => partsBy(name) !== undefined);
			return slot === undefined
				? undefined
				: partsBy(slot)!.map((arms): Part => [{ slot, kinds: sortedIds(arms[0]!.slotKinds.get(slot)!) }, arms]);
		},
		(group) => {
			if (!group.every((arm) => arm.scalar !== undefined)) return undefined;
			const complete = group.filter((arm) => arm.complete);
			if (complete.length !== 1 || complete.length === group.length) return undefined;
			return [complete[0]!, ...group.filter((arm) => !arm.complete)].map((arm): Part => [undefined, [arm]]);
		}
	];
	const paths: Record<string, PortableBuildPath> = {};
	const optionsOf = (kind: string): { readonly options?: readonly string[] } => {
		const options = (modelNode(model, kind)?.slots ?? []).flatMap((slot) => (slot.registered === true ? [slot.propertyName] : []));
		return options.length === 0 ? {} : { options };
	};
	const presetCarried = new Set<ReadEntry>();
	const decided = new Map<string, Record<keyof PortableValueBuild, string | undefined>>();
	const builderShapes = { builders: Object.fromEntries(builders) };
	for (const [path, arms] of [...byPath].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
		const tests = new Map<Arm, PortablePickTest[]>(arms.map((arm) => [arm, []]));
		holders = new Map();
		const sites = new Set(arms.flatMap(({ site }) => (site === undefined ? [] : [`${site[0]} ${site[1]}`])));
		const unmountedSeats = (arm: Arm, holderId: number): readonly (readonly [number, string])[] => {
			const holderKind = holderSlots.find(({ holder }) => holder.kindId === holderId)?.holder.kind;
			return holderSlots.flatMap(({ holder, slot, kinds }) => {
				const at = `${holder.kindId} ${slot.propertyName}`;
				return holderKind !== undefined && slot.splicedEnvelope === holderKind && kinds.has(arm.builds) && !sites.has(at) && seated.has(`${at} ${arm.arm.kind}`) ? [[holder.kindId!, slot.propertyName] as const] : [];
			});
		};
		const admittedAt = (arm: Arm): readonly (readonly [number, string])[] =>
			arm.site === undefined
				? holderSlots.flatMap(({ holder, slot, kinds }) => (kinds.has(arm.builds) ? [[holder.kindId!, slot.propertyName] as const] : []))
				: arm.arm.mounted?.call === 'child'
					? [arm.site, ...unmountedSeats(arm, arm.arm.mounted.holder)]
					: [arm.site];
		const admits = (arm: Arm, holder: number, key: string): boolean => admittedAt(arm).some(([h, k]) => h === holder && k === key);
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
			for (const { holder, slot, kinds } of holderSlots) {
				const hit = group.filter((arm) => (arm.site === undefined ? kinds.has(arm.builds) : admits(arm, holder.kindId!, slot.propertyName)));
				if (hit.length === 1 && !holders.has(hit[0]!)) holders.set(hit[0]!, []);
				if (hit.length === 1 && !holders.get(hit[0]!)!.some(([h, k]) => h === holder.kindId && k === slot.propertyName)) holders.get(hit[0]!)!.push([holder.kindId!, slot.propertyName]);
				else if (hit.length > 1 && hit.length < group.length) decide(hit);
				else if (hit.length > 1 && !leaves) diagnostics.push({ code: 'portable-pick-undecided', path, kinds: hit.map((arm) => arm.kind), holder: holder.kind, slot: slot.name });
			}
			if (!leaves && group.every((arm) => admittedAt(arm).length === 0)) diagnostics.push({ code: 'portable-pick-undecided', path, kinds: group.map((arm) => arm.kind) });
			return group;
		};
		const takesValue = (arm: Arm): boolean => textBuilt(builderShapes, arm.arm) || arm.scalar !== undefined || arm.value !== undefined;
		const slotNames = (arm: Arm): readonly string[] => [...builtSlots(arm.arm).map((slot) => slot.name), ...(takesValue(arm) ? [VALUE] : [])];
		const stated = new Set(arms.flatMap(slotNames));
		const listed = new Set(arms.flatMap((arm) => arm.arm.slots.filter((slot) => slot.list ?? slot.multiple).map((slot) => slot.name)));
		const missingOf = (arm: Arm): string[] => [...stated].filter((name) => !slotNames(arm).includes(name)).sort();
		const emptyOf = (arm: Arm): string[] => (arm.text === undefined && arm.entry.empty === true ? missingOf(arm).filter((name) => listed.has(name)) : []);
		const decidedOrder = decide(arms);
		const shared = arms.filter((arm) => arm.site === undefined && admittedAt(arm).length > 1);
		if (!root && shared.length === 1 && arms.every((arm) => holders.has(arm))) {
			holders.delete(shared[0]!);
			root = true;
		}
		const ordered = [...decidedOrder.filter((arm) => emptyOf(arm).length > 0), ...decidedOrder.filter((arm) => emptyOf(arm).length === 0)].sort((a, b) => Number(textBuilt(builderShapes, a.arm)) - Number(textBuilt(builderShapes, b.arm)));
		const scalarArms = new Map<Arm, ArmScalar>();
		for (const scalar of ARM_SCALARS) {
			const pool = ordered.filter((arm) => arm.scalar === scalar && !(Array.isArray(arm.arm.numeric) && arm.arm.numeric.length === 0));
			if (pool.length === 0) continue;
			const complete = pool.filter((arm) => arm.complete);
			const able = complete.length === 0 ? pool : complete;
			const fallback = able.length === 1 ? undefined : grammarDefault(able.map(storageOf))?.kind;
			const chosen = able.length === 1 ? able[0] : able.find((arm) => storageOf(arm) === fallback);
			if (chosen === undefined) diagnostics.push({ code: 'portable-pick-undecided', path, kinds: pool.map((arm) => arm.kind) });
			else scalarArms.set(chosen, scalar);
		}
		const kindOf = (arm: Arm | undefined): string | undefined => (arm === undefined ? undefined : storageOf(arm));
		const takes = (scalar: ArmScalar): string | undefined => kindOf([...scalarArms].find(([, taken]) => taken === scalar)?.[0]);
		decided.set(path, {
			integer: takes('integer') ?? takes('bigint'),
			float: takes('float'),
			true: kindOf(arms.find((arm) => arm.value === true)),
			false: kindOf(arms.find((arm) => arm.value === false))
		});
		for (const arm of arms) {
			if (arm.text !== undefined) continue;
			const empty = emptyOf(arm);
			const lacking = missingOf(arm).filter((name) => !empty.includes(name));
			const own = tests.get(arm)!;
			const presence = own.find((test): test is Extract<PortablePickTest, { readonly absent: readonly string[] }> => 'absent' in test);
			const required = [...new Set([...(presence === undefined ? [] : presence.required), ...arm.required, ...(textBuilt(builderShapes, arm.arm) || arm.scalar !== undefined ? [VALUE] : [])])].sort();
			const kept = own.filter((test) => test !== presence);
			const emptied = empty.length === 0 ? kept : [...kept, { empty }];
			tests.set(arm, lacking.length === 0 && required.length === 0 ? emptied : [...emptied, { absent: lacking, required }]);
		}
		for (const arm of ordered) if (arm.chosen) presetCarried.add(arm.entry);
		const textFormOf = (arm: Arm): RoutedTextForm | undefined => {
			const routes = [...builtSlots(arm.arm), ...(arm.arm.content === undefined ? [] : [arm.arm.content])];
			const node = nodeOf(arm.kind);
			if (routes.length !== 1 || routes[0]!.steps.length !== 1 || node === undefined) return undefined;
			const slot = node.slots.find((held) => held.propertyName === routes[0]!.steps[0]!.key);
			const form = slot === undefined ? undefined : interiorTextForm(node, slot.name);
			return form === undefined ? undefined : { name: routes[0]!.name, form };
		};
		const textForms = ordered.map((arm) => textFormOf(arm));
		paths[path] = {
			root: root && ordered.some((arm) => !holders.has(arm)),
			arms: ordered.map(
				(arm, i): PortableBuildArm => ({
					...arm.arm,
					...(collidesWithEarlier(textForms, i) ? { carriesNode: true as const } : {}),
					...(arm.scalar === undefined ? {} : { scalar: arm.scalar }),
					when: tests.get(arm)!,
					...(holders.has(arm) ? { holders: holders.get(arm)! } : {}),
					...optionsOf(arm.kind)
				})
			),
			...(scalarArms.size === 0 ? {} : { builds: Object.fromEntries([...scalarArms].map(([arm, scalar]) => [scalar, arm.arm.kind])) }),
			...(flagsOf(path).length === 0 ? {} : { flags: flagsOf(path) })
		};
	}
	const values = valueBuilds(paths, decided, (kinds) => grammarDefault(kinds)?.kind, diagnostics);
	const tokens = [...model.values()]
		.flatMap((holder) => {
			const id = typeOf(holder.kind);
			const accessors = holder.slots.filter((slot) => concreteKinds(model, slot.kinds).some((kind) => nodeOf(kind) instanceof AssembledLexedPattern)).map((slot) => slot.propertyName);
			return id === undefined || accessors.length === 0 ? [] : [[id, accessors] as const];
		})
		.sort(([a], [b]) => a - b);
	const delimiters = [...nodeMap.nodes.values()]
		.filter(isDelimiterToken)
		.flatMap((token) => {
			const id = typeOf(token.kind);
			const meaning = token.slots.filter((slot) => slot.delimiterRole === 'input' || slot.delimiterRole === 'content').map((slot) => slot.propertyName);
			const facet = token.slots.find((slot) => slot.contentLeaf !== undefined);
			const reads = facet?.contentLeaf === undefined ? undefined : typeOf(facet.contentLeaf);
			if (facet !== undefined && reads === undefined) throw new Error(`portable build: '${token.kind}' holds content its leaf '${facet.contentLeaf}' reads, which has no kind id`);
			const spelledFacets = token.slots.filter((slot) => slot.delimiterRole === 'input' || slot.delimiterRole === 'preferred');
			const spellings = Object.fromEntries(
				spelledFacets.flatMap((slot) => {
					const pairs = slot.values.filter(isTerminalValue).flatMap((value) => {
						const member = canonicalMemberOf(value);
						return member !== undefined && member !== value.value ? [[value.value, member] as const] : [];
					});
					return pairs.length === 0 ? [] : [[slot.propertyName, Object.fromEntries(pairs)] as const];
				})
			);
			const readOnly = Object.fromEntries(
				spelledFacets.flatMap((slot) => {
					const members = [...new Set(slot.values.filter((value) => isTerminalValue(value) && value.readOnly === true).flatMap((value) => canonicalMemberOf(value) ?? []))].sort();
					return members.length === 0 ? [] : [[slot.propertyName, members] as const];
				})
			);
			const entry: PortableDelimiterToken = {
				meaning,
				...(facet === undefined || reads === undefined ? {} : { content: { facet: facet.propertyName, reads } }),
				...(Object.keys(spellings).length === 0 ? {} : { spellings }),
				...(Object.keys(readOnly).length === 0 ? {} : { readOnly })
			};
			return id === undefined ? [] : [[id, entry] as const];
		})
		.sort(([a], [b]) => a - b);
	return {
		table: {
			builders: Object.fromEntries([...builders].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
			...(optionKeys.size === 0 ? {} : { options: Object.fromEntries([...optionKeys].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) }),
			paths: withTakers(paths, (kind) => kindEntries.find((entry) => entry.id === kind)?.kind ?? String(kind), diagnostics),
			...(Object.keys(values).length === 0 ? {} : { values }),
			...(tokens.length === 0 ? {} : { tokens: Object.fromEntries(tokens) }),
			...(delimiters.length === 0 ? {} : { delimiters: Object.fromEntries(delimiters) }),
			features
		},
		diagnostics,
		presetCarried,
		totalIntegerReads,
		freeTextClosedBy,
		holes: [...holes.values()].sort(([a, x], [b, y]) => a - b || (x < y ? -1 : x > y ? 1 : 0)),
		textChoices
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

function withTakers(paths: Readonly<Record<string, PortableBuildPath>>, kindName: (kind: number) => string, diagnostics: PickDiagnostic[]): Record<string, PortableBuildPath> {
	const takers = Object.entries(paths).flatMap(([path, built]) =>
		Object.entries(built.builds ?? {}).flatMap(([scalar, kind]) => built.arms.filter((arm) => arm.kind === kind && arm.scalar === scalar).map((arm) => ({ path, scalar, arm })))
	);
	const kindsOf = new WeakMap<PortableSeat, ReadonlySet<number>>();
	const sits = (arm: PortableBuildArm, seat: PortableSeat): boolean =>
		(kindsOf.get(seat) ?? kindsOf.set(seat, new Set(seat.kinds)).get(seat)!).has(arm.kind) &&
		(arm.holders === undefined || arm.holders.some(([holder, key]) => holder === seat.at[0] && key === seat.at[1]));
	const stamped = (path: string, slot: PortableSlotRoute): PortableSlotRoute => {
		const found = ARM_SCALARS.flatMap((scalar) => {
			const fitting = takers.filter((taker) => taker.scalar === scalar && slot.seats.some((seat) => sits(taker.arm, seat)));
			const outer = [...new Set(fitting.map((taker) => taker.path))].filter((at, _, all) => !all.some((other) => at.startsWith(`${other}.`)));
			if (outer.length > 1)
				diagnostics.push({ code: 'portable-value-undecided', path, kinds: [...new Set(fitting.filter((taker) => outer.includes(taker.path)).map((taker) => kindName(taker.arm.kind)))].sort(), slot: `${slot.name} ${scalar}` });
			return outer.length === 1 ? [[scalar, outer[0]!] as const] : [];
		});
		const seats = slot.seats.map((seat) =>
			seat.within === undefined
				? seat
				: { ...seat, within: seat.within.map((container) => (container.slots === undefined ? container : { ...container, slots: container.slots.map((owned) => stamped(path, owned)) })) }
		);
		return { ...slot, seats, ...(found.length === 0 ? {} : { takers: Object.fromEntries(found) }) };
	};
	return Object.fromEntries(
		Object.entries(paths).map(([path, built]) => [
			path,
			{ ...built, arms: built.arms.map((arm) => ({ ...arm, slots: arm.slots.map((slot) => stamped(path, slot)), ...(arm.readOnly === undefined ? {} : { readOnly: arm.readOnly.map((slot) => stamped(path, slot)) }), ...(arm.content === undefined ? {} : { content: stamped(path, arm.content) }) })) }
		])
	);
}

export function emitPortableBuild(input: PortableBuildInput): PortableBuildOutput & { readonly source: string } {
	const { table, diagnostics, presetCarried, totalIntegerReads, freeTextClosedBy, holes, textChoices } = portableBuildTable(input);
	return {
		source: [
			'// Auto-generated by @sittir/codegen — do not edit',
			'',
			"import type { PortableBuildTable } from '@sittir/types';",
			'',
			`export const build: PortableBuildTable = ${JSON.stringify(table, null, '\t')};`,
			''
		].join('\n'),
		diagnostics,
		table,
		presetCarried,
		totalIntegerReads,
		freeTextClosedBy,
		holes,
		textChoices
	};
}
