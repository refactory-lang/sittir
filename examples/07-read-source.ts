import rust from '@sittir/rust';

const rs = await rust.createEngine();

export function readSource(source: string) {
	return rs.parse(source);
}

export function readFirstFunction(source: string) {
	const file = rs.parse(source);
	const first = file.statements()[0];
	if (first === undefined || !rs.is.functionItem(first)) return undefined;

	return {
		name: rs.render(first.name()).toString(),
		body: first.body(),
		statements: first.body().statements(),
	};
}
