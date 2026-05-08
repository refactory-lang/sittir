import { ir, snippets, template } from '@sittir/rust';

export function generateCacheModule() {
	const file = ir.sourceFile({
		statements: [
			ir.useDeclaration.from({ path: 'std::collections::HashMap' }),
			ir.structItem
				.from({
					visibilityModifier: 'pub',
					name: 'Cache',
					body: { name: 'entries', type: 'HashMap<String, String>' }
				})
				.$trivia(ir.docComment('/// In-memory key-value cache.')),
			snippets.implBlock
				.fill({
					TYPE: ir.typeIdentifier('Cache'),
					METHODS: snippets.pubMethod
						.fill({
							NAME: ir.identifier('new'),
							RET: ir.typeIdentifier('Self'),
							BODY: template('Self { entries: HashMap::new() }').fill({}).read()
						})
						.read()
				})
				.read()
		]
	});

	return file.$render();
}
