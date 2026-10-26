// Usage: node --import tsx probe.mts <checkout> [construction]
// Renders each side-entry case through one construction of the rust grammar
// and prints one JSON object, case -> rendered text or refusal. The
// constructions are `objects`, and on a checkout with record storage
// `arena objects` and `records`.
import { existsSync } from 'node:fs';

const [W, name = 'objects'] = process.argv.slice(2);
if (W === undefined) throw new Error('usage: probe.mts <checkout> [construction]');
const { createEngine } = await import(`${W}/packages/common/src/index.ts`);
const constructions: [string, any][] = [['objects', await createEngine((await import(`${W}/packages/rust/src/index.ts`)).default)]];
if (existsSync(`${W}/packages/rust/src/arena.ts`)) {
	const arena = (await import(`${W}/packages/rust/src/arena.ts`)).default;
	const { useRecordConstruction } = await import(`${W}/packages/common/src/create-engine.ts`);
	const records = await arena.createEngine();
	useRecordConstruction(records, await import(`${W}/packages/rust/src/factories/records.ts`));
	constructions.push(['arena objects', await arena.createEngine()], ['records', records]);
}
const rs = constructions.find(([label]) => label === name)?.[1];
if (rs === undefined) throw new Error(`no construction ${name} in ${W}`);
const b = rs.build;
const comment = (text: string) => b.blockComment(b.blockCommentRegular(` ${text} `));
const parsedComment = () => {
	const source = rs.parse('fn f() {\n    x; /* parsed */\n}\n');
	return source.statements()[0].body().statements()[0].$trivia.trailing()[0];
};
const parsedG = () => {
	const root = rs.parse('fn f() {\n    g();\n}\n');
	return { root, g: root.statements()[0].body().statements()[0] };
};
const builtY = () => b.expressionStatement(b.identifier('y'));
const out: Record<string, string> = {};
const run = (label: string, render: () => string) => {
	try {
		out[label] = render();
	} catch (error) {
		out[label] = `refused: ${(error as Error).message}`;
	}
};
run('A. parsed holder, built entry, side written on the entry after placing', () => {
	const { root, g } = parsedG();
	const c = comment('c');
	g.$trivia.trailing(c);
	c.$trivia.leading(comment('later'));
	return root.$render();
});
run('B1. built holder, parsed entry with a written side', () => {
	const parsed = parsedComment();
	parsed.$trivia.leading(comment('0'));
	const y = builtY();
	y.$trivia.trailing(parsed);
	return y.$render();
});
run('B2. built holder, parsed entry, side written on the entry after placing', () => {
	const parsed = parsedComment();
	const y = builtY();
	y.$trivia.trailing(parsed);
	parsed.$trivia.leading(comment('0'));
	return y.$render();
});
run("B3. parsed holder, another tree's parsed entry, side written on the entry after placing", () => {
	const parsed = parsedComment();
	const { root, g } = parsedG();
	g.$trivia.trailing(parsed);
	parsed.$trivia.leading(comment('0'));
	return root.$render();
});
run('control: parsed holder, built entry written on before placing', () => {
	const { root, g } = parsedG();
	const c = comment('c');
	c.$trivia.leading(comment('later'));
	g.$trivia.trailing(c);
	return root.$render();
});
run('control: built holder, built entry, side written on the entry after placing', () => {
	const y = builtY();
	const c = comment('c');
	y.$trivia.trailing(c);
	c.$trivia.leading(comment('later'));
	return y.$render();
});
run("control: parsed holder, another tree's parsed entry with a written side", () => {
	const parsed = parsedComment();
	parsed.$trivia.leading(comment('0'));
	const { root, g } = parsedG();
	g.$trivia.trailing(parsed);
	return root.$render();
});
console.log(JSON.stringify(out));
