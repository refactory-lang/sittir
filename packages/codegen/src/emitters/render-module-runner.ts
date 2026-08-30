import type { NodeMap } from '../compiler/types.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';
import type { EmittedTemplates } from './templates.ts';
import type { Grammar, RenderModuleBundle } from './render-module.ts';
import { RenderModuleEmitter } from './render-module.ts';
import { TemplateEmitter } from './templates.ts';
import { AssembledKeyword, AssembledSupertype } from '../compiler/model/node-map.ts';

export interface RunRenderModuleEmitterConfig {
	grammar: Grammar;
	nodeMap: NodeMap;
	generatedIdTables?: GeneratedIdTables;
	jinjaTemplates?: EmittedTemplates;
}

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
			case 'enum':
				templateEmitter.emitLeaf?.(node);
				renderModuleEmitter.emitLeaf?.(node);
				break;
			case 'token':
				if (node instanceof AssembledKeyword) {
					templateEmitter.emitLeaf?.(node);
					renderModuleEmitter.emitLeaf?.(node);
				}
				break;
			case 'branch':
			case 'envelope':
				if (node.hoisted) {
					templateEmitter.emitGroup?.(node);
					renderModuleEmitter.emitGroup?.(node);
				} else {
					templateEmitter.emitBranch?.(node);
					renderModuleEmitter.emitBranch?.(node);
				}
				break;
			case 'polymorph':
				if (node instanceof AssembledSupertype) break;
				if (node.hoisted) {
					templateEmitter.emitGroup?.(node);
					renderModuleEmitter.emitGroup?.(node);
				} else {
					templateEmitter.emitBranch?.(node);
					renderModuleEmitter.emitBranch?.(node);
				}
				break;
			case 'list':
				templateEmitter.emitBranch?.(node);
				renderModuleEmitter.emitBranch?.(node);
				break;
		}
	}

	const templates = config.jinjaTemplates ?? templateEmitter.finalize();
	return renderModuleEmitter.finalize(templates);
}
