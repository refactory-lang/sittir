import { computeTransportSCC } from './scc.ts';
import { tracePhaseRules, traceAssembleNodes } from './trace.ts';
import { compileGrammar, assertCompilation, type Compilation } from './compile.ts';

import { emitKindIdRust } from '../emitters/kind-id-rust.ts';
import { emitConfig } from '../emitters/config.ts';
import { grammarPackage, isStableGrammar, type GrammarPackage } from '../grammars.ts';
import { emitIndex } from '../emitters/index-file.ts';
import { emitNodeModel } from '../emitters/node-model.ts';
import { emitApi, emitRenderEngine } from '../emitters/engine.ts';
import { emitBackend } from '../emitters/grammar-runtime.ts';
import { emitAll } from '../emitters/emit.ts';
import type { RenderModuleBundle } from '../emitters/render-module.ts';
import { loadPackageIdTables } from './generated-metadata.ts';
import { extractGrammarRoles, withRootRole } from '../scm/extract-roles.ts';
import { assertGrammarJsonInlineIntegrity } from './inline-sets.ts';
import { DiagnosticSink, type CompilerDiagnostic } from '../types/diagnostics.ts';
import { formatCompilerDiagnostics, formatNamingEvents } from './diagnostics/grammar-diagnostics.ts';
import { addUnnamedChoiceListener } from './collect-slots.ts';

import type { NodeMap, IncludeFilter, RawGrammar } from './types.ts';
import type { EmittedTemplates } from '../emitters/templates.ts';
import type { DroppedTokens } from './diagnostics/grammar-diagnostics.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import type { OverlayName } from '../emitters/overlays/module.ts';
import { defaultTriviaForm, triviaKinds } from './model/trivia.ts';

export interface GeneratedFiles {
	types: string;
	typesInternal: string;
	renderEngine: string;
	api: string;
	backend: string;
	templates: EmittedTemplates;
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
	droppedTokens: readonly DroppedTokens[];
}

export interface GenerateConfig {
	grammar: string;
	outputDir: string;
	include?: IncludeFilter;
	strict?: boolean;
	emitRenderModule?: boolean;
	compilation?: Compilation;
	allowDiagnostics?: ReadonlySet<string>;
}

export async function generate(cfg: GenerateConfig): Promise<GeneratedFiles> {
	const unnamedChoiceSlotDiagnostics = new DiagnosticSink();
	const removeUnnamedChoiceListener = addUnnamedChoiceListener((kind) => {
		unnamedChoiceSlotDiagnostics.info({
			code: 'unnamed-choice-slot',
			message: `Unnamed choice slot in kind '${kind ?? '(unknown)'}'`,
			canProceed: true
		});
	});

	try {
		const compilation = cfg.compilation ?? (await compileFromPackage(grammarPackage(cfg.grammar), cfg));
		const pkg = compilation.package;
		const { generatedIdTables } = compilation;
		const { raw, linked, normalized, nodeMap } = compilation;
		tracePhaseRules('evaluate', raw.rules);
		tracePhaseRules('link', linked.rules);
		tracePhaseRules('normalize', normalized.rules);
		traceAssembleNodes('assemble', nodeMap.nodes);

		assertGrammarJsonInlineIntegrity(pkg);
		const inlineKinds = new Set(raw.inline);

		assertCompilation(compilation);

		const compilerWarnings = compilation.diagnostics
			.all()
			.filter(
				(d): d is CompilerDiagnostic => d.severity === 'warning' && (d as { scope?: unknown }).scope === 'compiler'
			);
		if (compilerWarnings.length > 0) {
			process.stderr.write(formatCompilerDiagnostics(compilerWarnings) + '\n');
		}
		if (nodeMap.namingEvents.length > 0) {
			process.stderr.write(formatNamingEvents(nodeMap.namingEvents) + '\n');
		}

		const rootKind = normalized.root!;
		const grammarRoles = withRootRole(extractGrammarRoles(pkg), rootKind);
		const triviaKindNames = [...triviaKinds(nodeMap)];

		const evaluateSynthesizedKinds = collectEvaluateSynthesizedKinds(raw);

		nodeMap.scc = computeTransportSCC(nodeMap);

		const emitted = emitAll({
			grammar: cfg.grammar,
			nodeMap,
			generatedIdTables,
			inlineKinds: [...inlineKinds],
			synthesizedKinds: evaluateSynthesizedKinds,
			strict: cfg.strict,
			triviaKinds: triviaKindNames,
			grammarRoles,
			emitRenderModule: cfg.emitRenderModule,
			expectTestFailures: raw.expectTestFailures,
			options: raw.options,
			visibleExternals: raw.visibleExternals,
			diagnostics: compilation.diagnostics
		});

		assertCompilation(compilation);

		const nodeModel = emitNodeModel({ grammar: cfg.grammar, nodeMap, generatedIdTables });

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
			renderEngine: emitRenderEngine({ grammar: cfg.grammar, rootTypeName, rootTreeTypeName }),
			api: emitApi({
				grammar: cfg.grammar,
				rootTypeName,
				rootTreeTypeName,
				commentCoercer: defaultTriviaForm(nodeMap)?.coercer
			}),
			backend: emitBackend({ grammar: cfg.grammar }),
			types: emitted.types,
			typesInternal: emitted.typesInternal,
			templates: emitted.templates,
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
			config: emitConfig({ grammar: cfg.grammar, stable: isStableGrammar(cfg.grammar) }),
			nodeModel,
			is: emitted.is,
			kindIds: generatedIdTables ? emitKindIdRust({ grammar: cfg.grammar, nodeMap, generatedIdTables }) : '',
			nodeMap,
			generatedIdTables,
			renderModule: emitted.renderModule,
			slotGroupingDiagnostics: compilation.slotGroupingDiagnostics,
			droppedTokens: emitted.templates.droppedTokens
		};
		return result;
	} finally {
		removeUnnamedChoiceListener();
	}
}

function collectEvaluateSynthesizedKinds(raw: RawGrammar): ReadonlySet<string> {
	return new Set([...raw.evaluateSynthesized].filter((kind) => raw.ruleCatalog.rootsByKind.has(kind)));
}

async function compileFromPackage(pkg: GrammarPackage, cfg: GenerateConfig): Promise<Compilation> {
	return compileGrammar({
		package: pkg,
		include: cfg.include,
		generatedIdTables: await loadPackageIdTables(pkg),
		allowDiagnostics: cfg.allowDiagnostics
	});
}
