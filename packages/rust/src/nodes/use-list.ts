import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, ScopedUseList, Self, Super, UseAsClause, UseList, UseWildcard } from '../types.js';


class UseListBuilder extends Builder<UseList> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseList {
    return {
      kind: 'use_list',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UseList;
  }

  override get nodeKind(): string { return 'use_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { UseListBuilder };

export function use_list(): UseListBuilder {
  return new UseListBuilder();
}

export interface UseListOptions {
  children?: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | ScopedUseList | Self | Super | UseAsClause | UseList | UseWildcard> | (Builder<Crate | Identifier | Metavariable | ScopedIdentifier | ScopedUseList | Self | Super | UseAsClause | UseList | UseWildcard>)[];
}

export namespace use_list {
  export function from(options: UseListOptions): UseListBuilder {
    const b = new UseListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
