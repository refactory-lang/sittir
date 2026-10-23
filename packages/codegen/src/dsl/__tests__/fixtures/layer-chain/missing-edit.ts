// @ts-nocheck — evaluated with the DSL globals of whichever runtime loads it
import upstream from './upstream.js';
import { enrich, field, wire } from '../../../dsl-authoring.ts';

export default grammar(enrich(upstream), wire({ edits: { let_statemnt: { 1: field('name') }, expression_statement: { 0: field('value') } } }));
