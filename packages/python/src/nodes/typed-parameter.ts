import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DictionarySplatPattern, Identifier, ListSplatPattern, TypedParameter } from '../types.js';


class TypedParameterBuilder extends Builder<TypedParameter> {
  private _type: Builder;
  private _children: Builder<DictionarySplatPattern | Identifier | ListSplatPattern>[] = [];

  constructor(type_: Builder) {
    super();
    this._type = type_;
  }

  children(...value: Builder<DictionarySplatPattern | Identifier | ListSplatPattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypedParameter {
    return {
      kind: 'typed_parameter',
      type: this._type.build(ctx),
      children: this._children[0]?.build(ctx),
    } as TypedParameter;
  }

  override get nodeKind(): string { return 'typed_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TypedParameterBuilder };

export function typed_parameter(type_: Builder): TypedParameterBuilder {
  return new TypedParameterBuilder(type_);
}

export interface TypedParameterOptions {
  type: Builder;
  children?: Builder<DictionarySplatPattern | Identifier | ListSplatPattern> | (Builder<DictionarySplatPattern | Identifier | ListSplatPattern>)[];
}

export namespace typed_parameter {
  export function from(options: TypedParameterOptions): TypedParameterBuilder {
    const b = new TypedParameterBuilder(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
