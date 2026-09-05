export const ADJACENT_MARK = '\u{FFFE}';

export interface TextNode {
	readonly kind: 'text';
	readonly text: string;
}

export interface WhitespaceNode {
	readonly kind: 'whitespace';
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

export interface IfArm {
	readonly test: string;
	readonly body: Body;
}

export interface IfNode {
	readonly kind: 'if';
	readonly arms: readonly IfArm[];
	readonly fallback: Body | undefined;
}

export interface IndentNode {
	readonly kind: 'indent';
	readonly body: Body;
}

export type BodyNode = TextNode | WhitespaceNode | SlotNode | SpaceNode | AdjacentNode | IfNode | IndentNode;
export type Body = readonly BodyNode[];

export const EMPTY: Body = [];
export const SPACE: Body = [{ kind: 'space' }];
export const ADJACENT: Body = [{ kind: 'adjacent' }];

export function text(value: string): Body {
	return value === '' ? EMPTY : [{ kind: 'text', text: value }];
}

export function whitespace(value: string): Body {
	return [{ kind: 'whitespace', text: value }];
}

export function slot(name: string): Body {
	return [{ kind: 'slot', name }];
}

export function gate(test: string, body: Body): Body {
	return [{ kind: 'if', arms: [{ test, body }], fallback: undefined }];
}

export function branches(arms: readonly IfArm[], fallback: Body | undefined): Body {
	return [{ kind: 'if', arms, fallback }];
}

export function indented(body: Body): Body {
	return [{ kind: 'indent', body }];
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
	return node.kind === 'slot' || node.kind === 'whitespace';
}

export function opensAsTag(node: BodyNode): boolean {
	return opensAsExpression(node) || node.kind === 'if' || node.kind === 'indent';
}

export function isExpression(body: Body): boolean {
	return body.length > 0 && opensAsExpression(body[0]!) && opensAsExpression(body[body.length - 1]!);
}

export function edgeChar(body: Body, side: 'starts' | 'ends'): string {
	const node = side === 'starts' ? body[0] : body[body.length - 1];
	if (node === undefined) return '';
	switch (node.kind) {
		case 'text':
			return side === 'starts' ? node.text[0]! : node.text[node.text.length - 1]!;
		case 'whitespace':
		case 'slot':
		case 'if':
		case 'indent':
			return side === 'starts' ? '{' : '}';
		case 'space':
			return ' ';
		case 'adjacent':
			return ADJACENT_MARK;
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
		case 'whitespace':
			return a.text === (b as TextNode | WhitespaceNode).text;
		case 'slot':
			return a.name === (b as SlotNode).name;
		case 'space':
		case 'adjacent':
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
		case 'indent':
			return equalBodies(a.body, (b as IndentNode).body);
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
			case 'indent':
				return refersTo(node.body, name);
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
			case 'indent':
				return mentions(node.body, name);
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
const INDENT_OPEN = '{% filter indent(2, true) %}'.length;
const INDENT_CLOSE = '{% endfilter %}'.length;

export function weight(body: Body): number {
	let total = 0;
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				total += node.text.length;
				break;
			case 'whitespace':
				total += JSON.stringify(node.text).length + EXPRESSION_OVERHEAD;
				break;
			case 'slot':
				total += node.name.length + EXPRESSION_OVERHEAD;
				break;
			case 'space':
			case 'adjacent':
				total += 1;
				break;
			case 'if':
				node.arms.forEach((arm, i) => {
					total += (i === 0 ? IF_OPEN : ELIF_OPEN) + arm.test.length + weight(arm.body);
				});
				if (node.fallback !== undefined) total += ELSE_OPEN + weight(node.fallback);
				total += IF_CLOSE;
				break;
			case 'indent':
				total += INDENT_OPEN + weight(node.body) + INDENT_CLOSE;
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`weight: unhandled node ${(_exhaustive as BodyNode).kind}`);
			}
		}
	}
	return total;
}

export function separateBraceFromTag(body: string): string {
	const statements = body.replace(/(\{+)([%#])/g, (_m, braces: string, sigil: string) =>
		braces.length === 1 ? `{${sigil}` : `${braces.slice(0, -1)} {${sigil}-`
	);
	return statements.replace(/(\{{3,})-?/g, (_m, braces: string) => `${braces.slice(0, -2)} {{-`);
}

function printRaw(body: Body): string {
	let out = '';
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				out += node.text;
				break;
			case 'whitespace':
				out += `{{ ${JSON.stringify(node.text)} }}`;
				break;
			case 'slot':
				out += `{{ ${node.name} }}`;
				break;
			case 'space':
				out += ' ';
				break;
			case 'adjacent':
				out += ADJACENT_MARK;
				break;
			case 'if':
				node.arms.forEach((arm, i) => {
					out += `${i === 0 ? '{% if' : '{% elif'} ${arm.test} | isPresent %}${printRaw(arm.body)}`;
				});
				if (node.fallback !== undefined) out += `{% else %}${printRaw(node.fallback)}`;
				out += '{% endif %}';
				break;
			case 'indent':
				out += `{% filter indent(2, true) %}${printRaw(node.body)}{% endfilter %}`;
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`printJinja: unhandled node ${(_exhaustive as BodyNode).kind}`);
			}
		}
	}
	return out;
}

export function printJinja(body: Body): string {
	return separateBraceFromTag(printRaw(body));
}
