import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WithClause, WithItem } from '../types.js';


class WithClauseBuilder extends Builder<WithClause> {
  private _children: Builder<WithItem>[] = [];

  constructor(...children: Builder<WithItem>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithClause {
    return {
      kind: 'with_clause',
      children: this._children.map(c => c.build(ctx)),
    } as WithClause;
  }

  override get nodeKind(): string { return 'with_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { WithClauseBuilder };

export function with_clause(...children: Builder<WithItem>[]): WithClauseBuilder {
  return new WithClauseBuilder(...children);
}

export interface WithClauseOptions {
  children: Builder<WithItem> | (Builder<WithItem>)[];
}

export namespace with_clause {
  export function from(options: WithClauseOptions): WithClauseBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new WithClauseBuilder(..._arr);
    return b;
  }
}
