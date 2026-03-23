import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SequenceExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SequenceBuilder extends BaseBuilder<SequenceExpression> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('sequence');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SequenceExpression {
    return {
      kind: 'sequence_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SequenceExpression;
  }

  override get nodeKind(): string { return 'sequence_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'sequence' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function sequence(children: Child[]): SequenceBuilder {
  return new SequenceBuilder(children);
}
