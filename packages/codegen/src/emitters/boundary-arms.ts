import { SEPARATING_KINDS, TIGHT_KINDS, layoutKindsOfText } from '../compiler/model/layout-kinds.ts';
import { isWhitespaceOnly, type Body, type BodyNode } from './render-body.ts';

export type BoundarySide = 'before' | 'after';

export type BoundaryMark =
	| { readonly at: 'site'; readonly site: number }
	| { readonly at: 'flank'; readonly site: number }
	| { readonly at: 'seam'; readonly kinds: string };

export interface BoundaryArm {
	readonly next: number;
	readonly field?: number;
	readonly marks: readonly BoundaryMark[];
}

export interface KindBoundary {
	readonly kind: number;
	readonly before: readonly BoundaryArm[];
	readonly after: readonly BoundaryArm[];
}

export type BoundaryDelimiting = 'mandatory' | 'optional' | 'none';

export interface BoundaryToken {
	readonly text: string;
	readonly id: number | undefined;
}

export interface BoundaryList {
	readonly head?: number;
	readonly tail?: number;
	readonly leading: BoundaryDelimiting;
	readonly trailing: BoundaryDelimiting;
	readonly separators: readonly BoundaryToken[];
}

export interface BoundaryElement {
	readonly kind?: string;
	readonly id?: number;
	readonly hidden?: boolean;
	readonly text?: string;
}

export interface BoundarySlot {
	readonly presence: 'required' | 'optional' | 'never';
	readonly prefix: string;
	readonly suffix: string;
	readonly list?: BoundaryList;
	readonly elements: readonly BoundaryElement[];
	readonly fields: readonly number[];
}

export interface BoundaryTemplate {
	readonly body: Body;
	readonly ownEdge: (seam: string) => boolean;
	readonly site: (seam: string) => number;
	readonly optional: (slot: string) => boolean;
	readonly slot: (name: string) => BoundarySlot;
}

export interface BoundaryMember extends BoundaryToken {
	readonly before?: number;
	readonly after?: number;
}

export interface BoundaryKind {
	readonly id: number | undefined;
	readonly hidden: boolean;
}

export interface BoundaryInputs {
	readonly templates: ReadonlyMap<string, BoundaryTemplate>;
	readonly members: ReadonlyMap<string, readonly BoundaryMember[]>;
	readonly kindOf: (kind: string) => BoundaryKind;
	readonly tokenIdOf: (text: string) => number | undefined;
	readonly concrete: (kinds: readonly string[]) => ReadonlySet<string>;
}

export type BoundaryDrop = 'ambiguous' | 'unmodeled' | 'unknown';

export interface DroppedBoundaryArm {
	readonly kind: string;
	readonly side: BoundarySide;
	readonly drop: BoundaryDrop;
	readonly next?: number;
	readonly variants: readonly string[];
}

export interface BoundaryTable {
	readonly rows: readonly KindBoundary[];
	readonly dropped: readonly DroppedBoundaryArm[];
}

type Step =
	| { readonly step: 'mark'; readonly mark: BoundaryMark; readonly follows?: string }
	| { readonly step: 'token'; readonly text: string }
	| { readonly step: 'slot'; readonly name: string }
	| { readonly step: 'if'; readonly arms: readonly GateStep[]; readonly fallback: readonly Step[] }
	| { readonly step: 'unsupported'; readonly reason: string };

interface GateStep {
	readonly test: string;
	readonly kinds?: readonly string[];
	readonly steps: readonly Step[];
}

interface Path {
	readonly present: ReadonlyMap<string, boolean>;
	readonly only: ReadonlyMap<string, ReadonlySet<string>>;
	readonly not: ReadonlyMap<string, ReadonlySet<string>>;
	readonly unsupported?: string;
}

interface ModeledArm {
	readonly next: number;
	readonly marks: readonly BoundaryMark[];
	readonly fields: readonly number[];
	readonly unsupported?: string;
}

type RawArm = ModeledArm | { readonly next: undefined; readonly unknown: string };

type Rest = (path: Path, marks: readonly BoundaryMark[]) => void;
type Emit = (arm: RawArm) => void;

const START: Path = { present: new Map(), only: new Map(), not: new Map() };

function stepsOf(body: Body, template: BoundaryTemplate): Step[] {
	const steps: Step[] = [];
	let payload = '';
	body.forEach((node, i) => {
		const next = body[i + 1];
		const run = node.kind === 'tokenSeam' && next?.kind === 'text' ? leadingRun(next.text) : '';
		const step = stepOf(node, template, body[i - 1], run, node.kind === 'text' ? node.text.slice(payload.length) : '');
		payload = run;
		if (step !== undefined) steps.push(step);
	});
	return steps;
}

function stepOf(node: BodyNode, template: BoundaryTemplate, prior: BodyNode | undefined, run: string, text: string): Step | undefined {
	switch (node.kind) {
		case 'text':
			return text === '' || isWhitespaceOnly(text) || leadingRun(text) !== '' || text.trimEnd() !== text
				? { step: 'unsupported', reason: `text ${JSON.stringify(node.text)}` }
				: { step: 'token', text };
		case 'slot':
			return { step: 'slot', name: node.name };
		case 'seam':
			return template.ownEdge(node.field) ? undefined : { step: 'mark', mark: { at: 'site', site: template.site(node.field) } };
		case 'adjacent':
			return {
				step: 'mark',
				mark: { at: 'seam', kinds: TIGHT_KINDS },
				...(prior?.kind === 'slot' && template.optional(prior.name) ? { follows: prior.name } : {})
			};
		case 'tokenSeam':
			return { step: 'mark', mark: { at: 'seam', kinds: layoutKindsOfText(node.text + run) } };
		case 'wordSeam':
			return { step: 'mark', mark: { at: 'seam', kinds: SEPARATING_KINDS } };
		case 'indent':
		case 'dedent':
			return undefined;
		case 'space':
			return { step: 'unsupported', reason: node.kind };
		case 'if':
			return {
				step: 'if',
				arms: node.arms.map((arm) => ({
					test: arm.test,
					...(arm.kinds === undefined ? {} : { kinds: arm.kinds }),
					steps: stepsOf(arm.body, template)
				})),
				fallback: node.fallback === undefined ? [] : stepsOf(node.fallback, template)
			};
	}
}

function leadingRun(text: string): string {
	return text.slice(0, text.length - text.trimStart().length);
}

function reversed(steps: readonly Step[]): Step[] {
	return [...steps].reverse().map((step) =>
		step.step === 'if'
			? { ...step, arms: step.arms.map((arm) => ({ ...arm, steps: reversed(arm.steps) })), fallback: reversed(step.fallback) }
			: step
	);
}

function presence(path: Path, slot: string, present: boolean): Path {
	return { ...path, present: new Map(path.present).set(slot, present) };
}

function narrowed(path: Path, slot: string, kinds: ReadonlySet<string>): Path {
	const prior = path.only.get(slot);
	const only = prior === undefined ? kinds : new Set([...prior].filter((kind) => kinds.has(kind)));
	return { ...path, only: new Map(path.only).set(slot, only) };
}

function excluded(path: Path, slot: string, kinds: ReadonlySet<string>): Path {
	const prior = path.not.get(slot) ?? new Set<string>();
	return { ...path, not: new Map(path.not).set(slot, new Set([...prior, ...kinds])) };
}

function admits(path: Path, slot: string, element: BoundaryElement): boolean {
	if (element.kind === undefined) return true;
	return (path.only.get(slot)?.has(element.kind) ?? true) && !(path.not.get(slot)?.has(element.kind) ?? false);
}

function placed(side: BoundarySide, marks: readonly BoundaryMark[], mark: BoundaryMark): readonly BoundaryMark[] {
	return side === 'before' ? [...marks, mark] : [mark, ...marks];
}

function joined(side: BoundarySide, outer: readonly BoundaryMark[], inner: readonly BoundaryMark[]): readonly BoundaryMark[] {
	return side === 'before' ? [...outer, ...inner] : [...inner, ...outer];
}

function modeled(next: number, marks: readonly BoundaryMark[], path: Path, fields: readonly number[] = []): ModeledArm {
	return { next, marks, fields, ...(path.unsupported === undefined ? {} : { unsupported: path.unsupported }) };
}

function markKey(mark: BoundaryMark): string {
	switch (mark.at) {
		case 'site':
		case 'flank':
			return `${mark.at}:${mark.site}`;
		case 'seam':
			return `seam:${mark.kinds}`;
	}
}

function marksKey(arm: ModeledArm): string {
	const marks = `[${arm.marks.map(markKey).join(', ')}]`;
	return arm.unsupported === undefined ? marks : `${marks} past ${arm.unsupported}`;
}

class BoundaryWalk {
	private readonly memo = new Map<string, readonly RawArm[]>();
	private readonly active = new Set<string>();

	constructor(private readonly inputs: BoundaryInputs) {}

	armsOf(kind: string, side: BoundarySide): readonly RawArm[] {
		const key = `${side}\u0000${kind}`;
		const known = this.memo.get(key);
		if (known !== undefined) return known;
		if (this.active.has(key)) return [];
		this.active.add(key);
		const arms = this.walkKind(kind, side);
		this.active.delete(key);
		this.memo.set(key, arms);
		return arms;
	}

	private walkKind(kind: string, side: BoundarySide): readonly RawArm[] {
		const out: RawArm[] = [];
		const emit: Emit = (each) => out.push(each);
		for (const member of this.inputs.members.get(kind) ?? []) {
			const site = side === 'before' ? member.before : member.after;
			const marks: readonly BoundaryMark[] = site === undefined ? [] : [{ at: 'site', site }];
			emit(member.id === undefined ? { next: undefined, unknown: member.text } : modeled(member.id, marks, START));
		}
		const template = this.inputs.templates.get(kind);
		if (template !== undefined) {
			const forward = stepsOf(template.body, template);
			this.walk(template, side === 'before' ? forward : reversed(forward), 0, side, START, [], () => {}, emit);
		}
		return out;
	}

	private walk(
		template: BoundaryTemplate,
		steps: readonly Step[],
		at: number,
		side: BoundarySide,
		path: Path,
		marks: readonly BoundaryMark[],
		done: Rest,
		emit: Emit
	): void {
		const step = steps[at];
		if (step === undefined) {
			done(path, marks);
			return;
		}
		const rest: Rest = (p, m) => this.walk(template, steps, at + 1, side, p, m, done, emit);
		switch (step.step) {
			case 'unsupported':
				rest(path.unsupported === undefined ? { ...path, unsupported: step.reason } : path, marks);
				return;
			case 'mark': {
				if (step.follows === undefined) {
					rest(path, placed(side, marks, step.mark));
					return;
				}
				if (side === 'before') {
					rest(path, marks);
					return;
				}
				const known = path.present.get(step.follows);
				if (known !== false) rest(presence(path, step.follows, true), placed(side, marks, step.mark));
				if (known !== true) rest(presence(path, step.follows, false), marks);
				return;
			}
			case 'token':
				this.token({ text: step.text, id: this.inputs.tokenIdOf(step.text) }, marks, path, emit);
				return;
			case 'slot':
				this.slot(template, step.name, side, path, marks, rest, emit);
				return;
			case 'if':
				this.gate(template, step, side, path, marks, rest, emit);
				return;
		}
	}

	private gate(
		template: BoundaryTemplate,
		step: Extract<Step, { step: 'if' }>,
		side: BoundarySide,
		path: Path,
		marks: readonly BoundaryMark[],
		rest: Rest,
		emit: Emit
	): void {
		let open: Path | undefined = path;
		for (const gated of step.arms) {
			if (open === undefined) return;
			const known = open.present.get(gated.test);
			if (gated.kinds === undefined) {
				if (known !== false) this.walk(template, gated.steps, 0, side, presence(open, gated.test, true), marks, rest, emit);
				open = known === true ? undefined : presence(open, gated.test, false);
				continue;
			}
			const kinds = this.inputs.concrete(gated.kinds);
			const taken = narrowed(presence(open, gated.test, true), gated.test, kinds);
			if (known !== false && taken.only.get(gated.test)!.size > 0) this.walk(template, gated.steps, 0, side, taken, marks, rest, emit);
			open = excluded(open, gated.test, kinds);
		}
		if (open !== undefined) this.walk(template, step.fallback, 0, side, open, marks, rest, emit);
	}

	private slot(
		template: BoundaryTemplate,
		name: string,
		side: BoundarySide,
		path: Path,
		marks: readonly BoundaryMark[],
		rest: Rest,
		emit: Emit
	): void {
		const slot = template.slot(name);
		const known = path.present.get(name);
		if (known === false || (known === undefined && slot.presence !== 'required')) rest(presence(path, name, false), marks);
		if (known === false || (known === undefined && slot.presence === 'never')) return;
		const present = presence(path, name, true);
		const outer = side === 'before' ? slot.prefix : slot.suffix;
		if (outer !== '') {
			this.token({ text: outer, id: this.inputs.tokenIdOf(outer) }, marks, present, emit);
			return;
		}
		let inner = marks;
		const list = slot.list;
		if (list !== undefined) {
			const flank = side === 'before' ? list.head : list.tail;
			if (flank !== undefined) inner = placed(side, inner, { at: 'flank', site: flank });
			const delimiting = side === 'before' ? list.leading : list.trailing;
			if (delimiting !== 'none') for (const separator of list.separators) this.token(separator, inner, present, emit);
			if (delimiting === 'mandatory') return;
		}
		for (const element of slot.elements) {
			if (admits(present, name, element)) this.element(element, side, inner, present, slot.fields, emit);
		}
	}

	private element(element: BoundaryElement, side: BoundarySide, marks: readonly BoundaryMark[], path: Path, fields: readonly number[], emit: Emit): void {
		const kind = element.kind;
		const members = kind === undefined ? [] : [...this.inputs.concrete([kind])].filter((member) => member !== kind);
		if (members.length > 0) {
			for (const member of members) this.element({ kind: member }, side, marks, path, fields, emit);
			return;
		}
		const facts = kind === undefined ? undefined : this.inputs.kindOf(kind);
		const id = element.id ?? facts?.id;
		if (id !== undefined) emit(modeled(id, marks, path, fields));
		if (id !== undefined && (element.hidden ?? facts?.hidden) !== true) return;
		if (kind === undefined || (!this.inputs.templates.has(kind) && !this.inputs.members.has(kind))) {
			if (id === undefined) emit({ next: undefined, unknown: kind ?? element.text ?? '' });
			return;
		}
		for (const inner of this.armsOf(kind, side)) {
			if (inner.next === undefined) {
				emit(inner);
				continue;
			}
			const past = path.unsupported ?? inner.unsupported;
			emit({ next: inner.next, marks: joined(side, marks, inner.marks), fields: [], ...(past === undefined ? {} : { unsupported: past }) });
		}
	}

	private token(token: BoundaryToken, marks: readonly BoundaryMark[], path: Path, emit: Emit): void {
		emit(token.id === undefined ? { next: undefined, unknown: token.text } : modeled(token.id, marks, path));
	}
}

function fieldSplit(variants: readonly ModeledArm[]): ReadonlyMap<number, ModeledArm> | undefined {
	if (variants.some((variant) => variant.fields.length === 0 || variant.unsupported !== undefined)) return undefined;
	const byField = new Map<number, ModeledArm>();
	for (const variant of variants) {
		for (const field of variant.fields) {
			const prior = byField.get(field);
			if (prior !== undefined && marksKey(prior) !== marksKey(variant)) return undefined;
			byField.set(field, variant);
		}
	}
	return byField;
}

function merged(kind: string, side: BoundarySide, raw: readonly RawArm[], dropped: DroppedBoundaryArm[]): BoundaryArm[] {
	const unknown = [...new Set(raw.flatMap((each) => (each.next === undefined ? [each.unknown] : [])))].sort();
	if (unknown.length > 0) {
		if (raw.some((each) => each.next !== undefined && each.marks.length > 0)) dropped.push({ kind, side, drop: 'unknown', variants: unknown });
		return [];
	}
	const byNext = new Map<number, ModeledArm[]>();
	for (const each of raw) {
		if (each.next === undefined) continue;
		byNext.set(each.next, [...(byNext.get(each.next) ?? []), each]);
	}
	const arms: BoundaryArm[] = [];
	for (const [next, variants] of [...byNext].sort(([a], [b]) => a - b)) {
		const keys = [...new Set(variants.map(marksKey))].sort();
		const [only] = variants;
		if (keys.length === 1 && only !== undefined && only.unsupported === undefined) {
			if (only.marks.length > 0) arms.push({ next, marks: only.marks });
			continue;
		}
		const split = keys.length > 1 ? fieldSplit(variants) : undefined;
		if (split !== undefined) {
			for (const [field, variant] of [...split].sort(([a], [b]) => a - b)) {
				if (variant.marks.length > 0) arms.push({ next, field, marks: variant.marks });
			}
			continue;
		}
		const drop: BoundaryDrop = variants.some((variant) => variant.unsupported !== undefined) ? 'unmodeled' : 'ambiguous';
		dropped.push({ kind, side, drop, next, variants: keys });
	}
	return arms;
}

export function boundaryTableOf(inputs: BoundaryInputs): BoundaryTable {
	const walk = new BoundaryWalk(inputs);
	const byId = new Map<number, { kinds: string[]; before: RawArm[]; after: RawArm[] }>();
	for (const kind of [...new Set([...inputs.templates.keys(), ...inputs.members.keys()])].sort()) {
		const id = inputs.kindOf(kind).id;
		if (id === undefined) continue;
		const row = byId.get(id) ?? { kinds: [], before: [], after: [] };
		row.kinds.push(kind);
		row.before.push(...walk.armsOf(kind, 'before'));
		row.after.push(...walk.armsOf(kind, 'after'));
		byId.set(id, row);
	}
	const rows: KindBoundary[] = [];
	const dropped: DroppedBoundaryArm[] = [];
	for (const [id, row] of [...byId].sort(([a], [b]) => a - b)) {
		const name = row.kinds.join('|');
		const before = merged(name, 'before', row.before, dropped);
		const after = merged(name, 'after', row.after, dropped);
		if (before.length > 0 || after.length > 0) rows.push({ kind: id, before, after });
	}
	return { rows, dropped };
}
