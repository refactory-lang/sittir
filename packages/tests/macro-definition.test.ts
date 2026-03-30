import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('macro_definition', () => {
  it('should create a macro_definition node via builder', () => {
    const builder = ir.macro_definition(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('macro_definition');
  });

  it('should render without throwing', () => {
    const builder = ir.macro_definition(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
