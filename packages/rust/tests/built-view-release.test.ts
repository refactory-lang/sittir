import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TSKindId } from '../src/kinds.ts';

const fixture = fileURLToPath(new URL('../../common/tests/fixtures/built-view-release.mts', import.meta.url));

function released(construction: string): unknown {
	const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture, construction], {
		cwd: fileURLToPath(new URL('..', import.meta.url)),
		encoding: 'utf8',
		env: { ...process.env, SITTIR_BACKEND: 'native' }
	});
	return JSON.parse(out.trim().split('\n').at(-1) ?? '');
}

const remade = {
	unchanged: true,
	node: true,
	leaf: 'y',
	edited: 'z()',
	sided: '{\n    y() /* c */;\n    x();\n}',
	parsedName: { $type: TSKindId.Identifier, $text: 'f', $trivia: { trailing: [{ $type: TSKindId.BlockComment, $text: '/* kept */' }] } },
	parsed: true,
	snapshots: true,
	namedRender: 'f /* kept */()',
	content: { $type: TSKindId.Identifier, $text: 'Foo' },
	aliasedRender: 'Foo()',
	envelope: true
};

describe('a built view its arena makes anew once its builder is collected', () => {
	it.each([
		['objects', false],
		['arena objects', false],
		['records', true]
	])('is the node its builder made, on %s', (construction, records) => {
		expect(released(construction)).toEqual({ ...remade, editedBuilt: records });
	}, 60_000);
});
