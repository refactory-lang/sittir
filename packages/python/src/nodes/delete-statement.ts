import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeleteStatement, Expression, ExpressionList } from '../types.js';


class DeleteStatementBuilder extends Builder<DeleteStatement> {
  private _children: Builder<Expression | ExpressionList>[] = [];

  constructor(children: Builder<Expression | ExpressionList>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('del');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DeleteStatement {
    return {
      kind: 'delete_statement',
      children: this._children[0]?.build(ctx),
    } as DeleteStatement;
  }

  override get nodeKind(): string { return 'delete_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'del', type: 'del' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DeleteStatementBuilder };

export function delete_statement(children: Builder<Expression | ExpressionList>): DeleteStatementBuilder {
  return new DeleteStatementBuilder(children);
}

export interface DeleteStatementOptions {
  children: Builder<Expression | ExpressionList> | (Builder<Expression | ExpressionList>)[];
}

export namespace delete_statement {
  export function from(options: DeleteStatementOptions): DeleteStatementBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DeleteStatementBuilder(_ctor);
    return b;
  }
}
