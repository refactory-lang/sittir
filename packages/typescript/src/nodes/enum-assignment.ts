import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumAssignment } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class EnumAssignmentBuilder extends BaseBuilder<EnumAssignment> {
  private _name: Child;
  private _value!: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  value(value: Child): this {
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
      name: this.renderChild(this._name, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as EnumAssignment;
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

export function enum_assignment(name: Child): EnumAssignmentBuilder {
  return new EnumAssignmentBuilder(name);
}
