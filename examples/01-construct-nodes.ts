import { ir, createEngine, PrimitiveType } from '@sittir/rust';




export function explicitMainFunction() {
	const fn = ir.functionItem({
		visibilityModifier: ir.visibilityModifier(),
		name: ir.identifier('main'),
		parameters: ir.parameters(),
		body: ir.block()
	});

	return {
		name: fn.name(),
		body: fn.body(),
		source: fn.$render()
	};
}

export function nestedGreetFunction() {
	return ir.functionItem({
		visibilityModifier: ir.visibilityModifier.(),
		name: ir.identifier('greet'),
		parameters: ir.parameters(
			ir.parameter({
				pattern: ir.identifier('name'),
				type: ir.referenceType({
					type: ir.primitiveType('str')
				})
			})
		),
		returnType: ir.typeIdentifier('String'),
		body: ir.block([
			ir.expressionStatement({
				expression: ir.macroInvocation({
					macro: ir.identifier('format!'),
					args: ir.tokenTree([ir.stringLiteral('"Hello, {}!"'), ir.identifier('name')])
				})
			})
		])
	});
}

export function fromGreetFunction() {
	return ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'greet',
		parameters: { pattern: 'name', type: '&str' },
		returnType: ir.identifier('String'),
		body: ir.expressionStatement.({
			children: ir.macroInvocation({
				macro: ir.identifier('format!'),
				tokenTree: ir.delimTokenTree.brace({ children: [ir.stringLiteral('"Hello, {}!"'), ir.identifier('name')]}) /*single child variant should hoist the token array */
			})
		})
	});
}

export function minimalMainFunction() {
	return ir.functionItem.from({ name: 'main' });
}

export function immutableFunctionUpdates() {
	const fn = ir.functionItem.from({ name: 'main' });
	const stmt = ir.expressionStatement.from({ expression: 'todo!()' });

	return fn.$with
		.name(ir.identifier('greet'))
		.$with.returnType(ir.typeIdentifier('String'))
		.$with.body(ir.block([stmt]));
}

export function structSideBySide() {
	const factoryStruct = ir.structItem({
		visibilityModifier: ir.visibilityModifier(),
		name: ir.typeIdentifier('Config'),
		body: ir.fieldDeclarationList([
			ir.fieldDeclaration({
				visibilityModifier: ir.visibilityModifier(),
				name: ir.fieldIdentifier('host'),
				type: ir.typeIdentifier('String')
			}),
			ir.fieldDeclaration({
				name: ir.fieldIdentifier('port'),
				type: ir.primitiveType('u16')
			})
		])
	});

	const fromStruct = ir.structItem.from({
		visibilityModifier: 'pub',
		name: 'Config',
		body: [
			{ visibilityModifier: 'pub', name: 'host', type: 'String' },
			{ name: 'port', type: 'u16' }
		]
	});

	return { factoryStruct, fromStruct };
}
