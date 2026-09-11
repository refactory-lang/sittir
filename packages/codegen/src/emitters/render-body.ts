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
	| TokenSeamNode;
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

export function isExpression(body: Body): boolean {
	return body.length > 0 && opensAsExpression(body[0]!) && opensAsExpression(body[body.length - 1]!);
}

const ADJACENT_EDGE = '\u{FFFE}';

export function edgeChar(body: Body, side: 'starts' | 'ends'): string {
	const node = side === 'starts' ? body[0] : body[body.length - 1];
	if (node === undefined) return '';
	switch (node.kind) {
		case 'text':
			return side === 'starts' ? node.text[0]! : node.text[node.text.length - 1]!;
		case 'slot':
		case 'seam':
		case 'if':
		case 'indent':
		case 'dedent':
		case 'tokenSeam':
			return side === 'starts' ? '{' : '}';
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
		case 'indent':
		case 'dedent':
			return true;
		case 'if': {
			const other = b as IfNode;
			if (a.arms.length !== other.arms.length) return false;
			if (!a.arms.every((arm, i) => arm.test === other.arms[i]!.test && equalBodies(arm.body, other.arms[i]!.body))) {
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
			const arms = node.arms.map((arm) => ({ test: arm.test, body: lift(arm.body) }));
			const fallback = node.fallback === undefined ? undefined : lift(node.fallback);
			const only = arms.length === 1 && fallback === undefined ? arms[0]! : undefined;
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
}

export function escapeBraces(value: string): string {
	return value.replaceAll('{', '{{').replaceAll('}', '}}');
}

export function templateOf(flanks: Flanks | undefined): string {
	if (flanks === undefined) return '{}';
	return `${escapeBraces(flanks.prefix)}{}${escapeBraces(flanks.suffix)}`;
}

export function printRustBody(body: Body, printer: RustBodyPrinter): string[] {
	return [...printStatements(body, printer, 1), '    Ok(())'];
}

function splitLeadingWhitespace(text: string): { readonly run: string; readonly rest: string } {
	let end = 0;
	while (end < text.length && /\s/.test(text[end]!)) end++;
	return { run: text.slice(0, end), rest: text.slice(end) };
}

function printStatements(body: Body, printer: RustBodyPrinter, depth: number): string[] {
	const pad = '    '.repeat(depth);
	const lines: string[] = [];
	let literal = '';
	const flush = (): void => {
		if (literal === '') return;
		lines.push(`${pad}w.text(${rustStringLiteral(literal)})?;`);
		literal = '';
	};
	for (let i = 0; i < body.length; i++) {
		const node = body[i]!;
		const next = body[i + 1];
		let payload = '';
		if ((node.kind === 'indent' || node.kind === 'dedent' || node.kind === 'tokenSeam') && next?.kind === 'text') {
			const split = splitLeadingWhitespace(next.text);
			if (split.run !== '') {
				payload = split.run;
				const rest = split.rest;
				body = [...body.slice(0, i + 1), ...(rest === '' ? [] : [{ kind: 'text', text: rest } as const]), ...body.slice(i + 2)];
			}
		}
		switch (node.kind) {
			case 'text':
				literal += node.text;
				break;
			case 'space':
				literal += ' ';
				break;
			case 'adjacent':
				flush();
				lines.push(`${pad}w.adjacent();`);
				break;
			case 'slot':
				flush();
				lines.push(`${pad}${printer.field(node.name)}.render(w)?;`);
				break;
			case 'seam':
				flush();
				lines.push(`${pad}w.site(node.${printer.field(node.field)}.unwrap_or(0));`);
				break;
			case 'indent':
				flush();
				lines.push(`${pad}w.indent();`);
				lines.push(`${pad}w.seam(${rustStringLiteral(payload === '' ? '\n' : payload)});`);
				break;
			case 'dedent':
				flush();
				lines.push(`${pad}w.dedent();`);
				if (payload !== '') lines.push(`${pad}w.seam(${rustStringLiteral(payload)});`);
				break;
			case 'tokenSeam':
				flush();
				lines.push(`${pad}w.token_seam(${rustStringLiteral(node.text + payload)});`);
				break;
			case 'if':
				flush();
				node.arms.forEach((arm, i) => {
					lines.push(`${pad}${i === 0 ? 'if' : '} else if'} ${printer.field(arm.test)}.is_present() {`);
					lines.push(...printStatements(arm.body, printer, depth + 1));
				});
				if (node.fallback !== undefined) {
					lines.push(`${pad}} else {`);
					lines.push(...printStatements(node.fallback, printer, depth + 1));
				}
				lines.push(`${pad}}`);
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`printRustBody: unhandled node ${(_exhaustive as BodyNode).kind}`);
			}
		}
	}
	flush();
	return lines;
}
