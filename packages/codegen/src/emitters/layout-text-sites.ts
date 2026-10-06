const layoutSiteKey = (kind: string, text: string): string => `${kind}\t${text}`;

const sites = (...pairs: readonly (readonly [kind: string, text: string])[]): readonly string[] => pairs.map(([kind, text]) => layoutSiteKey(kind, text));

export const TEXT_RESOLVED_LAYOUT_SITES: Readonly<Record<string, readonly string[]>> = {
	rust: sites(
		['use_bounds', '<'],
		['type_arguments', '<'],
		['string_literal', '"'],
		['block_comment_doc_outer', '*'],
		['block_comment_doc_inner', '!']
	),
	typescript: sites(
		['template_type', '${'],
		['template_substitution', '${'],
		['template_string', '`'],
		['template_literal_type', '`'],
		['string_single', "'"],
		['string_double', '"'],
		['regex', '/']
	),
	scm: sites(['string', '"'], ['immediate_string', '"'], ['named_node_supertyped', '/'])
};

export const isTextResolvedLayoutSite = (grammar: string, kind: string, text: string): boolean =>
	TEXT_RESOLVED_LAYOUT_SITES[grammar]?.includes(layoutSiteKey(kind, text)) ?? false;
