import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, MacroInvocation, ScopedIdentifier, TokenTree } from '../types.js';


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
      children: this._children[0]?.build(ctx),
    } as MacroInvocation;
  }

  override get nodeKind(): string { return 'macro_invocation'; }

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
  macro: Builder<Identifier | ScopedIdentifier>;
  children?: Builder<TokenTree> | (Builder<TokenTree>)[];
}

export namespace macro_invocation {
  export function from(options: MacroInvocationOptions): MacroInvocationBuilder {
    const b = new MacroInvocationBuilder(options.macro);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
