import { mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { explainFiles, pinnedTypeEscapes } from '../pinned-types.ts';

function project(): { readonly checkout: string; readonly pinned: string } {
	const top = realpathSync(mkdtempSync(join(tmpdir(), 'sittir-pinned-types-')));
	const checkout = join(top, 'checkout');
	const pinned = join(top, 'pinned');
	const file = (path: string, text: string): void => {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, text);
	};
	file(join(pinned, 'packages', 'pinned', 'index.d.ts'), 'export declare const pinned: number;\n');
	file(join(checkout, 'packages', 'live', 'package.json'), JSON.stringify({ name: '@sittir/live', types: './index.d.ts', exports: { '.': { types: './index.d.ts' } } }));
	file(join(checkout, 'packages', 'live', 'index.d.ts'), 'export declare const live: number;\n');
	file(join(checkout, 'packages', 'live', 'ref.d.ts'), 'declare const referenced: number;\n');
	file(join(checkout, 'packages', 'live', 'root.d.ts'), 'declare const rooted: number;\n');
	file(join(checkout, 'packages', 'other', 'other.ts'), 'export const other = 1;\n');
	file(join(checkout, 'packages', 'codegen', 'helper.ts'), 'export const helper = 1;\n');
	file(
		join(checkout, 'packages', 'codegen', 'emit', 'main.ts'),
		[
			'/// <reference path="../../live/ref.d.ts" />',
			"import { pinned } from '@sittir/pinned';",
			"import { live } from '@sittir/live';",
			"import { helper } from '../helper.ts';",
			"import { other } from '../../other/other.ts';",
			'export const sum = pinned + live + helper + other + referenced + rooted;',
			''
		].join('\n')
	);
	mkdirSync(join(checkout, 'node_modules', '@sittir'), { recursive: true });
	symlinkSync(join(checkout, 'packages', 'live'), join(checkout, 'node_modules', '@sittir', 'live'));
	file(
		join(checkout, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				module: 'nodenext',
				moduleResolution: 'nodenext',
				noEmit: true,
				allowImportingTsExtensions: true,
				types: ['@sittir/live'],
				paths: { '@sittir/pinned': [join(pinned, 'packages', 'pinned', 'index.d.ts')] }
			},
			include: ['packages/codegen/emit'],
			files: ['packages/live/root.d.ts']
		})
	);
	return { checkout, pinned };
}

describe('the pinned build\'s type boundary', () => {
	it('names every live package file in the program, however it got there, and only those', () => {
		const { checkout, pinned } = project();
		const cwd = process.cwd();
		const escapes = pinnedTypeEscapes(explainFiles(join(checkout, 'tsconfig.json'), cwd), { cwd, checkout, pinned });
		expect(escapes.map(({ file }) => file).sort()).toEqual(
			[
				join(checkout, 'packages', 'live', 'index.d.ts'),
				join(checkout, 'packages', 'live', 'ref.d.ts'),
				join(checkout, 'packages', 'live', 'root.d.ts'),
				join(checkout, 'packages', 'other', 'other.ts')
			].sort()
		);
		const reasons = escapes.map(({ reason }) => reason).join('\n');
		expect(reasons).toMatch(/Referenced via/);
		expect(reasons).toMatch(/files' list/);
	});
});
