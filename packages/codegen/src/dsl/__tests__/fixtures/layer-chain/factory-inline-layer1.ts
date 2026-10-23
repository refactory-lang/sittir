// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import upstream from './conflicts-upstream.js';
import { enrich, wire } from '../../../dsl-authoring.ts';

export default grammar(enrich(upstream), wire({ factoryInline: ($) => [$.binary_expression] }));
