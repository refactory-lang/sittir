import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NestedTypeIdentifier } from '../types.js';


class NestedTypeIdentifierBuilder extends BaseBuilder<NestedTypeIdentifier> {
  private _module!: BaseBuilder;
  private _name: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  module(value: BaseBuilder): this {
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
      module: this._module ? this.renderChild(this._module, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
    } as unknown as NestedTypeIdentifier;
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

export function nested_type_identifier(name: BaseBuilder): NestedTypeIdentifierBuilder {
  return new NestedTypeIdentifierBuilder(name);
}
