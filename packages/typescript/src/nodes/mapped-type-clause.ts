import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MappedTypeClause, Type, TypeIdentifier } from '../types.js';


class MappedTypeClauseBuilder extends Builder<MappedTypeClause> {
  private _name: Builder<TypeIdentifier>;
  private _type!: Builder<Type>;
  private _alias?: Builder<Type>;

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<Type>): this {
    this._type = value;
    return this;
  }

  alias(value: Builder<Type>): this {
    this._alias = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('in');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MappedTypeClause {
    return {
      kind: 'mapped_type_clause',
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
      alias: this._alias ? this._alias.build(ctx) : undefined,
    } as MappedTypeClause;
  }

  override get nodeKind(): 'mapped_type_clause' { return 'mapped_type_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: 'in', type: 'in' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    return parts;
  }
}

export type { MappedTypeClauseBuilder };

export function mapped_type_clause(name: Builder<TypeIdentifier>): MappedTypeClauseBuilder {
  return new MappedTypeClauseBuilder(name);
}

export interface MappedTypeClauseOptions {
  nodeKind: 'mapped_type_clause';
  name: Builder<TypeIdentifier> | string;
  type: Builder<Type>;
  alias?: Builder<Type>;
}

export namespace mapped_type_clause {
  export function from(options: Omit<MappedTypeClauseOptions, 'nodeKind'>): MappedTypeClauseBuilder {
    const _ctor = options.name;
    const b = new MappedTypeClauseBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.alias !== undefined) b.alias(options.alias);
    return b;
  }
}
