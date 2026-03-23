import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, IndexExpression } from '../types.js';


class IndexBuilder extends Builder<IndexExpression> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('[');
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IndexExpression {
    return {
      kind: 'index_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as IndexExpression;
  }

  override get nodeKind(): string { return 'index_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '[', type: '[' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { IndexBuilder };

export function index(...children: Builder[]): IndexBuilder {
  return new IndexBuilder(...children);
}

export interface IndexExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace index {
  export function from(options: IndexExpressionOptions): IndexBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new IndexBuilder(..._arr);
    return b;
  }
}
