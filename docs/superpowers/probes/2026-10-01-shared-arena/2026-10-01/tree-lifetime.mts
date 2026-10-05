/** Does a parsed node that a built node holds keep its tree alive across a collection? */
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${WT}/packages/common/src/index.ts`);
const rust = (await import(`${WT}/packages/rust/src/index.ts`)).default;
const engine = await createEngine(rust);
const collect = async () => { for (let i = 0; i < 12; i++) { (globalThis as any).gc(); await new Promise((resolve) => setTimeout(resolve, 25)); } };
const attempt = (label: string, node: unknown) => {
	try { console.log(`${label.padEnd(58)} -> ${JSON.stringify(String(engine.render(node as never)))}`); }
	catch (error) { console.log(`${label.padEnd(58)} -> throws: ${(error as Error).message.slice(0, 140)}`); }
};
// each holder is built in a function so nothing else of its tree stays reachable
const aroundLeaf = () => { const leaf = engine.parse('fn f() { a + b; }\n').statements()[0].name(); return engine.build.binaryExpression({ left: leaf, operator: '+', right: engine.build.identifier('y') }); };
const aroundWrapped = () => { const expr = engine.parse('fn g() { c * d }\n').statements()[0].body().trailingExpression?.() ?? engine.parse('fn g() { c * d }\n').statements()[0].body(); return engine.build.parenthesizedExpression(expr as never); };
const leafHolder = aroundLeaf();
let wrappedHolder: unknown;
try { wrappedHolder = aroundWrapped(); } catch (error) { console.log('wrapped holder not built:', (error as Error).message.slice(0, 120)); }
console.log('held leaf has $engine:', typeof (leafHolder as any).left().$engine === 'function', '| held leaf keys:', Object.keys((leafHolder as any).left()).join(','));
attempt('before collection: built node around a parsed leaf', leafHolder);
if (wrappedHolder !== undefined) attempt('before collection: built node around a wrapped parsed node', wrappedHolder);
await collect();
attempt('after collection:  built node around a parsed leaf', leafHolder);
if (wrappedHolder !== undefined) attempt('after collection:  built node around a wrapped parsed node', wrappedHolder);
