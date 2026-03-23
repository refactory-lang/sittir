import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExpressionStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExpressionBuilder extends BaseBuilder<ExpressionStatement> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionStatement {
    return {
      kind: 'expression_statement',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExpressionStatement;
  }

  override get nodeKind(): string { return 'expression_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export function expression(children: Child): ExpressionBuilder {
  return new ExpressionBuilder(children);
}
