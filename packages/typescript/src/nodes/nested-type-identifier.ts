import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, NestedIdentifier, NestedTypeIdentifier, TypeIdentifier } from '../types.js';
import { nested_identifier } from './nested-identifier.js';
import type { NestedIdentifierOptions } from './nested-identifier.js';


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
      module: this._module ? this._module.build(ctx) : undefined,
      name: this._name.build(ctx),
    } as NestedTypeIdentifier;
  }

  override get nodeKind(): 'nested_type_identifier' { return 'nested_type_identifier'; }

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
  nodeKind: 'nested_type_identifier';
  module: Builder<Identifier | NestedIdentifier> | string | Omit<NestedIdentifierOptions, 'nodeKind'>;
  name: Builder<TypeIdentifier> | string;
}

export namespace nested_type_identifier {
  export function from(options: Omit<NestedTypeIdentifierOptions, 'nodeKind'>): NestedTypeIdentifierBuilder {
    const _ctor = options.name;
    const b = new NestedTypeIdentifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.module !== undefined) {
      const _v = options.module;
      b.module(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v instanceof Builder ? _v : nested_identifier.from(_v));
    }
    return b;
  }
}
