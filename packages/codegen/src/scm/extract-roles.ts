/**
 * Semantic role extractor — reads tree-sitter `highlights.scm` and `tags.scm`
 * query files and identifies which grammar kinds serve specific semantic roles.
 *
 * Resolution strategy:
 * 1. Locate the grammar package via `createRequire`.
 * 2. Read `queries/highlights.scm` and `queries/tags.scm`.
 * 3. Check for `; inherits: <lang>` directive in each file.
 * 4. If not found, check `tree-sitter.json` `highlights`/`tags` arrays for
 *    parent grammar references (e.g. TypeScript → JavaScript).
 * 5. Parse all sources with {@link parseSCMQuery}.
 * 6. Map captures to semantic roles via {@link CAPTURE_TO_ROLE}.
 * 7. Deduplicate kind names per role.
 *
 * Phase 1 (shipped) extracted `@comment` captures for trivia.
 * Phase 2 extends this to ALL semantic roles from both query files.
 */

import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseSCMQuery, parseInheritsDirective } from './parse.ts';
import type { SCMCapture } from './parse.ts';

export type Role =
	| 'trivia'
	| 'string'
	| 'string.special'
	| 'number'
	| 'number.float'
	| 'boolean'
	| 'type'
	| 'type.builtin'
	| 'variable'
	| 'variable.builtin'
	| 'variable.parameter'
	| 'function'
	| 'function.method'
	| 'function.builtin'
	| 'function.macro'
	| 'definition.function'
	| 'definition.class'
	| 'definition.method'
	| 'definition.module'
	| 'definition.interface'
	| 'reference.call';

export interface RoleEntry {
	role: Role;
	kinds: string[];
}

export interface GrammarRoles {
	grammar: string;
	entries: RoleEntry[];
	get(role: Role): string[];
}

type QueryFile = 'highlights' | 'tags';

interface CaptureRoleMapping {
	captureBase: string;
	role: Role;
	source: QueryFile;
}

const CAPTURE_TO_ROLE: readonly CaptureRoleMapping[] = [
	// trivia
	{ captureBase: 'comment', role: 'trivia', source: 'highlights' },

	// string sub-roles before base
	{ captureBase: 'string.special', role: 'string.special', source: 'highlights' },
	{ captureBase: 'string', role: 'string', source: 'highlights' },

	// number sub-roles before base
	{ captureBase: 'number.float', role: 'number.float', source: 'highlights' },
	{ captureBase: 'number', role: 'number', source: 'highlights' },

	// boolean
	{ captureBase: 'boolean', role: 'boolean', source: 'highlights' },

	// type sub-roles before base
	{ captureBase: 'type.builtin', role: 'type.builtin', source: 'highlights' },
	{ captureBase: 'type', role: 'type', source: 'highlights' },

	// variable sub-roles before base
	{ captureBase: 'variable.builtin', role: 'variable.builtin', source: 'highlights' },
	{ captureBase: 'variable.parameter', role: 'variable.parameter', source: 'highlights' },
	{ captureBase: 'variable', role: 'variable', source: 'highlights' },

	// function sub-roles before base
	{ captureBase: 'function.method', role: 'function.method', source: 'highlights' },
	{ captureBase: 'function.builtin', role: 'function.builtin', source: 'highlights' },
	{ captureBase: 'function.macro', role: 'function.macro', source: 'highlights' },
	{ captureBase: 'function', role: 'function', source: 'highlights' },

	// tags.scm definitions
	{ captureBase: 'definition.function', role: 'definition.function', source: 'tags' },
	{ captureBase: 'definition.class', role: 'definition.class', source: 'tags' },
	{ captureBase: 'definition.method', role: 'definition.method', source: 'tags' },
	{ captureBase: 'definition.module', role: 'definition.module', source: 'tags' },
	{ captureBase: 'definition.interface', role: 'definition.interface', source: 'tags' },

	// tags.scm references
	{ captureBase: 'reference.call', role: 'reference.call', source: 'tags' }
];

const _require = createRequire(import.meta.url);

function resolveGrammarRoot(grammarName: string): string | undefined {
	try {
		const pkgPath = _require.resolve(`tree-sitter-${grammarName}/package.json`);
		return dirname(pkgPath);
	} catch {
		return undefined;
	}
}

function readIfExists(filePath: string): string | undefined {
	if (existsSync(filePath)) {
		return readFileSync(filePath, 'utf-8');
	}
	return undefined;
}

function resolveParentGrammarsFromConfig(grammarRoot: string, queryFile: QueryFile): string[] {
	const configPath = join(grammarRoot, 'tree-sitter.json');
	const configSource = readIfExists(configPath);
	if (!configSource) return [];

	try {
		const config = JSON.parse(configSource) as {
			grammars?: Array<Record<string, unknown>>;
		};
		const parents: string[] = [];

		for (const grammar of config.grammars ?? []) {
			const entries = grammar[queryFile];
			if (!entries) continue;

			// The field can be a string or an array of strings.
			const entryList = Array.isArray(entries) ? (entries as string[]) : [entries as string];

			for (const entry of entryList) {
				// Match patterns like "node_modules/tree-sitter-<lang>/queries/<file>.scm"
				const pattern = new RegExp(`tree-sitter-([\\w-]+)/queries/${queryFile}\\.scm`);
				const match = pattern.exec(entry);
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

function collectCaptures(grammarName: string, visited: Set<string>, queryFile: QueryFile): SCMCapture[] {
	if (visited.has(grammarName)) return [];
	visited.add(grammarName);

	const grammarRoot = resolveGrammarRoot(grammarName);
	if (!grammarRoot) {
		console.warn(`[sittir] ${queryFile}.scm not found: tree-sitter-${grammarName} is not installed`);
		return [];
	}

	const filePath = join(grammarRoot, 'queries', `${queryFile}.scm`);
	const source = readIfExists(filePath);
	if (!source) {
		// tags.scm is optional — only warn for highlights.scm
		if (queryFile === 'highlights') {
			console.warn(`[sittir] highlights.scm not found at ${filePath}`);
		}
		return [];
	}

	const captures = parseSCMQuery(source);

	const inheritsLang = parseInheritsDirective(source);
	if (inheritsLang) {
		captures.push(...collectCaptures(inheritsLang, visited, queryFile));
	}

	const parentGrammars = resolveParentGrammarsFromConfig(grammarRoot, queryFile);
	for (const parent of parentGrammars) {
		captures.push(...collectCaptures(parent, visited, queryFile));
	}

	return captures;
}

function captureMatchesMapping(captureName: string, mapping: CaptureRoleMapping): boolean {
	return captureName === mapping.captureBase || captureName.startsWith(mapping.captureBase + '.');
}

function baseRoleOf(role: Role): Role | undefined {
	const dotIdx = role.indexOf('.');
	if (dotIdx === -1) return undefined;
	return role.slice(0, dotIdx) as Role;
}

const FALLBACK_PROBES: readonly [Role, readonly string[]][] = [
	['boolean', ['boolean_literal', 'true', 'false']],
	['number', ['integer_literal', 'float_literal', 'integer', 'float', 'number']],
	['number.float', ['float_literal', 'float']]
];

function applyFallbackProbes(
	roleKinds: Map<Role, Set<string>>,
	addToRole: (role: Role, kindName: string) => void
): void {
	for (const [role, candidates] of FALLBACK_PROBES) {
		const existing = roleKinds.get(role);
		if (existing && existing.size > 0) continue;

		for (const kind of candidates) {
			addToRole(role, kind);
			const base = baseRoleOf(role);
			if (base) addToRole(base, kind);
		}
	}
}

function assignCapturesToRoles(
	captures: readonly SCMCapture[],
	source: QueryFile,
	addToRole: (role: Role, kindName: string) => void
): void {
	for (const capture of captures) {
		for (const mapping of CAPTURE_TO_ROLE) {
			if (mapping.source !== source) continue;
			if (!captureMatchesMapping(capture.captureName, mapping)) continue;

			addToRole(mapping.role, capture.kindName);
			// Sub-roles also contribute to their base role.
			const base = baseRoleOf(mapping.role);
			if (base) addToRole(base, capture.kindName);
			break; // first match wins per capture
		}
	}
}

export function extractGrammarRoles(grammar: string): GrammarRoles {
	const highlightsVisited = new Set<string>();
	const highlightsCaptures = collectCaptures(grammar, highlightsVisited, 'highlights');

	const tagsVisited = new Set<string>();
	const tagsCaptures = collectCaptures(grammar, tagsVisited, 'tags');

	const roleKinds = new Map<Role, Set<string>>();

	function addToRole(role: Role, kindName: string): void {
		let set = roleKinds.get(role);
		if (!set) {
			set = new Set();
			roleKinds.set(role, set);
		}
		set.add(kindName);
	}

	assignCapturesToRoles(highlightsCaptures, 'highlights', addToRole);
	assignCapturesToRoles(tagsCaptures, 'tags', addToRole);

	// Fallback: probe for well-known kind names when SCM captures didn't
	// discover them. Some grammars (e.g. Rust) use @constant.builtin for
	// booleans / numbers instead of @boolean / @number, so the capture-
	// based extraction misses them. These probes add kinds that are
	// universally recognized as belonging to a role.
	applyFallbackProbes(roleKinds, addToRole);

	const entries: RoleEntry[] = [];
	const roleMap = new Map<Role, string[]>();
	for (const [role, kinds] of roleKinds) {
		const kindList = [...kinds];
		entries.push({ role, kinds: kindList });
		roleMap.set(role, kindList);
	}

	return {
		grammar,
		entries,
		get(role: Role): string[] {
			return roleMap.get(role) ?? [];
		}
	};
}
