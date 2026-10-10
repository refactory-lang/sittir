// Whether the bindings reader keeps an anchor: tsx anchors.mts <worktree>
//
// Reads python's function docstring claim with and without its two anchors (`.`, first child) and
// compares the facts. Equal facts mean the read dispatch cannot test the docstring's position.
const wt = process.argv[2];
const { readBindings } = await import(`${wt}/packages/codegen/src/bindings/index.ts`);
const anchored = '(function_definition body: (suite_block (block . (simple_statements (simple_statements_elements . item: (expression_statement (string) @doc @literal.string.docstring))))))';
const plain = anchored.replaceAll(' . ', ' ');
const [a, b] = [await readBindings(anchored), await readBindings(plain)];
console.log('claims equal:', JSON.stringify(a.claims) === JSON.stringify(b.claims), 'members equal:', JSON.stringify(a.members) === JSON.stringify(b.members));
console.log(JSON.stringify(a.claims));
