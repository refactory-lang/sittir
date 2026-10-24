// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import layer1 from './layer1.ts';
import { enrich, field, wire } from '../../../dsl-authoring.ts';

export default grammar(enrich(layer1), wire({ edits: { let_statement: { 3: field('value') } } }));
