import { ADJACENT_MARK, type Body } from '../../render-body.ts';

export function showBody(body: Body): string {
	let out = '';
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				out += node.text;
				break;
			case 'whitespace':
				out += `⟨ws ${JSON.stringify(node.text)}⟩`;
				break;
			case 'slot':
				out += `⟨${node.name}⟩`;
				break;
			case 'space':
				out += ' ';
				break;
			case 'adjacent':
				out += ADJACENT_MARK;
				break;
			case 'if':
				node.arms.forEach((arm, i) => {
					out += `⟨${i === 0 ? 'if' : 'elif'} ${arm.test}⟩${showBody(arm.body)}`;
				});
				if (node.fallback !== undefined) out += `⟨else⟩${showBody(node.fallback)}`;
				out += '⟨end⟩';
				break;
			case 'indent':
				out += `⟨indent⟩${showBody(node.body)}⟨end⟩`;
				break;
		}
	}
	return out;
}
