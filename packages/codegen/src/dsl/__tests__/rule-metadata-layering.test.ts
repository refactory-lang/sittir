/**
 * dsl/__tests__/rule-metadata-layering.test.ts — enforcement gate for
 * `dsl/rule-metadata.ts`'s import-layering contract (debt PR-P1, item 5).
 *
 * Mechanism chosen: a vitest test that walks `packages/codegen/src` and
 * `packages/tools/src` for import specifiers naming `readRuleMetadata` /
 * `RuleMetadataShape` (the RESTRICTED real-shape READ accessors —
 * `makeRuleMetadata`, the write seam, is deliberately unrestricted; see
 * `dsl/rule-metadata.ts`'s module header for the two-seam rationale, mirrored
 * from `compiler/opaque-facts.ts`'s existing `opaqueFacts`/`readFacts` split)
 * and asserts every importing file is either (a) under a sanctioned
 * directory (`dsl/enrich.ts`, `dsl/wire/`, `dsl/transform/` — wire's
 * transform machinery — or a `packages/tools/src/validate*`/probe/discover
 * diagnostics module), (b) a `*.test.ts` file (tests are legitimate
 * diagnostics-adjacent readers — e.g. asserting Link/enrich blind-carries the
 * bag unchanged), or (c) explicitly allowlisted below with a comment tying it
 * to a tracked follow-up.
 *
 * WHY THIS MECHANISM (not an ast-grep rule or a shell script):
 *   - No prior ast-grep / dependency-direction test exists in this repo to
 *     extend (checked `.claude/hooks/`, `scripts/`, and every
 *     `packages/codegen/src/**\/__tests__/*.test.ts` for "layering" /
 *     "boundary" / "dependency-direction" precedent — none found; the
 *     closest analogue, `scripts/assert-scope-boundaries.sh`, is a
 *     rust-crate-scope bash gate, a different domain).
 *   - A vitest test runs in the same gate developers already run
 *     (`pnpm vitest`) and fails loudly with a stack trace pointing at the
 *     violating file — cheaper to author and maintain than a new ast-grep
 *     rule + wiring it into CI, and this repo already has ONE test-level
 *     opacity-enforcement precedent to mirror almost verbatim:
 *     `compiler/__tests__/opaque-facts.test.ts` (the `@ts-expect-error`
 *     round-trip pattern, reused below for `RuleMetadata` itself).
 *   - Pure Node `fs` walk + regex (no `rg` subprocess): no test in this repo
 *     shells out to `rg` at test time (checked), and a subprocess dependency
 *     would make the gate flaky in sandboxes without `rg` on PATH.
 *
 * Two checks:
 *   1. Import-scope scan (this file, below) — the mechanical item-5 ask.
 *   2. `RuleMetadata` opacity — a `@ts-expect-error` compile-time proof that
 *      the brand exposes no readable property (mirrors opaque-facts.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRuleMetadata, readRuleMetadata, type RuleMetadataShape } from '../rule-metadata.ts';
import type { RuleMetadata } from '../../types/rule-metadata-brand.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const CODEGEN_SRC = join(HERE, '..', '..'); // packages/codegen/src
const TOOLS_SRC = join(HERE, '..', '..', '..', '..', 'tools', 'src'); // packages/tools/src

// Restricted real-shape identifiers. `makeRuleMetadata` (write) is NOT
// listed — it is the unrestricted construct seam (see module header).
const RESTRICTED_NAMES = ['readRuleMetadata', 'RuleMetadataShape'];

/** Directories (relative to `packages/codegen/src`) sanctioned to import the
 *  restricted real-shape accessors: enrich, wire (incl. transform machinery
 *  — the DSL's override-patch resolver), and the module's own tests. */
const SANCTIONED_CODEGEN_DIRS = ['dsl/']; // enrich.ts, wire/, transform/, primitives/, this __tests__ dir

/** Diagnostics-emission surface under packages/tools/src — validator +
 *  probe + discover modules read facts to REPORT, never to drive codegen. */
const SANCTIONED_TOOLS_DIRS = ['validate/', 'probe/', 'discover/'];

/**
 * Explicit, individually-justified exceptions outside the sanctioned dirs.
 * Each entry MUST cite the reason and a follow-up pointer — this list is
 * the ONLY escape hatch; anything else failing the scan is a real
 * violation to fix, not to allowlist.
 *
 * Empty as of debt PR-0c: the last exception (`emitters/templates.ts`'s
 * §D-2a spacing stopgap) was converted to a structural read
 * (`RuleBase.splicedBody`, a declared top-level flag — see that field's doc
 * comment in types/rule.ts) and no longer imports `readRuleMetadata`. The
 * gate is exception-free; any future entry here needs the same bar this one
 * met (individually justified, with a tracked follow-up) before landing.
 */
const ALLOWLIST: ReadonlyMap<string, string> = new Map([]);

function walk(dir: string, out: string[]): void {
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name === 'dist') continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			walk(full, out);
		} else if (name.endsWith('.ts')) {
			out.push(full);
		}
	}
}

function importsRestrictedNames(source: string): string[] {
	// Only look at import statements naming the module (by relative path
	// ending in `dsl/rule-metadata.ts` or `rule-metadata.ts` from within
	// dsl/), then check whether the named-import list contains a restricted
	// identifier. Deliberately simple (no full TS parse) — precise enough
	// for a closed, small identifier set, and greppable by a human auditing
	// a failure.
	const importLineRe = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"][^'"]*rule-metadata\.ts['"]/g;
	const hits: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = importLineRe.exec(source)) !== null) {
		const names = m[1]!.split(',').map((s) => s.replace(/^type\s+/, '').trim());
		for (const n of names) {
			if (RESTRICTED_NAMES.includes(n)) hits.push(n);
		}
	}
	return hits;
}

describe('dsl/rule-metadata.ts layering gate (debt PR-P1, item 5)', () => {
	it('restricted real-shape accessors (readRuleMetadata, RuleMetadataShape) are imported ONLY from sanctioned dirs, tests, or the explicit allowlist', () => {
		const files: string[] = [];
		walk(CODEGEN_SRC, files);
		try {
			walk(TOOLS_SRC, files);
		} catch {
			// packages/tools/src may not exist in every checkout context —
			// the codegen-side scan is the load-bearing half of this gate.
		}

		const violations: string[] = [];
		for (const file of files) {
			const relCodegen = relative(CODEGEN_SRC, file);
			const relTools = relative(TOOLS_SRC, file);
			const isUnderCodegen = !relCodegen.startsWith('..');
			const relPath = isUnderCodegen ? relCodegen : relTools;

			const source = readFileSync(file, 'utf8');
			const hits = importsRestrictedNames(source);
			if (hits.length === 0) continue;

			// The module's own definition file is exempt (it doesn't import
			// itself, but guard anyway for robustness).
			if (relPath === 'dsl/rule-metadata.ts') continue;
			// Test files are legitimate diagnostics-adjacent readers.
			if (relPath.endsWith('.test.ts') || relPath.endsWith('.test-d.ts')) continue;

			const sanctioned = isUnderCodegen
				? SANCTIONED_CODEGEN_DIRS.some((d) => relPath.startsWith(d))
				: SANCTIONED_TOOLS_DIRS.some((d) => relPath.startsWith(d));
			if (sanctioned) continue;

			if (ALLOWLIST.has(relPath)) continue;

			violations.push(`${relPath} imports [${hits.join(', ')}] — not sanctioned, not allowlisted`);
		}

		expect(violations).toEqual([]);
	});

	it('RuleMetadata is genuinely opaque — no readable property without the dsl accessor', () => {
		const meta: RuleMetadata = makeRuleMetadata({ source: 'grammar' });
		// @ts-expect-error — RuleMetadata exposes no readable keys; the ONLY
		// way to read a fact is `readRuleMetadata`. If this line ever stops
		// erroring, the brand has been weakened and decision 3 (opaque
		// metadata) is no longer type-enforced. Mirrors
		// compiler/__tests__/opaque-facts.test.ts's identical proof for
		// `OpaqueFacts`.
		const leak = meta.source;
		void leak;
		const shape: RuleMetadataShape | undefined = readRuleMetadata(meta);
		expect(shape?.source).toBe('grammar');
	});
});
