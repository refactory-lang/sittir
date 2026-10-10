import { bindingPatterns } from '@sittir/codegen/bindings';
import { loadLanguageForGrammar } from '../validate/common.ts';

export interface BindingIssue {
	readonly line: number;
	readonly message: string;
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

export async function bindingIssues(grammar: string, text: string): Promise<BindingIssue[]> {
	const { lang } = await loadLanguageForGrammar(grammar);
	const { Query } = await import('web-tree-sitter');
	const issues: BindingIssue[] = [];
	for (const pattern of await bindingPatterns(text)) {
		const unknown = new Set<string>();
		for (const { kind, name } of pattern.references) {
			const known =
				kind === 'field' ? lang.fieldIdForName(name) !== null : lang.idForNodeType(name, kind === 'node') !== null;
			if (!known) unknown.add(kind === 'token' ? `token "${name}"` : `${kind} ${name}`);
		}
		for (const name of unknown) issues.push({ line: pattern.line, message: `unknown ${name}` });
		if (unknown.size > 0) continue;
		try {
			new Query(lang, pattern.source).delete();
		} catch (e) {
			issues.push({ line: pattern.line, message: e instanceof Error ? e.message : String(e) });
		}
	}
	return issues;
}
