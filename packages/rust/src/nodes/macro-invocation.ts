import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, MacroInvocation, ScopedIdentifier, TokenTree } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { token_tree } from './token-tree.js';
import type { TokenTreeOptions } from './token-tree.js';


class MacroInvocationBuilder extends Builder<MacroInvocation> {
  private _macro: Builder<Identifier | ScopedIdentifier>;
  private _children: Builder<TokenTree>[] = [];

  constructor(macro: Builder<Identifier | ScopedIdentifier>) {
    super();
    this._macro = macro;
  }

  children(...value: Builder<TokenTree>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._macro) parts.push(this.renderChild(this._macro, ctx));
    parts.push('!');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MacroInvocation {
    return {
      kind: 'macro_invocation',
      macro: this._macro.build(ctx),
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as MacroInvocation;
  }

  override get nodeKind(): 'macro_invocation' { return 'macro_invocation'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._macro) parts.push({ kind: 'builder', builder: this._macro, fieldName: 'macro' });
    parts.push({ kind: 'token', text: '!', type: '!' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { MacroInvocationBuilder };

export function macro_invocation(macro: Builder<Identifier | ScopedIdentifier>): MacroInvocationBuilder {
  return new MacroInvocationBuilder(macro);
}

export interface MacroInvocationOptions {
  nodeKind: 'macro_invocation';
  macro: Builder<Identifier | ScopedIdentifier> | string | Omit<ScopedIdentifierOptions, 'nodeKind'>;
  children?: Builder<TokenTree> | Omit<TokenTreeOptions, 'nodeKind'> | (Builder<TokenTree> | Omit<TokenTreeOptions, 'nodeKind'>)[];
}

export namespace macro_invocation {
  export function from(options: Omit<MacroInvocationOptions, 'nodeKind'>): MacroInvocationBuilder {
    const _ctor = options.macro;
    const b = new MacroInvocationBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor instanceof Builder ? _ctor : scoped_identifier.from(_ctor));
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : token_tree.from(_x)));
    }
    return b;
  }
}
