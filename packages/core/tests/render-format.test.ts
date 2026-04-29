import { describe, it, expect } from 'vitest';
import { createRendererFromConfig } from '../src/render.ts';
import type { AnyNodeData, FormatRecord } from '../src/types.ts';

const leaf: AnyNodeData = {
	$type: 'identifier',
	$source: 'factory',
	$named: true,
	$text: 'hello'
};

const config = { rules: {} };

describe('render format resolution', () => {
	it('applies ctx.format boundary.leading', () => {
		const format: FormatRecord = { boundary: { leading: '  ' } };
		const { render } = createRendererFromConfig(config, { format });
		expect(render(leaf)).toBe('  hello');
	});

	it('ignoreFormat suppresses format application', () => {
		const format: FormatRecord = { boundary: { leading: '  ' } };
		const { render } = createRendererFromConfig(config, {
			format,
			ignoreFormat: true
		});
		expect(render(leaf)).toBe('hello');
	});

	it('ignoreFormat suppresses node.$format (not just ctx.format)', () => {
		const nodeFormat: FormatRecord = { boundary: { leading: '\t' } };
		const nodeWithFormat: AnyNodeData = { ...leaf, $format: nodeFormat };
		const { render } = createRendererFromConfig(config, { ignoreFormat: true });
		// Even though the node carries $format, ignoreFormat: true wins.
		expect(render(nodeWithFormat)).toBe('hello');
	});

	it('node.$format takes priority over ctx.format', () => {
		const ctxFormat: FormatRecord = { boundary: { leading: '  ' } };
		const nodeFormat: FormatRecord = { boundary: { leading: '\t' } };
		const nodeWithFormat: AnyNodeData = { ...leaf, $format: nodeFormat };
		const { render } = createRendererFromConfig(config, { format: ctxFormat });
		expect(render(nodeWithFormat)).toBe('\thello');
	});

	it('ctx.format.kinds[nodeType] applied for matching kind', () => {
		const format: FormatRecord = {
			kinds: { identifier: { boundary: { leading: '> ' } } }
		};
		const { render } = createRendererFromConfig(config, { format });
		expect(render(leaf)).toBe('> hello');
	});

	it('ctx.format.kinds[nodeType] not applied for non-matching kind', () => {
		const format: FormatRecord = {
			kinds: { other_kind: { boundary: { leading: '> ' } } }
		};
		const { render } = createRendererFromConfig(config, { format });
		expect(render(leaf)).toBe('hello');
	});

	it('ctx.format used as fallback when kinds does not match', () => {
		const format: FormatRecord = {
			boundary: { leading: '~ ' },
			kinds: { other_kind: { boundary: { leading: '> ' } } }
		};
		const { render } = createRendererFromConfig(config, { format });
		expect(render(leaf)).toBe('~ hello');
	});
});

describe('engine format resolution', () => {
	it('engine format wins over inferred tree format', () => {
		// @ts-expect-error - engine.ts created in Task 2
		const { resolveEngineFormat } = require('../src/engine.ts');
		const inferred: FormatRecord = { boundary: { leading: '  ' } };
		const engineFormat: FormatRecord = { boundary: { leading: '\t' } };

		expect(resolveEngineFormat(engineFormat, inferred, false)).toEqual(
			engineFormat
		);
	});

	it('detached NodeData does not borrow inferred tree format', () => {
		// @ts-expect-error - engine.ts created in Task 2
		const { resolveEngineFormat } = require('../src/engine.ts');
		const inferred: FormatRecord = { boundary: { leading: '  ' } };

		expect(resolveEngineFormat(undefined, inferred, true)).toBeUndefined();
	});
});
