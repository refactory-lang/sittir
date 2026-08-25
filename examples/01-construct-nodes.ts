import { ir } from '@sittir/rust';
import { nodeText } from './helpers.ts';

export function explicitMainFunction() {
	const fn = ir.functionItem.strict({
		visibilityModifier: ir.visibilityModifier.pub(),
		name: ir.identifier('main'),
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	});

	return {
		name: nodeText(fn.name()),
		body: fn.body(),
		source: fn.$render(),
	};
}

export function nestedGreetFunction() {
	return ir.functionItem.strict({
		// A form three levels down (`pub` -> its parenthesized group -> the
		// `in <path>` arm) keeps the variant name the grammar authored, on the
		// parent a caller actually names.
		visibilityModifier: ir.visibilityModifier.inPath(
			ir.scopedIdentifier({ path: ir.crate(), name: ir.identifier('x') }),
		),
		name: ir.identifier('greet'),
		parameters: ir.parameters.strict(
			ir.parameter({ name: 'name', type: 'String' }),
		),
		body: ir.block.strict({
			statements: [
			],
		}),
	});
}

export function fromGreetFunction() {
	return ir.functionItem({
		visibilityModifier: 'pub',
		name: 'greet',
		parameters: ir.parameters(
			ir.parameter({ name: 'name', type: 'String' }),
		),
		body: ir.block(),
	});
}

export function minimalMainFunction() {
	return ir.functionItem({
		name: 'main',
		parameters: ir.parameters(),
		body: ir.block({})
	});
}

export function immutableFunctionUpdates() {
	const fn = ir.functionItem({
		name: 'main',
		parameters: ir.parameters(),
		body: ir.block(),
	});

	return fn.$with
		.name(ir.identifier('greet'))
		.$with.body(ir.block.strict());
}

export function structSideBySide() {
	const strictFn = ir.functionItem.strict({
		visibilityModifier: ir.visibilityModifier.pub(),
		name: ir.identifier('config'),
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	});

	const fromFn = ir.functionItem({
		visibilityModifier: 'pub',
		name: 'config',
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	});

	return { strictFn, fromFn };
}
