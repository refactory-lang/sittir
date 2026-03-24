import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NonlocalStatement } from '../types.js';


class NonlocalStatementBuilder extends Builder<NonlocalStatement> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('nonlocal');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NonlocalStatement {
    return {
      kind: 'nonlocal_statement',
      children: this._children.map(c => c.build(ctx)),
    } as NonlocalStatement;
  }

  override get nodeKind(): 'nonlocal_statement' { return 'nonlocal_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'nonlocal', type: 'nonlocal' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { NonlocalStatementBuilder };

export function nonlocal_statement(...children: Builder<Identifier>[]): NonlocalStatementBuilder {
  return new NonlocalStatementBuilder(...children);
}

export interface NonlocalStatementOptions {
  nodeKind: 'nonlocal_statement';
  children?: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace nonlocal_statement {
  export function from(input: Omit<NonlocalStatementOptions, 'nodeKind'> | Builder<Identifier> | string | (Builder<Identifier> | string)[]): NonlocalStatementBuilder {
    const options: Omit<NonlocalStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<NonlocalStatementOptions, 'nodeKind'>
      : { children: input } as Omit<NonlocalStatementOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new NonlocalStatementBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
