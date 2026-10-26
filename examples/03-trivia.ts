import rust from '@sittir/rust';

const rs = await rust.createEngine();
const rsStrict = await rust.createEngine({ api: 'strict' });

export function attachDocComment() {
	const fn = rs.build.statement
		.function({
			visibilityModifier: 'pub',
			name: 'main',
			parameters: rsStrict.build.parameters(),
			body: rsStrict.build.block(),
		})
		.$trivia.leading(rs.build.lineComment.docOuter('Entry point.'));

	return fn.$render();
}

export function commentAnEmptyBody() {
	return rs.build.statement
		.function({
			name: 'todo',
			parameters: rsStrict.build.parameters(),
			body: rsStrict.build.block().$trivia.inner(rs.build.lineComment(' TODO')),
		})
		.$render();
}
