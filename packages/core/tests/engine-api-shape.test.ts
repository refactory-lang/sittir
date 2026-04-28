import { describe, expect, it } from 'vitest';
import { createJsEngine, type SittirEngineLike } from '../src/engine.ts';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
			render: () => '',
			applyEdits: (source) => source,
			dispose: () => {}
			// reader intentionally omitted
		};

		expect(engineWithoutReader.reader).toBeUndefined();
		expect(typeof engineWithoutReader.render).toBe('function');
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
			$source: 'factory' as const,
			$named: true,
			$text: 'x'
		};

		// Verify ignoreFormat option is accepted (no type error)
		const result = engine.render(node, { ignoreFormat: true });
		expect(typeof result).toBe('string');
	});
});
