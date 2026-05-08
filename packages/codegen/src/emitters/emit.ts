/**
 * emit.ts — single-loop orchestrator for all codegen emitters.
 *
 * Replaces the independent `emitXxx()` calls in `generate.ts` with ONE
 * entry point (`emitAll`) that iterates `nodeMap.nodes` once and
 * dispatches to every emitter per node.
 *
 * Emitters that already have `init()`/`collect()` namespace APIs
 * (factory, from, wrap, templates) get true per-node dispatch in the loop.
 * Emitters that use category collection or complex multi-pass patterns
 * (types, ir, is, consts, test, factoryMap, clientUtils,
 * typeTests) run their existing `emitXxx()` function during finalize —
 * they keep their own internal loops for now, but the architecture is
 * set up for future migration to per-node dispatch.
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { EmittedTemplates } from './templates.ts';
import type { GrammarRoles } from '../scm/extract-roles.ts';

import { factoryEmitter } from './factories.ts';
import { fromEmitter } from './from.ts';
import { wrapEmitter } from './wrap.ts';
import { emitTypes } from './types.ts';
import { emitConsts } from './consts.ts';
import { emitIr } from './ir.ts';
import { emitIs } from './is.ts';
import { emitTests } from './test.ts';
import { emitTypeTests } from './type-test.ts';
import { templateEmitter } from './templates.ts';
import { emitFactoryMap } from './factory-map.ts';
import { emitClientUtils } from './client-utils.ts';

export interface EmitAllConfig {
	grammar: string;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	inlineKinds?: readonly string[];
	synthesizedKinds?: ReadonlySet<string>;
	strict?: boolean;
	triviaKinds?: string[];
	grammarRoles?: GrammarRoles;
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
	factoryMap: string;
	utils: string;
}

/**
 * Single-loop orchestrator: initializes all emitters, iterates
 * `nodeMap.nodes` once dispatching to each, then finalizes all.
 *
 * @param config - Union of what all emitters need.
 * @returns An object with every emitter's final output string.
 */
export function emitAll(config: EmitAllConfig): EmitAllResult {
	const { grammar, nodeMap, generatedIdTables, inlineKinds, synthesizedKinds, strict, triviaKinds, grammarRoles } =
		config;

	// -----------------------------------------------------------------
	// 1. Initialize per-node-dispatch emitters (preamble, internal state)
	// -----------------------------------------------------------------
	factoryEmitter.init({
		grammar,
		nodeMap,
		strict,
		generatedIdTables,
		inlineKinds,
		synthesizedKinds
	});

	fromEmitter.init({
		grammar,
		nodeMap,
		generatedIdTables
	});

	wrapEmitter.init({
		grammar,
		nodeMap,
		generatedIdTables,
		inlineKinds,
		synthesizedKinds
	});

	templateEmitter.init({
		grammar,
		nodeMap
	});

	// -----------------------------------------------------------------
	// 2. ONE loop — taxonomy dispatch happens HERE
	// -----------------------------------------------------------------
	for (const [kind, node] of nodeMap.nodes) {
		const emitFactory = factoryEmitter.shouldEmit(kind, node);
		const emitFrom = fromEmitter.shouldEmit(kind, node);
		const emitWrap = wrapEmitter.shouldEmit(kind, node);
		const emitTemplate = templateEmitter.shouldEmit(kind, node);

		switch (node.modelType) {
			case 'pattern':
			case 'keyword':
			case 'enum':
				if (emitFactory) factoryEmitter.emitLeaf(kind, node);
				if (emitFrom) fromEmitter.emitLeaf(node);
				if (emitTemplate) templateEmitter.emitLeaf(kind, node);
				break;
			case 'branch':
				if (emitFactory) factoryEmitter.emitBranch(kind, node);
				if (emitFrom) fromEmitter.emitBranch(node);
				if (emitWrap) wrapEmitter.emitBranch(node);
				if (emitTemplate) templateEmitter.emitBranch(kind, node);
				break;
			case 'polymorph':
				if (emitFactory) factoryEmitter.emitPolymorph(kind, node);
				if (emitFrom) fromEmitter.emitPolymorph(node);
				if (emitWrap) wrapEmitter.emitPolymorph(node);
				if (emitTemplate) templateEmitter.emitPolymorph(kind, node);
				break;
			case 'group':
				if (emitFactory) factoryEmitter.emitGroup(kind, node);
				if (emitTemplate) templateEmitter.emitGroup(kind, node);
				break;
			case 'token':
			case 'supertype':
			case 'multi':
				break;
		}
	}

	// -----------------------------------------------------------------
	// 3. Finalize per-node-dispatch emitters (footer, join, return)
	// -----------------------------------------------------------------
	const factories = factoryEmitter.finalize();
	const from = fromEmitter.finalize();
	const wrap = wrapEmitter.finalize();
	const jinjaTemplates = templateEmitter.finalize();

	// -----------------------------------------------------------------
	// 4. Run emitters that use their own internal iteration
	//    (category collection, multi-pass patterns, etc.)
	// -----------------------------------------------------------------
	const types = emitTypes({ grammar, nodeMap, generatedIdTables });
	const consts = emitConsts({ grammar, nodeMap, generatedIdTables });
	const irNamespace = emitIr({ grammar, nodeMap, generatedIdTables, grammarRoles });
	const is = emitIs({ grammar, nodeMap, generatedIdTables });
	const tests = emitTests({ grammar, nodeMap, generatedIdTables });
	const typeTests = emitTypeTests({ nodeMap, generatedIdTables });
	const factoryMap = emitFactoryMap({ grammar, nodeMap });
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
		factoryMap,
		utils
	};
}
