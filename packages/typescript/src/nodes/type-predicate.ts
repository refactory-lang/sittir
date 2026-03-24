import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { Identifier, This, Type, TypePredicate } from '../types.js';


class TypePredicateBuilder extends Builder<TypePredicate> {
  private _name: Builder<Identifier | This>;
  private _type!: Builder<Type>;

  constructor(name: Builder<Identifier | This>) {
    super();
    this._name = name;
  }

  type(value: Builder<Type>): this {
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
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
    } as TypePredicate;
  }

  override get nodeKind(): 'type_predicate' { return 'type_predicate'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: 'is', type: 'is' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { TypePredicateBuilder };

export function type_predicate(name: Builder<Identifier | This>): TypePredicateBuilder {
  return new TypePredicateBuilder(name);
}

export interface TypePredicateOptions {
  nodeKind: 'type_predicate';
  name: Builder<Identifier | This> | LeafOptions<'identifier'> | LeafOptions<'this'>;
  type: Builder<Type>;
}

export namespace type_predicate {
  export function from(options: Omit<TypePredicateOptions, 'nodeKind'>): TypePredicateBuilder {
    const _raw = options.name;
    let _ctor: Builder<Identifier | This>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'identifier': _ctor = new LeafBuilder('identifier', (_raw as LeafOptions).text!); break;
        case 'this': _ctor = new LeafBuilder('this', (_raw as LeafOptions).text ?? 'this'); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new TypePredicateBuilder(_ctor);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
