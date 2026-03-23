import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, ThrowStatement } from '../types.js';


class ThrowStatementBuilder extends Builder<ThrowStatement> {
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(...children: Builder<Expression | SequenceExpression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('throw');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ThrowStatement {
    return {
      kind: 'throw_statement',
      children: this._children.map(c => c.build(ctx)),
    } as ThrowStatement;
  }

  override get nodeKind(): string { return 'throw_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'throw', type: 'throw' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ThrowStatementBuilder };

export function throw_statement(...children: Builder<Expression | SequenceExpression>[]): ThrowStatementBuilder {
  return new ThrowStatementBuilder(...children);
}

export interface ThrowStatementOptions {
  children?: Builder<Expression | SequenceExpression> | (Builder<Expression | SequenceExpression>)[];
}

export namespace throw_statement {
  export function from(options: ThrowStatementOptions): ThrowStatementBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ThrowStatementBuilder(..._arr);
    return b;
  }
}
