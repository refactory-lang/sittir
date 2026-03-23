import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IndexExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class IndexBuilder extends BaseBuilder<IndexExpression> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
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

export function index(children: Child[]): IndexBuilder {
  return new IndexBuilder(children);
}
