import { spawnSync } from 'node:child_process';
import { ERROR_KIND_NAME } from '@sittir/common/error-kind';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { AssembledList, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import { ERROR_KIND_ROW, type GeneratedKindEntry } from '../../dsl/symbol-table.ts';
import type { RenderRule, SimplifiedRule } from '../../types/rule.ts';
import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts';
import { emitTypesModules } from '../types.ts';

function selfContainingList(kindEntries: readonly GeneratedKindEntry[]) {
	const members = [
		{ type: SYMBOL, name: 'identifier' },
		{ type: SYMBOL, name: 'tuple' }
	] as const;
	const simplifiedRule: SimplifiedRule = { type: CHOICE, members: [...members], multiplicity: 'array' };
	const renderRule: RenderRule = { type: CHOICE, members: [...members], multiplicity: 'array' };
	const nodes = new Map<string, AssembledNode>();
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('comment', new AssembledPattern('comment', { type: PATTERN, value: '#[^\\n]*' }));
	nodes.set(
		'tuple',
		new AssembledList(
			'tuple',
			{
				type: CHOICE,
				members: [...members],
				multiplicity: 'array',
				separator: { value: { type: STRING, value: ',' }, trailing: 'optional' }
			},
			undefined,
			{ separatorRule: undefined, simplifiedRule, renderRule, kindEntries }
		)
	);
	return makeNodeMapWith(nodes);
}

it.each(['typescript', 'typescript6'])(
	'compiles self-containing list argument rows with %s (#577)',
	(compiler) => {
		const root = fileURLToPath(new URL('../../../../..', import.meta.url));
		const dir = mkdtempSync(join(root, '.self-containing-list-'));
		try {
			const { nodeMap, generatedIdTables } = withGeneratedIdTables(selfContainingList);
			if (!(generatedIdTables.kindIds instanceof Map)) throw new Error('fixture kind IDs must be a map');
			generatedIdTables.kindIds.set(ERROR_KIND_NAME, ERROR_KIND_ROW);
			expect(nodeMap.nodes.get('tuple')?.modelType).toBe('list');
			const modules = emitTypesModules({ grammar: 'synth', nodeMap, generatedIdTables, triviaKinds: ['comment'] });
			writeFileSync(join(dir, 'types.ts'), modules.types);
			writeFileSync(join(dir, 'types-internal.ts'), modules.internal);
			writeFileSync(
				join(dir, 'check.ts'),
				`import type { Tuple, Identifier, NamespaceMap, TSKindId } from './types.ts';
import type { Expect, IsNever } from '../packages/types/tests/support/row-is-the-call.ts';

declare const tuple: Tuple.Bound;
declare const parsedTuple: Tuple.Parsed;
declare const identifier: Identifier.Bound;
declare function loose(...args: Tuple.LooseArgs): Tuple.Bound;
declare function strict(...args: Tuple.BuildArgs): Tuple.Bound;

loose(tuple, parsedTuple, identifier);
loose({ content: ['x', tuple, { content: ['y', parsedTuple] }] });
strict(tuple, parsedTuple, identifier);
tuple.$with.contents(tuple, parsedTuple, identifier);

type MissingRows = { [K in keyof NamespaceMap]:
  NamespaceMap[K]['LooseArgs'] extends readonly unknown[] ? never : K
}[keyof NamespaceMap];
export type EveryRowResolves = Expect<IsNever<MissingRows>>;
export type OwnRow = NamespaceMap[TSKindId.Tuple]['LooseArgs'];
// @ts-expect-error unrelated objects must not be admitted as expressions
loose({ unrelated: true });
`
			);
			writeFileSync(
				join(dir, 'tsconfig.json'),
				JSON.stringify({
					extends: '../tsconfig.json',
					compilerOptions: { noEmit: true, types: ['node'] },
					include: ['*.ts'],
					references: []
				})
			);
			const compilerPackage = createRequire(import.meta.url).resolve(`${compiler}/package.json`);
			const result = spawnSync(
				process.execPath,
				[
					join(dirname(compilerPackage), 'bin', compiler === 'typescript6' ? 'tsc6' : 'tsc'),
					'-p',
					join(dir, 'tsconfig.json'),
					'--pretty',
					'false'
				],
				{ encoding: 'utf8', timeout: 60_000 }
			);
			expect(result.error).toBeUndefined();
			expect(result.status, result.stdout + result.stderr).toBe(0);
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	},
	60_000
);
