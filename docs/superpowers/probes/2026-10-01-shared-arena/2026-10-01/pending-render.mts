/** A render handle is lazy: does it keep the trees its coordinates name until it renders? */
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${WT}/packages/common/src/index.ts`);
const rust = (await import(`${WT}/packages/rust/src/index.ts`)).default;
const engine = await createEngine(rust);
const collect = async () => { for (let i = 0; i < 12; i++) { (globalThis as any).gc(); await new Promise((resolve) => setTimeout(resolve, 25)); } };
const attempt = (label: string, run: () => unknown) => {
	try { console.log(label, '->', JSON.stringify(String(run()))); }
	catch (error) { console.log(label, '-> throws:', (error as Error).message.slice(0, 150)); }
};
// the handle is made from a wrapped parsed node, which nothing else keeps
const pending = (() => engine.render(engine.parse('fn f() { a + b; }\n').statements()[0]))();
const immediate = (() => engine.render(engine.parse('fn g() { c; }\n').statements()[0]))();
attempt('handle turned to text at once', () => immediate);
await collect();
attempt('handle turned to text after a collection', () => pending);
