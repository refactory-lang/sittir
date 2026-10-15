import { bindingPatterns } from '@sittir/codegen/bindings';
import { grammarPackage } from '@sittir/codegen/grammars';
import type { Language } from 'web-tree-sitter';
import { load } from '../codegen-surface.ts';
import { loadWebTreeSitter } from '../validate/common.ts';

const sourceLanguages = new Map<string, Promise<Language>>();

async function sourceLanguage(grammar: string): Promise<Language> {
	const cached = sourceLanguages.get(grammar);
	if (cached !== undefined) return cached;
	const pending = loadSourceLanguage(grammar);
	sourceLanguages.set(grammar, pending);
	try {
		return await pending;
	} catch (error) {
		sourceLanguages.delete(grammar);
		throw error;
	}
}

async function loadSourceLanguage(grammar: string): Promise<Language> {
	const { buildSourceParser } = await load('sourceParser');
	const { Language } = await loadWebTreeSitter();
	return Language.load(buildSourceParser(grammarPackage(grammar)));
}

export interface BindingIssue {
	readonly line: number;
	readonly message: string;
}

export interface CompiledQuery {
	readonly patterns: number;
	readonly captureNames: readonly string[];
}

export async function compileQuery(grammar: string, text: string): Promise<CompiledQuery> {
	const lang = await sourceLanguage(grammar);
	const { Query } = await import('web-tree-sitter');
	const query = new Query(lang, text);
	try {
		return { patterns: query.captureQuantifiers.length, captureNames: [...query.captureNames] };
	} finally {
		query.delete();
	}
}

export async function bindingIssues(grammar: string, text: string): Promise<BindingIssue[]> {
	const lang = await sourceLanguage(grammar);
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
