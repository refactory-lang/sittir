import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isNonInlinableLeafShape } from '../dsl/rule-patterns.ts';
import type { LinkedGrammar } from './types.ts';
import { sittirDirOf, type GrammarPackage } from '../grammars.ts';

interface GrammarJsonFile {
	readonly inline?: unknown;
	readonly rules?: Record<string, GrammarJsonNode>;
}

function readGrammarJson(pkg: GrammarPackage): GrammarJsonFile | undefined {
	const grammarJsonPath = join(sittirDirOf(pkg), 'src', 'grammar.json');
	if (!existsSync(grammarJsonPath)) return undefined;
	try {
		return JSON.parse(readFileSync(grammarJsonPath, 'utf8')) as GrammarJsonFile;
	} catch (e) {
		throw new Error(
			`readGrammarJson[${pkg.name}]: failed to read/parse ${grammarJsonPath}: ${e instanceof Error ? e.message : String(e)}`
		);
	}
}

export function danglingInlineNames(parsed: GrammarJsonFile): string[] {
	if (!Array.isArray(parsed.inline)) return [];
	const rules = new Set(Object.keys(parsed.rules ?? {}));
	return parsed.inline.filter((n): n is string => typeof n === 'string' && !rules.has(n));
}

export function assertGrammarJsonInlineIntegrity(pkg: GrammarPackage): void {
	const parsed = readGrammarJson(pkg);
	if (parsed === undefined) return;
	const dangling = danglingInlineNames(parsed);
	if (dangling.length > 0) {
		throw new Error(
			`inline-integrity[${pkg.name}]: ${dangling.length} wired inline name(s) missing from the compiled ` +
				`rule bag (tree-sitter reports only the first per run): ${dangling.join(', ')}`
		);
	}
}

interface GrammarJsonNode {
	readonly type: string;
	readonly name?: string;
	readonly value?: unknown;
	readonly named?: boolean;
	readonly content?: GrammarJsonNode;
	readonly members?: readonly GrammarJsonNode[];
}

export function buildInlinableKinds(inlineKinds: ReadonlySet<string>, linked: LinkedGrammar): Set<string> {
	return new Set(
		[...inlineKinds].filter((k) => {
			const rule = linked.rules[k];
			if (!rule) return true;
			return !isNonInlinableLeafShape(rule);
		})
	);
}

