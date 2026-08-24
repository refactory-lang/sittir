import { describe, expect, it } from 'vitest';
import { emitEngine } from '../engine.ts';

describe('emitEngine', () => {
	it('imports from @sittir/common/engine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile' });
		expect(output).toContain("from '@sittir/common/engine'");
	});

	it('does not import createJsEngine from @sittir/legacy-core/engine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile' });
		expect(output).not.toContain('createJsEngine');
		expect(output).not.toContain("'@sittir/legacy-core/engine'");
	});

	it('does not contain createGrammarEngine(', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile' });
		expect(output).not.toContain('createGrammarEngine(');
	});

	it('does not use dynamic import of @sittir/legacy-core/engine', () => {
		const output = emitEngine({ grammar: 'typescript', rootTypeName: 'Program' });
		expect(output).not.toContain("import('@sittir/legacy-core/engine')");
	});

	it('createEngine is synchronous (not async)', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile' });
		expect(output).toContain('export function createEngine');
		expect(output).not.toContain('async function createEngine');
	});

	it('createEngine returns SittirEngineLike (not Promise)', () => {
		const output = emitEngine({ grammar: 'python', rootTypeName: 'Module' });
		expect(output).toContain('): SittirEngineLike<ModuleRoot> {');
	});

	it('throws when native engine is unavailable (no JS-engine fallback)', () => {
		const output = emitEngine({ grammar: 'typescript', rootTypeName: 'Program' });
		expect(output).not.toContain('createJsEngine');
		expect(output).toContain('createNativeEngine<');
		expect(output).toContain('throw new Error');
	});

	it('does not thread deprecated native transport projection through createNativeEngine', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile' });
		expect(output).not.toContain("import { toNativeRenderTransport } from './utils.js'");
		expect(output).not.toContain('toNativeRenderTransport,');
	});
});

describe('emitEngine root type', () => {
	it('types the reader root as the data projection of the root kind', () => {
		const output = emitEngine({ grammar: 'rust', rootTypeName: 'SourceFile' });
		expect(output).toContain('export type SourceFileRoot = NodeDataOf<SourceFile>;');
		expect(output).toContain("import type { NodeDataOf } from '@sittir/types';");
		expect(output).not.toContain('AnyNodeData &');
	});
});
