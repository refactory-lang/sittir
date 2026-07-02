import { describe, expect, it } from 'vitest';
import { emitEngine } from '../engine.ts';

describe('emitEngine', () => {
	it('imports from @sittir/common/engine', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).toContain("from '@sittir/common/engine'");
	});

	it('imports createJsEngine from @sittir/core/engine at the top level', () => {
		const output = emitEngine({ grammar: 'rust' });
		const lines = output.split('\n');
		const staticImports = lines.filter(
			(l) => l.startsWith('import') && l.includes('createJsEngine')
		);
		expect(staticImports.length).toBeGreaterThan(0);
		expect(staticImports[0]).toContain("'@sittir/core/engine'");
	});

	it('does not contain createGrammarEngine(', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).not.toContain('createGrammarEngine(');
	});

	it('does not use dynamic import of @sittir/core/engine', () => {
		const output = emitEngine({ grammar: 'typescript' });
		expect(output).not.toContain("import('@sittir/core/engine')");
	});

	it('createEngine is synchronous (not async)', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).toContain('export function createEngine');
		expect(output).not.toContain('async function createEngine');
	});

	it('createEngine returns SittirEngineLike (not Promise)', () => {
		const output = emitEngine({ grammar: 'python' });
		expect(output).toContain('): SittirEngineLike {');
	});

	it('falls back to createJsEngine when native is not available', () => {
		const output = emitEngine({ grammar: 'typescript' });
		expect(output).toContain('createJsEngine(');
		expect(output).toContain('createNativeEngine(');
	});

	it('does not thread deprecated native transport projection through createNativeEngine', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).not.toContain("import { toNativeRenderTransport } from './utils.js'");
		expect(output).not.toContain('toNativeRenderTransport,');
	});
});
