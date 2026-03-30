/**
 * Steps 8–9: Semantic Token Aliases
 *
 * v1: Character-to-name table for non-alphanumeric tokens.
 * Uses Nx[Name] convention where 1x is omitted.
 */

import type { Grammar } from './grammar.ts';
import type { NodeModel, TokenModel } from './node-model.ts';

// ---------------------------------------------------------------------------
// Character-to-name table
// ---------------------------------------------------------------------------

const CHAR_NAMES: Record<string, string> = {
	'+': 'Plus',
	'-': 'Minus',
	'*': 'Star',
	'/': 'Slash',
	'%': 'Percent',
	'=': 'Equals',
	'!': 'Bang',
	'<': 'LessThan',
	'>': 'GreaterThan',
	'&': 'Ampersand',
	'|': 'Pipe',
	'^': 'Caret',
	'~': 'Tilde',
	'.': 'Dot',
	',': 'Comma',
	':': 'Colon',
	';': 'Semicolon',
	'(': 'LeftParen',
	')': 'RightParen',
	'[': 'LeftBracket',
	']': 'RightBracket',
	'{': 'LeftBrace',
	'}': 'RightBrace',
	'@': 'At',
	'#': 'Hash',
	'$': 'Dollar',
	'?': 'Question',
	'\\': 'Backslash',
	"'": 'SingleQuote',
	'"': 'DoubleQuote',
	'`': 'Backtick',
	'_': 'Underscore',
};

export interface TokenAlias {
	text: string;
	alias: string;
}

/**
 * Compute a semantic alias for a non-alphanumeric token using Nx[Name] convention.
 * Returns null if the token is alphanumeric (no alias needed).
 */
function tokenToAlias(text: string): string | null {
	if (/^[a-z_]+$/i.test(text)) return null;

	// Count consecutive identical characters, then name them
	const parts: string[] = [];
	let i = 0;
	while (i < text.length) {
		const char = text[i]!;
		let count = 1;
		while (i + count < text.length && text[i + count] === char) count++;

		const name = CHAR_NAMES[char] ?? `U${char.charCodeAt(0).toString(16).toUpperCase()}`;
		if (count === 1) {
			parts.push(name);
		} else {
			parts.push(`${count}x${name}`);
		}
		i += count;
	}

	return parts.join('');
}

/**
 * Infer semantic aliases for anonymous tokens.
 * v1: Simple character-to-name mapping.
 */
export function inferTokenAliases(
	models: Map<string, NodeModel>,
	_grammar: Grammar,
): Map<string, TokenAlias[]> {
	const aliases = new Map<string, TokenAlias[]>();

	for (const model of models.values()) {
		if (model.modelType !== 'token') continue;
		const alias = tokenToAlias(model.kind);
		if (alias) {
			aliases.set(model.kind, [{ text: model.kind, alias }]);
		}
	}

	return aliases;
}

/**
 * Apply token aliases to models.
 * Tokens with aliases get their kind updated to the alias name.
 */
export function applyTokenAliases(
	models: Map<string, NodeModel>,
	aliases: Map<string, TokenAlias[]>,
): void {
	for (const [text, aliasList] of aliases) {
		if (aliasList.length === 0) continue;
		// v1: single alias per token
		const alias = aliasList[0]!;
		const model = models.get(text);
		if (model && model.modelType === 'token') {
			// Don't rename the kind — it must stay as the tree-sitter token text
			// The alias is used for naming (typeName/factoryName) in the naming step
			// Store it for later use
			(model as any)._alias = alias.alias;
		}
	}
}
