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

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TriviaRoleMap {
	grammar: string;
	triviaKinds: string[];
}

/**
 * Semantic roles extracted from tree-sitter SCM query captures.
 *
 * Base roles (`'string'`, `'number'`, etc.) are the union of all sub-role
 * captures. Sub-roles (`'string.special'`, `'number.float'`, etc.) carry
 * finer-grained distinctions when the grammar's SCM captures provide them.
 */
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
	/** Convenience accessor — get kinds for a specific role */
	get(role: Role): string[];
}

// ---------------------------------------------------------------------------
// Capture-to-role mapping table (single source of truth)
// ---------------------------------------------------------------------------

type QueryFile = 'highlights' | 'tags';

interface CaptureRoleMapping {
	/** Base capture name — matches the capture itself or any sub-captures. */
	captureBase: string;
	role: Role;
	source: QueryFile;
}

/**
 * Mapping from SCM capture names to semantic roles.
 *
 * Each entry maps a capture base (e.g. `'comment'`) to a role. Sub-captures
 * like `@comment.documentation` map to the same base role (`'trivia'`).
 *
 * Entries with an explicit sub-capture (e.g. `'string.special'`) produce a
 * sub-role AND contribute to the parent base role. The sub-capture entry must
 * come BEFORE the base entry so that the more specific match wins during
 * iteration (the first match that fires also populates the base role via the
 * base-capture fallthrough).
 */
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
	{ captureBase: 'reference.call', role: 'reference.call', source: 'tags' },
];

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
 * specified query file array (e.g. `highlights` or `tags`).
 *
 * The array may contain entries like:
 * ```json
 * "node_modules/tree-sitter-javascript/queries/highlights.scm"
 * ```
 *
 * @param queryFile - Which query file array to inspect (`'highlights'` or `'tags'`).
 * @returns Array of parent grammar names (e.g. `['javascript']`).
 */
function resolveParentGrammarsFromConfig(
	grammarRoot: string,
	queryFile: QueryFile,
): string[] {
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
			const entryList = Array.isArray(entries) ? entries as string[] : [entries as string];

			for (const entry of entryList) {
				// Match patterns like "node_modules/tree-sitter-<lang>/queries/<file>.scm"
				const pattern = new RegExp(
					`tree-sitter-([\\w-]+)/queries/${queryFile}\\.scm`,
				);
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

/**
 * Collect all SCM captures from a grammar and its parent grammars for a
 * specific query file.
 *
 * @param grammarName - Grammar name (e.g. `'rust'`, `'typescript'`).
 * @param visited - Set of already-visited grammar names (prevents cycles).
 * @param queryFile - Which query file to read (`'highlights'` or `'tags'`).
 */
function collectCaptures(
	grammarName: string,
	visited: Set<string>,
	queryFile: QueryFile,
): SCMCapture[] {
	if (visited.has(grammarName)) return [];
	visited.add(grammarName);

	const grammarRoot = resolveGrammarRoot(grammarName);
	if (!grammarRoot) {
		console.warn(
			`[sittir] ${queryFile}.scm not found: tree-sitter-${grammarName} is not installed`,
		);
		return [];
	}

	const filePath = join(grammarRoot, 'queries', `${queryFile}.scm`);
	const source = readIfExists(filePath);
	if (!source) {
		// tags.scm is optional — only warn for highlights.scm
		if (queryFile === 'highlights') {
			console.warn(
				`[sittir] highlights.scm not found at ${filePath}`,
			);
		}
		return [];
	}

	const captures = parseSCMQuery(source);

	// Check for parent grammars via `; inherits:` directive
	const inheritsLang = parseInheritsDirective(source);
	if (inheritsLang) {
		captures.push(...collectCaptures(inheritsLang, visited, queryFile));
	}

	// Check for parent grammars via tree-sitter.json config
	const parentGrammars = resolveParentGrammarsFromConfig(grammarRoot, queryFile);
	for (const parent of parentGrammars) {
		captures.push(...collectCaptures(parent, visited, queryFile));
	}

	return captures;
}

/**
 * Test whether a capture name matches a mapping entry.
 *
 * A capture matches if:
 * - It exactly equals the mapping's captureBase, OR
 * - It starts with the mapping's captureBase followed by a dot.
 */
function captureMatchesMapping(
	captureName: string,
	mapping: CaptureRoleMapping,
): boolean {
	return (
		captureName === mapping.captureBase ||
		captureName.startsWith(mapping.captureBase + '.')
	);
}

/**
 * Derive the base role from a sub-role. For example, `'string.special'`
 * yields `'string'`; `'function.method'` yields `'function'`.
 * Base roles (no dot) return `undefined`.
 */
function baseRoleOf(role: Role): Role | undefined {
	const dotIdx = role.indexOf('.');
	if (dotIdx === -1) return undefined;
	return role.slice(0, dotIdx) as Role;
}

// ---------------------------------------------------------------------------
// Well-known fallback probes
// ---------------------------------------------------------------------------

/**
 * Well-known kind names that map to semantic roles across tree-sitter
 * grammars. When SCM captures don't discover a role, these probes add
 * the canonical kind names for that role so the `ir.from.*` surface
 * can emit canonical factories.
 *
 * Each probe is a [role, candidate-kind-names] pair. The probe only
 * fires if the role has no kinds after SCM extraction.
 */
const FALLBACK_PROBES: readonly [Role, readonly string[]][] = [
	['boolean', ['boolean_literal', 'true', 'false']],
	['number', ['integer_literal', 'float_literal', 'integer', 'float', 'number']],
	['number.float', ['float_literal', 'float']],
];

/**
 * Apply well-known kind probes for roles that SCM extraction missed.
 *
 * @remarks
 * Some grammars don't use `@boolean` or `@number` captures — Rust
 * captures them as `@constant.builtin` which doesn't map to any
 * semantic role in our table. The probe adds well-known kind names
 * that the downstream `ir.from.*` emitter can use to construct
 * canonical factories.
 *
 * Only fires when the role has zero kinds from SCM extraction.
 * Sub-role probes also contribute to their parent base role.
 */
function applyFallbackProbes(
	roleKinds: Map<Role, Set<string>>,
	addToRole: (role: Role, kindName: string) => void,
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract all semantic roles from a grammar's SCM query files.
 *
 * Reads both `highlights.scm` and `tags.scm`, follows inheritance chains
 * (both `; inherits:` directives and `tree-sitter.json` arrays), and maps
 * captures to semantic roles via the {@link CAPTURE_TO_ROLE} table.
 *
 * Sub-role captures (e.g. `@string.special`, `@number.float`) produce BOTH
 * the sub-role entry AND contribute their kinds to the parent base role.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns A {@link GrammarRoles} with deduplicated role entries.
 */
export function extractGrammarRoles(grammar: string): GrammarRoles {
	// Collect captures from highlights.scm
	const highlightsVisited = new Set<string>();
	const highlightsCaptures = collectCaptures(grammar, highlightsVisited, 'highlights');

	// Collect captures from tags.scm
	const tagsVisited = new Set<string>();
	const tagsCaptures = collectCaptures(grammar, tagsVisited, 'tags');

	// Map captures to roles using the mapping table
	const roleKinds = new Map<Role, Set<string>>();

	/** Add a kind to a role's set, creating the set if needed. */
	function addToRole(role: Role, kindName: string): void {
		let set = roleKinds.get(role);
		if (!set) {
			set = new Set();
			roleKinds.set(role, set);
		}
		set.add(kindName);
	}

	// Process highlights captures
	for (const capture of highlightsCaptures) {
		for (const mapping of CAPTURE_TO_ROLE) {
			if (mapping.source !== 'highlights') continue;
			if (!captureMatchesMapping(capture.captureName, mapping)) continue;

			addToRole(mapping.role, capture.kindName);

			// Sub-roles also contribute to their base role
			const base = baseRoleOf(mapping.role);
			if (base) {
				addToRole(base, capture.kindName);
			}
			break; // first match wins per capture
		}
	}

	// Process tags captures
	for (const capture of tagsCaptures) {
		for (const mapping of CAPTURE_TO_ROLE) {
			if (mapping.source !== 'tags') continue;
			if (!captureMatchesMapping(capture.captureName, mapping)) continue;

			addToRole(mapping.role, capture.kindName);

			const base = baseRoleOf(mapping.role);
			if (base) {
				addToRole(base, capture.kindName);
			}
			break;
		}
	}

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
		},
	};
}

/**
 * Extract the set of grammar kinds that serve as trivia (comment) nodes.
 *
 * Thin wrapper over {@link extractGrammarRoles} for backward compatibility.
 * Reads the grammar's `highlights.scm` file, follows inheritance chains
 * (both `; inherits:` directives and `tree-sitter.json` `highlights` arrays),
 * and returns all kinds captured as `@comment` or `@comment.*`.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns A {@link TriviaRoleMap} with deduplicated trivia kind names.
 */
export function extractTriviaRoles(grammar: string): TriviaRoleMap {
	const roles = extractGrammarRoles(grammar);
	return {
		grammar,
		triviaKinds: roles.get('trivia'),
	};
}

/**
 * Print a cross-grammar diagnostic table of semantic role coverage.
 *
 * @param grammars - Grammar names to compare (defaults to all three).
 */
export function printRoleDiagnostic(
	grammars: string[] = ['rust', 'typescript', 'python'],
): void {
	const results = grammars.map(g => extractGrammarRoles(g));

	// Collect all roles that appear in any grammar
	const allRoles = new Set<Role>();
	for (const r of results) {
		for (const e of r.entries) allRoles.add(e.role);
	}

	// Print table
	const header = ['Role', ...grammars].join(' | ');
	console.log(header);
	console.log(header.replace(/[^|]/g, '-'));

	for (const role of [...allRoles].sort()) {
		const cells = grammars.map(g => {
			const gr = results.find(r => r.grammar === g)!;
			const kinds = gr.get(role as Role);
			return kinds.length > 0 ? kinds.join(', ') : '—';
		});
		console.log([role, ...cells].join(' | '));
	}
}
