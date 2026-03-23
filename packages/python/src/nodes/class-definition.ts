import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArgumentList, Block, ClassDefinition, Identifier, TypeParameter } from '../types.js';


class ClassDefinitionBuilder extends Builder<ClassDefinition> {
  private _body!: Builder<Block>;
  private _name: Builder<Identifier>;
  private _superclasses?: Builder<ArgumentList>;
  private _typeParameters?: Builder<TypeParameter>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  superclasses(value: Builder<ArgumentList>): this {
    this._superclasses = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameter>): this {
    this._typeParameters = value;
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
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      superclasses: this._superclasses?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
    } as ClassDefinition;
  }

  override get nodeKind(): string { return 'class_definition'; }

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
  body: Builder<Block>;
  name: Builder<Identifier> | string;
  superclasses?: Builder<ArgumentList>;
  typeParameters?: Builder<TypeParameter>;
}

export namespace class_definition {
  export function from(options: ClassDefinitionOptions): ClassDefinitionBuilder {
    const _ctor = options.name;
    const b = new ClassDefinitionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.superclasses !== undefined) b.superclasses(options.superclasses);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
