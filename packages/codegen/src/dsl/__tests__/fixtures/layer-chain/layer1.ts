// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import upstream from './upstream.js';
import { SENTINEL } from './sentinel.ts';
import { enrich, field, wire } from '../../../dsl-authoring.ts';

export default grammar(
	enrich(upstream),
	wire({
		resolutions: { grammarHash: SENTINEL, resolutions: [], bound: { grammarHash: '', resolutions: [] } },
		groups: { arguments: ($) => seq($._expression, repeat(seq(',', $._expression))) },
		edits: { let_statement: { 1: field('name') } }
	})
);
