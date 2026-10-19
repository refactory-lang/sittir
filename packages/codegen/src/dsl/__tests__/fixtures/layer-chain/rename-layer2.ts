// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import layer1 from './plain-layer1.ts';
import { enrich, rename, wire } from '../../../dsl-authoring.ts';

export default grammar(enrich(layer1), wire({ edits: { binary_expression: { '.': rename('binary_op') } } }));
