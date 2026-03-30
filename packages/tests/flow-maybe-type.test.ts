import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('flow_maybe_type', () => {
  it('should create a flow_maybe_type node via builder', () => {
    const builder = ir.flow_maybe_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('flow_maybe_type');
  });

  it('should render without throwing', () => {
    const builder = ir.flow_maybe_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
