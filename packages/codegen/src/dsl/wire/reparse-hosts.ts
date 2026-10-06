export interface ReparseHostsConfig {
	readonly hosts: Readonly<Record<string, string>>;
	readonly priority?: readonly string[];
	readonly gated?: readonly string[];
}

export const REPARSE_HOST_PRIORITY: readonly string[] = [
	'declaration',
	'statement',
	'_declaration_statement',
	'_simple_statement',
	'_compound_statement',
	'expression',
	'type',
	'pattern',
	'_expression',
	'_type',
	'_literal',
	'_literal_pattern',
	'_pattern'
];
