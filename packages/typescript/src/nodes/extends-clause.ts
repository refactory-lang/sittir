import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExtendsClause, TypeArguments } from '../types.js';
import { type_arguments } from './type-arguments.js';
import type { TypeArgumentsOptions } from './type-arguments.js';


class ExtendsClauseBuilder extends Builder<ExtendsClause> {
  private _value: Builder<Expression>[] = [];
  private _typeArguments: Builder<TypeArguments>[] = [];

  constructor() { super(); }

  value(...value: Builder<Expression>[]): this {
    this._value = value;
    return this;
  }

  typeArguments(...value: Builder<TypeArguments>[]): this {
    this._typeArguments = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extends');
    if (this._value.length > 0) parts.push(this.renderChildren(this._value, ', ', ctx));
    if (this._typeArguments.length > 0) parts.push(this.renderChildren(this._typeArguments, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExtendsClause {
    return {
      kind: 'extends_clause',
      value: this._value.map(c => c.build(ctx)),
      typeArguments: this._typeArguments.map(c => c.build(ctx)),
    } as ExtendsClause;
  }

  override get nodeKind(): string { return 'extends_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extends', type: 'extends' });
    for (const child of this._value) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'value' });
    }
    for (const child of this._typeArguments) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'typeArguments' });
    }
    return parts;
  }
}

export type { ExtendsClauseBuilder };

export function extends_clause(): ExtendsClauseBuilder {
  return new ExtendsClauseBuilder();
}

export interface ExtendsClauseOptions {
  value?: Builder<Expression> | (Builder<Expression>)[];
  typeArguments?: Builder<TypeArguments> | TypeArgumentsOptions | (Builder<TypeArguments> | TypeArgumentsOptions)[];
}

export namespace extends_clause {
  export function from(options: ExtendsClauseOptions): ExtendsClauseBuilder {
    const b = new ExtendsClauseBuilder();
    if (options.value !== undefined) {
      const _v = options.value;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.value(..._arr);
    }
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.typeArguments(..._arr.map(_v => _v instanceof Builder ? _v : type_arguments.from(_v as TypeArgumentsOptions)));
    }
    return b;
  }
}
