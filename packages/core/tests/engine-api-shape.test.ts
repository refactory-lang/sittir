import { describe, expect, it } from 'vitest';
import { createJsEngine, type SittirEngineLike } from '../src/engine.ts';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Engine API shape', () => {
	it('exposes renderer surface at top level', () => {
		const engine = createJsEngine({
			templatesPath: join(__dirname, '..', '..', 'rust', 'templates'),
			parse: () => {
				throw new Error('parse not needed for this test');
			}
		});

		// Top-level renderer methods are always present
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.applyEdits).toBe('function');
		expect(typeof engine.dispose).toBe('function');
	});

	it('exposes reader surface in optional sub-object', () => {
		const engine = createJsEngine({
			templatesPath: join(__dirname, '..', '..', 'rust', 'templates'),
			parse: () => {
				throw new Error('parse not needed for this test');
			}
		});

		// Reader is present on JS engine
		expect(engine.reader).toBeDefined();
		expect(typeof engine.reader?.parseAndRead).toBe('function');
		expect(typeof engine.reader?.readNode).toBe('function');
	});

	it('reader is optional (renderer-only engines are valid)', () => {
		// Verify type system allows missing reader
		const engineWithoutReader: SittirEngineLike = {
			render: () => ({
				save: () => {},
				toString: () => '',
				print: () => ''
			}),
			applyEdits: (source) => source,
			dispose: () => {}
			// reader intentionally omitted
		};

		expect(engineWithoutReader.reader).toBeUndefined();
		expect(typeof engineWithoutReader.render).toBe('function');
	});

	it('JS engine without parse function has no reader', () => {
		// When parse is omitted, createJsEngine should not attach reader
		const engine = createJsEngine({
			templatesPath: join(__dirname, '..', '..', 'rust', 'templates')
			// parse omitted
		});

		// Reader should be absent
		expect(engine.reader).toBeUndefined();

		// But renderer methods are still present
		expect(typeof engine.render).toBe('function');
		expect(typeof engine.applyEdits).toBe('function');
		expect(typeof engine.dispose).toBe('function');
	});

	it('ignoreFormat option is part of render signature', () => {
		const engine = createJsEngine({
			templatesPath: join(__dirname, '..', '..', 'rust', 'templates'),
			parse: () => {
				throw new Error('parse not needed for this test');
			}
		});

		const node = {
			$type: 'identifier',
			$source: 2 as const,
			$named: true,
			$text: 'x'
		};

		// Verify ignoreFormat option is accepted (no type error)
		const result = engine.render(node, { ignoreFormat: true });
		expect(typeof result.toString()).toBe('string');
		expect(typeof result.save).toBe('function');
		expect(typeof result.print).toBe('function');
	});

	it('JS render handle can save and stringify output', () => {
		const engine = createJsEngine({
			templatesPath: join(__dirname, '..', '..', 'rust', 'templates')
		});

		const node = {
			$type: 'identifier',
			$source: 2 as const,
			$named: true,
			$text: 'x'
		};
		const rendered = engine.render(node);
		const dir = mkdtempSync(join(tmpdir(), 'sittir-render-'));
		const out = join(dir, 'out.txt');

		try {
			rendered.save(out);
			expect(rendered.toString()).toBe('x');
			expect(readFileSync(out, 'utf8')).toBe('x');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
