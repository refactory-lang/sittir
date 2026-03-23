import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImplementsClause } from '../types.js';


class ImplementsClauseBuilder extends Builder<ImplementsClause> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('implements');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImplementsClause {
    return {
      kind: 'implements_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImplementsClause;
  }

  override get nodeKind(): string { return 'implements_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'implements', type: 'implements' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { ImplementsClauseBuilder };

export function implements_clause(...children: Builder[]): ImplementsClauseBuilder {
  return new ImplementsClauseBuilder(...children);
}

export interface ImplementsClauseOptions {
  children: Builder | (Builder)[];
}

export namespace implements_clause {
  export function from(options: ImplementsClauseOptions): ImplementsClauseBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ImplementsClauseBuilder(..._arr);
    return b;
  }
}
