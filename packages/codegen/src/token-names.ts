/**
 * Canonical token → human-readable name mapping.
 *
 * Used by:
 * - Variant subtype detection (naming branches by their discriminating token)
 * - Override field naming (anonymous token → field name)
 * - Template variable naming
 *
 * Covers all common delimiters, operators, keywords, and punctuation
 * across tree-sitter grammars. Language-specific tokens can be added
 * to the grammar-specific section.
 */

/** Map of token text → canonical name. */
export const TOKEN_NAMES: Record<string, string> = {
	// Delimiters
	'(': 'parens',
	')': 'close_paren',
	'[': 'brackets',
	']': 'close_bracket',
	'{': 'braces',
	'}': 'close_brace',
	'<': 'angle',
	'>': 'close_angle',

	// Quotes
	'"': 'double',
	"'": 'single',
	'`': 'backtick',
	'"""': 'triple_double',
	"'''": 'triple_single',

	// Punctuation
	',': 'comma',
	';': 'semicolon',
	':': 'colon',
	'::': 'path_sep',
	'.': 'dot',
	'..': 'range',
	'...': 'spread',
	'..=': 'range_inclusive',
	'?': 'question',
	'?.': 'optional_chain',
	'!': 'bang',
	'@': 'at',
	'#': 'hash',
	'##': 'double_hash',
	'_': 'underscore',
	'\\': 'backslash',

	// Arrows and pipes
	'=>': 'fat_arrow',
	'->': 'arrow',
	'<-': 'back_arrow',
	'|': 'pipe',
	'||': 'or',
	'&&': 'and',

	// Assignment
	'=': 'eq',
	'+=': 'plus_eq',
	'-=': 'minus_eq',
	'*=': 'star_eq',
	'/=': 'slash_eq',
	'%=': 'percent_eq',
	'**=': 'power_eq',
	'&=': 'and_eq',
	'|=': 'or_eq',
	'^=': 'xor_eq',
	'<<=': 'shl_eq',
	'>>=': 'shr_eq',
	'>>>=': 'unsigned_shr_eq',
	'??=': 'nullish_eq',
	'&&=': 'logical_and_eq',
	'||=': 'logical_or_eq',

	// Comparison
	'==': 'eq_eq',
	'!=': 'not_eq',
	'===': 'strict_eq',
	'!==': 'strict_not_eq',
	'<>': 'diamond',
	'<=': 'lte',
	'>=': 'gte',
	'<=>': 'spaceship',

	// Arithmetic
	'+': 'plus',
	'-': 'minus',
	'*': 'star',
	'/': 'slash',
	'%': 'percent',
	'**': 'power',

	// Bitwise
	'&': 'ampersand',
	'^': 'caret',
	'~': 'tilde',
	'<<': 'shl',
	'>>': 'shr',
	'>>>': 'unsigned_shr',

	// Increment/decrement
	'++': 'increment',
	'--': 'decrement',

	// Nullish
	'??': 'nullish',

	// Keywords (common across languages)
	'as': 'as',
	'async': 'async',
	'await': 'await',
	'break': 'break',
	'case': 'case',
	'catch': 'catch',
	'class': 'class',
	'const': 'const',
	'continue': 'continue',
	'crate': 'crate',
	'default': 'default',
	'delete': 'delete',
	'do': 'do',
	'dyn': 'dyn',
	'else': 'else',
	'enum': 'enum',
	'export': 'export',
	'extends': 'extends',
	'extern': 'extern',
	'false': 'false',
	'final': 'final',
	'finally': 'finally',
	'fn': 'fn',
	'for': 'for',
	'from': 'from',
	'get': 'get',
	'if': 'if',
	'impl': 'impl',
	'implements': 'implements',
	'import': 'import',
	'in': 'in',
	'instanceof': 'instanceof',
	'interface': 'interface',
	'let': 'let',
	'loop': 'loop',
	'match': 'match',
	'mod': 'mod',
	'move': 'move',
	'mut': 'mut',
	'new': 'new',
	'null': 'null',
	'of': 'of',
	'override': 'override',
	'pub': 'pub',
	'readonly': 'readonly',
	'ref': 'ref',
	'return': 'return',
	'self': 'self',
	'set': 'set',
	'static': 'static',
	'struct': 'struct',
	'super': 'super',
	'switch': 'switch',
	'this': 'this',
	'throw': 'throw',
	'trait': 'trait',
	'true': 'true',
	'try': 'try',
	'type': 'type',
	'typeof': 'typeof',
	'undefined': 'undefined',
	'union': 'union',
	'unsafe': 'unsafe',
	'use': 'use',
	'var': 'var',
	'void': 'void',
	'where': 'where',
	'while': 'while',
	'with': 'with',
	'yield': 'yield',

	// Python-specific
	'def': 'def',
	'elif': 'elif',
	'except': 'except',
	'lambda': 'lambda',
	'None': 'none',
	'nonlocal': 'nonlocal',
	'not': 'not',
	'or': 'or_kw',
	'and': 'and_kw',
	'pass': 'pass',
	'raise': 'raise',
	'global': 'global',
	'is': 'is',
	'assert': 'assert',
	'del': 'del',

	// Rust-specific
	'gen': 'gen',
	'macro_rules!': 'macro_rules',

	// TypeScript-specific
	'abstract': 'abstract',
	'declare': 'declare',
	'keyof': 'keyof',
	'infer': 'infer',
	'namespace': 'namespace',
	'require': 'require',
	'satisfies': 'satisfies',
	'asserts': 'asserts',
	'unique': 'unique',
	'symbol': 'symbol',
	'any': 'any',
	'never': 'never',
	'number': 'number',
	'string': 'string_kw',
	'boolean': 'boolean',
	'object': 'object_kw',
	'bigint': 'bigint',
};

/**
 * Get the canonical name for a token, or generate one from the text.
 * Falls back to lowercased text with non-alphanumeric chars stripped.
 */
export function tokenName(text: string): string {
	const known = TOKEN_NAMES[text];
	if (known) return known;
	// Fallback: lowercase, strip non-alphanumeric
	return text.toLowerCase().replace(/[^a-z0-9_]/g, '');
}
