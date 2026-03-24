import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Metavariable, ScopedIdentifier, Self, Super, UseWildcard } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';


class UseWildcardBuilder extends Builder<UseWildcard> {
  private _children: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>[] = [];

  constructor() { super(); }

  children(...value: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>[]): this {
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
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as UseWildcard;
  }

  override get nodeKind(): 'use_wildcard' { return 'use_wildcard'; }

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
  nodeKind: 'use_wildcard';
  children?: Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'> | (Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'>)[];
}

export namespace use_wildcard {
  export function from(input: Omit<UseWildcardOptions, 'nodeKind'> | Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'> | (Builder<Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | Omit<ScopedIdentifierOptions, 'nodeKind'>)[]): UseWildcardBuilder {
    const options: Omit<UseWildcardOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UseWildcardOptions, 'nodeKind'>
      : { children: input } as Omit<UseWildcardOptions, 'nodeKind'>;
    const b = new UseWildcardBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : scoped_identifier.from(_x)));
    }
    return b;
  }
}
