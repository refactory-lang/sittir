// Run with `node --import tsx`: prints one JSON line with the renders, by the
// engine that parsed it and by another, of a parsed tree whose side holds a
// record built over a node of the same parse: one that links the node, and
// one rebuilt from it, whose side record names the parse. A child process,
// because a render blocked on a lock its own render holds never returns to
// the event loop for a test timeout to fire.
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

type Comment = { content(): unknown; $with: { content(value: unknown): unknown } };
type Item = { $trivia: { leading(...entries: unknown[]): readonly Comment[] } };
type Root = { statements(): readonly Item[] };

const storage = (process.argv[2] ?? 'arena') as 'arena' | 'object';
using a = await createEngine(rust, { nodeStorage: storage });
using b = await createEngine(rust, { nodeStorage: storage });
b.parse('fn other() {}\n');

const renders = (entry: (comment: Comment) => unknown) => {
	const root = a.parse('/// kept\nfn f() {}\nfn g() {}\n') as unknown as Root;
	const [f, g] = root.statements();
	g!.$trivia.leading(entry(f!.$trivia.leading()[0]!));
	return { own: String(a.render(root as never)), other: String(b.render(root as never)) };
};

console.log(
	JSON.stringify({
		linked: renders((comment) => a.build.lineComment.docOuter(comment.content() as never)),
		rebuilt: renders((comment) => comment.$with.content(a.build.lineComment.docOuter(' new').content()))
	})
);
