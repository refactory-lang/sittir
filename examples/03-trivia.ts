import rust from '@sittir/rust';

const rs = await rust.createEngine();

export function attachDocComment() {
	const fn = rs.build.statement
		.function({
			visibilityModifier: 'pub',
			name: 'main',
			parameters: rs.build.parameters.strict(),
			body: rs.build.block.strict(),
		})
		.$trivia.leading(rs.build.lineComment.docOuter('Entry point.'));

	return fn.$render();
}

export function attachLeadingTrivia() {
	return rs.build.statement.function({
		visibilityModifier: 'crate',
		name: 'main',
		parameters: rs.build.parameters.strict(),
		body: rs.build.block.strict(),
	}).$trivia.leading(rs.build.lineComment.docOuter('Main entry point.'));
}

export function commentAnEmptyBody() {
	return rs.build.statement
		.function({
			name: 'todo',
			parameters: rs.build.parameters.strict(),
			body: rs.build.block.strict().$trivia.inner(rs.build.lineComment(' TODO')),
		})
		.$render();
}
