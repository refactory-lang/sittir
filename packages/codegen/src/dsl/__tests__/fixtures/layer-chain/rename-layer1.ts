// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import upstream from './conflicts-upstream.js';
import { enrich, rename, wire } from '../../../dsl-authoring.ts';

export default grammar(
	enrich(upstream),
	wire({
		edits: {
			binary_expression: { '.': rename('binary_op') },
			program: { '.': rename('prog') },
			let_statement: { '.': rename('expression_statement') },
			_statement: { '.': rename('statement') },
			number: { '0': rename('x') }
		}
	})
);
