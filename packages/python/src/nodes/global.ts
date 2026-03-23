import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GlobalStatement, Identifier } from '../types.js';


class GlobalBuilder extends Builder<GlobalStatement> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('global');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GlobalStatement {
    return {
      kind: 'global_statement',
      children: this._children.map(c => c.build(ctx)),
    } as GlobalStatement;
  }

  override get nodeKind(): string { return 'global_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'global', type: 'global' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { GlobalBuilder };

export function global(...children: Builder<Identifier>[]): GlobalBuilder {
  return new GlobalBuilder(...children);
}

export interface GlobalStatementOptions {
  children: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace global {
  export function from(options: GlobalStatementOptions): GlobalBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new GlobalBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
