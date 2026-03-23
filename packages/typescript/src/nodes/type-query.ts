import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Arguments, CallExpression, Identifier, Import, InstantiationExpression, MemberExpression, Number, PredefinedType, PrivatePropertyIdentifier, PropertyIdentifier, String, SubscriptExpression, This, TypeArguments, TypeQuery } from '../types.js';
import { arguments_ } from './arguments.js';
import type { ArgumentsOptions } from './arguments.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class TypeQueryBuilder extends Builder<TypeQuery> {
  private _object?: Builder<Identifier | This | SubscriptExpression | MemberExpression | CallExpression>;
  private _index?: Builder<PredefinedType | String | Number>;
  private _property?: Builder<PrivatePropertyIdentifier | PropertyIdentifier>;
  private _function?: Builder<Import | Identifier | MemberExpression | SubscriptExpression>;
  private _arguments?: Builder<Arguments>;
  private _typeArguments?: Builder<TypeArguments>;
  private _children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>[] = [];

  constructor(...children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>[]) {
    super();
    this._children = children;
  }

  object(value: Builder<Identifier | This | SubscriptExpression | MemberExpression | CallExpression>): this {
    this._object = value;
    return this;
  }

  index(value: Builder<PredefinedType | String | Number>): this {
    this._index = value;
    return this;
  }

  property(value: Builder<PrivatePropertyIdentifier | PropertyIdentifier>): this {
    this._property = value;
    return this;
  }

  function(value: Builder<Import | Identifier | MemberExpression | SubscriptExpression>): this {
    this._function = value;
    return this;
  }

  arguments(value: Builder<Arguments>): this {
    this._arguments = value;
    return this;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('typeof');
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    if (this._index) parts.push(this.renderChild(this._index, ctx));
    if (this._property) parts.push(this.renderChild(this._property, ctx));
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeQuery {
    return {
      kind: 'type_query',
      object: this._object?.build(ctx),
      index: this._index?.build(ctx),
      property: this._property?.build(ctx),
      function: this._function?.build(ctx),
      arguments: this._arguments?.build(ctx),
      typeArguments: this._typeArguments?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as TypeQuery;
  }

  override get nodeKind(): string { return 'type_query'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'typeof', type: 'typeof' });
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    if (this._index) parts.push({ kind: 'builder', builder: this._index, fieldName: 'index' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { TypeQueryBuilder };

export function type_query(...children: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>[]): TypeQueryBuilder {
  return new TypeQueryBuilder(...children);
}

export interface TypeQueryOptions {
  object?: Builder<Identifier | This | SubscriptExpression | MemberExpression | CallExpression>;
  index?: Builder<PredefinedType | String | Number>;
  property?: Builder<PrivatePropertyIdentifier | PropertyIdentifier>;
  function?: Builder<Import | Identifier | MemberExpression | SubscriptExpression>;
  arguments?: Builder<Arguments> | ArgumentsOptions;
  typeArguments?: Builder<TypeArguments> | TypeArgumentsOptions;
  children?: Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This> | (Builder<SubscriptExpression | MemberExpression | CallExpression | InstantiationExpression | Identifier | This>)[];
}

export namespace type_query {
  export function from(options: TypeQueryOptions): TypeQueryBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new TypeQueryBuilder(..._arr);
    if (options.object !== undefined) b.object(options.object);
    if (options.index !== undefined) b.index(options.index);
    if (options.property !== undefined) b.property(options.property);
    if (options.function !== undefined) b.function(options.function);
    if (options.arguments !== undefined) {
      const _v = options.arguments;
      b.arguments(_v instanceof Builder ? _v : arguments_.from(_v as ArgumentsOptions));
    }
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v as TypeArgumentsOptions));
    }
    return b;
  }
}
