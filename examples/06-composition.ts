import { ir } from '@sittir/typescript';

interface GrammarSummary {
	name: string;
	kindCount: number;
}

export function renderSummaryInterface(summary: GrammarSummary) {
	return ir.interfaceDeclaration({
		name: summary.name,
		body: {
			members: [
				ir.propertySignature({
					name: 'kindCount',
					type: { type: 'number' },
				}),
				ir.propertySignature({
					name: 'hasKinds',
					type: { type: 'boolean' },
				}),
			],
		},
	}).$render();
}
