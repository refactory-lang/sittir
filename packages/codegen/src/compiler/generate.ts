/**
 * compiler/generate.ts — pipeline entry point.
 *
 * Pipeline: evaluate → link → normalize → assemble → emitters.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluate } from './evaluate.ts';
import { link } from './link.ts';
import { normalizeGrammar as normalize, NormalizeCtx } from './normalize.ts';
import { assemble, AssembleCtx, hydrateSlotRefs, classifyNode } from './assemble.ts';
import { computeTransportSCC } from './scc.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts';
import { tracePhaseRules, traceAssembleNodes } from './trace.ts';

import { emitGrammar } from '../emitters/grammar.ts';
import { emitKindIdRust } from '../emitters/kind-id-rust.ts';
import { emitConfig } from '../emitters/config.ts';
import { emitIndex } from '../emitters/index-file.ts';
import { emitSuggested } from '../emitters/suggested.ts';
import { emitNodeModel } from '../emitters/node-model.ts';
import { emitEngine } from '../emitters/engine.ts';
import { emitAll } from '../emitters/emit.ts';
import type { RenderModuleBundle } from '../emitters/render-module.ts';
import { computeFieldStorageInfo, computeSlotClasses } from '../emitters/shared.ts';
import { loadGeneratedIdTables } from './generated-metadata.ts';
import { extractGrammarRoles } from '../scm/extract-roles.ts';
import { drainSlotGroupingDiagnostics } from './simplify.ts';
import { DiagnosticSink, type CompilerDiagnostic } from '../types/diagnostics.ts';
import { assertEmittable } from './emit-gate.ts';
import { formatCompilerDiagnostics } from './diagnostics/grammar-diagnostics.ts';
import { addUnnamedChoiceListener } from './collect-slots.ts';

import type { NodeMap, IncludeFilter, RawGrammar } from './types.ts';
import type { EmittedTemplates } from '../emitters/templates.ts';
import type { RoundTripDiagnostic } from '../emitters/suggested.ts';
import type { GeneratedIdTables } from './generated-metadata.ts'; // exposed via GeneratedFiles
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';

export interface GeneratedFiles {
	grammar: string;
	types: string;
	/** engine.ts — thin wrapper around createNativeEngine from @sittir/common/engine plus createJsEngine from @sittir/legacy-core/engine */
	engine: string;
	/** Per-rule `.jinja` files. `EmittedTemplates.bodies`
	 *  is keyed by rule kind with the full file contents (incl.
	 *  `@generated` header). Separator / flank metadata lives INLINE
	 *  in each body via `| join("<sep>")` and
	 *  `| joinWithTrailing(...)` filters; no sidecar. CLI writes each
	 *  body to `packages/<grammar>/templates/<kind>.jinja`. */
	jinjaTemplates: EmittedTemplates;
	factories: string;
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
	/** overrides.suggested.ts — human-readable derivation log. `undefined` when there's nothing to suggest (emission disabled or empty result); the caller skips writing the file in that case. */
	suggested: string | undefined;
	/** is.ts — per-grammar type guards (is/assert/isTree/isNode). */
	is: string;
	/** kind_ids.rs — per-grammar numeric KindId constants for the Rust render crate */
	kindIds: string;
	/** The intermediate NodeMap — available for inspection */
	nodeMap: NodeMap;
	/** Generated ID tables (from parser.c) — exposed for CLI callers that need
	 *  to pass them to Rust-render emitters such as render-module emission. */
	generatedIdTables?: GeneratedIdTables;
	/** Grammar-owned Rust render-module outputs, when requested by the caller. */
	renderModule?: RenderModuleBundle;
	/**
	 * Slot-grouping diagnostics accumulated during the normalize phase.
	 * Surfaced by runCodegen() via stderr so propose-promotion suggestions
	 * print during `sittir gen --all` without requiring a separate preflight run.
	 */
	slotGroupingDiagnostics: readonly SlotGroupingDiagnostic[];
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
	/** Emit grammar-owned Rust render-module artifacts in emit.ts. */
	emitRenderModule?: boolean;
}

/**
 * Generate typed factory code using the new five-phase pipeline.
 *
 * evaluate(grammar.js) → link → normalize → assemble → adapter → emitters
 */
export async function generate(cfg: GenerateConfig): Promise<GeneratedFiles> {
	// PR-G: Diagnostics accumulator for the Assemble→Project gate.
	// PR-H: threaded into phase contexts so pipeline diagnostics flow here.
	const diagnostics = new DiagnosticSink();

	// PR-H: forward unnamed-choice-slot events to the DiagnosticSink in addition
	// to the module-global accumulator (drainUnnamedChoiceSlots still works).
	// addUnnamedChoiceListener does NOT replace the primary warner, so tests that
	// install spies via setUnnamedChoiceWarner are unaffected.
	const removeUnnamedChoiceListener = addUnnamedChoiceListener((kind) => {
		diagnostics.info({
			code: 'unnamed-choice-slot',
			message: `Unnamed choice slot in kind '${kind ?? '(unknown)'}'`,
			canProceed: true
		});
	});

	// Resolve grammar.js path
	const grammarJsPath = resolveGrammarJsPath(cfg.grammar);

	// Use overrides.ts if it exists (grammar extension), else base grammar.js
	const overridesPath = resolveOverridesPath(cfg.grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	// Phase 1: Evaluate
	const raw = await evaluate(entryPath);
	tracePhaseRules('evaluate', raw.rules);
	const generatedIdTables = await loadGeneratedIdTables(cfg.grammar);

	// Phase 2: Link — pass the include filter so derivation passes
	// know whether to mutate the rule tree or only log to the sidecar. Also
	// thread the pipeline's live `diagnostics` sink (PR-S task 5) — without
	// this, Link-phase diagnostics (e.g. `non-literal-separator`) land in a
	// throwaway sink `link()` discards internally and never reach the
	// surfacing code below.
	const linked = link(raw, { include: cfg.include, generatedIdTables, diagnostics });
	tracePhaseRules('link', linked.rules);

	// Authoritative inline list from the compiled grammar.json (if present).
	// `raw.inline` only contains what the overrides callback explicitly
	// returns — base-grammar string items in `previous` are silently dropped
	// by evaluate's normalize() pass (which only handles symbol-ref objects).
	// Reading grammar.json directly gives us the full merged inline list that
	// tree-sitter itself used when compiling the parser.
	// Loaded BEFORE normalize so inlineRefs in computeSimplifiedRules can inline
	// auto-synthesized helpers (e.g., _type_arguments_repeat1) that tree-sitter
	// expands at parse time.
	//TODO: Pull into evaluate() so the inline list is available to link() and normalize() without a separate read.
	const inlineKindsArray = loadGrammarJsonInlineList(cfg.grammar);
	const inlineKinds = new Set(inlineKindsArray ?? []);

	// Inline-DECISION set for the simplify pass: which grammar.inline kinds
	// inlineRefs should substitute. The gate is "in grammar.inline AND
	// modelType is NOT a supertype / keyword / token". Supertypes are typed
	// unions referenced by name (inlining them explodes a clean union into its
	// alternatives at a seq position → non-canonical choice-at-seq); keyword /
	// token helpers are leaf lexemes that must stay as scalar slot refs. The
	// remaining inline kinds — auto-synthesized group-lift helpers (`branch`)
	// and the hidden structural helpers tree-sitter expands at parse time — ARE
	// inlined so sittir's derivation matches the flat parser output.
	//
	// NOTE: this is a SEPARATE set from `inlineKinds` above, which the emitters
	// use as the "skip emitting this inlined kind" list (emitters/shared.ts).
	// Filtering that list would un-skip supertypes/keywords and emit phantom
	// concrete kinds — so the decision set is kept distinct.
	// TODO: Pull this into simplify() so that inlineKinds is available to the simplify pass without a separate read.
	const NON_INLINABLE_MODEL_TYPES = new Set(['supertype', 'keyword', 'token', 'pattern', 'enum']);
	const inlinableKinds = new Set(
		[...inlineKinds].filter((k) => {
			const rule = linked.rules[k];
			if (!rule) return true; // un-classifiable (no IR rule) — leave inlinable
			return !NON_INLINABLE_MODEL_TYPES.has(classifyNode(k, rule, { parentAliasedKinds: linked.parentAliasedKinds }));
		})
	);

	// Build the extra polymorph skip-set for the slot-grouping diagnostic.
	// `raw.polymorphsConfig` is the `polymorphs:` / `n:` declarative path-split
	// config from overrides.ts. Each entry `{ parent: { path: suffix } }` produces
	// hidden arm rules named `_${parent}_${suffix}` (via `polymorphHiddenName`).
	// These arms are already handled by the polymorph dispatch machinery; the
	// diagnostic must not flag their multi-slot seq bodies as violations.
	// Note: the parent kinds themselves are included too, to silence the top-level
	// polymorph rule if it isn't already classified as PolymorphRule in the simplified
	// map (e.g. when all arms are inlined, the structure gets flattened).
	const polymorphsConfigSkip = new Set<string>();
	for (const [parentKind, armMap] of Object.entries(raw.polymorphsConfig ?? {})) {
		if (!armMap) continue;
		polymorphsConfigSkip.add(parentKind);
		for (const suffix of Object.values(armMap)) {
			// `polymorphHiddenName` formula: `_${parentKind}_${suffix}` for non-hidden parents
			const visibleParent = parentKind.startsWith('_') ? parentKind.slice(1) : parentKind;
			polymorphsConfigSkip.add(`_${visibleParent}_${suffix}`);
		}
	}

	// Phase 3: Normalize — build a NormalizeCtx carrying the inline-decision set
	// and polymorph skip-set; pass it to normalizeGrammar so the simplify phase
	// can read them off ctx (PR-H ctx threading).
	const normalizeCtx = new NormalizeCtx({
		grammar: linked,
		inlineKinds: inlinableKinds,
		diagnostics,
		polymorphSkip: polymorphsConfigSkip
	});
	const normalized = normalize(linked, normalizeCtx);
	tracePhaseRules('normalize', normalized.rules);
	// tracePhaseRules('simplify', simplified.rules); — `simplified` doesn't exist yet;
	// simplify() is still called inside assemble() below. Re-enable once the TODO
	// below is implemented (simplify() hoisted out and called here directly).
	//TODO: call simplify here and pass the simplified grammar to assemble() so the pipeline is evaluate → link → normalize → simplify → assemble → emitters. Currently simplify() is called inside assemble(). The pipeline should be refactored to call simplify() here and pass the simplified grammar to assemble().

	// Phase 4: Assemble — caller-owned ctx (R12): built from `normalized` via
	// the canonical factory, threading the pipeline's live DiagnosticSink.
	const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables, diagnostics));
	traceAssembleNodes('assemble', nodeMap.nodes);

	// Assemble→Project gate (PR-G). Inert until PR-L: nothing emits `fail`, so
	// the sink is empty and this never throws. Threading real diagnostics into
	// `diagnostics` is PR-H's job (phase contexts).
	assertEmittable(nodeMap, diagnostics);

	// Surface accumulated compiler-phase warnings (PR-S task 5) — e.g. the
	// link-phase `non-literal-separator` warning — to the author. `fail`
	// diagnostics already halted the pipeline via assertEmittable above.
	//
	// Deliberately scoped to `severity === 'warning'` AND `scope ===
	// 'compiler'` — NOT "every non-`fail` diagnostic". Empirically (all 3
	// real grammars), the sink already carries a pre-existing `info`-severity
	// `unnamed-choice-slot` entry, forwarded into this SAME shared sink and
	// already drained by its own `console.warn` path (`addUnnamedChoiceListener`
	// below). Reprinting it here via a blanket `!== 'fail'` filter would
	// duplicate that output on every real-grammar run — not silent, contrary
	// to this diagnostic's design. (`content-collision` is a separate case:
	// `warning`-severity, but it never reaches this sink at all — it lives in
	// `simplify.ts`'s own `_slotGroupingDiagnostics` accumulator, drained
	// independently into `GeneratedFiles.slotGroupingDiagnostics` below, so it
	// isn't part of this filter's job to begin with.) `warning` + `scope:
	// 'compiler'` is the exact vocabulary this task introduces; nothing else
	// emits at that severity/scope pair today.
	const compilerWarnings = diagnostics
		.all()
		.filter(
			(d): d is CompilerDiagnostic => d.severity === 'warning' && (d as { scope?: unknown }).scope === 'compiler'
		);
	if (compilerWarnings.length > 0) {
		process.stderr.write(formatCompilerDiagnostics(compilerWarnings) + '\n');
	}

	// Extract all semantic roles from the grammar's highlights.scm + tags.scm.
	// Trivia kinds are used to type the `$trivia()` signature in utils.ts.
	// The full GrammarRoles are passed to the ir emitter for `ir.from.*`.
	const grammarRoles = extractGrammarRoles(cfg.grammar);
	const triviaKinds = grammarRoles.get('trivia');

	// Kinds that were synthesized by evaluate's inline-alias-source pass
	// (synthesizeInlineAliasSources). These have no parser symbol because
	// tree-sitter inlined the alias body at parse time — the `_doc_comment`
	// intermediary exists only in the codegen rule map. They're intentional
	// pipeline constructs; warn-and-skip at emit time is correct.
	const evaluateSynthesizedKinds = collectEvaluateSynthesizedKinds(raw);
	computeFieldStorageInfo(nodeMap);

	// Phase 5a: Serialize the unhydrated NodeMap. `node-model.json5` is
	// JSON-stringified, so it MUST run BEFORE `hydrateSlotRefs` wires the
	// slot graph cyclically. Capture the result here; the rest of the emit
	// phase reads the hydrated form.
	const nodeModel = emitNodeModel({ grammar: cfg.grammar, nodeMap });

	// Phase 5b: Hydrate slot refs in place. After this, every
	// `slot.values[*].node` is a fully-resolved `AssembledNode` — emitters
	// read `.kind` / `.modelType` directly without the per-call-site
	// `isUnresolvedRef` fallback ternary. Throws on unresolvable refs.
	hydrateSlotRefs(nodeMap);

	// Phase 5b½: Compute slot taxonomy (singleSlot vs multiSlot) on each
	// branch/group node. Runs after hydration so stampExpressionFor can
	// resolve parameterless-kind refs through the hydrated slot graph.
	computeSlotClasses(nodeMap);

	// Phase 5b¾: Compute SCC over the singular transport-reference graph.
	// Render-module's per-slot and supertype enum emitters consult
	// `nodeMap.scc.sameSCC(variantKind, ownerKind)` to decide Box vs
	// inline for each variant — Box only when the variant can reach the
	// enum's owner kind through singular (non-Vec) references. Runs
	// after slot-class computation since the SCC walks slot graphs.
	nodeMap.scc = computeTransportSCC(nodeMap);

	// Phase 5c: Emit — every emitter consumes the hydrated NodeMap directly.
	// The ir-namespace keys are populated on each AssembledNode during
	// assemble() (see resolveIrKeys), so emitters read node.irKey
	// directly. No side-channel map plumbing, no NodeMap→Hydrated adapter.

	// Single-loop orchestrator: factory/from/wrap share ONE iteration
	// over nodeMap.nodes; other emitters run their own internal loops
	// via emitAll. See emitters/emit.ts for architecture.
	//TODO: Only input should be the NodeMap and normalized.rules (for render emission); all other inputsgeneratedIdTables, inlineKinds, etc.) should be read off the NodeMap
	const emitted = emitAll({
		grammar: cfg.grammar,
		nodeMap,
		generatedIdTables,
		inlineKinds: [...inlineKinds],
		synthesizedKinds: evaluateSynthesizedKinds,
		strict: cfg.strict,
		triviaKinds,
		grammarRoles,
		emitRenderModule: cfg.emitRenderModule
	});

	const result: GeneratedFiles = {
		grammar: emitGrammar({ grammar: cfg.grammar }),
		engine: emitEngine({ grammar: cfg.grammar }),
		types: emitted.types,
		jinjaTemplates: emitted.jinjaTemplates,
		factories: emitted.factories,
		wrap: emitted.wrap,
		utils: emitted.utils,
		from: emitted.from,
		irNamespace: emitted.irNamespace,
		consts: emitted.consts,
		index: emitIndex({ grammar: cfg.grammar, nodeMap }),
		tests: emitted.tests,
		typeTests: emitted.typeTests,
		config: emitConfig({ grammar: cfg.grammar }),
		nodeModel,
		suggested: emitSuggested({
			grammar: cfg.grammar,
			nodeMap,
			roundTripFailures: cfg.roundTripFailures
		}),
		is: emitted.is,
		kindIds: generatedIdTables ? emitKindIdRust({ grammar: cfg.grammar, nodeMap, generatedIdTables }) : '',
		nodeMap,
		generatedIdTables,
		renderModule: emitted.renderModule,
		// drain slot-grouping diagnostics accumulated during the normalize phase
		slotGroupingDiagnostics: drainSlotGroupingDiagnostics()
	};
	// Clean up the unnamed-choice listener to avoid double-forwarding on
	// subsequent generate() calls in long-lived processes.
	removeUnnamedChoiceListener();
	return result;
}

/**
 * Read the `inline` list from the compiled `grammar.json` artifact if present.
 *
 * @remarks
 * `raw.inline` (from `evaluate()`) only contains what the overrides callback
 * explicitly returns — base-grammar string items in the `previous` array are
 * silently dropped by evaluate's `normalize()` pass (which only handles
 * symbol-ref objects, not plain strings). Reading grammar.json directly gives
 * the full merged list that tree-sitter itself used when compiling the parser,
 * making it the authoritative source for "is this kind deliberately inlined?".
 *
 * Returns `undefined` when the grammar has not been compiled (no `.sittir/`
 * directory). Callers treat `undefined` the same as an empty list — no kind
 * is considered deliberately inlined.
 *
 * @param grammar - Grammar name (e.g. `'rust'`, `'typescript'`, `'python'`).
 * @returns The `inline` string array from grammar.json, or `undefined`.
 */
function loadGrammarJsonInlineList(grammar: string): readonly string[] | undefined {
	const grammarJsonPath = join(process.cwd(), 'packages', grammar, '.sittir', 'src', 'grammar.json');
	if (!existsSync(grammarJsonPath)) return undefined;
	try {
		const parsed = JSON.parse(readFileSync(grammarJsonPath, 'utf8')) as {
			inline?: unknown;
		};
		if (Array.isArray(parsed.inline) && parsed.inline.every((v) => typeof v === 'string')) {
			return parsed.inline as string[];
		}
		return undefined;
	} catch {
		return undefined;
	}
}

/**
 * Collect kinds whose root rule was synthesized by evaluate's inline-alias-
 * source pass (`synthesizeInlineAliasSources`). These have no parser symbol
 * because tree-sitter inlines the alias body at parse time — the `_${target}`
 * intermediary exists only in the codegen rule map.
 *
 * @remarks
 * The provenance is set to `'evaluate-synthesized'` on the root
 * `RuleCatalogEntry` for each synthesized rule. Emitters treat these the same
 * as inline-list kinds: warn and skip, never throw.
 *
 * @param raw - The evaluated grammar, which carries the rule catalog.
 * @returns A `ReadonlySet<string>` of synthesized kind names.
 */
function collectEvaluateSynthesizedKinds(raw: RawGrammar): ReadonlySet<string> {
	const result = new Set<string>();
	for (const [kind, rootId] of raw.ruleCatalog.rootsByKind) {
		const entry = raw.ruleCatalog.byId.get(rootId);
		if (entry?.provenance === 'evaluate-synthesized') result.add(kind);
	}
	return result;
}
