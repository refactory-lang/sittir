import { template, ir } from '@sittir/rust';

export function renderInlineLetBinding() {
	const letBinding = template('let $NAME: $TYPE = $VALUE;');

	return letBinding
		.fill({
			NAME: ir.identifier('config'),
			TYPE: ir.identifier('Config'),
			VALUE: ir.structItem.from({
				name: 'Config',
				body: [
					{ name: 'host', value: '"localhost"' },
					{ name: 'port', value: '8080' }
				]
			})
		})
		.render();
}
