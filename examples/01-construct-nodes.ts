import rust from '@sittir/rust';

const rs = await rust.createEngine();

export function explicitMainFunction() {
	const fn = rs.build.statement.function.strict({
		visibilityModifier: rs.build.visibilityModifier.pub(),
		name: rs.build.identifier('main'),
		parameters: rs.build.parameters.strict(),
		body: rs.build.block.strict(),
	});

	return {
		name: fn.name().$render(),
		body: fn.body(),
		source: fn.$render(),
	};
}

export function nestedGreetFunction() {
	return rs.build.statement.function.strict({
		// Each arm nests under the arm that reaches it: `pub`, its
		// parenthesized `scope`, then the `in <path>` form.
		visibilityModifier: rs.build.visibilityModifier.pub.scope.inPath(
			rs.build.scopedIdentifier({ path: rs.build.crate, name: rs.build.identifier('x') }),
		),
		name: rs.build.identifier('greet'),
		parameters: rs.build.parameters.strict(
			rs.build.parameter({ name: 'name', type: 'String' }),
		),
		body: rs.build.block.strict(),
	});
}

export function looseGreetFunction() {
	return rs.build.statement.function({
		visibilityModifier: 'pub',
		name: 'greet',
		parameters: rs.build.parameters(
			rs.build.parameter({ name: 'name', type: 'String', mutable: true }),
		),
		body: rs.build.block({
			statements: rs.build.statement.let({ pattern: 'a', mutable: true, value: rs.build.integerLiteral('1') }),
		}),
	});
}

export function minimalMainFunction() {
	return rs.build.statement.function({
		name: 'main',
		parameters: rs.build.parameters(),
		body: rs.build.block({})
	});
}

export function immutableFunctionUpdates() {
	const fn = rs.build.statement.function({
		name: 'main',
		parameters: rs.build.parameters(),
		body: rs.build.block(),
	});

	return fn.$with
		.name(rs.build.identifier('greet'))
		.$with.body(rs.build.block.strict());
}

export function structSideBySide() {
	const strictFn = rs.build.statement.function.strict({
		visibilityModifier: rs.build.visibilityModifier.pub(),
		name: rs.build.identifier('config'),
		parameters: rs.build.parameters.strict(),
		body: rs.build.block.strict(),
	});

	const looseFn = rs.build.statement.function({
		visibilityModifier: 'pub',
		name: 'config',
		parameters: rs.build.parameters.strict(),
		body: rs.build.block.strict(),
	});

	return { strictFn, looseFn };
}
