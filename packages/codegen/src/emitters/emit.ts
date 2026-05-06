/**
 * emit.ts — single-loop orchestrator for all codegen emitters.
 *
 * Replaces the independent `emitXxx()` calls in `generate.ts` with ONE
 * entry point (`emitAll`) that iterates `nodeMap.nodes` once and
 * dispatches to every emitter per node.
 *
 * Emitters that already have `init()`/`collect()` namespace APIs
 * (factory, from, wrap) get true per-node dispatch in the loop.
 * Emitters that use category collection or complex multi-pass patterns
 * (types, ir, is, consts, test, templates, factoryMap, clientUtils,
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
import { emitJinjaTemplates } from './templates.ts';
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
	const {
		grammar,
		nodeMap,
		generatedIdTables,
		inlineKinds,
		synthesizedKinds,
		strict,
		triviaKinds,
		grammarRoles
	} = config;

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

	// -----------------------------------------------------------------
	// 2. ONE loop — dispatch to all per-node emitters
	// -----------------------------------------------------------------
	for (const [kind, node] of nodeMap.nodes) {
		factoryEmitter.dispatchNode(kind, node);
		fromEmitter.dispatchNode(kind, node);
		wrapEmitter.dispatchNode(kind, node);
	}

	// -----------------------------------------------------------------
	// 3. Finalize per-node-dispatch emitters (footer, join, return)
	// -----------------------------------------------------------------
	const factories = factoryEmitter.finalize();
	const from = fromEmitter.finalize();
	const wrap = wrapEmitter.finalize();

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
	const jinjaTemplates = emitJinjaTemplates({ grammar, nodeMap });
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
