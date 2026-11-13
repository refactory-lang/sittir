import { type BindingPattern, BindingsSyntaxError, bindingPatterns } from '@sittir/codegen/bindings';
import { grammarPackage } from '@sittir/codegen/grammars';
import type { Language, Query } from 'web-tree-sitter';
import { evaluateGrammar, load } from '../codegen-surface.ts';
import { languageOf } from '../validate/common.ts';

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
	return (await languageOf(buildSourceParser(grammarPackage(grammar)))).language;
}

const mints = new Map<string, Promise<ReadonlyMap<string, readonly string[]>>>();

function mintedFrom(grammar: string): Promise<ReadonlyMap<string, readonly string[]>> {
	const cached = mints.get(grammar);
	if (cached !== undefined) return cached;
	const pending = evaluateGrammar(grammar).then((raw) => {
		const origins = new Map<string, string[]>();
		for (const effect of raw.bindingEffects ?? []) {
			if (effect.kind !== 'alias') continue;
			const from = origins.get(effect.to) ?? [];
			if (!from.includes(effect.from)) origins.set(effect.to, [...from, effect.from]);
		}
		return origins;
	});
	mints.set(grammar, pending);
	pending.catch(() => mints.delete(grammar));
	return pending;
}

const READINGS_TRIED = 64;

function* readingsOf(source: string, minted: readonly { readonly name: string; readonly at: number }[], mintedFrom: ReadonlyMap<string, readonly string[]>): Generator<string> {
	const [ref, ...rest] = minted;
	if (ref === undefined) {
		yield source;
		return;
	}
	for (const from of mintedFrom.get(ref.name) ?? [ref.name]) yield* readingsOf(`${source.slice(0, ref.at)}${from}${source.slice(ref.at + ref.name.length)}`, rest, mintedFrom);
}

function compiles(Compiled: typeof Query, lang: Language, source: string): boolean {
	try {
		new Compiled(lang, source).delete();
		return true;
	} catch {
		return false;
	}
}

function authoredSource(Compiled: typeof Query, lang: Language, pattern: BindingPattern, mintedFrom: ReadonlyMap<string, readonly string[]>): string {
	const minted = pattern.references.flatMap((ref) => (ref.kind === 'node' && mintedFrom.has(ref.name) ? [ref] : [])).sort((a, b) => b.at - a.at);
	const count = minted.reduce((n, ref) => n * (mintedFrom.get(ref.name)?.length ?? 1), 1);
	const tried: string[] = [];
	for (const reading of readingsOf(pattern.source, minted, mintedFrom)) {
		if (count === 1 || compiles(Compiled, lang, reading)) return reading;
		tried.push(reading);
		if (tried.length === READINGS_TRIED) break;
	}
	if (count > READINGS_TRIED) throw new Error(`none of the first ${READINGS_TRIED} of the ${count} readings of its minted names compiles`);
	return tried[0] ?? pattern.source;
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
	const query = new Query(lang, (await bindingPatterns(text)).map((pattern) => authoredSource(Query, lang, pattern, minted)).join('\n'));
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
	let patterns: BindingPattern[];
	try {
		patterns = await bindingPatterns(text);
	} catch (e) {
		if (e instanceof BindingsSyntaxError) return e.lines.map((line) => ({ line, message: 'does not parse' }));
		throw e;
	}
	for (const pattern of patterns) {
		const unknown = new Set<string>();
		for (const ref of pattern.references) {
			const { kind } = ref;
			const names = ref.kind === 'node' ? (minted.get(ref.name) ?? [ref.name]) : [ref.name];
			const known = names.some((name) => (kind === 'field' ? lang.fieldIdForName(name) !== null : lang.idForNodeType(name, kind === 'node') !== null));
			const [name] = names;
			if (!known) unknown.add(kind === 'token' ? `token "${name}"` : `${kind} ${name}`);
		}
		for (const name of unknown) issues.push({ line: pattern.line, message: `unknown ${name}` });
		if (unknown.size > 0) continue;
		try {
			new Query(lang, authoredSource(Query, lang, pattern, minted)).delete();
		} catch (e) {
			issues.push({ line: pattern.line, message: e instanceof Error ? e.message : String(e) });
		}
	}
	return issues;
}
