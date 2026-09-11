import type { Body } from '../../render-body.ts';

export function showBody(body: Body): string {
	let out = '';
	for (const node of body) {
		switch (node.kind) {
			case 'text':
				out += node.text;
				break;
			case 'indent':
				out += '⟨indent⟩';
				break;
			case 'dedent':
				out += '⟨dedent⟩';
				break;
			case 'tokenSeam':
				out += `⟨tokenSeam ${JSON.stringify(node.text)}⟩`;
				break;
			case 'slot':
				out += `⟨${node.name}⟩`;
				break;
			case 'space':
				out += ' ';
				break;
			case 'adjacent':
				out += '⟨adjacent⟩';
				break;
			case 'seam':
				out += `⟨seam ${node.field}⟩`;
				break;
			case 'if':
				node.arms.forEach((arm, i) => {
					out += `⟨${i === 0 ? 'if' : 'elif'} ${arm.test}⟩${showBody(arm.body)}`;
				});
				if (node.fallback !== undefined) out += `⟨else⟩${showBody(node.fallback)}`;
				out += '⟨end⟩';
				break;
		}
	}
	return out;
}
