import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExtendsClause, TypeArguments } from '../types.js';


class ExtendsClauseBuilder extends Builder<ExtendsClause> {
  private _typeArguments: Builder<TypeArguments>[] = [];
  private _value: Builder<Expression>[] = [];

  constructor(...value: Builder<Expression>[]) {
    super();
    this._value = value;
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
      typeArguments: this._typeArguments.map(c => c.build(ctx)),
      value: this._value.map(c => c.build(ctx)),
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

export function extends_clause(...value: Builder<Expression>[]): ExtendsClauseBuilder {
  return new ExtendsClauseBuilder(...value);
}

export interface ExtendsClauseOptions {
  typeArguments?: Builder<TypeArguments> | (Builder<TypeArguments>)[];
  value: Builder<Expression> | (Builder<Expression>)[];
}

export namespace extends_clause {
  export function from(options: ExtendsClauseOptions): ExtendsClauseBuilder {
    const _ctor = options.value;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new ExtendsClauseBuilder(..._arr);
    if (options.typeArguments !== undefined) {
      const _v = options.typeArguments;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.typeArguments(..._arr);
    }
    return b;
  }
}
