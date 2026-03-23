import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NonlocalStatement } from '../types.js';


class NonlocalBuilder extends Builder<NonlocalStatement> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('nonlocal');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NonlocalStatement {
    return {
      kind: 'nonlocal_statement',
      children: this._children.map(c => c.build(ctx)),
    } as NonlocalStatement;
  }

  override get nodeKind(): string { return 'nonlocal_statement'; }

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

export type { NonlocalBuilder };

export function nonlocal(...children: Builder<Identifier>[]): NonlocalBuilder {
  return new NonlocalBuilder(...children);
}

export interface NonlocalStatementOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace nonlocal {
  export function from(options: NonlocalStatementOptions): NonlocalBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new NonlocalBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
