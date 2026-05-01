/**
 * compiler/generate.ts — pipeline entry point.
 *
 * Pipeline: evaluate → link → optimize → assemble → emitters.
 */

import { existsSync } from 'node:fs';
import { evaluate } from './evaluate.ts';
import { link } from './link.ts';
import { optimize } from './optimize.ts';
import { assemble } from './assemble.ts';
import {
	resolveGrammarJsPath,
	resolveOverridesPath
} from './resolve-grammar.ts';
import { tracePhaseRules, traceAssembleNodes } from './trace.ts';

import { emitGrammar } from '../emitters/grammar.ts';
import { emitTypes } from '../emitters/types.ts';
import { emitJinjaTemplates } from '../emitters/templates.ts';
import { emitFactories } from '../emitters/factories.ts';
import { emitFactoryMap } from '../emitters/factory-map.ts';
import { emitWrap } from '../emitters/wrap.ts';
import { emitFrom } from '../emitters/from.ts';
import { emitClientUtils } from '../emitters/client-utils.ts';
import { emitKindIdRust } from '../emitters/kind-id-rust.ts';
import { emitIr } from '../emitters/ir.ts';
import { emitTests } from '../emitters/test.ts';
import { emitTypeTests } from '../emitters/type-test.ts';
import { emitConfig } from '../emitters/config.ts';
import { emitConsts } from '../emitters/consts.ts';
import { emitIndex } from '../emitters/index-file.ts';
import { emitSuggested } from '../emitters/suggested.ts';
import { emitIs } from '../emitters/is.ts';
import { emitNodeModel } from '../emitters/node-model.ts';
import { loadGeneratedIdTables } from './generated-metadata.ts';

import type { NodeMap, IncludeFilter } from './types.ts';
import type { EmittedTemplates } from '../emitters/templates.ts';
import type { RoundTripDiagnostic } from '../emitters/suggested.ts';
import type { GeneratedIdTables } from './generated-metadata.ts'; // exposed via GeneratedFiles

export interface GeneratedFiles {
	grammar: string;
	types: string;
	/** Per-rule `.jinja` files (feature 011). `EmittedTemplates.bodies`
	 *  is keyed by rule kind with the full file contents (incl.
	 *  `@generated` header). Separator / flank metadata lives INLINE
	 *  in each body via `| join("<sep>")` and
	 *  `| joinWithTrailing(...)` filters; no sidecar. CLI writes each
	 *  body to `packages/<grammar>/templates/<kind>.jinja`. */
	jinjaTemplates: EmittedTemplates;
	factories: string;
	/** factory-map.json5 — validator-only factory metadata (shapes,
	 * alias map, field-only-factory list). See emitters/factory-map.ts. */
	factoryMap: string;
	wrap: string;
	utils: string;
	from: string;
	irNamespace: string;
	consts: string;
	index: string;
	tests: string;
	typeTests: string;
	config: string;
	nodeModel: string;
	/** overrides.suggested.ts — human-readable derivation log (T042f). */
	suggested: string;
	/** is.ts — per-grammar type guards (is/assert/isTree/isNode, spec 008 US2) */
	is: string;
	/** kind_ids.rs — per-grammar numeric KindId constants for the Rust render crate */
	kindIds: string;
	/** The intermediate NodeMap — available for inspection */
	nodeMap: NodeMap;
	/** Generated ID tables (from parser.c) — exposed for CLI callers that need
	 *  to pass them to Rust-render emitters such as emitRenderModule. */
	generatedIdTables?: GeneratedIdTables;
}

export interface GenerateConfig {
	grammar: string;
	nodes?: string[];
	outputDir: string;
	/**
	 * Which derived source tags are accepted into the rule tree.
	 * Defaults to all derived sources (permissive). `grammar` and
	 * `override` are always-on and can't be filtered out — this
	 * controls which DERIVATIONS Link's inference / promotion passes
	 * mutate the rule tree with.
	 *
	 * Entries EXCLUDED from this filter still appear in the
	 * `derivations` log (and therefore in `overrides.suggested.ts`)
	 * so you can review what Link inferred and either adopt it into
	 * overrides.ts or leave it in the log.
	 *
	 * @example
	 * // Strict base pipeline — no inference / promotion:
	 * { include: { rules: [], fields: [] } }
	 *
	 * // Accept promotion, review inference:
	 * { include: { rules: ['promoted'], fields: [] } }
	 *
	 * // Default (permissive): everything applied.
	 * { include: undefined }
	 */
	include?: IncludeFilter;
	/**
	 * Emit runtime validation in leaf factories (regex check against
	 * the grammar's declared pattern). Default `false` — enum
	 * factories always validate, keywords have nothing to check, but
	 * leaf patterns can diverge from JS RegExp syntax (Unicode
	 * property escapes without the `u` flag, PCRE-only features) so
	 * opt-in avoids surprising the non-strict call sites.
	 */
	strict?: boolean;
	/**
	 * Round-trip failure diagnostics to surface in overrides.suggested.ts.
	 * Collected by the CLI `--roundtrip` flag; when absent, the suggested
	 * emitter skips the round-trip section. Passing empty or omitting
	 * produces the same output — the emitter only adds the section
	 * when at least one diagnostic exists.
	 */
	roundTripFailures?: readonly RoundTripDiagnostic[];
}

/**
 * Generate typed factory code using the new five-phase pipeline.
 *
 * evaluate(grammar.js) → link → optimize → assemble → adapter → emitters
 */
export async function generate(cfg: GenerateConfig): Promise<GeneratedFiles> {
	// Resolve grammar.js path
	const grammarJsPath = resolveGrammarJsPath(cfg.grammar);

	// Use overrides.ts if it exists (grammar extension), else base grammar.js
	const overridesPath = resolveOverridesPath(cfg.grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	// Phase 1: Evaluate
	const raw = await evaluate(entryPath);
	tracePhaseRules('evaluate', raw.rules);

	// Phase 2: Link — pass the include filter so derivation passes
	// know whether to mutate the rule tree or only log to the sidecar.
	const linked = link(raw, cfg.include);
	tracePhaseRules('link', linked.rules);

	// Phase 3: Optimize
	const optimized = optimize(linked);
	tracePhaseRules('optimize', optimized.rules);
	tracePhaseRules('simplify', optimized.simplifiedRules);

	// Phase 4: Assemble
	const nodeMap = assemble(optimized);
	traceAssembleNodes(
		'assemble',
		nodeMap.nodes as unknown as Map<string, never>
	);
	const generatedIdTables = await loadGeneratedIdTables(cfg.grammar);

	// Phase 5: Emit — every emitter consumes NodeMap directly. The
	// ir-namespace keys are populated on each AssembledNode during
	// assemble() (see resolveIrKeys), so emitters read node.irKey
	// directly. No side-channel map plumbing, no NodeMap→Hydrated adapter.
	return {
		grammar: emitGrammar({ grammar: cfg.grammar }),
		types: emitTypes({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		jinjaTemplates: emitJinjaTemplates({ grammar: cfg.grammar, nodeMap }),
		factories: emitFactories({
			grammar: cfg.grammar,
			nodeMap,
			strict: cfg.strict,
			generatedIdTables
		}),
		factoryMap: emitFactoryMap({ grammar: cfg.grammar, nodeMap }),
		wrap: emitWrap({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		utils: emitClientUtils({ nodeMap, generatedIdTables }),
		from: emitFrom({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		irNamespace: emitIr({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		consts: emitConsts({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		index: emitIndex({ grammar: cfg.grammar, nodeMap }),
		tests: emitTests({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		typeTests: emitTypeTests({ nodeMap, generatedIdTables }),
		config: emitConfig({ grammar: cfg.grammar }),
		nodeModel: emitNodeModel({ grammar: cfg.grammar, nodeMap }),
		suggested: emitSuggested({
			grammar: cfg.grammar,
			nodeMap,
			roundTripFailures: cfg.roundTripFailures
		}),
		is: emitIs({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
		kindIds: generatedIdTables
			? emitKindIdRust({ grammar: cfg.grammar, nodeMap, generatedIdTables })
			: '',
		nodeMap,
		generatedIdTables
	};
}
