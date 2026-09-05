import { existsSync } from 'node:fs';
import { evaluate } from './evaluate.ts';
import { link } from './link.ts';
import { normalizeGrammar as normalize, NormalizeCtx } from './normalize.ts';
import { assemble, AssembleCtx, hydrateSlotRefs } from './assemble.ts';
import { computeTransportSCC } from './scc.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from './resolve-grammar.ts';
import { tracePhaseRules, traceAssembleNodes } from './trace.ts';

import { emitGrammar } from '../emitters/grammar.ts';
import { emitKindIdRust } from '../emitters/kind-id-rust.ts';
import { emitConfig } from '../emitters/config.ts';
import { emitIndex } from '../emitters/index-file.ts';
import { emitNodeModel } from '../emitters/node-model.ts';
import { emitEngine, emitRenderEngine } from '../emitters/engine.ts';
import { emitAll } from '../emitters/emit.ts';
import type { RenderModuleBundle } from '../emitters/render-module.ts';
import { computeFieldStorageInfo } from '../emitters/shared.ts';
import { loadGeneratedIdTables } from './generated-metadata.ts';
import { extractGrammarRoles, withRootRole } from '../scm/extract-roles.ts';
import { drainSlotGroupingDiagnostics } from './simplify.ts';
import {
	loadGrammarJsonInlineList,
	loadGrammarJsonAliasMap,
	buildInlinableKinds,
	assertGrammarJsonInlineIntegrity
} from './inline-sets.ts';
import { DiagnosticSink, type CompilerDiagnostic } from '../types/diagnostics.ts';
import { assertEmittable } from './emit-gate.ts';
import { formatCompilerDiagnostics } from './diagnostics/grammar-diagnostics.ts';
import { addUnnamedChoiceListener } from './collect-slots.ts';
import { rootRuleName } from '../util/reachable-rules.ts';

import type { NodeMap, IncludeFilter, RawGrammar } from './types.ts';
import type { EmittedTemplates } from '../emitters/templates.ts';
import type { GeneratedIdTables } from './generated-metadata.ts';
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import type { OverlayName } from '../emitters/overlays/module.ts';

export interface GeneratedFiles {
	grammar: string;
	types: string;
	engine: string;
	renderEngine: string;
	jinjaTemplates: EmittedTemplates;
	factories: string;
	overlays: Record<OverlayName, string>;
	factoriesBundle: string;
	factoriesIndex: string;
	wrap: string;
	utils: string;
	from: string;
	irNamespace: string;
	consts: string;
	options: string;
	index: string;
	tests: string;
	config: string;
	nodeModel: string;
	is: string;
	kindIds: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	renderModule?: RenderModuleBundle;
	slotGroupingDiagnostics: readonly SlotGroupingDiagnostic[];
}

export interface GenerateConfig {
	grammar: string;
	nodes?: string[];
	outputDir: string;
	include?: IncludeFilter;
	strict?: boolean;
	emitRenderModule?: boolean;
}

export async function generate(cfg: GenerateConfig): Promise<GeneratedFiles> {
	const diagnostics = new DiagnosticSink();

	const removeUnnamedChoiceListener = addUnnamedChoiceListener((kind) => {
		diagnostics.info({
			code: 'unnamed-choice-slot',
			message: `Unnamed choice slot in kind '${kind ?? '(unknown)'}'`,
			canProceed: true
		});
	});

	const grammarJsPath = resolveGrammarJsPath(cfg.grammar);

	const overridesPath = resolveOverridesPath(cfg.grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);
	tracePhaseRules('evaluate', raw.rules);
	const generatedIdTables = await loadGeneratedIdTables(cfg.grammar);

	const linked = link(raw, { include: cfg.include, generatedIdTables, diagnostics });
	tracePhaseRules('link', linked.rules);

	assertGrammarJsonInlineIntegrity(cfg.grammar);
	const inlineKindsArray = loadGrammarJsonInlineList(cfg.grammar);
	const inlineKinds = new Set(inlineKindsArray ?? []);

	const inlinableKinds = buildInlinableKinds(inlineKinds, linked);

	const normalizeCtx = new NormalizeCtx({
		grammar: linked,
		inlineKinds: inlinableKinds,
		diagnostics
	});
	const normalized = normalize(linked, normalizeCtx);
	tracePhaseRules('normalize', normalized.rules);

	const nodeMap = assemble(
		AssembleCtx.from(normalized, generatedIdTables, diagnostics, loadGrammarJsonAliasMap(cfg.grammar))
	);
	traceAssembleNodes('assemble', nodeMap.nodes);

	assertEmittable(nodeMap, diagnostics);

	const compilerWarnings = diagnostics
		.all()
		.filter(
			(d): d is CompilerDiagnostic => d.severity === 'warning' && (d as { scope?: unknown }).scope === 'compiler'
		);
	if (compilerWarnings.length > 0) {
		process.stderr.write(formatCompilerDiagnostics(compilerWarnings) + '\n');
	}

	const rootKind = rootRuleName(normalized.rules)!;
	const grammarRoles = withRootRole(extractGrammarRoles(cfg.grammar), rootKind);
	const triviaKinds = grammarRoles.get('trivia');

	const evaluateSynthesizedKinds = collectEvaluateSynthesizedKinds(raw);

	const nodeModel = emitNodeModel({ grammar: cfg.grammar, nodeMap });

	hydrateSlotRefs(nodeMap);

	nodeMap.scc = computeTransportSCC(nodeMap);

	const emitted = emitAll({
		grammar: cfg.grammar,
		nodeMap,
		generatedIdTables,
		inlineKinds: [...inlineKinds],
		synthesizedKinds: evaluateSynthesizedKinds,
		strict: cfg.strict,
		triviaKinds,
		grammarRoles,
		emitRenderModule: cfg.emitRenderModule,
		expectTestFailures: raw.expectTestFailures,
		renderDefaults: raw.renderDefaults,
		visibleExternals: raw.visibleExternals
	});

	const rootTypeName = nodeMap.nodes.get(grammarRoles.get('root')[0]!)?.typeName;
	if (rootTypeName === undefined) {
		throw new Error(
			`generate: root kind '${grammarRoles.get('root')[0]}' has no NodeMap entry — cannot type the engine root`
		);
	}
	const rootTreeTypeName = emitted.rootTreeTypeName;
	if (rootTreeTypeName === undefined) {
		throw new Error(
			`generate: wrap emitter named no root surface for '${grammarRoles.get('root')[0]}' — cannot type engine.parse()`
		);
	}

	const result: GeneratedFiles = {
		grammar: emitGrammar({ grammar: cfg.grammar }),
		engine: emitEngine({ grammar: cfg.grammar, rootTypeName, rootTreeTypeName }),
		renderEngine: emitRenderEngine({ grammar: cfg.grammar, rootTypeName, rootTreeTypeName }),
		types: emitted.types,
		jinjaTemplates: emitted.jinjaTemplates,
		factories: emitted.factories,
		overlays: emitted.overlays,
		factoriesBundle: emitted.factoriesBundle,
		factoriesIndex: emitted.factoriesIndex,
		wrap: emitted.wrap,
		utils: emitted.utils,
		from: emitted.from,
		irNamespace: emitted.irNamespace,
		consts: emitted.consts,
		options: emitted.options,
		index: emitIndex({ grammar: cfg.grammar, nodeMap }),
		tests: emitted.tests,
		config: emitConfig({ grammar: cfg.grammar }),
		nodeModel,
		is: emitted.is,
		kindIds: generatedIdTables ? emitKindIdRust({ grammar: cfg.grammar, nodeMap, generatedIdTables }) : '',
		nodeMap,
		generatedIdTables,
		renderModule: emitted.renderModule,
		slotGroupingDiagnostics: drainSlotGroupingDiagnostics()
	};
	removeUnnamedChoiceListener();
	return result;
}

function collectEvaluateSynthesizedKinds(raw: RawGrammar): ReadonlySet<string> {
	const result = new Set<string>();
	for (const [kind, rootId] of raw.ruleCatalog.rootsByKind) {
		const entry = raw.ruleCatalog.byId.get(rootId);
		if (entry?.provenance === 'evaluate-synthesized') result.add(kind);
	}
	return result;
}
