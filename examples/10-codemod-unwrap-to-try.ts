import { createEngine, ir, replace, wrap } from '@sittir/rust';

export function replaceUnwrapWithTry(source: string) {
	const engine = createEngine();
	const tree = engine.parse(source);
	const matches = engine.findAndRead(source, '$EXPR.unwrap()');
	const edits = matches.map((match) => replace(match, ir.tryExpression({ value: wrap(match, tree).value() })));

	return engine.applyEdits(source, edits);
}
