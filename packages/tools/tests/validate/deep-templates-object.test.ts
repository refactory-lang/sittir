import { describe } from 'vitest';
import { deepRendersThroughTemplates } from './helpers/deep-templates.ts';

describe('a deep read-render-parse run', () => deepRendersThroughTemplates('object'));
