import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WhereClause, WherePredicate } from '../types.js';


class WhereClauseBuilder extends Builder<WhereClause> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('where');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhereClause {
    return {
      kind: 'where_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as WhereClause;
  }

  override get nodeKind(): string { return 'where_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'where', type: 'where' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { WhereClauseBuilder };

export function where_clause(): WhereClauseBuilder {
  return new WhereClauseBuilder();
}

export interface WhereClauseOptions {
  children?: Builder<WherePredicate> | (Builder<WherePredicate>)[];
}

export namespace where_clause {
  export function from(options: WhereClauseOptions): WhereClauseBuilder {
    const b = new WhereClauseBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
