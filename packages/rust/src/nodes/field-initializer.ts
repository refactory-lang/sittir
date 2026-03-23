import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Expression, FieldIdentifier, FieldInitializer, IntegerLiteral } from '../types.js';


class FieldInitializerBuilder extends Builder<FieldInitializer> {
  private _field: Builder;
  private _value!: Builder;
  private _children: Builder[] = [];

  constructor(field: Builder) {
    super();
    this._field = field;
  }

  value(value: Builder): this {
    this._value = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._field) parts.push(this.renderChild(this._field, ctx));
    parts.push(':');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldInitializer {
    return {
      kind: 'field_initializer',
      field: this.renderChild(this._field, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FieldInitializer;
  }

  override get nodeKind(): string { return 'field_initializer'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._field) parts.push({ kind: 'builder', builder: this._field, fieldName: 'field' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { FieldInitializerBuilder };

export function field_initializer(field: Builder): FieldInitializerBuilder {
  return new FieldInitializerBuilder(field);
}

export interface FieldInitializerOptions {
  field: Builder<FieldIdentifier | IntegerLiteral>;
  value: Builder<Expression>;
  children?: Builder<AttributeItem> | (Builder<AttributeItem>)[];
}

export namespace field_initializer {
  export function from(options: FieldInitializerOptions): FieldInitializerBuilder {
    const b = new FieldInitializerBuilder(options.field);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
