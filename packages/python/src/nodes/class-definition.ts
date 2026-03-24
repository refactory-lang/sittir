import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArgumentList, Block, ClassDefinition, Identifier, TypeParameter } from '../types.js';
import { type_parameter } from './type-parameter.js';
import type { TypeParameterOptions } from './type-parameter.js';
import { argument_list } from './argument-list.js';
import type { ArgumentListOptions } from './argument-list.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class ClassDefinitionBuilder extends Builder<ClassDefinition> {
  private _name: Builder<Identifier>;
  private _typeParameters?: Builder<TypeParameter>;
  private _superclasses?: Builder<ArgumentList>;
  private _body!: Builder<Block>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameter>): this {
    this._typeParameters = value;
    return this;
  }

  superclasses(value: Builder<ArgumentList>): this {
    this._superclasses = value;
    return this;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('class');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._superclasses) parts.push(this.renderChild(this._superclasses, ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassDefinition {
    return {
      kind: 'class_definition',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      superclasses: this._superclasses ? this._superclasses.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
    } as ClassDefinition;
  }

  override get nodeKind(): 'class_definition' { return 'class_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'class', type: 'class' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._superclasses) parts.push({ kind: 'builder', builder: this._superclasses, fieldName: 'superclasses' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ClassDefinitionBuilder };

export function class_definition(name: Builder<Identifier>): ClassDefinitionBuilder {
  return new ClassDefinitionBuilder(name);
}

export interface ClassDefinitionOptions {
  nodeKind: 'class_definition';
  name: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameter> | Omit<TypeParameterOptions, 'nodeKind'>;
  superclasses?: Builder<ArgumentList> | Omit<ArgumentListOptions, 'nodeKind'>;
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
}

export namespace class_definition {
  export function from(options: Omit<ClassDefinitionOptions, 'nodeKind'>): ClassDefinitionBuilder {
    const _ctor = options.name;
    const b = new ClassDefinitionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameter.from(_v));
    }
    if (options.superclasses !== undefined) {
      const _v = options.superclasses;
      b.superclasses(_v instanceof Builder ? _v : argument_list.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    return b;
  }
}
