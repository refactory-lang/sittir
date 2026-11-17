import { describe, expect, it } from 'vitest';
import { runPinned } from '../read.ts';

describe('the pinned child emits a portable build module', () => {
	it('writes the module through the pinned builders and returns its text and diagnostics', async () => {
		const { text, diagnostics } = await runPinned('portableBuild', {
			grammar: 'python',
			api: 'PythonAPI',
			map: 'PythonMap',
			imports: { vocabulary: '@sittir/types/vocabulary', api: '../api.js', map: './map.js' },
			table: {
				builders: { passStatement: 'nullary' },
				paths: { 'statement.pass': { root: true, arms: [{ kind: 1, builder: 'passStatement', when: [], members: [], presets: [], flags: {} }] } }
			},
			members: {},
			viewed: [],
			textPaths: [],
			holes: []
		});
		expect(diagnostics).toEqual([]);
		expect(text).toContain('export function portableBuild(engine: Engine<PythonAPI>)');
		expect(text).toContain('b.passStatement()');
		expect(text).toContain('const statement_pass$1 = (_input: BuildInput<');
		expect(text).toContain('pass: statement_pass');
		expect(text).not.toContain('unbuilt');
	}, 60_000);

	it('writes only the functions a generated path reaches', async () => {
		const { text, diagnostics } = await runPinned('portableBuild', {
			grammar: 'python',
			api: 'PythonAPI',
			map: 'PythonMap',
			imports: { vocabulary: '@sittir/types/vocabulary', api: '../api.js', map: './map.js' },
			table: {
				builders: { passStatement: 'nullary', breakStatement: 'nullary' },
				paths: {
					'statement.pass': { root: true, arms: [{ kind: 1, builder: 'passStatement', when: [], members: [], presets: [], flags: {} }] },
					'statement.jump': {
						root: true,
						arms: [
							{ kind: 2, builder: 'breakStatement', when: [{ flag: 'loud', set: true }], members: [], presets: [], flags: {} },
							{ kind: 3, when: [], members: [], presets: [], flags: {} }
						]
					}
				}
			},
			members: {},
			viewed: [],
			textPaths: [],
			holes: []
		});
		expect(diagnostics.map(({ code, path }) => [code, path])).toEqual([['portable-emit-unfit-member', 'statement.jump']]);
		expect(text).toContain('const statement_pass$1 = ');
		expect(text).not.toContain('statement_jump');
	}, 60_000);

	it('spells a text holding a backslash or a quote as escapes in the string it writes', async () => {
		const { text, diagnostics } = await runPinned('portableBuild', {
			grammar: 'python',
			api: 'PythonAPI',
			map: 'PythonMap',
			imports: { vocabulary: '@sittir/types/vocabulary', api: '../api.js', map: './map.js' },
			table: {
				builders: { lineContinuation: 'config' },
				paths: { 'element.continuation': { root: true, arms: [{ kind: 2, builder: 'lineContinuation', when: [], members: [], presets: [{ steps: [{ key: 'text' }], text: "\\'" }], flags: {} }] } }
			},
			members: {},
			viewed: [],
			textPaths: [],
			holes: []
		});
		expect(diagnostics).toEqual([]);
		expect(text).toContain("b.lineContinuation({ text: '\\\\\\'' })");
	}, 60_000);

	it.each([
		[[], false],
		[[[1, 'elements']], true]
	] as const)('places a passed node by its seat kinds, and returns a hole only where the seat takes holes: %j', async (holes, holed) => {
		const { text, diagnostics } = await runPinned('portableBuild', {
			grammar: 'typescript',
			api: 'TypeScriptAPI',
			map: 'TypeScriptMap',
			imports: { vocabulary: '@sittir/types/vocabulary', api: '../api.js', map: './map.js' },
			table: {
				builders: { array: 'spread' },
				paths: {
					'expression.collection.list': { root: true, arms: [{ kind: 1, builder: 'array', when: [], members: [{ name: 'elements', steps: [{ key: 'elements' }], multiple: true, seats: [{ at: [1, 'elements'], kinds: [7, 9] }] }], presets: [], flags: {} }] }
				}
			},
			members: { 'expression.collection.list': { elements: { paths: [], texts: [], string: false } } },
			viewed: [],
			textPaths: [],
			holes
		});
		expect(diagnostics).toEqual([]);
		expect(text).toContain('if (seated(value, [7, 9])) return value;');
		expect(text).toContain("return unseated('expression.collection.list.elements', value);");
		expect(text.includes('if (value === null) return null;')).toBe(holed);
	}, 60_000);
});
