import { createEngine, ir, replace, wrap } from '@sittir/rust';

export function addVerboseParameterToProcess(source: string) {
	const engine = createEngine();
	const tree = engine.parseAndRead(source, { extractFormat: true });
	const fns = engine.findAndRead(source, 'fn $NAME($...PARAMS) $BODY');
	const processFn = fns.find((fn) => wrap(fn, tree).name() === 'process');

	if (!processFn) return source;

	const target = wrap(processFn, tree);
	const updatedParams = ir.parameters([
		...target.parameters().$children,
		ir.parameter.from({ name: 'verbose', type: 'bool' })
	]);

	return engine.applyEdits(source, [replace(target.parameters(), updatedParams)]);
}
