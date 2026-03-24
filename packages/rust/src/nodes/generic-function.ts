import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldExpression, GenericFunction, Identifier, ScopedIdentifier, TypeArguments } from '../types.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { field_expression } from './field-expression.js';
import type { FieldExpressionOptions } from './field-expression.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class GenericFunctionBuilder extends Builder<GenericFunction> {
  private _function: Builder<Identifier | ScopedIdentifier | FieldExpression>;
  private _typeArguments!: Builder<TypeArguments>;

  constructor(function_: Builder<Identifier | ScopedIdentifier | FieldExpression>) {
    super();
    this._function = function_;
  }

  typeArguments(value: Builder<TypeArguments>): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._function) parts.push(this.renderChild(this._function, ctx));
    parts.push('::');
    if (this._typeArguments) parts.push(this.renderChild(this._typeArguments, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericFunction {
    return {
      kind: 'generic_function',
      function: this._function.build(ctx),
      typeArguments: this._typeArguments ? this._typeArguments.build(ctx) : undefined,
    } as GenericFunction;
  }

  override get nodeKind(): 'generic_function' { return 'generic_function'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._function) parts.push({ kind: 'builder', builder: this._function, fieldName: 'function' });
    parts.push({ kind: 'token', text: '::', type: '::' });
    if (this._typeArguments) parts.push({ kind: 'builder', builder: this._typeArguments, fieldName: 'typeArguments' });
    return parts;
  }
}

export type { GenericFunctionBuilder };

export function generic_function(function_: Builder<Identifier | ScopedIdentifier | FieldExpression>): GenericFunctionBuilder {
  return new GenericFunctionBuilder(function_);
}

export interface GenericFunctionOptions {
  nodeKind: 'generic_function';
  function: Builder<Identifier | ScopedIdentifier | FieldExpression> | string | ScopedIdentifierOptions | FieldExpressionOptions;
  typeArguments: Builder<TypeArguments> | Omit<TypeArgumentsOptions, 'nodeKind'>;
}

export namespace generic_function {
  export function from(options: Omit<GenericFunctionOptions, 'nodeKind'>): GenericFunctionBuilder {
    const _raw = options.function;
    let _ctor: Builder<Identifier | ScopedIdentifier | FieldExpression>;
    if (typeof _raw === 'string') {
      _ctor = new LeafBuilder('identifier', _raw);
    } else if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'scoped_identifier': _ctor = scoped_identifier.from(_raw); break;
        case 'field_expression': _ctor = field_expression.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new GenericFunctionBuilder(_ctor);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      b.typeArguments(_v instanceof Builder ? _v : type_arguments.from(_v));
    }
    return b;
  }
}
