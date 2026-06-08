/**
 * render-module-runner.ts — thin adapter that drives the class-based
 * RenderModuleEmitter contract for scripts and focused unit tests.
 *
 * Using this adapter instead of calling emitRenderModuleBundle directly
 * ensures scripts and tests exercise the same emitter contract as emitAll().
 */

import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { EmittedTemplates } from './templates.ts';
import type { Grammar, RenderModuleBundle } from './render-module.ts';
import { RenderModuleEmitter } from './render-module.ts';
import { TemplateEmitter } from './templates.ts';

export interface RunRenderModuleEmitterConfig {
	grammar: Grammar;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	/** Pre-computed jinja templates. When omitted, a fresh TemplateEmitter drives the loop. */
	jinjaTemplates?: EmittedTemplates;
}

/**
 * Drive the class-based emitter contract for render-module emission.
 * Mirrors the loop that emitAll() runs, but narrowed to TemplateEmitter
 * and RenderModuleEmitter. Use this in scripts and tests instead of
 * calling emitRenderModuleBundle directly.
 */
export function runRenderModuleEmitter(config: RunRenderModuleEmitterConfig): RenderModuleBundle {
	const templateEmitter = new TemplateEmitter({ grammar: config.grammar, nodeMap: config.nodeMap });
	const renderModuleEmitter = new RenderModuleEmitter({
		grammar: config.grammar,
		nodeMap: config.nodeMap,
		generatedIdTables: config.generatedIdTables
	});

	for (const [, node] of config.nodeMap.nodes) {
		switch (node.modelType) {
			case 'pattern':
			case 'keyword':
			case 'enum':
				templateEmitter.emitLeaf?.(node);
				renderModuleEmitter.emitLeaf?.(node);
				break;
			case 'branch':
				templateEmitter.emitBranch?.(node);
				renderModuleEmitter.emitBranch?.(node);
				break;
			case 'group':
				templateEmitter.emitGroup?.(node);
				renderModuleEmitter.emitGroup?.(node);
				break;
			case 'token':
			case 'supertype':
			case 'multi':
				break;
		}
	}

	const templates = config.jinjaTemplates ?? templateEmitter.finalize();
	return renderModuleEmitter.finalize(templates);
}
