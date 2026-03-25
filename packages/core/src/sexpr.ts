// S-expression parser for render templates
import type { ParsedTemplate, TemplateElement } from './types.ts';

/**
 * Parse an S-expression render template into a structured representation.
 *
 * Input syntax (tree-sitter query style):
 *   (function_item "fn" name: (_) "(" parameters: (_)* ")" return_type: (_)? body: (_))
 *
 * Elements:
 *   "text"         → token (literal text to emit)
 *   field: (_)     → named field reference
 *   field: (_)?    → optional field
 *   field: (_)*    → zero-or-more (multiple) field
 *   field: (_)+    → one-or-more (multiple) field
 *   (_)*           → unnamed children (zero-or-more)
 *   (_)+           → unnamed children (one-or-more)
 *   (_)?           → unnamed children (optional)
 */
export function parseTemplate(template: string): ParsedTemplate {
	const trimmed = template.trim();

	if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
		throw new Error(`Invalid render template — must be an S-expression: ${template}`);
	}

	const inner = trimmed.slice(1, -1).trim();

	// First token is the node type
	const typeEnd = inner.search(/[\s"(]/);
	const type = typeEnd === -1 ? inner : inner.slice(0, typeEnd);
	const rest = typeEnd === -1 ? '' : inner.slice(typeEnd).trim();

	const elements = parseElements(rest);

	return { kind: type, elements };
}

function parseElements(input: string): TemplateElement[] {
	const elements: TemplateElement[] = [];
	let i = 0;

	while (i < input.length) {
		while (i < input.length && /\s/.test(input[i]!)) i++;
		if (i >= input.length) break;

		const ch = input[i]!;

		if (ch === '"') {
			const end = input.indexOf('"', i + 1);
			if (end === -1) throw new Error(`Unterminated string at position ${i}`);
			elements.push({ type: 'token', value: input.slice(i + 1, end) });
			i = end + 1;
		} else if (ch === '(') {
			const close = input.indexOf(')', i);
			if (close === -1) throw new Error(`Unterminated ( at position ${i}`);
			i = close + 1;
			const quantifier = parseQuantifier(input, i);
			if (quantifier) i++;
			elements.push({ type: 'children', ...(quantifier ? { quantifier } : {}) });
		} else if (/[a-zA-Z_]/.test(ch)) {
			const identEnd = scanIdent(input, i);
			const ident = input.slice(i, identEnd);
			i = identEnd;

			while (i < input.length && /\s/.test(input[i]!)) i++;

			if (i < input.length && input[i] === ':') {
				i++; // skip ':'
				while (i < input.length && /\s/.test(input[i]!)) i++;

				if (i < input.length && input[i] === '(') {
					const close = input.indexOf(')', i);
					if (close === -1) throw new Error(`Unterminated ( at position ${i}`);
					i = close + 1;
					const quantifier = parseQuantifier(input, i);
					if (quantifier) i++;
					elements.push({ type: 'field', name: ident, ...(quantifier ? { quantifier } : {}) });
				} else {
					throw new Error(
						`Expected '(' after field '${ident}:' at position ${i}, ` +
						`got '${input[i] ?? 'end of input'}'. Use '${ident}: (_)' form.`
					);
				}
			} else {
				throw new Error(
					`Bare identifier '${ident}' at position ${i - ident.length}. ` +
					`Did you mean '${ident}: (_)' (field) or '"${ident}"' (token)?`
				);
			}
		} else {
			throw new Error(
				`Unexpected character '${ch}' at position ${i}. ` +
				`Expected '"' (token), '(' (wildcard), or identifier (field).`
			);
		}
	}

	return elements;
}

function scanIdent(input: string, start: number): number {
	let i = start;
	while (i < input.length && /[a-zA-Z0-9_]/.test(input[i]!)) i++;
	return i;
}

function parseQuantifier(input: string, pos: number): '?' | '*' | '+' | undefined {
	if (pos >= input.length) return undefined;
	const ch = input[pos];
	if (ch === '?' || ch === '*' || ch === '+') return ch;
	return undefined;
}
