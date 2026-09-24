import { loadLanguageForGrammar } from '../validate/common.ts';

export interface PatternNode {
	kind: string | null;
	readonly children: PatternNode[];
	readonly captures: string[];
	readonly predicates: string[][];
	readonly fieldLiterals: Record<string, string>;
	field: string | null;
	text: string | null;
	quantifier: '' | '?' | '*' | '+';
}

const COMMENT_OR_STRING = /"(?:[^"\\]|\\.)*"|;[^\n]*/g;

const TOKENS = /"(?:[^"\\]|\\.)*"|\(|\)|\[|\]|@[\w.]+|#[\w?!]+|[\w.]+:|[\w.]+|[*+?!.]/g;

function node(kind: string | null): PatternNode {
	return {
		kind,
		children: [],
		captures: [],
		predicates: [],
		fieldLiterals: {},
		field: null,
		text: null,
		quantifier: ''
	};
}

export function parseQuery(text: string): PatternNode[] {
	const stripped = text.replace(COMMENT_OR_STRING, (m) => (m.startsWith('"') ? m : ''));
	const tokens = stripped.match(TOKENS) ?? [];
	let i = 0;
	const top: PatternNode[] = [];
	const readNode = (): PatternNode => {
		if (tokens[i] !== '(') throw new Error(`query parse: expected '(' at token ${i}`);
		i += 1;
		const n = node(null);
		let pending: string | null = null;
		let last: PatternNode | null = null;
		while (tokens[i] !== ')') {
			const t = tokens[i];
			if (t === undefined) throw new Error('query parse: unterminated pattern');
			if (t === '(') {
				if (n.kind === null) n.kind = '<group>';
				const child = readNode();
				child.field = pending;
				pending = null;
				n.children.push(child);
				last = child;
				continue;
			}
			if (t.startsWith('#')) {
				let j = i + 1;
				while (tokens[j] !== ')') {
					if (tokens[j] === undefined) throw new Error('query parse: unterminated predicate');
					j += 1;
				}
				n.predicates.push(tokens.slice(i, j));
				i = j;
				continue;
			}
			if (t.startsWith('@')) {
				(last ?? n).captures.push(t.slice(1));
				i += 1;
				continue;
			}
			if (t.startsWith('"')) {
				const literal = t.slice(1, -1);
				if (pending !== null) n.fieldLiterals[pending] = literal;
				const token = node('<token>');
				token.field = pending;
				token.text = literal;
				n.children.push(token);
				pending = null;
				last = token;
				i += 1;
				continue;
			}
			if (t === '[') {
				i += 1;
				while (tokens[i] !== ']') {
					if (tokens[i] === undefined) throw new Error('query parse: unterminated alternation');
					if (tokens[i] === '(') {
						n.children.push(readNode());
						continue;
					}
					i += 1;
				}
				last = n;
				i += 1;
				continue;
			}
			if (t.endsWith(':')) {
				pending = t.slice(0, -1);
				i += 1;
				continue;
			}
			if (t === '*' || t === '+' || t === '?') {
				if (last !== null) last.quantifier = t;
				i += 1;
				continue;
			}
			if (t === '!' || t === '.') {
				i += 1;
				continue;
			}
			if (n.kind === null) n.kind = t;
			else {
				const child = node(t);
				child.field = pending;
				pending = null;
				n.children.push(child);
				last = child;
			}
			i += 1;
		}
		i += 1;
		return n;
	};
	while (i < tokens.length) {
		if (tokens[i] === '(') {
			const n = readNode();
			top.push(n);
			while (i < tokens.length && (tokens[i] ?? '').startsWith('@')) {
				n.captures.push((tokens[i] ?? '').slice(1));
				i += 1;
			}
		} else i += 1;
	}
	return top;
}

export function* walk(n: PatternNode): Generator<PatternNode> {
	yield n;
	for (const c of n.children) yield* walk(c);
}

export function topClaim(n: PatternNode): string | undefined {
	return n.captures.find((c) => c.includes('.'));
}

export interface CompiledQuery {
	readonly patterns: number;
	readonly captureNames: readonly string[];
}

export async function compileQuery(grammar: string, text: string): Promise<CompiledQuery> {
	const { lang } = await loadLanguageForGrammar(grammar);
	const { Query } = await import('web-tree-sitter');
	const query = new Query(lang, text);
	try {
		return { patterns: query.captureQuantifiers.length, captureNames: [...query.captureNames] };
	} finally {
		query.delete();
	}
}
