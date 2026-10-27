// Run with `node --expose-gc --import tsx <objects|arena objects|records>`:
// prints one JSON line reporting a built block's statement once nothing but
// the block names that statement, so the block's arena makes its views anew
// from the records. Reports whether the block's snapshot is unchanged, whether
// the statement's call is a node, its function leaf, what the call's `$with`
// builds, and a side written on the call. Then a parsed name, with a comment of
// its own, that only a built call names: its structure, whether it is still the
// parsed node, whether it still snapshots, and the call's render. Then parsed
// alias content only a built call names, while its envelope, which shares its
// row, is kept: its kind and text, and the call's render.
// A child process, because a collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { builtRefOf } from '../../src/built-ref.ts';
import { isNode, isParsedNode, nodeText, snapshotOf } from '../../src/utils.ts';
import { structureOf } from '../../../../examples/helpers.ts';
import rust, { type Engine } from '../../../rust/src/index.ts';

if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

async function settle(): Promise<void> {
	for (let round = 0; round < 10; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

async function engineOf(construction: string): Promise<Engine> {
	if (construction === 'objects') return (await createEngine(rust, { nodeStorage: 'object' })) as unknown as Engine;
	if (construction === 'arena objects') return rust.createEngine({ nodeConstruction: 'object' });
	if (construction === 'records') return rust.createEngine();
	throw new Error('name the construction: objects, arena objects or records');
}

type Call = { function(): unknown; $with: { function(value: unknown): object }; $trivia: { trailing(...items: unknown[]): unknown } };
type Statement = { content(): { expression(): Call } };
type Block = { statements(): readonly Statement[]; $with: { statements(...items: unknown[]): Block } };

const rs = await engineOf(process.argv[2] ?? '');
const b = rs.build as unknown as Record<string, (...args: unknown[]) => unknown>;
const statement = (name: string) => b.expressionStatement!(b.callExpression!({ function: b.identifier!(name) }));
const block = (b.block!({ statements: [statement('x')] }) as Block).$with.statements(statement('y'), ...(b.block!({ statements: [statement('x')] }) as Block).statements());
const attemptValue = (f: () => unknown): unknown => {
	try {
		return f();
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 90)}`;
	}
};
const attempt = (f: () => unknown): string => String(attemptValue(f));
const snapshotText = () => attempt(() => JSON.stringify(snapshotOf(block)));
const before = snapshotText();
const named = b.callExpression!({ function: (rs.parse('fn f /* kept */() {}\n').statements()[0] as unknown as { name(): unknown }).name() }) as Call;
const envelope = (rs.parse('type A = Foo;\n').statements()[0] as unknown as { value(): { content(): unknown } }).value();
const aliased = b.callExpression!({ function: envelope.content() }) as Call;
await settle();
const unchanged = snapshotText() === before;
const call = block.statements()[0]!.content().expression();
const node = isNode(call);
const leaf = attempt(() => rs.render(call.function() as never).toString());
let edited: object | undefined;
const editing = attempt(() => (edited = call.$with.function(b.identifier!('z'))));
const siding = attempt(() => call.$trivia.trailing(b.blockComment!(b.blockCommentRegular!(' c '))));
console.log(
	JSON.stringify({
		unchanged,
		node,
		leaf,
		edited: edited === undefined ? editing : attempt(() => rs.render(edited as never).toString()),
		editedBuilt: edited !== undefined && builtRefOf(edited) !== undefined,
		sided: siding.startsWith('throws') ? siding : attempt(() => rs.render(block as never).toString()),
		parsedName: attemptValue(() => structureOf(snapshotOf(named.function() as object))),
		parsed: isParsedNode(named.function()),
		snapshots: typeof (named.function() as { $snapshot?: unknown }).$snapshot === 'function',
		namedRender: attempt(() => rs.render(named as never).toString()),
		content: attemptValue(() => {
			const content = aliased.function() as { readonly $type: number };
			return { $type: content.$type, $text: nodeText(content) };
		}),
		aliasedRender: attempt(() => rs.render(aliased as never).toString()),
		envelope: isParsedNode(envelope)
	})
);
