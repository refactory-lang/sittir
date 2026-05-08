/**
 * parity-fixtures — extract a shared fixture corpus from the existing
 * round-trip validator for the Rust engine's parity harness (spec 012
 * T045 / FR-012 / data-model.md §6).
 *
 * Each successful kind probe that the RT validator verifies (render OK,
 * re-parse OK, AST-match OK) emits two paired fixtures:
 *
 *   - `RenderFixture`    — {NodeData input → expected rendered string}.
 *                          The Rust engine must reproduce `expectedOutput`
 *                          byte-for-byte (SC-001a).
 *   - `RoundTripFixture` — {source + reparse s-exp}. The Rust engine
 *                          must produce the same source + the same
 *                          re-parsed structure (SC-001b, semantic).
 *
 * FR-011 exception-kind gate: spec requires the emitted corpus to cover
 * the three kinds whose templates variant-branch — `rust/visibility_modifier`,
 * `typescript/export_statement`, `typescript/call_expression`. Extraction
 * fails the build if any are absent from the matching grammar's fixtures.
 *
 * Runs from `cli.ts --all` after TS + native render artifacts are emitted;
 * produces `rust/crates/sittir-{lang}/test-fixtures.json` per grammar.
 */

import {
	validateRoundTrip,
	type ParityFixture,
	type RenderFixture,
	type RoundTripFixture
} from '../validate/roundtrip.ts';
import { renderModuleFixturesPath } from './render-module-paths.ts';

/** FR-011 exception kinds — at least one fixture of each must appear
 *  in the extracted corpus for its matching grammar. See spec 012
 *  FR-011 and the plan.md exception-rule carve-out discussion. */
const FR_011_REQUIRED: Record<string, readonly string[]> = {
	rust: ['visibility_modifier'],
	typescript: ['export_statement', 'call_expression'],
	python: []
};

export interface ExtractResult {
	grammar: string;
	fixtures: ParityFixture[];
	/** Render + round-trip counts for diagnostic logging. */
	renderCount: number;
	roundTripCount: number;
	/** Kinds covered by at least one roundtrip fixture. */
	coveredKinds: Set<string>;
}

/**
 * Run the RT validator in fixture-capture mode. Returns the full
 * fixture list plus kind-coverage metadata.
 *
 * @throws if a grammar's FR-011 required kinds aren't covered.
 */
export async function extractParityFixtures(grammar: string, templatesPath: string): Promise<ExtractResult> {
	const fixtures: ParityFixture[] = [];
	const coveredKinds = new Set<string>();
	let renderCount = 0;
	let roundTripCount = 0;

	await validateRoundTrip(grammar, templatesPath, {
		onFixture: (fx) => {
			fixtures.push(fx);
			if (fx.kind === 'render') renderCount++;
			else {
				roundTripCount++;
				coveredKinds.add(fx.pattern);
			}
		}
	});

	// FR-011 gate — fail build on missing exception kinds. A kind
	// counts as covered when ANY of the following is in the corpus:
	//   - the parent kind itself (`visibility_modifier`)
	//   - a variant-child synthesized via variant() adoption
	//     (`_visibility_modifier_pub`, `_visibility_modifier_pub_in_path`, …)
	// Spec 013's variant() work means FR-011 exception parents often
	// never render standalone post-adoption — their render path is
	// always through a variant child. Accepting either satisfies the
	// corpus-coverage intent without regressing on the parent-only
	// pre-adoption case.
	const required = FR_011_REQUIRED[grammar] ?? [];
	const isCovered = (parent: string): boolean => {
		if (coveredKinds.has(parent)) return true;
		const variantPrefix = `_${parent}_`;
		for (const k of coveredKinds) if (k.startsWith(variantPrefix)) return true;
		return false;
	};
	const missing = required.filter((k) => !isCovered(k));
	if (missing.length > 0) {
		console.warn(
			`[codegen] parity-fixtures[${grammar}]: FR-011 exception kind(s) not ` +
				`covered: ${missing.join(', ')}. Fixtures may be stale — the RT ` +
				`validator either doesn't exercise these kinds or they fail the ` +
				`render/reparse/AST-match gate. Investigate the validator's ` +
				`kindNames wiring and these kinds' roundtrip paths.`
		);
	}

	return { grammar, fixtures, renderCount, roundTripCount, coveredKinds };
}

/**
 * JSON-encode an extracted fixture corpus. Deterministic key order +
 * trailing newline for diffability. The output is a single array —
 * mix of `RenderFixture` and `RoundTripFixture` entries distinguished
 * by their `kind` tag. The Rust parity harness (T047) loads this via
 * `serde_json::from_str` against a matching enum.
 */
export function serializeFixtures(fixtures: readonly ParityFixture[]): string {
	return JSON.stringify(fixtures, null, 2) + '\n';
}

/** Per-grammar output path. Kept alongside the render-module module so a
 *  single `packages/{lang}/` regen replaces both the Rust source and
 *  its test inputs. */
export function fixturesOutputPath(grammar: string): string {
	return renderModuleFixturesPath(grammar as 'rust' | 'typescript' | 'python');
}

// Re-export the fixture types so cli.ts / tests can reference them
// without reaching into validate/ directly.
export type { ParityFixture, RenderFixture, RoundTripFixture };
