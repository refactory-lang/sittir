export interface SCMCapture {
	kindName: string;
	captureName: string;
}

const enum TokenKind {
	LParen,
	RParen,
	LBracket,
	RBracket,
	Capture,
	Identifier,
	StringLiteral,
	FieldColon,
	Quantifier,
	Predicate
}

interface Token {
	kind: TokenKind;
	value: string;
}

function tokenise(source: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const len = source.length;

	while (i < len) {
		const ch = source[i]!;

		if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
			i++;
			continue;
		}

		if (ch === ';') {
			while (i < len && source[i] !== '\n') i++;
			continue;
		}

		if (ch === '(') {
			if (i + 1 < len && source[i + 1] === '#') {
				const start = i;
				let depth = 1;
				i++;
				while (i < len && depth > 0) {
					if (source[i] === '(') depth++;
					else if (source[i] === ')') depth--;
					i++;
				}
				tokens.push({ kind: TokenKind.Predicate, value: source.slice(start, i) });
				continue;
			}
			tokens.push({ kind: TokenKind.LParen, value: '(' });
			i++;
			continue;
		}
		if (ch === ')') {
			tokens.push({ kind: TokenKind.RParen, value: ')' });
			i++;
			continue;
		}
		if (ch === '[') {
			tokens.push({ kind: TokenKind.LBracket, value: '[' });
			i++;
			continue;
		}
		if (ch === ']') {
			tokens.push({ kind: TokenKind.RBracket, value: ']' });
			i++;
			continue;
		}

		if (ch === '?' || ch === '*' || ch === '+') {
			tokens.push({ kind: TokenKind.Quantifier, value: ch });
			i++;
			continue;
		}

		if (ch === '@') {
			i++;
			const start = i;
			while (i < len && /[\w.]/.test(source[i]!)) i++;
			tokens.push({ kind: TokenKind.Capture, value: source.slice(start, i) });
			continue;
		}

		if (ch === '"') {
			const start = i;
			i++;
			while (i < len && source[i] !== '"') {
				if (source[i] === '\\') i++;
				i++;
			}
			if (i < len) i++;
			tokens.push({ kind: TokenKind.StringLiteral, value: source.slice(start, i) });
			continue;
		}

		if (/[\w_]/.test(ch)) {
			const start = i;
			while (i < len && /[\w_.]/.test(source[i]!)) i++;
			const word = source.slice(start, i);

			if (i < len && source[i] === ':') {
				i++;
				tokens.push({ kind: TokenKind.FieldColon, value: word });
				continue;
			}

			tokens.push({ kind: TokenKind.Identifier, value: word });
			continue;
		}

		i++;
	}

	return tokens;
}

class TokenCursor {
	private readonly tokens: Token[];
	pos: number;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.pos = 0;
	}

	get done(): boolean {
		return this.pos >= this.tokens.length;
	}

	peek(): Token | undefined {
		return this.tokens[this.pos];
	}

	advance(): Token | undefined {
		return this.tokens[this.pos++];
	}

	is(kind: TokenKind): boolean {
		const t = this.tokens[this.pos];
		return t !== undefined && t.kind === kind;
	}

	eat(kind: TokenKind): boolean {
		const t = this.tokens[this.pos];
		if (t !== undefined && t.kind === kind) {
			this.pos++;
			return true;
		}
		return false;
	}
}

export function parseSCMQuery(source: string): SCMCapture[] {
	const c = new TokenCursor(tokenise(source));
	const captures: SCMCapture[] = [];

	function parsePattern(): string | undefined {
		const first = c.peek();
		if (!first || first.kind !== TokenKind.Identifier) {
			skipToClose();
			return undefined;
		}
		const kindName = first.value;
		c.advance();

		while (!c.done) {
			const tok = c.peek();
			if (!tok || tok.kind === TokenKind.RParen) break;

			if (tok.kind === TokenKind.LParen) {
				c.advance();
				const childKind = parsePattern();
				c.eat(TokenKind.RParen);
				const cap = c.peek();
				if (cap && cap.kind === TokenKind.Capture) {
					if (childKind) {
						captures.push({ kindName: childKind, captureName: cap.value });
					}
					c.advance();
				}
				continue;
			}

			if (tok.kind === TokenKind.LBracket) {
				skipBracketGroup();
				continue;
			}

			c.advance();
		}

		return kindName;
	}

	function skipBracketGroup(): void {
		c.advance();
		let depth = 1;
		while (!c.done && depth > 0) {
			const tok = c.advance();
			if (!tok) break;
			if (tok.kind === TokenKind.LBracket) depth++;
			else if (tok.kind === TokenKind.RBracket) depth--;
		}
	}

	function skipToClose(): void {
		let depth = 1;
		while (!c.done && depth > 0) {
			const tok = c.advance();
			if (!tok) break;
			if (tok.kind === TokenKind.LParen) depth++;
			else if (tok.kind === TokenKind.RParen) depth--;
		}
	}

	function tryCapture(): string | undefined {
		const tok = c.peek();
		if (tok && tok.kind === TokenKind.Capture) {
			c.advance();
			return tok.value;
		}
		return undefined;
	}

	while (!c.done) {
		const tok = c.peek();
		if (!tok) break;

		if (tok.kind === TokenKind.LParen) {
			c.advance();

			if (c.is(TokenKind.LParen)) {
				c.advance();
				const kindName = parsePattern();
				c.eat(TokenKind.RParen);

				const capName = tryCapture();
				if (capName && kindName) {
					captures.push({ kindName, captureName: capName });
				}

				while (!c.done && !c.is(TokenKind.RParen)) {
					if (c.is(TokenKind.LParen)) {
						c.advance();
						skipToClose();
					} else {
						c.advance();
					}
				}
				c.eat(TokenKind.RParen);
				continue;
			}

			if (c.is(TokenKind.LBracket)) {
				c.advance();
				const bracketKinds: string[] = [];

				while (!c.done && !c.is(TokenKind.RBracket)) {
					if (c.is(TokenKind.LParen)) {
						c.advance();
						const inner = c.peek();
						if (inner && inner.kind === TokenKind.Identifier) {
							bracketKinds.push(inner.value);
							c.advance();
						}
						while (!c.done && !c.is(TokenKind.RParen)) c.advance();
						c.eat(TokenKind.RParen);
					} else {
						c.advance();
					}
				}
				c.eat(TokenKind.RBracket);

				const capName = tryCapture();
				if (capName) {
					for (const kn of bracketKinds) {
						captures.push({ kindName: kn, captureName: capName });
					}
				}

				while (!c.done && !c.is(TokenKind.RParen)) {
					if (c.is(TokenKind.LParen)) {
						c.advance();
						skipToClose();
					} else {
						c.advance();
					}
				}
				c.eat(TokenKind.RParen);
				continue;
			}

			const kindName = parsePattern();
			c.eat(TokenKind.RParen);

			const capName = tryCapture();
			if (capName && kindName) {
				captures.push({ kindName, captureName: capName });
			}
			continue;
		}

		if (tok.kind === TokenKind.LBracket) {
			c.advance();
			const bracketKinds: string[] = [];

			while (!c.done && !c.is(TokenKind.RBracket)) {
				if (c.is(TokenKind.LParen)) {
					c.advance();
					const inner = c.peek();
					if (inner && inner.kind === TokenKind.Identifier) {
						bracketKinds.push(inner.value);
						c.advance();
					}
					while (!c.done && !c.is(TokenKind.RParen)) c.advance();
					c.eat(TokenKind.RParen);
				} else {
					c.advance();
				}
			}
			c.eat(TokenKind.RBracket);

			const capName = tryCapture();
			if (capName) {
				for (const kn of bracketKinds) {
					captures.push({ kindName: kn, captureName: capName });
				}
			}
			continue;
		}

		if (tok.kind === TokenKind.StringLiteral) {
			c.advance();
			tryCapture();
			continue;
		}

		c.advance();
	}

	return captures;
}

export function parseInheritsDirective(source: string): string | undefined {
	const match = /;\s*inherits:\s*([\w-]+)/.exec(source);
	return match?.[1];
}
