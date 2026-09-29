import { createEngine } from '@sittir/common';
import rust from '@sittir/rust';

const engine = await createEngine(rust);

export function attachDocComment() {
	const fn = engine.build.statement
		.function({
			visibilityModifier: 'pub',
			name: 'main',
			parameters: engine.build.parameters.strict(),
			body: engine.build.block.strict(),
		})
		.$trivia.leading(engine.build.lineComment.docOuter('Entry point.'));

	return fn.$render();
}

export function attachLeadingTrivia() {
	return engine.build.statement.function({
		visibilityModifier: 'crate',
		name: 'main',
		parameters: engine.build.parameters.strict(),
		body: engine.build.block.strict(),
	}).$trivia.leading(engine.build.lineComment.docOuter('Main entry point.'));
}

export function commentAnEmptyBody() {
	return engine.build.statement
		.function({
			name: 'todo',
			parameters: engine.build.parameters.strict(),
			body: engine.build.block.strict().$trivia.inner(engine.build.lineComment(' TODO')),
		})
		.$render();
}
