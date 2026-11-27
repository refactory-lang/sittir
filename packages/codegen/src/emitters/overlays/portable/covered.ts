import { portablePathHasFacts, readableEntries } from '@sittir/common/engine';
import { entriesHolding, holds, type PlanItems } from '@sittir/common/portable/utils';
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

interface Answers {
	readonly marks: string;
	readonly delimiters: readonly number[];
	readonly shown: string | undefined;
}

class Leaf {
	constructor(
		readonly text: string | undefined,
		readonly answers: Answers
	) {}
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
		readonly text: string | undefined,
		readonly answers: Answers
	) {}
}

type Item = Leaf | Case;

const describe = (item: unknown): string => {
	if (item instanceof Leaf) return item.text !== undefined ? JSON.stringify(item.text) : `a token of no fixed text${item.answers.shown === undefined ? '' : ` (${item.answers.shown})`}`;
	if (!(item instanceof Case)) return String(item);
	const kind = item.answers.shown === undefined ? item.kind : `${item.kind} (${item.answers.shown})`;
	const slots = [...item.slots.values()].map(({ name, multiple, items }) => `${name}: ${multiple ? `[${items.map(describe).join(', ')}]` : items.length === 0 ? 'none' : describe(items[0])}`);
	return slots.length === 0 ? kind : `${kind} { ${slots.join(', ')} }`;
};

const caseItems: PlanItems<Case> = {
	isNode: (item): item is Case => item instanceof Case,
	itemsIn: (node, subject) => {
		const number = subject.slots[node.$type];
		return number === undefined ? [] : (node.slots.get(number)?.items ?? []);
	},
	textOf: (item) => (item instanceof Leaf || item instanceof Case ? item.answers.marks : undecided(`a test reads the text of ${describe(item)}`)),
	typeOf: (item) => (item instanceof Case ? [item.$type] : undecided(`a test reads the kind of the token ${describe(item)}`)),
	delimiterOf: (item) => (item instanceof Case ? item.answers.delimiters : undecided(`a test reads the delimiter of ${describe(item)}`))
};

const FIRST_MARK = 0xe000;

interface TextTest {
	readonly mark: string;
	readonly own: QueryPlan<QuerySubject>;
	readonly shown: string;
	readonly at: Set<string>;
	root: boolean;
	deep: boolean;
}

interface DelimiterTest {
	readonly bit: number;
	readonly shown: string;
	root: boolean;
	deep: boolean;
}

interface Tested {
	readonly slots: ReadonlyMap<number, ReadonlySet<number>>;
	readonly longest: number;
	readonly texts: readonly TextTest[];
	readonly delimiters: readonly DelimiterTest[];
	readonly readable: readonly Readable[];
}

const siteOf = (kind: number | string, number: number): string => `${kind}:${number}`;

function testedOf(readable: readonly Readable[]): Tested {
	const slots = new Map<number, Set<number>>();
	let longest = 2;
	const texts = new Map<string, TextTest>();
	const delimiters = new Map<number, DelimiterTest>();
	const add = (subject: object): void => {
		if (!('slots' in subject)) return;
		for (const [kind, number] of Object.entries(subject.slots as Readonly<Record<number, number>>)) {
			const id = Number(kind);
			(slots.get(id) ?? slots.set(id, new Set()).get(id)!).add(number);
		}
	};
	const textTest = (plan: Extract<QueryPlan<QuerySubject>, { op: 'eq' | 'match' }>, deep: boolean): TextTest => {
		const shown = plan.op === 'eq' ? `= ${JSON.stringify(plan.text)}` : `~ /${plan.pattern}/`;
		const own: QueryPlan<QuerySubject> = plan.op === 'eq' ? { op: 'eq', text: plan.text, self: true } : { op: 'match', pattern: plan.pattern, self: true };
		const test = texts.get(shown) ?? texts.set(shown, { mark: String.fromCodePoint(FIRST_MARK + texts.size), own, shown, at: new Set(), root: false, deep: false }).get(shown)!;
		if (!('self' in plan)) for (const [kind, number] of Object.entries(plan.slots)) test.at.add(siteOf(kind, number));
		else if (deep) test.deep = true;
		else test.root = true;
		return test;
	};
	const delimiterTest = (delimiter: number, deep: boolean): DelimiterTest => {
		if (!delimiters.has(delimiter) && delimiters.size >= 30) return undecided(`the tests read more than 30 delimiters`);
		const test = delimiters.get(delimiter) ?? delimiters.set(delimiter, { bit: 1 << delimiters.size, shown: `delimiter ${delimiter}`, root: false, deep: false }).get(delimiter)!;
		if (deep) test.deep = true;
		else test.root = true;
		return test;
	};
	const visit = (plan: QueryPlan<QuerySubject>, deep: boolean): QueryPlan<QuerySubject> => {
		switch (plan.op) {
			case 'not':
				return { op: 'not', of: visit(plan.of, deep) };
			case 'and':
			case 'or':
				return { op: plan.op, of: plan.of.map((of) => visit(of, deep)) };
			case 'child':
				add(plan);
				return { ...plan, of: visit(plan.of, true) };
			case 'count':
				longest = Math.max(longest, plan.min);
				add(plan);
				return plan;
			case 'delimiter':
				return { op: 'delimiter', delimiter: delimiterTest(plan.delimiter, deep).bit };
			case 'eq': {
				add(plan);
				const { text: _text, ...subject } = plan;
				return { ...subject, op: 'match', pattern: textTest(plan, deep).mark };
			}
			case 'match':
				add(plan);
				return { ...plan, pattern: textTest(plan, deep).mark };
			default:
				add(plan);
				return plan;
		}
	};
	const asTested = (condition: PortableCondition): PortableCondition => {
		condition.via.forEach(add);
		return { ...condition, plan: visit(condition.plan, condition.via.length > 0) };
	};
	const tested = readable.map((entry) => ({ ...entry, test: entry.test.map(asTested) }));
	return { slots, longest, texts: [...texts.values()], delimiters: [...delimiters.values()], readable: tested };
}

const subsetsOf = <T>(items: readonly T[]): readonly (readonly T[])[] => {
	if (items.length > Math.log2(CASE_LIMIT)) return undecided(`more than ${CASE_LIMIT} answers to ${items.length} tests`);
	return items.reduce<readonly (readonly T[])[]>((subsets, item) => subsets.flatMap((subset) => [subset, [...subset, item]]), [[]]);
};

function answersOf(text: string | undefined, { texts }: Tested, reading: readonly TextTest[], delimiting: readonly DelimiterTest[]): readonly Answers[] {
	const textual =
		text !== undefined
			? [{ marks: texts.flatMap((test) => (holds(test.own, { texts: () => [text] }) ? [test.mark] : [])).join(''), passing: undefined }]
			: subsetsOf(reading).map((passed) => ({ marks: passed.map((test) => test.mark).join(''), passing: reading.length === 0 ? undefined : passed.map((test) => test.shown) }));
	const delimited = subsetsOf(delimiting).map((passed) => ({ bits: passed.reduce((bits, test) => bits | test.bit, 0), passing: delimiting.length === 0 ? undefined : passed.map((test) => test.shown) }));
	return textual.flatMap(({ marks, passing }) =>
		delimited.map(({ bits, passing: delimiterPassing }) => {
			const shown = [...(passing === undefined ? [] : [`text passing ${passing.join(', ') || 'no test'}`]), ...(delimiterPassing === undefined ? [] : [`delimiter passing ${delimiterPassing.join(', ') || 'no test'}`])];
			return { marks, delimiters: bits === 0 ? [] : [bits], shown: shown.length === 0 ? undefined : shown.join('; ') };
		})
	);
}

function casesOf(kind: string, nodeMap: NodeMap, tested: Tested): readonly Case[] {
	const { slots: testedSlots, longest, texts, delimiters } = tested;
	const deepTexts = texts.filter((test) => test.deep);
	const deepDelimiters = delimiters.filter((test) => test.deep);
	const textsAt = (site: string): readonly TextTest[] => texts.filter((test) => test.at.has(site));
	const of = (kind: string, seen: ReadonlySet<string>, reading: readonly TextTest[], delimiting: readonly DelimiterTest[]): readonly Case[] => {
		const node = nodeMap.nodes.get(kind);
		if (node?.kindId === undefined) return undecided(`${kind} has no kind id`);
		if (seen.has(kind)) return undecided(`${kind} holds itself in a slot a test reads`);
		const id = node.kindId;
		const numbered = numberedSlotsOf(node, nodeMap);
		let cases: ReadonlyMap<number, CaseSlot>[] = [new Map()];
		for (const number of [...(testedSlots.get(id) ?? [])].sort((a, b) => a - b)) {
			const at = numbered[number] ?? undecided(`${kind} has no slot ${number}`);
			const lists = listsOf(at, new Set([...seen, kind]), siteOf(id, number));
			cases = cases.flatMap((held) => lists.map((items) => new Map(held).set(number, { name: at.slot.name, multiple: isMultiple(at.slot), items })));
			if (cases.length > CASE_LIMIT) return undecided(`${kind} has more than ${CASE_LIMIT} cases`);
		}
		const text = fixedTextOfKind(node);
		const answers = answersOf(text, tested, reading, delimiting);
		if (cases.length * answers.length > CASE_LIMIT) return undecided(`${kind} has more than ${CASE_LIMIT} cases`);
		return cases.flatMap((held) => answers.map((answer) => new Case(id, kind, held, text, answer)));
	};
	const alternativesOf = (value: NodeRef, seen: ReadonlySet<string>, site: string): readonly Item[] => {
		if (isTerminalValue(value)) return answersOf(value.value, tested, [], []).map((answer) => new Leaf(value.value, answer));
		if (!isNodeRef(value)) return answersOf(undefined, tested, textsAt(site), []).map((answer) => new Leaf(undefined, answer));
		if (isUnresolvedRef(value.node)) return undecided('a slot a test reads holds a kind the node map does not resolve');
		const reading = [...new Set([...textsAt(site), ...deepTexts])];
		return membershipKindsOf([value.node.kind], nodeMap)
			.flatMap(storagesOf)
			.flatMap((member) => of(member, seen, reading, deepDelimiters));
	};
	const storagesOf = (kind: string): readonly string[] => {
		const storages = nodeMap.nodes.has(kind) ? [] : (nodeMap.displayUnions?.get(kind) ?? []).flatMap(({ storage }) => (nodeMap.nodes.has(storage) ? [storage] : []));
		return storages.length > 0 ? membershipKindsOf(storages, nodeMap) : [kind];
	};
	const listsOf = ({ slot, forceOptional }: StructSlot, seen: ReadonlySet<string>, site: string): readonly (readonly Item[])[] => {
		const alternatives = slot.values.flatMap((value) => alternativesOf(value, seen, site));
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
	return of(
		kind,
		new Set(),
		texts.filter((test) => test.root),
		delimiters.filter((test) => test.root)
	);
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
		const tested = testedOf(readable);
		for (const value of casesOf(kind, nodeMap, tested)) {
			const [path] = entriesHolding(tested.readable, value, caseItems).map((entry) => entry.path);
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
	let tested: Tested;
	try {
		tested = testedOf(readable);
		cases = casesOf(kind, nodeMap, tested);
	} catch (error) {
		if (error instanceof Undecided) return { cases: 0, uncovered: [error.message], overlapping: [] };
		throw error;
	}
	if (cases.length === 0) return { cases: 0, uncovered: [`${kind} has no case its slots allow`], overlapping: [] };
	const uncovered: string[] = [];
	const overlapping: string[] = [];
	for (const value of cases)
		try {
			const read = [...new Set(entriesHolding(tested.readable, value, caseItems).map(({ path }) => path))];
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
