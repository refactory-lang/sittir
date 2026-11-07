import rust from '@sittir/rust';

const rs = await rust.createEngine();
const strict = await rust.createEngine({ api: 'strict' });

export function explicitMainFunction() {
	const fn = strict.build.statement.function({
		visibilityModifier: strict.build.visibilityModifier.pub(),
		name: strict.build.identifier('main'),
		parameters: strict.build.parameters(),
		body: strict.build.block(),
	});

	return {
		name: fn.name().$render(),
		body: fn.body(),
		source: fn.$render(),
	};
}

export function nestedGreetFunction() {
	return strict.build.statement.function({
		// Each arm nests under the arm that reaches it: `pub`, its
		// parenthesized `scope`, then the `in <path>` form.
		visibilityModifier: strict.build.visibilityModifier.pub.scope.inPath(
			strict.build.scopedIdentifier({ qualifier: strict.build.crate, name: strict.build.identifier('x') }),
		),
		name: strict.build.identifier('greet'),
		parameters: strict.build.parameters(
			strict.build.parametersElements(strict.build.parameter({ name: strict.build.identifier('name'), type: strict.build.identifier('String') })),
		),
		body: strict.build.block(),
	});
}

export function looseGreetFunction() {
	return rs.build.statement.function({
		visibilityModifier: 'pub',
		name: 'greet',
		parameters: rs.build.parameters(
			rs.build.parametersElements(rs.build.parameter({ name: 'name', type: 'String', mutable: true })),
		),
		body: rs.build.block({
			statements: rs.build.statement.let({ name: 'a', mutable: true, value: rs.build.integerLiteral('1') }),
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
		.$with.body(rs.build.block());
}

export function strictAndLooseFunctions() {
	const strictFn = strict.build.statement.function({
		visibilityModifier: strict.build.visibilityModifier.pub(),
		name: strict.build.identifier('config'),
		parameters: strict.build.parameters(),
		body: strict.build.block(),
	});

	const looseFn = rs.build.statement.function({
		visibilityModifier: 'pub',
		name: 'config',
		parameters: rs.build.parameters(),
		body: rs.build.block(),
	});

	return { strictFn, looseFn };
}
