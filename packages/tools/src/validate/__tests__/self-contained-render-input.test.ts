import { describe, expect, it } from 'vitest';
import { STORED_TRIVIA } from '@sittir/common/utils';
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
				$handle: 4,
				$span: { start: 0, end: 4 },
				_name: { $type: LEAF, $parentHandle: 4, $childIndex: 0, $span: { start: 0, end: 2 } }
			},
			source,
			isLeafKind,
			STORED_TRIVIA
		);
		expect(out).toEqual({
			$type: COMPOUND,
			_name: { $type: LEAF, $span: { start: 0, end: 2 }, $text: 'ab' }
		});
	});

	it('gives a storage-less leaf its bytes and keeps a captured $text as it is', () => {
		expect(selfContainedRenderInput({ $type: LEAF, $span: { start: 0, end: 2 }, $text: 'zz' }, source, isLeafKind, STORED_TRIVIA)).toEqual({
			$type: LEAF,
			$span: { start: 0, end: 2 },
			$text: 'zz'
		});
	});

	it('keeps a storage-less compound as its identity, never as text', () => {
		expect(
			selfContainedRenderInput({ $type: COMPOUND, $handle: 1, $span: { start: 2, end: 4 } }, source, isLeafKind, STORED_TRIVIA)
		).toEqual({ $type: COMPOUND, $span: { start: 2, end: 4 } });
	});

	it('turns a storage-less trivia entry into its text and stamped kind on both sides', () => {
		const out = selfContainedRenderInput(
			{
				$type: COMPOUND,
				_x: [],
				$_trivia: {
					leading: [{ $type: 3, $treeHandle: 1, $span: { start: 4, end: 8 } }],
					trailing: [{ $type: 3, $text: '// d', $treeHandle: 1 }]
				}
			},
			source,
			isLeafKind,
			STORED_TRIVIA
		) as { $_trivia: unknown };
		expect(out.$_trivia).toEqual({ leading: [{ $type: 3, $text: '// c' }], trailing: [{ $type: 3, $text: '// d' }] });
	});

	it('keeps the same-line flag on a text entry and detaches inner entries', () => {
		const out = selfContainedRenderInput(
			{
				$type: COMPOUND,
				_x: [],
				$_trivia: {
					trailing: [{ $type: 3, $treeHandle: 1, $span: { start: 4, end: 8 }, $sameLine: true, $tokensBetween: 1 }],
					inner: { x: [{ $type: 3, $treeHandle: 1, $span: { start: 4, end: 8 } }] }
				}
			},
			source,
			isLeafKind,
			STORED_TRIVIA
		) as { $_trivia: unknown };
		expect(out.$_trivia).toEqual({
			trailing: [{ $type: 3, $text: '// c', $sameLine: true, $tokensBetween: 1 }],
			inner: { x: [{ $type: 3, $text: '// c' }] }
		});
	});
});
