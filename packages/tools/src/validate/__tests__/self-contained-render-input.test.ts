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
				$_layout: { at: { $treeHandle: 4, $span: { start: 0, end: 4 }, $type: COMPOUND } },
				_name: { $treeHandle: 5, $span: { start: 0, end: 2 }, $type: LEAF }
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
		expect(selfContainedRenderInput({ $type: LEAF, $_layout: { at: { $treeHandle: 1, $span: { start: 0, end: 2 }, $type: LEAF } }, $text: 'zz' }, source, isLeafKind, STORED_TRIVIA)).toEqual({
			$type: LEAF,
			$text: 'zz'
		});
	});

	it('keeps a storage-less compound as its identity, never as text', () => {
		expect(
			selfContainedRenderInput({ $type: COMPOUND, $_layout: { at: { $treeHandle: 1, $span: { start: 2, end: 4 }, $type: COMPOUND } } }, source, isLeafKind, STORED_TRIVIA)
		).toEqual({ $type: COMPOUND });
	});

	it('turns a storage-less trivia entry into its text and stamped kind on both sides', () => {
		const out = selfContainedRenderInput(
			{
				$type: COMPOUND,
				_x: [],
				$_layout: {
					trivia: {
						leading: [{ $type: 3, $treeHandle: 1, $span: { start: 4, end: 8 } }],
						trailing: [{ $type: 3, $text: '// d' }]
					}
				}
			},
			source,
			isLeafKind,
			STORED_TRIVIA
		) as { $_layout: { trivia: unknown } };
		expect(out.$_layout.trivia).toEqual({ leading: [{ $type: 3, $text: '// c' }], trailing: [{ $type: 3, $text: '// d' }] });
	});

	it('keeps the same-line flag on a text entry and detaches inner entries', () => {
		const out = selfContainedRenderInput(
			{
				$type: COMPOUND,
				_x: [],
				$_layout: {
					trivia: {
						trailing: [{ $type: 3, $treeHandle: 1, $span: { start: 4, end: 8 }, $sameLine: true, $tokensBetween: 1 }],
						inner: { x: [{ $type: 3, $treeHandle: 1, $span: { start: 4, end: 8 } }] }
					}
				}
			},
			source,
			isLeafKind,
			STORED_TRIVIA
		) as { $_layout: { trivia: unknown } };
		expect(out.$_layout.trivia).toEqual({
			trailing: [{ $type: 3, $text: '// c', $sameLine: true, $tokensBetween: 1 }],
			inner: { x: [{ $type: 3, $text: '// c' }] }
		});
	});
});
