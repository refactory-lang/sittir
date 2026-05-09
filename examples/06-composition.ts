import { ir } from '@sittir/typescript';

interface GrammarSummary {
	name: string;
	kindCount: number;
}

export function renderSummaryInterface(summary: GrammarSummary) {
	return ir.interfaceDeclaration.from({
		name: summary.name,
		body: {
			members: [
				ir.propertySignature.from({
					name: 'kindCount',
					type: { type: 'number' },
				}),
				ir.propertySignature.from({
					name: 'hasKinds',
					type: { type: 'boolean' },
				}),
			],
		},
	}).$render();
}
