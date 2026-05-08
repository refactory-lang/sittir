import { ir } from '@sittir/rust';
import { constParameter } from '../packages/rust/dist/factories';

export function attachDocComment() {
	const fn = ir.function
		.from({
			visibilityModifier: ir.visibilityModifier.pub(),
			name: ir.identifier('main'),
			parameters: ir.parameters(),
			typeParameters: ir.typeParameters(constParameter())
		})
		.$trivia(ir.docComment('/// Entry point.'));

	return fn.$render();
}

export function attachLeadingAndTrailingTrivia() {
	return ir.functionItem.from({ visibilityModifier: 'pub', name: 'main' }).$trivia({
		leading: [ir.lineComment('// @generated'), ir.docComment('/// Main.')],
		trailing: [ir.lineComment('// end main')]
	});
}
