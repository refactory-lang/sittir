import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const EXAMPLES = fileURLToPath(new URL('../../examples/', import.meta.url));

const RUST_SOURCE = 'fn main() {}\n';

const PYTHON_SOURCE = [
	'def load(path, *, strict=False):',
	'    return _parse(open(path))',
	'',
	'',
	'class Reader:',
	'    def __init__(self, source):',
	'        self.source = source',
	'',
	'    def _next(self):',
	'        return self.source',
	'',
	'',
	'def _parse(text):',
	'    return text',
	''
].join('\n');

const SAMPLE_INPUTS: Readonly<Record<string, (scratch: string) => readonly unknown[]>> = {
	'02-render-round-trip:renderUntouched': () => [RUST_SOURCE],
	'02-render-round-trip:roundTrip': () => [RUST_SOURCE],
	'07-read-source:readSource': () => [RUST_SOURCE],
	'07-read-source:readFirstFunction': () => [RUST_SOURCE],
	'09-type-guards:summarizeTopLevelItems': () => [`${RUST_SOURCE}struct Config;\n`],
	'12-cross-language-migration:interfaceToPythonDataclass': () => ['interface User { name: string; age: number }\n'],
	'14-format-preserving-transform:renameProcess': () => ['fn process( x:i32 ) {\n\tx\n}\n'],
	'15-generate-file:saveCacheModule': (scratch) => [join(scratch, 'cache.rs')],
	'16-dogfooding:emitIsModule': () => [{ kinds: ['identifier', 'call_expression'] }],
	'23-read-query-with:outline': () => [PYTHON_SOURCE],
	'23-read-query-with:callsTo': () => [PYTHON_SOURCE, 'open'],
	'23-read-query-with:privateHelpers': () => [PYTHON_SOURCE],
	'23-read-query-with:methodsOf': () => [PYTHON_SOURCE, 'Reader'],
	'23-read-query-with:parameterTexts': () => [PYTHON_SOURCE, 'load'],
	'23-read-query-with:renameFunction': () => [PYTHON_SOURCE, '_next', '_advance'],
	'23-read-query-with:renameInFile': () => [PYTHON_SOURCE, 'load', 'read_file']
};

function compileCheckedModules(): string[] {
	const config = JSON.parse(readFileSync(join(EXAMPLES, 'tsconfig.json'), 'utf8')) as { include: string[] };
	return config.include
		.map((file) => file.replace(/^\.\//, '').replace(/\.ts$/, ''))
		.filter((name) => name !== 'helpers' && name !== 'index');
}

function hasRender(value: unknown): boolean {
	return value !== null && typeof value === 'object' && typeof (value as { $render?: unknown }).$render === 'function';
}

function renderedNodes(result: unknown, seen = new Set<object>()): unknown[] {
	if (result === null || typeof result !== 'object' || seen.has(result)) return [];
	seen.add(result);
	if (hasRender(result)) return [result];
	return Object.values(result).flatMap((member) => renderedNodes(member, seen));
}

describe('the compile-checked examples run', () => {
	const scratch = mkdtempSync(join(tmpdir(), 'sittir-examples-'));

	for (const name of compileCheckedModules()) {
		it(`${name}: every exported function runs, and every node it returns renders`, async () => {
			const mod = (await import(`../../examples/${name}.ts`)) as Record<string, unknown>;
			const functions = Object.entries(mod).filter(([, value]) => typeof value === 'function') as [
				string,
				(...args: unknown[]) => unknown
			][];
			expect(functions.length, `${name} exports no function to run`).toBeGreaterThan(0);
			for (const [fn, run] of functions) {
				const sample = SAMPLE_INPUTS[`${name}:${fn}`];
				if (run.length > 0 && sample === undefined) {
					throw new Error(`${name}:${fn} takes ${run.length} argument(s); give it a sample input in SAMPLE_INPUTS`);
				}
				const result = run(...(sample?.(scratch) ?? []));
				for (const node of renderedNodes(result)) {
					expect(typeof (node as { $render(): unknown }).$render(), `${name}:${fn}`).toBe('string');
				}
			}
		});
	}

	it('finds every node nested in the arrays and objects a function returns', () => {
		const leaf = { $render: () => 'x' };
		const nested = { statements: [leaf, { inner: { deeper: [leaf, { $render: () => 'y' }] } }], count: 2 };
		expect(renderedNodes(nested)).toHaveLength(2);
		expect(renderedNodes([[leaf], null, 'text', 3])).toEqual([leaf]);
	});

	it('renders the first example to the source it constructs', async () => {
		const { explicitMainFunction } = await import('../../examples/01-construct-nodes.ts');
		expect(explicitMainFunction().source).toBe('pub fn main() {}');
	});

	it('reads, queries and edits the python sample as the query example describes', async () => {
		const example = await import('../../examples/23-read-query-with.ts');
		expect(example.outline(PYTHON_SOURCE)).toEqual(['def load', 'class Reader', '  def __init__', '  def _next', 'def _parse']);
		expect(example.callsTo(PYTHON_SOURCE, 'open').map((call) => call.$render())).toEqual(['open(path)']);
		expect(example.privateHelpers(PYTHON_SOURCE)).toEqual(['_next', '_parse']);
		expect(example.methodsOf(PYTHON_SOURCE, 'Reader')).toEqual(['__init__', '_next']);
		expect(example.parameterTexts(PYTHON_SOURCE, 'load')).toEqual(['path', '*', 'strict=False']);
		expect(example.renameFunction(PYTHON_SOURCE, '_next', '_advance')?.$render()).toBe(
			'def _advance(self):\n        return self.source'
		);
		expect(example.renameInFile(PYTHON_SOURCE, 'load', 'read_file').$render()).toBe(
			PYTHON_SOURCE.replace('def load(', 'def read_file(')
		);
	});

	it('cleans up', () => {
		rmSync(scratch, { recursive: true, force: true });
	});
});
