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
 * Both functions reach codegen internals (the validators read the codegen model;
 * `emitSuggested` is a codegen emitter) ONLY through the dynamic codegen-surface
 * — never a static cross-project import — so this module adds no build-fragile
 * `tools → codegen` declaration edge.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { invoke, type NodeMap, type RoundTripDiagnostic } from './codegen-surface.ts';

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
export async function emitParityFixtures(grammar: string, templatesPath: string): Promise<void> {
	const { extractParityFixtures, serializeFixtures, fixturesOutputPath } =
		await import('./validate/parity-fixtures.ts');
	const extracted = await extractParityFixtures(grammar, templatesPath);
	const fxPath = fixturesOutputPath(grammar);
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
 * factory-render-parse, from) and re-emit `overrides.suggested.ts` with the
 * collected render-parse diagnostics appended.
 *
 * Returns the total render-parse / from() failure count so the orchestrator can
 * set `process.exitCode`. Reaches codegen's `emitSuggested` emitter via the
 * dynamic codegen-surface (it consumes validation results + the NodeMap).
 */
export async function runRoundtripProbes(grammar: string, templatesDir: string, nodeMap: NodeMap): Promise<number> {
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

	// Validators take the per-rule `.jinja` templates directory path (feature
	// 011). createRenderer auto-detects directory vs legacy YAML file.
	const readRenderParseResult = await validateReadRenderParse(grammar, templatesDir, {
		backend: 'native'
	});
	console.log(formatReadRenderParseReport(readRenderParseResult));

	// Factory render-parse (corpus → readNode → factory() → render → re-parse)
	const factoryRenderParseResult = await validateFactoryRenderParse(grammar, templatesDir, 'native');
	console.log(formatFactoryRenderParseReport(factoryRenderParseResult));

	// from() correctness (structural comparison: from() vs factory())
	const fromResult = await validateFrom(grammar, 'native');
	console.log(formatFromReport(fromResult));

	// Collect render-parse failures into a structured diagnostic list and re-emit
	// overrides.suggested.ts with the new section — a copy-pasteable record of
	// input-vs-rendered for every corpus case that didn't survive the
	// render-parse path (useful for spotting missing joinBy / transform patches).
	const parseFrag = (name: string): { entry: string; kind: string } => {
		const m = name.match(/^(.+)\s+\[([^\]]+)\]$/);
		return m ? { entry: m[1]!, kind: m[2]! } : { entry: name, kind: 'unknown' };
	};
	const diagnostics: RoundTripDiagnostic[] = [];
	for (const e of readRenderParseResult.errors ?? []) {
		const { entry, kind } = parseFrag(e.name);
		diagnostics.push({
			entry,
			kind,
			source: 'render',
			category: 'parse-error',
			message: String(e.message),
			rendered: e.rendered,
			input: e.input
		});
	}
	for (const m of readRenderParseResult.astMismatches ?? []) {
		diagnostics.push({
			entry: m.entry ?? '(unknown)',
			kind: m.kind,
			source: 'render',
			category: 'ast-mismatch',
			message: String(m.message),
			rendered: m.rendered,
			input: m.input
		});
	}
	// Factory render-parse diagnostics — validator runs once per kind with
	// entry/input/rendered captured from the corpus case. Surfaces factory-API
	// gaps (missing fields, wrong defaults) the weaker kind-found pass doesn't flag.
	for (const e of factoryRenderParseResult.errors ?? []) {
		diagnostics.push({
			entry: e.entry ?? '(unknown)',
			kind: e.kind,
			source: 'factory',
			category: 'parse-error',
			message: String(e.message),
			rendered: e.rendered,
			input: e.input
		});
	}
	for (const m of factoryRenderParseResult.astMismatches ?? []) {
		diagnostics.push({
			entry: m.entry ?? '(unknown)',
			kind: m.kind,
			source: 'factory',
			category: 'ast-mismatch',
			message: String(m.message),
			rendered: m.rendered,
			input: m.input
		});
	}
	if (diagnostics.length > 0) {
		const suggestedWithFailures: string | undefined = await invoke('suggested', 'emitSuggested', {
			grammar,
			nodeMap,
			roundTripFailures: diagnostics
		});
		// overrides.suggested.ts lives at the package root, next to overrides.ts —
		// i.e. the parent of the templates directory. `undefined` means the
		// emitter has nothing to suggest (emission disabled) — skip the write
		// and clear any stale file from a prior run.
		const suggestedPath = join(dirname(templatesDir), 'overrides.suggested.ts');
		if (suggestedWithFailures !== undefined) {
			writeFile(suggestedPath, suggestedWithFailures);
			console.log(`  → overrides.suggested.ts updated with ${diagnostics.length} render-parse diagnostic(s)`);
		} else if (existsSync(suggestedPath)) {
			rmSync(suggestedPath);
		}
	}

	return readRenderParseResult.fail + factoryRenderParseResult.fail + fromResult.fail;
}
