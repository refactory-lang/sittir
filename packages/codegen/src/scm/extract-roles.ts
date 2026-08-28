import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseSCMQuery, parseInheritsDirective } from './parse.ts';
import type { SCMCapture } from './parse.ts';

export type Role =
	| 'root'
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

export function withRootRole(roles: GrammarRoles, rootKind: string): GrammarRoles {
	const entries: RoleEntry[] = [...roles.entries, { role: 'root', kinds: [rootKind] }];
	return {
		grammar: roles.grammar,
		entries,
		get: (role) => entries.filter((e) => e.role === role).flatMap((e) => e.kinds)
	};
}

type QueryFile = 'highlights' | 'tags';

interface CaptureRoleMapping {
	captureBase: string;
	role: Role;
	source: QueryFile;
}

const CAPTURE_TO_ROLE: readonly CaptureRoleMapping[] = [
	{ captureBase: 'comment', role: 'trivia', source: 'highlights' },

	{ captureBase: 'string.special', role: 'string.special', source: 'highlights' },
	{ captureBase: 'string', role: 'string', source: 'highlights' },

	{ captureBase: 'number.float', role: 'number.float', source: 'highlights' },
	{ captureBase: 'number', role: 'number', source: 'highlights' },

	{ captureBase: 'boolean', role: 'boolean', source: 'highlights' },

	{ captureBase: 'type.builtin', role: 'type.builtin', source: 'highlights' },
	{ captureBase: 'type', role: 'type', source: 'highlights' },

	{ captureBase: 'variable.builtin', role: 'variable.builtin', source: 'highlights' },
	{ captureBase: 'variable.parameter', role: 'variable.parameter', source: 'highlights' },
	{ captureBase: 'variable', role: 'variable', source: 'highlights' },

	{ captureBase: 'function.method', role: 'function.method', source: 'highlights' },
	{ captureBase: 'function.builtin', role: 'function.builtin', source: 'highlights' },
	{ captureBase: 'function.macro', role: 'function.macro', source: 'highlights' },
	{ captureBase: 'function', role: 'function', source: 'highlights' },

	{ captureBase: 'definition.function', role: 'definition.function', source: 'tags' },
	{ captureBase: 'definition.class', role: 'definition.class', source: 'tags' },
	{ captureBase: 'definition.method', role: 'definition.method', source: 'tags' },
	{ captureBase: 'definition.module', role: 'definition.module', source: 'tags' },
	{ captureBase: 'definition.interface', role: 'definition.interface', source: 'tags' },

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

			const entryList = Array.isArray(entries) ? (entries as string[]) : [entries as string];

			for (const entry of entryList) {
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
			const base = baseRoleOf(mapping.role);
			if (base) addToRole(base, capture.kindName);
			break;
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
