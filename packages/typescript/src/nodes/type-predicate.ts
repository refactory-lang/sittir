import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, This, TypePredicate } from '../types.js';


class TypePredicateBuilder extends Builder<TypePredicate> {
  private _name: Builder;
  private _type!: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('is');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypePredicate {
    return {
      kind: 'type_predicate',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
    } as unknown as TypePredicate;
  }

  override get nodeKind(): string { return 'type_predicate'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: 'is', type: 'is' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TypePredicateBuilder };

export function type_predicate(name: Builder): TypePredicateBuilder {
  return new TypePredicateBuilder(name);
}

export interface TypePredicateOptions {
  name: Builder<Identifier | This>;
  type: Builder;
}

export namespace type_predicate {
  export function from(options: TypePredicateOptions): TypePredicateBuilder {
    const b = new TypePredicateBuilder(options.name);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
