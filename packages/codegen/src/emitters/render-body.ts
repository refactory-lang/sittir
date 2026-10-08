import { NO_KINDS, SEPARATING_KINDS, TIGHT_KINDS, breakingKindsOfText, layoutKindsOfText } from '../compiler/model/layout-kinds.ts';
import { isDepthText, INDENT_TEXT, DEPTH_BREAK } from '../dsl/primitives/spacing.ts';

export function isWhitespaceOnly(text: string): boolean {
	return text.trim() === '';
}

export interface TextNode {
	readonly kind: 'text';
	readonly text: string;
}

export interface SlotNode {
	readonly kind: 'slot';
	readonly name: string;
}

export interface SpaceNode {
	readonly kind: 'space';
}

export interface AdjacentNode {
	readonly kind: 'adjacent';
}

export interface SeamNode {
	readonly kind: 'seam';
	readonly field: string;
}

export interface WordSeamNode {
	readonly kind: 'wordSeam';
}

export interface IndentNode {
	readonly kind: 'indent';
}

export interface DedentNode {
	readonly kind: 'dedent';
}

export interface TokenSeamNode {
	readonly kind: 'tokenSeam';
	readonly text: string;
}

export interface IfArm {
	readonly test: string;
	/** When present, the arm also asks that the slot's value be one of these
	 *  kinds (a supertype names its members): a literal that only some arms
	 *  of a choice put beside the slot is printed under such a gate. */
	readonly kinds?: readonly string[];
	readonly body: Body;
}

export interface IfNode {
	readonly kind: 'if';
	readonly arms: readonly IfArm[];
	readonly fallback: Body | undefined;
}

export type BodyNode =
	| TextNode
	| SlotNode
	| SpaceNode
	| AdjacentNode
	| SeamNode
	| IfNode
	| IndentNode
	| DedentNode
	| TokenSeamNode
	| WordSeamNode;
export type Body = readonly BodyNode[];

export const EMPTY: Body = [];
export const SPACE: Body = [{ kind: 'space' }];
export const ADJACENT: Body = [{ kind: 'adjacent' }];
export const INDENT: Body = [{ kind: 'indent' }];
export const DEDENT: Body = [{ kind: 'dedent' }];

export function text(value: string): Body {
	return value === '' ? EMPTY : [{ kind: 'text', text: value }];
}

export function tokenSeam(text: string): Body {
	return [{ kind: 'tokenSeam', text }];
}

export function literalBody(value: string): Body {
	if (isDepthText(value)) return value === INDENT_TEXT ? INDENT : DEDENT;
	return isWhitespaceOnly(value) ? tokenSeam(value) : text(value);
}

export function slot(name: string): Body {
	return [{ kind: 'slot', name }];
}

export function seam(field: string): Body {
	return [{ kind: 'seam', field }];
}

export function gate(test: string, body: Body): Body {
	return [{ kind: 'if', arms: [{ test, body }], fallback: undefined }];
}

export function branches(arms: readonly IfArm[], fallback: Body | undefined): Body {
	return [{ kind: 'if', arms, fallback }];
}

function isBareSlotGate(node: BodyNode): node is IfNode & { readonly arms: readonly [IfArm] } {
	if (node.kind !== 'if' || node.fallback !== undefined || node.arms.length !== 1) return false;
	const arm = node.arms[0]!;
	const only = arm.body.length === 1 ? arm.body[0]! : undefined;
	return arm.kinds === undefined && only?.kind === 'slot' && only.name === arm.test;
}

export const WORD_SEAM: Body = [{ kind: 'wordSeam' }];

export function gateKeywordSlotSeams(body: Body, keywordKindsOf: (slot: string) => readonly string[] | undefined): Body {
	const out: BodyNode[] = [];
	for (let i = 0; i < body.length; i++) {
		const node = body[i]!;
		if (node.kind === 'if') {
			out.push({
				...node,
				arms: node.arms.map((arm) => ({ ...arm, body: gateKeywordSlotSeams(arm.body, keywordKindsOf) })),
				fallback: node.fallback === undefined ? undefined : gateKeywordSlotSeams(node.fallback, keywordKindsOf)
			});
			continue;
		}
		const prev = out[out.length - 1];
		const next = body[i + 1];
		const slotName =
			node.kind !== 'seam'
				? undefined
				: prev?.kind === 'slot' && node.field === `${prev.name}_after`
					? prev.name
					: next?.kind === 'slot' && node.field === `${next.name}_before`
						? next.name
						: undefined;
		const kinds = slotName === undefined ? undefined : keywordKindsOf(slotName);
		if (slotName === undefined || kinds === undefined) {
			out.push(node);
			continue;
		}
		out.push(...branches([{ test: slotName, kinds, body: WORD_SEAM }], [node]));
	}
	return out;
}

export function gateOptionalSlotSeams(body: Body, seamNamesOf: (slot: string) => readonly string[]): Body {
	const out: BodyNode[] = [];
	for (let i = 0; i < body.length; i++) {
		const node = body[i]!;
		if (node.kind === 'if') {
			const arms = node.arms.map((arm) => ({ ...arm, body: gateOptionalSlotSeams(arm.body, seamNamesOf) }));
			const fallback = node.fallback === undefined ? undefined : gateOptionalSlotSeams(node.fallback, seamNamesOf);
			const folded: IfNode = { ...node, arms, fallback };
			if (isBareSlotGate(folded)) {
				const test = folded.arms[0].test;
				const prev = out[out.length - 1];
				const next = body[i + 1];
				const names = seamNamesOf(test);
				const before = prev?.kind === 'seam' && names.some((name) => prev.field === `${name}_before`) ? prev : undefined;
				const after = next?.kind === 'seam' && names.some((name) => next.field === `${name}_after`) ? next : undefined;
				if (before !== undefined || after !== undefined) {
					if (before !== undefined) out.pop();
					if (after !== undefined) i++;
					out.push({
						...folded,
						arms: [{ ...folded.arms[0], body: [...(before === undefined ? [] : [before]), ...folded.arms[0].body, ...(after === undefined ? [] : [after])] }]
					});
					continue;
				}
			}
			out.push(folded);
			continue;
		}
		out.push(node);
	}
	return out;
}

export function concat(...bodies: readonly Body[]): Body {
	const out: BodyNode[] = [];
	for (const body of bodies) {
		for (const node of body) {
			const prev = out[out.length - 1];
			if (prev?.kind === 'text' && node.kind === 'text') {
				out[out.length - 1] = { kind: 'text', text: prev.text + node.text };
				continue;
			}
			out.push(node);
		}
	}
	return out;
}

export function isPlainText(body: Body): boolean {
	return body.every((node) => node.kind === 'text' || node.kind === 'space' || node.kind === 'adjacent');
}

function opensAsExpression(node: BodyNode): boolean {
	return node.kind === 'slot' || node.kind === 'seam' || node.kind === 'indent' || node.kind === 'dedent' || node.kind === 'tokenSeam';
}

export function opensAsTag(node: BodyNode): boolean {
	return opensAsExpression(node) || node.kind === 'if';
}

export function adjacentInto(body: Body): Body {
	const out: BodyNode[] = [];
	for (const node of body) {
		const previous = out.at(-1);
		const seamed = previous?.kind === 'seam' || previous?.kind === 'tokenSeam';
		if (node.kind === 'if') {
			out.push({
				...node,
				arms: node.arms.map((arm) => ({ ...arm, body: adjacentInto(arm.body) })),
				fallback: node.fallback === undefined ? undefined : adjacentInto(node.fallback)
			});
		} else if (node.kind === 'slot' || node.kind === 'text') {
			out.push(...(seamed ? [node] : [{ kind: 'adjacent' } as const, node]));
		} else {
			out.push(node);
		}
	}
	return out;
}

export function isExpression(body: Body): boolean {
	return body.length > 0 && opensAsExpression(body[0]!) && opensAsExpression(body[body.length - 1]!);
}

const ADJACENT_EDGE = '\u{FFFE}';

export const DYNAMIC_EDGE = '\u{FFFD}';

export const MARKER_EDGE = '\u{FFFC}';

export function edgeChar(body: Body, side: 'starts' | 'ends'): string {
	const node = side === 'starts' ? body[0] : body[body.length - 1];
	if (node === undefined) return '';
	switch (node.kind) {
		case 'text':
			return side === 'starts' ? node.text[0]! : node.text[node.text.length - 1]!;
		case 'slot':
		case 'if':
			return DYNAMIC_EDGE;
		case 'seam':
		case 'wordSeam':
		case 'indent':
		case 'dedent':
		case 'tokenSeam':
			return MARKER_EDGE;
		case 'space':
			return ' ';
		case 'adjacent':
			return ADJACENT_EDGE;
		default: {
			const _exhaustive: never = node;
			throw new Error(`edgeChar: unhandled node ${(_exhaustive as BodyNode).kind}`);
		}
	}
}

export function equalBodies(a: Body, b: Body): boolean {
	return a.length === b.length && a.every((node, i) => equalNodes(node, b[i]!));
}

export function equalNodes(a: BodyNode, b: BodyNode): boolean {
	if (a.kind !== b.kind) return false;
	switch (a.kind) {
		case 'text':
			return a.text === (b as TextNode).text;
		case 'tokenSeam':
			return a.text === (b as TokenSeamNode).text;
		case 'slot':
			return a.name === (b as SlotNode).name;
		case 'seam':
			return a.field === (b as SeamNode).field;
		case 'space':
		case 'adjacent':
		case 'wordSeam':
		case 'indent':
		case 'dedent':
			return true;
		case 'if': {
			const other = b as IfNode;
			if (a.arms.length !== other.arms.length) return false;
			const sameKinds = (x: IfArm, y: IfArm): boolean =>
				x.kinds === undefined || y.kinds === undefined
					? x.kinds === y.kinds
					: x.kinds.length === y.kinds.length && x.kinds.every((k, i) => k === y.kinds![i]);
			if (
				!a.arms.every(
					(arm, i) =>
						arm.test === other.arms[i]!.test && sameKinds(arm, other.arms[i]!) && equalBodies(arm.body, other.arms[i]!.body)
				)
			) {
				return false;
			}
			if (a.fallback === undefined || other.fallback === undefined) return a.fallback === other.fallback;
			return equalBodies(a.fallback, other.fallback);
		}
		default: {
			const _exhaustive: never = a;
			throw new Error(`equalNodes: unhandled node ${(_exhaustive as BodyNode).kind}`);
		}
	}
}

export function refersTo(body: Body, name: string): boolean {
	return body.some((node) => {
		switch (node.kind) {
			case 'slot':
				return node.name === name;
			case 'if':
				return node.arms.some((arm) => refersTo(arm.body, name)) || (node.fallback !== undefined && refersTo(node.fallback, name));
			default:
				return false;
		}
	});
}

export function writesText(body: Body): boolean {
	return body.some((node) => {
		switch (node.kind) {
			case 'text':
				return !isWhitespaceOnly(node.text);
			case 'if':
				return node.arms.some((arm) => writesText(arm.body)) || (node.fallback !== undefined && writesText(node.fallback));
			default:
				return false;
		}
	});
}

export function writesTokenSeam(body: Body, text: string): boolean {
	return body.some((node) => {
		switch (node.kind) {
			case 'tokenSeam':
				return node.text === text;
			case 'if':
				return node.arms.some((arm) => writesTokenSeam(arm.body, text)) || (node.fallback !== undefined && writesTokenSeam(node.fallback, text));
			default:
				return false;
		}
	});
}

export function mentions(body: Body, name: string): boolean {
	const word = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
	return body.some((node) => {
		switch (node.kind) {
			case 'text':
				return word.test(node.text);
			case 'slot':
				return node.name === name;
			case 'if':
				return (
					node.arms.some((arm) => arm.test === name || mentions(arm.body, name)) ||
					(node.fallback !== undefined && mentions(node.fallback, name))
				);
			default:
				return false;
		}
	});
}

const EXPRESSION_OVERHEAD = '{{  }}'.length;
const IF_OPEN = '{% if  | isPresent %}'.length;
const ELIF_OPEN = '{% elif  | isPresent %}'.length;
const ELSE_OPEN = '{% else %}'.length;
const IF_CLOSE = '{% endif %}'.length;

export function weight(body: Body): number {
	let total = 0;
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				total += node.text.length;
				break;
			case 'slot':
				total += node.name.length + EXPRESSION_OVERHEAD;
				break;
			case 'seam':
				total += node.field.length + EXPRESSION_OVERHEAD;
				break;
			case 'space':
			case 'adjacent':
			case 'wordSeam':
				total += 1;
				break;
			case 'indent':
				total += 2;
				break;
			case 'dedent':
				total += 1;
				break;
			case 'tokenSeam':
				total += node.text.length + 1;
				break;
			case 'if':
				node.arms.forEach((arm, i) => {
					total += (i === 0 ? IF_OPEN : ELIF_OPEN) + arm.test.length + weight(arm.body);
				});
				if (node.fallback !== undefined) total += ELSE_OPEN + weight(node.fallback);
				total += IF_CLOSE;
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`weight: unhandled node ${(_exhaustive as BodyNode).kind}`);
			}
		}
	}
	return total;
}

export interface BodyReferences {
	readonly tests: readonly string[];
	readonly slots: readonly string[];
	readonly seams: readonly string[];
}

export function references(body: Body): BodyReferences {
	const tests: string[] = [];
	const slots: string[] = [];
	const seams: string[] = [];
	const walk = (nodes: Body): void => {
		for (const node of nodes) {
			switch (node.kind) {
				case 'slot':
					slots.push(node.name);
					break;
				case 'seam':
					seams.push(node.field);
					break;
				case 'if':
					for (const arm of node.arms) {
						tests.push(arm.test);
						walk(arm.body);
					}
					if (node.fallback !== undefined) walk(node.fallback);
					break;
				default:
					break;
			}
		}
	};
	walk(body);
	return { tests, slots, seams };
}

export function slotMultiplicity(body: Body): ReadonlyMap<string, number> {
	const counts = new Map<string, number>();
	for (const node of body) {
		if (node.kind === 'slot') {
			counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
			continue;
		}
		if (node.kind !== 'if') continue;
		const alternatives = [...node.arms.map((arm) => arm.body), ...(node.fallback === undefined ? [] : [node.fallback])];
		const widest = new Map<string, number>();
		for (const alternative of alternatives) {
			for (const [name, count] of slotMultiplicity(alternative)) widest.set(name, Math.max(widest.get(name) ?? 0, count));
		}
		for (const [name, count] of widest) counts.set(name, (counts.get(name) ?? 0) + count);
	}
	return counts;
}

export function duplicateSlots(body: Body): string[] {
	return [...slotMultiplicity(body)].filter(([, count]) => count > 1).map(([name]) => name);
}

export function rustStringLiteral(value: string): string {
	let out = '"';
	for (const ch of value) {
		const code = ch.codePointAt(0)!;
		if (ch === '"' || ch === '\\') out += `\\${ch}`;
		else if (ch === '\n') out += '\\n';
		else if (ch === '\t') out += '\\t';
		else if (ch === '\r') out += '\\r';
		else if (code < 0x20 || code === 0x7f || code >= 0xfdd0) out += `\\u{${code.toString(16).toUpperCase()}}`;
		else out += ch;
	}
	return out + '"';
}

export type ViewKind = 'single' | 'optional' | 'list' | 'text';

export interface Flanks {
	readonly prefix: string;
	readonly suffix: string;
}

export interface LiftedGates {
	readonly body: Body;
	readonly flanks: ReadonlyMap<string, Flanks>;
}

function literalOf(nodes: Body): string | undefined {
	let out = '';
	for (const node of nodes) {
		switch (node.kind) {
			case 'text':
				out += node.text;
				break;
			case 'space':
				out += ' ';
				break;
			default:
				return undefined;
		}
	}
	return out;
}

export function liftGates(body: Body, viewOf: (name: string) => ViewKind): LiftedGates {
	const flanks = new Map<string, Flanks>();
	const lift = (nodes: Body): Body => {
		const out: Body[] = [];
		for (const node of nodes) {
			if (node.kind !== 'if') {
				out.push([node]);
				continue;
			}
			const arms = node.arms.map((arm) => ({ ...arm, body: lift(arm.body) }));
			const fallback = node.fallback === undefined ? undefined : lift(node.fallback);
			const only = arms.length === 1 && fallback === undefined && arms[0]!.kinds === undefined ? arms[0]! : undefined;
			const at = only?.body.findIndex((n) => n.kind === 'slot' && n.name === only.test) ?? -1;
			const prefix = only === undefined || at === -1 ? undefined : literalOf(only.body.slice(0, at));
			const suffix = only === undefined || at === -1 ? undefined : literalOf(only.body.slice(at + 1));
			const kind = only === undefined ? 'text' : viewOf(only.test);
			if (only === undefined || prefix === undefined || suffix === undefined || kind === 'text') {
				out.push(branches(arms, fallback));
				continue;
			}
			if (kind === 'single') {
				out.push(concat(text(prefix), slot(only.test), text(suffix)));
				continue;
			}
			if (prefix !== '' || suffix !== '') {
				const prior = flanks.get(only.test);
				if (prior !== undefined && (prior.prefix !== prefix || prior.suffix !== suffix)) {
					throw new Error(
						`liftGates: slot '${only.test}' is gated with two different flanks (${JSON.stringify(prior)} and ${JSON.stringify({ prefix, suffix })})`
					);
				}
				flanks.set(only.test, { prefix, suffix });
			}
			out.push(slot(only.test));
		}
		return concat(...out);
	};
	return { body: lift(body), flanks };
}

export interface RustBodyPrinter {
	readonly field: (name: string) => string;
	/** The kind id and side of a seam that is the kind's own edge, written from the transport's base edges. */
	readonly edge?: (name: string) => { readonly kindId: number; readonly side: 'before' | 'after' } | undefined;
	/** The `options::SITE_*` constant of the seam site a body names. */
	readonly site: (name: string) => string;
	/** The Rust slice literal naming these kinds' ids, for a kind-gated arm. */
	readonly kinds: (names: readonly string[]) => string;
	readonly innerGap?: (name: string) => boolean;
	readonly optional?: (name: string) => boolean;
}

export function escapeBraces(value: string): string {
	return value.replaceAll('{', '{{').replaceAll('}', '}}');
}

export function templateOf(flanks: Flanks | undefined): string {
	if (flanks === undefined) return '{}';
	return `${escapeBraces(flanks.prefix)}{}${escapeBraces(flanks.suffix)}`;
}

const SEAM_NODES: ReadonlySet<BodyNode['kind']> = new Set(['seam', 'adjacent', 'wordSeam', 'tokenSeam']);

export function doubledFlanks(body: Body, path = 'body'): string[] {
	const found: string[] = [];
	let run: BodyNode[] = [];
	const close = (at: number): void => {
		if (run.length > 1 && run.some((n) => n.kind === 'adjacent' || n.kind === 'wordSeam')) found.push(`${path}[${at - run.length}..${at}] ${run.map((n) => n.kind).join('+')}`);
		run = [];
	};
	body.forEach((node, i) => {
		if (SEAM_NODES.has(node.kind)) {
			run.push(node);
			return;
		}
		close(i);
		if (node.kind === 'if') {
			node.arms.forEach((arm, a) => found.push(...doubledFlanks(arm.body, `${path}.if[${i}].arm${a}`)));
			if (node.fallback !== undefined) found.push(...doubledFlanks(node.fallback, `${path}.if[${i}].else`));
		}
	});
	close(body.length);
	return found;
}

export function printRustBody(body: Body, printer: RustBodyPrinter): string[] {
	return [...printStatements(body, printer, 1), '    Ok(())'];
}

function splitLeadingWhitespace(text: string): { readonly run: string; readonly rest: string } {
	let end = 0;
	while (end < text.length && /\s/.test(text[end]!)) end++;
	return { run: text.slice(0, end), rest: text.slice(end) };
}

function printStatements(
	body: Body,
	printer: RustBodyPrinter,
	depth: number,
	seatedGaps: ReadonlySet<string> = new Set()
): string[] {
	const pad = '    '.repeat(depth);
	const lines: string[] = [];
	const seated = new Set(seatedGaps);
	const seatGap = (name: string): void => {
		if (seated.has(name) || printer.innerGap?.(name) !== true) return;
		seated.add(name);
		lines.push(
			`${pad}::sittir_core::trivia::render_inner(node.layout.trivia(), ${rustStringLiteral(name)}, w)?;`
		);
	};
	let literal = '';
	const flush = (): void => {
		if (literal === '') return;
		lines.push(`${pad}w.text(${rustStringLiteral(literal)})?;`);
		literal = '';
	};
	let pendingText: string | undefined;
	let hasPendingText = false;
	for (let i = 0; i < body.length; i++) {
		const node = body[i]!;
		const next = body[i + 1];
		let payload = '';
		if ((node.kind === 'indent' || node.kind === 'dedent' || node.kind === 'tokenSeam') && next?.kind === 'text') {
			const split = splitLeadingWhitespace(next.text);
			if (split.run !== '') {
				payload = split.run;
				pendingText = split.rest;
				hasPendingText = true;
			}
		}
		switch (node.kind) {
			case 'text': {
				const text = hasPendingText ? pendingText! : node.text;
				hasPendingText = false;
				literal += text;
				break;
			}
			case 'space':
				literal += ' ';
				break;
			case 'adjacent': {
				flush();
				const left = body[i - 1];
				if (left?.kind === 'slot' && printer.optional?.(left.name) === true) {
					lines.push(`${pad}if ${printer.field(left.name)}.is_present() {`);
					lines.push(`${pad}    w.seam(${TIGHT_KINDS});`);
					lines.push(`${pad}}`);
				} else {
					lines.push(`${pad}w.seam(${TIGHT_KINDS});`);
				}
				break;
			}
			case 'slot':
				flush();
				seatGap(node.name);
				lines.push(`${pad}${printer.field(node.name)}.render(w)?;`);
				break;
			case 'seam': {
				flush();
				const edge = printer.edge?.(node.field);
				if (edge !== undefined) {
					const side = edge.side === 'before' ? 'Before' : 'After';
					lines.push(`${pad}w.edge(::sittir_core::types::KindId(${edge.kindId}), ::sittir_core::options::Side::${side}, node.layout.edges().${edge.side});`);
				} else {
					lines.push(`${pad}w.site_at(${printer.site(node.field)});`);
				}
				break;
			}
			case 'indent':
				flush();
				lines.push(`${pad}w.indent();`);
				lines.push(`${pad}w.seam(${breakingKindsOfText(payload === '' ? DEPTH_BREAK : payload)});`);
				break;
			case 'dedent':
				flush();
				if (payload !== '') {
					lines.push(`${pad}w.dedent(${layoutKindsOfText(payload)});`);
				} else {
					lines.push(`${pad}w.dedent(${NO_KINDS});`);
				}
				break;
			case 'tokenSeam':
				flush();
				lines.push(`${pad}w.seam(${layoutKindsOfText(node.text + payload)});`);
				break;
			case 'wordSeam':
				flush();
				lines.push(`${pad}w.seam(${SEPARATING_KINDS});`);
				break;
			case 'if': {
				flush();
				for (const arm of node.arms) {
					if (arm.kinds === undefined) seatGap(arm.test);
				}
				const gatedGaps = new Set(seated);
				node.arms.forEach((arm, i) => {
					const test =
						arm.kinds === undefined
							? `${printer.field(arm.test)}.is_present()`
							: `${printer.field(arm.test)}.kind_in(&*w, ${printer.kinds(arm.kinds)})`;
					lines.push(`${pad}${i === 0 ? 'if' : '} else if'} ${test} {`);
					lines.push(...printStatements(arm.body, printer, depth + 1, gatedGaps));
				});
				if (node.fallback !== undefined) {
					lines.push(`${pad}} else {`);
					lines.push(...printStatements(node.fallback, printer, depth + 1, gatedGaps));
				}
				lines.push(`${pad}}`);
				break;
			}
			default: {
				const _exhaustive: never = node;
				throw new Error(`printRustBody: unhandled node ${(_exhaustive as BodyNode).kind}`);
			}
		}
	}
	flush();
	return lines;
}
