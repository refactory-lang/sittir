import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GlobalStatement, Identifier } from '../types.js';


class GlobalStatementBuilder extends Builder<GlobalStatement> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('global');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GlobalStatement {
    return {
      kind: 'global_statement',
      children: this._children.map(c => c.build(ctx)),
    } as GlobalStatement;
  }

  override get nodeKind(): 'global_statement' { return 'global_statement'; }

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

export type { GlobalStatementBuilder };

export function global_statement(...children: Builder<Identifier>[]): GlobalStatementBuilder {
  return new GlobalStatementBuilder(...children);
}

export interface GlobalStatementOptions {
  nodeKind: 'global_statement';
  children?: Builder<Identifier> | string | (Builder<Identifier> | string)[];
}

export namespace global_statement {
  export function from(input: Omit<GlobalStatementOptions, 'nodeKind'> | Builder<Identifier> | string | (Builder<Identifier> | string)[]): GlobalStatementBuilder {
    const options: Omit<GlobalStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<GlobalStatementOptions, 'nodeKind'>
      : { children: input } as Omit<GlobalStatementOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new GlobalStatementBuilder(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v));
    return b;
  }
}
