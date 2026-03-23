import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, EnumAssignment, Expression, Number, PrivatePropertyIdentifier, PropertyIdentifier, String } from '../types.js';


class EnumAssignmentBuilder extends Builder<EnumAssignment> {
  private _name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _value!: Builder<Expression>;

  constructor(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._name = name;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('=');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumAssignment {
    return {
      kind: 'enum_assignment',
      name: this._name.build(ctx),
      value: this._value?.build(ctx),
    } as EnumAssignment;
  }

  override get nodeKind(): string { return 'enum_assignment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { EnumAssignmentBuilder };

export function enum_assignment(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): EnumAssignmentBuilder {
  return new EnumAssignmentBuilder(name);
}

export interface EnumAssignmentOptions {
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  value: Builder<Expression>;
}

export namespace enum_assignment {
  export function from(options: EnumAssignmentOptions): EnumAssignmentBuilder {
    const b = new EnumAssignmentBuilder(options.name);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
