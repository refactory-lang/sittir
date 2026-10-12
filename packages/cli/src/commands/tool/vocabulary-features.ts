import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const vocabularyFeatures: CommandModule = {
	name: 'vocabulary-features',
	describe:
		"Check the vocabulary's feature folders and generate what they imply: the augmentation that adds each feature's kinds and gated members, every level's union, and the registry of markers",
	register: (program) => {
		defineCommand(program, vocabularyFeatures)
			.option('--write', 'Write augment.ts and features/index.ts under packages/types/src/vocabulary')
			.option('--check', 'Fail when the planner finds an issue in the feature folders, or the committed augment.ts or features/index.ts differ from what they generate')
			.action(async (opts: { write?: boolean; check?: boolean }) => {
				const { vocabularyFeatures: runVocabularyFeatures } = await import('@sittir/tools');
				const code = await runVocabularyFeatures({ write: opts.write ?? false, check: opts.check ?? false });
				if (code !== 0) process.exitCode = code;
			});
	}
};
