import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeAliasDeclaration, TypeIdentifier, TypeParameters } from '../types.js';


class TypeAliasBuilder extends Builder<TypeAliasDeclaration> {
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _value!: Builder;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  value(value: Builder): this {
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
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      value: this._value?.build(ctx),
    } as TypeAliasDeclaration;
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

export type { TypeAliasBuilder };

export function type_alias(name: Builder<TypeIdentifier>): TypeAliasBuilder {
  return new TypeAliasBuilder(name);
}

export interface TypeAliasDeclarationOptions {
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters>;
  value: Builder;
}

export namespace type_alias {
  export function from(options: TypeAliasDeclarationOptions): TypeAliasBuilder {
    const _ctor = options.name;
    const b = new TypeAliasBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
