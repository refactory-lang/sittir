import { computeNodeSCC } from './scc.ts';
import { tracePhaseRules, traceAssembleNodes } from './trace.ts';
import { compileGrammar, assertCompilation, type Compilation } from './compile.ts';

import { emitKindIdRust } from '../emitters/kind-id-rust.ts';
import { emitFieldIdRust } from '../emitters/field-id-rust.ts';
import { emitConfig } from '../emitters/config.ts';
import { grammarPackage, isStableGrammar, type GrammarPackage } from '../grammars.ts';
import { emitDescriptor, emitIndex } from '../emitters/index-file.ts';
import { buildNodeModel, printNodeModel } from '../emitters/node-model.ts';
import { accessorClassDiagnostics } from './model/accessor-classes.ts';
import { leadEffectsOf } from '../dsl/verbs/effects.ts';
import { bindingsPathIn, VOCABULARY_DIR } from '../bindings/facts.ts';
import { readVocabulary } from '../bindings/vocabulary.ts';
import { grammarInput } from '../bindings/input.ts';
import { emitPortable } from '../emitters/overlays/portable/index.ts';
import type { PortableTypedOutput } from '../emitters/overlays/portable/typed.ts';
import { emitApi, emitRenderEngine, spelledTriviaBuilders } from '../emitters/engine.ts';
import { rootKindIds } from '../emitters/wrap.ts';
import { emitBackend } from '../emitters/grammar-runtime.ts';
import { emitAll } from '../emitters/emit.ts';
import type { RenderModuleBundle } from '../emitters/render-module.ts';
import { loadPackageIdTables } from './generated-metadata.ts';
import { assertGrammarJsonInlineIntegrity } from './inline-sets.ts';
import { DiagnosticSink, type CompilerDiagnostic, type GrammarDiagnostic } from '../types/diagnostics.ts';
import { formatCompilerDiagnostics, formatNamingEvents } from './diagnostics/grammar-diagnostics.ts';
import { addUnnamedChoiceListener } from './collect-slots.ts';

import type { NodeMap, RawGrammar } from './types.ts';
import type { EmittedTemplates } from '../emitters/templates.ts';
import type { DroppedTokens } from './diagnostics/grammar-diagnostics.ts';
import type { GeneratedIdTables } from '../dsl/symbol-table.ts';
import type { SlotGroupingDiagnostic } from './diagnostics/slot-grouping.ts';
import { defaultTriviaForm, triviaKinds } from './model/trivia.ts';

export interface GeneratedFiles {
	types: string;
	typesInternal: string;
	kinds: string | undefined;
	portableTyped: PortableTypedOutput | undefined;
	descriptor: string;
	renderEngine: string;
	api: string;
	backend: string;
	templates: EmittedTemplates;
	factories: string;
	factoriesRecords: string;
	factoriesDispatch: string;
	tableFiles: Readonly<Record<string, string>>;
	wrap: string;
	utils: string;
	reparseHosts?: string;
	from: string;
	consts: string;
	options: string;
	index: string;
	tests: string;
	config: string;
	nodeModel: string;
	portableNodeModel: string | undefined;
	portable: string | undefined;
	portableBuild: string | undefined;
	emitDiagnostics: readonly GrammarDiagnostic[];
	is: string;
	kindIds: string;
	fieldIds: string;
	nodeMap: NodeMap;
	generatedIdTables: GeneratedIdTables;
	renderModule?: RenderModuleBundle;
	slotGroupingDiagnostics: readonly SlotGroupingDiagnostic[];
	droppedTokens: readonly DroppedTokens[];
}

export interface GenerateConfig {
	grammar: string;
	outputDir: string;
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
			process.stdout.write(formatNamingEvents(nodeMap.namingEvents) + '\n');
		}

		const rootKind = normalized.root!;
		const triviaKindNames = [...triviaKinds(nodeMap)];

		const evaluateSynthesizedKinds = collectEvaluateSynthesizedKinds(raw);

		nodeMap.scc = computeNodeSCC(nodeMap);

		const emitted = emitAll({
			grammar: cfg.grammar,
			nodeMap,
			generatedIdTables,
			inlineKinds: [...inlineKinds],
			synthesizedKinds: evaluateSynthesizedKinds,
			strict: cfg.strict,
			triviaKinds: triviaKindNames,
			rootKind,
			emitRenderModule: cfg.emitRenderModule,
			expectTestFailures: raw.expectTestFailures,
			reparseHosts: raw.reparseHosts,
			options: raw.options,
			renderAs: raw.renderAs,
			diagnostics: compilation.diagnostics
		});

		assertCompilation(compilation);

		const nodeModelData = buildNodeModel(nodeMap, generatedIdTables);
		const nodeModel = printNodeModel(nodeModelData);
		const vocabulary = await readVocabulary(VOCABULARY_DIR);
		const routesInput = await grammarInput(cfg.grammar, raw, nodeModelData, bindingsPathIn(pkg.dir), vocabulary);
		const portable = routesInput === undefined ? undefined : emitPortable(routesInput, nodeMap, emitted.kindEntries);
		const portableDiagnostics = (portable?.pickDiagnostics ?? []).map(
			({ code, path, kinds, holder, slot, arms, members }): GrammarDiagnostic => ({
				scope: 'grammar',
				grammar: cfg.grammar,
				code,
				severity: 'warning',
				canProceed: true,
				...(holder === undefined ? {} : { ownerKind: holder }),
				...(slot === undefined ? {} : { slotName: slot }),
				message:
					code === 'portable-form-product'
						? `${path}: ${kinds[0]}'s required form slots make ${arms} sibling arms`
						: code === 'portable-value-undecided'
							? `${path}: a ${slot} value builds as any of ${kinds.join(', ')}, and the grammar declares no default arm among them`
							: code === 'portable-owner-undecided'
								? `${path}: ${kinds[0]} takes ${(members ?? []).join(', ')} through two forms with the same members and kinds; nothing in the input tells them apart`
								: code === 'portable-token-ambiguous'
									? `${holder}'s slot ${slot}: ${kinds.join(', ')} share the text "${(members ?? [])[0]}", so the text alone does not pick one`
								: code === 'portable-claim-unplaced'
									? `${path}: the claim on ${kinds[0]} names no kind the grammar's model has, so nothing reads as ${path} through it`
								: code === 'portable-kind-armless'
									? `${path}: ${kinds[0]} reads as a vocabulary path, but no arm builds it${(members ?? []).length === 0 ? '' : ` (nothing fills ${(members ?? []).join(', ')})`}, so every read carries it`
								: code === 'portable-integer-partial'
									? `${path}: ${kinds[0]}'s pattern admits integer text the portable read does not parse, so a read of it can carry the node`
								: code === 'portable-value-unshaped'
									? `${path}: its $value is a number, but ${kinds[0]} has no number shape, so no read or build of it carries one`
								: `${path}: nothing picks among ${kinds.join(', ')}${holder === undefined ? ', and no holder slot admits them' : ` in ${holder}'s slot ${slot}`}`
			})
		);

		const rootTypeName = nodeMap.nodes.get(rootKind)?.typeName;
		if (rootTypeName === undefined) {
			throw new Error(
				`generate: root kind '${rootKind}' has no NodeMap entry — cannot type the engine root`
			);
		}
		const rootTreeTypeName = emitted.rootTreeTypeName;
		if (rootTreeTypeName === undefined) {
			throw new Error(
				`generate: wrap emitter named no root surface for '${rootKind}' — cannot type engine.parse()`
			);
		}

		const result: GeneratedFiles = {
			renderEngine: emitRenderEngine({ grammar: cfg.grammar, rootTypeName, rootTreeTypeName }),
			api: emitApi({
				grammar: cfg.grammar,
				rootTypeName,
				rootTreeTypeName,
				rootKinds: rootKindIds(nodeMap),
				commentCoercer: defaultTriviaForm(nodeMap)?.coercer,
				spelledTrivia: spelledTriviaBuilders(nodeMap),
				portable: portable !== undefined
			}),
			backend: emitBackend({ grammar: cfg.grammar }),
			types: emitted.types,
			typesInternal: emitted.typesInternal,
			kinds: emitted.kinds,
			descriptor: emitDescriptor({ grammar: cfg.grammar, nodeMap, portable: portable !== undefined }),
			templates: emitted.templates,
			factories: emitted.factories,
			factoriesRecords: emitted.factoriesRecords,
			factoriesDispatch: emitted.factoriesDispatch,
			tableFiles: emitted.tableFiles,
			wrap: emitted.wrap,
			utils: emitted.utils,
			reparseHosts: emitted.reparseHosts,
			from: emitted.from,
			consts: emitted.consts,
			options: emitted.options,
			index: emitIndex(),
			tests: emitted.tests,
			config: emitConfig({ grammar: cfg.grammar, stable: isStableGrammar(cfg.grammar) }),
			nodeModel,
			portableNodeModel: portable?.nodeModel,
			portable: portable?.surface,
			portableBuild: portable?.build,
			portableTyped: portable?.typed,
			emitDiagnostics: [...accessorClassDiagnostics(nodeMap, cfg.grammar, leadEffectsOf(raw.bindingEffects)), ...portableDiagnostics],
			is: emitted.is,
			kindIds: emitKindIdRust({ grammar: cfg.grammar, nodeMap, generatedIdTables }),
			fieldIds: emitFieldIdRust(cfg.grammar, generatedIdTables),
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
		generatedIdTables: await loadPackageIdTables(pkg),
		allowDiagnostics: cfg.allowDiagnostics
	});
}
