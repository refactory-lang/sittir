import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WithClause, WithItem } from '../types.js';
import { with_ } from './with.js';
import type { WithItemOptions } from './with.js';


class WithClauseBuilder extends Builder<WithClause> {
  private _children: Builder<WithItem>[] = [];

  constructor(...children: Builder<WithItem>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithClause {
    return {
      kind: 'with_clause',
      children: this._children.map(c => c.build(ctx)),
    } as WithClause;
  }

  override get nodeKind(): 'with_clause' { return 'with_clause'; }

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
  nodeKind: 'with_clause';
  children?: Builder<WithItem> | Omit<WithItemOptions, 'nodeKind'> | (Builder<WithItem> | Omit<WithItemOptions, 'nodeKind'>)[];
}

export namespace with_clause {
  export function from(input: Omit<WithClauseOptions, 'nodeKind'> | Builder<WithItem> | Omit<WithItemOptions, 'nodeKind'> | (Builder<WithItem> | Omit<WithItemOptions, 'nodeKind'>)[]): WithClauseBuilder {
    const options: Omit<WithClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<WithClauseOptions, 'nodeKind'>
      : { children: input } as Omit<WithClauseOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new WithClauseBuilder(..._arr.map(_v => _v instanceof Builder ? _v : with_.from(_v)));
    return b;
  }
}
