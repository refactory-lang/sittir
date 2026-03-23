import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeAliasDeclaration } from '../types.js';


class TypeAliasBuilder extends BaseBuilder<TypeAliasDeclaration> {
  private _name: BaseBuilder;
  private _typeParameters?: BaseBuilder;
  private _value!: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  typeParameters(value: BaseBuilder): this {
    this._typeParameters = value;
    return this;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('type');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    parts.push('=');
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
    parts.push({ kind: 'token', text: 'type', type: 'type' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export function type_alias(name: BaseBuilder): TypeAliasBuilder {
  return new TypeAliasBuilder(name);
}
