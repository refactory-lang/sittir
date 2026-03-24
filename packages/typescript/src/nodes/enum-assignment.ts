import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, EnumAssignment, Expression, Number, PrivatePropertyIdentifier, PropertyIdentifier, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { computed_property_name } from './computed-property-name.js';
import type { ComputedPropertyNameOptions } from './computed-property-name.js';


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
      value: this._value ? this._value.build(ctx) : undefined,
    } as EnumAssignment;
  }

  override get nodeKind(): 'enum_assignment' { return 'enum_assignment'; }

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
  nodeKind: 'enum_assignment';
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName> | StringOptions | ComputedPropertyNameOptions;
  value: Builder<Expression>;
}

export namespace enum_assignment {
  export function from(options: Omit<EnumAssignmentOptions, 'nodeKind'>): EnumAssignmentBuilder {
    const _raw = options.name;
    let _ctor: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'string': _ctor = string.from(_raw); break;
        case 'computed_property_name': _ctor = computed_property_name.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new EnumAssignmentBuilder(_ctor);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
