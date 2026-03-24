import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldInitializerList, GenericTypeWithTurbofish, ScopedTypeIdentifier, StructExpression, TypeIdentifier } from '../types.js';
import { scoped_type_identifier } from './scoped-type-identifier.js';
import type { ScopedTypeIdentifierOptions } from './scoped-type-identifier.js';
import { generic_type_with_turbofish } from './generic-type-with-turbofish.js';
import type { GenericTypeWithTurbofishOptions } from './generic-type-with-turbofish.js';
import { field_initializer_list } from './field-initializer-list.js';
import type { FieldInitializerListOptions } from './field-initializer-list.js';


class StructExpressionBuilder extends Builder<StructExpression> {
  private _name: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericTypeWithTurbofish>;
  private _body!: Builder<FieldInitializerList>;

  constructor(name: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericTypeWithTurbofish>) {
    super();
    this._name = name;
  }

  body(value: Builder<FieldInitializerList>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StructExpression {
    return {
      kind: 'struct_expression',
      name: this._name.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
    } as StructExpression;
  }

  override get nodeKind(): 'struct_expression' { return 'struct_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { StructExpressionBuilder };

export function struct_expression(name: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericTypeWithTurbofish>): StructExpressionBuilder {
  return new StructExpressionBuilder(name);
}

export interface StructExpressionOptions {
  nodeKind: 'struct_expression';
  name: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericTypeWithTurbofish> | string | ScopedTypeIdentifierOptions | GenericTypeWithTurbofishOptions;
  body: Builder<FieldInitializerList> | Omit<FieldInitializerListOptions, 'nodeKind'>;
}

export namespace struct_expression {
  export function from(options: Omit<StructExpressionOptions, 'nodeKind'>): StructExpressionBuilder {
    const _raw = options.name;
    let _ctor: Builder<TypeIdentifier | ScopedTypeIdentifier | GenericTypeWithTurbofish>;
    if (typeof _raw === 'string') {
      _ctor = new LeafBuilder('type_identifier', _raw);
    } else if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'scoped_type_identifier': _ctor = scoped_type_identifier.from(_raw); break;
        case 'generic_type_with_turbofish': _ctor = generic_type_with_turbofish.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new StructExpressionBuilder(_ctor);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : field_initializer_list.from(_v));
    }
    return b;
  }
}
