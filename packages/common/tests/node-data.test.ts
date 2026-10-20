import { describe, expect, it } from 'vitest';
import { markEdited, detachCoordinates, carryPlace, holdTree, PLAIN_KINDS, sideOf, toNodeData, treeHandleOf, type KindView } from '../src/node-data.ts';
import { mintTreeToken, registerTree, treeTokenOf } from '../src/tree-token.ts';
import type { Siblings } from '../src/read.ts';

// A coordinate crosses only while it holds its tree, so a copy of each
// hand-written node below is given one, the way a read gives it to what it
// returns, and the token names a live tree, as a parse registers it.
const project = (node: never): ReturnType<typeof toNodeData> => {
	const held = structuredClone(node);
	const token = mintTreeToken(1);
	registerTree(token, { id: 1 });
	holdTree(held, token);
	return toNodeData(held, PLAIN_KINDS);
};

/** The coordinate a read gives the node at `start..end`; its handle is its start, a stand-in for its descendant index. */
const at = ($type: number, start: number, end: number) => ({ $treeHandle: start, $end: end, $span: { start, end }, $type });
const leaf = (text: string, start: number) => ({ $type: 1, $text: text, $_layout: { at: at(1, start, start + text.length) } });
/** The coordinate a parsed render root other than its tree's root crosses as: both its edges changed, since it renders with no neighbour. */
const rootAt = ($type: number, start: number, end: number) => ({ ...at($type, start, end), $_layout: { changed: { leading: true, trailing: true } } });
/** A child past the read's depth: its coordinate alone. */
const coordinate = (start: number, end: number) => at(2, start, end);
/** A child a read expanded: its storage and the coordinate it was read at. */
const deep = (start: number, end: number, storage: Record<string, unknown>) => ({ $type: 4, $_layout: { at: at(4, start, end) }, ...storage });
const built = (storage: Record<string, unknown> = {}) => ({ $type: 9, $named: true, ...storage });

describe('toNodeData', () => {
	it('folds an unedited node with only coordinates and leaves below it to its coordinate', () => {
		const node = { $type: 3, $_layout: { at: at(3, 0, 20) }, _name: leaf('main', 3), _body: coordinate(8, 20) };
		expect(project(node as never)).toEqual(at(3, 0, 20));
	});

	it('folds a deep read by its root, whatever its descendants carry', () => {
		const node = { $type: 3, $_layout: { at: at(3, 0, 20) }, _body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] }) };
		expect(project(node as never)).toEqual(at(3, 0, 20));
	});

	it('crosses a node rebuilt around a replaced child as its slots, with no coordinate', () => {
		const rebuilt = built({ _x: { $type: 1, $text: 'y' } });
		const node = markEdited({ $type: 3, $_layout: { at: at(3, 0, 20) }, _name: leaf('main', 3), _body: rebuilt });
		const out = project(node as never) as unknown as Record<string, unknown>;
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$_layout).toBeUndefined();
		expect(out._body).toEqual(rebuilt);
	});

	it('crosses a child past the read\'s depth inside an edited parent as its coordinate', () => {
		const out = project({ $type: 3, _a: coordinate(0, 4), _b: built() } as never) as unknown as Record<string, unknown>;
		expect(out._a).toEqual(coordinate(0, 4));
	});

	it('folds an expanded child of an edited parent by its own coordinate', () => {
		const parent = { $type: 3, _name: built({ $text: 'g' }), _body: deep(8, 20, { _statements: [deep(10, 18, { _name: leaf('x', 10) })] }) };
		const out = project(parent as never) as unknown as Record<string, unknown>;
		expect(out._body).toEqual(at(4, 8, 20));
	});

	it("folds a parsed node to its coordinate alone, whatever trivia its data carries: its tree's table gives its sides", () => {
		const withOwnTrivia = { $type: 3, $_layout: { at: at(3, 5, 9), trivia: { leading: [leaf('// c', 0)] } }, _a: coordinate(5, 9) };
		expect(project(withOwnTrivia as never)).toEqual(rootAt(3, 5, 9));
		const two = leaf('2', 12);
		expect(project({ ...two, $_layout: { ...two.$_layout, trivia: { trailing: [leaf('# two', 14)] } } } as never)).toEqual(rootAt(1, 12, 13));
	});

	it('never lets a rebuilt structural node cross with $text or a stale coordinate', () => {
		const node = markEdited({ $type: 3, $text: 'stale', $_layout: { at: at(3, 0, 5) }, _a: built() });
		const out = project(node as never) as unknown as Record<string, unknown>;
		expect(out.$text).toBeUndefined();
		expect(treeHandleOf(out)).toBeUndefined();
		expect(out.$_layout).toBeUndefined();
	});

	it('leaves a kind id or a boolean in a slot inert', () => {
		const node = { $type: 3, $_layout: { at: at(3, 0, 6) }, _marker: true, _keyword: 42 };
		expect(project(node as never)).toEqual(at(3, 0, 6));
	});
});

describe('treeHandleOf', () => {
	it('reads the tree handle of a coordinate, or of the coordinate a read node carries', () => {
		expect(treeHandleOf(at(3, 5, 6))).toBe(5);
		expect(treeHandleOf({ $type: 3, $_layout: { at: at(3, 4, 6) } })).toBe(4);
		expect(treeHandleOf({ $type: 3, $_layout: { trivia: {} } })).toBeUndefined();
	});
});

describe('markEdited', () => {
	it('detaches the coordinate and nothing else', () => {
		expect(markEdited({ $type: 3, $_layout: { at: at(3, 0, 1) }, $text: 'x', _a: 1 })).toEqual({ $type: 3, $text: 'x', _a: 1 });
		const trivia = { leading: [8] };
		expect(markEdited({ $type: 3, $_layout: { at: at(3, 0, 1), trivia }, _a: 1 })).toEqual({ $type: 3, $_layout: { trivia }, _a: 1 });
	});
});

describe('detachCoordinates', () => {
	it('keeps the coordinate of a text leaf, which addresses its own bytes only', () => {
		const node = leaf('x', 1);
		expect(detachCoordinates(structuredClone(node))).toEqual(node);
	});

	it('strips the coordinate of a node that holds slots, and keeps its children\'s', () => {
		const parent = { $type: 1, $_layout: { at: at(1, 0, 2) }, _child: leaf('x', 1), _rest: coordinate(1, 2) };
		expect(detachCoordinates(structuredClone(parent))).toEqual({ $type: 1, _child: leaf('x', 1), _rest: coordinate(1, 2) });
	});
});

describe('the tree token a parsed object holds', () => {
	const token = mintTreeToken(4);
	registerTree(token, { id: 4 });
	const held = <T extends object>(node: T): T => {
		holdTree(node, token);
		return node;
	};

	it('is no data key: the keys and the JSON of a node that holds one do not show it', () => {
		const node = held({ $type: 5, $text: 'x' });
		expect(treeTokenOf(node)).toBe(token);
		expect(Object.keys(node)).toEqual(['$type', '$text']);
		expect(JSON.parse(JSON.stringify(node))).toEqual({ $type: 5, $text: 'x' });
	});

	it('is carried by a spread copy and by nothing that copies by string keys', () => {
		const node = held({ $type: 5, $text: 'x' });
		expect(treeTokenOf({ ...node })).toBe(token);
		expect(treeTokenOf(structuredClone(node))).toBeUndefined();
		expect(treeTokenOf(JSON.parse(JSON.stringify(node)) as object)).toBeUndefined();
		expect(treeTokenOf(Object.fromEntries(Object.entries(node)))).toBeUndefined();
	});

	it('does not cross: a folded coordinate, a rebuilt node and a kept leaf all drop it', () => {
		const folded = toNodeData(held({ $type: 5, $_layout: { at: at(5, 1, 2) } }) as never, PLAIN_KINDS);
		expect(folded).toEqual(rootAt(5, 1, 2));
		expect(treeTokenOf(folded)).toBeUndefined();
		const rebuilt = toNodeData(held({ $type: 1, _child: { $type: 5, $text: 'x' } }) as never, PLAIN_KINDS) as never as { _child: object };
		expect(rebuilt).toEqual({ $type: 1, _child: { $type: 5, $text: 'x' } });
		expect(treeTokenOf(rebuilt)).toBeUndefined();
		expect(treeTokenOf(rebuilt._child)).toBeUndefined();
	});

	it('is detached with the coordinate by an edit, although the edit copies the node by spread', () => {
		const edited = markEdited(held({ $type: 1, $_layout: { at: at(1, 0, 1) }, _a: 1 }));
		expect(edited).toEqual({ $type: 1, _a: 1 });
		expect(treeTokenOf(edited)).toBeUndefined();
	});

	it('is removed from node data detached in place', () => {
		const detached = detachCoordinates(held(leaf('x', 1)));
		expect(detached).toEqual(leaf('x', 1));
		expect(treeTokenOf(detached)).toBeUndefined();
	});

	it('is removed from the trivia a detached node owns, at every side and depth', () => {
		const comment = () => ({ $type: 7, $_layout: { at: at(7, 0, 1) }, _content: [{ $type: 8 }] });
		const node = detachCoordinates(
			held({ $type: 1, _a: 1, $_layout: { trivia: { leading: [comment()], trailing: [comment()], inner: [comment()] } } })
		);
		const trivia = node.$_layout.trivia;
		const entries = [...trivia.leading, ...trivia.trailing, ...trivia.inner];
		expect(entries).toHaveLength(3);
		for (const entry of entries) {
			expect(treeTokenOf(entry)).toBeUndefined();
			expect(treeTokenOf(entry._content[0]!)).toBeUndefined();
		}
	});

	it('is required of a bare coordinate: one that holds no tree is refused, as a child and as a trivia entry', () => {
		const refusal = /does not hold that tree.*parse the source here/;
		expect(() => toNodeData({ $type: 1, _child: at(5, 1, 2) } as never, PLAIN_KINDS)).toThrow(refusal);
		expect(() => toNodeData({ $type: 1, _a: 1, $_layout: { trivia: { inner: [at(7, 0, 1)] } } } as never, PLAIN_KINDS)).toThrow(refusal);
	});

	it('never folds a read node that lost its tree: it crosses as its own data, never naming a tree', () => {
		const read = { $type: 5, $text: 'x', $_layout: { at: at(5, 1, 2) } };
		expect(toNodeData(structuredClone(held({ ...read })) as never, PLAIN_KINDS)).toEqual({ $type: 5, $text: 'x' });
	});

	it('is not required of built data, which names no tree', () => {
		const built = { $type: 1, _child: { $type: 5, $text: 'x' } };
		expect(toNodeData(built as never, PLAIN_KINDS)).toEqual(built);
	});

	it('passes with a spread copy made on this thread', () => {
		const read = held({ $type: 5, $_layout: { at: at(5, 1, 2) } });
		expect(toNodeData({ ...read } as never, PLAIN_KINDS)).toEqual(rootAt(5, 1, 2));
	});
});

/** A live tree whose table answers each side as `<index>:<side>`, and whose siblings are `siblings`. */
function tableTree(id: number, siblings: (index: number) => Siblings = () => ({ previous: null, next: null })) {
	const token = mintTreeToken(id);
	const written: string[] = [];
	registerTree(token, { id, triviaSide: (index, side) => [`${index}:${side}`], writeTriviaSide: (index, side) => written.push(`${index}:${side}`), siblings });
	return { token, written };
}

describe('sideOf', () => {
	it("reads a parsed node's side from its tree's table, at its own index", () => {
		const { token } = tableTree(11);
		const read = { $type: 5, $_layout: { at: at(5, 2, 3), trivia: { leading: [8] } } };
		holdTree(read, token);
		expect(sideOf(read, 'leading')).toEqual(['2:leading']);
	});

	it("reads a built node's stored side, else the side of the node it was rebuilt from", () => {
		const { token } = tableTree(12);
		const read = { $type: 5, $_layout: { at: at(5, 4, 5) } };
		holdTree(read, token);
		const draft = markEdited({ ...read, $_layout: { ...read.$_layout, trivia: { trailing: [8] } } });
		carryPlace(read, draft);
		expect(sideOf(draft, 'trailing')).toEqual([8]);
		expect(sideOf(draft, 'leading')).toEqual(['4:leading']);
		expect(sideOf({ $type: 5 }, 'leading')).toEqual([]);
	});
});

describe('the edges of the render root', () => {
	const comment = { $type: 3, $named: true, $text: '// c' };
	const both = { leading: true, trailing: true };

	it('are changed, since it renders with no neighbour: a built root crosses with its trivia and both edges named', () => {
		const node = { $type: 5, $named: true, $text: 'b', $_layout: { trivia: { leading: [9, comment, 8], trailing: [8] } } };
		expect(toNodeData(node as never, PLAIN_KINDS)).toEqual({ ...node, $_layout: { trivia: node.$_layout.trivia, changed: both } });
	});

	it("are the root's only: a node below it keeps its edges", () => {
		const child = { $type: 5, $named: true, $text: 'b', $_layout: { trivia: { leading: [9], trailing: [8] } } };
		const root = { $type: 6, $named: true, _body: child, $_layout: { trivia: { leading: [9] } } };
		expect(toNodeData(root as never, PLAIN_KINDS)).toEqual({ $type: 6, $named: true, _body: child, $_layout: { trivia: { leading: [9] }, changed: both } });
	});

	it("are the document's when the root is its tree's root: they are not changed", () => {
		const { token } = tableTree(14);
		const whole = { $type: 5, $_layout: { at: at(5, 0, 9) } };
		holdTree(whole, token);
		expect(toNodeData(whole as never, PLAIN_KINDS)).toEqual(at(5, 0, 9));
	});
});

describe('a built node rebuilt from a parsed one', () => {
	it('names that node for the sides it does not hold', () => {
		const { token } = tableTree(13);
		const read = { $type: 5, $_layout: { at: at(5, 6, 7) } };
		holdTree(read, token);
		const draft = markEdited({ ...read, _a: 1 });
		carryPlace(read, draft);
		const out = toNodeData(draft as never, PLAIN_KINDS) as unknown as { $_layout: Record<string, unknown> };
		expect(out.$_layout.sides).toEqual(at(5, 6, 7));
	});
});

describe("a rebuilt list item's changed edges", () => {
	const ATTRIBUTED = 20;
	const ALIAS_ENVELOPE = 21;
	const OTHER = 30;
	const { token } = tableTree(1, (index) => (index === 3 ? { previous: { start: 1, end: 2, kind: OTHER }, next: null } : { previous: null, next: null }));
	const a = deep(1, 2, {});
	const b = deep(3, 4, {});
	const owner = deep(0, 5, {});
	const other = deep(7, 8, {});
	holdTree(a, token);
	holdTree(b, token);
	holdTree(owner, token);
	holdTree(other, token);
	const view: KindView = {
		isWrapper: (kindId) => kindId === ATTRIBUTED || kindId === ALIAS_ENVELOPE
	};
	type Crossed = { $_layout?: { changed?: unknown }; _content?: Crossed; _name?: Crossed };
	const second = (first: Record<string, unknown>, wrapper: Record<string, unknown>): Crossed =>
		(toNodeData({ ...markEdited(owner), _item: [first, wrapper] } as never, view) as unknown as { _item: Crossed[] })._item[1]!;

	it('judges a rebuilt group around one node by the node it holds', () => {
		const wrapper = { $type: ATTRIBUTED, _attribute_item: [], _content: b };
		expect(second(a, wrapper)._content?.$_layout?.changed).toBeUndefined();
		expect(second(other, wrapper)._content?.$_layout?.changed).toEqual({ leading: true, trailing: false });
	});

	it('judges a rebuilt alias envelope by the node it holds, whatever its slot is called', () => {
		const wrapper = { $type: ALIAS_ENVELOPE, _name: b };
		expect(second(a, wrapper)._name?.$_layout?.changed).toBeUndefined();
		expect(second(other, wrapper)._name?.$_layout?.changed).toEqual({ leading: true, trailing: false });
	});

	it('names the changed edge on the content a rebuilt wrapper holds, not on the wrapper', () => {
		const wrapper = { $type: ATTRIBUTED, _content: b };
		expect(second(other, wrapper).$_layout).toBeUndefined();
	});
});
