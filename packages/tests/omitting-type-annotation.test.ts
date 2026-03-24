import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('omitting_type_annotation', () => {
  it('should create a omitting_type_annotation node via builder', () => {
    const builder = ir.omitting_type_annotation(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('omitting_type_annotation');
  });

  it('should render without throwing', () => {
    const builder = ir.omitting_type_annotation(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
