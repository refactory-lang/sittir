import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NestedIdentifier, NestedTypeIdentifier, TypeIdentifier } from '../types.js';


class NestedTypeIdentifierBuilder extends Builder<NestedTypeIdentifier> {
  private _module!: Builder<Identifier | NestedIdentifier>;
  private _name: Builder<TypeIdentifier>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  module(value: Builder<Identifier | NestedIdentifier>): this {
    this._module = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._module) parts.push(this.renderChild(this._module, ctx));
    parts.push('.');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NestedTypeIdentifier {
    return {
      kind: 'nested_type_identifier',
      module: this._module?.build(ctx),
      name: this._name.build(ctx),
    } as NestedTypeIdentifier;
  }

  override get nodeKind(): string { return 'nested_type_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._module) parts.push({ kind: 'builder', builder: this._module, fieldName: 'module' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export type { NestedTypeIdentifierBuilder };

export function nested_type_identifier(name: Builder<TypeIdentifier>): NestedTypeIdentifierBuilder {
  return new NestedTypeIdentifierBuilder(name);
}

export interface NestedTypeIdentifierOptions {
  module: Builder<Identifier | NestedIdentifier>;
  name: Builder<TypeIdentifier> | string;
}

export namespace nested_type_identifier {
  export function from(options: NestedTypeIdentifierOptions): NestedTypeIdentifierBuilder {
    const _ctor = options.name;
    const b = new NestedTypeIdentifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.module !== undefined) b.module(options.module);
    return b;
  }
}
