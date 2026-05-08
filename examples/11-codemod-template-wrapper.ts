import { createEngine, snippets, ir, replace, wrap } from '@sittir/rust';

export function wrapHandlersInTryBlock(source: string) {
	const engine = createEngine();
	const tree = engine.parseAndRead(source);
	const fns = engine.findAndRead(source, 'pub fn $NAME($...PARAMS) -> $RET { $...BODY }');

	const edits = fns.map((fn) => {
		const w = wrap(fn, tree);
		return replace(
			w.body(),
			ir.block([
				snippets.tryWrapper
					.fill({
						RET: w.returnType(),
						BODY: w.body(),
						FNAME: ir.stringLiteral(w.name()),
						FALLBACK: ir.macroInvocation.from({
							macro: 'panic!',
							args: ['"unrecoverable"']
						})
					})
					.read()
			])
		);
	});

	return engine.applyEdits(source, edits);
}
