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
		visibilityModifier: ir.visibilityModifier.pub(),
		name: ir.identifier('greet'),
		parameters: ir.parameters.strict(
			ir.parameter.from({ pattern: 'name', type: 'String' }),
		),
		body: ir.block.strict(),
	});
}

export function fromGreetFunction() {
	return ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'greet',
		parameters: ir.parameters.strict(
			ir.parameter.from({ pattern: 'name', type: 'String' }),
		),
		body: ir.block.strict(),
	});
}

export function minimalMainFunction() {
	return ir.functionItem({
		name: 'main',
		parameters: ir.parameters(), /* parameters takes rest parameters, so likely ir.* mapped to strict api instead of from */
		body: ir.block({}) /* from api should permit empty block, but it doesn't currently - likely need an overload for single slot array parameters in the from api*/,
	});
}

export function immutableFunctionUpdates() {
	const fn = ir.functionItem.from({
		name: 'main',
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
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

	const fromFn = ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'config',
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	});

	return { strictFn, fromFn };
}
