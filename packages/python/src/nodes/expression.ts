import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Assignment, AugmentedAssignment, Expression, ExpressionStatement } from '../types.js';


class ExpressionBuilder extends Builder<ExpressionStatement> {
  private _children: Builder<Assignment | AugmentedAssignment | Expression>[] = [];

  constructor(...children: Builder<Assignment | AugmentedAssignment | Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionStatement {
    return {
      kind: 'expression_statement',
      children: this._children.map(c => c.build(ctx)),
    } as ExpressionStatement;
  }

  override get nodeKind(): string { return 'expression_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExpressionBuilder };

export function expression(...children: Builder<Assignment | AugmentedAssignment | Expression>[]): ExpressionBuilder {
  return new ExpressionBuilder(...children);
}

export interface ExpressionStatementOptions {
  children: Builder<Assignment | AugmentedAssignment | Expression> | (Builder<Assignment | AugmentedAssignment | Expression>)[];
}

export namespace expression {
  export function from(options: ExpressionStatementOptions): ExpressionBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ExpressionBuilder(..._arr);
    return b;
  }
}
