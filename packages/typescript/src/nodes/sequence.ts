import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SequenceExpression } from '../types.js';


class SequenceBuilder extends BaseBuilder<SequenceExpression> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function sequence(children: BaseBuilder[]): SequenceBuilder {
  return new SequenceBuilder(children);
}
