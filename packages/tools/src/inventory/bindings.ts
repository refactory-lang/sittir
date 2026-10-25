import { type BindingPattern, bindingPatterns } from '@sittir/codegen/bindings';
import { grammarPackage } from '@sittir/codegen/grammars';
import type { Language } from 'web-tree-sitter';
import { evaluateGrammar, load } from '../codegen-surface.ts';
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

const mints = new Map<string, Promise<ReadonlyMap<string, string>>>();

function mintedFrom(grammar: string): Promise<ReadonlyMap<string, string>> {
	const cached = mints.get(grammar);
	if (cached !== undefined) return cached;
	const pending = evaluateGrammar(grammar).then(
		(raw) => new Map((raw.bindingEffects ?? []).flatMap((effect) => (effect.kind === 'alias' ? [[effect.to, effect.from] as const] : [])))
	);
	mints.set(grammar, pending);
	pending.catch(() => mints.delete(grammar));
	return pending;
}

function authoredSource(pattern: BindingPattern, mintedFrom: ReadonlyMap<string, string>): string {
	const minted = pattern.references.flatMap((ref) => (ref.kind === 'node' && mintedFrom.has(ref.name) ? [ref] : [])).sort((a, b) => b.at - a.at);
	return minted.reduce((source, ref) => `${source.slice(0, ref.at)}${mintedFrom.get(ref.name)}${source.slice(ref.at + ref.name.length)}`, pattern.source);
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
	const minted = await mintedFrom(grammar);
	const { Query } = await import('web-tree-sitter');
	const query = new Query(lang, (await bindingPatterns(text)).map((pattern) => authoredSource(pattern, minted)).join('\n'));
	try {
		return { patterns: query.captureQuantifiers.length, captureNames: [...query.captureNames] };
	} finally {
		query.delete();
	}
}

export async function bindingIssues(grammar: string, text: string): Promise<BindingIssue[]> {
	const lang = await sourceLanguage(grammar);
	const minted = await mintedFrom(grammar);
	const { Query } = await import('web-tree-sitter');
	const issues: BindingIssue[] = [];
	for (const pattern of await bindingPatterns(text)) {
		const unknown = new Set<string>();
		for (const ref of pattern.references) {
			const { kind } = ref;
			const name = ref.kind === 'node' ? (minted.get(ref.name) ?? ref.name) : ref.name;
			const known =
				kind === 'field' ? lang.fieldIdForName(name) !== null : lang.idForNodeType(name, kind === 'node') !== null;
			if (!known) unknown.add(kind === 'token' ? `token "${name}"` : `${kind} ${name}`);
		}
		for (const name of unknown) issues.push({ line: pattern.line, message: `unknown ${name}` });
		if (unknown.size > 0) continue;
		try {
			new Query(lang, authoredSource(pattern, minted)).delete();
		} catch (e) {
			issues.push({ line: pattern.line, message: e instanceof Error ? e.message : String(e) });
		}
	}
	return issues;
}
