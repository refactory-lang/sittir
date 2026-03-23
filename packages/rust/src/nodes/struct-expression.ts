import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldInitializerList, GenericTypeWithTurbofish, ScopedTypeIdentifier, StructExpression, TypeIdentifier } from '../types.js';


class StructExpressionBuilder extends Builder<StructExpression> {
  private _body!: Builder<FieldInitializerList>;
  private _name: Builder<GenericTypeWithTurbofish | ScopedTypeIdentifier | TypeIdentifier>;

  constructor(name: Builder<GenericTypeWithTurbofish | ScopedTypeIdentifier | TypeIdentifier>) {
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
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
    } as StructExpression;
  }

  override get nodeKind(): string { return 'struct_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { StructExpressionBuilder };

export function struct_expression(name: Builder<GenericTypeWithTurbofish | ScopedTypeIdentifier | TypeIdentifier>): StructExpressionBuilder {
  return new StructExpressionBuilder(name);
}

export interface StructExpressionOptions {
  body: Builder<FieldInitializerList>;
  name: Builder<GenericTypeWithTurbofish | ScopedTypeIdentifier | TypeIdentifier>;
}

export namespace struct_expression {
  export function from(options: StructExpressionOptions): StructExpressionBuilder {
    const b = new StructExpressionBuilder(options.name);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
