import { describe, expect, it } from 'vitest';
import { emitEngine } from '../engine.ts';

describe('emitEngine', () => {
	it('imports from @sittir/common/engine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain("from '@sittir/common/engine'");
	});

	it('does not import createJsEngine from @sittir/legacy-core/engine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).not.toContain('createJsEngine');
		expect(output).not.toContain("'@sittir/legacy-core/engine'");
	});

	it('does not contain createGrammarEngine(', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).not.toContain('createGrammarEngine(');
	});

	it('does not use dynamic import of @sittir/legacy-core/engine', () => {
		const output = emitEngine({ grammar: 'typescript', rootTypeName: 'Program', rootTreeTypeName: 'ProgramTree' });
		expect(output).not.toContain("import('@sittir/legacy-core/engine')");
	});

	it('createEngine is synchronous (not async)', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain('export function createEngine');
		expect(output).not.toContain('async function createEngine');
	});

	it('createEngine returns the grammar engine synchronously (not a Promise)', () => {
		const output = emitEngine({ grammar: 'python', rootTypeName: 'Module', rootTreeTypeName: 'ModuleTree' });
		expect(output).toContain('export interface ModuleEngine extends SittirEngineLike<ModuleRoot> {');
		expect(output).toContain('): ModuleEngine {');
	});

	it('throws when native engine is unavailable (no JS-engine fallback)', () => {
		const output = emitEngine({ grammar: 'typescript', rootTypeName: 'Program', rootTreeTypeName: 'ProgramTree' });
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
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain('export type SourceFileRoot = NodeDataOf<SourceFile>;');
		expect(output).toContain("import type { NodeDataOf } from '@sittir/types';");
		expect(output).not.toContain('AnyNodeData &');
	});

	it('types parse() with the wrap-emitted root surface alias', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile', rootTreeTypeName: 'SourceFileTree' });
		expect(output).toContain("import { wrapNode, type SourceFileTree } from './wrap.js';");
		expect(output).toContain('parse(source: string, options?: ParseOptions): SourceFileTree;');
		expect(output).toContain('const { root, tree } = engine.diagnostics.parseAndRead(source, options);');
		expect(output).toContain('return wrapNode(root, tree);');
	});
});
