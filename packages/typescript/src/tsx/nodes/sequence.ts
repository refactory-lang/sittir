import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression } from '../types.js';


class SequenceBuilder extends Builder<SequenceExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SequenceExpression {
    return {
      kind: 'sequence_expression',
      children: this._children.map(c => c.build(ctx)),
    } as SequenceExpression;
  }

  override get nodeKind(): string { return 'sequence_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { SequenceBuilder };

export function sequence(...children: Builder<Expression>[]): SequenceBuilder {
  return new SequenceBuilder(...children);
}

export interface SequenceExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace sequence {
  export function from(options: SequenceExpressionOptions): SequenceBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new SequenceBuilder(..._arr);
    return b;
  }
}
