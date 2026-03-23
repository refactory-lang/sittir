import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeAliasDeclaration } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeAliasBuilder extends BaseBuilder<TypeAliasDeclaration> {
  private _name: Child;
  private _typeParameters?: Child;
  private _value!: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('type alias');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeAliasDeclaration {
    return {
      kind: 'type_alias_declaration',
      name: this.renderChild(this._name, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as TypeAliasDeclaration;
  }

  override get nodeKind(): string { return 'type_alias_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'type alias' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function type_alias(name: Child): TypeAliasBuilder {
  return new TypeAliasBuilder(name);
}
