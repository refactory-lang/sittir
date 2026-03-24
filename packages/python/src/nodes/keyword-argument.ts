import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, KeywordArgument } from '../types.js';


class KeywordArgumentBuilder extends Builder<KeywordArgument> {
  private _name: Builder<Identifier>;
  private _value!: Builder<Expression>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('=');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): KeywordArgument {
    return {
      kind: 'keyword_argument',
      name: this._name.build(ctx),
      value: this._value ? this._value.build(ctx) : undefined,
    } as KeywordArgument;
  }

  override get nodeKind(): 'keyword_argument' { return 'keyword_argument'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { KeywordArgumentBuilder };

export function keyword_argument(name: Builder<Identifier>): KeywordArgumentBuilder {
  return new KeywordArgumentBuilder(name);
}

export interface KeywordArgumentOptions {
  nodeKind: 'keyword_argument';
  name: Builder<Identifier> | string;
  value: Builder<Expression>;
}

export namespace keyword_argument {
  export function from(options: Omit<KeywordArgumentOptions, 'nodeKind'>): KeywordArgumentBuilder {
    const _ctor = options.name;
    const b = new KeywordArgumentBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
