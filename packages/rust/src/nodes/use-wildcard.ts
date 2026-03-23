import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, Self, Super, UseWildcard } from '../types.js';


class UseWildcardBuilder extends Builder<UseWildcard> {
  private _children: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>[] = [];

  constructor() { super(); }

  children(...value: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('*');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UseWildcard {
    return {
      kind: 'use_wildcard',
      children: this._children[0]?.build(ctx),
    } as UseWildcard;
  }

  override get nodeKind(): string { return 'use_wildcard'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '*', type: '*' });
    return parts;
  }
}

export type { UseWildcardBuilder };

export function use_wildcard(): UseWildcardBuilder {
  return new UseWildcardBuilder();
}

export interface UseWildcardOptions {
  children?: Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super> | (Builder<Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>)[];
}

export namespace use_wildcard {
  export function from(options: UseWildcardOptions): UseWildcardBuilder {
    const b = new UseWildcardBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
