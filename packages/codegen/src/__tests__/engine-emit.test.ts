import { describe, expect, it } from 'vitest';
import { emitEngine } from '../emitters/engine.ts';

describe('emitEngine', () => {
	it('imports from @sittir/common/engine', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).toContain("from '@sittir/common/engine'");
	});

	it('contains loadJsBackend for dynamic JS backend loading', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).toContain('loadJsBackend');
	});

	it('does not contain createGrammarEngine(', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).not.toContain('createGrammarEngine(');
	});

	it('does not eagerly import createJsEngine at the top level', () => {
		const output = emitEngine({ grammar: 'python' });
		// Should not have a static top-level import of createJsEngine
		const lines = output.split('\n');
		const staticImports = lines.filter(
			(l) => l.startsWith('import') && l.includes('createJsEngine')
		);
		expect(staticImports).toHaveLength(0);
	});

	it('uses dynamic import of @sittir/core/engine inside loadJsBackend', () => {
		const output = emitEngine({ grammar: 'typescript' });
		expect(output).toContain("import('@sittir/core/engine')");
	});

	it('createEngine is async', () => {
		const output = emitEngine({ grammar: 'rust' });
		expect(output).toContain('async function createEngine');
	});
});
