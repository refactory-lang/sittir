import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function explicitMainFunction() {
	const fn = engine.build.statement.function.strict({
		visibilityModifier: engine.build.visibilityModifier.pub(),
		name: engine.build.identifier('main'),
		parameters: engine.build.parameters.strict(),
		body: engine.build.block.strict(),
	});

	return {
		name: fn.name().$render(),
		body: fn.body(),
		source: fn.$render(),
	};
}

export function nestedGreetFunction() {
	return engine.build.statement.function.strict({
		// Each arm nests under the arm that reaches it: `pub`, its
		// parenthesized `scope`, then the `in <path>` form.
		visibilityModifier: engine.build.visibilityModifier.pub.scope.inPath(
			engine.build.scopedIdentifier({ path: engine.build.crate, name: engine.build.identifier('x') }),
		),
		name: engine.build.identifier('greet'),
		parameters: engine.build.parameters.strict(
			engine.build.parameter({ name: 'name', type: 'String' }),
		),
		body: engine.build.block.strict(),
	});
}

export function looseGreetFunction() {
	return engine.build.statement.function({
		visibilityModifier: 'pub',
		name: 'greet',
		parameters: engine.build.parameters(
			engine.build.parameter({ name: 'name', type: 'String', mutable: true }),
		),
		body: engine.build.block({
			statements: engine.build.statement.let({ pattern: 'a', mutable: true, value: engine.build.integerLiteral('1') }),
		}),
	});
}

export function minimalMainFunction() {
	return engine.build.statement.function({
		name: 'main',
		parameters: engine.build.parameters(),
		body: engine.build.block({})
	});
}

export function immutableFunctionUpdates() {
	const fn = engine.build.statement.function({
		name: 'main',
		parameters: engine.build.parameters(),
		body: engine.build.block(),
	});

	return fn.$with
		.name(engine.build.identifier('greet'))
		.$with.body(engine.build.block.strict());
}

export function structSideBySide() {
	const strictFn = engine.build.statement.function.strict({
		visibilityModifier: engine.build.visibilityModifier.pub(),
		name: engine.build.identifier('config'),
		parameters: engine.build.parameters.strict(),
		body: engine.build.block.strict(),
	});

	const looseFn = engine.build.statement.function({
		visibilityModifier: 'pub',
		name: 'config',
		parameters: engine.build.parameters.strict(),
		body: engine.build.block.strict(),
	});

	return { strictFn, looseFn };
}
