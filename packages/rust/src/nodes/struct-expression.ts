import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldInitializerList, GenericTypeWithTurbofish, ScopedTypeIdentifier, StructExpression, TypeIdentifier } from '../types.js';


class StructBuilder extends Builder<StructExpression> {
  private _body!: Builder;
  private _name: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  body(value: Builder): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as StructExpression;
  }

  override get nodeKind(): string { return 'struct_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { StructBuilder };

export function struct_(name: Builder): StructBuilder {
  return new StructBuilder(name);
}

export interface StructExpressionOptions {
  body: Builder<FieldInitializerList>;
  name: Builder<GenericTypeWithTurbofish | ScopedTypeIdentifier | TypeIdentifier>;
}

export namespace struct_ {
  export function from(options: StructExpressionOptions): StructBuilder {
    const b = new StructBuilder(options.name);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
