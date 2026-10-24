// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import upstream from './conflicts-upstream.js';
import { enrich, wire } from '../../../dsl-authoring.ts';

const derived = {
	resolution: { kind: 'AddConflict', symbols: ['call_expression', 'binary_expression'] },
	step: 'default',
	sourceChains: [['call_expression'], ['binary_expression']],
	conflict: { symbolSequence: [], lookahead: '', interpretations: [] }
};

export default grammar(
	enrich(upstream),
	wire({
		resolutions: { grammarHash: '', resolutions: [derived], bound: { resolutions: [], withdrawn: [['call_expression', 'binary_expression']] } }
	})
);
