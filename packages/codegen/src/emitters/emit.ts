import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import { AssembledToken } from '../compiler/model/node-map.ts';
import type { EmittedTemplates } from './templates.ts';
import type { GrammarRoles } from '../scm/extract-roles.ts';
import type { Grammar, RenderModuleBundle } from './render-module.ts';

import { FactoryEmitter } from './factories.ts';
import { FromEmitter } from './from.ts';
import { WrapEmitter } from './wrap.ts';
import { emitTypes } from './types.ts';
import { emitConsts } from './consts.ts';
import { emitIr } from './ir.ts';
import { emitIs } from './is.ts';
import { emitTests } from './test.ts';
import { TemplateEmitter } from './templates.ts';
import { emitClientUtils } from './client-utils.ts';
import { collectCatalogKinds, collectKindEntries } from './kind-discriminant.ts';
import { isRenderModuleGrammar, RenderModuleEmitter } from './render-module.ts';
import {
	classifyFactoryEmission,
	classifyFromEmission,
	classifyTemplateEmission,
	classifyWrapEmission,
	warnSkippedParserSymbol
} from './shared.ts';
import {
	emitBundleModule,
	emitFactoriesIndex,
	overlayFrame,
	overlayImportPath,
	OVERLAY_CHAIN
} from './overlays/module.ts';
import { emitRefinesOverlay } from './overlays/refines.ts';
import { emitPolymorphsOverlay } from './overlays/polymorphs.ts';
import type { OverlayName } from './overlays/module.ts';

export interface EmitAllConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	strict?: boolean;
	triviaKinds?: string[];
	grammarRoles?: GrammarRoles;
	emitRenderModule?: boolean;
	expectTestFailures?: Readonly<Record<string, string>>;
}

export interface EmitAllResult {
	factories: string;
	overlays: Record<OverlayName, string>;
	factoriesBundle: string;
	factoriesIndex: string;
	from: string;
	wrap: string;
	types: string;
	consts: string;
	irNamespace: string;
	is: string;
	tests: string;
	jinjaTemplates: EmittedTemplates;
	utils: string;
	renderModule?: RenderModuleBundle;
	rootTreeTypeName?: string;
}

type RenderModuleEmission = { tag: 'emit'; validGrammar: Grammar } | { tag: 'skip' };

function classifyRenderModuleEmission(grammar: string, emitRenderModule: boolean | undefined): RenderModuleEmission {
	if (emitRenderModule !== true) return { tag: 'skip' };
	if (!isRenderModuleGrammar(grammar)) return { tag: 'skip' };
	return { tag: 'emit', validGrammar: grammar };
}

export function emitAll(config: EmitAllConfig): EmitAllResult {
	const {
		grammar,
		nodeMap,
		generatedIdTables,
		inlineKinds,
		synthesizedKinds,
		strict,
		triviaKinds,
		grammarRoles,
		emitRenderModule,
		expectTestFailures
	} = config;
	const renderModuleEmission = classifyRenderModuleEmission(grammar, emitRenderModule);
	const kindEntries = generatedIdTables
		? collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)
		: undefined;

	const factoryEmitter = new FactoryEmitter({
		grammar,
		nodeMap,
		strict,
		generatedIdTables,
		kindEntries,
		inlineKinds,
		synthesizedKinds,
		triviaKinds
	});

	const fromEmitter = new FromEmitter({
		grammar,
		nodeMap,
		generatedIdTables,
		kindEntries
	});

	const wrapEmitter = new WrapEmitter({
		grammar,
		nodeMap,
		generatedIdTables,
		kindEntries,
		inlineKinds,
		synthesizedKinds,
		rootKind: grammarRoles?.get('root')[0]
	});

	const templateEmitter = new TemplateEmitter({ grammar, nodeMap });

	const renderModuleEmitterInst =
		renderModuleEmission.tag === 'emit'
			? new RenderModuleEmitter({
					grammar: renderModuleEmission.validGrammar,
					nodeMap,
					generatedIdTables
				})
			: undefined;

	dispatchNodeMapByTaxonomy(
		{ factoryEmitter, fromEmitter, wrapEmitter, templateEmitter, renderModuleEmitterInst },
		{ nodeMap, kindEntries, inlineKinds, synthesizedKinds }
	);

	const factories = factoryEmitter.finalize();
	const from = fromEmitter.finalize();
	const wrap = wrapEmitter.finalize();
	const jinjaTemplates = templateEmitter.finalize();
	const renderModule = renderModuleEmitterInst?.finalize(jinjaTemplates);

	const types = emitTypes({ grammar, nodeMap, generatedIdTables });
	const consts = emitConsts({ grammar, nodeMap, generatedIdTables });
	const irNamespace = emitIr({ grammar, nodeMap, generatedIdTables, grammarRoles });
	const is = emitIs({ grammar, nodeMap, generatedIdTables });
	const tests = emitTests({ grammar, nodeMap, generatedIdTables, expectTestFailures });
	const utils = emitClientUtils({ nodeMap, generatedIdTables, triviaKinds });

	const overlays: Record<OverlayName, string> = {
		refines: emitRefinesOverlay({ nodeMap }),
		polymorphs: emitPolymorphsOverlay({ nodeMap, generatedIdTables }),
		supertypes: overlayFrame(overlayImportPath(2), []).join('\n')
	};
	const factoriesBundle = emitBundleModule({ nodeMap, generatedIdTables });
	const factoriesIndex = emitFactoriesIndex(OVERLAY_CHAIN[2], { nodeMap, generatedIdTables });

	return {
		factories,
		overlays,
		factoriesBundle,
		factoriesIndex,
		from,
		wrap,
		types,
		consts,
		irNamespace,
		is,
		tests,
		jinjaTemplates,
		utils,
		renderModule,
		rootTreeTypeName: wrapEmitter.rootTreeTypeName
	};
}

interface NodeDispatchEmitters {
	readonly factoryEmitter: FactoryEmitter;
	readonly fromEmitter: FromEmitter;
	readonly wrapEmitter: WrapEmitter;
	readonly templateEmitter: TemplateEmitter;
	readonly renderModuleEmitterInst: RenderModuleEmitter | undefined;
}

interface NodeDispatchContext {
	readonly nodeMap: NodeMap;
	readonly kindEntries: ReturnType<typeof collectKindEntries> | undefined;
	readonly inlineKinds: readonly string[] | undefined;
	readonly synthesizedKinds: ReadonlySet<string> | undefined;
}

function dispatchNodeMapByTaxonomy(emitters: NodeDispatchEmitters, ctx: NodeDispatchContext): void {
	const { factoryEmitter, fromEmitter, wrapEmitter, templateEmitter, renderModuleEmitterInst } = emitters;
	const { nodeMap, kindEntries, inlineKinds, synthesizedKinds } = ctx;

	for (const [kind, node] of nodeMap.nodes) {
		const factoryEmission = classifyFactoryEmission(kind, node, {
			nodeMap,
			kindEntries,
			inlineKinds,
			synthesizedKinds
		});
		if (
			factoryEmission === 'skip-inline-kind' ||
			factoryEmission === 'skip-synthesized-kind' ||
			factoryEmission === 'skip-missing-parser-symbol'
		) {
			warnSkippedParserSymbol(kind, 'factory', factoryEmission);
		}

		const fromEmission = classifyFromEmission(kind, node, {
			nodeMap,
			kindEntries
		});
		const wrapEmission = classifyWrapEmission(kind, node, {
			kindEntries,
			inlineKinds,
			synthesizedKinds
		});
		if (
			wrapEmission === 'skip-inline-kind' ||
			wrapEmission === 'skip-synthesized-kind' ||
			wrapEmission === 'skip-missing-parser-symbol'
		) {
			warnSkippedParserSymbol(kind, 'wrap', wrapEmission);
		}
		const templateEmission = classifyTemplateEmission(node);

		switch (node.modelType) {
			case 'pattern':
			case 'enum':
				if (factoryEmission === 'emit') factoryEmitter.emitLeaf(node);
				if (fromEmission === 'emit') fromEmitter.emitLeaf(node);
				if (templateEmission === 'emit') templateEmitter.emitLeaf(node);
				renderModuleEmitterInst?.emitLeaf?.(node);
				break;
			case 'token':
				if (node instanceof AssembledToken) break;
				if (factoryEmission === 'emit') factoryEmitter.emitLeaf(node);
				if (fromEmission === 'emit') fromEmitter.emitLeaf(node);
				if (templateEmission === 'emit') templateEmitter.emitLeaf(node);
				renderModuleEmitterInst?.emitLeaf?.(node);
				break;
			case 'envelope':
			case 'branch':
			case 'polymorph':
				if (fromEmission === 'emit') fromEmitter.emitBranch(node);
				if (node.hoisted) {
					if (factoryEmission === 'emit') factoryEmitter.emitGroup(node);
					if (wrapEmission === 'emit') wrapEmitter.emitGroup(node);
					if (templateEmission === 'emit') templateEmitter.emitGroup(node);
					renderModuleEmitterInst?.emitGroup?.(node);
				} else {
					if (factoryEmission === 'emit') factoryEmitter.emitBranch(node);
					if (wrapEmission === 'emit') wrapEmitter.emitBranch(node);
					if (templateEmission === 'emit') templateEmitter.emitBranch(node);
					renderModuleEmitterInst?.emitBranch?.(node);
				}
				break;
			case 'supertype':
				if (wrapEmission === 'emit') wrapEmitter.emitSupertype(node);
				break;
			case 'list':
				if (factoryEmission === 'emit') factoryEmitter.emitSeparatedList(node);
				if (fromEmission === 'emit') fromEmitter.emitSeparatedList(node);
				if (wrapEmission === 'emit') wrapEmitter.emitSeparatedList(node);
				if (templateEmission === 'emit') templateEmitter.emitBranch(node);
				renderModuleEmitterInst?.emitBranch?.(node);
				break;
		}
		if (factoryEmission === 'emit') {
			factoryEmitter.emitRefineForms(kind, node);
		}
	}
}
