import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldInitializer } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FieldInitializerBuilder extends BaseBuilder<FieldInitializer> {
  private _field: Child;
  private _value!: Child;
  private _children: Child[] = [];

  constructor(field: Child) {
    super();
    this._field = field;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  children(value: Child[]): this {
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

export function field_initializer(field: Child): FieldInitializerBuilder {
  return new FieldInitializerBuilder(field);
}
