/**
 * Minimal S-expression query parser for tree-sitter `highlights.scm` files.
 *
 * Parses enough of the SCM query syntax to extract `@capture_name` bindings
 * attached to `(kind_name)` node patterns. Predicates, field names, quantifiers,
 * string literals, and alternation brackets are recognised and skipped.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SCMCapture {
	kindName: string;
	captureName: string;
}

// ---------------------------------------------------------------------------
// Token types (internal)
// ---------------------------------------------------------------------------

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
	Predicate,
}

interface Token {
	kind: TokenKind;
	value: string;
}

// ---------------------------------------------------------------------------
// Tokeniser
// ---------------------------------------------------------------------------

/**
 * Tokenise an SCM query source into a flat token stream.
 *
 * Recognised token shapes:
 * - `(` / `)` / `[` / `]` — structure
 * - `@capture.name` — capture
 * - `(#pred? ...)` — predicate (consumed as a single token including parens)
 * - `"string"` — string literal (skipped downstream)
 * - `identifier:` — field name (skipped downstream)
 * - `?` / `*` / `+` — quantifier (skipped downstream)
 * - `identifier` — kind name or other bareword
 */
function tokenise(source: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	const len = source.length;

	while (i < len) {
		const ch = source[i]!;

		// Skip whitespace
		if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
			i++;
			continue;
		}

		// Line comments: ; ...
		if (ch === ';') {
			while (i < len && source[i] !== '\n') i++;
			continue;
		}

		// Structure
		if (ch === '(') {
			// Check for predicate: (#name? ...)
			if (i + 1 < len && source[i + 1] === '#') {
				const start = i;
				let depth = 1;
				i++; // skip (
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

		// Quantifiers
		if (ch === '?' || ch === '*' || ch === '+') {
			tokens.push({ kind: TokenKind.Quantifier, value: ch });
			i++;
			continue;
		}

		// Captures: @name.sub
		if (ch === '@') {
			i++; // skip @
			const start = i;
			while (i < len && /[\w.]/.test(source[i]!)) i++;
			tokens.push({ kind: TokenKind.Capture, value: source.slice(start, i) });
			continue;
		}

		// String literals: "..."
		if (ch === '"') {
			const start = i;
			i++; // skip opening "
			while (i < len && source[i] !== '"') {
				if (source[i] === '\\') i++; // skip escaped char
				i++;
			}
			if (i < len) i++; // skip closing "
			tokens.push({ kind: TokenKind.StringLiteral, value: source.slice(start, i) });
			continue;
		}

		// Identifiers (kind names, field names)
		if (/[\w_]/.test(ch)) {
			const start = i;
			while (i < len && /[\w_.]/.test(source[i]!)) i++;
			const word = source.slice(start, i);

			// Field colon: `name:`
			if (i < len && source[i] === ':') {
				i++; // skip :
				tokens.push({ kind: TokenKind.FieldColon, value: word });
				continue;
			}

			tokens.push({ kind: TokenKind.Identifier, value: word });
			continue;
		}

		// Anchors (`.`) and other unknown chars — skip
		i++;
	}

	return tokens;
}

// ---------------------------------------------------------------------------
// Token-stream cursor
// ---------------------------------------------------------------------------

/**
 * Lightweight cursor over a token array. Provides `peek()` / `advance()`
 * with proper `Token | undefined` return types so the parser never needs
 * unchecked index access.
 */
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

	/** Return current token without advancing, or `undefined` at end. */
	peek(): Token | undefined {
		return this.tokens[this.pos];
	}

	/** Return current token and advance, or `undefined` at end. */
	advance(): Token | undefined {
		return this.tokens[this.pos++];
	}

	/** Check if current token has the given kind. */
	is(kind: TokenKind): boolean {
		const t = this.tokens[this.pos];
		return t !== undefined && t.kind === kind;
	}

	/** Consume the current token if it matches `kind`. Returns true if consumed. */
	eat(kind: TokenKind): boolean {
		const t = this.tokens[this.pos];
		if (t !== undefined && t.kind === kind) {
			this.pos++;
			return true;
		}
		return false;
	}
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse an SCM query source and extract all `(kind_name) @capture` bindings.
 *
 * For nested patterns like `(line_comment (doc_comment)) @comment.documentation`,
 * the capture is associated with the **outermost** kind in the pattern (i.e.
 * `line_comment`). Inner captures like `(parent field: (child) @cap)` associate
 * with the child kind.
 *
 * @returns Array of `{ kindName, captureName }` pairs.
 */
export function parseSCMQuery(source: string): SCMCapture[] {
	const c = new TokenCursor(tokenise(source));
	const captures: SCMCapture[] = [];

	/**
	 * Parse a parenthesised node pattern body (LParen already consumed).
	 *
	 * @returns The kind name of this pattern node, or `undefined` if degenerate.
	 */
	function parsePattern(): string | undefined {
		const first = c.peek();
		if (!first || first.kind !== TokenKind.Identifier) {
			skipToClose();
			return undefined;
		}
		const kindName = first.value;
		c.advance(); // consume kind identifier

		while (!c.done) {
			const tok = c.peek();
			if (!tok || tok.kind === TokenKind.RParen) break;

			if (tok.kind === TokenKind.LParen) {
				c.advance(); // consume (
				const childKind = parsePattern();
				c.eat(TokenKind.RParen); // consume )
				// Capture on child pattern
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

			// Skip everything else inside the pattern body
			c.advance();
		}

		return kindName;
	}

	/** Skip past a bracket group `[...]`, handling nesting. */
	function skipBracketGroup(): void {
		c.advance(); // consume [
		let depth = 1;
		while (!c.done && depth > 0) {
			const tok = c.advance();
			if (!tok) break;
			if (tok.kind === TokenKind.LBracket) depth++;
			else if (tok.kind === TokenKind.RBracket) depth--;
		}
	}

	/** Skip tokens to the matching `)` for the current `(`. */
	function skipToClose(): void {
		let depth = 1;
		while (!c.done && depth > 0) {
			const tok = c.advance();
			if (!tok) break;
			if (tok.kind === TokenKind.LParen) depth++;
			else if (tok.kind === TokenKind.RParen) depth--;
		}
	}

	/** Try to consume a capture token; returns the capture value or undefined. */
	function tryCapture(): string | undefined {
		const tok = c.peek();
		if (tok && tok.kind === TokenKind.Capture) {
			c.advance();
			return tok.value;
		}
		return undefined;
	}

	// Main loop — process top-level patterns
	while (!c.done) {
		const tok = c.peek();
		if (!tok) break;

		if (tok.kind === TokenKind.LParen) {
			c.advance(); // consume (

			// Check for double-paren: ((kind) @cap (#pred? ...))
			if (c.is(TokenKind.LParen)) {
				c.advance(); // consume inner (
				const kindName = parsePattern();
				c.eat(TokenKind.RParen); // consume inner )

				// Capture on the inner pattern
				const capName = tryCapture();
				if (capName && kindName) {
					captures.push({ kindName, captureName: capName });
				}

				// Skip predicates and rest until closing )
				while (!c.done && !c.is(TokenKind.RParen)) {
					if (c.is(TokenKind.LParen)) {
						c.advance();
						skipToClose();
					} else {
						c.advance();
					}
				}
				c.eat(TokenKind.RParen); // consume outer )
				continue;
			}

			// Bracket alternation inside predicate group: ([ ... ] @cap (#pred? ...))
			if (c.is(TokenKind.LBracket)) {
				c.advance(); // consume [
				const bracketKinds: string[] = [];

				while (!c.done && !c.is(TokenKind.RBracket)) {
					if (c.is(TokenKind.LParen)) {
						c.advance(); // consume (
						const inner = c.peek();
						if (inner && inner.kind === TokenKind.Identifier) {
							bracketKinds.push(inner.value);
							c.advance(); // consume kind name
						}
						// Skip to )
						while (!c.done && !c.is(TokenKind.RParen)) c.advance();
						c.eat(TokenKind.RParen);
					} else {
						c.advance(); // skip string literals, etc.
					}
				}
				c.eat(TokenKind.RBracket); // consume ]

				const capName = tryCapture();
				if (capName) {
					for (const kn of bracketKinds) {
						captures.push({ kindName: kn, captureName: capName });
					}
				}

				// Skip predicates and rest until closing )
				while (!c.done && !c.is(TokenKind.RParen)) {
					if (c.is(TokenKind.LParen)) {
						c.advance();
						skipToClose();
					} else {
						c.advance();
					}
				}
				c.eat(TokenKind.RParen); // consume outer )
				continue;
			}

			// Normal pattern: (kind ...) @cap
			const kindName = parsePattern();
			c.eat(TokenKind.RParen); // consume )

			const capName = tryCapture();
			if (capName && kindName) {
				captures.push({ kindName, captureName: capName });
			}
			continue;
		}

		// Bracket alternation at top level: [ (kind1) (kind2) ] @cap
		if (tok.kind === TokenKind.LBracket) {
			c.advance(); // consume [
			const bracketKinds: string[] = [];

			while (!c.done && !c.is(TokenKind.RBracket)) {
				if (c.is(TokenKind.LParen)) {
					c.advance(); // consume (
					const inner = c.peek();
					if (inner && inner.kind === TokenKind.Identifier) {
						bracketKinds.push(inner.value);
						c.advance(); // consume kind name
					}
					// Skip to )
					while (!c.done && !c.is(TokenKind.RParen)) c.advance();
					c.eat(TokenKind.RParen);
				} else {
					c.advance(); // skip string literals, etc.
				}
			}
			c.eat(TokenKind.RBracket); // consume ]

			const capName = tryCapture();
			if (capName) {
				for (const kn of bracketKinds) {
					captures.push({ kindName: kn, captureName: capName });
				}
			}
			continue;
		}

		// String literal at top level: ";" @punctuation.delimiter
		if (tok.kind === TokenKind.StringLiteral) {
			c.advance(); // skip the string
			tryCapture(); // skip the capture — anonymous node, no kind name
			continue;
		}

		// Skip any other top-level tokens
		c.advance();
	}

	return captures;
}

// ---------------------------------------------------------------------------
// Inherits directive
// ---------------------------------------------------------------------------

/**
 * Parse the `; inherits: <language>` directive from an SCM file header.
 *
 * The directive is a line comment of the form:
 * ```scheme
 * ; inherits: javascript
 * ```
 *
 * @returns The parent language name, or `undefined` if not found.
 */
export function parseInheritsDirective(source: string): string | undefined {
	const match = /;\s*inherits:\s*([\w-]+)/.exec(source);
	return match?.[1];
}
