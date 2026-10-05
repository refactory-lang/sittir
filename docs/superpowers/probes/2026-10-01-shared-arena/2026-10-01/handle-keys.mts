/** Which nodes carry $handle (or another coordinate key) today. */
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${WT}/packages/common/src/index.ts`);
const rust = (await import(`${WT}/packages/rust/src/index.ts`)).default;
const engine = await createEngine(rust);
const b = engine.build;
const COORDINATE = ['$handle', '$parentHandle', '$treeHandle', '$span', '$childIndex', '$textOnly'];
const show = (label: string, node: any) => {
	const coordinate = COORDINATE.filter((key) => key in node).map((key) => `${key}=${typeof node[key] === 'object' ? JSON.stringify(node[key]) : node[key]}`);
	console.log(`${label.padEnd(44)} $source=${node.$source}  ${coordinate.length === 0 ? 'no coordinate keys' : coordinate.join(' ')}  engine: ${typeof node.$engine === 'function' ? 'yes' : 'no'}`);
};
const leaf = b.identifier('x');
const built = b.binaryExpression({ left: leaf, operator: '+', right: b.identifier('y') });
show('built leaf', leaf);
show('built compound', built);

const root = engine.parse('fn f() { a + b; }\n');
const fn = root.statements()[0];
show('parsed root', root);
show('parsed child (function item)', fn);
const edited = fn.$with.name(b.identifier('g'));
show('parsed node after $with (edited)', edited);
show('  its untouched body', edited.body());
const mixed = b.binaryExpression({ left: fn.name(), operator: '+', right: leaf });
show('built node holding a parsed child', mixed);
show('  that parsed child', mixed.left());
console.log('tree id of the parsed child handle:', Math.floor(fn.name().$handle / 2 ** 32), 'index:', fn.name().$handle % 2 ** 32);
