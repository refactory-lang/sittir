/**
 * Trivia-role extractor — reads tree-sitter `highlights.scm` query files and
 * identifies which grammar kinds serve as comment / trivia nodes.
 *
 * Resolution strategy:
 * 1. Locate the grammar package via `createRequire`.
 * 2. Read `queries/highlights.scm`.
 * 3. Check for `; inherits: <lang>` directive in the file.
 * 4. If not found, check `tree-sitter.json` `highlights` array for parent
 *    grammar references (e.g. TypeScript → JavaScript).
 * 5. Parse all highlights sources with {@link parseSCMQuery}.
 * 6. Filter captures where name is `comment` or starts with `comment.`.
 * 7. Deduplicate kind names.
 */

import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseSCMQuery, parseInheritsDirective } from './parse.ts';
import type { SCMCapture } from './parse.ts';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TriviaRoleMap {
	grammar: string;
	triviaKinds: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const _require = createRequire(import.meta.url);

/**
 * Resolve the root directory of a tree-sitter grammar npm package.
 *
 * @returns Absolute path to the package root, or `undefined` if the package
 *          is not installed.
 */
function resolveGrammarRoot(grammarName: string): string | undefined {
	try {
		const pkgPath = _require.resolve(`tree-sitter-${grammarName}/package.json`);
		return dirname(pkgPath);
	} catch {
		return undefined;
	}
}

/**
 * Read a file if it exists, returning its contents or `undefined`.
 */
function readIfExists(filePath: string): string | undefined {
	if (existsSync(filePath)) {
		return readFileSync(filePath, 'utf-8');
	}
	return undefined;
}

/**
 * Read `tree-sitter.json` and extract parent grammar package names from the
 * `highlights` array.
 *
 * The `highlights` array may contain entries like:
 * ```json
 * "node_modules/tree-sitter-javascript/queries/highlights.scm"
 * ```
 *
 * @returns Array of parent grammar names (e.g. `['javascript']`).
 */
function resolveParentGrammarsFromConfig(grammarRoot: string): string[] {
	const configPath = join(grammarRoot, 'tree-sitter.json');
	const configSource = readIfExists(configPath);
	if (!configSource) return [];

	try {
		const config = JSON.parse(configSource) as {
			grammars?: Array<{ highlights?: string[] }>;
		};
		const parents: string[] = [];

		for (const grammar of config.grammars ?? []) {
			for (const entry of grammar.highlights ?? []) {
				// Match patterns like "node_modules/tree-sitter-<lang>/queries/highlights.scm"
				const match = /tree-sitter-([\w-]+)\/queries\/highlights\.scm/.exec(entry);
				if (match && match[1]) {
					parents.push(match[1]);
				}
			}
		}

		return parents;
	} catch {
		return [];
	}
}

/**
 * Collect all SCM captures from a grammar and its parent grammars.
 */
function collectCaptures(grammarName: string, visited: Set<string>): SCMCapture[] {
	if (visited.has(grammarName)) return [];
	visited.add(grammarName);

	const grammarRoot = resolveGrammarRoot(grammarName);
	if (!grammarRoot) {
		console.warn(
			`[sittir] highlights.scm not found: tree-sitter-${grammarName} is not installed`,
		);
		return [];
	}

	const highlightsPath = join(grammarRoot, 'queries', 'highlights.scm');
	const source = readIfExists(highlightsPath);
	if (!source) {
		console.warn(
			`[sittir] highlights.scm not found at ${highlightsPath}`,
		);
		return [];
	}

	const captures = parseSCMQuery(source);

	// Check for parent grammars via `; inherits:` directive
	const inheritsLang = parseInheritsDirective(source);
	if (inheritsLang) {
		captures.push(...collectCaptures(inheritsLang, visited));
	}

	// Check for parent grammars via tree-sitter.json config
	const parentGrammars = resolveParentGrammarsFromConfig(grammarRoot);
	for (const parent of parentGrammars) {
		captures.push(...collectCaptures(parent, visited));
	}

	return captures;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract the set of grammar kinds that serve as trivia (comment) nodes.
 *
 * Reads the grammar's `highlights.scm` file, follows inheritance chains
 * (both `; inherits:` directives and `tree-sitter.json` `highlights` arrays),
 * and returns all kinds captured as `@comment` or `@comment.*`.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns A {@link TriviaRoleMap} with deduplicated trivia kind names.
 */
export function extractTriviaRoles(grammar: string): TriviaRoleMap {
	const visited = new Set<string>();
	const allCaptures = collectCaptures(grammar, visited);

	const triviaKinds = [
		...new Set(
			allCaptures
				.filter(c => c.captureName === 'comment' || c.captureName.startsWith('comment.'))
				.map(c => c.kindName),
		),
	];

	return { grammar, triviaKinds };
}
