import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DictionarySplatPattern, Identifier, ListSplatPattern, Type, TypedParameter } from '../types.js';
import { type_ } from './type.js';
import type { TypeOptions } from './type.js';
import { list_splat_pattern } from './list-splat-pattern.js';
import type { ListSplatPatternOptions } from './list-splat-pattern.js';
import { dictionary_splat_pattern } from './dictionary-splat-pattern.js';
import type { DictionarySplatPatternOptions } from './dictionary-splat-pattern.js';


class TypedParameterBuilder extends Builder<TypedParameter> {
  private _type: Builder<Type>;
  private _children: Builder<Identifier | ListSplatPattern | DictionarySplatPattern>[] = [];

  constructor(type_: Builder<Type>) {
    super();
    this._type = type_;
  }

  children(...value: Builder<Identifier | ListSplatPattern | DictionarySplatPattern>[]): this {
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
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as TypedParameter;
  }

  override get nodeKind(): 'typed_parameter' { return 'typed_parameter'; }

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

export function typed_parameter(type_: Builder<Type>): TypedParameterBuilder {
  return new TypedParameterBuilder(type_);
}

export interface TypedParameterOptions {
  nodeKind: 'typed_parameter';
  type: Builder<Type> | Omit<TypeOptions, 'nodeKind'>;
  children?: Builder<Identifier | ListSplatPattern | DictionarySplatPattern> | string | ListSplatPatternOptions | DictionarySplatPatternOptions | (Builder<Identifier | ListSplatPattern | DictionarySplatPattern> | string | ListSplatPatternOptions | DictionarySplatPatternOptions)[];
}

export namespace typed_parameter {
  export function from(options: Omit<TypedParameterOptions, 'nodeKind'>): TypedParameterBuilder {
    const _ctor = options.type;
    const b = new TypedParameterBuilder(_ctor instanceof Builder ? _ctor : type_.from(_ctor));
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (typeof _v === 'string') return new LeafBuilder('identifier', _v); if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'list_splat_pattern': return list_splat_pattern.from(_v);   case 'dictionary_splat_pattern': return dictionary_splat_pattern.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
