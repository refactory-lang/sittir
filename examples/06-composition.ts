import { snippets, template, ir } from '@sittir/typescript';

export function renderComposedImplBlock() {
	const method = snippets.pubMethod
		.fill({
			NAME: ir.identifier.identifier('new');
			PARAMS: ir.typeParameter.from({ name: 'host', type: ir.identifier('String') }),
			RET: ir.identifier('Self'),
			BODY: template('Self { $...FIELDS }')
				.fill({
					FIELDS: [ir.fieldInitializer.from({ name: 'host', value: ir.stringLiteral.from('host')})]
				})
				.read()
		})
		.read();

	return snippets.implBlock
		.fill({
			TYPE: ir.typeIdentifier('Config'),
			METHODS: method
		})
		.render();
}
