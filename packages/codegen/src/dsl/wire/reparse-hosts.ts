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

export function assertReparseHostKeys(grammar: string, config: ReparseHostsConfig | undefined, kinds: ReadonlySet<string>): void {
	if (config === undefined) return;
	const keys = [
		...Object.keys(config.hosts).map((key) => ['hosts', key] as const),
		...(config.priority ?? []).map((key) => ['priority', key] as const),
		...(config.gated ?? []).map((key) => ['gated', key] as const)
	];
	const unknown = keys.filter(([, key]) => !kinds.has(key));
	if (unknown.length === 0) return;
	throw new Error(
		`${grammar}: reparseHosts names ${unknown.map(([where, key]) => `${where}.${key}`).join(', ')}, which ${unknown.length === 1 ? 'is' : 'are'} not ${unknown.length === 1 ? 'a kind' : 'kinds'} of the grammar`
	);
}
