import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImplementsClause, Type } from '../types.js';


class ImplementsClauseBuilder extends Builder<ImplementsClause> {
  private _children: Builder<Type>[] = [];

  constructor(...children: Builder<Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('implements');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImplementsClause {
    return {
      kind: 'implements_clause',
      children: this._children.map(c => c.build(ctx)),
    } as ImplementsClause;
  }

  override get nodeKind(): 'implements_clause' { return 'implements_clause'; }

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

export function implements_clause(...children: Builder<Type>[]): ImplementsClauseBuilder {
  return new ImplementsClauseBuilder(...children);
}

export interface ImplementsClauseOptions {
  nodeKind: 'implements_clause';
  children?: Builder<Type> | (Builder<Type>)[];
}

export namespace implements_clause {
  export function from(input: Omit<ImplementsClauseOptions, 'nodeKind'> | Builder<Type> | (Builder<Type>)[]): ImplementsClauseBuilder {
    const options: Omit<ImplementsClauseOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ImplementsClauseOptions, 'nodeKind'>
      : { children: input } as Omit<ImplementsClauseOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ImplementsClauseBuilder(..._arr);
    return b;
  }
}
