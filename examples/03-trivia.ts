import { ir } from '@sittir/rust';

export function attachDocComment() {
	const fn = ir.functionItem
		.from({
			visibilityModifier: 'pub',
			name: 'main',
			parameters: ir.parameters.strict(),
			body: ir.block.strict(),
		})
		.$trivia(ir.lineComment.doc({ doc: 'Entry point.' }));

	return fn.$render();
}

export function attachLeadingTrivia() {
	return ir.functionItem.from({
		visibilityModifier: 'pub',
		name: 'main',
		parameters: ir.parameters.strict(),
		body: ir.block.strict(),
	}).$trivia({
		leading: [ir.lineComment.doc({ doc: 'Main entry point.' })],
	});
}
