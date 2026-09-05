import { describe, expect, it } from 'vitest';
import { emitEngine, emitRenderEngine } from '../engine.ts';

describe('emitEngine', () => {
	it('imports from @sittir/common/engine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain("from '@sittir/common/engine'");
	});

	it('does not contain createGrammarEngine(', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).not.toContain('createGrammarEngine(');
	});

	it('createEngine is synchronous (not async)', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain('export function createEngine');
		expect(output).not.toContain('async function createEngine');
	});

	it('createEngine returns the grammar engine synchronously (not a Promise)', () => {
		const output = emitEngine({ grammar: 'python', rootTypeName: 'Module', rootTreeTypeName: 'ModuleTree' });
		expect(output).toContain('export interface ModuleEngine');
		expect(output).toContain('): ModuleEngine {');
	});

	it('throws when native engine is unavailable (no JS-engine fallback)', () => {
		const output = emitRenderEngine({
			grammar: 'typescript',
			rootTypeName: 'Program',
			rootTreeTypeName: 'ProgramTree'
		});
		expect(output).not.toContain('createJsEngine');
		expect(output).toContain('createNativeEngine<');
		expect(output).toContain('throw new Error');
	});

	it('does not thread deprecated native transport projection through createNativeEngine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).not.toContain("import { toNativeRenderTransport } from './utils.js'");
		expect(output).not.toContain('toNativeRenderTransport,');
	});
});

describe('emitEngine root type', () => {
	it('types the diagnostics root as the data projection of the root kind', () => {
		const output = emitRenderEngine({
			grammar: 'rust',
			rootTypeName: 'SourceFile',
			rootTreeTypeName: 'SourceFileTree'
		});
		expect(output).toContain('export type SourceFileRoot = NodeDataOf<SourceFile>;');
		expect(output).toContain("import type { NodeDataOf } from '@sittir/types';");
		expect(output).not.toContain('AnyNodeData &');
	});

	it('types parse() with the wrap-emitted root surface alias', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain("import { wrapNode, type SourceFileTree } from './wrap.js';");
		expect(output).toContain('ParseEngine<SourceFileTree>');
		expect(output).toContain('const { root, tree } = engine.diagnostics.parseAndRead(source, options);');
		expect(output).toContain('return wrapNode(root, tree);');
	});
});

describe('emitRenderEngine / emitEngine split', () => {
	// The render half must never reach the wrapper. Constructed nodes carry
	// `$render()`, so `factories -> utils -> boundary` reaches the render
	// engine; a `wrap.js` import here would close a cycle back onto
	// `factories.js` and leave module init reading half-built exports.
	it('render engine imports no wrapper', () => {
		const output = emitRenderEngine({
			grammar: 'rust',
			rootTypeName: 'SourceFile',
			rootTreeTypeName: 'SourceFileTree'
		});
		expect(output).not.toContain("from './wrap.js'");
		expect(output).not.toContain('wrapNode');
		expect(output).not.toContain('parseAndRead');
	});

	it('parse lives in engine, on top of the render engine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain("from './render-engine.js'");
		expect(output).toContain("import { wrapNode, type SourceFileTree } from './wrap.js';");
		expect(output).toContain('return wrapNode(root, tree);');
		expect(output).not.toContain('createNativeEngine<');
	});
});
