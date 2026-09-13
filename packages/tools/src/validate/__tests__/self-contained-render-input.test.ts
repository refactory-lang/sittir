import { describe, expect, it } from 'vitest';
import { selfContainedRenderInput } from '../read-render-parse.ts';

const LEAF = 7;
const COMPOUND = 9;
const isLeafKind = (kindId: number): boolean => kindId === LEAF;
const source = 'ab()// c';

describe('selfContainedRenderInput', () => {
	it('drops every coordinate and keeps storage', () => {
		const out = selfContainedRenderInput(
			{
				$type: COMPOUND,
				$nodeHandle: 4,
				$span: { start: 0, end: 4 },
				_name: { $type: LEAF, $nodeHandle: 4, $childIndex: 0, $span: { start: 0, end: 2 } }
			},
			source,
			isLeafKind
		);
		expect(out).toEqual({
			$type: COMPOUND,
			$span: { start: 0, end: 4 },
			_name: { $type: LEAF, $span: { start: 0, end: 2 }, $text: 'ab' }
		});
	});

	it('gives a storage-less leaf its bytes and keeps a captured $text as it is', () => {
		expect(selfContainedRenderInput({ $type: LEAF, $span: { start: 0, end: 2 }, $text: 'zz' }, source, isLeafKind)).toEqual({
			$type: LEAF,
			$span: { start: 0, end: 2 },
			$text: 'zz'
		});
	});

	it('keeps a storage-less compound as its identity, never as text', () => {
		expect(
			selfContainedRenderInput({ $type: COMPOUND, $nodeHandle: 1, $span: { start: 2, end: 4 } }, source, isLeafKind)
		).toEqual({ $type: COMPOUND, $span: { start: 2, end: 4 } });
	});

	it('turns a storage-less trivia entry into its text on both sides', () => {
		const out = selfContainedRenderInput(
			{
				$type: COMPOUND,
				_x: [],
				$_trivia: {
					leading: [{ $type: 3, $nodeHandle: 1, $span: { start: 4, end: 8 } }],
					trailing: [{ $type: 3, $text: '// d', $nodeHandle: 1 }]
				}
			},
			source,
			isLeafKind
		) as { $_trivia: unknown };
		expect(out.$_trivia).toEqual({ leading: ['// c'], trailing: ['// d'] });
	});
});
