import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FragmentSpecifier, Metavariable, TokenBindingPattern } from '../types.js';


class TokenBindingPatternBuilder extends Builder<TokenBindingPattern> {
  private _name: Builder<Metavariable>;
  private _type!: Builder<FragmentSpecifier>;

  constructor(name: Builder<Metavariable>) {
    super();
    this._name = name;
  }

  type(value: Builder<FragmentSpecifier>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TokenBindingPattern {
    return {
      kind: 'token_binding_pattern',
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
    } as TokenBindingPattern;
  }

  override get nodeKind(): 'token_binding_pattern' { return 'token_binding_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TokenBindingPatternBuilder };

export function token_binding_pattern(name: Builder<Metavariable>): TokenBindingPatternBuilder {
  return new TokenBindingPatternBuilder(name);
}

export interface TokenBindingPatternOptions {
  nodeKind: 'token_binding_pattern';
  name: Builder<Metavariable> | string;
  type: Builder<FragmentSpecifier> | string;
}

export namespace token_binding_pattern {
  export function from(options: Omit<TokenBindingPatternOptions, 'nodeKind'>): TokenBindingPatternBuilder {
    const _ctor = options.name;
    const b = new TokenBindingPatternBuilder(typeof _ctor === 'string' ? new LeafBuilder('metavariable', _ctor) : _ctor);
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(typeof _v === 'string' ? new LeafBuilder('fragment_specifier', _v) : _v);
    }
    return b;
  }
}
