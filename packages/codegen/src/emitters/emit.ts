/**
 * emit.ts — single-loop orchestrator for all codegen emitters.
 *
 * Replaces the independent `emitXxx()` calls in `generate.ts` with ONE
 * entry point (`emitAll`) that iterates `nodeMap.nodes` once and
 * dispatches to every emitter per node.
 *
 * Emitters that already have `collect()` namespace APIs
 * (factory, from, wrap, templates) get true per-node dispatch in the loop.
 * Emitters that use category collection or complex multi-pass patterns
 * (types, ir, is, consts, test, clientUtils,
 * typeTests) run their existing `emitXxx()` function during finalize —
 * they keep their own internal loops for now, but the architecture is
 * set up for future migration to per-node dispatch.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
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
import { emitTypeTests } from './type-test.ts';
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
	/** Kind → reason for known-failing generated tests (`expectTestFailures:`
	 *  in overrides.ts) — threaded to `emitTests` for `describe.skip` emission. */
	expectTestFailures?: Readonly<Record<string, string>>;
}

export interface EmitAllResult {
	factories: string;
	from: string;
	wrap: string;
	types: string;
	consts: string;
	irNamespace: string;
	is: string;
	tests: string;
	typeTests: string;
	jinjaTemplates: EmittedTemplates;
	utils: string;
	renderModule?: RenderModuleBundle;
}

type RenderModuleEmission = { tag: 'emit'; validGrammar: Grammar } | { tag: 'skip' };

function classifyRenderModuleEmission(grammar: string, emitRenderModule: boolean | undefined): RenderModuleEmission {
	if (emitRenderModule !== true) return { tag: 'skip' };
	if (!isRenderModuleGrammar(grammar)) return { tag: 'skip' };
	return { tag: 'emit', validGrammar: grammar };
}

/**
 * Single-loop orchestrator: initializes all emitters, iterates
 * `nodeMap.nodes` once dispatching to each, then finalizes all.
 *
 * @param config - Union of what all emitters need.
 * @returns An object with every emitter's final output string.
 */
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

	// -----------------------------------------------------------------
	// 1. Initialize per-node-dispatch emitters (preamble, internal state)
	// -----------------------------------------------------------------
	const factoryEmitter = new FactoryEmitter({
		grammar,
		nodeMap,
		strict,
		generatedIdTables,
		kindEntries,
		inlineKinds,
		synthesizedKinds
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
		synthesizedKinds
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

	// -----------------------------------------------------------------
	// 2. ONE loop — taxonomy dispatch happens HERE
	// -----------------------------------------------------------------
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
			case 'keyword':
			case 'enum':
				if (factoryEmission === 'emit') factoryEmitter.emitLeaf(node);
				if (fromEmission === 'emit') fromEmitter.emitLeaf(node);
				if (templateEmission === 'emit') templateEmitter.emitLeaf(node);
				renderModuleEmitterInst?.emitLeaf?.(node);
				break;
			case 'branch':
				if (factoryEmission === 'emit') factoryEmitter.emitBranch(node);
				if (fromEmission === 'emit') fromEmitter.emitBranch(node);
				if (wrapEmission === 'emit') wrapEmitter.emitBranch(node);
				if (templateEmission === 'emit') templateEmitter.emitBranch(node);
				renderModuleEmitterInst?.emitBranch?.(node);
				break;
			case 'group':
				if (factoryEmission === 'emit') factoryEmitter.emitGroup(node);
				if (wrapEmission === 'emit') wrapEmitter.emitGroup(node);
				if (templateEmission === 'emit') templateEmitter.emitGroup(node);
				renderModuleEmitterInst?.emitGroup?.(node);
				break;
			case 'supertype':
				if (wrapEmission === 'emit') wrapEmitter.emitSupertype(node);
				break;
			case 'token':
			case 'multi':
				break;
			// TEMPORARY (separator-as-slot Task 2 follow-up — see
			// isSlotBearingCompound's doc comment, shared.ts): template/
			// render-module still share 'branch's full emission for
			// byte-identical output. Remove once 'separatedList' gets its own
			// dedicated emission there too. wrap.ts (Task 4), factories.ts
			// (Task 6), and from.ts (Task 6 follow-up) switched over to their
			// own dedicated emission — see `emitSeparatedListWrap`'s doc
			// comment (wrap.ts), `emitSeparatedListFactory`'s doc comment
			// (factories.ts), and `emitSeparatedListFrom`'s doc comment
			// (from.ts).
			case 'separatedList':
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

	// -----------------------------------------------------------------
	// 3. Finalize per-node-dispatch emitters (footer, join, return)
	// -----------------------------------------------------------------
	const factories = factoryEmitter.finalize();
	const from = fromEmitter.finalize();
	const wrap = wrapEmitter.finalize();
	const jinjaTemplates = templateEmitter.finalize();
	const renderModule = renderModuleEmitterInst?.finalize(jinjaTemplates);

	// -----------------------------------------------------------------
	// 4. Run emitters that use their own internal iteration
	//    (category collection, multi-pass patterns, etc.)
	// -----------------------------------------------------------------
	const types = emitTypes({ grammar, nodeMap, generatedIdTables });
	const consts = emitConsts({ grammar, nodeMap, generatedIdTables });
	const irNamespace = emitIr({ grammar, nodeMap, generatedIdTables, grammarRoles });
	const is = emitIs({ grammar, nodeMap, generatedIdTables });
	const tests = emitTests({ grammar, nodeMap, generatedIdTables, expectTestFailures });
	const typeTests = emitTypeTests({ nodeMap, generatedIdTables });
	const utils = emitClientUtils({ nodeMap, generatedIdTables, triviaKinds });

	return {
		factories,
		from,
		wrap,
		types,
		consts,
		irNamespace,
		is,
		tests,
		typeTests,
		jinjaTemplates,
		utils,
		renderModule
	};
}
