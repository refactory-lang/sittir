/**
 * post-generate — the validation/fixture work that runs AFTER codegen has
 * written all generated artifacts.
 *
 * This is the tools-side half of the codegen/validation decouple (R9): codegen
 * (`@sittir/codegen`'s `runCodegen`) now ONLY generates + builds, returning its
 * `NodeMap`. The cli orchestrator (`gen` command) then calls these functions to
 * run the post-generation validation passes that used to live inline in
 * run-codegen. That severs the `codegen → tools` dependency edge — validation is
 * a tool, so it lives here.
 *
 * Both functions reach codegen internals (the validators read the codegen model)
 * ONLY through the dynamic codegen-surface
 * — never a static cross-project import — so this module adds no build-fragile
 * `tools → codegen` declaration edge.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Content-aware write: skip the write when the file already holds identical
 * bytes, so unchanged outputs keep stable mtimes (mirrors the helper in
 * codegen's run-codegen — a pure fs utility, intentionally duplicated rather
 * than imported across the package boundary).
 */
function writeFile(path: string, content: string): void {
	if (existsSync(path)) {
		try {
			if (readFileSync(path, 'utf8') === content) return;
		} catch {
			// Unreadable existing file — fall through and overwrite.
		}
	}
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, 'utf8');
}

/**
 * Extract and write the Rust parity fixtures (spec 012 T045/T046).
 *
 * Runs the round-trip validator in fixture-capture mode — a POST-BUILD pass:
 * every successfully round-tripped kind emits a paired (render, roundtrip)
 * fixture, written to `rust/crates/sittir-{grammar}/test-fixtures.json` where the
 * Rust parity harness (T047) reads it via serde_json.
 *
 * MUST run after the napi rebuild (which `runCodegen` performs before returning):
 * the validator's wrapped-tree candidate walk requires the NATIVE engine, and
 * Askama bakes the just-emitted templates into the .node at compile time, so
 * extracting before the rebuild would capture fixtures against stale templates.
 *
 * The FR-011 required-kinds gate lives in `extractParityFixtures` — it throws
 * when the corpus doesn't cover the exception kinds, so regen fails loudly rather
 * than emitting an insufficient fixture set.
 */
export async function emitParityFixtures(grammar: string): Promise<void> {
	const { extractParityFixtures, serializeFixtures, fixturesOutputPath } =
		await import('./validate/parity-fixtures.ts');
	const extracted = await extractParityFixtures(grammar);
	const fxPath = fixturesOutputPath(grammar);

	// Refuse to clobber a non-trivial committed fixture set with an empty
	// extraction. A zero-candidate result means the corpus walk never got a
	// working native engine (debug build refused, stale binary, missing
	// binary) — extractParityFixtures/validateReadRenderParse swallow that
	// per-candidate rather than throwing, so without this guard the failure
	// is invisible: this function would silently overwrite real fixture
	// data with `[]`. Surface it loudly instead.
	if (extracted.fixtures.length === 0 && existsSync(fxPath)) {
		let existingCount = 0;
		try {
			existingCount = JSON.parse(readFileSync(fxPath, 'utf8')).length;
		} catch {
			// Unreadable/malformed existing file — nothing to protect.
		}
		if (existingCount > 0) {
			throw new Error(
				`emitParityFixtures[${grammar}]: extraction produced 0 fixtures, refusing to ` +
					`overwrite ${fxPath} (currently ${existingCount} fixtures). The native engine ` +
					`likely failed to load for this grammar (debug build refused, stale binary, or ` +
					`missing .node) — check the console output above for the real error, rebuild ` +
					`release native bindings, and re-run.`
			);
		}
	}

	writeFile(fxPath, serializeFixtures(extracted.fixtures));
	console.log(
		`    ${fxPath} (${extracted.renderCount} render + ${extracted.roundTripCount} roundtrip, ${extracted.coveredKinds.size} kinds)`
	);
	// Surface FR-011 coverage gap warnings as non-fatal stderr messages.
	for (const w of extracted.warnings) {
		process.stderr.write(`[warning] ${w}\n`);
	}
}

/**
 * Run the corpus round-trip validator probes (read-projection, read-render-parse,
 * factory-render-parse, from).
 *
 * Returns the total render-parse / from() failure count so the orchestrator can
 * set `process.exitCode`.
 */
export async function runRoundtripProbes(grammar: string): Promise<number> {
	console.log('\nRunning validator probes...');

	const { validateReadProjection, formatReadProjectionReport } = await import('./validate/read-projection.ts');
	const { validateReadRenderParse, formatReadRenderParseReport } = await import('./validate/read-render-parse.ts');
	const { validateFactoryRenderParse, formatFactoryRenderParseReport } =
		await import('./validate/factory-render-parse.ts');
	const { validateFrom, formatFromReport } = await import('./validate/from.ts');

	// read projection (structural) — upstream of render/factory. A regression
	// here means readNode is losing content between tree-sitter's parse tree and
	// the NodeData shape, so every downstream validator will mis-report.
	const readProjectionResult = await validateReadProjection(grammar);
	console.log(formatReadProjectionReport(readProjectionResult));

	const readRenderParseResult = await validateReadRenderParse(grammar, {
		backend: 'native'
	});
	console.log(formatReadRenderParseReport(readRenderParseResult));

	// Factory render-parse (corpus → readNode → factory() → render → re-parse)
	const factoryRenderParseResult = await validateFactoryRenderParse(grammar, 'native');
	console.log(formatFactoryRenderParseReport(factoryRenderParseResult));

	// from() correctness (structural comparison: from() vs factory())
	const fromResult = await validateFrom(grammar, 'native');
	console.log(formatFromReport(fromResult));

	return readRenderParseResult.fail + factoryRenderParseResult.fail + fromResult.fail;
}
