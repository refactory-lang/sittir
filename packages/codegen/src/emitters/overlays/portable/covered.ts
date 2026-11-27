import { portablePathHasFacts, readableEntries } from '@sittir/common/engine';
import { entriesHolding, type PlanItems } from '@sittir/common/portable/utils';
import type { PortableCondition, QueryPlan, QuerySubject } from '@sittir/types';
import type { ReadEntry } from '../../../bindings/routes.ts';
import { emitShapeFailures, type EmitShapeFailure } from '../../../compiler/diagnostics/emit-diagnostics.ts';
import { fixedTextOfKind, isMultiple, isNodeRef, isNonEmpty, isRequired, isTerminalValue, isUnresolvedRef, type NodeRef } from '../../../compiler/model/node-map.ts';
import type { NodeMap } from '../../../compiler/types.ts';
import { findKindEntry } from '../../kind-discriminant.ts';
import { membershipKindsOf } from '../../membership.ts';
import { numberedSlotsOf, type StructSlot } from '../../render-module.ts';
import type { PortableTypedInput } from './typed.ts';

export interface FamilyCoverage {
	readonly entry: ReadEntry;
	readonly refinements: readonly string[];
	readonly cases: number;
	readonly overlapping: readonly string[];
}

interface Covering {
	readonly cases: number;
	readonly uncovered: readonly string[];
	readonly overlapping: readonly string[];
}

const CASE_LIMIT = 4096;

class Undecided extends Error {}

const undecided = (why: string): never => {
	throw new Undecided(why);
};

class Leaf {
	constructor(readonly text: string | undefined) {}
}

interface CaseSlot {
	readonly name: string;
	readonly multiple: boolean;
	readonly items: readonly Item[];
}

class Case {
	constructor(
		readonly $type: number,
		readonly kind: string,
		readonly slots: ReadonlyMap<number, CaseSlot>,
		readonly text: string | undefined
	) {}
}

type Item = Leaf | Case;

const describe = (item: unknown): string => {
	if (item instanceof Leaf) return item.text === undefined ? 'a token of no fixed text' : JSON.stringify(item.text);
	if (!(item instanceof Case)) return String(item);
	const slots = [...item.slots.values()].map(({ name, multiple, items }) => `${name}: ${multiple ? `[${items.map(describe).join(', ')}]` : items.length === 0 ? 'none' : describe(items[0])}`);
	return slots.length === 0 ? item.kind : `${item.kind} { ${slots.join(', ')} }`;
};

const caseItems: PlanItems<Case> = {
	isNode: (item): item is Case => item instanceof Case,
	itemsIn: (node, subject) => {
		const number = subject.slots[node.$type];
		return number === undefined ? [] : (node.slots.get(number)?.items ?? []);
	},
	textOf: (item) => ((item instanceof Leaf || item instanceof Case) && item.text !== undefined ? item.text : undecided(`a test reads the text of ${describe(item)}, which the grammar does not fix`)),
	typeOf: (item) => (item instanceof Case ? [item.$type] : undecided(`a test reads the kind of the token ${describe(item)}`)),
	delimiterOf: (item) => undecided(`a test reads the delimiter of ${describe(item)}`)
};

interface Tested {
	readonly slots: ReadonlyMap<number, ReadonlySet<number>>;
	readonly longest: number;
}

function testedOf(conditions: readonly PortableCondition[]): Tested {
	const slots = new Map<number, Set<number>>();
	let longest = 2;
	const add = (subject: object): void => {
		if (!('slots' in subject)) return;
		for (const [kind, number] of Object.entries(subject.slots as Readonly<Record<number, number>>)) {
			const id = Number(kind);
			(slots.get(id) ?? slots.set(id, new Set()).get(id)!).add(number);
		}
	};
	const visit = (plan: QueryPlan<QuerySubject>): void => {
		switch (plan.op) {
			case 'not':
				return visit(plan.of);
			case 'and':
			case 'or':
				return plan.of.forEach(visit);
			case 'child':
				add(plan);
				return visit(plan.of);
			case 'count':
				longest = Math.max(longest, plan.min);
				return add(plan);
			case 'delimiter':
				return;
			default:
				return add(plan);
		}
	};
	for (const condition of conditions) {
		condition.via.forEach(add);
		visit(condition.plan);
	}
	return { slots, longest };
}

function casesOf(kind: string, nodeMap: NodeMap, { slots: tested, longest }: Tested): readonly Case[] {
	const of = (kind: string, seen: ReadonlySet<string>): readonly Case[] => {
		const node = nodeMap.nodes.get(kind);
		if (node?.kindId === undefined) return undecided(`${kind} has no kind id`);
		if (seen.has(kind)) return undecided(`${kind} holds itself in a slot a test reads`);
		const id = node.kindId;
		const numbered = numberedSlotsOf(node, nodeMap);
		let cases: ReadonlyMap<number, CaseSlot>[] = [new Map()];
		for (const number of [...(tested.get(id) ?? [])].sort((a, b) => a - b)) {
			const at = numbered[number] ?? undecided(`${kind} has no slot ${number}`);
			const lists = listsOf(at, new Set([...seen, kind]));
			cases = cases.flatMap((held) => lists.map((items) => new Map(held).set(number, { name: at.slot.name, multiple: isMultiple(at.slot), items })));
			if (cases.length > CASE_LIMIT) return undecided(`${kind} has more than ${CASE_LIMIT} cases`);
		}
		const text = fixedTextOfKind(node);
		return cases.map((held) => new Case(id, kind, held, text));
	};
	const alternativesOf = (value: NodeRef, seen: ReadonlySet<string>): readonly Item[] => {
		if (isTerminalValue(value)) return [new Leaf(value.value)];
		if (!isNodeRef(value)) return [new Leaf(undefined)];
		if (isUnresolvedRef(value.node)) return undecided('a slot a test reads holds a kind the node map does not resolve');
		return membershipKindsOf([value.node.kind], nodeMap).flatMap((member) => of(member, seen));
	};
	const listsOf = ({ slot, forceOptional }: StructSlot, seen: ReadonlySet<string>): readonly (readonly Item[])[] => {
		const alternatives = slot.values.flatMap((value) => alternativesOf(value, seen));
		const multiple = isMultiple(slot);
		const lists: (readonly Item[])[] = forceOptional || !(multiple ? isNonEmpty(slot) : isRequired(slot)) ? [[]] : [];
		if (!multiple) return [...lists, ...alternatives.map((item) => [item])];
		let longer: readonly (readonly Item[])[] = [[]];
		for (let length = 1; length <= longest; length++) {
			longer = longer.flatMap((list) => alternatives.map((item) => [...list, item]));
			if (longer.length > CASE_LIMIT) return undecided(`${slot.name} has more than ${CASE_LIMIT} lists`);
			lists.push(...longer);
		}
		return lists;
	};
	return of(kind, new Set());
}

type Readable = ReturnType<typeof readableOf>[number];

const readableOf = (list: readonly ReadEntry[], readTest: PortableTypedInput['readTest']) =>
	readableEntries(list.map((entry) => ({ entry, path: entry.vocab, within: entry.claim.within, test: readTest(entry) })));

export interface HeldReads {
	readonly varied: ReadonlySet<string>;
	readonly held: ReadonlyMap<string, ReadonlySet<string>>;
	readonly unclaimed: readonly string[];
}

export function heldReadsOf(kind: string, list: readonly ReadEntry[], nodeMap: NodeMap, readTest: PortableTypedInput['readTest']): HeldReads | undefined {
	const readable = readableOf(list, readTest);
	try {
		const varied = new Set<string>();
		const held = new Map<string, Set<string>>();
		const unclaimed: string[] = [];
		for (const value of casesOf(kind, nodeMap, testedOf(readable.flatMap(({ test }) => test)))) {
			const [path] = entriesHolding(readable, value, caseItems).map((entry) => entry.path);
			if (path === undefined) unclaimed.push(describe(value));
			const at = path === undefined ? undefined : (held.get(path) ?? held.set(path, new Set()).get(path)!);
			for (const { name, items } of value.slots.values()) {
				varied.add(name);
				if (items.length > 0) at?.add(name);
			}
		}
		return { varied, held, unclaimed };
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}

function coverageOf(kind: string, base: Readable, readable: readonly Readable[], nodeMap: NodeMap): Covering {
	let cases: readonly Case[];
	try {
		cases = casesOf(kind, nodeMap, testedOf(readable.flatMap(({ test }) => test)));
	} catch (error) {
		if (error instanceof Undecided) return { cases: 0, uncovered: [error.message], overlapping: [] };
		throw error;
	}
	if (cases.length === 0) return { cases: 0, uncovered: [`${kind} has no case its slots allow`], overlapping: [] };
	const uncovered: string[] = [];
	const overlapping: string[] = [];
	for (const value of cases)
		try {
			const read = [...new Set(entriesHolding(readable, value, caseItems).map(({ path }) => path))];
			if (read[0] === base.path) uncovered.push(describe(value));
			if (read.filter((path) => path !== base.path).length > 1) overlapping.push(`${describe(value)} reads as ${read.join(' and ')}`);
		} catch (error) {
			if (!(error instanceof Undecided)) throw error;
			uncovered.push(`${describe(value)}, as ${error.message}`);
		}
	return { cases: cases.length, uncovered, overlapping };
}

export function familyCoverageOf({ routes, nodeMap, table, readTest, kindEntries }: Pick<PortableTypedInput, 'routes' | 'nodeMap' | 'table' | 'readTest' | 'kindEntries'>): readonly FamilyCoverage[] {
	const out: FamilyCoverage[] = [];
	const refused: EmitShapeFailure[] = [];
	for (const [kind, list] of [...routes.readEntries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
		const readable = readableOf(list, readTest);
		for (const base of readable) {
			if (base.test.length > 0) continue;
			const arms = table.paths[base.path]?.arms ?? [];
			const id = findKindEntry(kindEntries, kind)?.id;
			if (arms.some((arm) => arm.kind === id)) continue;
			const refinements = [...new Set(readable.flatMap(({ path }) => (path !== base.path && portablePathHasFacts(base.path, path) ? [path] : [])))].sort();
			if (arms.length > 0 && refinements.length === 0) continue;
			const { cases, uncovered, overlapping } = coverageOf(kind, base, readable, nodeMap);
			if (arms.length > 0 && uncovered.length > 0) continue;
			if (uncovered.length > 0)
				refused.push({
					code: 'portable-family-uncovered',
					ownerKind: kind,
					message: `${kind} reads as ${base.path}, a path no build takes, when no refinement of it holds: ${uncovered.join('; ')}`,
					details: { vocab: base.path, uncovered }
				});
			out.push({ entry: base.entry, refinements, cases, overlapping });
		}
	}
	if (refused.length > 0) throw emitShapeFailures(refused);
	return out;
}
